#!/usr/bin/env python3
"""Materialize CI-only dependencies; never produces a production release.

Rights-pending media/vendor files are absent from Git. Already published files
are read anonymously and verified by size and SHA-256. Unpublished decorative
assets use explicit synthetic fixtures in CI; private releases MUST overlay the
original assets and server settings and verify their original SHA-256 values.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path, PurePosixPath
import struct
import urllib.request
import urllib.parse
import zlib


def safe_target(root, name):
    parts=PurePosixPath(name).parts
    if not parts or name.startswith('/') or '\\' in name or any(p in ('.','..') for p in parts):
        raise ValueError('Unsafe dependency path')
    target=root.joinpath(*parts)
    if not target.resolve().is_relative_to(root.resolve()):raise ValueError('Dependency escapes root')
    if any(p.is_symlink() for p in [target,*target.parents] if p!=root.parent):raise ValueError('Symlink in dependency path')
    return target


def fixture_bytes(spec):
    w,h=spec['width'],spec['height']
    if not 0<w<=4096 or not 0<h<=4096:raise ValueError('Invalid fixture dimensions')
    if spec['format']=='svg':
        return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>CI fixture</title><rect width="{w}" height="{h}" fill="#eeeeee"/></svg>'.encode()
    def chunk(kind,data):return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data)&0xffffffff)
    pixels=(b'\0'+b'\xee\xee\xee'*w)*h
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(pixels))+chunk(b'IEND',b'')


def materialize(root,entry):
    target=safe_target(root,entry['path'])
    if entry.get('ci_fixture'):
        data=fixture_bytes(entry['ci_fixture'])
    elif target.exists() and hashlib.sha256(target.read_bytes()).hexdigest()==entry['sha256']:
        return
    else:
        url=urllib.parse.urlsplit(entry['url'])
        if url.scheme!='https' or url.netloc!='katakatalab.com' or url.query or url.fragment:
            raise ValueError('Only anonymous published site dependencies are allowed')
        request=urllib.request.Request(entry['url'],headers={'User-Agent':'public-source-ci','Cache-Control':'no-cache'})
        with urllib.request.urlopen(request,timeout=40) as response:
            if urllib.parse.urlsplit(response.url).netloc!='katakatalab.com':raise ValueError('Unexpected dependency redirect')
            data=response.read(entry['bytes']+1)
        if len(data)!=entry['bytes'] or hashlib.sha256(data).hexdigest()!=entry['sha256']:
            raise ValueError('Published dependency changed: '+entry['path'])
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_bytes(data)


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--root',type=Path,default=Path('.'))
    options=parser.parse_args()
    root=options.root.resolve()
    spec=json.loads((root/'qa/published-dependencies.json').read_text(encoding='utf8'))
    with ThreadPoolExecutor(max_workers=6) as pool:list(pool.map(lambda entry:materialize(root,entry),spec['files']))
    # Test fixtures contain only already-public response headers; actual Apache
    # routing, directory/auth rules and PHP configuration remain private.
    for entry in spec.get('server_fixtures',[]):
        target=safe_target(root,entry['path'])
        target.parent.mkdir(parents=True,exist_ok=True)
        target.write_text('# CI fixture only. Never deploy this file.\n'+entry['content'],encoding='utf8')
    print(f"Prepared {len(spec['files'])} CI dependencies; {sum(bool(x.get('ci_fixture')) for x in spec['files'])} explicitly synthetic decorative fixtures. Private release overlay required.")


if __name__=='__main__':main()
