import { test, expect } from './playwright-runtime.js';

// Opt-in browser suite; run against a local/staging build, not live production.
// Analytics is stubbed so tests never pollute real GA4.
const GAME_IDS = [
  'ito','asa-sore','word-wolf','duel-reflex','duel-mash','duel-color','bomb-timer',
  'katakana-ban','finger-roulette','two-choices','sea-turtle','ten-seconds',
  'talk-gacha','ng-word','indian-poker','one-night-werewolf','yomibito',
  'batsu-roulette','rhythm-box','yamanote-game','stand-up-game','ping-pong-pang',
  'takenoko-nyokki','high-and-low-guess','magical-banana','twenty-questions',
  'good-and-bad-news','counting-game-30','word-chain-limit',
  'two-truths-one-lie','doremi-song','silent-gesture'
];

test.beforeEach(async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
});

test('all 32 game routes show a usable first screen without uncaught JavaScript errors', async ({ page }) => {
  test.setTimeout(180_000);
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  await page.goto('/');
  const actual = await page.evaluate(() => GAMES_DATA.map((item) => item.id));
  expect([...actual].sort()).toEqual([...GAME_IDS].sort());

  for (const gameId of GAME_IDS) {
    await page.goto('/#game/' + gameId);
    await expect(page.locator('#view-detail'), gameId + ': detail is visible').toBeVisible();
    await expect(page.locator('#tool-mount-point'), gameId + ': game mount is visible').toBeVisible();
    const text = (await page.locator('#tool-mount-point').innerText()).trim();
    expect(text.length, gameId + ': game has meaningful screen text').toBeGreaterThan(10);
    expect(text, gameId + ': does not show object coercion').not.toContain('[object Object]');
  }
  expect(runtimeErrors).toEqual([]);
});

test('Ito accepts quoted user names as text, not executable HTML attributes', async ({ page }) => {
  await page.goto('/#game/ito');
  await page.locator('.player-custom-accordion > summary').click();
  const details = page.locator('#ito-player-inputs');
  const input = details.locator('.input-player-name').first();
  const payload = 'A" autofocus onfocus="alert(1) <svg onload=alert(1)>';
  await input.fill(payload);
  await page.locator('#range-ito-players').evaluate((slider) => {
    slider.value = '5';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(details.locator('.input-player-name').first()).toHaveValue(payload.slice(0, 40));
  expect(await details.locator('.input-player-name').first().getAttribute('onfocus')).toBeNull();
  await expect(details.locator('svg')).toHaveCount(0);
});

test('High & Low bounds invalid guesses without altering its range or attempts', async ({ page }) => {
  await page.goto('/#game/high-and-low-guess');
  const input = page.locator('#input-highlow-guess');
  for (const invalid of ['0','1001','-1','1.5']) {
    await input.fill(invalid);
    await page.locator('#btn-highlow-submit').click();
  }
  await expect(page.locator('.attempt-badge')).toContainText('0回');
  await expect(page.locator('.range-text')).toContainText('1 〜 100');
});

test('Word Wolf and One Night Werewolf player selectors match advertised capacity', async ({ page }) => {
  await page.goto('/#game/word-wolf');
  await expect(page.locator('#range-player-count')).toHaveAttribute('max', '10');
  await page.locator('#range-player-count').evaluate((el) => {
    el.value = '10'; el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#btn-start-wolf').click();
  await expect(page.locator('.pass-indicator')).toContainText('1 / 10');
  page.once('dialog', dialog => dialog.accept());
  await page.goto('/#game/one-night-werewolf');
  await expect(page).toHaveURL(/#game\/one-night-werewolf$/);
  await expect(page.locator('#range-ww-players')).toHaveAttribute('max', '7');
  await page.locator('#range-ww-players').evaluate((el) => {
    el.value = '7'; el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#btn-start-ww').click();
  await expect(page.locator('.pass-indicator')).toContainText('1 / 7');
});

test('scoreboard and custom topics cannot inject executable markup', async ({ page }) => {
  await page.goto('/#game/ito');
  await page.locator('#btn-detail-scoreboard').click();
  const payload = '<img src=x onerror=alert(1)>';
  const input = page.locator('.score-player-name').first();
  await input.fill(payload);
  await input.blur();
  await expect(page.locator('.score-player-name').first()).toHaveValue(payload);
  await expect(page.locator('#scoreboard-players-list img')).toHaveCount(0);
});

test('malformed stored topics recover and custom HTML-like topics remain text', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('asobi_custom_topics', JSON.stringify({ ito: 'broken-array' }));
    localStorage.setItem('asobi_excluded_topics', JSON.stringify([]));
  });
  await page.goto('/#game/ito');
  await expect(page.locator('#tool-mount-point #btn-start-ito')).toBeVisible();
  await page.locator('[data-tab="presets"]').click();
  await page.locator('#btn-open-topic-custom').click();
  const payload = '<svg onload=alert(1)>';
  await page.locator('#custom-topic-text').fill(payload);
  await page.locator('#custom-topic-form button[type="submit"]').click();
  await expect(page.locator('#pane-presets')).toContainText(payload);
  await expect(page.locator('#pane-presets svg')).toHaveCount(0);
});


test('scoreboard cannot exceed the 20-player storage contract, even after reload', async ({ page }) => {
  await page.goto('/#game/ito');
  await page.locator('#btn-detail-scoreboard').click();

  const list = page.locator('#scoreboard-players-list');
  const add = page.locator('#btn-add-player');
  await expect(list.locator('.scoreboard-row')).toHaveCount(2);
  for (let i = 0; i < 18; i++) await add.click();

  await expect(list.locator('.scoreboard-row')).toHaveCount(20);
  await expect(add).toBeDisabled();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('asobi_scoreboard_players')).length)).toBe(20);

  await page.reload();
  await page.locator('#btn-detail-scoreboard').click();
  await expect(list.locator('.scoreboard-row')).toHaveCount(20);
  await expect(add).toBeDisabled();

  await list.locator('.btn-score-del').first().click();
  await expect(list.locator('.scoreboard-row')).toHaveCount(19);
  await expect(add).toBeEnabled();
});

test('all 32 games survive repeated SPA navigation without uncaught errors', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('dialog', dialog => dialog.accept());
  await page.goto('/');

  for (const gameId of GAME_IDS) {
    await page.evaluate(id => { window.location.hash = '#game/' + id; }, gameId);
    await expect(page.locator('#view-detail'), gameId + ': detail opens').toBeVisible();
    await expect(page.locator('#tool-mount-point'), gameId + ': renderer stays available').toBeVisible();
    await page.evaluate(() => { window.location.hash = ''; });
    await expect(page.locator('#view-home'), gameId + ': returns to home').toBeVisible();
  }
  expect(errors, 'No JavaScript errors after 32 game enter/exit cycles').toEqual([]);
});
