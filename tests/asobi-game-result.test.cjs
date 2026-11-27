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

function loadGamesData() {
  const filePath = path.resolve(__dirname, "../my-webservice/asobi-pocket/data/games.js");
  const source = fs.readFileSync(filePath, "utf8") + "\nwindow.GAMES_DATA = GAMES_DATA;";
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox, { filename: filePath });
  return sandbox.window.GAMES_DATA;
}

const ALL_GAMES = loadGamesData();

test("getConciergeConditionMeta returns clean Japanese labels for all player and mood keys", () => {
  const meta = GameResult.getConciergeConditionMeta("3-4", "mind");
  assert.equal(meta.player.label, "3〜4人");
  assert.equal(meta.mood.label, "心理戦・推理");

  const fallback = GameResult.getConciergeConditionMeta("unknown", "unknown");
  assert.equal(fallback.player.key, "2");
  assert.equal(fallback.mood.key, "laugh");
});

test("rankConciergeGames enforces player eligibility, excludes merged/utility items, and ranks all 12 combinations", () => {
  const playersKeys = ["2", "3-4", "5+"];
  const moodKeys = ["laugh", "chill", "mind", "icebreak"];

  for (const players of playersKeys) {
    for (const mood of moodKeys) {
      const results = GameResult.rankConciergeGames(ALL_GAMES, { players, mood });
      assert.ok(results.length >= 3, `Expected >= 3 matches for ${players} x ${mood}, got ${results.length}`);

      // Verify strict player eligibility, no merged/U tools, descending score order, and non-empty reason
      for (let i = 0; i < results.length; i++) {
        const entry = results[i];
        const g = entry.game;
        assert.notEqual(g.section, "merged", `merged game leaked into ${players} x ${mood}: ${g.id}`);
        assert.notEqual(g.section, "U", `utility tool leaked into ${players} x ${mood}: ${g.id}`);
        if (players === "2") {
          assert.ok(g.minPlayers <= 2 && g.maxPlayers >= 2, `${g.id} invalid for 2 players`);
        } else if (players === "3-4") {
          assert.ok(g.minPlayers <= 4 && g.maxPlayers >= 3, `${g.id} invalid for 3-4 players`);
        } else if (players === "5+") {
          assert.ok(g.maxPlayers >= 5, `${g.id} invalid for 5+ players`);
        }
        assert.ok(entry.reason.length > 0);
        assert.equal(EMOJI_PATTERN.test(entry.reason), false);
        if (i > 0) {
          assert.ok(results[i - 1].score >= entry.score, `Results not sorted descending for ${players} x ${mood}`);
        }
      }
    }
  }
});

test("rankConciergeGames surfaces high-precision domain matches at the top of each mood", () => {
  const twoLaugh = GameResult.rankConciergeGames(ALL_GAMES, { players: "2", mood: "laugh" }).slice(0, 3).map(r => r.game.id);
  assert.ok(twoLaugh.includes("duel-reflex") && twoLaugh.includes("duel-mash"), `2 x laugh top3: ${twoLaugh.join(",")}`);

  const twoMind = GameResult.rankConciergeGames(ALL_GAMES, { players: "2", mood: "mind" }).slice(0, 3).map(r => r.game.id);
  assert.ok(twoMind.includes("indian-poker"), `2 x mind should highlight indian-poker: ${twoMind.join(",")}`);

  const groupMind = GameResult.rankConciergeGames(ALL_GAMES, { players: "3-4", mood: "mind" }).slice(0, 3).map(r => r.game.id);
  assert.ok(groupMind.includes("word-wolf") && groupMind.includes("one-night-werewolf"), `3-4 x mind top3: ${groupMind.join(",")}`);

  const groupChill = GameResult.rankConciergeGames(ALL_GAMES, { players: "3-4", mood: "chill" });
  const groupChillTop3 = groupChill.slice(0, 3).map(r => r.game.id);
  assert.ok(groupChillTop3.includes("ito") && groupChillTop3.includes("talk-gacha"), `3-4 x chill top3: ${groupChillTop3.join(",")}`);
  assert.equal(groupChill.some(r => r.game.id === "bomb-timer" || r.game.id === "duel-mash"), false, "frantic action games should not appear in chill");

  const partyIcebreak = GameResult.rankConciergeGames(ALL_GAMES, { players: "5+", mood: "icebreak" }).slice(0, 3).map(r => r.game.id);
  assert.ok(partyIcebreak.includes("two-truths-one-lie") && partyIcebreak.includes("talk-gacha"), `5+ x icebreak top3: ${partyIcebreak.join(",")}`);

  const partyLaugh = GameResult.rankConciergeGames(ALL_GAMES, { players: "5+", mood: "laugh" }).slice(0, 4).map(r => r.game.id);
  assert.ok(partyLaugh.includes("silent-gesture") && partyLaugh.includes("asa-sore"), `5+ x laugh top4: ${partyLaugh.join(",")}`);
});

test("formatPlayersRange formats single, ranged, and open-ended player counts cleanly without typos", () => {
  assert.equal(GameResult.formatPlayersRange(2, 99), "2人〜");
  assert.equal(GameResult.formatPlayersRange(2, 2), "2人");
  assert.equal(GameResult.formatPlayersRange(3, 10), "3〜10人");
  assert.equal(GameResult.formatPlayersRange(3, 15), "3〜15人");
  for (const game of ALL_GAMES) {
    const label = GameResult.formatPlayersRange(game.minPlayers, game.maxPlayers);
    assert.equal(label.includes("大人数人"), false, `${game.id} produced broken player label: ${label}`);
    assert.match(label, /^\d+(〜\d+人|人〜|人)$/, `${game.id} unexpected player label: ${label}`);
  }
});

test("pickSpotlightTopic returns real, emoji-free presets across multiple games and avoids repeating excludeKey", () => {
  const pool = GameResult.collectSpotlightTopics(ALL_GAMES);
  assert.ok(pool.length >= 40, `Expected rich spotlight topic pool, got ${pool.length}`);
  const gameIds = new Set(pool.map((item) => item.gameId));
  assert.ok(gameIds.has("ito") && gameIds.has("asa-sore") && gameIds.has("talk-gacha") && gameIds.has("katakana-ban"));

  for (const item of pool) {
    assert.ok(item.prompt.length > 0 && item.prompt.length <= 56);
    assert.equal(EMOJI_PATTERN.test(item.prompt), false, `Spotlight prompt contains emoji: ${item.prompt}`);
    assert.equal(EMOJI_PATTERN.test(item.gameLabel), false);
    assert.equal(typeof item.presetIndex, "number");
    assert.ok(item.presetIndex >= 0);
    const sourceGame = ALL_GAMES.find((g) => g.id === item.gameId);
    assert.ok(sourceGame && sourceGame.presets[item.presetIndex] !== undefined, `Missing preset at index ${item.presetIndex} for ${item.gameId}`);
  }

  const first = GameResult.pickSpotlightTopic(ALL_GAMES, { rng: () => 0 });
  assert.ok(first && first.key);
  const second = GameResult.pickSpotlightTopic(ALL_GAMES, { excludeKey: first.key, rng: () => 0 });
  assert.ok(second && second.key);
  assert.notEqual(second.key, first.key);
});


