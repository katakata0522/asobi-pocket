import { test, expect } from './playwright-runtime.js';

// 本番計測へ自動テストを混ぜず、ゲーム自身の処理だけを検証する。
test.beforeEach(async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', route => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
});

function collectRuntimeErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console.error: ${message.text()}`);
  });
  return errors;
}

test('discovery, game start, stamp semantics, and settings stay healthy', async ({ page }) => {
  const errors = collectRuntimeErrors(page);

  await page.goto('/');
  await expect(page.getByRole('heading', { name: '今日は、何して遊ぶ？' })).toBeVisible();

  const rouletteContainsScoreboard = await page.evaluate(() => {
    const roulette = document.getElementById('modal-roulette');
    const scoreboard = document.getElementById('btn-toggle-scoreboard');
    return Boolean(roulette && scoreboard && roulette.contains(scoreboard));
  });
  expect(rouletteContainsScoreboard).toBe(false);

  if (!await page.locator('#discovery-filters').evaluate(el => el.open)) await page.locator('#discovery-filters > summary').click();
  await page.locator('#search-input').fill('ito');
  await expect(page.locator('.game-card[data-id="ito"]')).toBeVisible();
  await expect(page.locator('.game-card[data-id="duel-reflex"]')).toHaveCount(0);
  await page.locator('.game-card[data-id="ito"]').click();
  await expect(page.locator('#tool-mount-point #btn-start-ito')).toBeVisible();

  const beforePlay = await page.evaluate(() => JSON.parse(localStorage.getItem('asobi_played_games') || '[]'));
  expect(beforePlay).not.toContain('ito');

  await page.locator('#btn-start-ito').click();
  const afterPlay = await page.evaluate(() => JSON.parse(localStorage.getItem('asobi_played_games') || '[]'));
  expect(afterPlay).toContain('ito');

  const toastRegion = page.locator('#toast-container');
  await expect(toastRegion).toHaveAttribute('role', 'status');
  await expect(toastRegion).toHaveAttribute('aria-live', 'polite');

  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#btn-back-home').click();
  await expect(page.locator('#view-home')).toBeVisible();

  await page.locator('#btn-open-settings').click();
  await expect(page.locator('#modal-settings')).toBeVisible();
  await page.locator('#btn-close-settings').click();
  await expect(page.locator('#modal-settings')).toHaveClass(/hidden/);

  expect(errors).toEqual([]);
});

test('scoreboard rename persists through scoring', async ({ page }) => {
  const errors = collectRuntimeErrors(page);

  await page.goto('/#game/ito');
  await expect(page.locator('#btn-detail-scoreboard')).toBeVisible();
  await page.locator('#btn-detail-scoreboard').click();
  await expect(page.locator('#scoreboard-drawer')).toBeVisible();

  const nameInput = page.locator('.score-player-name').first();
  await nameInput.fill('テスト太郎');
  await nameInput.blur();
  await page.locator('[data-quality-score="plus"]').first().click();

  await expect(page.locator('.score-player-name').first()).toHaveValue('テスト太郎');
  await expect(page.locator('.score-value').first()).toHaveText('1');
  expect(errors).toEqual([]);
});

test('desktop finger roulette supports click-based virtual fingers', async ({ page }) => {
  const errors = collectRuntimeErrors(page);

  await page.goto('/');
  if (!await page.locator('#discovery-filters').evaluate(el => el.open)) await page.locator('#discovery-filters > summary').click();
  await page.locator('#search-input').fill('指置き');
  const card = page.locator('.game-card').filter({ hasText: '指置き' }).first();
  await expect(card).toBeVisible();
  await card.click();

  const area = page.locator('#touch-area');
  await expect(area).toBeVisible();
  const box = await area.boundingBox();
  expect(box).not.toBeNull();

  await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.55);
  await page.mouse.click(box.x + box.width * 0.7, box.y + box.height * 0.55);
  await expect(page.locator('#roulette-overlay')).toHaveClass(/hidden/);
  await expect(page.locator('#toast-container')).toContainText('決定しました', { timeout: 4_000 });

  expect(errors).toEqual([]);
});

test('rhythm timer interval is cleaned up when leaving a game', async ({ page }) => {
  const errors = collectRuntimeErrors(page);

  await page.addInitScript(() => {
    const nativeSetInterval = window.setInterval.bind(window);
    const nativeClearInterval = window.clearInterval.bind(window);
    const active = new Set();
    window.__asobiActiveIntervals = active;
    window.setInterval = (callback, delay, ...args) => {
      const id = nativeSetInterval(callback, delay, ...args);
      active.add(id);
      return id;
    };
    window.clearInterval = (id) => {
      active.delete(id);
      return nativeClearInterval(id);
    };
  });

  await page.goto('/#game/yamanote-game');
  await expect(page.locator('#btn-toggle-rhythm')).toBeVisible();
  await page.locator('#btn-toggle-rhythm').click();

  await expect.poll(() => page.evaluate(() => window.__asobiActiveIntervals.size)).toBeGreaterThan(0);

  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#btn-back-home').click();
  await expect(page.locator('#view-home')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__asobiActiveIntervals.size)).toBe(0);

  expect(errors).toEqual([]);
});
