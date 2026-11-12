"""Validate and package the problem.me v1.0 educational website.
All published pages are static and use no visitor-input controls or application scripts.
"""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json, hashlib, re, sys, zipfile
ROOT=Path(__file__).resolve().parent
VERSION='1.0'
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
files += [ROOT/'robots.txt', ROOT/'sitemap.xml']
files+=sorted(p for p in (ROOT/'assets').rglob('*') if p.is_file())
relative={p.relative_to(ROOT).as_posix() for p in files}
pages={}
for p in files:
    if p.suffix!='.html':continue
    source=p.read_text(encoding='utf-8')
    page=Page(p.relative_to(ROOT));page.feed(source);pages[p]=page
    assert not page.inputs,f'{p}: unexpected visitor input {page.inputs}'
    assert '<button' not in source.lower(), f'{p}: buttons are disallowed in the published learning pages'
    assert "script-src 'none'" in source and "connect-src 'none'" in source, f'{p}: script-free CSP missing'
    assert not page.scripts,f'{p}: scripts are disallowed'
assert (ROOT/'index.html').read_text().find('name="application-version" content="'+VERSION+'"')>=0
assert not any(p.exists() for p in [ROOT/'investigation.js',ROOT/'handoff.js',ROOT/'private-default.js',ROOT/'investigation-store.js'])
assert not (ROOT/'next').exists() and not (ROOT/'bureau').exists(),'Preview directories must not be deployed'
assert not list(ROOT.glob('*.js')) and not (ROOT/'runtime').exists(), 'JavaScript runtime must not be published'
PUBLIC_PAGES={'index.html','techniques.html','5-whys.html','fishbone.html','pareto.html','kepner-tregoe.html',
 'academy.html','foundations.html','choose-method.html','professional-cases.html','practice.html','glossary.html',
 'evidence-lab.html','lab-signin.html','lab-warehouse.html','lab-migration.html','features.html','privacy.html','404.html'}
assert {p.name for p in ROOT.glob('*.html')} == PUBLIC_PAGES, 'Unexpected public HTML page or missing learning route'
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
    archive=ROOT.parent/f'problem-me-v{VERSION}.zip'
    with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
        for p in files:z.write(p,p.relative_to(ROOT))
    with zipfile.ZipFile(archive) as z:
        assert z.testzip() is None
        assert set(z.namelist())==relative
    print(f'PASS {archive.name} sha256={hashlib.sha256(archive.read_bytes()).hexdigest()}')
