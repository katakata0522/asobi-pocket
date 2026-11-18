import { test, expect } from '@playwright/test';

test.describe.configure({ timeout: 60000 });

const picks = ['ito','word-wolf','katakana-ban','bomb-timer','asa-sore','sea-turtle','silent-gesture'];
const duels = ['duel-reflex','duel-color','duel-mash'];
const all = [...picks, ...duels, 'ping-pong-pang'];
const home = './?asobi_test=1';
const tool = '#tool-mount-point';

async function press(locator, info) {
  if (info.project.use.hasTouch) await locator.tap();
  else await locator.click();
}

async function play(page, id, info) {
  const button = sel => press(page.locator(sel), info);
  switch (id) {
    case 'ito':
      await button('#btn-start-ito'); await button('#secret-card-box');
      await expect(page.locator('.card-large-number').first()).toBeVisible(); break;
    case 'word-wolf':
      await button('#btn-start-wolf'); await button('#btn-reveal-word');
      await expect(page.locator('.the-word')).toBeVisible(); break;
    case 'katakana-ban':
      await button('#btn-kata-correct');
      await expect(page.locator(tool)).toContainText(/正解数:\s*1/); break;
    case 'bomb-timer':
      await button('#btn-start-bomb'); await button('#btn-pass-bomb');
      await expect(page.locator('#btn-stop-bomb')).toBeVisible(); break;
    case 'asa-sore':
      await button('#btn-toggle-asa-timer'); await expect(page.locator('#btn-toggle-asa-timer')).toContainText('一時停止'); break;
    case 'sea-turtle':
      await button('#btn-toggle-answer'); await expect(page.locator('#answer-box')).toBeVisible(); break;
    case 'silent-gesture':
      await button('#btn-gesture-start'); await button('#btn-gesture-correct');
      await expect(page.locator('.gesture-score-badge')).toContainText('1'); break;
    case 'duel-reflex':
      await button('#btn-duel-start'); await button('#duel-p1-area');
      await expect(page.locator('.duel-score').filter({hasText:'1 / 3'})).toBeVisible(); break;
    case 'duel-color': {
      await button('#btn-color-start');
      const match=await page.locator('.color-target-word').evaluate(el=>{
        const colors={'あか':'rgb(239, 68, 68)','あお':'rgb(59, 130, 246)','みどり':'rgb(34, 197, 94)','きいろ':'rgb(234, 179, 8)','むらさき':'rgb(168, 85, 247)'};
        return getComputedStyle(el).color===colors[el.textContent.trim()];
      });
      await button(match?'#btn-p1-yes':'#btn-p1-no');
      await expect(page.locator('.duel-score').filter({hasText:'1 / 5'})).toBeVisible(); break;
    }
    case 'duel-mash':
      await button('#btn-mash-start'); await button('#mash-p1-btn');
      await expect(page.locator('#mash-p1-btn .mash-count')).toHaveText('連打数: 1'); break;
    case 'ping-pong-pang':
      await expect(page.locator('#btn-pingpong-next')).toBeHidden();
      await button('#pingpong-options summary'); await button('#btn-pingpong-next');
      await expect(page.locator('.pingpong-word')).toContainText('ポン'); break;
  }
}

test('主力7本と2人対決の入口から各ゲームで操作できる', async ({ page }, info) => {
  page.on('dialog',d=>d.accept());
  for (const id of [...picks, ...duels]) {
    await page.goto(home);
    await expect(page.locator('.party-pick')).toHaveCount(7);
    expect(await page.locator('.party-pick').evaluateAll(nodes=>nodes.map(n=>n.dataset.id))).toEqual(picks);
    await expect(page.locator('.duel-hub')).toHaveCount(1);
    await expect(page.locator('.duel-hub .duel-mode-link')).toHaveCount(3);
    await expect(page.locator('#games-grid > .game-card[data-id^="duel-"]')).toHaveCount(0);
    if (duels.includes(id)) {
      await press(page.locator('#jump-to-duels'),info);
      await expect(page.locator('#duel-hub-title')).toBeFocused();
    }
    await press(page.locator('#games-grid a[href="#game/'+id+'"]'),info);
    await expect(page).toHaveURL(new RegExp('#game/'+id+'$')); await play(page,id,info);
  }
});

test('以前のURLと記事の選択お題を直接開いて遊べる', async ({page},info)=>{
  page.on('dialog',d=>d.accept());
  for(const [route,id] of [...all.map(x=>[x,x]),['gem-tap','duel-reflex'],['stroop-effect','duel-color'],['wordwolf','word-wolf']]){
    await page.goto(home+'#game/'+route); await play(page,id,info);
  }
  await page.goto('./seo/wordwolf-odai.html?asobi_test=1');
  await press(page.locator('a.article-topic-link[href$="word-wolf?topic=1"]'),info);
  await expect(page).toHaveURL(/#game\/word-wolf\?topic=1$/);
  await play(page,'word-wolf',info);
  await expect(page.locator('.the-word')).toHaveText(/^(うどん|そば)$/);
});

test('旧版のお気に入り全件から元のゲームを選べる',async ({page},info)=>{
  await page.goto(home);
  await page.evaluate(saved=>localStorage.setItem('asobi_favorites',saved),info.project.metadata.savedFavorites ?? JSON.stringify(all));
  await page.reload();page.on('dialog',d=>d.accept());
  const mobile=page.locator('#btm-nav-fav');
  await press(await mobile.isVisible()?mobile:page.locator('#btn-toggle-fav-filter'),info);
  for(const id of all){
    await expect(page.locator('#filter-result-count')).toHaveText('お気に入り 11件');
    await press(page.locator('#games-grid a[href="#game/'+id+'"]'),info);
    await play(page,id,info);await press(page.locator('#btn-back-home'),info);
  }
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('asobi_favorites')));
  expect(saved).toEqual(all);
});

test('モード別の★、旧別名と統合済みURLのお気に入りを保持する',async ({page},info)=>{
  await page.goto(home);
  await page.evaluate(()=>localStorage.setItem('asobi_favorites','["gem-tap","duel-reflex","stroop-effect","two-choices"]'));
  await page.reload();
  const mash=page.locator('.duel-hub [data-action="fav"][data-id="duel-mash"]');
  await press(mash,info); await expect(mash).toHaveAttribute('aria-pressed','true');
  const fav=page.locator('#btm-nav-fav');
  await press(await fav.isVisible()?fav:page.locator('#btn-toggle-fav-filter'),info);
  await expect(page.locator('#filter-result-count')).toHaveText('お気に入り 4件');
  for(const id of [...duels,'two-choices'])await expect(page.locator('#games-grid a[href="#game/'+id+'"]')).toBeVisible();
  await press(page.locator('.btn-card-fav[data-id="duel-color"]'),info);
  await expect(page.locator('#filter-result-count')).toHaveText('お気に入り 3件');
  await expect(page.locator('.btn-card-fav[data-id="duel-reflex"]')).toBeVisible();
});

test('補助設定を閉じたまま自動進行でき、手動送りとリセットも使える',async({page},info)=>{
  await page.goto(home+'#game/ping-pong-pang');await page.clock.install();
  const summary=page.locator('#pingpong-options summary'), manual=page.locator('#btn-pingpong-next');
  await expect(manual).toBeHidden();await press(page.locator('#btn-pingpong-auto'),info);
  await page.clock.runFor(650);await expect(page.locator('.pingpong-combo')).not.toHaveText('コンボ: 0 回');
  await press(page.locator('#btn-pingpong-auto'),info);await press(summary,info);await press(manual,info);
  await press(page.locator('#btn-pingpong-reset'),info);await expect(manual).toBeVisible();
  await expect(page.locator('.pingpong-combo')).toHaveText('コンボ: 0 回');
  await press(summary,info);await expect(manual).toBeHidden();
});
