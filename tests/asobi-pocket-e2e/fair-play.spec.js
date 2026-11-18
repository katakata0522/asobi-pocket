import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page, baseURL }) => {
  const origin = new URL(baseURL).origin;
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  page.on('dialog', dialog => dialog.accept());
});
const open = (page, id = '') => page.goto('./?asobi_test=1' + (id ? '#game/' + id : ''));

for (const [topic, pairs] of [
  ['シャンパン', [['しゃんぱん',true],['ｼｬﾝﾊﾟﾝ',true],['ビール',false],['麦酒',false],['シャン',false],['ワイン',false]]],
  ['ビール', [['麦酒',true],['びーる',true],['シャンパン',false],['発泡酒',false]]],
  ['トンボ', [['ヤンマ',true],['やんま',true],['鬼ヤンマ',false],['オニヤンマ',false],['チョウ',false]]],
]) {
  test(topic + 'を配ったラウンドでのみ別表記を認める', async ({ page }) => {
    await open(page, 'word-wolf');
    if (topic === 'トンボ') {
      await page.locator('[data-tab="presets"]').click();
      await page.locator('#btn-open-topic-custom').click();
      await page.locator('#custom-topic-text').fill('トンボ / チョウ');
      await page.locator('#custom-topic-text').press('Enter');
      await expect(page.locator('.custom-preset-card')).toContainText('トンボ');
      await page.locator('[data-tab="tool"]').click();
    }
    for (const [answer, win] of pairs) {
      await page.locator('#range-player-count').press('Home');
      // 抽選だけを固定。以降は通常の配布、投票、入力、採点を通る。
      await page.evaluate(target => {
        const game = GAMES_DATA.find(g => g.id === 'word-wolf');
        const pool = getActiveTopicsForGame(game.id, game.presets).map(p => typeof p === 'string' ? customWolfPair(p) : p);
        const idx = pool.findIndex(p => p.citizen === target || p.wolf === target);
        if (idx < 0) throw Error(target);
        const draws = [(idx + 0.25) / pool.length, pool[idx].citizen === target ? 0.1 : 0.9, 0.1];
        const random = Math.random;
        Math.random = () => new Error().stack.split('\n')[2]?.includes('tool-fixes.js') && draws.length ? draws.shift() : random();
        try { document.querySelector('#btn-start-wolf').click(); } finally { Math.random = random; }
      }, topic);
      const words = [];
      for (let i=0; i<3; i++) {
        await page.locator('#btn-reveal-word').click();
        words.push(await page.locator('.the-word').innerText());
        await page.locator('#btn-next-player').click();
      }
      expect(words.filter(w => w === topic)).toHaveLength(2);
      await page.locator('#btn-finish-talk').click();
      await page.locator('.btn-vote-target').nth(words.findIndex(w => w !== topic)).click();
      await page.locator('#btn-open-roles').click();
      await page.locator('#input-wolf-guess').fill(answer);
      await page.locator('#input-wolf-guess').press('Enter');
      await expect(page.locator('#wolf-guess-result-msg')).toContainText(win ? '逆転勝利' : '市民側の勝利');
      await page.locator('#btn-restart-wolf').click();
    }
  });
}

test('同じ読みの検索、人数と場面の組み合わせ、クリア', async ({ page }) => {
  await open(page);
  await page.locator('#discovery-filters summary').click();
  const input = page.locator('#search-input');
  async function ids(q) {
    await input.fill(q);
    await expect(page.locator('#active-filter-summary .condition-chip').filter({hasText:'検索：'+q})).toBeVisible();
    return page.locator('.game-card').evaluateAll(cards => cards.map(c => c.dataset.id));
  }
  const beer = await ids('ビール');
  expect(beer).toContain('word-wolf');
  expect(await ids('麦酒')).toEqual(beer);
  expect(await ids('びーる')).toEqual(beer);
  for (const q of ['しゃんぱん','ｼｬﾝﾊﾟﾝ','ﾜｰﾄﾞｳﾙﾌ']) expect(await ids(q)).toContain('word-wolf');
  expect(await ids('ｉｔｏ')).toContain('ito');
  expect(await ids('あさまでそれせいかい')).toContain('asa-sore');
  const group = await ids('飲み会 2人');
  expect(group.length).toBeGreaterThan(0);
  expect(await ids('２人 飲み会')).toEqual(group);
  await page.locator('#btn-clear-search').click();
  await expect(input).toHaveValue('');
});

test('ポーカーは1人ずつ確認し、選択がそろうまで伏せる',async ({page})=>{
  await open(page,'indian-poker');
  const cards=page.locator('.playing-card');
  for (let i=0;i<2;i++) {
    await expect(cards).toHaveCount(0);
    await expect(page.locator('#btn-poker-open')).toHaveCount(0);
    await page.locator('#poker-reveal').click();
    await expect(cards).toHaveCount(1);
    await page.locator('#poker-hide').click();
  }
  await page.locator('#poker-begin-choices').click();
  await page.locator('#poker-reveal').click();
  await page.locator('#btn-p1-fold').click();
  await expect(cards).toHaveCount(0);
  await expect(page.locator('#tool-mount-point')).not.toContainText('降りた');
  await expect(page.locator('#btn-poker-open')).toHaveCount(0);
  await page.locator('#poker-reveal').click();
  await page.locator('#btn-p2-bet').click();
  await page.locator('#btn-poker-open').click();
  await expect(page.locator('#tool-mount-point')).toContainText('PLAYER 2の不戦勝');
  await page.locator('#btn-poker-next').click();
  await expect(cards).toHaveCount(0);
});

test('数当て、自己紹介、合意回答の入力',async ({page})=>{
  await open(page,'high-and-low-guess');
  for(const value of ['101','2.8','0']) {
    await page.locator('#input-highlow-guess').fill(value);
    await page.locator('#input-highlow-guess').press('Enter');
    await expect(page.locator('.attempt-badge')).toContainText('0回');
  }
  await page.locator('#input-highlow-guess').fill('50');
  await page.locator('#input-highlow-guess').press('Enter');
  await expect(page.locator('.attempt-badge')).toContainText('1回');
  await open(page,'two-truths-one-lie');
  await page.locator('#input-ep1').fill('旅に出た');
  await page.locator('#btn-shuffle-truths').click();
  await expect(page.locator('#input-ep2')).toBeFocused();
  await expect(page.locator('#input-ep1')).toHaveValue('旅に出た');
  await page.locator('#input-ep2').fill('料理した');
  await page.locator('#input-ep3').fill('泳いだ');
  await page.locator('#btn-shuffle-truths').click();
  await expect(page.locator('.btn-check-lie')).toHaveCount(3);
  await open(page,'asa-sore?topic=8');
  await expect(page.locator('#asa-all-kana')).not.toBeChecked();
  await page.locator('#asa-all-kana').check();
  await expect(page.locator('.asa-topic-main')).toHaveText('職業');
  await page.locator('#input-asa-answer').fill('塗師');
  await page.locator('#input-asa-answer').press('Enter');
  await expect(page.locator('.history-a')).toContainText('塗師');
});

test('旧自作問題を補完して保存、再読み込み後に問題と真相を個別に表示',async ({page})=>{
  await open(page,'sea-turtle');
  await page.evaluate(()=>TopicManager.addCustomTopic('sea-turtle','扉を開けたのはなぜ？'));
  await page.reload();
  await page.locator('#btn-prev-q').click();
  await expect(page.locator('.puzzle-num')).toContainText('22 / 22');
  await page.locator('[data-tab="presets"]').click();
  await page.locator('[data-edit-quiz]').click();
  await expect(page.locator('#custom-topic-text')).toHaveValue('扉を開けたのはなぜ？');
  await page.locator('#custom-topic-answer').fill('友達を迎えるため。');
  await page.locator('#custom-topic-form button').click();
  await expect(page.locator('[data-edit-quiz]')).toHaveText('問題を編集');
  await page.reload();
  await page.locator('#btn-prev-q').click();
  await expect(page.locator('.puzzle-num')).toContainText('23 / 23');
  await expect(page.locator('.puzzle-question-box')).toContainText('扉を開けたのはなぜ？');
  await expect(page.locator('#answer-box')).toBeHidden();
  await page.locator('#btn-toggle-answer').click();
  await expect(page.locator('#answer-box')).toContainText('友達を迎えるため。');
});

test('紹介された上限人数で全員に配る',async ({page})=>{
  await open(page,'word-wolf');
  await page.locator('#range-player-count').press('End');
  await page.locator('#btn-start-wolf').click();
  for (let i=1;i<=10;i++) {
    await expect(page.locator('.pass-indicator')).toContainText(i+' / 10');
    await page.locator('#btn-reveal-word').click();
    await page.locator('#btn-next-player').click();
  }
  await expect(page.locator('#btn-finish-talk')).toBeVisible();
  await open(page,'one-night-werewolf');
  await page.clock.install();
  await page.locator('#range-ww-players').press('End');
  await expect(page.locator('#ww-deck-count')).toHaveText('9');
  await page.locator('#btn-start-ww').click();
  for (let i=1;i<=7;i++) {
    await expect(page.locator('.pass-indicator')).toContainText(i+' / 7');
    await page.locator('#btn-reveal-role').click();
    await page.clock.runFor(2100);
    await page.locator('#btn-next-ww-player').click();
  }
  await expect(page.locator('#btn-ww-finish')).toBeVisible();
});

test('問題文・真相・ヒントと記事のお題を照合する',async ({page})=>{
  await open(page,'sea-turtle');
  for (const [i, clue, answer] of [
    [2,'ザック','仲間が自分で脱いだ'],[4,'野原','パラシュート'],
    [11,'沖','浅瀬'],[12,'手紙','郵便配達員'],[14,'ガラス','金魚'],
  ]) {
    while (!(await page.locator('.puzzle-num').innerText()).includes('問題 '+(i+1)+' /')) {
      await page.locator('#btn-next-q').click();
    }
    await expect(page.locator('.puzzle-title, .puzzle-question-box').filter({hasText:clue}).first()).toBeVisible();
    await expect(page.locator('.puzzle-title')).not.toContainText(/パラシュート|水槽/);
    await page.locator('#btn-toggle-answer').click();
    await expect(page.locator('#answer-box')).toContainText(answer);
  }
  await open(page,'sea-turtle?topic=5');
  await expect(page.locator('.puzzle-question-box')).toContainText('端末');
  await open(page,'ito?topic=14');
  await expect(page.locator('#ito-topic-display')).toContainText('旅行先で使えたら便利な能力');
  await open(page,'word-chain-limit');
  await page.locator('[data-tab="presets"]').click();
  await expect(page.locator('#pane-presets')).toContainText('しろくま ➔ くまのみ ➔ のみもの');
  await open(page,'talk-gacha');
  const light=await page.evaluate(()=>GAMES_DATA.find(g=>g.id==='talk-gacha').presets.filter(p=>p.category==='ライト').map(p=>p.text));
  await page.locator('[data-cat="ライト"]').click();
  for(let i=0;i<=light.length;i++){
    expect(light).toContain((await page.locator('.gacha-text').innerText()).trim());
    await page.locator('#btn-spin-gacha').click();
  }
  await open(page,'katakana-ban');
  await page.locator('[data-tab="rules"]').click();
  await expect(page.locator('#pane-rules')).toContainText('「お肉」は使えます');
  const hints=await page.evaluate(()=>GAMES_DATA.find(g=>g.id==='katakana-ban').presets.map(p=>p.hint));
  expect(new Set(hints).size).toBe(60);
  expect(hints.join('')).not.toMatch(/[ァ-ヶー]/);
});
