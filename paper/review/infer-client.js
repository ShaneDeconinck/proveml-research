// The inference pass, run by the page itself. Walks the paragraphs the
// deterministic pass left grey, in reading order, asks Claude (the viewer's
// account, one consent) what a careful reviewer would want confirmed, and
// turns each answer into readings the author judges. Results persist in the
// artifact database so a reload, or a second viewer, sees the same state.
// Everything the model returns is untrusted: a span counts only if it is a
// verbatim substring of the paragraph, and text is inserted as text.
(async () => {
  if (!window.claude || typeof window.claude.use !== 'function') return;
  const sample = await window.claude.use('sample');
  const db = await window.claude.use('db');
  if (!sample) return;

  const bar = document.querySelector('.rv-actions');
  const more = bar.querySelector('.rv-more');   // null now: appends at the end of the actions
  const btn = document.createElement('button'); btn.id = 'rv-scan'; btn.className = 'rv-link';
  const status = document.createElement('span'); status.id = 'rv-scan-status'; status.className = 'rv-note';
  bar.insertBefore(status, more); bar.insertBefore(btn, more);

  let running = false, stop = false, halted = false;
  const pendings = () => [...document.querySelectorAll('.pair[data-scan="pending"]')];
  const label = () => {
    const n = pendings().length;
    btn.textContent = running ? 'pause' : (n ? 'resume checking' : '');
    btn.hidden = halted || (!running && !n);
  };
  const sha = async (s) => {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('').slice(0, 16);
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const textOf = (pair) => pair.querySelector('.cols > .col:first-child').innerText.replace(/\s+/g, ' ').trim();
  const prompt = (t) => "You are a reviewer's assistant. Below is one paragraph of an academic paper. "
    + 'List every claim in it that a careful reviewer would want the author to confirm or source: characterisations of cited work, numbers, dates, comparisons, causal claims, absence claims, historical claims. '
    + 'Return ONLY a JSON array, no prose. Each item: {"span": an exact verbatim substring of the paragraph (short, the claim itself), "kind": one of citation|number|date|comparison|causal|absence|historical|other, "why": one short sentence on what could be wrong}. '
    + 'If nothing needs confirming return [].\n\nPARAGRAPH:\n' + t;

  const wrapSpan = (col, span, field, pairId) => {
    const walker = document.createTreeWalker(col, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const i = node.nodeValue.indexOf(span);
      if (i < 0) continue;
      if (node.parentElement.closest('.proveml-fact, code, .proveml-code, .lbl')) continue;
      const after = node.splitText(i); after.splitText(span.length);
      const el = document.createElement('span');
      el.className = 'proveml-fact proveml-inference'; el.dataset.judge = 'open'; el.dataset.path = pairId + '.' + field;
      el.textContent = span;
      after.parentNode.replaceChild(el, after);
      return true;
    }
    return false;
  };

  const render = async (pair, claims) => {
    const left = pair.querySelector('.cols > .col:first-child');
    const right = pair.querySelector('.cols > .col:nth-child(2)') || document.querySelector('.rv-panel .col[data-home="' + pair.id + '"]');
    const text = textOf(pair);
    let n = 0;
    for (const c of claims) {
      if (!c || typeof c.span !== 'string' || !c.span.trim() || !text.includes(c.span)) continue;
      const rid = await sha(pair.id + '\n' + c.span);   // newline: a span never contains one
      if (document.querySelector('.reading[data-review="' + rid + '"]')) continue;
      n++; const field = 'inf' + n;
      wrapSpan(left, c.span, field, pair.id);
      const ev = document.createElement('div'); ev.className = 'evidence'; ev.dataset.evidenceField = field;
      ev.innerHTML = '<p class="ev-head"><code>' + esc(c.kind || 'claim') + '</code> = <b>' + esc(c.span) + '</b></p>'
        + '<p class="basis basis-derived">proposed by the model, no source yet</p>'
        + '<p class="note">' + esc(c.why || '') + ' Do you stand behind this as written, or should it be sourced or softened?</p>'
        + '<div class="reading" data-review="' + rid + '" data-src="' + esc(pair.id) + '" data-field="' + field + '" data-span="' + esc(c.span) + '" data-kind="' + esc(c.kind || '') + '" data-why="' + esc(c.why || '') + '">'
        + '<span class="j">your inference</span><span class="q">do you stand behind this?</span>'
        + '<div class="review"><button class="rv" data-verdict="fair">yes</button><button class="rv" data-verdict="flag">no</button><span class="rv-state"></span></div></div>';
      if (right) right.appendChild(ev);
      readings.push(ev.querySelector('.reading'));
    }
    pair.dataset.scan = n ? 'checked' : 'clean';
    pair.title = n ? (n === 1 ? '1 reading needs you' : n + ' readings need you') : 'checked, nothing to confirm';
    paint();
    return n;
  };

  // earlier results, and anyone else's live ones
  if (db) {
    try {
      db.collection('infer').onSnapshot((qs) => {
        for (const d of qs.docs) {
          const pair = document.getElementById(d.id);
          const data = d.data();
          if (pair && data && pair.dataset.scan === 'pending') render(pair, data.claims || []);
        }
        label(); autostart();
      }, () => {});
    } catch {}
  }

  // adapter choices made on the provenance page go to the database, for the next build
  document.addEventListener('proveml:adapter-choice', async (e) => {
    if (!db || !e.detail) return;
    try { await db.doc('config/adapters/' + e.detail.role).set({ name: e.detail.name, state: e.detail.state, at: e.detail.at }); } catch {}
  });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const run = async () => {
    running = true; stop = false; label(); document.body.dataset.checking = '1';
    const list = pendings(); let done = 0;
    for (const pair of list) {
      if (stop) break;
      if (pair.dataset.scan !== 'pending') continue;
      pair.dataset.scan = 'checking'; status.textContent = 'reading paragraph ' + (++done) + ' of ' + list.length;
      let claims = null, tries = 0;
      while (claims === null && tries < 3 && !stop) {
        tries++;
        try {
          const out = await sample.json(prompt(textOf(pair)), { modelTier: 'quick', cache: true });
          claims = Array.isArray(out) ? out : (out && Array.isArray(out.claims) ? out.claims : []);
        } catch (e) {
          const code = e && e.code;
          if (code === 'rate_limited') { status.textContent = 'rate limited, waiting'; await wait(15000 * tries); continue; }
          if (code === 'invalid_json' || code === 'empty_completion') { if (tries >= 3) claims = []; continue; }
          if (['not_granted', 'sampling_disabled', 'capability_disabled', 'not_declared', 'session_expired', 'cancelled'].includes(code)) {
            stop = true; halted = code !== 'cancelled';
            status.textContent = code === 'cancelled' ? 'stopped'
              : code === 'session_expired' ? 'the model pass stopped: your session expired, reload to continue'
              : 'the model pass could not run: this page was not given permission to use Claude. Reload to be asked again.';
            break;
          }
          await wait(4000 * tries); if (tries >= 3) claims = [];
        }
      }
      if (claims === null) { pair.dataset.scan = 'pending'; break; }
      await render(pair, claims);
      if (db) {
        try { await db.doc('infer/' + pair.id).set({ state: pair.dataset.scan, claims: claims.filter((c) => c && typeof c.span === 'string').slice(0, 20), at: new Date().toISOString() }); } catch {}
      }
    }
    running = false; delete document.body.dataset.checking; if (!stop) status.textContent = ''; label();
  };
  // Start on its own once any earlier results have had a moment to arrive from the database.
  let started = false;
  const autostart = () => { if (started) return; started = true; if (!running && pendings().length) run(); };
  setTimeout(autostart, 1500);
  btn.addEventListener('click', () => { if (running) { stop = true; btn.textContent = 'stopping'; } else run(); });
  label();
})();
