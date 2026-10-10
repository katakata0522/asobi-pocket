import { test, expect } from '@playwright/test';

// 本番計測へ自動テストを混ぜず、ゲーム自身の処理だけを検証する。
test.beforeEach(async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', route => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
});

function collectRuntimeErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (/Failed to load resource|net::ERR_/i.test(text)) return;
    errors.push(`console.error: ${text}`);
  });
  return errors;
}

async function expectUsefulText(locator) {
  await expect(locator).toBeVisible();
  const text = (await locator.textContent() || '').trim();
  expect(text.length).toBeGreaterThan(0);
  expect(text).not.toContain('[object Object]');
  expect(text).not.toContain('undefined');
  expect(text).not.toContain('null');
}

test('TPO text presets render as text in legacy tools', async ({ page }) => {
  const errors = collectRuntimeErrors(page);

  await page.goto('/#game/asa-sore');
  await expectUsefulText(page.locator('.asa-topic-main'));

  await page.goto('/#game/bomb-timer');
  await expectUsefulText(page.locator('#bomb-topic-text'));

  await page.goto('/#game/ng-word');
  await expectUsefulText(page.locator('.ng-p-word').first());

  expect(errors).toEqual([]);
});

test('word wolf, two choices, and katakana-ban consume the canonicalized preset schema', async ({ page }) => {
  page.on('dialog', dialog => dialog.accept());
  const errors = collectRuntimeErrors(page);

  await page.goto('/#game/word-wolf');
  await page.locator('#btn-start-wolf').click();
  await page.locator('#btn-reveal-word').click();
  await expectUsefulText(page.locator('.the-word'));
  await expectUsefulText(page.locator('.word-category'));

  await page.goto('/#game/two-choices');
  const choices = page.locator('.choice-content');
  await expect(choices).toHaveCount(2);
  await expectUsefulText(choices.nth(0));
  await expectUsefulText(choices.nth(1));
  const choiceTexts = await choices.allTextContents();
  expect(choiceTexts[0].trim()).not.toBe(choiceTexts[1].trim());

  await page.goto('/#game/katakana-ban');
  await expectUsefulText(page.locator('.katakana-target-word'));
  await expectUsefulText(page.locator('.katakana-subhint'));
  const hint = (await page.locator('.katakana-subhint').textContent() || '').replace(/^※例:\s*[「"]?|[」"]?$/g, '');
  expect(hint).not.toMatch(/[ァ-ヶー]/);

  expect(errors).toEqual([]);
});

test('all preset-bearing games expose a non-empty detail preset list', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto("/");
  const gameIds = await page.evaluate(() => GAMES_DATA.filter(game => game.presets?.length).map(game => game.id));
  expect(gameIds.length).toBeGreaterThanOrEqual(18);

  for (const gameId of gameIds) {
    await page.goto(`/#game/${gameId}`);
    const presetTab = page.locator('[data-tab="presets"]');
    await expect(presetTab, `${gameId}: preset tab should exist`).toBeVisible();
    await presetTab.click();
    const pane = page.locator('#pane-presets');
    await expect(pane).toBeVisible();
    await expect(pane.locator('.preset-item-card').first(), `${gameId}: first preset should render`).toBeVisible();
    await expect(pane).not.toContainText('[object Object]');
    await expect(pane).not.toContainText('undefined');
  }

  expect(errors).toEqual([]);
});

test('talk gacha adapts text/scene data to its category UI', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/#game/talk-gacha');

  await expectUsefulText(page.locator('.gacha-text'));
  await page.locator('[data-cat="恋愛"]').click();
  await page.locator('#btn-spin-gacha').click();
  await expectUsefulText(page.locator('.gacha-text'));
  await expect(page.locator('.gacha-badge')).toHaveText('恋愛');

  expect(errors).toEqual([]);
});

test('penalty roulette is safe-by-default and always skippable', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/#game/batsu-roulette');

  await expect(page.locator('.tool-title')).toContainText('ソフトミッション');
  await expect(page.locator('#btn-batsu-pass')).toBeVisible();
  await expect(page.locator('.batsu-card')).toContainText('嫌なら理由を言わずパス');
  await expectUsefulText(page.locator('#batsu-text'));

  const before = (await page.locator('#batsu-text').textContent() || '').trim();
  await page.locator('#btn-batsu-pass').click();
  await expectUsefulText(page.locator('#batsu-text'));
  await expect(page.locator('.batsu-card')).not.toContainText('[object Object]');

  const publicContract = await page.evaluate(() => {
    const game = GAMES_DATA.find((item) => item.id === 'batsu-roulette');
    return { badge: game.badge, overview: game.overview, rules: game.rules, presets: game.presets };
  });
  expect(publicContract.badge).toBe('パスOK');
  expect(publicContract.presets).toHaveLength(40);
  expect(JSON.stringify(publicContract)).not.toContain('言い訳なし');
  expect(JSON.stringify(publicContract)).not.toContain('最新の写真');
  expect(JSON.stringify(publicContract)).not.toContain('店員さんへの注文');
  expect(JSON.stringify(publicContract)).not.toContain('恥ずかしい失敗談');
  expect(typeof before).toBe('string');
  expect(errors).toEqual([]);
});
