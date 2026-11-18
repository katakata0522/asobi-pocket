import { test, expect } from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

// Serve two releases at the same scope so Chromium performs a real worker upgrade.
test('配信をまたいでトップだけが更新され、進行中の得点とお気に入りを保つ', async ({ page, context }, info) => {
  test.setTimeout(60000);
  const root = path.resolve(process.env.ASOBI_TEST_ROOT || 'my-webservice/asobi-pocket');
  let release = 'asobi-pocket-test-one';
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (!pathname.startsWith('/asobi-pocket/')) return res.writeHead(404).end();
    const file = path.resolve(root, pathname.slice('/asobi-pocket/'.length) || 'index.html');
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return res.writeHead(404).end();
    const type = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
    res.setHeader('Content-Type', type[path.extname(file)] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    if (path.basename(file) === 'sw.js') {
      return res.end(fs.readFileSync(file, 'utf8').replace(/const CACHE_NAME = "[^"]+";/, 'const CACHE_NAME = "' + release + '";'));
    }
    res.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port + '/asobi-pocket/';
  const press = locator => info.project.use.hasTouch ? locator.tap() : locator.click();
  try {
    await page.goto(url);
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    await page.goto(url + 'index.html?asobi_test=1');
    await expect(page.locator('html')).toHaveAttribute('data-asobi-release', release);
    await press(page.locator('.party-pick[data-id="ito"] .btn-card-fav'));
    const favorites = page.locator(info.project.use.hasTouch ? '#btm-nav-fav' : '#btn-toggle-fav-filter');
    await press(favorites);
    const game = await context.newPage();
    game.on('dialog', dialog => dialog.accept());
    await game.goto(url + '?asobi_test=1#game/katakana-ban');
    await press(game.locator('#btn-kata-correct'));
    const word = await game.locator('.katakana-target-word').innerText();
    const gameStart = await game.evaluate(() => performance.timeOrigin);
    const roulette = await context.newPage();
    await roulette.goto(url);
    const headerButton = roulette.locator('#btn-header-finger');
    const finger = await headerButton.isVisible();
    const dialog = roulette.locator(finger ? '#modal-finger-roulette' : '#modal-roulette');
    await press(finger ? headerButton : roulette.locator('#btm-nav-roulette'));
    await expect(dialog).toBeVisible();
    const homeStart = await page.evaluate(() => performance.timeOrigin);
    release = 'asobi-pocket-test-two';
    await game.evaluate(async () => (await navigator.serviceWorker.ready).update().then(() => undefined));
    await expect(page.locator('html')).toHaveAttribute('data-asobi-release', release, { timeout: 20000 });
    expect(await page.evaluate(() => performance.timeOrigin)).not.toBe(homeStart);
    await expect(page.locator('#filter-result-count')).toHaveText('お気に入り 1件');
    await expect(page.locator('#games-grid a[href="#game/ito"]')).toBeVisible();
    expect(await game.evaluate(() => performance.timeOrigin)).toBe(gameStart);
    await expect(game.locator('.katakana-target-word')).toHaveText(word);
    await expect(game.locator('.score-badge strong')).toHaveText('1');
    await expect(roulette.locator('html')).toHaveAttribute('data-asobi-release', 'asobi-pocket-test-one');
    await expect(dialog).toBeVisible();
    await press(dialog.locator('.modal-close-btn'));
    await expect(roulette.locator('html')).toHaveAttribute('data-asobi-release', release);
    await roulette.close();
    await press(game.locator('#btn-kata-correct'));
    await expect(game.locator('.score-badge strong')).toHaveText('2');
    await press(game.locator('#btn-back-home'));
    await expect(game.locator('html')).toHaveAttribute('data-asobi-release', release);
    await expect(game.locator('.party-pick[data-id="ito"] .btn-card-fav')).toHaveAttribute('aria-pressed', 'true');
    await game.close();
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
