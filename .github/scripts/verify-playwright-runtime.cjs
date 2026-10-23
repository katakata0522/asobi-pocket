'use strict';

// CI公式イメージとlockfileを同時更新する。異版への暗黙フォールバック・追加取得はしない。
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const packageFile = require.resolve('playwright/package.json', { paths: [process.cwd()] });
const { version } = require(packageFile);
assert.equal(version, '1.60.0', 'Playwrightのlockfileと固定CIイメージを同時に更新してください');
const { chromium } = require(path.dirname(packageFile));
fs.accessSync(chromium.executablePath(), fs.constants.X_OK);
(async () => {
  const browser = await chromium.launch({ headless: true });
  try { console.log(`Locked Playwright ${version}; Chromium ${browser.version()}`); }
  finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
