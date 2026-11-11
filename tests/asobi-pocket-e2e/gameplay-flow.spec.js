import { test, expect } from './playwright-runtime.js';

/**
 * Every registered game gets its own browser test instead of one monolithic test.
 * Each case starts real UI interaction; full-round scenarios below cover deeper state.
 * Never send synthetic data to production GA4.
 */
test.beforeEach(async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', route =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
});

const cases = [
  { id: 'ito', click: '#btn-start-ito', after: '#secret-card-box' },
  { id: 'asa-sore', click: '#btn-shuffle-both' },
  { id: 'word-wolf', click: '#btn-start-wolf', after: '#btn-reveal-word' },
  { id: 'duel-reflex', click: '#btn-duel-start' },
  { id: 'duel-mash', click: '#btn-mash-start' },
  { id: 'duel-color', click: '#btn-color-start' },
  { id: 'bomb-timer', click: '#btn-start-bomb' },
  { id: 'katakana-ban', click: '#btn-kata-pass' },
  { id: 'finger-roulette', gesture: 'virtual-fingers' },
  { id: 'two-choices', click: '#btn-next-choice' },
  { id: 'sea-turtle', click: '#btn-toggle-answer' },
  { id: 'ten-seconds', click: '#btn-sw-start' },
  { id: 'talk-gacha', click: '#btn-spin-gacha' },
  { id: 'ng-word', click: '#btn-p1-said' },
  { id: 'indian-poker', click: '#btn-p2-bet' },
  { id: 'one-night-werewolf', click: '#btn-start-ww', after: '#btn-reveal-role' },
  { id: 'yomibito', fill: ['#input-kami', 'あさおきて'], click: '#btn-submit-kami', after: '#input-naka' },
  { id: 'batsu-roulette', click: '#btn-batsu-pass' },
  { id: 'rhythm-box', click: '#btn-next-yamanote-topic' },
  { id: 'yamanote-game', click: '#btn-toggle-rhythm' },
  { id: 'stand-up-game', click: '#btn-next-parent' },
  { id: 'ping-pong-pang', click: '#btn-pingpong-next' },
  { id: 'takenoko-nyokki', click: '#btn-takenoko-next' },
  { id: 'high-and-low-guess', fill: ['#input-highlow-guess', '50'], click: '#btn-highlow-submit' },
  { id: 'magical-banana', click: '#btn-next-banana-word' },
  { id: 'twenty-questions', click: '#btn-log-yes' },
  { id: 'good-and-bad-news', click: '#btn-next-turn' },
  { id: 'counting-game-30', click: '[data-add="1"]' },
  { id: 'word-chain-limit', click: '#btn-next-rule' },
  { id: 'two-truths-one-lie', click: '#btn-suggest-prompt' },
  { id: 'doremi-song', click: '#btn-next-doremi' },
  { id: 'silent-gesture', click: '#btn-gesture-start' }
];

for (const scenario of cases) {
  test(scenario.id + ': actual initial game interaction remains usable', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/#game/' + scenario.id);
    const tool = page.locator('#tool-mount-point');
    await expect(page.locator('#view-detail')).toBeVisible();
    await expect(tool).toBeVisible();
    if (scenario.fill) await tool.locator(scenario.fill[0]).fill(scenario.fill[1]);

    if (scenario.gesture === 'virtual-fingers') {
      const area = tool.locator('#touch-area');
      const box = await area.boundingBox();
      expect(box).not.toBeNull();
      await page.mouse.click(box.x + box.width * 0.25, box.y + box.height * 0.5);
      await page.mouse.click(box.x + box.width * 0.75, box.y + box.height * 0.5);
    } else {
      const button = tool.locator(scenario.click).first();
      await expect(button, scenario.id + ': missing action').toBeVisible();
      await button.click();
    }

    if (scenario.after) await expect(tool.locator(scenario.after)).toBeVisible();
    await expect(tool).toBeVisible();
    const content = (await tool.innerText()).trim();
    if (scenario.gesture === 'virtual-fingers') {
      await expect(tool.locator('#roulette-canvas')).toBeVisible();
      await expect(tool.locator('#roulette-overlay')).toHaveClass(/hidden/);
      await expect(page.locator('#toast-container')).toContainText('決定しました', { timeout: 4_000 });
    } else {
      expect(content.length).toBeGreaterThan(10);
    }
    expect(content).not.toContain('[object Object]');
    expect(errors, scenario.id + ': client errors after starting').toEqual([]);
  });
}

test('Ito: deal four private cards, reveal one by one, judge and replay', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/#game/ito');
  await page.locator('#btn-start-ito').click();
  for (let i = 0; i < 4; i++) {
    await expect(page.locator('.passing-header')).toContainText(String(i + 1) + '/4');
    await page.locator('#secret-card-box').click();
    await expect(page.locator('.secret-card-revealed')).toBeVisible();
    await page.locator('#btn-ito-next-person').click();
  }
  await expect(page.locator('#ito-sortable-list .ito-card-item')).toHaveCount(4);
  await page.locator('#btn-ito-open-cards').click();
  await expect(page.locator('.ito-result-card-item')).toHaveCount(4);
  await page.locator('#btn-ito-retry').click();
  await expect(page.locator('#btn-start-ito')).toBeVisible();
});

test('Word Wolf: all four roles dealt, a player voted, final role and replay', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/#game/word-wolf');
  await page.locator('#btn-start-wolf').click();
  for (let i = 0; i < 4; i++) {
    await page.locator('#btn-reveal-word').click();
    await expect(page.locator('#secret-word-card')).toBeVisible();
    await page.locator('#btn-next-player').click();
  }
  await expect(page.locator('#wolf-timer-display')).toBeVisible();
  await page.locator('#btn-finish-talk').click();
  await page.locator('.btn-vote-target').first().click();
  await page.locator('#btn-open-roles').click();
  await expect(page.locator('.roles-list')).toBeVisible();
  await page.locator('#btn-restart-wolf').click();
  await expect(page.locator('#btn-start-wolf')).toBeVisible();
});

test('One Night Werewolf: three private roles, discussion, vote, result and retry', async ({ page }) => {
  test.setTimeout(75_000);
  await page.goto('/#game/one-night-werewolf');
  await page.locator('#range-ww-players').evaluate(el => {
    el.value = '3';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#btn-start-ww').click();
  for (let i = 0; i < 3; i++) {
    await page.locator('#btn-reveal-role').click();
    await expect(page.locator('#secret-role-card')).toBeVisible();
    const next = page.locator('#btn-next-ww-player');
    await expect(next).toBeEnabled({ timeout: 5_000 });
    await next.click();
  }
  await expect(page.locator('#ww-talk-timer')).toBeVisible();
  await page.locator('#btn-ww-finish').click();
  // Each participant casts one private vote. Cycle p1→p2→p3→p1
  // so all players receive one vote and nobody is executed.
  for (let i = 0; i < 3; i++) {
    const nextId = ((i + 1) % 3) + 1;
    await page.locator('.btn-ww-vote-target[data-vote-id="' + nextId + '"]').click();
    await page.locator('#btn-ww-confirm-vote').click();
  }
  await expect(page.locator('#btn-open-ww-result')).toBeVisible();
  await page.locator('#btn-open-ww-result').click();
  await expect(page.locator('.roles-list .role-item')).toHaveCount(3);
  await expect(page.locator('#tool-mount-point')).toContainText('処刑なし');
  await page.locator('#btn-restart-ww').click();
  await expect(page.locator('#btn-start-ww')).toBeVisible();
});

test('High & Low: binary search succeeds using displayed range, then resets', async ({ page }) => {
  await page.goto('/#game/high-and-low-guess');
  let solved = false;
  for (let step = 0; step < 12; step++) {
    if (await page.locator('#btn-highlow-restart').isVisible().catch(() => false)) { solved = true; break; }
    const label = (await page.locator('.range-text').innerText()).match(/(\d+)\s*[〜～]\s*(\d+)/);
    expect(label, 'range label missing').not.toBeNull();
    const mid = Math.floor((Number(label[1]) + Number(label[2])) / 2);
    await page.locator('#input-highlow-guess').fill(String(mid));
    await page.locator('#btn-highlow-submit').click();
  }
  expect(solved || await page.locator('#btn-highlow-restart').isVisible()).toBe(true);
  await page.locator('#btn-highlow-restart').click();
  await expect(page.locator('.attempt-badge')).toContainText('0回');
});

test('20 Questions: answers are logged and reset clears every entry', async ({ page }) => {
  await page.goto('/#game/twenty-questions');
  await page.locator('#btn-log-yes').click();
  await page.locator('#btn-log-no').click();
  await expect(page.locator('.remaining-count')).toContainText('18 / 20');
  await expect(page.locator('.history-list .log-item')).toHaveCount(2);
  await page.locator('#btn-reset-twenty').click();
  await expect(page.locator('.remaining-count')).toContainText('20 / 20');
  await expect(page.locator('.history-list .log-item')).toHaveCount(0);
});

test('Yomibito: three sequential private submissions create a poem', async ({ page }) => {
  await page.goto('/#game/yomibito');
  for (const [field,button,value] of [
    ['#input-kami','#btn-submit-kami','あさおきて'],
    ['#input-naka','#btn-submit-naka','ともだちにあう'],
    ['#input-shimo','#btn-submit-shimo','うれしいな']
  ]) {
    await page.locator(field).fill(value);
    await page.locator(button).click();
  }
  await expect(page.locator('#btn-restart-haiku')).toBeVisible();
  await expect(page.locator('#tool-mount-point')).toContainText('あさおきて');
  await page.locator('#btn-restart-haiku').click();
  await expect(page.locator('#input-kami')).toBeVisible();
});

test('Takenoko: counter never exceeds participant count', async ({ page }) => {
  await page.goto('/#game/takenoko-nyokki');
  await page.locator('#range-takenoko').evaluate(el => {
    el.value = '3';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  for (let i = 0; i < 3; i++) await page.locator('#btn-takenoko-next').click();
  await expect(page.locator('#btn-takenoko-next')).toBeDisabled();
  await expect(page.locator('.takenoko-count')).toContainText('3 ニョッキ');
  await page.locator('#btn-takenoko-reset').click();
  await expect(page.locator('#btn-takenoko-next')).toBeEnabled();
});


test('Count to 21/30 cannot overshoot and keeps its result until restart', async ({ page }) => {
  await page.goto('/#game/counting-game-30');
  await page.locator('[data-target="21"]').click();
  for (let n = 0; n < 6; n++) await page.locator('[data-add="3"]').click();
  await expect(page.locator('.current-number')).toContainText('18 / 21');
  await expect(page.locator('[data-add="3"]')).toBeEnabled();
  await page.locator('[data-add="3"]').click();
  await expect(page.locator('.current-number')).toContainText('21 / 21');
  await expect(page.locator('#tool-mount-point [role="status"]')).toContainText('決着');
  await expect(page.locator('[data-add="1"]')).toBeDisabled();
  await page.locator('#btn-reset-count30').click();
  await expect(page.locator('.current-number')).toContainText('0 / 21');
});

test('20 Questions records optional questions as inert text, not just yes/no', async ({ page }) => {
  await page.goto('/#game/twenty-questions');
  const payload = '<svg onload=alert(1)>';
  await page.locator('#input-twenty-question').fill(payload);
  await page.locator('#btn-log-yes').click();
  await expect(page.locator('.history-list')).toContainText(payload);
  await expect(page.locator('.history-list svg')).toHaveCount(0);
  await expect(page.locator('.remaining-count')).toContainText('19 / 20');
  await page.locator('#btn-reset-twenty').click();
  await expect(page.locator('.history-list .log-item')).toHaveCount(0);
});

test('Indian Poker never reveals before both decisions', async ({ page }) => {
  await page.goto('/#game/indian-poker');
  await expect(page.locator('#btn-poker-open')).toBeDisabled();
  await page.locator('#btn-p1-bet').click();
  await expect(page.locator('#btn-poker-open')).toBeDisabled();
  await page.locator('#btn-p2-bet').click();
  await expect(page.locator('#btn-poker-open')).toBeEnabled();
  await page.locator('#btn-poker-open').click();
  await expect(page.locator('#btn-poker-next')).toBeVisible();
  const cards = await page.locator('.poker-duel-center').innerText();
  const dealt = cards.match(/P1: \[([^\]]+)\] vs P2: \[([^\]]+)\]/);
  expect(dealt).not.toBeNull();
  expect(dealt[1]).not.toBe(dealt[2]);
  await page.locator('#btn-poker-next').click();
  await expect(page.locator('#btn-poker-open')).toBeDisabled();
});

test('Two Truths requires real stories and reveals text safely', async ({ page }) => {
  await page.goto('/#game/two-truths-one-lie');
  await page.locator('#btn-shuffle-truths').click();
  await expect(page.locator('#input-ep1')).toBeVisible();
  await page.locator('#input-ep1').fill('私は料理が好きです');
  await page.locator('#input-ep2').fill('<svg onload=alert(1)>');
  await page.locator('#input-ep3').fill('月に住んでいました');
  await page.locator('#btn-shuffle-truths').click();
  await expect(page.locator('.btn-check-lie')).toHaveCount(3);
  await expect(page.locator('#tool-mount-point svg')).toHaveCount(0);
  await page.locator('.btn-check-lie').first().click();
  await expect(page.locator('.topic-box').first()).toContainText(/本当|嘘/);
  await page.locator('#btn-restart-truths').click();
  await expect(page.locator('#btn-shuffle-truths')).toBeVisible();
});

test('Talk Gacha choice votes increment both counters while muted', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/#game/talk-gacha');
  await page.locator('[data-talkmode="choices"]').click();
  await page.locator('#btn-vote-a').click();
  await page.locator('#btn-vote-b').click();
  await expect(page.locator('#btn-vote-a')).toContainText('(1)');
  await expect(page.locator('#btn-vote-b')).toContainText('(1)');
  await page.locator('#btn-choice-next').click();
  await expect(page.locator('#btn-vote-a')).toContainText('(0)');
  await expect(page.locator('#btn-vote-b')).toContainText('(0)');
  expect(errors).toEqual([]);
});

test('Word chain stores unique used words locally and permits undo', async ({ page }) => {
  await page.goto('/#game/word-chain-limit');
  await page.locator('#input-wordchain-word').fill('りんご');
  await page.locator('#btn-wordchain-add').click();
  await expect(page.locator('#wordchain-used-list')).toContainText('りんご');
  await page.locator('#input-wordchain-word').fill('りんご');
  await page.locator('#btn-wordchain-add').click();
  await expect(page.locator('#wordchain-used-list .badge')).toHaveCount(1);
  await page.locator('#btn-wordchain-undo').click();
  await expect(page.locator('#wordchain-used-list')).toContainText('まだ記録はありません');
});
