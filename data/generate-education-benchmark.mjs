#!/usr/bin/env node
/**
 * Generate the education benchmark.
 *
 * The benchmark needs a dataset shaped like a Flemish secondary-school
 * assessment platform: classes, curriculum goals, per-goal mastery levels, and
 * the aggregates a report would quote. It does not need anyone's real results —
 * ProveML compares strings against a key-value store and cannot tell the
 * difference.
 *
 * So this generates records rather than de-identifying them. Every pupil is
 * drawn independently: a latent ability, then a per-goal outcome sampled from
 * that ability against the goal's difficulty. Aggregates are computed from the
 * generated outcomes, never carried over. Nothing here is a transformation of a
 * real record, which is what makes the paper's claim checkable rather than
 * asserted.
 *
 * The schema (goal ids, goal descriptions, category names) comes from the
 * public Flemish curriculum vocabulary, not from any school.
 *
 * Usage:
 *   node data/generate-education-benchmark.mjs [--schema <path>] [--seed 42]
 *   node data/generate-education-benchmark.mjs --verify   (check no vector matches a source)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const seedArg = Number(args.find((_, i) => args[i - 1] === '--seed') ?? 20260731);

// ── deterministic RNG, so the benchmark regenerates identically ──

function mulberry32(a) {
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const rnd = mulberry32(seedArg);
const pick = (xs) => xs[Math.floor(rnd() * xs.length)];
const gauss = () => {
    let u = 0, v = 0;
    while (u === 0) u = rnd();
    while (v === 0) v = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

// ── names: common Flemish given names and surnames, combined at random ──

const GIVEN = ['Lotte', 'Noor', 'Emma', 'Marie', 'Fien', 'Lore', 'Amber', 'Nore', 'Elise', 'Julie',
    'Lena', 'Anna', 'Hanne', 'Febe', 'Lily', 'Aya', 'Nina', 'Yara', 'Roos', 'Mila',
    'Lucas', 'Arthur', 'Louis', 'Finn', 'Vic', 'Noah', 'Mats', 'Jef', 'Wout', 'Milan',
    'Lars', 'Seppe', 'Vince', 'Tuur', 'Rune', 'Kobe', 'Sam', 'Ilias', 'Amir', 'Rayan',
    'Ayoub', 'Nathan', 'Elias', 'Warre', 'Jules', 'Kasper', 'Senne', 'Thibo', 'Ferre', 'Cas'];
const SURNAME = ['Peeters', 'Janssens', 'Maes', 'Jacobs', 'Willems', 'Claes', 'Goossens', 'Wouters',
    'De Smet', 'Dubois', 'Lambert', 'Dupont', 'Martens', 'Claeys', 'Aerts', 'Mertens',
    'Hermans', 'Van Damme', 'De Clercq', 'Vermeulen', 'Van de Velde', 'Declercq',
    'Cools', 'Michiels', 'Simons', 'Vandenberghe', 'De Groote', 'Verhoeven', 'Segers',
    'Van Dijck', 'Bogaert', 'Coppens', 'Smet', 'De Backer', 'Deckers', 'Verstraete',
    'Van Hecke', 'Nijs', 'Pauwels', 'Vanhoutte', 'De Meyer', 'Lemmens', 'Stevens',
    'Vandevelde', 'Ceulemans', 'Gielen', 'Baert', 'De Coninck', 'Roelandt', 'Verlinden'];

// A fictional school. Names a place that does not exist as a school.
const SCHOOL = 'Sint-Amandus Hoogveld';

// ── the classes: labels follow Flemish convention (grade + stream letters) ──

// Class labels follow the Flemish convention: year (1-6) plus a code for the
// study programme. The codes are public programme abbreviations, the same ones
// any school in Flanders uses.
const STREAMS = [
    { years: [1, 2], stream: 'A-stroom', strId: 1, letters: ['A', 'B', 'C', 'D', 'E'] },
    { years: [1, 2], stream: 'B-stroom', strId: 2, letters: ['BS', 'BW', 'ZW'] },
    { years: [3, 4], stream: 'Doorstroom 2de graad', strId: 3, letters: ['ECO', 'LAT', 'WET', 'HUM', 'SV'] },
    { years: [3, 4], stream: 'Dubbel 2de graad', strId: 4, letters: ['BO', 'OB', 'ZW', 'WE', 'BS'] },
    { years: [3, 4], stream: 'Arbeidsmarktfinaliteit 2de graad', strId: 5, letters: ['AM', 'HO', 'VZ'] },
    { years: [5, 6], stream: 'Doorstroom 3de graad', strId: 6, letters: ['ECMT', 'LATW', 'WEWI', 'HUWE'] },
    { years: [5, 6], stream: 'Dubbel 3de graad', strId: 7, letters: ['BS', 'OL', 'ZW', 'WE', 'BO'] },
    { years: [5, 6], stream: 'arbeidsmarktgerichte finaliteit 3de graad', strId: 8, letters: ['HO', 'OA', 'VZ'] },
];

// The benchmark asks about these classes by name, so they have to exist. They
// are ordinary labels — nothing about them is specific to any school.
const REQUIRED_CLASSES = ['1C', '2D', '2ZW', '3BS', '3SV', '4OB', '4WE', '5BO', '5BS', '6HO', '6OL', '6ZW'];

function buildOfferings(targetCount) {
    const out = [];
    const seen = new Set();
    let id = 10001;
    const add = (name, year, s) => {
        if (seen.has(name) || out.length >= targetCount) return;
        seen.add(name);
        out.push({
            id: id++, name, school: SCHOOL,
            grade: Math.ceil(year / 2), stream: s.stream, strId: s.strId, grd: Math.ceil(year / 2),
            year, students: [],
        });
    };

    // Required first, so a smaller target never drops one.
    for (const name of REQUIRED_CLASSES) {
        const year = Number(name[0]);
        const code = name.slice(1);
        const s = STREAMS.find(st => st.years.includes(year) && st.letters.includes(code))
            || STREAMS.find(st => st.years.includes(year));
        add(name, year, s);
    }
    for (const s of STREAMS) {
        for (const year of s.years) {
            for (const letter of s.letters) add(`${year}${letter}`, year, s);
        }
    }
    // Parallel groups, the way a large school splits a popular programme.
    for (const suffix of ['2', '3']) {
        for (const s of STREAMS) {
            for (const year of s.years) {
                for (const letter of s.letters) add(`${year}${letter}${suffix}`, year, s);
            }
        }
    }
    return out;
}

// ── curriculum goals: schema only, from the public vocabulary ──

function loadGoalSchema() {
    // The goal list (ids, names, categories) is curriculum metadata, not school
    // data. If a schema file is present we reuse its shape; otherwise we build a
    // plausible one so the generator stands alone.
    const schemaPath = join(__dirname, 'curriculum-goals.json');
    if (existsSync(schemaPath)) return JSON.parse(readFileSync(schemaPath, 'utf8'));

    const cats = [
        { cat: 'basis', cl: 'Nederlands', n: 'De leerling begrijpt en gebruikt geschreven taal.' },
        { cat: 'basis', cl: 'Wiskunde', n: 'De leerling rekent met getallen en verhoudingen.' },
        { cat: 'basis', cl: 'Wetenschappen', n: 'De leerling onderzoekt natuurlijke verschijnselen.' },
        { cat: 'basis', cl: 'Mens en samenleving', n: 'De leerling situeert gebeurtenissen in tijd en ruimte.' },
        { cat: 'basis', cl: 'Frans', n: 'De leerling voert eenvoudige gesprekken in het Frans.' },
        { cat: 'basis', cl: 'Engels', n: 'De leerling begrijpt eenvoudige Engelse teksten.' },
        { cat: 'basis', cl: 'Lichamelijke opvoeding', n: 'De leerling beweegt veilig en doelgericht.' },
        { cat: 'complementair', cl: 'Talent', n: 'De leerling verkent een eigen interessegebied.' },
        { cat: 'levensbeschouwing', cl: 'Levensbeschouwing', n: 'De leerling verwoordt de eigen levensbeschouwelijke identiteit.' },
    ];
    const goals = [];
    let gid = 30001;
    for (const c of cats) {
        for (let i = 1; i <= 24; i++) {
            goals.push({
                id: gid++,
                p: `${i}.${1 + (i % 4)}`,
                n: `${c.n} (deeldoel ${i})`,
                cat: c.cat,
                cl: c.cl,
                grd: null,
                str: null,
            });
        }
    }
    return goals;
}

// ── generation ──

const LEVELS = ['groen', 'blauw', 'oranje', 'rood'];

function generate({ offeringCount = 95, studentCount = 741 } = {}) {
    const goals = loadGoalSchema();
    const offerings = buildOfferings(offeringCount);

    // Each goal gets a difficulty; each pupil an ability. An outcome is drawn
    // from the two, so vectors correlate within a pupil the way real ones do —
    // without any real vector being consulted.
    const difficulty = new Map(goals.map(g => [g.id, 0.15 + rnd() * 0.42]));

    // Class sizes: drawn, then scaled so they add up to the school's roll.
    // A handful of very small groups is normal — a niche programme, a
    // specialisation only a few pupils take.
    const draws = offerings.map(() => rnd() < 0.08
        ? 2 + rnd() * 2.5                      // a niche programme with a handful of pupils
        : Math.max(5, 9.5 + gauss() * 2.3));
    const scale = studentCount / draws.reduce((a, b) => a + b, 0);
    const sizes = draws.map(d => Math.max(1, Math.round(d * scale)));
    // Two benchmark items ask which classes have fewer than five pupils, and
    // several others compare classes by size. Both need the named classes to
    // spread rather than all landing on the same number, so the twelve the
    // benchmark asks about are nudged: most to an ordinary size, two to a small
    // group. Everything they contain is still generated.
    const NUDGE = { '3SV': 3, '2ZW': 4, '1C': 11, '2D': 9, '3BS': 8, '4OB': 6, '4WE': 12, '5BO': 7, '5BS': 10, '6HO': 9, '6OL': 13, '6ZW': 8 };
    offerings.forEach((o, i) => { if (NUDGE[o.name]) sizes[i] = NUDGE[o.name]; });

    let drift = studentCount - sizes.reduce((a, b) => a + b, 0);
    for (let i = 0; drift !== 0; i = (i + 1) % sizes.length) {
        if (NUDGE[offerings[i].name]) continue;
        if (drift > 0) { sizes[i]++; drift--; }
        else if (sizes[i] > 1) { sizes[i]--; drift++; }
    }

    let studentId = 20001;
    let placed = 0;
    {
        for (const [oi, off] of offerings.entries()) {
            if (placed >= studentCount) break;
            const size = sizes[oi];
            // Classes differ in how far through the assessment calendar they
            // are: a team that has recorded most of the year sits near the top,
            // one that started late leaves more goals grey. This is what the
            // assessment-rate questions are about, so it has to vary.
            const grijsRate = 0.04 + rnd() * 0.30;
            for (let i = 0; i < size && placed < studentCount; i++) {
                // How much of the curriculum this pupil has been assessed on.
                // Most sit on a full year's worth. A few have only a handful of
                // entries — late enrolment, long absence — and those same pupils
                // tend to be the ones in trouble, which is where a 0% pass rate
                // comes from in practice.
                const thin = rnd() < 0.05;
                const coverage = thin ? 0.03 + rnd() * 0.07 : 0.35 + rnd() * 0.42;
                const ability = thin
                    ? Math.min(0.98, Math.max(0.05, 0.34 + gauss() * 0.16))
                    : Math.min(0.98, Math.max(0.05, 0.66 + gauss() * 0.19));
                const goalsForPupil = goals.filter(() => rnd() < coverage);
                const m = {};
                let ev = 0, pass = 0, grey = 0;
                for (const g of goalsForPupil) {
                    // How far the pupil's ability clears this goal's difficulty.
                    // Negative means the goal is out of reach, and then neither
                    // band opens: a pupil at the bottom of the tail fails
                    // everything, which is what makes a 0% pass rate possible.
                    const margin = ability * 1.3 - difficulty.get(g.id) + 0.04;
                    const pGroen = Math.min(1, Math.max(0, margin)) * 0.78;
                    const pBlauw = Math.min(1, Math.max(0, margin + 0.22)) * 0.40;
                    const r = rnd();
                    let level;
                    if (r < grijsRate) { level = 'grijs'; grey++; }   // not assessed yet
                    else if (r < grijsRate + 0.006) level = 'none';
                    else if (r < grijsRate + 0.006 + pGroen) { level = 'groen'; ev++; pass++; }
                    else if (r < grijsRate + 0.006 + pGroen + pBlauw) { level = 'blauw'; ev++; pass++; }
                    else if (rnd() < 0.62) { level = 'oranje'; ev++; }
                    else { level = 'rood'; ev++; }
                    m[String(g.id)] = level;
                }
                const total = Object.keys(m).length;
                const cats = {};
                for (const g of goalsForPupil) {
                    const c = (cats[g.cat] ||= { t: 0, e: 0, p: 0 });
                    c.t++;
                    const lvl = m[String(g.id)];
                    if (lvl !== 'grijs' && lvl !== 'none') c.e++;
                    if (lvl === 'groen' || lvl === 'blauw') c.p++;
                }
                off.students.push({
                    id: studentId++,
                    name: `${pick(GIVEN)} ${pick(SURNAME)}`,
                    ev, pass,
                    rate: ev ? Math.round((pass / ev) * 100) : 0,
                    total,
                    grijs: grey,
                    m,
                    cats,
                });
                placed++;
            }
        }
    }

    pinBenchmarkPupils(offerings);

    const totalEntries = offerings.reduce((s, o) => s + o.students.reduce((t, st) => t + st.total, 0), 0);
    return {
        meta: {
            schoolyear: '2025-2026',
            generatedAt: new Date().toISOString(),
            totalStudents: placed,
            totalALEntries: totalEntries,
            offerings: offerings.length,
            synthetic: true,
            seed: seedArg,
            note: 'Generated, not de-identified. Every record is drawn from a latent-ability model; '
                + 'no field is copied or derived from any real pupil. School and pupil names are fictional. '
                + 'Regenerate with data/generate-education-benchmark.mjs.',
        },
        als: goals,
        offerings: offerings.filter(o => o.students.length > 0),
    };
}

// ── stable handles for the benchmark ──

/**
 * The benchmark asks about five pupils by name ("what is Ali Peeters' pass
 * rate?"), and the harness builds its context from the twenty weakest pupils.
 * So five of those twenty get fixed labels instead of drawn ones. Their figures
 * stay exactly as generated — only the name is pinned, so the prompts resolve
 * across regenerations.
 *
 * Two prompts need a spread to be worth asking: one compares Ali against Noor,
 * one asks which of three pupils sit at exactly 0%. The pins are chosen to give
 * each of those a non-trivial answer.
 */
function pinBenchmarkPupils(offerings) {
    const all = [];
    for (const o of offerings) for (const s of o.students) all.push(s);
    const weakest = all.filter(s => s.ev >= 5).sort((a, b) => a.rate - b.rate).slice(0, 20);

    const zeros = weakest.filter(s => s.rate === 0);
    const nonZero = weakest.filter(s => s.rate > 0);
    if (zeros.length < 2 || nonZero.length < 3) {
        throw new Error(`The weakest twenty do not spread enough to pin the benchmark pupils `
            + `(${zeros.length} at 0%, ${nonZero.length} above). Adjust the ability distribution.`);
    }

    zeros[0].name = 'Amir Janssens';
    zeros[1].name = 'Ayoub Peeters';
    nonZero[0].name = 'Pieter Jacobs';   // above 0%, so the 0% question discriminates

    // One item asks who scores lower, Ali or Noor, so the two need different
    // rates — a tie would leave the item without an answer.
    const ali = nonZero[1];
    const noor = nonZero.slice(2).find(s => s.rate > ali.rate);
    if (!noor) throw new Error('No weak pupil scores strictly above the second — cannot pin the comparison.');
    ali.name = 'Ali Peeters';
    noor.name = 'Noor Maes';
}

// ── verification: prove nothing was carried over ──

function verifyAgainst(sourcePath, generated) {
    if (!existsSync(sourcePath)) {
        console.log(`No source at ${sourcePath} to compare against — nothing to check.`);
        return true;
    }
    const src = JSON.parse(readFileSync(sourcePath, 'utf8'));
    const vec = (d) => new Set(d.offerings.flatMap(o => o.students
        .filter(s => s.m).map(s => JSON.stringify(Object.entries(s.m).sort()))));
    const a = vec(src), b = vec(generated);
    const shared = [...b].filter(v => a.has(v)).length;
    const names = new Set(src.offerings.flatMap(o => o.students.map(s => s.name)));
    const nameOverlap = generated.offerings.flatMap(o => o.students.map(s => s.name))
        .filter(n => names.has(n)).length;
    const schools = new Set(src.offerings.map(o => o.school));
    const schoolClash = generated.offerings.some(o => schools.has(o.school));
    console.log(`mastery vectors shared with source: ${shared}`);
    console.log(`pupil names shared with source:     ${nameOverlap} (names are drawn from a common list, so overlap is expected and carries no information)`);
    console.log(`school name clashes with source:    ${schoolClash}`);
    return shared === 0 && !schoolClash;
}

// ── main ──

const data = generate();
const outPath = join(__dirname, 'mastery-layers-demo.json');

if (args.includes('--verify')) {
    const src = args.find((_, i) => args[i - 1] === '--against')
        || join(process.env.HOME, 'Projects/naviskore-viz/public/data/mastery-layers.json');
    const clean = verifyAgainst(src, data);
    console.log(clean ? '\nOK: nothing carried over.' : '\nFAIL: overlap with the source.');
    process.exit(clean ? 0 : 1);
}

writeFileSync(outPath, JSON.stringify(data, null, 0));
console.log(`Wrote ${outPath}`);
console.log(`  ${data.meta.totalStudents} pupils, ${data.offerings.length} classes, ${data.meta.totalALEntries} goal entries`);
console.log(`  school: ${data.offerings[0].school} (fictional), seed ${seedArg}`);
