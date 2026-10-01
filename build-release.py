"""Validate static routes/assets and assemble the runtime-only deployment ZIP.
Run with Python 3. No runtime dependencies or site build step are introduced.
"""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import hashlib, json, re, sys, zipfile

ROOT = Path(__file__).resolve().parent
class Page(HTMLParser):
    def __init__(self, file):
        super().__init__(); self.ids = set(); self.links = []; self.file = file
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            assert attrs['id'] not in self.ids, f'{self.file}: duplicate ID {attrs["id"]}'
            self.ids.add(attrs['id'])
        for key in ('href', 'src'):
            if key in attrs: self.links.append(attrs[key])

files = sorted(p for p in ROOT.glob('*') if p.suffix in ('.html', '.css', '.js', '.ico'))
files += sorted((ROOT/'articles').glob('*.html'))
relative = {p.relative_to(ROOT).as_posix() for p in files}
pages = {}
for p in files:
    if p.suffix == '.html':
        page = Page(p.name); page.feed(p.read_text()); pages[p] = page
links = 0
for p in files:
    refs = pages[p].links if p in pages else []
    if p.suffix == '.css': refs += re.findall(r'url\([\'"]?([^\)\'"]+)', p.read_text())
    for ref in refs:
        url = urlsplit(ref)
        if url.scheme or url.netloc: continue
        target = (ROOT/url.path.lstrip('/') if url.path.startswith('/') else p.parent/unquote(url.path)).resolve() if url.path else p
        assert target.is_file(), f'{p.name}: missing {ref}'
        assert target.relative_to(ROOT).as_posix() in relative, f'{p.name}: asset omitted {ref}'
        if url.fragment and target in pages:
            assert unquote(url.fragment) in pages[target].ids, f'{p.name}: missing anchor {ref}'
        links += 1
version = re.search(r'name="application-version" content="([^"]+)"', (ROOT/'index.html').read_text())[1]
assert version == '1.0.0'
assert f"appVersion:'{version}'" in (ROOT/'investigation-model.js').read_text()
print(f'PASS {len(pages)} HTML pages: unique IDs and {links} local references/anchors; {len(files)} runtime files complete')
if '--check' not in sys.argv:
    output = ROOT.parent/f'problem-me-v{version}-runtime.zip'
    with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as z:
        for p in files: z.write(p, p.relative_to(ROOT))
    with zipfile.ZipFile(output) as z:
        assert z.testzip() is None
        assert set(z.namelist()) == relative
        for p in files: assert z.read(p.relative_to(ROOT).as_posix()) == p.read_bytes()
    print(f'PASS ZIP integrity and contents: {output}')
    print('SHA256', hashlib.sha256(output.read_bytes()).hexdigest())
