import { test, expect } from '@playwright/test';
import { openDetailScores } from './game-navigation';

const open = (page, id) => page.goto('./?asobi_test=1#game/' + id);

test('カタログにあるすべてのゲームを個別のURLから開ける', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./?asobi_test=1');
  const games = await page.evaluate(() => GAMES_DATA.map(({id, title}) => ({id, title})));
  expect(games.length).toBeGreaterThanOrEqual(32);
  for (const {id, title} of games) {
    await open(page, id);
    await expect(page.locator('.detail-compact-title'), id).toContainText(title);
    await expect(page.locator('#tool-mount-point').locator('button, input, canvas').first(), id).toBeAttached();
  }
  expect(errors).toEqual([]);
});

test('しりとりの取り消しは直前の言葉だけを戻す', async ({ page }) => {
  await open(page, 'word-chain-limit');
  await page.locator('#chain-word-details summary').click();
  const undo = page.locator('#chain-undo');
  const field = page.locator('#chain-word');
  await expect(undo).toBeDisabled();
  for (const word of ['りす', 'すいか']) {
    await field.fill(word);
    await field.press('Enter');
  }
  await undo.click();
  await expect(page.locator('#chain-word-list')).toHaveText('りす');
  await expect(page.locator('label[for="chain-word"]')).toContainText('次は「す」');
  await expect(field).toBeFocused();
  await field.fill('すずめ');
  await field.press('Enter');
  await expect(page.locator('#chain-word-list')).toHaveText('りす → すずめ');
  await page.locator('#chain-clear').click();
  await expect(undo).toBeDisabled();
});

for (const goal of [21, 30]) {
  test(`${goal}ゲームではゴールを越える手を選べない`, async ({ page }) => {
    await open(page, 'counting-game-30');
    await page.locator(`[data-target="${goal}"]`).click();
    for (let count = 0; count < goal - 3; count += 3) await page.locator('[data-add="3"]').click();
    await page.locator('[data-add="2"]').click();
    await expect(page.locator('[data-add="3"]')).toBeDisabled();
    await expect(page.locator('[data-add="2"]')).toBeDisabled();
    await page.locator('[data-add="1"]').click();
    await expect(page.locator('.result-headline')).toContainText(`${goal} に到達`);
    await page.locator('#btn-count30-retry').click();
    await expect(page.locator('.current-number')).toContainText(`0 / ${goal}`);
  });
}

for (const ballots of [[2, 3, 4, 1], [2, 1, 1, 2]]) {
  const peace = new Set(ballots).size === ballots.length;
  test('秘密投票では全員が投票してから' + (peace ? '処刑なしを発表する' : '同率最多の全員を発表する'), async ({ page }) => {
    await open(page, 'one-night-werewolf');
    await page.clock.install();
    await page.locator('#btn-start-ww').click();
    for (let i = 0; i < ballots.length; i++) {
      await page.locator('#btn-reveal-role').click();
      for (const selector of ['.btn-rob', '.btn-seer-target']) {
        const action = page.locator(selector).first();
        if (await action.count()) await action.click();
      }
      await page.clock.runFor(2100);
      await page.locator('#btn-next-ww-player').click();
    }
    await page.locator('#btn-ww-finish').click();
    await page.locator('#btn-ww-secret-vote').click();
    for (const [i, target] of ballots.entries()) {
      const radio = page.locator('[name="ww-secret-choice"]');
      await expect(page.locator('#tool-mount-point h3')).toContainText('プレイヤー ' + (i + 1));
      await expect(radio).toHaveCount(3);
      await expect(page.locator(`[name="ww-secret-choice"][value="${i + 1}"]`)).toHaveCount(0);
      await expect(page.locator('[name="ww-secret-choice"]:checked')).toHaveCount(0);
      await expect(page.locator('#btn-ww-cast')).toBeDisabled();
      await page.locator(`[name="ww-secret-choice"][value="${target}"]`).check();
      await page.locator('#btn-ww-cast').click();
    }
    await expect(page.locator('#ww-verdict')).toHaveCount(0);
    await page.locator('#btn-open-ww-result').click();
    const outcome = page.locator('#ww-verdict + p');
    if (peace) await expect(outcome).toHaveText('全員1票のため、処刑なし');
    else {
      await expect(outcome).toContainText('プレイヤー 1');
      await expect(outcome).toContainText('プレイヤー 2');
      await expect(outcome).not.toContainText('プレイヤー 3');
      await expect(outcome).not.toContainText('プレイヤー 4');
    }
  });
}

test('画面休止中の経過時間を連打対決とジェスチャーに反映する', async ({ page }) => {
  await open(page, 'duel-mash');
  await page.clock.install();
  await page.locator('#btn-mash-start').click();
  await page.clock.fastForward(18000);
  await expect(page.locator('#btn-mash-retry')).toBeVisible();
  await page.goto('about:blank');
  await open(page, 'silent-gesture');
  await page.locator('#btn-gesture-start').click();
  await page.locator('#btn-gesture-correct').click();
  await page.clock.fastForward(65000);
  await expect(page.locator('.result-headline')).toContainText('1 問正解');
});

test('共通タイマーは一時停止中の時間を除き、復帰後に一度だけ終了する', async ({ page }) => {
  await open(page, 'asa-sore');
  await page.clock.install();
  await page.evaluate(() => {
    window.finishes = 0;
    window.testTimer = new GameTimer({ totalSeconds: 6, onFinish: () => window.finishes++ });
    window.testTimer.start();
  });
  await page.clock.fastForward(2500);
  await page.evaluate(() => window.testTimer.pause());
  await page.clock.fastForward(10000);
  expect(await page.evaluate(() => window.testTimer.remaining)).toBe(4);
  await page.evaluate(() => window.testTimer.start());
  await page.clock.fastForward(5000);
  await page.clock.fastForward(5000);
  expect(await page.evaluate(() => [window.testTimer.remaining, window.finishes])).toEqual([0, 1]);
});

test('古い保存データから得点表とカスタム問題の有効な行を復元する', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('asobi_played_games', '{"old":true}');
    localStorage.setItem('asobi_scoreboard_players', JSON.stringify([null, { name: 'アキ＆ユイ', score: '7' }, false]));
    localStorage.setItem('asobi_custom_topics', JSON.stringify({
      'sea-turtle': [null, '旧形式の問題', {question:'残す問題', answer:'元の答え'}], ito: {}
    }));
  });
  await open(page, 'sea-turtle');
  await openDetailScores(page);
  await expect(page.locator('.score-player-name')).toHaveValue('アキ＆ユイ');
  await page.locator('[data-quality-score="plus"]').click();
  await expect(page.locator('.score-value')).toHaveText('8');
  for (let i = 1; i < 20; i++) await page.locator('#btn-add-player').click();
  await expect(page.locator('#btn-add-player')).toBeDisabled();
  await page.reload();
  await openDetailScores(page);
  await expect(page.locator('.score-player-name')).toHaveCount(20);
  await expect(page.locator('.score-value').first()).toHaveText('8');
  const topics = await page.evaluate(() => {
    const manager = window.TopicManager;
    manager.addCustomTopic('ito', '追加');
    manager.removeCustomTopic('sea-turtle', 0);
    return [manager.getCustomTopics('sea-turtle'), manager.getCustomTopics('ito')];
  });
  expect(topics).toEqual([[{question:'残す問題', answer:'元の答え'}], ['追加']]);
});
