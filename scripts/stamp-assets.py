#!/usr/bin/env python3
"""Stamp local .css/.js references and social card images in every *.html with a content hash (?v=…).

    python3 stamp-assets.py [SITE_DIR]

Static hosts without a build step serve new HTML with old cached CSS, so a page
renders markup its stylesheet has never seen; social networks cache og:image
by URL, so a redrawn card never shows. Run after any CSS, JS or card change;
the hash only moves when the file does.

Handles relative (stage.css), root-absolute (/stage.css) and, for og:image and
twitter:image, absolute URLs on the site's own host (from CNAME, canonical or
og:url). Pages in subfolders resolve relative paths from their own folder.
"""
import hashlib
import pathlib
import re
import sys
from urllib.parse import urlsplit

root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
asset = re.compile(r'(href|src)="(/?)([^":?#/][^":?#]*\.(?:css|js))(?:\?v=[0-9a-f]+)?"')
meta = re.compile(r"<meta\b[^>]*>", re.I)
card = re.compile(r'''\b(?:property|name)\s*=\s*["'](?:og:image(?::secure_url|:url)?|twitter:image(?::src)?)["']''', re.I)
content = re.compile(r'''(\bcontent\s*=\s*)(["'])(.*?)\2''', re.I | re.S)
canonical = re.compile(r'''<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']|<meta\b[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["']''', re.I)
digests = {}


def digest(path):
    key = str(path)
    if key not in digests:
        digests[key] = hashlib.sha256(path.read_bytes()).hexdigest()[:10] if path.is_file() else None
    return digests[key]


def local(page, ref):
    target = (root / ref.lstrip("/")) if ref.startswith("/") else (page.parent / ref)
    target = target.resolve()
    return target if target == root or root in target.parents else None


def hosts_for(text):
    found = set()
    cname = root / "CNAME"
    if cname.is_file():
        found.update(h.strip().lower() for h in cname.read_text().split() if h.strip())
    for m in canonical.finditer(text):
        host = urlsplit(m.group(1) or m.group(2)).hostname
        if host:
            found.add(host.lower())
    return found


def pages():
    for page in sorted(root.rglob("*.html")):
        parts = page.relative_to(root).parts
        if any(p.startswith(".") or p == "node_modules" for p in parts):
            continue
        yield page


changed = []
for page in pages():
    text = page.read_text()
    hosts = hosts_for(text)

    def stamp_asset(m):
        path = local(page, m.group(2) + m.group(3))
        d = digest(path) if path else None
        return f'{m.group(1)}="{m.group(2)}{m.group(3)}?v={d}"' if d else m.group(0)

    def stamp_card(tag):
        whole = tag.group(0)
        if not card.search(whole):
            return whole
        c = content.search(whole)
        if not c:
            return whole
        url = c.group(3)
        parts = urlsplit(url)
        if parts.query and not re.fullmatch(r"v=[0-9a-f]+", parts.query):
            return whole
        if parts.scheme in ("http", "https"):
            if (parts.hostname or "").lower() not in hosts:
                return whole
            ref = parts.path or "/"
            if not ref.startswith("/"):
                ref = "/" + ref
        elif parts.scheme or parts.netloc or not parts.path:
            return whole
        else:
            ref = parts.path
        path = local(page, ref)
        d = digest(path) if path else None
        if not d:
            return whole
        bare = url.split("?", 1)[0].split("#", 1)[0]
        return whole[:c.start(3)] + f"{bare}?v={d}" + whole[c.end(3):]

    stamped = meta.sub(stamp_card, asset.sub(stamp_asset, text))
    if stamped != text:
        page.write_text(stamped)
        changed.append(str(page.relative_to(root)))

for name, d in sorted(digests.items()):
    shown = pathlib.Path(name)
    shown = shown.relative_to(root) if root in shown.parents else shown
    print(f"{shown} -> {'v=' + d if d else 'missing, left as is'}")
print("stamped:", ", ".join(changed) if changed else "nothing (already current)")
