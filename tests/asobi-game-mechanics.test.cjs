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

function loadGamesData() {
  const filePath = path.resolve(__dirname, "../my-webservice/asobi-pocket/data/games.js");
  const source = fs.readFileSync(filePath, "utf8");
  const sandbox = { window: {} };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(`${source}\n;globalThis.__GAMES_DATA = typeof GAMES_DATA !== "undefined" ? GAMES_DATA : window.GAMES_DATA;`, sandbox, { filename: filePath });
  return sandbox.__GAMES_DATA;
}

const GameResult = loadGameResult();
const GAMES_DATA = loadGamesData();

test("dealIndianPokerPair never deals identical card+suit even under constant RNG", () => {
  const forcedZero = GameResult.dealIndianPokerPair(() => 0);
  assert.notEqual(
    `${forcedZero.p1Suit}${forcedZero.p1Card}`,
    `${forcedZero.p2Suit}${forcedZero.p2Card}`
  );

  const forcedHigh = GameResult.dealIndianPokerPair(() => 0.99999);
  assert.notEqual(
    `${forcedHigh.p1Suit}${forcedHigh.p1Card}`,
    `${forcedHigh.p2Suit}${forcedHigh.p2Card}`
  );

  for (let i = 0; i < 500; i++) {
    const deal = GameResult.dealIndianPokerPair();
    assert.ok(deal.p1Card >= 1 && deal.p1Card <= 13);
    assert.ok(deal.p2Card >= 1 && deal.p2Card <= 13);
    assert.notEqual(
      `${deal.p1Suit}${deal.p1Card}`,
      `${deal.p2Suit}${deal.p2Card}`
    );
  }
});

test("validateWordChainEntry enforces empty, duplicate, kana chain, small kana, prolonged marks, and 'ん' endings", () => {
  assert.equal(GameResult.validateWordChainEntry("   ", []).reason, "empty");

  const first = GameResult.validateWordChainEntry("りんご", []);
  assert.equal(first.ok, true);
  assert.equal(first.nextKana, "ご");

  const dup = GameResult.validateWordChainEntry("リンゴ", ["りんご"]);
  assert.equal(dup.ok, false);
  assert.equal(dup.reason, "duplicate");

  const mismatch = GameResult.validateWordChainEntry("すいか", ["りんご"]);
  assert.equal(mismatch.ok, false);
  assert.equal(mismatch.reason, "mismatch");
  assert.equal(mismatch.expected, "ご");
  assert.equal(mismatch.actual, "す");

  const endsWithN = GameResult.validateWordChainEntry("ごりらん", ["りんご"]);
  assert.equal(endsWithN.ok, false);
  assert.equal(endsWithN.reason, "ends_with_n");

  // 小書き文字（しゃ -> や）
  const smallKana = GameResult.validateWordChainEntry("やきにく", ["でんしゃ"]);
  assert.equal(smallKana.ok, true);
  assert.equal(smallKana.nextKana, "く");

  // 長音記号（カー -> か）
  const prolonged = GameResult.validateWordChainEntry("からす", ["パトカー"]);
  assert.equal(prolonged.ok, true);
  assert.equal(prolonged.nextKana, "す");
});

test("splitRhythmBoxTopics cleanly separates Yamanote categories and Magical Banana words", () => {
  const getText = (item) => (typeof item === "string" ? item : item?.text || "");
  const rhythmGame = GAMES_DATA.find((g) => g.id === "rhythm-box");
  assert.ok(rhythmGame, "rhythm-box game exists");

  const split = GameResult.splitRhythmBoxTopics(rhythmGame.presets, GAMES_DATA);
  assert.ok(split.yamanote.length >= 25, "yamanote topics populated");
  assert.ok(split.banana.length >= 45, "magical banana presets populated");

  const yamanoteTexts = split.yamanote.map(getText);
  const bananaTexts = split.banana.map(getText);

  // 山手線お題にマジカルバナナ単体ワード「バナナ」「りんご」が混入しないこと
  assert.equal(yamanoteTexts.includes("バナナ"), false);
  assert.equal(yamanoteTexts.includes("りんご"), false);
  assert.equal(bananaTexts.includes("バナナ"), true);
});

test("data/games.js audited preset quality and integrity across party games", () => {
  const byId = new Map(GAMES_DATA.map((g) => [g.id, g]));
  const getText = (item) => (typeof item === "string" ? item : item?.text || "");

  // 1. ito: 70 presets, all have (1: ... 100: ...), broken scales removed, concrete-ruler themes present
  const ito = byId.get("ito");
  assert.ok(ito.presets.length >= 70, `expected >= 70 ito presets, got ${ito.presets.length}`);
  const itoTexts = ito.presets.map(getText);
  for (const preset of itoTexts) {
    assert.match(preset, /1:/, `ito preset missing 1: scale -> ${preset}`);
    assert.match(preset, /100:/, `ito preset missing 100: scale -> ${preset}`);
  }
  assert.equal(itoTexts.some((p) => p.includes("地球を滅ぼす")), false);
  assert.equal(itoTexts.some((p) => p.includes("生き物の大きさ")), true);

  // 2. word-wolf: no identical citizen/wolf and removed antonym pairs are gone
  const wordWolf = byId.get("word-wolf");
  const bannedAntonyms = new Set(["暑い|寒い", "寒い|暑い", "大人|子供", "子供|大人", "勝つ|負ける", "朝|夜"]);
  for (const pair of wordWolf.presets) {
    assert.notEqual(pair.citizen, pair.wolf, `identical word-wolf pair: ${pair.citizen}`);
    assert.equal(bannedAntonyms.has(`${pair.citizen}|${pair.wolf}`), false, `antonym pair found: ${pair.citizen}/${pair.wolf}`);
  }

  // 3. katakana-ban: every target word actually contains katakana
  const katakana = byId.get("katakana-ban");
  for (const item of katakana.presets) {
    assert.match(item.word, /[\u30A0-\u30FF]/, `katakana-ban word lacks katakana: ${item.word}`);
  }

  // 4. bomb-timer: no duplicate topics
  const bomb = byId.get("bomb-timer");
  const bombTexts = bomb.presets.map(getText);
  assert.equal(new Set(bombTexts).size, bombTexts.length, "bomb-timer has duplicate topics");

  // 5. two-choices: no duplicate pairs & crude outlier removed
  const twoChoices = byId.get("two-choices");
  const choiceKeys = twoChoices.presets.map(getText);
  assert.equal(new Set(choiceKeys).size, choiceKeys.length, "two-choices has duplicate pairs");
  assert.equal(choiceKeys.some((p) => p.includes("う◯こ")), false);

  // 6. sea-turtle: fixed puzzles present
  const seaTurtle = byId.get("sea-turtle");
  const titles = seaTurtle.presets.map((p) => p.title);
  assert.equal(titles.includes("同じ誕生日のふたり"), true);
  assert.equal(titles.includes("止まった電気時計"), true);
  const rope = seaTurtle.presets.find((p) => p.title === "切られたロープ");
  assert.ok(rope && rope.answer.includes("宙吊り") && rope.answer.includes("上の仲間"), "切られたロープ puzzle should have consistent climbing geometry");

  // 7. ng-word: deduplicated and no bare legacy 'Twitter'
  const ngWord = byId.get("ng-word");
  const ngTexts = ngWord.presets.map(getText);
  assert.equal(new Set(ngTexts).size, ngTexts.length, "ng-word has duplicates");
  assert.equal(ngTexts.some((t) => /\bTwitter\b/.test(t) && !t.includes("X（旧Twitter）")), false);
  assert.equal(ngTexts.some((t) => t.includes("X（旧Twitter）")), true);

  // 8. batsu-roulette: #37 fixed (no broken stray wording)
  const batsu = byId.get("batsu-roulette");
  const batsuTexts = batsu.presets.map(getText);
  assert.equal(batsuTexts.some((p) => p.includes("37")), false);
});
