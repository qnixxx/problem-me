"""Validate and package the static, read-only Problem.me v2 site.
No application frameworks, browser databases, cookies, trackers or editable workspaces.
The v1.0.2 interactive implementation is preserved on the archive branch.
"""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json, hashlib, re, sys, zipfile
ROOT=Path(__file__).resolve().parent
VERSION='2.0.0'
class Page(HTMLParser):
    def __init__(self, source):
        super().__init__();self.ids=set();self.links=[];self.scripts=[];self.inputs=[];self.source=source
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if 'id' in attrs:
            assert attrs['id'] not in self.ids,f"{self.source}: duplicate id {attrs['id']}"
            self.ids.add(attrs['id'])
        for key in ('href','src'):
            if key in attrs:self.links.append(attrs[key])
        if tag in ('form','input','textarea','select'):self.inputs.append(tag)
        if tag=='script':self.scripts.append(attrs.get('src'))
        assert not any(k.startswith('on') for k in attrs),f"{self.source}: inline event handler"
files=sorted(p for p in ROOT.iterdir() if p.is_file() and p.suffix in ('.html','.css','.js','.ico','.jpg','.jpeg','.png','.svg','.webp'))
files+=sorted((ROOT/'articles').glob('*.html'))
files+=sorted((ROOT/'runtime').glob('*.js'))
files+=sorted(p for p in (ROOT/'assets').rglob('*') if p.is_file())
relative={p.relative_to(ROOT).as_posix() for p in files}
pages={}
for p in files:
    if p.suffix!='.html':continue
    source=p.read_text(encoding='utf-8')
    page=Page(p.relative_to(ROOT));page.feed(source);pages[p]=page
    assert not page.inputs,f'{p}: unexpected visitor input {page.inputs}'
    assert "script-src 'self'" in source and "connect-src 'none'" in source, f'{p}: CSP missing'
    assert all(src is not None and not src.startswith('http') for src in page.scripts),f'{p}: inline or external script'
assert (ROOT/'index.html').read_text().find('name="application-version" content="'+VERSION+'"')>=0
assert not any(p.exists() for p in [ROOT/'investigation.js',ROOT/'handoff.js',ROOT/'private-default.js',ROOT/'investigation-store.js'])
assert not (ROOT/'next').exists() and not (ROOT/'bureau').exists(),'Preview directories must not be deployed'
assert [p.name for p in (ROOT/'runtime').glob('*.js')]==['index-1.js'],'Unexpected interactive runtime'
links=0
for p in files:
    refs=list(pages[p].links) if p in pages else []
    if p.suffix=='.css':
        refs+=re.findall(r"url\([\'\"]?([^\)\'\"]+)",p.read_text(encoding='utf-8'))
    for ref in refs:
        url=urlsplit(ref)
        if url.scheme or url.netloc or ref.startswith('data:'):continue
        target=(ROOT/unquote(url.path).lstrip('/') if url.path.startswith('/') else p.parent/unquote(url.path)).resolve() if url.path else p
        assert target.is_file(),f"{p.relative_to(ROOT)}: broken ref {ref}"
        assert target.relative_to(ROOT).as_posix() in relative,f'{p.name}: omitted asset {ref}'
        if url.fragment and target in pages:
            assert unquote(url.fragment) in pages[target].ids,f'{p.relative_to(ROOT)}: missing anchor {ref}'
        links+=1
print(f'PASS v{VERSION} static pages={len(pages)}; files={len(files)}; local references={links}; zero editable controls')
if '--check' not in sys.argv:
    archive=ROOT.parent/f'problem-me-v{VERSION}-readonly.zip'
    with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
        for p in files:z.write(p,p.relative_to(ROOT))
    with zipfile.ZipFile(archive) as z:
        assert z.testzip() is None
        assert set(z.namelist())==relative
    print(f'PASS {archive.name} sha256={hashlib.sha256(archive.read_bytes()).hexdigest()}')
