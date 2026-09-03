#!/usr/bin/env python3
"""Read the paper's dataset, benchmark and finance metadata straight from the
research repository and print it as the plain-text source the review page
binds to. One reader per source so each run is its own record.

usage: meta-sources.py <repo> dataset|benchmarks|finance
"""
import json
import sys

repo, which = sys.argv[1], sys.argv[2]


def walk(o, ents, fields):
    if isinstance(o, dict):
        for k, v in o.items():
            if isinstance(k, str) and ':' in k:
                ents.add(k.split('.')[0])
                if '.' in k:
                    fields.add(k.split('.', 1)[1])
            walk(v, ents, fields)
    elif isinstance(o, list):
        for v in o:
            walk(v, ents, fields)


if which == 'dataset':
    d = json.load(open(f'{repo}/data/mastery-layers-demo.json'))
    lines = [f"{k}: {json.dumps(v)}" for k, v in d['meta'].items()] + [f"offerings (counted): {len(d['offerings'])}"]
elif which == 'benchmarks':
    pe = json.load(open(f'{repo}/benchmarks/proveml-pilot-en.v1.json'))
    fi = json.load(open(f'{repo}/benchmarks/proveml-finance.v1.json'))
    sec = json.load(open(f'{repo}/data/sec-edgar-finance.json'))
    ents, fields = set(), set()
    walk(sec, ents, fields)
    lines = [f"education prompts: {len(pe['prompts'])}", f"finance prompts: {len(fi['prompts'])}",
             f"finance entities: {len(ents)}", f"finance fields: {len(fields)}",
             f"finance source: {fi.get('source')}", f"finance snapshot: {fi.get('snapshot')}"]
elif which == 'finance':
    sec = json.load(open(f'{repo}/data/sec-edgar-finance.json'))
    companies = sec['companies']
    skip = {'id', 'name', 'cik'}
    fields_of = lambda c: sorted(k for k in c if k not in skip and '._' not in k)
    fields = sorted(set().union(*[set(fields_of(c)) for c in companies]))
    lines = [f"companies: {len(companies)}", f"fields per company: {min(len(fields_of(c)) for c in companies)}",
             f"fields: {', '.join(fields)}"] + [f"{k}: {sec[k]}" for k in ('filed', 'source', 'note') if k in sec]
else:
    sys.exit(f'unknown source {which}')
print('\n'.join(lines))
