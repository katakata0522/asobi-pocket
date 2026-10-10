import { test, expect } from './playwright-runtime.js';
test.beforeEach(async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', route => route.fulfill({ body: '', contentType: 'application/javascript' }));
});

test('folded discovery follows quick recommendations and retains removable conditions', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#games-grid .game-card').first()).toBeVisible();
  expect(await page.locator('#discovery-filters').evaluate(el => el.open)).toBe(false);
  await expect(page.locator('#quick-pick-results .quick-pick-card')).toHaveCount(3);
  expect((await page.locator('#quick-pick-results').boundingBox()).y).toBeLessThan((await page.locator('#games-grid').boundingBox()).y);
  await page.locator('#discovery-filters > summary').click();
  await page.locator('#fit-players').selectOption('2');
  await page.locator('#fit-duration').selectOption('3');
  await page.locator('#discovery-filters > summary').click();
  await expect(page.locator('#active-filter-summary')).toContainText('2人');
  await expect(page.locator('#active-filter-summary')).toContainText('3分くらい');
  await page.getByRole('button', { name: '2人の条件を解除', exact: true }).click();
  await expect(page.locator('#fit-players')).toHaveValue('all');
  await page.locator('#btn-clear-filters').click();
  await expect(page.locator('#games-grid .game-card')).toHaveCount(19);
});

test('mobile search opens the filters and places the input in view', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('#btm-nav-search').click();
  await expect(page.locator('#search-input')).toBeFocused();
  await expect(page.locator('#search-input')).toBeInViewport();
  await page.locator('#search-input').fill('ito');
  await expect(page.locator('#games-grid .game-card')).toHaveCount(1);
});

test('mute is the initial setting and an explicit sound choice persists', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#btn-header-mute')).toContainText('音なし');
  await page.locator('#btn-header-mute').click();
  await expect(page.locator('#btn-header-mute')).toContainText('音あり');
  await page.reload();
  await expect(page.locator('#btn-header-mute')).toContainText('音あり');
  await page.locator('#btn-header-mute').click();
  await page.locator('#btn-open-settings').click();
  await expect(page.locator('#setting-sound-toggle')).not.toBeChecked();
});

test('opening and configuring a game needs no exit confirmation and restores the list position', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('.game-card[data-id="word-wolf"] .card-title-link');
  await card.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => scrollY);
  const dialogs = []; page.on('dialog', async d => { dialogs.push(d.message()); await d.dismiss(); });
  await card.click();
  await page.locator('[data-time="300"]').click();
  await page.locator('#btn-back-home').click();
  await expect(page.locator('#view-home')).toBeVisible();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before - 3);
  expect(dialogs).toEqual([]);
  await expect(page.locator('#recent-games')).toContainText('ワードウルフ');
  expect((await page.locator('#recent-games').boundingBox()).y).toBeLessThan((await page.locator('#games-grid').boundingBox()).y);
});

test('an active round is kept when exit is cancelled and browser Back also respects it', async ({ page }) => {
  await page.goto('/');
  await page.locator('.game-card[data-id="ito"] .card-title-link').click();
  await page.locator('#btn-start-ito').click();
  page.once('dialog', dialog => dialog.dismiss());
  await page.locator('#btn-back-home').click();
  await expect(page.locator('#view-detail')).toBeVisible();
  await expect(page).toHaveURL(/#game\/ito$/);
  page.once('dialog', dialog => dialog.dismiss());
  await page.goBack();
  await expect(page).toHaveURL(/#game\/ito$/);
  await expect(page.locator('#view-detail')).toBeVisible();
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#btn-back-home').click();
  await expect(page.locator('#view-home')).toBeVisible();
});

test('favorites teach first-time use and labels match the selected view', async ({ page }) => {
  await page.goto('/');
  const favorites = await page.locator('#btm-nav-fav').isVisible()
    ? page.locator('#btm-nav-fav') : page.locator('#btn-toggle-fav-filter');
  await favorites.click();
  await expect(page.locator('#empty-state')).toContainText('お気に入りは、まだありません');
  await expect(page.locator('#empty-state')).toContainText('★を押す');
  await page.locator('#btn-empty-reset').click();
  await page.locator('.game-card[data-id="ito"] .btn-card-fav').click();
  await favorites.click();
  await expect(page.locator('#filter-result-count')).toHaveText('お気に入り 1件');
  await expect(page.locator('#active-filter-summary')).toContainText('お気に入り');
  await expect(page.locator('#games-grid .game-card')).toHaveCount(1);
});

test('card widths and heights match and support controls do not cover the play button', async ({ page }) => {
  await page.goto('/');
  const rects = await page.locator('#games-grid .game-card').evaluateAll(cards => cards.map(card => { const r = card.getBoundingClientRect(); return { w: r.width, h: r.height }; }));
  expect(Math.max(...rects.map(r => r.w)) - Math.min(...rects.map(r => r.w))).toBeLessThan(1);
  expect(Math.max(...rects.map(r => r.h)) - Math.min(...rects.map(r => r.h))).toBeLessThan(1);
  await page.locator('.game-card[data-id="ito"] .card-title-link').click();
  await expect(page.locator('#btn-detail-scoreboard')).toBeVisible();
  await expect(page.locator('#btn-toggle-scoreboard')).not.toBeVisible();
  await page.locator('#btn-detail-scoreboard').click();
  await expect(page.locator('#scoreboard-drawer')).toBeVisible();
});
