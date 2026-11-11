import { test, expect } from './playwright-runtime.js';

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

test('home exposes canonical editorial labels and current article counts', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/');

  await expect(page.locator('#sort-select option[value="popular"]')).toHaveText('⭐ 編集部おすすめ順');
  const footer = page.locator('.footer-seo-links-row');
  await expect(footer).toContainText('お題集・ゲーム特集');
  await expect(footer).toContainText('ito 自作お題60選');
  await expect(footer).toContainText('ワードウルフ 自作お題60ペア');
  await expect(footer).toContainText('朝までそれ正解 自作お題50選');
  await expect(footer).toContainText('ウミガメのスープ 自作12問');
  await expect(footer).not.toContainText('itoお題100選');
  await expect(page.locator('body')).not.toContainText('あそびばポケット');

  expect(errors).toEqual([]);
});

test('legacy X intent text is normalized to the canonical brand', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/');

  const normalized = await page.evaluate(() => {
    return window.__normalizeAsobiShareUrl(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent('#朝までそれ正解 #あそびばポケット')}`
    );
  });
  const text = new URL(normalized).searchParams.get('text');
  expect(text).toContain('#あそびポケット');
  expect(text).not.toContain('#あそびばポケット');
  expect(errors).toEqual([]);
});

test('Twenty Questions describes only the logging features it actually has', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/#game/twenty-questions');

  await expect(page.locator('.detail-compact-catch')).toContainText('Yes/No');
  await expect(page.locator('#pane-rules')).toContainText('出題者が秘密の答えを決める');
  await expect(page.locator('#pane-rules')).toContainText('質問文そのものは保存されない');
  await expect(page.locator('#pane-rules')).not.toContainText('お題ジェネレーター');
  await expect(page.locator('#tool-mount-point .history-list h4')).toHaveText('回答履歴:');

  expect(errors).toEqual([]);
});

test('Finger Roulette copy matches one-or-two-person selection and PC support', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/#game/finger-roulette');

  await expect(page.locator('#pane-rules')).toContainText('選ぶ人数を1人か2人から選択');
  await expect(page.locator('#pane-rules')).toContainText('PC');
  await expect(page.locator('#pane-rules')).not.toContainText('グループチーム分け');
  await expect(page.locator('.roulette-mode-select')).toContainText('1人選ぶ');
  await expect(page.locator('.roulette-mode-select')).toContainText('2人選ぶ');

  expect(errors).toEqual([]);
});

test('preset manager button does not promise unsupported built-in exclusion creation', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/#game/ito');
  await page.locator('[data-tab="presets"]').click();

  await expect(page.locator('#btn-open-topic-custom')).toHaveText('⚙️ お題を追加・管理する');
  await expect(page.locator('#btn-open-topic-custom')).not.toContainText('除外する');

  expect(errors).toEqual([]);
});
