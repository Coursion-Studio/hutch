#!/usr/bin/env python3
"""Stamp styles.css with a content hash in every page that links it.

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
css = root / "styles.css"
digest = hashlib.sha256(css.read_bytes()).hexdigest()[:10]

changed = []
for page in sorted(root.glob("*.html")):
    text = page.read_text()
    stamped = re.sub(r'href="styles\.css(?:\?v=[0-9a-f]+)?"',
                     f'href="styles.css?v={digest}"', text)
    if stamped != text:
        page.write_text(stamped)
        changed.append(page.name)

print(f"styles.css -> v={digest}")
print("stamped:", ", ".join(changed) if changed else "nothing (already current)")
sys.exit(0)
