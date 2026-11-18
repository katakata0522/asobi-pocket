import { test, expect } from '@playwright/test';

const open = (page, id) => page.goto('./?asobi_test=1#game/' + id);
const button = (page, id) => page.locator('#' + id).click();

test('席の名前と番号は手渡し・投票・再戦で一致する', async ({page}) => {
  await open(page, 'word-wolf');
  await button(page,'btn-detail-scoreboard');
  await page.locator('.score-player-name').first().fill('アキ');
  await button(page,'btn-close-scoreboard');
  await page.locator('#range-player-count').press('Home');
  await page.locator('#tool-mount-point summary').click();
  await page.locator('[data-seat="1"]').fill('ユイ');
  await button(page,'btn-start-wolf');
  for (const name of ['アキ（1番）','ユイ（2番）','プレイヤー 3']) {
    await expect(page.locator('.player-turn-title')).toContainText(name);
    await expect(page.locator('#secret-word-card')).toBeHidden();
    await button(page,'btn-reveal-word'); await button(page,'btn-next-player');
  }
  await button(page,'btn-finish-talk');
  await expect(page.locator('.vote-instruction')).toContainText('同票');
  await page.getByRole('button',{name:/ユイ（2番）/}).click();
  await button(page,'btn-open-roles');
  await expect(page.locator('#tool-mount-point')).toContainText('ユイ（2番）');
  await button(page,'btn-restart-wolf');
  await expect(page.locator('[data-seat="1"]')).toHaveValue('ユイ');
});

for (const peace of [false, true]) {
  test('人狼の最終役職と投票を照合する ' + (peace ? '全員1票' : '同率処刑'), async ({page}) => {
    await open(page,'one-night-werewolf'); await page.clock.install();
    await page.locator('#range-ww-players').press('Home');
    await page.locator('#tool-mount-point summary').click();
    await page.locator('[data-seat="0"]').fill('ソラ');
    await button(page,'btn-start-ww');
    for(let i=0;i<3;i++){
      if(i===0) await expect(page.locator('.player-turn-title')).toContainText('ソラ（1番）');
      await expect(page.locator('#secret-role-card')).toBeHidden();
      await button(page,'btn-reveal-role');
      if(await page.locator('.btn-rob').count()) await page.locator('.btn-rob').first().click();
      await page.clock.runFor(2100); await button(page,'btn-next-ww-player');
    }
    await button(page,'btn-ww-finish');
    await expect(page.locator('#btn-open-ww-result')).toBeDisabled();
    await page.locator('[data-voted="1"]').check(); await page.locator('[data-voted="2"]').check();
    if(peace) {
      await page.locator('#ww-peace').check();
      await expect(page.locator('[data-voted="1"]')).not.toBeChecked();
    }
    await button(page,'btn-open-ww-result');
    const wolves=await page.locator('.role-item.is-wolf .role-player').allInnerTexts();
    const caught=wolves.some(n=>n.includes('ソラ')||n==='プレイヤー 2');
    const expected=peace ? (wolves.length?'人狼チーム':'全員の勝利') : caught?'村人チーム':wolves.length?'人狼チーム':'全員敗北';
    await expect(page.locator('#ww-verdict')).toContainText(expected);
    await expect(page.locator('#ww-verdict + p')).toContainText(peace?'処刑なし':'ソラ（1番）');
  });
}

test('NGワードの引き分けを確定し、8人分の札を隣の人だけに見せる', async ({page}) => {
  await open(page,'ng-word'); await page.clock.install();
  for(let i=0;i<2;i++){await button(page,'ng-reveal');await button(page,'ng-hide');}
  await button(page,'btn-duel-timer-toggle');
  for(let second=0;second<180;second++) await page.clock.fastForward(1000);
  await expect(page.locator('#tool-mount-point')).toContainText('引き分け');
  await expect(page.locator('#btn-p2-said')).toBeDisabled();
  await expect(page.locator('#btn-duel-timer-toggle')).toHaveCount(0);
  await button(page,'btn-ng-duel-next');await expect(page.locator('#ng-reveal')).toBeVisible();
  await page.locator('[data-ngmode="gacha"]').click();
  await page.locator('#range-ng-gacha-count').press('End');
  for(let i=0;i<8;i++){
    await expect(page.locator('.ng-slip')).toHaveCount(0);
    await button(page,'ng-slip-open');
    await expect(page.locator('.ng-slip')).toHaveCount(1);
    await expect(page.locator('#tool-mount-point')).toContainText('プレイヤー '+((i+1)%8+1)+' 用の札');
    await button(page,'ng-slip-next');
  }
  await expect(page.locator('#tool-mount-point')).toContainText('全員の札ができました');
});

test('ポーカーの利得を3局累計し新しい対戦は0点から', async ({page}) => {
  await open(page,'indian-poker');
  for(let round=1;round<=3;round++){
    for(let i=0;i<2;i++){await button(page,'poker-reveal');await button(page,'poker-hide');}
    await button(page,'poker-begin-choices');await button(page,'poker-reveal');await button(page,'btn-p1-fold');
    await expect(page.locator('.playing-card')).toHaveCount(0);
    await button(page,'poker-reveal');await button(page,'btn-p2-bet');await button(page,'btn-poker-open');
    await expect(page.locator('#tool-mount-point')).toContainText('合計：P1 -'+round+'点 ／ P2 '+round+'点');
    if(round===3) await expect(page.locator('#poker-champion')).toContainText('PLAYER 2');
    await button(page,'btn-poker-next');
  }
  await expect(page.locator('#tool-mount-point')).toContainText('第1局');
});

test('指スマは当たりで上限が減り、勝ち抜いた人を再指名しない',async ({page})=>{
  await open(page,'stand-up-game');await page.locator('#range-standup-players').press('Home');
  await button(page,'stand-hit');await expect(page.locator('#tool-mount-point')).toContainText('0〜3');
  await button(page,'btn-next-parent');await button(page,'stand-hit');
  await expect(page.locator('#tool-mount-point')).toContainText('最後に残ったのはプレイヤー 2');
  await button(page,'stand-restart');await expect(page.locator('#tool-mount-point')).toContainText('0〜4');
});

test('20の扉は別のお題を伏せて新局を開始する',async ({page})=>{
  await open(page,'twenty-questions');await button(page,'btn-draw-secret');
  await expect(page.locator('.secret-topic-display')).toHaveCount(0);
  await button(page,'btn-toggle-secret');await expect(page.locator('.secret-topic-display')).toBeVisible();
  await button(page,'btn-toggle-secret');await button(page,'btn-log-yes');
  page.once('dialog',d=>d.dismiss());await button(page,'btn-draw-secret');await expect(page.locator('.log-item')).toHaveCount(1);
  page.once('dialog',d=>d.accept());await button(page,'btn-draw-secret');await expect(page.locator('.log-item')).toHaveCount(0);
  await expect(page.locator('.remaining-count')).toContainText('20 / 20');
  await expect(page.locator('.secret-topic-display')).toHaveCount(0);
});

test('ジェスチャーのお題は演じる間だけ表示する',async ({page})=>{
  await open(page,'silent-gesture');await page.clock.install();
  const topic=page.locator('#tool-mount-point .topic-text');
  await expect(topic).toHaveCount(0);
  await button(page,'btn-gesture-start');await expect(topic).toBeVisible();
  await button(page,'btn-gesture-correct');
  for(let i=0;i<60;i++) await page.clock.fastForward(1000);
  await expect(topic).toHaveCount(0);await button(page,'btn-gesture-retry');
  await expect(page.locator('.gesture-score-badge')).toContainText('0');
});

test('12人のニョッキが最後の1人で止まり、被りでも結果を保持する',async ({page})=>{
  await open(page,'takenoko-nyokki');await page.locator('#range-takenoko').press('End');
  await expect(page.locator('#range-takenoko')).toHaveValue('12');
  for(let i=0;i<11;i++) await button(page,'btn-takenoko-next');
  await expect(page.locator('#tool-mount-point')).toContainText('残り1人');
  await expect(page.locator('#btn-takenoko-next')).toBeDisabled();
  await button(page,'btn-takenoko-reset');await button(page,'btn-takenoko-foul');
  await expect(page.locator('#btn-takenoko-next')).toBeDisabled();
  await expect(page.locator('#tool-mount-point')).toContainText('同時に声を出した人がアウト');
});
