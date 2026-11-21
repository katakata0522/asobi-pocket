const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadGameResult() {
  const filePath = path.resolve(__dirname, "../my-webservice/asobi-pocket/js/game-result.js");
  const source = fs.readFileSync(filePath, "utf8");
  const sandbox = {};
  sandbox.globalThis = sandbox;
  vm.runInNewContext(source, sandbox, { filename: filePath });
  return sandbox.GameResult;
}

const GameResult = loadGameResult();

const EMOJI_PATTERN = /[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/u;

test("judgeTenSeconds aligns exact judgment with 2-decimal rounded display", () => {
  const exact = GameResult.judgeTenSeconds(10.0, 10);
  assert.equal(exact.tier, "just");
  assert.equal(exact.displaySec, "10.00");
  assert.equal(exact.signedDiff, "±0.00秒");
  assert.equal(exact.celebrate, true);

  const roundedUpExact = GameResult.judgeTenSeconds(9.996, 10);
  assert.equal(roundedUpExact.displaySec, "10.00");
  assert.equal(roundedUpExact.tier, "just");
  assert.equal(roundedUpExact.celebrate, true);

  const roundedDownExact = GameResult.judgeTenSeconds(10.004, 10);
  assert.equal(roundedDownExact.displaySec, "10.00");
  assert.equal(roundedDownExact.tier, "just");

  const nearJust = GameResult.judgeTenSeconds(9.88, 10);
  assert.equal(nearJust.tier, "pro");
  assert.equal(nearJust.signedDiff, "-0.12秒");
  assert.equal(nearJust.celebrate, true);

  const close = GameResult.judgeTenSeconds(10.35, 10);
  assert.equal(close.tier, "close");
  assert.equal(close.signedDiff, "+0.35秒");
  assert.equal(close.celebrate, false);

  const missEarly = GameResult.judgeTenSeconds(8.9, 10);
  assert.equal(missEarly.tier, "miss");
  assert.equal(missEarly.verdict, "すこし早め");
  assert.equal(missEarly.signedDiff, "-1.10秒");
  assert.equal(missEarly.celebrate, false);

  const missLate = GameResult.judgeTenSeconds(11.25, 10);
  assert.equal(missLate.tier, "miss");
  assert.equal(missLate.verdict, "すこし遅め");
  assert.equal(missLate.signedDiff, "+1.25秒");
});

test("judgeItoOrder validates ascending sequences, ties, and out-of-order indexes", () => {
  const perfect = GameResult.judgeItoOrder([{ val: 12 }, { val: 37 }, { val: 88 }]);
  assert.equal(perfect.isPerfect, true);
  assert.deepEqual(Array.from(perfect.errorIndexes), []);
  assert.equal(perfect.correctCount, 3);

  const withTie = GameResult.judgeItoOrder([{ val: 20 }, { val: 20 }, { val: 55 }]);
  assert.equal(withTie.isPerfect, true);
  assert.deepEqual(Array.from(withTie.errorIndexes), []);

  const broken = GameResult.judgeItoOrder([{ val: 10 }, { val: 72 }, { val: 45 }, { val: 90 }]);
  assert.equal(broken.isPerfect, false);
  assert.deepEqual(Array.from(broken.errorIndexes), [2]);
  assert.equal(broken.correctCount, 3);
  assert.equal(broken.total, 4);
});

test("judgeWordWolfOutcome covers pending reverse chance, citizen win, reverse win, and wolf win", () => {
  const pending = GameResult.judgeWordWolfOutcome({ votedRole: "wolf", guessCorrect: null });
  assert.equal(pending.tone, "pending");
  assert.equal(pending.shouldCelebrate, false);

  const citizenWin = GameResult.judgeWordWolfOutcome({ votedRole: "wolf", guessCorrect: false });
  assert.equal(citizenWin.tone, "win");
  assert.equal(citizenWin.shouldCelebrate, true);

  const reverseWin = GameResult.judgeWordWolfOutcome({ votedRole: "wolf", guessCorrect: true });
  assert.equal(reverseWin.tone, "wolf");
  assert.equal(reverseWin.shouldCelebrate, true);

  const wolfEscaped = GameResult.judgeWordWolfOutcome({ votedRole: "citizen", guessCorrect: null });
  assert.equal(wolfEscaped.tone, "wolf");
  assert.equal(wolfEscaped.shouldCelebrate, true);
});

test("judgeOneNightOutcome avoids celebration on total defeat in peace village execution", () => {
  const peaceWin = GameResult.judgeOneNightOutcome({ hasWerewolf: false, peaceVote: true, caughtWerewolf: false });
  assert.equal(peaceWin.tone, "win");
  assert.equal(peaceWin.shouldCelebrate, true);

  const peaceWolfWin = GameResult.judgeOneNightOutcome({ hasWerewolf: true, peaceVote: true, caughtWerewolf: false });
  assert.equal(peaceWolfWin.tone, "wolf");
  assert.equal(peaceWolfWin.shouldCelebrate, true);

  const villageWin = GameResult.judgeOneNightOutcome({ hasWerewolf: true, peaceVote: false, caughtWerewolf: true });
  assert.equal(villageWin.tone, "win");
  assert.equal(villageWin.shouldCelebrate, true);

  const wolfWin = GameResult.judgeOneNightOutcome({ hasWerewolf: true, peaceVote: false, caughtWerewolf: false });
  assert.equal(wolfWin.tone, "wolf");
  assert.equal(wolfWin.shouldCelebrate, true);

  const totalDefeat = GameResult.judgeOneNightOutcome({ hasWerewolf: false, peaceVote: false, caughtWerewolf: false });
  assert.equal(totalDefeat.tone, "lose");
  assert.equal(totalDefeat.shouldCelebrate, false);
});

test("judgeDuelMash handles KO, time-up victory, and draw cleanly", () => {
  const p1Ko = GameResult.judgeDuelMash(42, 18, 100);
  assert.equal(p1Ko.winner, 1);
  assert.equal(p1Ko.isKo, true);
  assert.equal(p1Ko.shouldCelebrate, true);

  const p2Ko = GameResult.judgeDuelMash(19, 44, 0);
  assert.equal(p2Ko.winner, 2);
  assert.equal(p2Ko.isKo, true);

  const p1TimeUp = GameResult.judgeDuelMash(51, 47, 58);
  assert.equal(p1TimeUp.winner, 1);
  assert.equal(p1TimeUp.isKo, false);

  const draw = GameResult.judgeDuelMash(30, 30, 50);
  assert.equal(draw.winner, 0);
  assert.equal(draw.tone, "neutral");
  assert.equal(draw.shouldCelebrate, false);
});

test("renderResultCard escapes untrusted text and renders emoji-free editorial markup", () => {
  const html = GameResult.renderResultCard({
    tone: "win",
    eyebrow: "ゲーム終了",
    title: "市民チームの勝利 <script>alert(1)</script>",
    subtitle: 'お題 "りんご" を守り抜きました',
    metrics: [
      { label: "記録", value: "10.00秒" },
      { label: "誤差", value: "±0.00秒" }
    ],
    note: "もう1回遊べます",
    actionsHtml: '<button type="button" id="btn-retry">もう一度</button>'
  });

  assert.equal(html.includes("<script>"), false);
  assert.equal(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"), true);
  assert.equal(html.includes("result-stage result-tone-win"), true);
  assert.equal(html.includes("<svg class=\"result-crest-svg\""), true);
  assert.equal(EMOJI_PATTERN.test(html), false);
});
