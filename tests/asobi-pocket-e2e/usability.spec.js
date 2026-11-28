import { test, expect } from '@playwright/test';
import { openDetailScores } from './game-navigation';
test.beforeEach(async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', route => route.fulfill({ body: '', contentType: 'application/javascript' }));
});

test('folded discovery shows games first and retains removable conditions', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#games-grid .game-card').first()).toBeVisible();
  expect(await page.locator('#discovery-filters').evaluate(el => el.open)).toBe(false);
  expect((await page.locator('#games-grid .game-card').first().boundingBox()).y).toBeLessThan(400);
  await page.locator('#discovery-filters > summary').click();
  await page.locator('#fit-players').selectOption('2');
  await page.locator('#fit-duration').selectOption('3');
  await page.locator('#discovery-filters > summary').click();
  await expect(page.locator('#active-filter-summary')).toContainText('2人');
  await expect(page.locator('#active-filter-summary')).toContainText('3分くらい');
  await page.getByRole('button', { name: '2人の条件を解除', exact: true }).click();
  await expect(page.locator('#fit-players')).toHaveValue('all');
  await page.locator('#btn-clear-filters').click();
  await expect(page.locator('#games-grid .game-card')).toHaveCount(16);
  await expect(page.locator('#games-grid .duel-mode-link')).toHaveCount(3);
  const playTopic = page.locator('#btn-spotlight-play');
  const firstTopic = await playTopic.getAttribute('href');
  await page.getByRole('button', { name: '別のお題を見る' }).click();
  await expect(playTopic).not.toHaveAttribute('href', firstTopic);
  const topicUrl = await playTopic.evaluate(link => link.href);
  await playTopic.click();
  await expect(page).toHaveURL(topicUrl);
  await expect(page.locator('#tool-mount-point')).toBeVisible();
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
  await page.locator('#btn-open-settings').click();
  await expect(page.locator('#setting-sound-toggle')).not.toBeChecked();
  await expect(page.locator('#menu-sound-status')).toHaveText('音なし');
  await page.locator('#setting-sound-toggle').click();
  await expect(page.locator('#setting-sound-toggle')).toBeChecked();
  await expect(page.locator('#menu-sound-status')).toHaveText('音あり');
  await page.reload();
  await page.locator('#btn-open-settings').click();
  await expect(page.locator('#setting-sound-toggle')).toBeChecked();
  await expect(page.locator('#menu-sound-status')).toHaveText('音あり');
  await page.locator('#setting-sound-toggle').click();
  await expect(page.locator('#setting-sound-toggle')).not.toBeChecked();
  await expect(page.locator('#menu-sound-status')).toHaveText('音なし');
});

test('opening and configuring a game needs no exit confirmation and restores the list position', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('.game-card[data-id="word-wolf"] .card-title-link');
  await card.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => scrollY);
  await card.click();
  await page.locator('[data-time="300"]').click();
  await page.locator('#btn-back-home').click();
  await expect(page.locator('#view-home')).toBeVisible();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before - 3);
  await expect(page.locator('#asobi-inline-confirm-modal')).toHaveCount(0);
  await expect(page.locator('#recent-games')).toContainText('ワードウルフ');
  expect((await page.locator('#recent-games').boundingBox()).y).toBeLessThan((await page.locator('#games-grid').boundingBox()).y);
});

test('an active round is kept when exit is cancelled and browser Back also respects it', async ({ page }) => {
  await page.goto('/');
  await page.locator('.game-card[data-id="ito"] .card-title-link').click();
  await page.locator('#btn-start-ito').click();
  await page.locator('#btn-back-home').click();
  await page.getByRole('button', { name: 'ゲームを続ける' }).click();
  await expect(page.locator('#view-detail')).toBeVisible();
  await expect(page).toHaveURL(/#game\/ito$/);
  await page.goBack();
  await expect(page.getByRole('button', { name: 'ゲームを続ける' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#asobi-inline-confirm-modal')).toHaveCount(0);
  await expect(page).toHaveURL(/#game\/ito$/);
  await expect(page.locator('#view-detail')).toBeVisible();
  await page.locator('#btn-back-home').click();
  await page.getByRole('button', { name: '終了して移動' }).click();
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
  const rects = await page.locator('#games-grid .game-card:not(.party-pick)').evaluateAll(cards => cards.map(card => { const r = card.getBoundingClientRect(); return { w: r.width, h: r.height }; }));
  expect(Math.max(...rects.map(r => r.w)) - Math.min(...rects.map(r => r.w))).toBeLessThan(1);
  expect(Math.max(...rects.map(r => r.h)) - Math.min(...rects.map(r => r.h))).toBeLessThan(1);
  await page.locator('.game-card[data-id="ito"] .card-title-link').click();
  await expect(page.locator('#btn-toggle-scoreboard')).not.toBeVisible();
  await openDetailScores(page);
  await expect(page.locator('#scoreboard-drawer')).toBeVisible();
});
