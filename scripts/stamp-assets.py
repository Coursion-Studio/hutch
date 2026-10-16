#!/usr/bin/env python3
"""Stamp styles.css, site.css, home.css, site.js and home.js with a content hash in every page that links them.

Static host, no build step, so the stylesheet URL never changed and browsers
kept serving whatever they had. The failure mode is nasty because it is
*partial*: new HTML arrives (short cache) while old CSS is reused (long cache),
so the page renders with markup its stylesheet has never heard of — a drawn app
window collapses to a bare list of words, and a fix you shipped an hour ago is
simply absent.

Run after any CSS change; the hash only moves when the file does.

    python3 scripts/stamp-assets.py
"""
import hashlib
import pathlib
import re
import sys

root = pathlib.Path(__file__).resolve().parent.parent
assets = ["styles.css", "site.css", "home.css", "site.js", "home.js"]
digests = {a: hashlib.sha256((root / a).read_bytes()).hexdigest()[:10] for a in assets}

changed = []
for page in sorted(root.glob("*.html")):
    text = page.read_text()
    stamped = text
    for asset, digest in digests.items():
        stamped = re.sub(r'(href|src)="' + re.escape(asset) + r'(?:\?v=[0-9a-f]+)?"',
                         lambda m: f'{m.group(1)}="{asset}?v={digest}"', stamped)
    if stamped != text:
        page.write_text(stamped)
        changed.append(page.name)

for asset, digest in digests.items():
    print(f"{asset} -> v={digest}")
print("stamped:", ", ".join(changed) if changed else "nothing (already current)")
sys.exit(0)
