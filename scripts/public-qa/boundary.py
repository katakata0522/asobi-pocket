#!/usr/bin/env python3
"""Enforce a source-only public repository before dependencies are prepared."""
import json
from pathlib import Path
import re
import subprocess

root=Path(__file__).resolve().parents[2]
files=[x.decode('utf8') for x in subprocess.check_output(['git','ls-files','-z'],cwd=root).split(b'\0') if x]
spec=json.loads((root/'qa/published-dependencies.json').read_text(encoding='utf8'))
held={x['path'] for x in spec['files']}|{x['path'] for x in spec.get('server_fixtures',[])}
forbidden=re.compile(r'(^|/)(?:\.env(?:\..*)?|\.gsc|\.ssh|production|_archive|scratch|temp-artifacts|secrets?|credentials?|id_rsa|id_ed25519)(/|$)|\.(?:pem|key|p12|pfx|sql|sqlite|db|php|png|jpe?g|gif|webp|ico|svg|ttf|woff2?|otf|wasm)$',re.I)
errors=[]
for name in files:
 if name in held or forbidden.search(name) or Path(name).name in {'.htaccess','.user.ini'}:errors.append(name)
 if name.startswith('.github/workflows/'):
  text=(root/name).read_text(encoding='utf8')
  if re.search(r'secrets\.|pull_request_target|workflow_run|id-token:\s*write|contents:\s*write|actions/upload-artifact@|rsync|ssh-agent',text):errors.append(name+': privileged operation')
  if not re.search(r'contents:\s*read',text):errors.append(name+': missing read-only permissions')
  for action in re.findall(r'uses:\s*([^\s#]+)',text):
   if not re.fullmatch(r'[\w.-]+/[\w./-]+@[a-f0-9]{40}',action):errors.append(name+': unpinned action')
if errors:raise SystemExit('Public source boundary rejected: '+json.dumps(errors))
print(f'Public source boundary passed: {len(files)} tracked files; no private configuration, media, backend, credentials or privileged workflow.')
