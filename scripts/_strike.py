#!/usr/bin/env python3
# Dev helper: strike a batch's species from CATALOG_GAPS.md and re-sync all counts.
# Usage: python3 scripts/_strike.py <seed-name>   (e.g. gap-ferns)
import re, sys
seed = sys.argv[1]
added = set()
for line in open(f'scripts/seeds/{seed}.txt'):
    line = line.strip()
    if '|' in line:
        added.add(line.split('|')[0].strip())

t = open('CATALOG_GAPS.md').read()
kept = [ln for ln in t.split('\n')
        if not (re.match(r'- \[ \] (.+)$', ln) and ln[6:].strip() in added)]

# recompute ### header counts; drop emptied headers
out = []
for i, ln in enumerate(kept):
    if ln.startswith('### '):
        cnt = 0
        for nxt in kept[i+1:]:
            if nxt.startswith(('### ', '## ')):
                break
            if nxt.startswith('- [ ] '):
                cnt += 1
        if cnt == 0:
            continue
        ln = re.sub(r' · \d+$', f' · {cnt}', ln)
    out.append(ln)
t = '\n'.join(out)

# tier counts + table + total
cur = None; counts = {}
for ln in out:
    m = re.match(r'## (P\d)', ln)
    if m:
        cur = m.group(1); counts[cur] = 0
    elif ln.startswith('- [ ] ') and cur:
        counts[cur] += 1
for p, c in counts.items():
    t = re.sub(r'(\| ' + p + r' (?:— [^|]*)?\| )\d+( \|)', r'\g<1>' + str(c) + r'\2', t)
total = sum(counts.values())
t = re.sub(r'\*\*\d+\*\* species', f'**{total}** species', t)
open('CATALOG_GAPS.md', 'w').write(t)
print(f'struck {len(added)} -> tiers {counts} total {total}')
