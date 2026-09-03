// The house's styling, read from its single source instead of retyped: the
// paper tokens, the night token set, and the five ProveML states, lifted out
// of abovebeyond's globals.css at build time. Retyped hex values drift the
// moment the site moves; a read never does. The sha256 of the file read is
// recorded so the page can say which globals.css it was built against.
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';

const FILE = process.env.HOUSE_CSS || homedir() + '/Projects/abovebeyond/src/styles/globals.css';

function block(css, selector) {
  // the first rule whose selector list is exactly `selector`; returns its body
  const re = new RegExp('(^|\\n)' + selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{([\\s\\S]*?)\\n\\}', 'm');
  const m = css.match(re);
  return m ? m[2] : null;
}
const declarations = (body) => body.split('\n').map((l) => l.trim()).filter((l) => /^--[\w-]+\s*:/.test(l)).join('');
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');

export function houseCss() {
  if (!existsSync(FILE)) return { css: '', source: null };
  const raw = readFileSync(FILE, 'utf8');
  const css = stripComments(raw);
  const root = block(css, ':root');
  const night = block(css, '.night-page');
  const i = raw.indexOf('/* De vijf staten');
  const j = raw.indexOf('.pml-oordeel', i);
  const states = i >= 0 && j > i ? stripComments(raw.slice(i, j)).trim() : '';
  const sha = createHash('sha256').update(raw).digest('hex');
  const out = [
    root ? `:root{${declarations(root)}}` : '',
    night ? `body[data-theme=night]{${declarations(night)}background:var(--night);color:var(--sky)}` : '',
    states,
  ].filter(Boolean).join('\n');
  return { css: out, source: { file: FILE.replace(homedir(), '~'), sha256: sha, root: !!root, night: !!night, states: !!states } };
}
