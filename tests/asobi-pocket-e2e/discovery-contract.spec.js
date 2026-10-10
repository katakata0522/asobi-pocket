import { test, expect } from '@playwright/test';

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

test('search hides known non-matches instead of only keeping the match visible', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/');

  if (!await page.locator('#discovery-filters').evaluate(el => el.open)) await page.locator('#discovery-filters > summary').click();
  await page.locator('#search-input').fill('ito');
  await expect(page.locator('.game-card[data-id="ito"]')).toBeVisible();
  await expect(page.locator('.game-card[data-id="duel-reflex"]')).toHaveCount(0);

  const visibleIds = await page.locator('#games-grid > .game-card').evaluateAll((cards) =>
    cards.map((card) => card.dataset.id)
  );
  expect(visibleIds).toContain('ito');
  expect(visibleIds).not.toContain('duel-reflex');
  expect(errors).toEqual([]);
});

test('2-player filter excludes games that cannot support two players', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/');

  if (!await page.locator('#discovery-filters').evaluate(el => el.open)) await page.locator('#discovery-filters > summary').click();
  await page.locator('#fit-players').selectOption('2');
  const visibleIds = await page.locator('#games-grid > .game-card').evaluateAll((cards) =>
    cards.map((card) => card.dataset.id)
  );

  expect(visibleIds.length).toBeGreaterThan(0);
  const incompatibleIds = await page.evaluate((ids) => {
    const byId = new Map(GAMES_DATA.map((game) => [game.id, game]));
    return ids.filter((id) => {
      const game = byId.get(id);
      return !game || !(game.minPlayers <= 2 && game.maxPlayers >= 2);
    });
  }, visibleIds);
  expect(incompatibleIds).toEqual([]);
  expect(errors).toEqual([]);
});

test('seconds-only games stay genuinely quick after duration normalization', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/');

  const duration = await page.evaluate(() => {
    const game = GAMES_DATA.find((item) => item.id === 'finger-roulette');
    return game && game.durationMin;
  });
  expect(duration).toBeGreaterThan(0);
  expect(duration).toBeLessThan(1);

  if (!await page.locator('#discovery-filters').evaluate(el => el.open)) await page.locator('#discovery-filters > summary').click();
  await page.locator('#sort-select').selectOption('quick');
  const durations = await page.locator('#games-grid > .game-card').evaluateAll((cards) =>
    cards.map((card) => GAMES_DATA.find((game) => game.id === card.dataset.id).durationMin)
  );
  expect(durations).toEqual([...durations].sort((a, b) => a - b));
  if (!await page.locator('#discovery-filters').evaluate(el => el.open)) await page.locator('#discovery-filters > summary').click();
  await page.locator('#search-input').fill('指置き');
  await expect(page.locator('#games-grid > .game-card[data-id="finger-roulette"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('random roulette chooses only from the currently visible discovery set', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/');

  if (!await page.locator('#discovery-filters').evaluate(el => el.open)) await page.locator('#discovery-filters > summary').click();
  await page.locator('#search-input').fill('指置きロシアンルーレット');
  const cards = page.locator('#games-grid > .game-card');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toHaveAttribute('data-id', 'finger-roulette');

  await page.locator('#btn-random-roulette').click();
  await page.locator('#btn-spin-roulette').click();
  await expect(page.locator('#btn-roulette-go')).toBeVisible({ timeout: 4_000 });
  await expect(page.locator('#roulette-result-title')).toContainText('指置き');
  expect(errors).toEqual([]);
});

test('settings dialog receives focus, traps tab navigation, and restores focus on Escape', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/');

  const opener = page.locator('#btn-open-settings');
  await opener.focus();
  await opener.click();
  await expect(page.locator('#modal-settings')).toBeVisible();
  await expect(page.locator('#modal-settings')).toContainText('設定');

  const activeInside = await page.evaluate(() => {
    const modal = document.getElementById('modal-settings');
    return Boolean(modal && modal.contains(document.activeElement));
  });
  expect(activeInside).toBe(true);

  await page.keyboard.press('Escape');
  await expect(page.locator('#modal-settings')).toHaveClass(/hidden/);
  await expect(opener).toBeFocused();
  expect(errors).toEqual([]);
});
