'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '..');
const PROJECTS = ['my-webservice/asobi-pocket'];

// 必須資産の変更をSW自身の変更に結び付け、古い画面を永久に残さない。
function syncPwaReleases(root = ROOT, write = false) {
  const errors = [];
  for (const project of PROJECTS) {
    const directory = path.join(root, project), worker = path.join(directory, 'sw.js');
    if (!fs.existsSync(worker)) continue;
    const source = fs.readFileSync(worker, 'utf8');
    let config;
    vm.runInNewContext(source, { URL, self: { location: { href: 'https://example.test/app/sw.js' }, PwaRuntime: { configure(value) { config = value; } } }, importScripts() {} });
    if (!config || !config.cachePrefix) throw new Error(project + ': PWA設定がありません');
    const pattern = /const (CACHE_NAME|CACHE_VERSION) = ['"][^'"]+['"];?/;
    const hash = crypto.createHash('sha256').update(source.replace(pattern, 'const $1 = "RELEASE";'));
    const files = [...new Set(config.assets.map(asset => {
      const url = new URL(asset, 'https://example.test/');
      return url.pathname.endsWith('/') ? url.pathname.slice(1) + 'index.html' : url.pathname.slice(1);
    }))].sort();
    for (const file of files) {
      const target = path.resolve(directory, file);
      if (!target.startsWith(directory + path.sep) || !fs.existsSync(target)) throw new Error(project + ': 必須資産がありません: ' + file);
      hash.update(file + '\0').update(fs.readFileSync(target));
    }
    const revision = config.cachePrefix + hash.digest('hex').slice(0, 20);
    const output = source.replace(pattern, (_, label) => 'const ' + label + ' = "' + revision + '";');
    if (write) fs.writeFileSync(worker, output);
    else if (source !== output) errors.push(project + ': node scripts/sync-pwa-releases.cjs --write を実行してください');
  }
  return errors;
}
module.exports = { syncPwaReleases };
if (require.main === module) {
  const errors = syncPwaReleases(ROOT, process.argv.includes('--write'));
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else console.log('PWA release fingerprints: OK');
}
