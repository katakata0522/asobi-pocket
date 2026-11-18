import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://**', route => route.abort());
});

test('記事のお題でitoを始め、秘密の数字をキーボードで順に確認する', async ({ page }) => {
  await page.goto('/seo/ito-odai.html');
  await page.getByRole('link', { name: '2. 休日にしたいこと', exact: true }).click();
  await expect(page).toHaveURL(/#game\/ito\?topic=2$/);
  await expect(page.locator('#ito-topic-display')).toHaveText('休日にしたいこと（1: できれば避けたい ↔ 100: 理想の休日）');
  await page.locator('#range-ito-players').press('Home');
  await page.locator('#btn-start-ito').press('Enter');
  const reveal = page.getByRole('button', { name: '自分の数字をこっそり確認' });
  const revealed = page.locator('#ito-card-revealed');
  const next = page.locator('#btn-ito-next-person');
  const numbers = [];
  for (const key of ['Enter', 'Space']) {
    await expect(reveal).toBeFocused();
    await expect(revealed).toBeHidden();
    await page.keyboard.press(key);
    await expect(revealed).toBeFocused();
    numbers.push(Number(await revealed.locator('.card-large-number').innerText()));
    await page.keyboard.press('Tab');
    await expect(next).toBeFocused();
    await page.keyboard.press('Enter');
  }
  await expect(page.locator('#ito-talk-topic')).toContainText('休日にしたいこと');
  const leavePrompt = page.waitForEvent('dialog', { timeout: 5000 }).then(dialog => dialog.dismiss());
  await page.evaluate(() => { location.hash = '#game/asa-sore'; });
  await leavePrompt;
  await expect(page).toHaveURL(/#game\/ito\?topic=2$/);
  await page.evaluate(() => new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
  await expect(page.locator('#ito-talk-topic')).toBeFocused();
  if (numbers[0] > numbers[1]) await page.locator('.btn-move-up').last().press('Enter');
  await page.locator('#btn-ito-open-cards').press('Enter');
  await expect(page.locator('.result-celebration')).toContainText('完全クリア');
});

async function enterWolfGuess(page) {
  await page.goto('/seo/wordwolf-odai.html');
  await page.getByRole('link', { name: '1. うどん / そば', exact: true }).click();
  await expect(page).toHaveURL(/#game\/word-wolf\?topic=1$/);
  const tool = page.locator('#tool-mount-point');
  await expect(tool).not.toContainText(/うどん|そば/);
  await page.locator('#range-player-count').press('Home');
  await page.locator('#btn-start-wolf').click();
  const words = [];
  for (let player = 0; player < 3; player += 1) {
    await expect(tool.locator('.the-word')).toBeHidden();
    await page.locator('#btn-reveal-word').click();
    words.push((await tool.locator('.the-word').innerText()).trim());
    await page.locator('#btn-next-player').click();
  }
  expect([...new Set(words)].sort()).toEqual(['うどん', 'そば']);
  const wolf = words.findIndex(word => words.filter(other => other === word).length === 1);
  const majority = words.find((word, index) => index !== wolf);
  await page.locator('#btn-finish-talk').click();
  await page.getByRole('button', { name: new RegExp(`プレイヤー ${wolf + 1}$`) }).click();
  await page.locator('#btn-open-roles').click();
  await expect(page.getByRole('textbox', { name: '市民のお題' })).toBeVisible();
  await expect(tool).not.toContainText(/うどん|そば/);
  return majority;
}

test('記事のペアをワードウルフに配り、逆転の判定までお題を伏せる', async ({ page }) => {
  const majority = await enterWolfGuess(page);
  await page.getByRole('textbox', { name: '市民のお題' }).fill(majority.slice(0, 1));
  await page.locator('#btn-judge-wolf-guess').click();
  await expect(page.locator('#wolf-guess-result-msg')).toContainText('市民側の勝利');
  await expect(page.locator('.role-word').first()).toBeVisible();

  const nextMajority = await enterWolfGuess(page);
  await page.getByRole('textbox', { name: '市民のお題' }).fill(`　${nextMajority} `);
  await page.getByRole('textbox', { name: '市民のお題' }).press('Enter');
  await expect(page.locator('#wolf-guess-result-msg')).toContainText('ウルフ側の逆転勝利');
  await expect(page.getByRole('textbox', { name: '市民のお題' })).toHaveCount(0);
});

test('NGワードは勝者を次の対戦まで保持する', async ({ page }) => {
  await page.goto('/#game/ng-word');
  async function dealWords() {
    for (let player = 1; player <= 2; player++) {
      await expect(page.locator('.ng-p-word')).toHaveCount(0);
      await page.locator('#ng-reveal').click();
      await expect(page.locator('.ng-p-word')).toHaveCount(1);
      await page.locator('#ng-hide').click();
    }
    await expect(page.locator('.ng-p-word')).toHaveCount(0);
  }
  await dealWords();
  const playerOneSaid = page.locator('#btn-p1-said');
  const playerTwoSaid = page.locator('#btn-p2-said');
  await playerTwoSaid.click();
  await expect(page.getByText(/PLAYER 1 の大勝利/)).toBeVisible();
  await expect(playerOneSaid).toBeDisabled();
  await expect(playerTwoSaid).toBeDisabled();
  await playerOneSaid.click({ force: true });
  await expect(page.getByText(/PLAYER 1 の大勝利/)).toBeVisible();
  await page.locator('#btn-ng-duel-next').click();
  await dealWords();
  await playerOneSaid.click();
  await expect(page.getByText(/PLAYER 2 の大勝利/)).toBeVisible();
});

test('朝までそれ正解で記事のお題を保ち、時間切れ後は60秒から計り直す', async ({ page }) => {
  await page.clock.install();
  await page.goto('/seo/asa-sore-odai.html');
  await page.getByRole('link', { name: '1. 「○」で始まる食べ物', exact: true }).click();
  await expect(page.locator('.asa-topic-main')).toHaveText('食べ物');
  await page.locator('#btn-shuffle-kana').click();
  await expect(page.locator('.asa-topic-main')).toHaveText('食べ物');
  const timer = page.locator('.asa-timer-num');
  const toggle = page.locator('#btn-toggle-asa-timer');
  await toggle.click();
  await page.clock.runFor(60000);
  await expect(timer).toHaveText('0秒');
  await expect(toggle).toContainText('スタート (60秒)');
  await toggle.click();
  await page.clock.runFor(1000);
  await expect(timer).toHaveText('59秒');
  await expect(toggle).toHaveText('一時停止');
});

test('ウミガメのスープで記事の問題・ヒント・答えを使える', async ({ page }) => {
  await page.goto('/seo/sea-turtle-quiz.html');
  const problem = page.locator('.quiz-card').last();
  const title = (await problem.locator('h3').innerText()).replace(/^\d+\. /, '');
  const question = await problem.locator('.question').innerText();
  await problem.getByRole('link').click();
  await expect(page).toHaveURL(/#game\/sea-turtle\?topic=12$/);
  await expect(page.locator('.puzzle-title')).toHaveText(title);
  await expect(page.locator('.puzzle-question-box')).toHaveText(question);
  await expect(page.locator('.btn-phased-hint-toggle')).toHaveCount(3);
  await expect(page.locator('#answer-box')).toBeHidden();
  await page.locator('.btn-phased-hint-toggle').first().click();
  await expect(page.locator('.phased-hint-content')).toContainText('会議内容を理解');
  await page.locator('#btn-toggle-answer').click();
  await expect(page.locator('#answer-box')).toBeVisible();
  await page.locator('#btn-next-q').click();
  await expect(page.locator('.puzzle-title')).not.toHaveText(title);
  await expect(page.locator('#answer-box')).toBeHidden();
  await expect(page.locator('.phased-hint-content')).toHaveCount(0);
});

test('車内ゲームの比較表は幅320pxで項目を読め、ゲーム名で起動できる', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/seo/travel-car-games.html#choose-car-game');
  const table = page.getByRole('table', { name: '車内ゲーム4種の人数と画面の使い方' });
  await expect(table.getByRole('row')).toHaveCount(5);
  const firstRow = table.getByRole('row').filter({
    has: page.getByRole('link', { name: '縛りしりとり', exact: true }),
  });
  await expect(firstRow.getByText('人数', { exact: true })).toBeVisible();
  await expect(firstRow.getByText('画面', { exact: true })).toBeVisible();
  expect(await table.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await firstRow.getByRole('link', { name: '縛りしりとり', exact: true }).click();
  await expect(page).toHaveURL(/#game\/word-chain-limit$/);
  await expect(page.locator('#btn-timer-toggle')).toBeVisible();
});
