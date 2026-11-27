/**
 * あそびポケット (Asobi Pocket)
 * ゲームマスター・実践アシストツール集（プロ仕様・エフェクト＆トースト完全統合版）
 */

// 安全タイマーラッパー（SafeTimer連携・ライフサイクル自動破棄）
const safeSetInterval = (fn, ms) => (window.SafeTimer ? window.SafeTimer.setInterval(fn, ms) : setInterval(fn, ms));
const safeClearInterval = (id) => (window.SafeTimer ? window.SafeTimer.clearInterval(id) : clearInterval(id));
const safeSetTimeout = (fn, ms) => (window.SafeTimer ? window.SafeTimer.setTimeout(fn, ms) : setTimeout(fn, ms));
const safeClearTimeout = (id) => (window.SafeTimer ? window.SafeTimer.clearTimeout(id) : clearTimeout(id));

function escapeHTML(str) {
  if (typeof str !== "string") return String(str || "");
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderSoundHintMarkup() {
  const isMuted = typeof Sound !== "undefined" ? Boolean(Sound.isMuted) : false;
  return `<div class="tool-sound-hint${isMuted ? "" : " hidden"}" data-sound-hint>
    <span class="tool-sound-hint-text">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></svg>
      今は音なしです
    </span>
    <button type="button" class="btn-sound-hint-enable" data-enable-sound>音をONにする</button>
  </div>`;
}

function bindSoundHintInContainer(container) {
  const sync = () => {
    const isMuted = typeof Sound !== "undefined" ? Boolean(Sound.isMuted) : false;
    container.querySelectorAll("[data-sound-hint]").forEach((el) => {
      el.classList.toggle("hidden", !isMuted);
    });
  };
  const onClick = (e) => {
    const btn = e.target.closest("[data-enable-sound]");
    if (!btn) return;
    if (typeof window.enableAsobiSound === "function") {
      window.enableAsobiSound();
    } else if (typeof Sound !== "undefined") {
      Sound.isMuted = false;
      Sound.playClick?.();
    }
    sync();
  };
  container.addEventListener("click", onClick);
  window.addEventListener("asobi:sound-change", sync);
  return () => {
    container.removeEventListener("click", onClick);
    window.removeEventListener("asobi:sound-change", sync);
  };
}

// 得点表に名前がある席はその名前で始める。ゲーム内の変更はその卓で保持する。
function tableRoster() {
  const edits = [];
  function scoreNames() {
    try {
      const saved = JSON.parse(localStorage.getItem("asobi_scoreboard_players") || "[]");
      return Array.isArray(saved) ? saved.map(p => String(p?.name || "").trim()) : [];
    } catch { return []; }
  }
  function nameAt(index, scores) {
    const name = edits[index] ?? scores[index] ?? "";
    return name.replace(/\s/g, "") === "プレイヤー" + (index + 1) ? "" : name;
  }
  return {
    mount(container, count) {
      const holder = container.querySelector(".table-roster");
      const scores = scoreNames();
      holder.innerHTML = Array.from({length: count}, (_, i) =>
        `<label class="table-seat">${i + 1}番 <input maxlength="24" type="text" data-seat="${i}" value="${escapeHTML(nameAt(i, scores))}" placeholder="名前（任意）"></label>`
      ).join("");
      holder.oninput = event => {
        if (event.target.matches("[data-seat]")) edits[Number(event.target.dataset.seat)] = event.target.value;
      };
    },
    labels(count) {
      const scores = scoreNames();
      return Array.from({length: count}, (_, i) => {
        const name = nameAt(i, scores).trim();
        return name ? `${name}（${i + 1}番）` : `プレイヤー ${i + 1}`;
      });
    }
  };
}

function toHiragana(str) {
  if (!str) return "";
  return String(str)
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[\u30a1-\u30f6]/g, m => String.fromCharCode(m.charCodeAt(0) - 0x60));
}

// お題単位の別表記。分類名や部分一致から他のお題へは広げない。
const answerNames = [
  ["ビール", "麦酒"],
  ["シャンパン", "シャンペン", "シャンパーニュ"],
  ["トンボ", "蜻蛉"],
  ["うどん", "饂飩"],
  ["そば", "蕎麦"],
  ["コーヒー", "珈琲"],
  ["紅茶", "こうちゃ"],
  ["X (Twitter)", "X", "エックス", "Twitter", "ツイッター"],
  ["カッパ（レインコート）", "カッパ", "合羽", "レインコート"],
  ["LINE", "ライン"],
  ["YouTube", "ユーチューブ"],
  ["TikTok", "ティックトック"],
  ["Netflix", "ネットフリックス"],
  ["りんご", "林檎"],
  ["なし", "梨"],
  ["いちご", "苺"],
  ["さくらんぼ", "サクランボウ", "桜桃"],
  ["餃子", "ぎょうざ", "ギョーザ"],
  ["からあげ", "唐揚げ", "から揚げ", "唐揚"],
  ["焼肉", "焼き肉", "やきにく"],
  ["すき焼き", "すきやき", "鋤焼き"],
  ["おにぎり", "お握り", "おむすび"],
  ["牛乳", "ぎゅうにゅう"],
  ["豆乳", "とうにゅう"],
  ["お好み焼き", "おこのみやき"],
  ["犬", "いぬ"],
  ["猫", "ねこ"],
  ["雨", "あめ"],
  ["雪", "ゆき"],
  ["海", "うみ"],
  ["山", "やま"],
  ["朝", "あさ"],
  ["夜", "よる"],
  ["水族館", "すいぞくかん"],
  ["動物園", "どうぶつえん"],
  ["映画館", "えいがかん"],
  ["遊園地", "ゆうえんち"],
  ["電車", "でんしゃ"],
  ["鉛筆", "えんぴつ"],
  ["シャープペン", "シャープペンシル", "シャーペン"],
  ["リュック", "リュックサック"],
  ["ポテトチップス", "ポテチ"],
  ["会議", "かいぎ"],
  ["授業", "じゅぎょう"],
  ["昼休み", "ひるやすみ"],
  ["放課後", "ほうかご"],
  ["コピー機", "こぴーき", "複写機"],
  ["先輩", "せんぱい"],
  ["上司", "じょうし"],
  ["宿題", "しゅくだい"],
  ["在宅", "ざいたく"],
  ["出社", "しゅっしゃ"],
  ["温泉", "おんせん"],
  ["旅館", "りょかん"],
  ["高原", "こうげん"],
  ["新幹線", "しんかんせん"],
  ["飛行機", "ひこうき"],
  ["お土産", "おみやげ"],
  ["美術館", "びじゅつかん"],
  ["博物館", "はくぶつかん"],
  ["地図", "ちず"],
  ["海外旅行", "かいがいりょこう"],
  ["国内旅行", "こくないりょこう"],
  ["誕生日会", "たんじょうびかい"],
  ["忘年会", "ぼうねんかい"],
  ["写真", "しゃしん"],
  ["動画", "どうが"],
  ["電話", "でんわ"],
  ["ビデオ通話", "びでおつうわ"],
  ["朝食", "ちょうしょく", "朝ご飯", "朝ごはん", "あさごはん"],
  ["夜食", "やしょく"],
  ["推理小説", "すいりしょうせつ"],
  ["ホラー小説", "ほらーしょうせつ"],
  ["スポーツ観戦", "すぽーつかんせん"],
  ["早起き", "はやおき"],
  ["夜更かし", "夜ふかし", "よふかし"],
  ["手料理", "てりょうり"],
  ["外食", "がいしょく"],
  ["事前相談", "じぜんそうだん"],
  ["予約", "よやく"],
  ["約束", "やくそく"],
  ["趣味", "しゅみ"],
  ["特技", "とくぎ"],
  ["応援", "おうえん"],
  ["励まし", "はげまし"],
  ["休憩", "きゅうけい"],
  ["気分転換", "きぶんてんかん"],
  ["憧れ", "あこがれ"],
  ["尊敬", "そんけい"],
  ["予定", "よてい"],
  ["目標", "もくひょう"],
  ["相談", "そうだん"],
  ["報告", "ほうこく"],
  ["緊張", "きんちょう"],
  ["集中", "しゅうちゅう"],
  ["安心", "あんしん"],
  ["満足", "まんぞく"],
  ["経験", "けいけん"],
  ["思い出", "おもいで", "想い出"],
  ["居酒屋", "いざかや"],
  ["ファミレス", "ファミリーレストラン"],
  ["合コン", "ごうこん", "合同コンパ"],
  ["街コン", "まちこん"],
  ["スマホ", "スマートフォン"],
  ["ノートパソコン", "ノートPC", "ノートピーシー"],
  ["マクドナルド", "マック", "マクド"],
  ["初デート", "はつでーと"],
  ["記念日デート", "きねんびでーと"],
  ["告白", "こくはく"],
  ["カレーライス", "カレー"],
  ["歯ブラシ", "はぶらし"],
  ["電動歯ブラシ", "でんどうはぶらし"],
  ["革靴", "かわぐつ"],
  ["焼き鳥", "焼鳥", "やきとり"],
  ["串カツ", "串かつ", "くしかつ"],
  ["朝寝坊", "あさねぼう"],
  ["有給休暇", "ゆうきゅうきゅうか", "有休", "有給"],
  ["休日出勤", "きゅうじつしゅっきん"],
  ["昇給", "しょうきゅう"],
  ["別れ話", "わかればなし"],
  ["ケンカ", "喧嘩"],
  ["一目惚れ", "一目ぼれ", "ひとめぼれ"],
  ["運命の出会い", "うんめいのであい"],
  ["同棲", "どうせい"],
  ["お化け屋敷", "おばけやしき"],
  ["富士山", "ふじさん"],
  ["花火大会", "はなびたいかい"],
  ["夏祭り", "なつまつり"],
  ["お正月", "おしょうがつ", "正月", "しょうがつ"],
  ["大晦日", "おおみそか"],
  ["自転車", "じてんしゃ"],
  ["電動キックボード", "でんどうきっくぼーど"],
  ["小説", "しょうせつ"],
  ["漫画", "まんが"],
  ["傘", "かさ"],
];
const namesByTopic = new Map();
for (const variants of answerNames) {
  const names = variants.map(toHiragana);
  for (const name of names) namesByTopic.set(name, names);
}

function customWolfPair(value) {
  if (typeof value !== "string") return null;
  const pair = value.split(/\s*[／/＆&]\s*/).map(word => word.trim());
  if (pair.length !== 2 || !pair.every(Boolean) || matchesTopicAnswer(pair[0], pair[1]) || matchesTopicAnswer(pair[1], pair[0])) return null;
  return {citizen: pair[0], wolf: pair[1], category: "自作のお題"};
}

function matchesTopicAnswer(topic, answer) {
  const expected = toHiragana(topic);
  const input = toHiragana(answer);
  if (!input) return false;
  const names = namesByTopic.get(expected) || [expected];
  // このお題について認める呼び方。分類全体への相互置換にはしない。
  if (names.includes("とんぼ") && input === "やんま") return true;
  return names.includes(input);
}

function topicSearchText(value) {
  const text = toHiragana(value);
  const entries = text.split(/\s+(?:&|vs|\/)\s+/i);
  return [text, ...entries.flatMap(entry => namesByTopic.get(entry.trim()) || [])].join(" ");
}

// 山札（デッキ）マネージャー：同じお題の連続出現を100%防止（全件引ききったら再シャッフル＆境界重複防止）
const DeckManager = {
  decks: new Map(),
  lastItems: new Map(),
  getNext(gameId, items) {
    if (!items || items.length === 0) return null;
    if (items.length === 1) return items[0];

    let deck = this.decks.get(gameId);
    if (!deck || deck.length === 0) {
      // 新しい山札を作成してFisher-Yatesシャッフル
      deck = [...items];
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      // リシャッフル直後に前回の最後のお題と同じものが先頭に来ないようにガード
      const last = this.lastItems.get(gameId);
      if (last && deck[deck.length - 1] === last && deck.length > 1) {
        [deck[0], deck[deck.length - 1]] = [deck[deck.length - 1], deck[0]];
      }
      this.decks.set(gameId, deck);
    }
    const item = deck.pop();
    this.lastItems.set(gameId, item);
    return item;
  },
  reset(gameId) {
    this.decks.delete(gameId);
    this.lastItems.delete(gameId);
  }
};

function getActiveTopicsForGame(gameId, presets, selectedScene = "all") {
  let list = presets || [];
  if (typeof window !== "undefined" && window.TopicManager) {
    list = window.TopicManager.getActiveTopics(gameId, presets);
  }
  if (selectedScene && selectedScene !== "all") {
    const filtered = list.filter(item => {
      if (typeof item === "object" && item.scene) {
        return item.scene === selectedScene;
      }
      return true;
    });
    if (filtered.length > 0) return filtered;
  }
  return list;
}

function drawShuffledTopic(gameId, presets, selectedScene = "all") {
  const list = getActiveTopicsForGame(gameId, presets, selectedScene);
  if (list.length === 0) return null;
  return DeckManager.getNext(`${gameId}_${selectedScene}`, list);
}

function extractTopicText(item) {
  if (!item) return "";
  if (typeof item === "string") return item;
  return item.text || item.title || item.question || JSON.stringify(item);
}

// ===================================================
// 統一ゲームタイマーエンジン（SafeTimer & Sound自動連携）
// ===================================================
class GameTimer {
  constructor({ totalSeconds = 60, onTick = null, onFinish = null, tickSoundInterval = null, title = null, gameId = null, isFloating = false }) {
    this.totalSeconds = totalSeconds;
    this.remaining = totalSeconds;
    this.isRunning = false;
    this.timerId = null;
    this.onTick = onTick;
    this.onFinish = onFinish;
    this.tickSoundInterval = tickSoundInterval;
    this.title = title;
    this.gameId = gameId;
    this.isFloating = isFloating;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    if (!this.isFloating) {
      GameTimer.activeTimer = this;
    }
    this.timerId = safeSetInterval(() => {
      this.remaining--;
      if (this.tickSoundInterval && this.remaining <= this.tickSoundInterval && this.remaining > 0) {
        if (typeof Sound !== "undefined" && typeof Sound.playTick === "function") {
          Sound.playTick(900);
        }
      }
      if (typeof this.onTick === "function") {
        this.onTick(this.remaining, this.totalSeconds);
      }
      if (this.remaining <= 0) {
        this.stop();
        if (typeof this.onFinish === "function") {
          this.onFinish();
        }
      }
    }, 1000);
  }

  pause() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (GameTimer.activeTimer === this) {
      GameTimer.activeTimer = null;
    }
    if (this.timerId) {
      safeClearInterval(this.timerId);
      this.timerId = null;
    }
  }

  toggle() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
    return this.isRunning;
  }

  reset(newSeconds = this.totalSeconds) {
    this.pause();
    this.totalSeconds = newSeconds;
    this.remaining = newSeconds;
    if (typeof this.onTick === "function") {
      this.onTick(this.remaining, this.totalSeconds);
    }
  }

  stop() {
    this.pause();
  }

  destroy() {
    this.stop();
    if (GameTimer.activeTimer === this) {
      GameTimer.activeTimer = null;
    }
    this.onTick = null;
    this.onFinish = null;
  }
}
GameTimer.activeTimer = null;

// グローバル公開（アプリ全体・テスト・SEO連動で安全に共有）
if (typeof window !== "undefined") {
  window.escapeHTML = escapeHTML;
  window.DeckManager = DeckManager;
  window.drawShuffledTopic = drawShuffledTopic;
  window.extractTopicText = extractTopicText;
  window.GameTimer = GameTimer;
}

const GameTools = {
  // ===================================================
  // 0-A. ito（イト・価値観連想ゲーム）
  // ===================================================
  renderIto(container, game) {
    let state = {
      playerCount: 4,
      cardsPerPlayer: 1,
      step: "setup", // setup, passing, talk, result
      isOpening: false,
      selectedScene: "all",
      players: [],
      playerNames: ["プレイヤー1", "プレイヤー2", "プレイヤー3", "プレイヤー4"],
      currentPlayerIdx: 0,
      selectedTopic: "",
      placedOrder: []
    };

    function getRandomTopic() {
      const item = drawShuffledTopic(game.id, game.presets, state.selectedScene);
      return extractTopicText(item) || "人気の食べ物 (1: 不人気 〜 100: 国民的大人気)";
    }

    state.selectedTopic = game.articleTopic?.text || getRandomTopic();

    function update() {
      if (state.step === "setup") {
        container.innerHTML = `
          <div class="tool-card">
            <h3 class="tool-title">ito（イト）設定</h3>

            <details class="tool-optional-settings">
              <summary>お題の場面を変える<span aria-hidden="true">⌄</span></summary>
              <div class="setting-group">
                <label class="setting-label">シーン別お題フィルター:</label>
                <div class="scene-filter-tabs">
                  <button class="btn-scene ${state.selectedScene === 'all' ? 'active' : ''}" data-scene="all">全て</button>
                  <button class="btn-scene ${state.selectedScene === 'party' ? 'active' : ''}" data-scene="party">飲み会・合コン</button>
                  <button class="btn-scene ${state.selectedScene === 'friends' ? 'active' : ''}" data-scene="friends">友達・ドライブ</button>
                  <button class="btn-scene ${state.selectedScene === 'family' ? 'active' : ''}" data-scene="family">家族・子供</button>
                  <button class="btn-scene ${state.selectedScene === 'work' ? 'active' : ''}" data-scene="work">職場・アイスブレイク</button>
                </div>
              </div>
            </details>

            <div class="setting-group">
              <label class="setting-label">参加人数: <span id="val-ito-players" class="badge-num">${state.playerCount}人</span></label>
              <input type="range" class="range-slider" min="2" max="8" value="${state.playerCount}" id="range-ito-players">
            </div>

            <details class="player-custom-accordion">
              <summary class="player-custom-summary">プレイヤー名を個別設定する (任意)</summary>
              <div class="player-names-grid mt-2" id="ito-player-inputs">
                ${Array.from({ length: state.playerCount }, (_, i) => `
                  <input type="text" class="input-player-name" data-idx="${i}" value="${escapeHTML(state.playerNames[i] || 'プレイヤー' + (i + 1))}" placeholder="名前 ${i + 1}">
                `).join('')}
              </div>
            </details>

            <details class="tool-optional-settings">
              <summary>カード枚数：${state.cardsPerPlayer}枚<span aria-hidden="true">⌄</span></summary>
              <div class="setting-group">
                <label class="setting-label">1人のカード枚数:</label>
                <div class="btn-toggle-group">
                  <button class="btn-toggle ${state.cardsPerPlayer === 1 ? 'active' : ''}" data-cards="1">1枚 (通常)</button>
                  <button class="btn-toggle ${state.cardsPerPlayer === 2 ? 'active' : ''}" data-cards="2">2枚 (上級)</button>
                </div>
              </div>
            </details>

            <div class="topic-box mb-4">
              <span class="topic-tag">今回のお題</span>
              <div class="topic-text" id="ito-topic-display">${escapeHTML(state.selectedTopic)}</div>
              <button class="btn btn-sm btn-outline mt-2" id="btn-ito-next-topic">お題を変える</button>
            </div>

            <button class="btn btn-primary btn-block btn-lg" id="btn-start-ito">
              数字を配る
            </button>
          </div>
        `;

        container.querySelectorAll(".btn-scene").forEach(btn => {
          btn.addEventListener("click", () => {
            Sound.playClick();
            state.selectedScene = btn.dataset.scene;
            state.selectedTopic = getRandomTopic();
            update();
          });
        });

        const range = container.querySelector("#range-ito-players");
        range.addEventListener("input", (e) => {
          state.playerCount = parseInt(e.target.value, 10);
          while (state.playerNames.length < state.playerCount) {
            state.playerNames.push(`プレイヤー${state.playerNames.length + 1}`);
          }
          container.querySelector("#val-ito-players").textContent = `${state.playerCount}人`;
          update();
        });

        container.querySelectorAll(".input-player-name").forEach(inp => {
          inp.addEventListener("input", (e) => {
            const idx = parseInt(e.target.dataset.idx, 10);
            state.playerNames[idx] = e.target.value.trim() || `プレイヤー${idx + 1}`;
          });
        });

        container.querySelectorAll("[data-cards]").forEach(btn => {
          btn.addEventListener("click", () => {
            Sound.playClick();
            state.cardsPerPlayer = parseInt(btn.dataset.cards, 10);
            update();
          });
        });

        container.querySelector("#btn-ito-next-topic").addEventListener("click", () => {
          Sound.playClick();
          state.selectedTopic = getRandomTopic();
          container.querySelector("#ito-topic-display").textContent = state.selectedTopic;
        });

        container.querySelector("#btn-start-ito").addEventListener("click", () => {
          Sound.playSelect();
          const totalCards = state.playerCount * state.cardsPerPlayer;
          const nums = [];
          while (nums.length < totalCards) {
            const rand = Math.floor(Math.random() * 100) + 1;
            if (!nums.includes(rand)) nums.push(rand);
          }

          state.players = [];
          let cardIdx = 0;
          for (let p = 0; p < state.playerCount; p++) {
            const pCards = [];
            for (let c = 0; c < state.cardsPerPlayer; c++) {
              pCards.push(nums[cardIdx++]);
            }
            pCards.sort((a, b) => a - b);
            state.players.push({
              id: p + 1,
              name: state.playerNames[p] || `プレイヤー${p + 1}`,
              numbers: pCards
            });
          }

          state.currentPlayerIdx = 0;
          state.isOpening = false;
          state.step = "passing";
          update();
          container.querySelector("#secret-card-box")?.focus();
        });
      } else if (state.step === "passing") {
        const curPlayer = state.players[state.currentPlayerIdx];
        const progress = Math.round(((state.currentPlayerIdx) / state.playerCount) * 100);

        container.innerHTML = `
          <div class="tool-card text-center">
            <div class="passing-progress-bar"><div class="passing-progress-fill" style="width: ${progress}%"></div></div>
            <div class="passing-header">
              <span class="badge badge-info">確認中 (${state.currentPlayerIdx + 1}/${state.playerCount})</span>
              <h2 class="passing-name-call">次は「<span class="highlight-name">${escapeHTML(curPlayer.name)}</span>」さんへ渡してください</h2>
            </div>

            <div class="topic-box-compact my-3">
              <small>お題: ${escapeHTML(state.selectedTopic)}</small>
            </div>

            <div class="secret-card-container">
              <button type="button" class="btn btn-outline btn-block btn-lg secret-card-box" id="secret-card-box" aria-controls="ito-card-revealed" aria-describedby="ito-card-secrecy-note">
                自分の数字をこっそり確認
              </button>
              <div class="secret-card-revealed hidden" id="ito-card-revealed" tabindex="-1">
                <div class="card-num-badge-group">
                  ${curPlayer.numbers.map(num => `<div class="card-large-number">${num}</div>`).join('')}
                </div>
                <p class="mt-2 text-warning font-bold">数字そのものは言わずに、お題の例えで伝えましょう</p>
              </div>
              <small id="ito-card-secrecy-note" class="text-muted">他の人に見えないように確認してください。</small>
            </div>

            <button class="btn btn-primary btn-block btn-lg mt-4 hidden" id="btn-ito-next-person">
              ${state.currentPlayerIdx + 1 < state.playerCount ? '次の人へ渡す' : '全員確認完了・話し合いへ'}
            </button>
          </div>
        `;

        const box = container.querySelector("#secret-card-box");
        const revealed = container.querySelector("#ito-card-revealed");
        const nextBtn = container.querySelector("#btn-ito-next-person");

        box.addEventListener("click", () => {
          Sound.playSelect();
          Sound.hapticMedium();
          box.classList.add("hidden");
          revealed.classList.remove("hidden");
          container.querySelector("#ito-card-secrecy-note").classList.add("hidden");
          nextBtn.classList.remove("hidden");
          revealed.focus();
        });

        nextBtn.addEventListener("click", () => {
          Sound.playClick();
          if (state.currentPlayerIdx + 1 < state.playerCount) {
            state.currentPlayerIdx++;
            update();
            container.querySelector("#secret-card-box")?.focus();
          } else {
            state.step = "talk";
            update();
            container.querySelector("#ito-talk-topic")?.focus();
          }
        });
      } else if (state.step === "talk") {
        const allCards = [];
        state.players.forEach(p => {
          p.numbers.forEach((num, idx) => {
            const cardLabel = state.cardsPerPlayer > 1 ? `${p.name} [${idx + 1}枚目]` : p.name;
            allCards.push({
              id: `${p.id}_${idx}`,
              playerId: p.id,
              playerName: cardLabel,
              rawPlayerName: p.name,
              cardIndex: idx + 1,
              number: num,
              placed: false
            });
          });
        });

        if (state.placedOrder.length === 0) {
          state.placedOrder = allCards.map(c => ({ ...c }));
        }

        container.innerHTML = `
          <div class="tool-card">
            <div class="text-center mb-3">
              <span class="badge badge-success">話し合い・カード並べ替え</span>
              <h3 class="topic-text mt-1" id="ito-talk-topic" tabindex="-1">${escapeHTML(state.selectedTopic)}</h3>
              <p class="text-sm text-muted">例えを聞いて、数字が小さいと思う人から順に ▲ ▼ で並べ替えます。</p>
            </div>

            <div class="ito-card-list" id="ito-sortable-list">
              ${state.placedOrder.map((card, idx) => `
                <div class="ito-card-item" data-idx="${idx}">
                  <span class="ito-order-num">#${idx + 1}</span>
                  <div class="ito-card-holder">
                    <span class="ito-player-tag">${escapeHTML(card.playerName)}</span>
                    <span class="ito-card-masked" id="ito-card-masked-${idx}">伏せカード</span>
                  </div>
                  <div class="ito-card-moves flex items-center gap-1">
                    <button type="button" class="btn btn-xs btn-outline btn-ito-peep" data-peep-idx="${idx}" title="押している間だけこっそり数字を確認">長押し確認</button>
                    <button class="btn btn-sm btn-icon btn-move-up" data-idx="${idx}" aria-label="${escapeHTML(card.playerName)}を1つ上へ" ${idx === 0 ? 'disabled' : ''}>▲</button>
                    <button class="btn btn-sm btn-icon btn-move-down" data-idx="${idx}" aria-label="${escapeHTML(card.playerName)}を1つ下へ" ${idx === state.placedOrder.length - 1 ? 'disabled' : ''}>▼</button>
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="mt-4 flex flex-col gap-2">
              <button class="btn btn-outline btn-block" id="btn-ito-focus-mode">
                大画面トーク集中モード
              </button>
              <button class="btn btn-danger btn-block btn-lg" id="btn-ito-open-cards" ${state.isOpening ? 'disabled' : ''}>
                ${state.isOpening ? 'カードをオープン中…' : 'この順番でオープンする'}
              </button>
            </div>
          </div>
        `;

        container.querySelectorAll(".btn-ito-peep").forEach(btn => {
          const idx = parseInt(btn.dataset.peepIdx, 10);
          const maskedEl = container.querySelector(`#ito-card-masked-${idx}`);
          if (!maskedEl) return;
          const cardNum = state.placedOrder[idx].number;
          let isPeeping = false;
          const showNum = (e) => {
            if (e.cancelable) e.preventDefault();
            if (isPeeping) return;
            isPeeping = true;
            maskedEl.innerHTML = `<span class="badge badge-warning font-bold text-sm animate-scale">数字: ${cardNum}</span>`;
            btn.classList.add("btn-warning");
            if (typeof Sound !== "undefined" && typeof Sound.hapticLight === "function") {
              Sound.hapticLight();
            }
          };
          const hideNum = () => {
            if (!isPeeping) return;
            isPeeping = false;
            maskedEl.textContent = "伏せカード";
            btn.classList.remove("btn-warning");
          };
          btn.addEventListener("mousedown", showNum);
          btn.addEventListener("mouseup", hideNum);
          btn.addEventListener("mouseleave", hideNum);
          btn.addEventListener("touchstart", showNum, { passive: false });
          btn.addEventListener("touchend", hideNum);
          btn.addEventListener("touchcancel", hideNum);
          btn.addEventListener("keydown", (event) => {
            if (event.key === " " || event.key === "Enter") showNum(event);
          });
          btn.addEventListener("keyup", (event) => {
            if (event.key === " " || event.key === "Enter") hideNum();
          });
          btn.addEventListener("blur", hideNum);
        });

        const focusBtn = container.querySelector("#btn-ito-focus-mode");
        if (focusBtn) {
          focusBtn.addEventListener("click", () => {
            if (typeof TalkFocus !== "undefined") {
              TalkFocus.open(state.selectedTopic, 180);
            }
          });
        }

        container.querySelectorAll(".btn-move-up").forEach(btn => {
          btn.addEventListener("click", () => {
            if (state.isOpening) return;
            const idx = parseInt(btn.dataset.idx, 10);
            if (idx > 0) {
              Sound.playClick();
              Sound.hapticLight();
              const temp = state.placedOrder[idx];
              state.placedOrder[idx] = state.placedOrder[idx - 1];
              state.placedOrder[idx - 1] = temp;
              update();
            }
          });
        });

        container.querySelectorAll(".btn-move-down").forEach(btn => {
          btn.addEventListener("click", () => {
            if (state.isOpening) return;
            const idx = parseInt(btn.dataset.idx, 10);
            if (idx < state.placedOrder.length - 1) {
              Sound.playClick();
              Sound.hapticLight();
              const temp = state.placedOrder[idx];
              state.placedOrder[idx] = state.placedOrder[idx + 1];
              state.placedOrder[idx + 1] = temp;
              update();
            }
          });
        });

        const openBtn = container.querySelector("#btn-ito-open-cards");
        openBtn.addEventListener("click", () => {
          if (state.isOpening) return;
          state.isOpening = true;
          openBtn.disabled = true;
          openBtn.textContent = "カードをオープン中…";
          openBtn.classList.add("pulse-scale");
          Sound.playDrumRoll(1.4);
          safeSetTimeout(() => {
            state.isOpening = false;
            state.step = "result";
            update();
          }, 1450);
        });
      } else if (state.step === "result") {
        if (typeof window !== "undefined" && window.StampRally) {
          window.StampRally.markPlayed("ito");
        }
        const judged = typeof GameResult !== "undefined"
          ? GameResult.judgeItoOrder(state.placedOrder.map((c) => ({ player: c.playerName, val: c.number })))
          : (() => {
            const errorIndexes = [];
            for (let i = 1; i < state.placedOrder.length; i++) {
              if (state.placedOrder[i].number < state.placedOrder[i - 1].number) errorIndexes.push(i);
            }
            return {
              isPerfect: errorIndexes.length === 0,
              errorIndexes,
              correctCount: state.placedOrder.length - errorIndexes.length,
              total: state.placedOrder.length
            };
          })();

        if (judged.isPerfect) {
          Sound.playFanfare();
          if (typeof Confetti !== "undefined") Confetti.launch(54);
        } else {
          Sound.playWrong();
        }

        const resultHeader = typeof GameResult !== "undefined"
          ? GameResult.renderResultCard({
            tone: judged.isPerfect ? "win" : "lose",
            eyebrow: judged.isPerfect ? "全員成功" : "順番ミス",
            title: judged.isPerfect ? "完全クリア！" : "惜しい！順番ミス",
            subtitle: judged.isPerfect
              ? "全員の価値観がきれいにシンクロしました。"
              : `逆転していたカードが ${judged.errorIndexes.length} 枚ありました。`,
            metrics: [
              { label: "成功ライン", value: `${judged.correctCount} / ${judged.total}` },
              { label: "参加人数", value: `${state.playerCount}人` }
            ]
          })
          : `<h2>${judged.isPerfect ? "完全クリア！" : "惜しい！順番ミス"}</h2>`;

        container.innerHTML = `
          <div class="tool-card text-center">
            ${resultHeader}

            <div class="topic-box-compact my-3">
              <small>お題: ${escapeHTML(state.selectedTopic)}</small>
            </div>

            <div class="ito-result-cards mt-3">
              ${state.placedOrder.map((card, idx) => {
                const isError = judged.errorIndexes.includes(idx);
                return `
                  <div class="ito-result-card-item ${isError ? 'card-error' : 'card-success'} animate-fade-in">
                    <span class="ito-order-num">#${idx + 1}</span>
                    <span class="ito-player-name">${escapeHTML(card.playerName)}</span>
                    <span class="ito-actual-num">${card.number}</span>
                    ${isError ? '<span class="badge-error">逆転</span>' : ''}
                  </div>
                `;
              }).join('')}
            </div>

            <div class="mt-4 flex gap-2">
              <button class="btn btn-primary btn-block btn-lg" id="btn-ito-retry">もう一度遊ぶ</button>
            </div>
          </div>
        `;

        if (typeof GameResult !== "undefined") {
          GameResult.scrollResultIntoView(container.querySelector(".tool-card"));
        }

        container.querySelector("#btn-ito-retry").addEventListener("click", () => {
          Sound.playClick();
          state.step = "setup";
          state.isOpening = false;
          state.placedOrder = [];
          state.selectedTopic = getRandomTopic();
          update();
        });
      }
    }

    update();
  },

  // ===================================================
  // 4. 2人対戦：⚡ 反射神経タップ対決 (Quick Reflex Duel)
  // ===================================================

  // ===================================================
  // 既存ツール群
  // ===================================================
  renderAsaSore(container, game) {
    const KANA_LIST = [
      "あ", "い", "う", "え", "お",
      "か", "き", "く", "け", "こ",
      "さ", "し", "す", "せ", "そ",
      "た", "ち", "つ", "て", "と",
      "な", "に", "ぬ", "ね", "の",
      "は", "ひ", "ふ", "へ", "ほ",
      "ま", "み", "む", "め", "も",
      "や", "ゆ", "よ",
      "ら", "り", "る", "れ", "ろ",
      "わ",
      "が", "ぎ", "ぐ", "げ", "ご",
      "ざ", "じ", "ず", "ぜ", "ぞ",
      "だ", "で", "ど",
      "ば", "び", "ぶ", "べ", "ぼ",
      "ぱ", "ぴ", "ぷ", "ぺ", "ぽ"
    ];

    function getRandomTopic() {
      const item = drawShuffledTopic(game.id, game.presets);
      return extractTopicText(item) || "コンビニで思わず買ってしまうもの";
    }

    let allKana = false;
    let timerPreset = 60;
    const commonKana = ["あ","い","う","お","か","き","く","こ","さ","し","す","た","ち","つ","て","と","な","は","ひ","ふ","ま","み","や","ゆ"];
    const drawKana = () => DeckManager.getNext(allKana ? "asa-kana-all" : "asa-kana-common", allKana ? KANA_LIST : commonKana);
    let currentKana = drawKana();
    let currentTopic = game.articleTopic?.text || getRandomTopic();
    let answersLog = [];
    let latestDecision = null;

    const asaTimer = new GameTimer({
      totalSeconds: timerPreset,
      tickSoundInterval: 10,
      title: "朝までそれ正解",
      gameId: "asa-sore",
      onTick: (rem) => {
        const numEl = container.querySelector(".asa-timer-num");
        if (numEl) {
          numEl.textContent = `${rem}秒`;
          numEl.className = `asa-timer-num ${rem <= 10 && asaTimer.isRunning ? 'pulse-red' : ''}`;
        }
      },
      onFinish: () => {
        if (typeof Sound.playTimeUp === "function") Sound.playTimeUp();
        Toast.warning("シンキングタイム終了！一斉に回答を出しましょう");
        updateTimerBtns();
      }
    });

    function timerButtonText() {
      if (asaTimer.isRunning) return "一時停止";
      return `タイマースタート (${asaTimer.remaining || timerPreset}秒)`;
    }

    function updateTimerBtns() {
      const btn = container.querySelector("#btn-toggle-asa-timer");
      if (btn) {
        btn.textContent = timerButtonText();
        btn.className = `btn ${asaTimer.isRunning ? 'btn-secondary' : 'btn-primary'} btn-sm`;
      }
      const numEl = container.querySelector(".asa-timer-num");
      if (numEl) {
        numEl.textContent = `${asaTimer.remaining}秒`;
        numEl.className = `asa-timer-num ${asaTimer.remaining <= 10 && asaTimer.isRunning ? 'pulse-red' : ''}`;
      }
    }

    function render() {
      const latestCardHtml = latestDecision && typeof GameResult !== "undefined"
        ? GameResult.renderResultCard({
          tone: "win",
          eyebrow: "満場一致",
          title: `「${latestDecision.answer}」に決定`,
          subtitle: `「${latestDecision.kana}」で始まる ${latestDecision.topic}`,
          compact: true,
          actionsHtml: '<button type="button" class="btn btn-primary btn-sm" id="btn-asa-next-round">次のお題へ</button>'
        })
        : "";

      container.innerHTML = `
        <div class="tool-card text-center asa-sore-card">
          ${latestCardHtml ? `<div class="mb-3">${latestCardHtml}</div>` : ""}

          <!-- お題ディスプレイ -->
          <div class="asa-sore-display">
            <div class="asa-kana-badge">「${escapeHTML(currentKana)}」で始まる</div>
            <div class="asa-topic-main">${escapeHTML(currentTopic)}</div>
            <div class="asa-sore-suffix">…といえば？</div>
          </div>

          <label class="asa-all-kana-label text-xs text-sub"><input type="checkbox" id="asa-all-kana" ${allKana ? "checked" : ""}> 難しい頭文字も使う</label>
          <div class="asa-controls-grid">
            <button class="btn btn-outline btn-sm" id="btn-shuffle-both">全部シャッフル</button>
            <button class="btn btn-outline btn-sm" id="btn-shuffle-kana">頭文字だけ変更</button>
            <button class="btn btn-outline btn-sm" id="btn-shuffle-topic">テーマだけ変更</button>
          </div>

          <!-- タイマー -->
          <div class="asa-timer-box">
            <div class="asa-timer-header">
              <span>シンキングタイム</span>
              <strong class="asa-timer-num ${asaTimer.remaining <= 10 && asaTimer.isRunning ? 'pulse-red' : ''}">${asaTimer.remaining}秒</strong>
            </div>
            <div class="btn-toggle-group mb-2">
              <button type="button" class="btn-toggle ${timerPreset === 30 ? 'active' : ''}" data-asa-sec="30">30秒</button>
              <button type="button" class="btn-toggle ${timerPreset === 60 ? 'active' : ''}" data-asa-sec="60">60秒</button>
            </div>
            <div class="asa-timer-btns">
              <button class="btn ${asaTimer.isRunning ? 'btn-secondary' : 'btn-primary'} btn-sm" id="btn-toggle-asa-timer">
                ${timerButtonText()}
              </button>
              <button class="btn btn-outline btn-sm" id="btn-reset-asa-timer">リセット</button>
            </div>
          </div>

          <!-- 正解決定メモ機能 -->
          <div class="asa-decision-box">
            <label class="decision-label">全員で議論して決まった「今日のそれ正解」:</label>
            <form class="decision-input-row" id="asa-answer-form">
              <input type="text" required class="decision-input" id="input-asa-answer" placeholder="例: 「${escapeHTML(currentKana)}」から始まる正解を入力...">
              <button class="btn btn-success" id="btn-save-asa-answer">決定</button>
            </form>
          </div>

          <!-- 履歴 ＆ シェア -->
          ${answersLog.length > 0 ? `
            <div class="asa-history-section">
              <h4 class="history-title">今日決まった「それ正解」リスト (${answersLog.length}件)</h4>
              <div class="history-list">
                ${answersLog.map((item, idx) => `
                  <div class="history-item">
                    <div class="history-left">
                      <span class="history-q">「${escapeHTML(item.kana)}」で始まる${escapeHTML(item.topic)}</span>
                      <strong class="history-a">${escapeHTML(item.answer)}</strong>
                    </div>
                    <button class="btn btn-xs btn-outline btn-copy-sore" data-idx="${idx}">
                      結果をコピー
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;

      container.querySelector("#btn-asa-next-round")?.addEventListener("click", () => {
        Sound.playClick();
        latestDecision = null;
        currentKana = drawKana();
        currentTopic = getRandomTopic();
        asaTimer.reset(timerPreset);
        render();
      });

      container.querySelectorAll("[data-asa-sec]").forEach(btn => {
        btn.addEventListener("click", () => {
          Sound.playClick();
          timerPreset = parseInt(btn.dataset.asaSec, 10);
          asaTimer.reset(timerPreset);
          render();
        });
      });

      container.querySelector("#asa-all-kana").addEventListener("change", event => {
        allKana = event.target.checked;
        currentKana = drawKana();
        render();
      });
      container.querySelector("#btn-shuffle-both").addEventListener("click", () => {
        Sound.playClick();
        latestDecision = null;
        currentKana = drawKana();
        currentTopic = getRandomTopic();
        asaTimer.reset(timerPreset);
        render();
      });

      container.querySelector("#btn-shuffle-kana").addEventListener("click", () => {
        Sound.playClick();
        latestDecision = null;
        currentKana = drawKana();
        render();
      });

      container.querySelector("#btn-shuffle-topic").addEventListener("click", () => {
        Sound.playClick();
        latestDecision = null;
        currentTopic = getRandomTopic();
        render();
      });

      container.querySelector("#btn-toggle-asa-timer").addEventListener("click", () => {
        Sound.playClick();
        if (asaTimer.remaining === 0) asaTimer.reset(timerPreset);
        asaTimer.toggle();
        updateTimerBtns();
      });

      container.querySelector("#btn-reset-asa-timer").addEventListener("click", () => {
        Sound.playClick();
        asaTimer.reset(timerPreset);
        updateTimerBtns();
      });

      const inputAns = container.querySelector("#input-asa-answer");
      container.querySelector("#asa-answer-form").addEventListener("submit", event => {
        event.preventDefault();
        const val = inputAns.value.trim();
        if (val) {
          Sound.playFanfare();
          if (typeof Confetti !== "undefined") Confetti.burst(48);
          if (typeof window !== "undefined" && window.StampRally) {
            window.StampRally.markPlayed("asa-sore");
          }
          const decided = {
            kana: currentKana,
            topic: currentTopic,
            answer: val
          };
          latestDecision = decided;
          answersLog.unshift(decided);
          inputAns.value = "";
          render();
          if (typeof GameResult !== "undefined") {
            GameResult.scrollResultIntoView(container.querySelector(".result-stage"));
          }
        }
      });

      container.querySelectorAll(".btn-copy-sore").forEach(btn => {
        btn.addEventListener("click", async () => {
          Sound.playClick();
          const item = answersLog[parseInt(btn.dataset.idx, 10)];
          if (item) {
            const shareText = `【朝までそれ正解】\nお題：「${item.kana}」で始まる${item.topic}…といえば？\n満場一致の正解：『${item.answer}』！`;
            const copied = typeof GameResult !== "undefined" && typeof GameResult.copyText === "function"
              ? await GameResult.copyText(shareText)
              : false;
            if (copied) Toast.success("結果をコピーしました");
            else Toast.warning("コピーできませんでした");
          }
        });
      });
    }

    render();
    return () => {
      asaTimer.destroy();
    };
  },

  // ===================================================
  // 1. ワードウルフ (Word Wolf)
  // ===================================================
  renderWordWolf(container, game) { /* Canonical implementation in js/quality/tool-fixes.js */ },

  // ===================================================
  // 2. 爆弾タイマー ＆ 古今東西
  // ===================================================
  renderBombTimer(container, game) {
    let tickId = null;
    let isRunning = false;
    let isExploded = false;
    let timeMode = "normal";
    let rallyCount = 0;
    let currentTopic = "";

    function getRandomTopic() {
      const item = drawShuffledTopic(game.id, game.presets);
      return extractTopicText(item) || "赤いもの";
    }

    currentTopic = getRandomTopic();

    const bombSvg = `<svg class="bomb-svg" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="29" cy="37" r="19" fill="currentColor" opacity="0.14" stroke="currentColor" stroke-width="2.5"/>
      <path d="M38 20l5-5M43 15c3-3 8-2 9 2" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="52" cy="17" r="3" fill="var(--primary)"/>
      <path d="M22 31a9 9 0 0 1 7-4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" opacity="0.5"/>
    </svg>`;

    function render() {
      const explodedResultHtml = isExploded && typeof GameResult !== "undefined"
        ? GameResult.renderResultCard({
          tone: "danger",
          eyebrow: "タイムアップ",
          title: "爆発しました！",
          subtitle: "いまスマホを持っていた人の負けです。",
          metrics: [
            { label: "ラリー記録", value: `${rallyCount}回` },
            { label: "お題", value: currentTopic }
          ],
          actionsHtml: `
            <button class="btn btn-primary flex-1" id="btn-bomb-retry">もう一度遊ぶ</button>
            <button class="btn btn-outline flex-1" id="btn-bomb-batsu">ソフトミッションを引く</button>
          `
        })
        : "";

      container.innerHTML = `
        <div class="tool-card text-center bomb-game-card">
          ${renderSoundHintMarkup()}
          <div class="topic-box">
            <span class="topic-tag">今回のお題</span>
            <div class="topic-text" id="bomb-topic-text">${escapeHTML(currentTopic)}</div>
            <button class="btn btn-sm btn-outline mt-2" id="btn-next-topic">お題を変える</button>
          </div>

          ${isExploded ? `<div class="my-3">${explodedResultHtml}</div>` : `
            <div class="bomb-visual ${isRunning ? 'ticking' : ''}" id="bomb-visual">
              <div class="bomb-emoji">${bombSvg}</div>
              <div class="bomb-spark ${isRunning ? '' : 'hidden'}" id="bomb-spark">作動中</div>
            </div>

            <div class="rally-counter-box mb-3 ${isRunning ? '' : 'hidden'}" id="rally-box">
              <span>ラリー回数: <strong id="rally-count-num">${rallyCount}</strong> 回</span>
            </div>

            <div class="bomb-status" id="bomb-status">
              ${isRunning ? '答えたらボタンを押して隣の人に渡してください' : '時間モードを選んでスタートします'}
            </div>

            ${!isRunning ? `
              <div class="time-mode-selector mb-3">
                <span class="filter-label">時間設定:</span>
                <div class="btn-toggle-group">
                  <button class="btn-toggle ${timeMode === 'short' ? 'active' : ''}" data-mode="short">15〜30秒</button>
                  <button class="btn-toggle ${timeMode === 'normal' ? 'active' : ''}" data-mode="normal">30〜60秒</button>
                  <button class="btn-toggle ${timeMode === 'long' ? 'active' : ''}" data-mode="long">60〜100秒</button>
                </div>
              </div>
            ` : ''}

            <div class="bomb-controls">
              ${!isRunning ? `
                <button class="btn btn-danger btn-lg btn-block" id="btn-start-bomb">
                  爆弾スタート
                </button>
              ` : `
                <button class="btn btn-warning btn-lg btn-block pulse-scale" id="btn-pass-bomb">
                  答えた・次へパス
                </button>
                <button class="btn btn-secondary btn-sm btn-block mt-2" id="btn-stop-bomb">
                  強制停止（リセット）
                </button>
              `}
            </div>
          `}
        </div>
      `;

      container.querySelector("#btn-next-topic").addEventListener("click", () => {
        Sound.playClick();
        currentTopic = getRandomTopic();
        isExploded = false;
        render();
      });

      if (isExploded) {
        container.querySelector("#btn-bomb-retry")?.addEventListener("click", () => {
          Sound.playClick();
          isExploded = false;
          rallyCount = 0;
          currentTopic = getRandomTopic();
          render();
        });
        container.querySelector("#btn-bomb-batsu")?.addEventListener("click", () => {
          Sound.playClick();
          if (typeof window.openBatsuModal === "function") window.openBatsuModal();
          else window.location.hash = "#game/batsu-roulette";
        });
      } else if (!isRunning) {
        container.querySelectorAll("[data-mode]").forEach(btn => {
          btn.addEventListener("click", () => {
            Sound.playClick();
            timeMode = btn.dataset.mode;
            render();
          });
        });

        container.querySelector("#btn-start-bomb").addEventListener("click", startBomb);
      } else {
        container.querySelector("#btn-pass-bomb").addEventListener("click", () => {
          Sound.playClick();
          rallyCount++;
          const numEl = container.querySelector("#rally-count-num");
          if (numEl) numEl.textContent = rallyCount;
        });

        container.querySelector("#btn-stop-bomb").addEventListener("click", resetBomb);
      }
    }

    function startBomb() {
      Sound.playSelect();
      isRunning = true;
      isExploded = false;
      rallyCount = 0;

      let minS = 30, maxS = 60;
      if (timeMode === "short") { minS = 15; maxS = 30; }
      else if (timeMode === "long") { minS = 60; maxS = 100; }

      const totalSeconds = Math.floor(Math.random() * (maxS - minS)) + minS;
      const endTime = Date.now() + totalSeconds * 1000;

      render();

      let tickSpeed = 1000;

      function scheduleTick() {
        if (!isRunning) return;
        const left = endTime - Date.now();

        if (left <= 0) {
          explode();
          return;
        }

        const ratio = left / (totalSeconds * 1000);
        const isUrgent = ratio < 0.25;
        Sound.playBombTick(isUrgent);

        const bombVisual = container.querySelector("#bomb-visual");
        if (bombVisual) {
          if (isUrgent) {
            bombVisual.classList.remove("fast");
            bombVisual.classList.add("critical");
            tickSpeed = 250;
          } else if (ratio < 0.5) {
            bombVisual.classList.add("fast");
            tickSpeed = 500;
          } else {
            tickSpeed = 1000;
          }
        }

        tickId = safeSetTimeout(scheduleTick, tickSpeed);
      }

      GameTimer.activeTimer = {
        title: "爆弾タイマー",
        gameId: "bomb-timer",
        isRunning: true,
        get remaining() { return Math.max(0, Math.ceil((endTime - Date.now()) / 1000)); },
        onFinish: () => {
          explode();
        },
        destroy() {
          isRunning = false;
          if (tickId) safeClearTimeout(tickId);
        }
      };

      scheduleTick();
    }

    function explode() {
      isRunning = false;
      isExploded = true;
      if (GameTimer.activeTimer && GameTimer.activeTimer.gameId === "bomb-timer") {
        GameTimer.activeTimer = null;
      }
      if (tickId) safeClearTimeout(tickId);
      Sound.playExplosion();
      if (typeof window !== "undefined" && window.StampRally) {
        window.StampRally.markPlayed("bomb-timer");
      }
      render();
      if (typeof GameResult !== "undefined") {
        GameResult.scrollResultIntoView(container.querySelector(".tool-card"));
      }
    }

    function resetBomb() {
      isRunning = false;
      isExploded = false;
      if (GameTimer.activeTimer && GameTimer.activeTimer.gameId === "bomb-timer") {
        GameTimer.activeTimer = null;
      }
      if (tickId) safeClearTimeout(tickId);
      render();
    }

    const unbindSoundHint = bindSoundHintInContainer(container);
    render();
    return () => {
      unbindSoundHint();
      if (GameTimer.activeTimer && GameTimer.activeTimer.gameId === "bomb-timer") {
        GameTimer.activeTimer = null;
      }
      if (tickId) safeClearTimeout(tickId);
    };
  },

  // ===================================================
  // 3. カタカナ禁止ゲーム（ボブジテン風）
  // ===================================================
  renderKatakanaBan(container, game) {
    let presets = [...game.presets];
    let currentIndex = 0;
    let score = 0;
    let foulCount = 0;
    let isFinished = false;
    let showHint = false;

    function shuffle() {
      for (let i = presets.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [presets[i], presets[j]] = [presets[j], presets[i]];
      }
      currentIndex = 0;
    }

    shuffle();
    if (game && game.articleTopic) {
      const targetWord = typeof game.articleTopic === "string"
        ? game.articleTopic
        : (game.articleTopic.word || game.articleTopic.text || "");
      if (targetWord) {
        const hitIdx = presets.findIndex(p => (typeof p === "string" ? p : p.word) === targetWord);
        if (hitIdx > 0) {
          const [matched] = presets.splice(hitIdx, 1);
          presets.unshift(matched);
        } else if (hitIdx === -1 && typeof game.articleTopic === "object") {
          presets.unshift(game.articleTopic);
        }
        currentIndex = 0;
      }
    }

    const kataTimer = new GameTimer({
      totalSeconds: 60,
      tickSoundInterval: 10,
      title: "カタカナーシ",
      gameId: "katakana-ban",
      onTick: (rem) => {
        const badge = container.querySelector(".timer-badge-sm");
        if (badge) {
          badge.textContent = `残り ${rem}秒`;
          badge.className = `timer-badge-sm ${rem <= 10 && kataTimer.isRunning ? 'pulse-red' : ''}`;
        }
      },
      onFinish: () => {
        isFinished = true;
        if (score > 0) {
          Sound.playFanfare();
          if (typeof Confetti !== "undefined") Confetti.burst(48);
        } else if (typeof Sound.playTimeUp === "function") {
          Sound.playTimeUp();
        }
        render();
        if (typeof GameResult !== "undefined") {
          GameResult.scrollResultIntoView(container.querySelector(".tool-card"));
        }
      }
    });

    function updateTimerBtn() {
      const btn = container.querySelector("#btn-kata-timer");
      if (btn) {
        btn.textContent = kataTimer.isRunning ? 'タイマー一時停止' : `タイマースタート (${kataTimer.remaining || 60}秒)`;
      }
      const badge = container.querySelector(".timer-badge-sm");
      if (badge) {
        badge.textContent = `残り ${kataTimer.remaining}秒`;
        badge.className = `timer-badge-sm ${kataTimer.remaining <= 10 && kataTimer.isRunning ? 'pulse-red' : ''}`;
      }
    }

    function render() {
      const item = presets[currentIndex] || { word: "終了", hint: "すべてのお題が終わりました" };
      const displayWord = item.word || item.text || "お題";
      const displayHint = item.hint || "カタカナ語を使わずに特徴や用途を説明しましょう";

      if (isFinished) {
        const summaryHtml = typeof GameResult !== "undefined"
          ? GameResult.renderResultCard({
            tone: score > 0 ? "win" : "neutral",
            eyebrow: "タイムアップ",
            title: `${score} 問正解`,
            subtitle: score >= 5 ? "語彙力抜群の好記録です。" : score > 0 ? "ナイス説明でした。" : "次は日本語の言い換えで再挑戦してみましょう。",
            metrics: [
              { label: "正解数", value: `${score}問` },
              { label: "カタカナアウト", value: `${foulCount}回` }
            ],
            actionsHtml: '<button class="btn btn-primary btn-block" id="btn-katakana-retry">もう一度遊ぶ</button>'
          })
          : `<h3>終了！ ${score} 問正解</h3><button class="btn btn-primary mt-3" id="btn-katakana-retry">もう一度遊ぶ</button>`;

        container.innerHTML = `<div class="tool-card text-center katakana-card">${summaryHtml}</div>`;
        container.querySelector("#btn-katakana-retry").addEventListener("click", () => {
          Sound.playClick();
          isFinished = false;
          score = 0;
          foulCount = 0;
          kataTimer.reset(60);
          shuffle();
          render();
        });
        return;
      }

      container.innerHTML = `
        <div class="tool-card text-center katakana-card">
          <div class="card-header-flex">
            <span class="score-badge">正解数: <strong>${score}</strong></span>
            <span class="timer-badge-sm ${kataTimer.remaining <= 10 && kataTimer.isRunning ? 'pulse-red' : ''}">残り ${kataTimer.remaining}秒</span>
          </div>

          <div class="katakana-word-box">
            <div class="katakana-tag">カタカナを使わずに説明</div>
            <div class="katakana-target-word">${escapeHTML(displayWord)}</div>
            <div class="mt-2">
              <button type="button" class="btn btn-xs btn-outline" id="btn-kata-hint" aria-expanded="${showHint}">
                ${showHint ? '言い換えヒントを隠す' : '困ったときの言い換えヒント'}
              </button>
            </div>
            ${showHint ? `<div class="katakana-subhint mt-2">ヒント例: 「${escapeHTML(displayHint)}」</div>` : ''}
          </div>

          <div class="tool-btn-grid">
            <button class="btn btn-success btn-lg" id="btn-kata-correct">正解 (+1点)</button>
            <button class="btn btn-danger btn-lg" id="btn-kata-fail">カタカナを言った</button>
            <button class="btn btn-outline" id="btn-kata-pass">パス</button>
          </div>

          <div class="timer-controls mt-3">
            <button class="btn ${kataTimer.isRunning ? 'btn-secondary' : 'btn-primary'} btn-sm" id="btn-kata-timer">
              ${kataTimer.isRunning ? 'タイマー一時停止' : `タイマースタート (${kataTimer.remaining || 60}秒)`}
            </button>
            <button class="btn btn-outline btn-sm" id="btn-kata-reset">リセット</button>
          </div>
        </div>
      `;

      const ensureTimerRunning = () => {
        if (!kataTimer.isRunning && kataTimer.remaining === 60) {
          kataTimer.start();
        }
      };

      container.querySelector("#btn-kata-hint").addEventListener("click", () => {
        Sound.playClick();
        showHint = !showHint;
        render();
      });

      container.querySelector("#btn-kata-correct").addEventListener("click", () => {
        ensureTimerRunning();
        Sound.playCorrect();
        score++;
        if (typeof window !== "undefined" && window.StampRally) {
          window.StampRally.markPlayed("katakana-ban");
        }
        nextWord();
      });

      container.querySelector("#btn-kata-fail").addEventListener("click", () => {
        ensureTimerRunning();
        Sound.playWrong();
        foulCount++;
        if (typeof window !== "undefined" && window.StampRally) {
          window.StampRally.markPlayed("katakana-ban");
        }
        Toast.warning("アウト！カタカナを言いました");
        nextWord();
      });

      container.querySelector("#btn-kata-pass").addEventListener("click", () => {
        ensureTimerRunning();
        Sound.playClick();
        nextWord();
      });

      container.querySelector("#btn-kata-timer").addEventListener("click", () => {
        Sound.playClick();
        if (kataTimer.remaining <= 0) kataTimer.reset(60);
        kataTimer.toggle();
        updateTimerBtn();
      });

      container.querySelector("#btn-kata-reset").addEventListener("click", () => {
        Sound.playClick();
        isFinished = false;
        showHint = false;
        kataTimer.reset(60);
        score = 0;
        foulCount = 0;
        shuffle();
        render();
      });
    }

    function nextWord() {
      showHint = false;
      currentIndex++;
      if (currentIndex >= presets.length) {
        shuffle();
      }
      render();
    }

    render();
    return () => {
      kataTimer.destroy();
    };
  },

  // ===================================================
  // 4. 指置きロシアンルーレット (Chwazi風)
  // ===================================================
  renderFingerRoulette(container) { /* Canonical implementation in js/quality/tool-fixes.js */ },

  // ===================================================
  // 5. 究極の2択 ＆ トークガチャ
  // ===================================================
  renderTwoChoices(container, game) {
    let currentItem = drawShuffledTopic(game.id, game.presets);
    let state = {
      votesA: 0,
      votesB: 0,
      selectedSide: null,
      decided: false,
      countingDown: false,
      countdownNum: 3,
      countdownInterval: null
    };

    function startCountdown() {
      if (state.countingDown) return;
      state.countingDown = true;
      state.countdownNum = 3;
      Sound.playTick(800);
      updateCountdownDisplay();

      state.countdownInterval = safeSetInterval(() => {
        state.countdownNum--;
        if (state.countdownNum > 0) {
          Sound.playTick(800 + (3 - state.countdownNum) * 200);
          updateCountdownDisplay();
        } else {
          safeClearInterval(state.countdownInterval);
          state.countdownInterval = null;
          state.countingDown = false;
          Sound.playJajan();
          Sound.hapticMedium();
          if (typeof window !== "undefined" && window.StampRally) {
            window.StampRally.markPlayed("two-choices");
          }
          updateCountdownDisplay("せーの、指差し！");
        }
      }, 800);
    }

    function updateCountdownDisplay(finalText) {
      const el = container.querySelector("#choice-countdown-box");
      if (el) {
        if (finalText) {
          el.innerHTML = `<span class="font-black text-2xl text-danger animate-scale">${finalText}</span>`;
        } else {
          el.innerHTML = `<span class="font-black text-2xl text-primary animate-scale">${state.countdownNum}</span>`;
        }
      }
    }

    function render() {
      const item = currentItem || { a: "選択肢A", b: "選択肢B" };
      let aText = item.a;
      let bText = item.b;
      if (!aText && item.text) {
        const parts = item.text.split(/ VS | vs | ＶＳ /i);
        aText = parts[0] ? parts[0].trim() : item.text;
        bText = parts[1] ? parts[1].trim() : "もう一方の選択肢";
      } else if (!aText) {
        aText = "選択肢A";
        bText = "選択肢B";
      }

      const totalVotes = state.votesA + state.votesB;
      const pctA = totalVotes > 0 ? Math.round((state.votesA / totalVotes) * 100) : 50;
      const pctB = totalVotes > 0 ? 100 - pctA : 50;

      const majorityTitle = state.votesA > state.votesB
        ? `A派が多数（${state.votesA}対${state.votesB}）`
        : state.votesB > state.votesA
          ? `B派が多数（${state.votesB}対${state.votesA}）`
          : `真っ二つに割れました（${state.votesA}対${state.votesB}）`;
      const majoritySub = state.votesA > state.votesB
        ? `多数派：「${aText}」 — 少数派の理由も聞いてみましょう`
        : state.votesB > state.votesA
          ? `多数派：「${bText}」 — 少数派の理由も聞いてみましょう`
          : "意見が完全同数！お互いのこだわりを語り合いましょう";

      const resultCardHtml = state.decided && totalVotes > 0 && typeof GameResult !== "undefined"
        ? GameResult.renderResultCard({
            tone: state.votesA === state.votesB ? "neutral" : "win",
            compact: true,
            eyebrow: "多数決の結果",
            title: majorityTitle,
            subtitle: majoritySub,
            metrics: [
              { label: "A派", value: `${state.votesA}票 (${pctA}%)` },
              { label: "B派", value: `${state.votesB}票 (${pctB}%)` }
            ]
          })
        : "";

      container.innerHTML = `
        <div class="tool-card text-center two-choice-card">
          <div class="two-choice-header">あなたならどっちを選ぶ？</div>

          <div class="two-choice-options my-3">
            <button type="button" class="choice-box choice-a ${state.selectedSide === 'a' ? 'selected' : ''}" id="choice-a" aria-pressed="${state.selectedSide === 'a'}">
              <span class="choice-label">A</span>
              <div class="choice-content">${escapeHTML(aText)}</div>
            </button>
            <div class="vs-divider">VS</div>
            <button type="button" class="choice-box choice-b ${state.selectedSide === 'b' ? 'selected' : ''}" id="choice-b" aria-pressed="${state.selectedSide === 'b'}">
              <span class="choice-label">B</span>
              <div class="choice-content">${escapeHTML(bText)}</div>
            </button>
          </div>

          <div class="my-3 p-3 rounded border two-choice-panel">
            <div id="choice-countdown-box" style="min-height: 38px; display: flex; align-items: center; justify-content: center;">
              <span class="text-xs font-bold text-muted">「せーの」で全員一斉に指差し</span>
            </div>
            <button class="btn btn-warning btn-block btn-lg font-bold mt-2" id="btn-choice-countdown">
              せーので判定（3・2・1）
            </button>
          </div>

          <div class="my-3 p-3 rounded border text-left two-choice-panel">
            <div class="flex justify-between items-center text-xs font-bold text-muted mb-2">
              <span>多数決集計（合計 ${totalVotes}票）</span>
              ${totalVotes > 0 ? `<span class="choice-ratio-label">${pctA}% vs ${pctB}%</span>` : ''}
            </div>

            <div class="choice-meter-track mb-3">
              <div class="choice-meter-a" style="width: ${totalVotes > 0 ? pctA : 50}%;"></div>
              <div class="choice-meter-b" style="width: ${totalVotes > 0 ? pctB : 50}%;"></div>
            </div>

            <div class="flex justify-between items-center text-xs gap-2">
              <div class="flex items-center gap-1">
                <span class="font-bold choice-text-a">A: ${state.votesA}票</span>
                <button class="btn btn-xs btn-outline" id="btn-vote-a-minus" aria-label="Aから1票減らす">−</button>
                <button class="btn btn-xs btn-choice-a" id="btn-vote-a-plus" aria-label="Aに1票追加">＋</button>
              </div>
              <div class="flex items-center gap-1">
                <button class="btn btn-xs btn-outline" id="btn-vote-b-minus" aria-label="Bから1票減らす">−</button>
                <button class="btn btn-xs btn-choice-b" id="btn-vote-b-plus" aria-label="Bに1票追加">＋</button>
                <span class="font-bold choice-text-b">B: ${state.votesB}票</span>
              </div>
            </div>

            ${totalVotes > 0 && !state.decided ? `
              <button class="btn btn-outline btn-sm btn-block mt-3" id="btn-choice-decide">多数決の結果を確定する</button>
            ` : ''}
          </div>

          ${resultCardHtml ? `<div class="my-3">${resultCardHtml}</div>` : ''}

          <button class="btn btn-primary btn-lg btn-block mt-3" id="btn-next-choice">
            <span>次の究極の2択を引く</span>
          </button>
        </div>
      `;

      container.querySelector("#choice-a").addEventListener("click", () => {
        Sound.playSelect();
        state.selectedSide = state.selectedSide === "a" ? null : "a";
        render();
      });
      container.querySelector("#choice-b").addEventListener("click", () => {
        Sound.playSelect();
        state.selectedSide = state.selectedSide === "b" ? null : "b";
        render();
      });

      container.querySelector("#btn-choice-countdown").addEventListener("click", () => {
        startCountdown();
      });

      container.querySelector("#btn-vote-a-plus").addEventListener("click", () => {
        Sound.playClick();
        state.votesA++;
        state.decided = false;
        render();
      });
      container.querySelector("#btn-vote-a-minus").addEventListener("click", () => {
        if (state.votesA > 0) {
          Sound.playClick();
          state.votesA--;
          state.decided = false;
          render();
        }
      });
      container.querySelector("#btn-vote-b-plus").addEventListener("click", () => {
        Sound.playClick();
        state.votesB++;
        state.decided = false;
        render();
      });
      container.querySelector("#btn-vote-b-minus").addEventListener("click", () => {
        if (state.votesB > 0) {
          Sound.playClick();
          state.votesB--;
          state.decided = false;
          render();
        }
      });

      container.querySelector("#btn-choice-decide")?.addEventListener("click", () => {
        Sound.playFanfare();
        state.decided = true;
        if (typeof window !== "undefined" && window.StampRally) {
          window.StampRally.markPlayed("two-choices");
        }
        render();
      });

      container.querySelector("#btn-next-choice").addEventListener("click", () => {
        Sound.playClick();
        currentItem = drawShuffledTopic(game.id, game.presets);
        state.votesA = 0;
        state.votesB = 0;
        state.selectedSide = null;
        state.decided = false;
        render();
      });
    }

    render();

    return () => {
      if (state.countdownInterval) safeClearInterval(state.countdownInterval);
    };
  },

  // ===================================================
  // 6. ウミガメのスープ (水平思考クイズ)
  // ===================================================
  renderSeaTurtle(container, game) {
    const builtInTopics = getActiveTopicsForGame(game.id, game.presets).filter(q => q?.question && q?.answer);
    const presets = game.articleTopic ? [game.articleTopic, ...builtInTopics] : builtInTopics;
    let currentIndex = 0;
    let showAnswer = false;
    let solved = false;
    let openedHints = new Set();

    function render() {
      const q = presets[currentIndex] || { title: "お題なし", question: "お題がありません", hints: [], answer: "" };
      const hintsList = Array.isArray(q.hints) ? q.hints : (q.hint ? [q.hint] : []);

      const solvedBanner = solved && typeof GameResult !== "undefined"
        ? GameResult.renderResultCard({
            tone: "win",
            eyebrow: "謎解きクリア",
            title: "真相に到達しました",
            subtitle: `問題「${q.title || "自作問題"}」をクリア`,
            metrics: [
              { label: "問題番号", value: `${currentIndex + 1} / ${presets.length}` },
              { label: "使ったヒント", value: `${openedHints.size}個` }
            ],
            actionsHtml: `<button class="btn btn-primary btn-block" id="btn-sea-next-solved">次の問題へ進む</button>`
          })
        : "";

      container.innerHTML = `
        <div class="tool-card sea-turtle-card">
          <div class="card-header-flex sea-turtle-head">
            <span class="puzzle-num">問題 ${currentIndex + 1} / ${presets.length}</span>
            <div class="nav-btn-group">
              <button class="btn btn-sm btn-outline" id="btn-prev-q">前へ</button>
              <button class="btn btn-sm btn-outline" id="btn-next-q">次へ</button>
            </div>
          </div>

          ${!game.articleTopic && currentIndex === 0 ? '<p class="sea-beginner-link"><a href="seo/sea-turtle-quiz.html#quiz-beginner">初めての方へ：身近な出来事から解く問題を選ぶ ↗</a></p>' : ''}
          <h3 class="puzzle-title">${escapeHTML(q.title || "自作問題")}</h3>
          <div class="puzzle-question-box">
            <p>${escapeHTML(q.question)}</p>
          </div>

          ${solvedBanner}

          <div class="puzzle-action-box">
            <p class="puzzle-tip">出題者に「YES」「NO」「関係ありません」で答えられる質問を投げかけましょう。</p>

            <div class="gm-sound-response-bar my-3">
              <span class="field-label">出題者リアクション効果音</span>
              <div class="gm-sound-btn-grid mt-2">
                <button class="btn btn-success btn-sm" id="btn-ans-yes">YES</button>
                <button class="btn btn-danger btn-sm" id="btn-ans-no">NO</button>
                <button class="btn btn-secondary btn-sm" id="btn-ans-na">関係なし</button>
                <button class="btn btn-warning btn-sm" id="btn-ans-good">鋭い質問</button>
              </div>
            </div>

            ${hintsList.length > 0 ? `
              <div class="phased-hints-section my-3">
                <span class="field-label">段階的ヒント（詰まったら出題者が公開）</span>
                <div class="phased-hints-list mt-2">
                  ${hintsList.map((h, hIdx) => {
                    const isOpen = openedHints.has(hIdx);
                    return `
                      <div class="phased-hint-item ${isOpen ? 'is-open' : ''}">
                        <button class="btn-phased-hint-toggle" data-hidx="${hIdx}">
                          <span>ヒント ${hIdx + 1}${isOpen ? '（公開中）' : 'を見る'}</span>
                          <span class="hint-arrow">${isOpen ? '閉じる' : '開く'}</span>
                        </button>
                        ${isOpen ? `<div class="phased-hint-content"><p>${escapeHTML(h)}</p></div>` : ''}
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            ` : ''}

            <div class="btn-group-row mt-3">
              <button class="btn btn-warning flex-1" id="btn-toggle-answer">
                ${showAnswer ? '解答を隠す' : '真相（解答）を見る'}
              </button>
              ${!solved ? '<button class="btn btn-success flex-1" id="btn-sea-solved">正解・クリア</button>' : ''}
            </div>
          </div>

          <div class="puzzle-answer-box ${showAnswer ? '' : 'hidden'}" id="answer-box">
            <span class="answer-label">真相</span>
            <p>${escapeHTML(q.answer)}</p>
            ${q.hostNote ? `<p class="text-sm text-sub mt-2">${escapeHTML(q.hostNote)}</p>` : ''}
          </div>
        </div>
      `;

      const pulseHit = (el) => {
        if (!el) return;
        el.classList.remove("is-hit");
        void el.offsetWidth;
        el.classList.add("is-hit");
        safeSetTimeout(() => el.classList.remove("is-hit"), 260);
      };
      container.querySelector("#btn-ans-yes").addEventListener("click", (e) => {
        Sound.playCorrect();
        pulseHit(e.currentTarget);
      });
      container.querySelector("#btn-ans-no").addEventListener("click", (e) => {
        Sound.playWrong();
        pulseHit(e.currentTarget);
      });
      container.querySelector("#btn-ans-na").addEventListener("click", (e) => {
        Sound.playTick(500);
        pulseHit(e.currentTarget);
      });
      container.querySelector("#btn-ans-good").addEventListener("click", (e) => {
        Sound.playSelect();
        pulseHit(e.currentTarget);
      });

      container.querySelectorAll(".btn-phased-hint-toggle").forEach(btn => {
        btn.addEventListener("click", () => {
          const hIdx = parseInt(btn.dataset.hidx, 10);
          if (openedHints.has(hIdx)) {
            openedHints.delete(hIdx);
          } else {
            openedHints.add(hIdx);
            Sound.playClick();
          }
          render();
        });
      });

      container.querySelector("#btn-toggle-answer").addEventListener("click", () => {
        Sound.playClick();
        showAnswer = !showAnswer;
        if (showAnswer && typeof window !== "undefined" && window.StampRally) {
          window.StampRally.markPlayed("sea-turtle");
        }
        render();
      });

      container.querySelector("#btn-sea-solved")?.addEventListener("click", () => {
        solved = true;
        showAnswer = true;
        Sound.playFanfare();
        if (typeof Confetti !== "undefined") Confetti.burst(46);
        if (typeof window !== "undefined" && window.StampRally) {
          window.StampRally.markPlayed("sea-turtle");
        }
        render();
        if (typeof GameResult !== "undefined") GameResult.scrollResultIntoView(container.querySelector(".result-stage"));
      });

      const goNext = () => {
        Sound.playClick();
        currentIndex = (currentIndex + 1) % presets.length;
        showAnswer = false;
        solved = false;
        openedHints.clear();
        render();
      };

      container.querySelector("#btn-prev-q").addEventListener("click", () => {
        Sound.playClick();
        currentIndex = (currentIndex - 1 + presets.length) % presets.length;
        showAnswer = false;
        solved = false;
        openedHints.clear();
        render();
      });

      container.querySelector("#btn-next-q").addEventListener("click", goNext);
      container.querySelector("#btn-sea-next-solved")?.addEventListener("click", goNext);
    }

    render();
    return () => {};
  },

  // ===================================================
  // 7. 体内時計ジャスト対決
  // ===================================================
  renderTenSeconds(container) {
    let state = "ready";
    let targetTime = 10.00;
    let startTime = 0;
    let stopTime = 0;
    let lastJudgment = null;
    let scores = [];

    function render() {
      let timeText = "00.00";
      if (state === "stopped" && lastJudgment) {
        timeText = lastJudgment.displaySec;
      }

      const resultMarkup = state === "stopped" && lastJudgment
        ? (typeof GameResult !== "undefined"
            ? GameResult.renderResultCard({
                tone: lastJudgment.tone,
                eyebrow: lastJudgment.eyebrow,
                title: lastJudgment.verdict,
                subtitle: lastJudgment.detail,
                metrics: [
                  { label: "目標", value: `${targetTime.toFixed(2)}秒` },
                  { label: "記録", value: `${timeText}秒` },
                  { label: "誤差", value: lastJudgment.signedDiff }
                ]
              })
            : `<div class="stopwatch-result-msg">${escapeHTML(lastJudgment.verdict)}</div>`)
        : "";

      container.innerHTML = `
        <div class="tool-card text-center ten-sec-card">
          <h3 class="tool-title">ジャスト対決</h3>

          <div class="target-select-row mb-3">
            <span>目標: </span>
            <button class="btn-pill ${targetTime === 3.00 ? 'active' : ''}" data-target="3">3秒</button>
            <button class="btn-pill ${targetTime === 5.00 ? 'active' : ''}" data-target="5">5秒</button>
            <button class="btn-pill ${targetTime === 10.00 ? 'active' : ''}" data-target="10">10秒</button>
            <button class="btn-pill ${targetTime === 7.77 ? 'active' : ''}" data-target="7.77">7.77秒</button>
          </div>

          <div class="stopwatch-screen ${state === 'running' ? 'is-blind' : ''}" id="stopwatch-display">
            ${state === 'running' ? '??.??' : timeText}
            <span class="unit">秒</span>
          </div>

          ${resultMarkup}

          <div class="stopwatch-actions mt-3">
            ${state === 'ready' || state === 'stopped' ? `
              <button class="btn btn-primary btn-lg btn-block" id="btn-sw-start">${state === 'stopped' ? 'もう一度挑戦する' : 'スタート'}</button>
            ` : `
              <button class="btn btn-danger btn-lg btn-block pulse-scale" id="btn-sw-stop">ストップ</button>
            `}
          </div>

          ${scores.length > 0 ? `
            <div class="scores-history-list mt-3">
              <span class="field-label">直近の記録（誤差）</span>
              <div class="score-chips">
                ${scores.map(s => `<span class="score-chip">${escapeHTML(s.time)}秒 (${escapeHTML(s.signedDiff)})</span>`).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;

      container.querySelectorAll("[data-target]").forEach(btn => {
        btn.addEventListener("click", () => {
          Sound.playClick();
          targetTime = parseFloat(btn.dataset.target);
          state = "ready";
          lastJudgment = null;
          render();
        });
      });

      if (state === "ready" || state === "stopped") {
        container.querySelector("#btn-sw-start").addEventListener("click", () => {
          Sound.playSelect();
          state = "running";
          lastJudgment = null;
          startTime = performance.now();
          render();
        });
      } else {
        container.querySelector("#btn-sw-stop").addEventListener("click", () => {
          stopTime = performance.now();
          state = "stopped";
          const elapsed = (stopTime - startTime) / 1000;
          lastJudgment = typeof GameResult !== "undefined"
            ? GameResult.judgeTenSeconds(elapsed, targetTime)
            : {
                displaySec: elapsed.toFixed(2),
                diffSec: Math.abs(elapsed - targetTime),
                signedDiff: `${elapsed - targetTime >= 0 ? "+" : "-"}${Math.abs(elapsed - targetTime).toFixed(2)}秒`,
                tier: Math.abs(elapsed - targetTime) <= 0.15 ? "pro" : "miss",
                tone: Math.abs(elapsed - targetTime) <= 0.15 ? "win" : "neutral",
                eyebrow: "計測結果",
                verdict: `${elapsed.toFixed(2)}秒`,
                detail: "",
                celebrate: Math.abs(elapsed - targetTime) <= 0.15
              };

          scores.unshift({
            time: lastJudgment.displaySec,
            signedDiff: lastJudgment.signedDiff
          });
          if (scores.length > 5) scores.pop();

          if (lastJudgment.tier === "just") {
            Sound.playFanfare();
            if (typeof Confetti !== "undefined") Confetti.burst(60);
          } else if (lastJudgment.tier === "pro") {
            Sound.playFanfare();
            if (typeof Confetti !== "undefined") Confetti.burst(38);
          } else if (lastJudgment.tier === "close") {
            Sound.playCorrect();
          } else {
            if (typeof Sound.playTimeUp === "function") Sound.playTimeUp();
            else Sound.playWrong();
          }

          if (typeof window !== "undefined" && window.StampRally) {
            window.StampRally.markPlayed("ten-seconds");
          }
          render();
        });
      }
    }

    render();
    return () => {};
  },

  // ===================================================
  // 8. 深掘りトークガチャ
  // ===================================================
  renderTalkGacha(container, game) {
    let mode = "gacha";
    let presets = game.presets || [];
    let selectedCat = "all";

    function parseChoiceItem(item) {
      if (!item) return { a: "選択肢A", b: "選択肢B" };
      let a = item.a;
      let b = item.b;
      if (!a && item.text) {
        const parts = item.text.split(/ VS | vs | ＶＳ /i);
        a = parts[0] ? parts[0].trim() : item.text;
        b = parts[1] ? parts[1].trim() : "もう一方";
      }
      return { a: a || "選択肢A", b: b || "選択肢B" };
    }

    let rawTwoChoices = [
      { a: "一生ネットが使えない", b: "一生お風呂に入れない" },
      { a: "宝くじ10億円当選", b: "理想のパートナーと結婚" },
      { a: "無人島で生き抜くなら", b: "猛吹雪の雪山で生き抜くなら" },
      { a: "過去に戻れるタイムマシン", b: "未来に行けるタイムマシン" },
      { a: "激辛しか食べられない", b: "激甘しか食べられない" },
      { a: "誰からも嫌われないが愛されない", b: "大勢に嫌われるが1人に熱愛される" },
      { a: "一生寝なくても元気", b: "一生働かなくても大金持ち" },
      { a: "他人の嘘が全部分かる", b: "自分の嘘が絶対にバレない" }
    ];
    if (typeof GAMES_DATA !== "undefined") {
      const tc = GAMES_DATA.find(g => g.id === "two-choices");
      if (tc && Array.isArray(tc.presets) && tc.presets.length > 0) {
        rawTwoChoices = tc.presets;
      }
    }
    const twoChoicesPresets = rawTwoChoices.map(parseChoiceItem);

    function drawGachaItem(cat = selectedCat) {
      let list = presets;
      if (cat !== "all") {
        const filtered = presets.filter(p => p.category === cat || p.scene === cat);
        if (filtered.length > 0) list = filtered;
      }
      return DeckManager.getNext(`talk-gacha_${cat}`, list) || presets[0] || { q: "人生で一番大笑いしたハプニングは？", category: "ライト" };
    }

    const initGachaText = game && game.articleTopic
      ? (typeof game.articleTopic === "string" ? game.articleTopic : (game.articleTopic.q || game.articleTopic.text || ""))
      : "";
    let currentItem = initGachaText
      ? (presets.find(p => p.q === initGachaText) || { q: initGachaText, category: (game.articleTopic && game.articleTopic.category) || "ライト" })
      : drawGachaItem("all");

    let choiceState = {
      item: twoChoicesPresets[0] || { a: "選択肢A", b: "選択肢B" },
      countdown: -1,
      countdownInterval: null,
      votesA: 0,
      votesB: 0
    };

    function drawChoiceItem() {
      const next = DeckManager.getNext("talk-gacha_two-choices", twoChoicesPresets);
      choiceState.item = next || twoChoicesPresets[0] || { a: "選択肢A", b: "選択肢B" };
      choiceState.votesA = 0;
      choiceState.votesB = 0;
      choiceState.countdown = -1;
    }

    function startChoiceCountdown() {
      if (choiceState.countdownInterval) safeClearInterval(choiceState.countdownInterval);
      choiceState.countdown = 3;
      Sound.playTick(800);
      render();

      choiceState.countdownInterval = safeSetInterval(() => {
        choiceState.countdown--;
        if (choiceState.countdown > 0) {
          Sound.playTick(800 + (3 - choiceState.countdown) * 200);
        } else {
          safeClearInterval(choiceState.countdownInterval);
          choiceState.countdownInterval = null;
          Sound.playJajan();
          Sound.hapticMedium();
          if (typeof window !== "undefined" && window.StampRally) {
            window.StampRally.markPlayed("talk-gacha");
            window.StampRally.markPlayed("two-choices");
          }
        }
        render();
      }, 800);
    }

    function render() {
      container.innerHTML = `
        <div class="tool-card text-center talk-gacha-card">
          <div class="flex justify-between items-center mb-3 flex-wrap gap-2">
            <h3 class="tool-title" style="margin:0;">トークガチャ ＆ 究極の2択</h3>
            <div class="btn-toggle-group">
              <button class="btn-toggle btn-sm ${mode === 'gacha' ? 'active' : ''}" data-talkmode="gacha">質問ガチャ</button>
              <button class="btn-toggle btn-sm ${mode === 'choices' ? 'active' : ''}" data-talkmode="choices">究極の2択</button>
            </div>
          </div>

          ${mode === 'gacha' ? `
            <div class="gacha-cat-filters mb-2">
              <button class="btn-filter-tag ${selectedCat === 'all' ? 'active' : ''}" data-cat="all">すべて</button>
              <button class="btn-filter-tag ${selectedCat === 'ライト' ? 'active' : ''}" data-cat="ライト">ライト</button>
              <button class="btn-filter-tag ${selectedCat === 'もしも' ? 'active' : ''}" data-cat="もしも">もしも</button>
              <button class="btn-filter-tag ${selectedCat === '本音' ? 'active' : ''}" data-cat="本音">本音</button>
              <button class="btn-filter-tag ${selectedCat === '恋愛' ? 'active' : ''}" data-cat="恋愛">恋愛</button>
              <button class="btn-filter-tag ${selectedCat === 'ディープ' ? 'active' : ''}" data-cat="ディープ">ディープ</button>
            </div>

            <div class="gacha-question-display my-3">
              <span class="gacha-badge">${escapeHTML(currentItem.category || currentItem.scene || "トーク")}</span>
              <div class="gacha-text">${escapeHTML(currentItem.q || currentItem.text || "質問がここに表示されます")}</div>
            </div>

            <button class="btn btn-primary btn-lg btn-block font-bold" id="btn-spin-gacha">
              <span>質問ガチャを回す</span>
            </button>
          ` : `
            <div class="two-choices-box my-3">
              <span class="badge badge-warning text-xs font-black">究極の2択</span>
              <div class="grid grid-cols-2 gap-2 my-3">
                <div class="p-3 border rounded text-center choice-opt-a">
                  <span class="font-black text-xs choice-text-a">A</span>
                  <div class="font-bold text-sm my-2">${escapeHTML(choiceState.item.a)}</div>
                  <button class="btn btn-xs btn-choice-a" id="btn-vote-a">投票 (${choiceState.votesA})</button>
                </div>
                <div class="p-3 border rounded text-center choice-opt-b">
                  <span class="font-black text-xs choice-text-b">B</span>
                  <div class="font-bold text-sm my-2">${escapeHTML(choiceState.item.b)}</div>
                  <button class="btn btn-xs btn-choice-b" id="btn-vote-b">投票 (${choiceState.votesB})</button>
                </div>
              </div>

              <div class="countdown-display my-2">
                ${choiceState.countdown > 0 ? `
                  <div class="font-black text-3xl text-primary animate-scale">${choiceState.countdown}</div>
                ` : choiceState.countdown === 0 ? `
                  <div class="font-black text-xl text-danger animate-scale">せーの、指差し！</div>
                ` : `
                  <div class="text-xs text-muted">「せーの」で選んだ方を一斉に指差しましょう</div>
                `}
              </div>

              <div class="flex gap-2 mt-3">
                <button class="btn btn-primary flex-1 font-bold" id="btn-choice-countdown">
                  せーのカウント
                </button>
                <button class="btn btn-outline" id="btn-choice-next">次の2択</button>
              </div>
            </div>
          `}
        </div>
      `;

      container.querySelectorAll("[data-talkmode]").forEach(btn => {
        btn.onclick = () => {
          Sound.playClick();
          mode = btn.dataset.talkmode;
          render();
        };
      });

      if (mode === 'gacha') {
        container.querySelectorAll(".btn-filter-tag").forEach(b => {
          b.onclick = () => {
            Sound.playClick();
            selectedCat = b.dataset.cat;
            currentItem = drawGachaItem(selectedCat);
            render();
          };
        });

        const spinBtn = container.querySelector("#btn-spin-gacha");
        if (spinBtn) {
          spinBtn.onclick = () => {
            Sound.playSelect();
            currentItem = drawGachaItem(selectedCat);
            if (typeof window !== "undefined" && window.StampRally) {
              window.StampRally.markPlayed("talk-gacha");
            }
            render();
          };
        }
      }

      if (mode === 'choices') {
        const btnCount = container.querySelector("#btn-choice-countdown");
        if (btnCount) btnCount.onclick = startChoiceCountdown;

        const btnNextChoice = container.querySelector("#btn-choice-next");
        if (btnNextChoice) {
          btnNextChoice.onclick = () => {
            Sound.playClick();
            drawChoiceItem();
            render();
          };
        }

        const btnVoteA = container.querySelector("#btn-vote-a");
        if (btnVoteA) btnVoteA.onclick = () => { Sound.playPop(); choiceState.votesA++; render(); };

        const btnVoteB = container.querySelector("#btn-vote-b");
        if (btnVoteB) btnVoteB.onclick = () => { Sound.playPop(); choiceState.votesB++; render(); };
      }
    }

    render();
    return () => {
      if (choiceState.countdownInterval) safeClearInterval(choiceState.countdownInterval);
    };
  },

  // ===================================================
  // 9. NGワードゲームツール
  // ===================================================
  renderNgWord(container, game) {
    let presets = game.presets || [];
    let state = {
      mode: "duel",
      reader: 1,
      showingWord: false,
      peekingFor: null,
      peekRevealed: false,
      p1Word: "",
      p2Word: "",
      duelTimerSec: 180,
      duelTimerRunning: false,
      duelTimerInterval: null,
      winner: null,
      gachaCount: 4,
      writer: 0,
      slipOpen: false,
      gachaWords: []
    };

    function pickRandomWord() {
      const item = drawShuffledTopic(game.id, presets);
      return extractTopicText(item) || "マジで / やばい / それな";
    }

    function initDuel() {
      state.reader = 1;
      state.showingWord = false;
      state.peekingFor = null;
      state.peekRevealed = false;
      state.p1Word = pickRandomWord();
      state.p2Word = pickRandomWord();
      if (state.p2Word === state.p1Word) {
        const others = getActiveTopicsForGame(game.id, presets).map(extractTopicText).filter(word => word && word !== state.p1Word);
        if (others.length) state.p2Word = others[Math.floor(Math.random() * others.length)];
      }
      state.duelTimerSec = 180;
      state.winner = null;
    }
    initDuel();

    function initGacha() {
      state.writer = 0;
      state.slipOpen = false;
      state.gachaWords = [];
      DeckManager.reset(game.id);
      for (let i = 0; i < state.gachaCount; i++) {
        state.gachaWords.push({
          player: `プレイヤー ${i + 1}`,
          word: pickRandomWord()
        });
      }
    }
    initGacha();

    function startDuelTimer() {
      if (state.duelTimerInterval) safeClearInterval(state.duelTimerInterval);
      state.duelTimerRunning = true;
      state.duelTimerInterval = safeSetInterval(() => {
        state.duelTimerSec--;
        if (state.duelTimerSec <= 10 && state.duelTimerSec > 0) {
          Sound.playTick(900);
        } else if (state.duelTimerSec <= 0) {
          safeClearInterval(state.duelTimerInterval);
          state.duelTimerInterval = null;
          state.duelTimerRunning = false;
          if (typeof Sound.playTimeUp === "function") Sound.playTimeUp();
          else Sound.playSelect();
          state.winner = "draw";
          render();
          container.querySelector("#btn-ng-duel-next")?.focus();
          if (typeof window !== "undefined" && window.StampRally) {
            window.StampRally.markPlayed("ng-word");
          }
        }
        updateDuelTimerDisplay();
      }, 1000);
      updateDuelTimerDisplay();
    }

    function stopDuelTimer() {
      if (state.duelTimerInterval) {
        safeClearInterval(state.duelTimerInterval);
        state.duelTimerInterval = null;
      }
      state.duelTimerRunning = false;
      updateDuelTimerDisplay();
    }

    function updateDuelTimerDisplay() {
      const el = container.querySelector("#duel-ng-timer");
      const btn = container.querySelector("#btn-duel-timer-toggle");
      if (el) {
        const m = Math.floor(state.duelTimerSec / 60);
        const s = state.duelTimerSec % 60;
        el.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
        el.className = "font-black font-mono text-xl " + (state.duelTimerSec <= 10 ? "text-danger animate-pulse" : "text-primary");
      }
      if (btn) {
        btn.textContent = state.duelTimerRunning ? "一時停止" : "スタート";
        btn.className = state.duelTimerRunning ? "btn btn-xs btn-warning" : "btn btn-xs btn-primary";
      }
    }

    function render() {
      const winnerCard = state.winner
        ? (typeof GameResult !== "undefined"
            ? GameResult.renderResultCard({
                tone: state.winner === "draw" ? "neutral" : "win",
                eyebrow: state.winner === "draw" ? "タイムアップ" : "NGワード発動",
                title: state.winner === "draw" ? "時間切れ・引き分け" : `PLAYER ${state.winner} の勝利`,
                subtitle: state.winner === "draw"
                  ? "どちらもNGワードを言わずに耐え抜きました"
                  : `相手にNGワードを言わせて勝負が決まりました`,
                metrics: [
                  { label: "P1のNGワード", value: state.p1Word },
                  { label: "P2のNGワード", value: state.p2Word }
                ],
                actionsHtml: `
                  <button class="btn btn-primary btn-sm flex-1 font-bold" id="btn-ng-duel-next">次の対戦</button>
                  ${state.winner === "draw" ? "" : '<button class="btn btn-outline btn-sm flex-1 font-bold" id="btn-ng-batsu">ソフトミッション</button>'}
                `
              })
            : `<div class="animate-scale my-1">
                <div class="font-black text-lg text-danger">${state.winner === "draw" ? "時間切れ・引き分け" : `PLAYER ${state.winner} の勝利`}</div>
                <div class="text-xs text-muted mt-1">P1のNG: [${escapeHTML(state.p1Word)}] / P2のNG: [${escapeHTML(state.p2Word)}]</div>
                <div class="flex gap-2 mt-2">
                  <button class="btn btn-primary btn-sm flex-1 font-bold" id="btn-ng-duel-next">次の対戦</button>
                  ${state.winner === "draw" ? "" : '<button class="btn btn-outline btn-sm flex-1 font-bold" id="btn-ng-batsu">ソフトミッション</button>'}
                </div>
              </div>`)
        : "";

      container.innerHTML = `
        <div class="tool-card text-center p-2">
          <div class="flex justify-between items-center mb-2 flex-wrap gap-2">
            <h3 class="tool-title text-base" style="margin:0;">NGワードゲーム</h3>
            <div class="btn-toggle-group">
              <button class="btn-toggle btn-sm ${state.mode === 'duel' ? 'active' : ''}" data-ngmode="duel">2人対面</button>
              <button class="btn-toggle btn-sm ${state.mode === 'gacha' ? 'active' : ''}" data-ngmode="gacha">複数人（お題）</button>
            </div>
          </div>

          ${state.mode === 'duel' && state.reader <= 2 ? `
            <div class="topic-box my-3 text-center">
              <h4>プレイヤー ${state.reader} に渡してください</h4>
              ${state.showingWord ? `<p>相手に言わせる言葉（札のどれか1語でアウト）</p><p class="ng-p-word font-bold">${escapeHTML(state.reader === 1 ? state.p2Word : state.p1Word)}</p>
                <button class="btn btn-primary" id="ng-hide">伏せて${state.reader === 1 ? "次の人へ" : "会話を始める"}</button>` :
                '<button class="btn btn-primary" id="ng-reveal">自分だけで確認する</button>'}
            </div>` : state.mode === 'duel' ? `
            <div class="ng-duel-wrapper border rounded p-2" style="background: rgba(0,0,0,0.02); min-height: 400px; display: flex; flex-direction: column; justify-content: space-between;">
              <div class="border rounded p-3 text-center" style="background: rgba(239,68,68,0.06); border-color: rgba(239,68,68,0.3);">
                <div class="text-xs font-bold text-danger mb-1">PLAYER 2（相手）</div>
                <button class="btn btn-sm btn-danger btn-block mt-2 font-bold" id="btn-p1-said" ${state.winner ? 'disabled' : ''}>
                  P1が言った（P2の勝利）
                </button>
              </div>

              <div class="my-2 py-2 border-y text-center">
                ${state.winner ? winnerCard : `
                  <div class="flex justify-between items-center px-2">
                    <span class="text-xs font-bold text-muted">トーク制限時間</span>
                    <span id="duel-ng-timer" class="font-black font-mono text-xl text-primary">3:00</span>
                    <div class="flex gap-1">
                      <button class="btn btn-xs btn-primary" id="btn-duel-timer-toggle">スタート</button>
                      <button class="btn btn-xs btn-outline" id="btn-duel-timer-reset">リセット</button>
                    </div>
                  </div>
                  <p class="text-xs text-muted mt-1">相手にだけ見えるNGワードを会話で自然に誘導しましょう</p>
                `}
              </div>

              <div class="border rounded p-3 text-center" style="background: rgba(59,130,246,0.06); border-color: rgba(59,130,246,0.3);">
                <div class="text-xs font-bold text-primary mb-1">PLAYER 1（あなた）</div>
                <button class="btn btn-sm btn-primary btn-block mt-2 font-bold" id="btn-p2-said" ${state.winner ? 'disabled' : ''}>
                  P2が言った（P1の勝利）
                </button>
              </div>
            </div>
          ` : `
            <div class="ng-gacha-wrapper text-left p-2">
              <div class="flex justify-between items-center mb-2">
                <label class="text-xs font-bold">参加人数: <span class="badge-num">${state.gachaCount}人</span></label>
                <button class="btn btn-sm btn-primary" id="btn-gacha-reroll">全員分再抽選</button>
              </div>
              <input type="range" class="range-slider mb-3" min="2" max="8" value="${state.gachaCount}" id="range-ng-gacha-count">

              <p class="text-sm text-sub mb-3">紙とペンを用意し、隣の人の札を1枚ずつ書きます。札のどれか1語を言ったらアウトです。</p>
              ${state.writer < state.gachaCount ? `
                <div class="topic-box text-center">
                  <p>プレイヤー ${state.writer + 1} に端末を渡してください。</p>
                  ${state.slipOpen ? `<p>${state.gachaWords[(state.writer + 1) % state.gachaCount].player} 用の札</p>
                    <strong class="ng-slip">${escapeHTML(state.gachaWords[(state.writer + 1) % state.gachaCount].word)}</strong>
                    <p class="text-xs text-sub mt-2">書いた紙を本人に見せずに置いてください。</p>
                    <button class="btn btn-primary mt-2" id="ng-slip-next">書いたので伏せる</button>` :
                    '<button class="btn btn-primary mt-2" id="ng-slip-open">自分が書く札だけを見る</button>'}
                </div>` : '<div class="topic-box text-center">全員の札ができました。自分の札だけが見えないように持ち、会話を始めましょう。</div>'}

              <div class="flex gap-2 mt-4">
                <button class="btn btn-secondary flex-1" id="btn-gacha-batsu">ソフトミッションを引く</button>
              </div>
            </div>
          `}
        </div>
      `;

      container.querySelector("#ng-reveal")?.addEventListener("click", () => {
        state.showingWord = true;
        render();
        container.querySelector("#ng-hide")?.focus();
      });
      container.querySelector("#ng-hide")?.addEventListener("click", () => {
        state.showingWord = false;
        state.reader++;
        render();
        container.querySelector("#ng-reveal, #btn-duel-timer-toggle")?.focus();
      });
      container.querySelectorAll("[data-ngmode]").forEach(btn => {
        btn.onclick = () => {
          Sound.playClick();
          stopDuelTimer();
          state.mode = btn.dataset.ngmode;
          state.slipOpen = false;
          state.showingWord = false;
          render();
        };
      });

      if (state.mode === 'duel') {
        const btnToggleTimer = container.querySelector("#btn-duel-timer-toggle");
        if (btnToggleTimer) {
          btnToggleTimer.onclick = () => {
            if (state.duelTimerRunning) {
              stopDuelTimer();
              Sound.playClick();
            } else {
              startDuelTimer();
              Sound.playSelect();
            }
          };
        }

        const btnResetTimer = container.querySelector("#btn-duel-timer-reset");
        if (btnResetTimer) {
          btnResetTimer.onclick = () => {
            Sound.playClick();
            stopDuelTimer();
            state.duelTimerSec = 180;
            updateDuelTimerDisplay();
          };
        }

        const finishDuel = (winnerNum) => {
          if (state.winner !== null) return;
          stopDuelTimer();
          Sound.playFanfare();
          Sound.hapticMedium();
          if (typeof Confetti !== "undefined") Confetti.burst(46);
          state.winner = winnerNum;
          if (typeof window !== "undefined" && window.StampRally) {
            window.StampRally.markPlayed("ng-word");
          }
          render();
        };

        const btnP1Said = container.querySelector("#btn-p1-said");
        if (btnP1Said) btnP1Said.onclick = () => finishDuel(2);

        const btnP2Said = container.querySelector("#btn-p2-said");
        if (btnP2Said) btnP2Said.onclick = () => finishDuel(1);

        container.querySelector("#btn-peek-for-p1")?.addEventListener("click", () => {
          Sound.playClick();
          state.peekingFor = 1;
          state.peekRevealed = false;
          render();
        });
        container.querySelector("#btn-peek-for-p2")?.addEventListener("click", () => {
          Sound.playClick();
          state.peekingFor = 2;
          state.peekRevealed = false;
          render();
        });
        container.querySelector("#btn-ng-peek-open")?.addEventListener("click", () => {
          Sound.playClick();
          state.peekRevealed = true;
          render();
        });
        container.querySelector("#btn-ng-peek-close")?.addEventListener("click", () => {
          Sound.playClick();
          state.peekingFor = null;
          state.peekRevealed = false;
          render();
        });

        const btnNext = container.querySelector("#btn-ng-duel-next");
        if (btnNext) {
          btnNext.onclick = () => {
            Sound.playSelect();
            initDuel();
            render();
          };
        }

        const btnBatsu = container.querySelector("#btn-ng-batsu");
        if (btnBatsu) {
          btnBatsu.onclick = () => {
            Sound.playSelect();
            if (typeof window.openBatsuModal === "function") window.openBatsuModal();
          };
        }
      }

      if (state.mode === 'gacha') {
        container.querySelector("#ng-slip-open")?.addEventListener("click", () => {
          state.slipOpen = true;
          render();
        });
        container.querySelector("#ng-slip-next")?.addEventListener("click", () => {
          state.slipOpen = false;
          state.writer++;
          render();
        });
        const range = container.querySelector("#range-ng-gacha-count");
        if (range) {
          range.oninput = (e) => {
            state.gachaCount = parseInt(e.target.value, 10);
            initGacha();
            render();
          };
        }

        const btnReroll = container.querySelector("#btn-gacha-reroll");
        if (btnReroll) {
          btnReroll.onclick = () => {
            Sound.playSelect();
            initGacha();
            if (typeof window !== "undefined" && window.StampRally) {
              window.StampRally.markPlayed("ng-word");
            }
            render();
          };
        }

        const btnBatsu = container.querySelector("#btn-gacha-batsu");
        if (btnBatsu) {
          btnBatsu.onclick = () => {
            Sound.playSelect();
            if (typeof window.openBatsuModal === "function") window.openBatsuModal();
          };
        }
      }
    }

    render();
    return () => {
      stopDuelTimer();
    };
  },

  // ===================================================
  // 10. スマホ額当てインディアンポーカー
  // ===================================================
  renderIndianPoker(container, game) {
    const SUITS = ["♠", "♥", "♦", "♣"];
    function drawDistinctPair() {
      if (typeof GameResult !== "undefined" && typeof GameResult.dealIndianPokerPair === "function") {
        return GameResult.dealIndianPokerPair();
      }
      const p1Card = Math.floor(Math.random() * 13) + 1;
      const p1Suit = SUITS[Math.floor(Math.random() * 4)];
      let p2Card = Math.floor(Math.random() * 13) + 1;
      let p2Suit = SUITS[Math.floor(Math.random() * 4)];
      while (p2Card === p1Card && p2Suit === p1Suit) {
        p2Card = Math.floor(Math.random() * 13) + 1;
        p2Suit = SUITS[Math.floor(Math.random() * 4)];
      }
      return { p1Card, p1Suit, p2Card, p2Suit };
    }

    const initialPair = drawDistinctPair();
    let state = {
      round: 1,
      balance: 0,
      p1Card: initialPair.p1Card,
      p2Card: initialPair.p2Card,
      p1Suit: initialPair.p1Suit,
      p2Suit: initialPair.p2Suit,
      reader: 1,
      revealing: false,
      choosing: false,
      p1Action: null,
      p2Action: null,
      isDuelRevealed: false
    };

    function resetDuel() {
      const pair = drawDistinctPair();
      state.p1Card = pair.p1Card;
      state.p2Card = pair.p2Card;
      state.p1Suit = pair.p1Suit;
      state.p2Suit = pair.p2Suit;
      state.reader = 1;
      state.revealing = false;
      state.choosing = false;
      state.p1Action = null;
      state.p2Action = null;
      state.isDuelRevealed = false;
    }

    function getRank(num) {
      if (num === 1) return "A";
      if (num === 11) return "J";
      if (num === 12) return "Q";
      if (num === 13) return "K";
      return String(num);
    }

    const getCardScore = (num) => (num === 1 ? 14 : num);

    function renderCard(suit, num) {
      const isRed = suit === "♥" || suit === "♦";
      const rank = getRank(num);
      return `
        <div class="playing-card ${isRed ? 'suit-red' : 'suit-black'} animate-scale">
          <div class="card-corner-top">
            <span class="card-rank">${rank}</span>
            <span class="card-suit-mini">${suit}</span>
          </div>
          <div class="card-suit-center">${suit}</div>
          <div class="card-corner-bottom">
            <span class="card-rank">${rank}</span>
            <span class="card-suit-mini">${suit}</span>
          </div>
        </div>
      `;
    }

    function computeOutcome() {
      const p1Score = getCardScore(state.p1Card);
      const p2Score = getCardScore(state.p2Card);
      let resultText = "";
      let winner = 0;

      if (state.p1Action === "fold" && state.p2Action === "fold") {
        resultText = "両者フォールド（引き分け）";
      } else if (state.p1Action === "fold") {
        resultText = "P1が降りたため、PLAYER 2の不戦勝";
        winner = 2;
      } else if (state.p2Action === "fold") {
        resultText = "P2が降りたため、PLAYER 1の不戦勝";
        winner = 1;
      } else if (p1Score > p2Score) {
        resultText = "PLAYER 1の勝利（A最強）";
        winner = 1;
      } else if (p2Score > p1Score) {
        resultText = "PLAYER 2の勝利（A最強）";
        winner = 2;
      } else {
        resultText = "同じ数字のため引き分け";
      }

      const stake = state.p1Action === "bet" && state.p2Action === "bet" ? 2 : 1;
      const delta = winner === 1 ? stake : winner === 2 ? -stake : 0;
      const total = state.balance + delta;
      return { resultText, winner, delta, total };
    }

    function render() {
      const { resultText, delta, total } = computeOutcome();
      const matchOver = state.round === 3;
      const champion = total === 0 ? "引き分け" : (total > 0 ? "PLAYER 1" : "PLAYER 2") + " の優勝";
      const player = state.reader;
      const opponentCard = () => player === 1
        ? renderCard(state.p2Suit, state.p2Card)
        : renderCard(state.p1Suit, state.p1Card);

      let panel;
      if (state.isDuelRevealed) {
        const tone = matchOver ? (total === 0 ? "neutral" : "win") : "neutral";
        const crestHtml = typeof GameResult !== "undefined" ? GameResult.renderCrestSvg(tone) : "";
        panel = `
          <div class="result-stage result-tone-${tone}">
            <div class="result-stage-head">
              ${crestHtml ? `<div class="result-crest">${crestHtml}</div>` : ""}
              <div class="result-stage-copy">
                <span class="result-eyebrow">${matchOver ? "3局決着" : `第${state.round}局の結果`}</span>
                <h4 class="result-headline">${escapeHTML(resultText)}</h4>
                <p class="result-subline">P1: ${state.p1Suit}${getRank(state.p1Card)} ／ P2: ${state.p2Suit}${getRank(state.p2Card)}</p>
              </div>
            </div>
            <div class="result-metrics">
              <div class="result-metric-cell">
                <span class="result-metric-label">この局（点）</span>
                <strong class="result-metric-value">P1 ${delta >= 0 ? `+${delta}` : delta} / P2 ${-delta >= 0 ? `+${-delta}` : -delta}</strong>
              </div>
              <div class="result-metric-cell">
                <span class="result-metric-label">3局合計（点）</span>
                <strong class="result-metric-value">P1 ${total >= 0 ? `+${total}` : total} / P2 ${-total >= 0 ? `+${-total}` : -total}</strong>
              </div>
            </div>
            ${matchOver ? `<div class="result-details text-center"><strong id="poker-champion">3局の結果：${escapeHTML(champion)}</strong></div>` : ""}
            <div class="result-actions">
              <button class="btn btn-primary flex-1" id="btn-poker-next">${matchOver ? "新しい3局を始める" : "次のディール"}</button>
              ${matchOver && total !== 0 ? '<button class="btn btn-outline flex-1" id="btn-poker-batsu">ソフトミッション</button>' : ''}
            </div>
          </div>`;
      } else if (state.p1Action && state.p2Action) {
        panel = '<p class="mb-3">2人の選択が決まりました。画面を一緒に見てください。</p><button class="btn btn-primary btn-block" id="btn-poker-open">カードオープン判定</button>';
      } else if (player > 2) {
        panel = '<p class="mb-3">数字を伏せて話し合いましょう。相談が終わったら順番に手を決めます。</p><button class="btn btn-primary btn-block" id="poker-begin-choices">手を決める</button>';
      } else if (!state.revealing) {
        panel = `<p class="mb-3">プレイヤー ${player} に渡してください。</p><button class="btn btn-primary btn-block" id="poker-reveal">自分だけで確認する</button>`;
      } else {
        panel = `<p class="mb-2">プレイヤー ${player} が見る相手のカード</p>${opponentCard()}
          <div class="btn-group-row mt-3">
            ${state.choosing ? `<button class="btn btn-primary flex-1" id="btn-p${player}-bet">勝負する</button>
              <button class="btn btn-outline flex-1" id="btn-p${player}-fold">降りる</button>` :
              '<button class="btn btn-primary btn-block" id="poker-hide">伏せて進む</button>'}
          </div>`;
      }
      container.innerHTML = `<div class="tool-card text-center"><h3 class="tool-title">対面インディアンポーカー　第${state.round}局 / 3</h3><p class="text-sm text-sub mb-3">両者が勝負なら勝者＋2点・敗者−2点。片方が降りれば±1点。引き分けは0点です。</p>${panel}</div>`;

      function advance(action) {
        if (action) state[player === 1 ? "p1Action" : "p2Action"] = action;
        state.reader++;
        state.revealing = false;
        render();
        container.querySelector("button")?.focus();
      }
      container.querySelector("#poker-reveal")?.addEventListener("click", () => {
        Sound.playClick();
        state.revealing = true;
        render();
        container.querySelector("button")?.focus();
      });
      container.querySelector("#poker-hide")?.addEventListener("click", () => {
        Sound.playClick();
        advance();
      });
      container.querySelector("#poker-begin-choices")?.addEventListener("click", () => {
        Sound.playSelect();
        state.reader = 1;
        state.choosing = true;
        render();
        container.querySelector("button")?.focus();
      });
      container.querySelector(`#btn-p${player}-bet`)?.addEventListener("click", () => {
        Sound.playSelect();
        advance("bet");
      });
      container.querySelector(`#btn-p${player}-fold`)?.addEventListener("click", () => {
        Sound.playClick();
        advance("fold");
      });

      const btnOpen = container.querySelector("#btn-poker-open");
      if (btnOpen) {
        btnOpen.onclick = () => {
          if (!state.p1Action || !state.p2Action) return;
          const outcome = computeOutcome();
          const isFinal = state.round === 3;
          if (isFinal && outcome.total !== 0) {
            Sound.playFanfare();
            if (typeof Confetti !== "undefined") Confetti.burst(54);
          } else if (isFinal) {
            if (typeof Sound.playTimeUp === "function") Sound.playTimeUp();
            else Sound.playSelect();
          } else if (outcome.winner !== 0) {
            Sound.playCorrect();
          } else {
            Sound.playClick();
          }
          state.isDuelRevealed = true;
          if (typeof window !== "undefined" && window.StampRally) {
            window.StampRally.markPlayed("indian-poker");
          }
          render();
        };
      }

      const btnNext = container.querySelector("#btn-poker-next");
      if (btnNext) {
        btnNext.onclick = () => {
          Sound.playSelect();
          state.balance = matchOver ? 0 : total;
          state.round = matchOver ? 1 : state.round + 1;
          resetDuel();
          render();
        };
      }

      const btnBatsu = container.querySelector("#btn-poker-batsu");
      if (btnBatsu) {
        btnBatsu.onclick = () => {
          Sound.playSelect();
          if (typeof window.openBatsuModal === "function") window.openBatsuModal();
        };
      }
    }

    render();
    return () => {};
  },

  // ===================================================
  // 11. ワンナイト人狼 (One Night Werewolf)
  // ===================================================
  renderOneNightWerewolf(container, game) {
    const roster = tableRoster();
    let state = {
      playerCount: 4,
      step: "setup",
      players: [],
      centerCards: [],
      currentPlayerIdx: 0,
      seerAction: null,
      robberAction: null,
      timerSec: 180,
      timerInterval: null
    };

    const ROLE_DEFS = {
      villager: { name: "村人", team: "villager", desc: "特殊能力はありません。昼の議論で人狼を見破りましょう。" },
      werewolf: { name: "人狼", team: "werewolf", desc: "村人を欺きましょう。仲間がいれば夜にお互いを確認できます。" },
      seer: { name: "占い師", team: "villager", desc: "夜に他のプレイヤー1人、または墓地のカード2枚を確認できます。" },
      robber: { name: "怪盗", team: "villager", desc: "夜に他のプレイヤー1人と自分の役職をこっそり交換できます。" }
    };

    function update() {
      if (state.step === "setup") {
        container.innerHTML = `
          <div class="tool-card">
            <h3 class="tool-title">ワンナイト人狼 設定</h3>
            <div class="setting-group">
              <label class="setting-label">参加人数: <span id="val-ww-players" class="badge-num">${state.playerCount}人</span></label>
              <input type="range" class="range-slider" min="3" max="${game.maxPlayers}" value="${state.playerCount}" id="range-ww-players">
            </div>

            <div class="topic-box mb-3 text-left">
              <span class="topic-tag">使用される役職カード（<span id="ww-deck-count">${state.playerCount + 2}</span>枚）</span>
              <div class="mt-2 text-sm">
                人狼 2枚 ／ 占い師 1枚 ／ 怪盗 1枚 ／ 村人 <span id="ww-villagers">${state.playerCount - 2}</span>枚<br>
                <span class="text-sub">※2枚は墓地（中央）に伏せられます。誰も人狼にならない平和村の可能性もあります。</span>
              </div>
            </div>

            <details class="player-custom-accordion"><summary>席順と名前を設定（任意）</summary><div class="table-roster"></div></details>
            <button class="btn btn-primary btn-block btn-lg" id="btn-start-ww">
              <span>夜の役職を配る</span>
            </button>
          </div>
        `;

        roster.mount(container, state.playerCount);
        const range = container.querySelector("#range-ww-players");
        range.addEventListener("input", (e) => {
          state.playerCount = parseInt(e.target.value, 10);
          roster.mount(container, state.playerCount);
          container.querySelector("#val-ww-players").textContent = `${state.playerCount}人`;
          container.querySelector("#ww-deck-count").textContent = state.playerCount + 2;
          container.querySelector("#ww-villagers").textContent = state.playerCount - 2;
        });

        container.querySelector("#btn-start-ww").addEventListener("click", () => {
          Sound.playSelect();
          const deck = ["werewolf", "werewolf", "seer", "robber"];
          for (let i = 0; i < state.playerCount - 2; i++) {
            deck.push("villager");
          }
          for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
          }

          state.players = [];
          state.executed = [];
          state.peaceVote = false;
          const names = roster.labels(state.playerCount);
          for (let i = 0; i < state.playerCount; i++) {
            state.players.push({
              id: i + 1,
              name: names[i],
              initialRole: deck[i],
              currentRole: deck[i]
            });
          }
          state.centerCards = [deck[state.playerCount], deck[state.playerCount + 1]];
          state.currentPlayerIdx = 0;
          state.seerAction = null;
          state.robberAction = null;
          state.step = "confirm";
          update();
        });

      } else if (state.step === "confirm") {
        const p = state.players[state.currentPlayerIdx];
        const role = ROLE_DEFS[p.initialRole];

        container.innerHTML = `
          <div class="tool-card text-center">
            <div class="pass-indicator">順番: ${state.currentPlayerIdx + 1} / ${state.playerCount} 人目</div>
            <h3 class="player-turn-title">${escapeHTML(p.name)} さん</h3>
            <p class="pass-desc">端末を受け取ったら、下のボタンをタップして自分の役職を確認してください。</p>

            <div class="secret-box-wrapper">
              <button class="btn btn-secret" id="btn-reveal-role">
                <span class="secret-text">タップして役職を見る</span>
              </button>
              <div class="secret-word-card hidden" id="secret-role-card">
                <span class="word-category">あなたの役職</span>
                <div class="the-word">${role.name}</div>
                <p class="word-caution">${role.desc}</p>
                ${p.initialRole === 'werewolf' ? `
                  <div class="mt-2 text-sm font-bold">
                    ${state.players.filter(x => x.id !== p.id && x.initialRole === 'werewolf').length > 0
                      ? `仲間の人狼: ${state.players.filter(x => x.id !== p.id && x.initialRole === 'werewolf').map(x => escapeHTML(x.name)).join('、')}`
                      : 'あなたは孤独な人狼です（他に人狼はいません）'}
                  </div>
                ` : ''}
              </div>
            </div>

            <div class="role-action-section hidden mt-3" id="role-action-section">
              ${p.initialRole === 'seer' ? `
                <div class="seer-action-box">
                  <span class="field-label">占いのアクション（どちらか1つを選択）</span>
                  <div class="mt-2 text-left">
                    <p class="text-xs text-sub mb-1">1. 他のプレイヤー1人を占う</p>
                    <div class="btn-group-row flex-wrap mb-2">
                      ${state.players.filter(x => x.id !== p.id).map(x => `
                        <button class="btn btn-outline btn-xs btn-seer-target" data-target="${x.id}">${escapeHTML(x.name)}</button>
                      `).join('')}
                    </div>
                    <p class="text-xs text-sub mb-1">2. 墓地（中央の2枚）を占う</p>
                    <button class="btn btn-outline btn-xs btn-block" id="btn-seer-center">中央の2枚を見る</button>
                  </div>
                  <div id="seer-result-area" class="mt-2 font-bold text-primary"></div>
                </div>
              ` : ''}

              ${p.initialRole === 'robber' ? `
                <div class="robber-action-box">
                  <span class="field-label">怪盗のアクション（誰かと役職を交換）</span>
                  <div class="btn-group-row mt-2 flex-wrap">
                    ${state.players.filter(x => x.id !== p.id).map(x => `
                      <button class="btn btn-outline btn-sm btn-rob" data-target="${x.id}">${escapeHTML(x.name)}</button>
                    `).join('')}
                  </div>
                  <div id="robber-result-area" class="mt-2 font-bold text-primary"></div>
                </div>
              ` : ''}
            </div>

            <button class="btn btn-primary btn-block mt-4 hidden" id="btn-next-ww-player">
              ${state.currentPlayerIdx + 1 < state.playerCount ? '確認完了・次の人へ' : '全員完了・朝の議論を始める'}
            </button>
          </div>
        `;

        const btnReveal = container.querySelector("#btn-reveal-role");
        const cardRole = container.querySelector("#secret-role-card");
        const actionSec = container.querySelector("#role-action-section");
        const btnNext = container.querySelector("#btn-next-ww-player");

        btnReveal.addEventListener("click", () => {
          if (typeof Sound !== "undefined" && typeof Sound.hapticLight === "function") {
            Sound.hapticLight();
          }
          btnReveal.classList.add("hidden");
          cardRole.classList.remove("hidden");
          if (actionSec) actionSec.classList.remove("hidden");
          btnNext.classList.remove("hidden");

          const originalText = state.currentPlayerIdx + 1 < state.playerCount ? '確認完了・次の人へ' : '全員完了・朝の議論を始める';
          btnNext.disabled = true;
          btnNext.textContent = "夜の確認中... (2秒)";
          let waitSec = 2;
          if (state.waitInterval) safeClearInterval(state.waitInterval);
          state.waitInterval = safeSetInterval(() => {
            waitSec--;
            if (waitSec > 0) {
              btnNext.textContent = `夜の確認中... (${waitSec}秒)`;
            } else {
              safeClearInterval(state.waitInterval);
              state.waitInterval = null;
              btnNext.disabled = false;
              btnNext.textContent = originalText;
            }
          }, 800);
        });

        let nightActionDone = !(p.initialRole === "seer" || p.initialRole === "robber");
        const seerResult = container.querySelector("#seer-result-area");
        container.querySelectorAll(".btn-seer-target").forEach(btn => {
          btn.addEventListener("click", () => {
            if (typeof Sound !== "undefined" && typeof Sound.hapticLight === "function") {
              Sound.hapticLight();
            }
            const targetId = parseInt(btn.dataset.target, 10);
            const chosen = state.players.find(x => x.id === targetId);
            if (chosen) {
              nightActionDone = true;
              seerResult.textContent = `${chosen.name} の交換前の役職は【${ROLE_DEFS[chosen.initialRole].name}】でした`;
              container.querySelectorAll(".btn-seer-target").forEach(b => { b.disabled = true; });
              const btnC = container.querySelector("#btn-seer-center");
              if (btnC) btnC.disabled = true;
            }
          });
        });

        const btnSeerC = container.querySelector("#btn-seer-center");
        if (btnSeerC) {
          btnSeerC.addEventListener("click", () => {
            if (typeof Sound !== "undefined" && typeof Sound.hapticLight === "function") {
              Sound.hapticLight();
            }
            nightActionDone = true;
            seerResult.textContent = `墓地の2枚は【${ROLE_DEFS[state.centerCards[0]].name}】と【${ROLE_DEFS[state.centerCards[1]].name}】でした`;
            btnSeerC.disabled = true;
            container.querySelectorAll(".btn-seer-target").forEach(b => { b.disabled = true; });
          });
        }

        container.querySelectorAll(".btn-rob").forEach(btn => {
          btn.addEventListener("click", () => {
            if (typeof Sound !== "undefined" && typeof Sound.hapticLight === "function") {
              Sound.hapticLight();
            }
            const targetId = parseInt(btn.dataset.target, 10);
            const targetPlayer = state.players.find(x => x.id === targetId);
            if (targetPlayer) {
              nightActionDone = true;
              const oldRole = targetPlayer.currentRole;
              targetPlayer.currentRole = p.currentRole;
              p.currentRole = oldRole;
              container.querySelector("#robber-result-area").textContent = `${targetPlayer.name} と役職を交換しました。新しい役職：【${ROLE_DEFS[oldRole].name}】`;
              container.querySelectorAll(".btn-rob").forEach(b => { b.disabled = true; });
            }
          });
        });

        btnNext.addEventListener("click", async () => {
          if (!nightActionDone) {
            const roleLabel = p.initialRole === "seer" ? "占い" : "交換";
            const ok = typeof GameResult !== "undefined" && typeof GameResult.confirmAction === "function"
              ? await GameResult.confirmAction({
                  title: "夜のアクションが未実行です",
                  message: `${role.name}の「${roleLabel}」をまだ実行していません。能力を使わずに次の人へ進みますか？`,
                  confirmLabel: "そのまま進む",
                  cancelLabel: "戻って選ぶ"
                })
              : true;
            if (!ok) return;
          }
          if (typeof Sound !== "undefined" && typeof Sound.hapticLight === "function") {
            Sound.hapticLight();
          }
          if (state.currentPlayerIdx + 1 < state.playerCount) {
            state.currentPlayerIdx++;
            update();
          } else {
            Sound.playSelect();
            state.step = "talk";
            update();
          }
        });

      } else if (state.step === "talk") {
        let remaining = state.timerSec;

        container.innerHTML = `
          <div class="tool-card text-center">
            <div class="timer-badge">朝の議論タイム</div>
            <div class="timer-display-lg" id="ww-talk-timer">${Math.floor(remaining / 60)}:00</div>
            <p class="timer-guide">夜に何が起きたかを話し合い、人狼を見破りましょう（占い師や怪盗の騙りもOK）。</p>

            <div class="btn-group-row">
              <button class="btn btn-secondary" id="btn-ww-toggle">一時停止</button>
              <button class="btn btn-danger" id="btn-ww-finish">議論終了・投票へ</button>
            </div>
          </div>
        `;

        const display = container.querySelector("#ww-talk-timer");
        const btnToggle = container.querySelector("#btn-ww-toggle");
        const btnFinish = container.querySelector("#btn-ww-finish");

        if (state.timer) state.timer.destroy();
        state.timer = new GameTimer({
          totalSeconds: state.timerSec,
          tickSoundInterval: 10,
          title: "ワンナイト人狼",
          gameId: "one-night-werewolf",
          onTick: (rem) => {
            const m = Math.floor(rem / 60);
            const s = rem % 60;
            display.textContent = `${m}:${s.toString().padStart(2, '0')}`;
            if (rem <= 10 && rem > 0) {
              display.classList.add("pulse-red");
            }
          },
          onFinish: () => {
            if (typeof Sound.playTimeUp === "function") Sound.playTimeUp();
            else Sound.playSelect();
            Toast.info("朝の議論タイム終了。投票に移ります");
            state.step = "vote";
            update();
          }
        });
        state.timer.start();

        btnToggle.addEventListener("click", () => {
          Sound.playClick();
          const running = state.timer.toggle();
          btnToggle.textContent = running ? "一時停止" : "再開";
        });

        btnFinish.addEventListener("click", () => {
          Sound.playSelect();
          if (state.timer) state.timer.destroy();
          state.step = "vote";
          update();
        });

      } else if (state.step === "vote") {
        container.innerHTML = `
          <div class="tool-card text-center">
            <h3 class="tool-title">投票フェーズ</h3>
            <p class="vote-instruction">せーので怪しいと思う人を一斉に指差してください。</p>

            <div class="topic-box mb-3 text-left">
              <span class="topic-tag">投票ルール</span>
              <div class="text-sm mt-1">
                ・最多票が並んだら該当者を全員選びます。全員が1票ずつなら誰も処刑しません。<br>
                ・人狼を1人でも処刑できれば【村人チームの勝利】。<br>
                ・人狼がいて1人も処刑できなければ【人狼チームの勝利】。平和村で誰かを処刑すると【全員敗北】。<br>
                ・誰も人狼がいない平和村で「処刑なし」を選べれば【全員の勝利】。
              </div>
            </div>

            <fieldset class="ww-votes"><legend>最多票の人を選択（同票は複数可）</legend>
              ${state.players.map(p => `<label><input type="checkbox" data-voted="${p.id}"> ${escapeHTML(p.name)}</label>`).join("")}
              <label><input type="checkbox" id="ww-peace"> 全員が1票ずつ（処刑なし）</label>
            </fieldset>
            <button class="btn btn-warning btn-lg btn-block" id="btn-open-ww-result" disabled>
              <span>投票完了・結果発表</span>
            </button>
          </div>
        `;

        const open = container.querySelector("#btn-open-ww-result");
        const candidates = [...container.querySelectorAll("[data-voted]")];
        const peace = container.querySelector("#ww-peace");
        container.querySelector(".ww-votes").addEventListener("change", event => {
          if (event.target === peace && peace.checked) candidates.forEach(box => { box.checked = false; });
          if (event.target !== peace) peace.checked = false;
          if (candidates.every(box => box.checked)) {
            candidates.forEach(box => { box.checked = false; });
            peace.checked = true;
          }
          state.peaceVote = peace.checked;
          state.executed = candidates.filter(box => box.checked).map(box => Number(box.dataset.voted));
          open.disabled = !state.peaceVote && !state.executed.length;
        });
        open.addEventListener("click", () => {
          const werewolves = state.players.filter(p => p.currentRole === "werewolf");
          const hasWerewolf = werewolves.length > 0;
          const executed = state.players.filter(p => state.executed.includes(p.id));
          const caughtWerewolf = executed.some(p => p.currentRole === "werewolf");
          const judgment = typeof GameResult !== "undefined"
            ? GameResult.judgeOneNightOutcome({ hasWerewolf, peaceVote: state.peaceVote, caughtWerewolf })
            : { shouldCelebrate: hasWerewolf || state.peaceVote };

          if (judgment.shouldCelebrate) {
            Sound.playFanfare();
            if (typeof Confetti !== "undefined") Confetti.burst(54);
          } else {
            Sound.playWrong();
          }
          state.step = "result";
          update();
        });

      } else if (state.step === "result") {
        if (typeof window !== "undefined" && window.StampRally) {
          window.StampRally.markPlayed("one-night-werewolf");
        }
        const werewolves = state.players.filter(p => p.currentRole === "werewolf");
        const hasWerewolf = werewolves.length > 0;
        const executed = state.players.filter(p => state.executed.includes(p.id));
        const caught = executed.some(p => p.currentRole === "werewolf");
        const judgment = typeof GameResult !== "undefined"
          ? GameResult.judgeOneNightOutcome({ hasWerewolf, peaceVote: state.peaceVote, caughtWerewolf: caught })
          : {
              tone: !hasWerewolf && !state.peaceVote ? "lose" : (caught || (!hasWerewolf && state.peaceVote) ? "win" : "wolf"),
              eyebrow: "ゲーム終了",
              verdict: !hasWerewolf
                ? (state.peaceVote ? "全員の勝利（平和村）" : "全員敗北（引き分け）")
                : (caught ? "村人チームの勝利" : "人狼チームの勝利")
            };
        const outcome = state.peaceVote
          ? "全員1票のため、処刑なし"
          : "最多票で処刑：" + executed.map(p => p.name + "（" + ROLE_DEFS[p.currentRole].name + "）").join("、");
        const crestHtml = typeof GameResult !== "undefined" ? GameResult.renderCrestSvg(judgment.tone) : "";

        container.innerHTML = `
          <div class="tool-card text-center">
            <div class="result-stage result-tone-${judgment.tone}">
              <div class="result-stage-head">
                ${crestHtml ? `<div class="result-crest">${crestHtml}</div>` : ""}
                <div class="result-stage-copy">
                  <span class="result-eyebrow">${escapeHTML(judgment.eyebrow)}</span>
                  <h3 id="ww-verdict" class="result-headline">${escapeHTML(judgment.verdict || judgment.title || "")}</h3><p class="result-subline">${escapeHTML(outcome)}</p>
                </div>
              </div>
            </div>

            <div class="roles-list my-3">
              ${state.players.map(p => `
                <div class="role-item ${p.currentRole === 'werewolf' ? 'is-wolf' : 'is-citizen'}">
                  <span class="role-icon">${ROLE_DEFS[p.currentRole].name}</span>
                  <span class="role-player">${escapeHTML(p.name)}</span>
                  <span class="role-word">${p.initialRole !== p.currentRole ? `(元: ${ROLE_DEFS[p.initialRole].name})` : ''}</span>
                </div>
              `).join('')}
            </div>

            <div class="topic-box mt-3 text-left">
              <span class="topic-tag">墓地（使われなかったカード）</span>
              <div class="font-bold mt-1">
                ${ROLE_DEFS[state.centerCards[0]].name} ／ ${ROLE_DEFS[state.centerCards[1]].name}
              </div>
              ${!hasWerewolf ? '<div class="text-success font-bold mt-1">この村には人狼がいませんでした（平和村）</div>' : ''}
            </div>

            <button class="btn btn-primary btn-block mt-4" id="btn-restart-ww">もう一度遊ぶ</button>
          </div>
        `;

        container.querySelector("#btn-restart-ww").addEventListener("click", () => {
          Sound.playClick();
          state.step = "setup";
          update();
        });
      }
    }

    update();
    return () => {
      if (state.timer) state.timer.destroy();
      if (state.timerInterval) safeClearInterval(state.timerInterval);
      if (state.waitInterval) safeClearInterval(state.waitInterval);
    };
  },

  // ===================================================
  // 12. 詠み人知らず (リレー五七五)
  // ===================================================
  renderYomibito(container) {
    let state = {
      step: "input-kami",
      kami: "",
      naka: "",
      shimo: ""
    };

    function bindHaikuStep({ inputId, submitId, targetCount, nextStep, emptyMsg, onComplete }) {
      const inp = container.querySelector(`#${inputId}`);
      const counter = container.querySelector("#haiku-char-count");
      const updateCount = () => {
        if (!inp || !counter) return;
        const len = [...inp.value.trim()].length;
        counter.textContent = `いま ${len}文字 ／ 目安 ${targetCount}文字`;
        counter.className = "text-xs font-bold mt-2 " + (len === targetCount ? "text-success" : "text-sub");
      };
      if (inp) {
        inp.addEventListener("input", updateCount);
        inp.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            container.querySelector(`#${submitId}`)?.click();
          }
        });
        updateCount();
      }
      container.querySelector(`#${submitId}`)?.addEventListener("click", () => {
        const val = inp ? inp.value.trim() : "";
        if (!val) {
          Toast.warning(emptyMsg);
          inp?.focus();
          return;
        }
        onComplete(val);
        state.step = nextStep;
        render();
      });
    }

    function render() {
      if (state.step === "input-kami") {
        container.innerHTML = `
          <div class="tool-card text-center">
            <span class="card-badge badge-talk">詠み人知らず（1人目）</span>
            <h3 class="tool-title mt-2">上の句（5文字）を入力</h3>
            <p class="text-sm">一句を3人で作ります。4人以上なら、次の句はまだ書いていない人から時計回りに。</p>
            <p class="text-sub text-sm mb-3">例: 「あさおきて」「すきなひと」「ねむれない」</p>

            <div class="haiku-input-box mb-3">
              <input type="text" class="decision-input" id="input-kami" placeholder="5文字程度のフレーズを入力..." maxlength="12" aria-label="上の句（5文字）">
              <div id="haiku-char-count" class="text-xs font-bold text-sub mt-2" aria-live="polite">いま 0文字 ／ 目安 5文字</div>
            </div>

            <button class="btn btn-primary btn-block btn-lg" id="btn-submit-kami">
              <span>伏せて次の人へ渡す</span>
            </button>
          </div>
        `;

        bindHaikuStep({
          inputId: "input-kami",
          submitId: "btn-submit-kami",
          targetCount: 5,
          nextStep: "input-naka",
          emptyMsg: "上の句を入力してください",
          onComplete: (val) => { Sound.playSelect(); state.kami = val; }
        });

      } else if (state.step === "input-naka") {
        container.innerHTML = `
          <div class="tool-card text-center">
            <span class="card-badge badge-talk">詠み人知らず（2人目）</span>
            <h3 class="tool-title mt-2">中の句（7文字）を入力</h3>
            <p class="text-sub text-sm mb-3">前の人が書いた上の句は秘密です。直感で7文字を入れましょう。<br>例: 「カレーをたべて」「電車にゆられ」「全力疾走」</p>

            <div class="haiku-input-box mb-3">
              <input type="text" class="decision-input" id="input-naka" placeholder="7文字程度のフレーズを入力..." maxlength="15" aria-label="中の句（7文字）">
              <div id="haiku-char-count" class="text-xs font-bold text-sub mt-2" aria-live="polite">いま 0文字 ／ 目安 7文字</div>
            </div>

            <button class="btn btn-primary btn-block btn-lg" id="btn-submit-naka">
              <span>伏せて次の人へ渡す</span>
            </button>
          </div>
        `;

        bindHaikuStep({
          inputId: "input-naka",
          submitId: "btn-submit-naka",
          targetCount: 7,
          nextStep: "input-shimo",
          emptyMsg: "中の句を入力してください",
          onComplete: (val) => { Sound.playSelect(); state.naka = val; }
        });

      } else if (state.step === "input-shimo") {
        container.innerHTML = `
          <div class="tool-card text-center">
            <span class="card-badge badge-talk">詠み人知らず（3人目）</span>
            <h3 class="tool-title mt-2">下の句（5文字・締め）を入力</h3>
            <p class="text-sub text-sm mb-3">上の句・中の句は秘密です。締めとなる5文字を入れましょう。<br>例: 「ふっとんだ」「ゆめでした」「ありがたや」</p>

            <div class="haiku-input-box mb-3">
              <input type="text" class="decision-input" id="input-shimo" placeholder="5文字程度のフレーズを入力..." maxlength="12" aria-label="下の句（5文字）">
              <div id="haiku-char-count" class="text-xs font-bold text-sub mt-2" aria-live="polite">いま 0文字 ／ 目安 5文字</div>
            </div>

            <button class="btn btn-success btn-block btn-lg pulse-scale" id="btn-submit-shimo">
              <span>完成・全員でオープン</span>
            </button>
          </div>
        `;

        bindHaikuStep({
          inputId: "input-shimo",
          submitId: "btn-submit-shimo",
          targetCount: 5,
          nextStep: "reveal",
          emptyMsg: "下の句を入力してください",
          onComplete: (val) => {
            Sound.playFanfare();
            if (typeof Confetti !== "undefined") Confetti.burst(42);
            if (typeof window !== "undefined" && window.StampRally) {
              window.StampRally.markPlayed("yomibito");
            }
            state.shimo = val;
          }
        });

      } else if (state.step === "reveal") {
        const haikuBody = `
          <div class="haiku-scroll-display my-3">
            <div class="haiku-line kami">「 ${escapeHTML(state.kami)} 」</div>
            <div class="haiku-line naka">「 ${escapeHTML(state.naka)} 」</div>
            <div class="haiku-line shimo">「 ${escapeHTML(state.shimo)} 」</div>
          </div>
        `;
        const revealCard = typeof GameResult !== "undefined"
          ? GameResult.renderResultCard({
              tone: "win",
              eyebrow: "一句完成",
              title: "合作の一句が完成しました",
              subtitle: "全員で声に出して読み上げましょう。次の句は、下の句を書いた人の隣から。",
              bodyHtml: haikuBody,
              actionsHtml: `
                <button class="btn btn-outline flex-1" id="btn-copy-haiku">一句をコピー</button>
                <button class="btn btn-primary flex-1" id="btn-restart-haiku">もう1句詠む</button>
              `
            })
          : `<div class="asa-sore-banner">合作の一句が完成</div>${haikuBody}`;

        container.innerHTML = `<div class="tool-card text-center haiku-reveal-card">${revealCard}</div>`;

        container.querySelector("#btn-copy-haiku")?.addEventListener("click", async () => {
          Sound.playClick();
          const haikuText = `【詠み人知らず】合作の一句\n${state.kami}\n${state.naka}\n${state.shimo}`;
          const copied = typeof GameResult !== "undefined" && typeof GameResult.copyText === "function"
            ? await GameResult.copyText(haikuText)
            : false;
          if (copied) Toast.success("一句をコピーしました");
          else Toast.warning("コピーできませんでした");
        });

        container.querySelector("#btn-restart-haiku")?.addEventListener("click", () => {
          Sound.playClick();
          state.step = "input-kami";
          state.kami = "";
          state.naka = "";
          state.shimo = "";
          render();
        });
      }
    }

    render();
    return () => {};
  },

  // ===================================================
  // 13. 罰ゲームルーレット
  // ===================================================
  renderBatsuRoulette(container, game) { /* Canonical implementation in js/quality/data-contract.js */ },

  // ===================================================
  // 新規追加ツール ＆ 2人対戦 ＆ ガイド完全ツール化
  // ===================================================
  renderDuelReflex(container, game) { /* Canonical implementation in js/quality/tool-fixes.js */ },

  // ===================================================
  // 5. 2人対戦：💥 連打パワーバトル (Tug of War Mash)
  // ===================================================
  renderDuelMash(container, game) { /* Canonical implementation in js/quality/tool-fixes.js */ },

  // ===================================================
  // 6. 2人対戦：🎨 カラー早見分けバトル (Color Matcher)
  // ===================================================
  renderDuelColor(container, game) {
    let state = {
      scoreP1: 0,
      scoreP2: 0,
      currentProblem: null,
      phase: "ready"
    };

    const colorDefs = [
      { text: "あか", name: "赤", color: "#ef4444" },
      { text: "あお", name: "青", color: "#3b82f6" },
      { text: "みどり", name: "緑", color: "#22c55e" },
      { text: "きいろ", name: "黄", color: "#ca8a04" },
      { text: "むらさき", name: "紫", color: "#9333ea" }
    ];

    function nextProblem() {
      const textObj = colorDefs[Math.floor(Math.random() * colorDefs.length)];
      const isMatch = Math.random() > 0.5;
      let colorObj = textObj;
      if (!isMatch) {
        const others = colorDefs.filter(c => c.text !== textObj.text);
        colorObj = others[Math.floor(Math.random() * others.length)];
      }
      state.currentProblem = {
        word: textObj.text,
        colorHex: colorObj.color,
        isMatch: isMatch
      };
    }

    function update() {
      const winnerNum = state.scoreP1 >= 5 ? 1 : 2;
      const resultOverlayHtml = state.phase === "result"
        ? (typeof GameResult !== "undefined"
            ? GameResult.renderResultCard({
                tone: "win",
                compact: true,
                className: "duel-result-card",
                eyebrow: "勝負決着",
                title: `PLAYER ${winnerNum} の勝利`,
                subtitle: "5問先取で決着がつきました",
                metrics: [
                  { label: "PLAYER 1", value: `${state.scoreP1} 点` },
                  { label: "PLAYER 2", value: `${state.scoreP2} 点` }
                ],
                actionsHtml: `
                  <button class="btn btn-primary btn-block" id="btn-color-retry">もう一度対決</button>
                  <button class="btn btn-outline btn-block" id="btn-color-batsu">ソフトミッションを引く</button>
                `
              })
            : `<div class="tool-card text-center">
                <h2>PLAYER ${winnerNum} の勝利</h2>
                <button class="btn btn-primary btn-block mt-3" id="btn-color-retry">もう一度対決</button>
                <button class="btn btn-outline btn-block mt-2" id="btn-color-batsu">ソフトミッションを引く</button>
              </div>`)
        : "";

      container.innerHTML = `
        <div class="duel-container color-battle ${state.phase}">
          <div class="duel-half duel-top">
            <div class="duel-content rotate-180">
              <div class="duel-score">スコア: ${state.scoreP1} / 5</div>
              <div class="color-btn-group">
                <button class="btn btn-success btn-lg" id="btn-p1-yes">一致</button>
                <button class="btn btn-danger btn-lg" id="btn-p1-no">不一致</button>
              </div>
            </div>
          </div>

          <div class="color-center-card">
            ${state.currentProblem ? `
              <div class="color-target-word" style="color: ${state.currentProblem.colorHex}">
                ${state.currentProblem.word}
              </div>
              <small class="text-muted">文字の意味と色は一致している？</small>
            ` : '準備完了'}
          </div>

          <div class="duel-half duel-bottom">
            <div class="duel-content">
              <div class="color-btn-group">
                <button class="btn btn-success btn-lg" id="btn-p2-yes">一致</button>
                <button class="btn btn-danger btn-lg" id="btn-p2-no">不一致</button>
              </div>
              <div class="duel-score">スコア: ${state.scoreP2} / 5</div>
            </div>
          </div>

          ${state.phase === 'ready' ? `
            <div class="duel-overlay">
              <div class="tool-card text-center duel-result-card">
                <h3 class="tool-title">色・文字・反射バトル</h3>
                <p class="text-sm text-sub">文字の意味と文字の色が一致しているかを即座にジャッジ。5問先取で勝利です。</p>
                <button class="btn btn-primary btn-lg btn-block mt-3" id="btn-color-start">勝負スタート</button>
              </div>
            </div>
          ` : ''}

          ${state.phase === 'result' ? `
            <div class="duel-overlay">
              ${resultOverlayHtml}
            </div>
          ` : ''}
        </div>
      `;

      const startBtn = container.querySelector("#btn-color-start");
      if (startBtn) {
        startBtn.addEventListener("click", () => {
          Sound.playSelect();
          state.scoreP1 = 0;
          state.scoreP2 = 0;
          state.phase = "playing";
          nextProblem();
          update();
        });
      }

      const btnColorBatsu = container.querySelector("#btn-color-batsu");
      if (btnColorBatsu) btnColorBatsu.onclick = () => { Sound.playSelect(); if (typeof window.openBatsuModal === "function") window.openBatsuModal(); };
      const retryBtn = container.querySelector("#btn-color-retry");
      if (retryBtn) {
        retryBtn.addEventListener("click", () => {
          Sound.playClick();
          state.phase = "ready";
          update();
        });
      }

      if (state.phase === "playing") {
        container.querySelector("#btn-p1-yes").addEventListener("click", () => handleAnswer(1, true));
        container.querySelector("#btn-p1-no").addEventListener("click", () => handleAnswer(1, false));
        container.querySelector("#btn-p2-yes").addEventListener("click", () => handleAnswer(2, true));
        container.querySelector("#btn-p2-no").addEventListener("click", () => handleAnswer(2, false));
      }
    }

    function handleAnswer(player, choice) {
      if (state.phase !== "playing") return;
      const isCorrect = choice === state.currentProblem.isMatch;
      if (isCorrect) {
        Sound.playCorrect();
        Sound.hapticSuccess();
        if (player === 1) state.scoreP1++;
        else state.scoreP2++;
      } else {
        Sound.playWrong();
        Sound.hapticMedium();
        if (player === 1) state.scoreP1 = Math.max(0, state.scoreP1 - 1);
        else state.scoreP2 = Math.max(0, state.scoreP2 - 1);
      }

      if (state.scoreP1 >= 5 || state.scoreP2 >= 5) {
        state.phase = "result";
        Sound.playFanfare();
        if (typeof Confetti !== "undefined") Confetti.burst(54);
        if (typeof window !== "undefined" && window.StampRally) {
          window.StampRally.markPlayed("duel-color");
        }
        update();
        if (typeof GameResult !== "undefined") {
          GameResult.scrollResultIntoView(container.querySelector(".duel-container"));
        }
      } else {
        nextProblem();
        update();
      }
    }

    update();
  },

  // ===================================================
  // 19. 山手線ゲーム (古今東西) / リズムボックス
  // ===================================================
  renderRhythmBox(container, game) {
    let currentSubTab = (game && game.subTab) ? game.subTab : "yamanote";
    if (game && game.id === "magical-banana") currentSubTab = "magical-banana";
    if (game && game.id === "doremi-song") currentSubTab = "doremi";

    let yamanoteState = { bpm: 80, isPlaying: false, intervalId: null, currentTopic: "", foulMessage: "" };
    let bananaState = { bpm: 90, isPlaying: false, beatInterval: null, beatStep: 0, currentWord: "バナナ", foulMessage: "" };

    const noteDefs = [
      { name: "ド（ドーナツ）", key: "ド", freq: 261.63 },
      { name: "レ（レモン）", key: "レ", freq: 293.66 },
      { name: "ミ（ミカン）", key: "ミ", freq: 329.63 },
      { name: "ファ（ファイト）", key: "ファ", freq: 349.23 },
      { name: "ソ（青い空）", key: "ソ", freq: 392.00 },
      { name: "ラ（ラッパ）", key: "ラ", freq: 440.00 },
      { name: "シ（幸せ）", key: "シ", freq: 493.88 }
    ];
    let doremiIndex = 0;
    let doremiState = { bpm: 100, isPlaying: false, beatInterval: null, beatStep: 0, foulMessage: "" };

    function stopAllRhythms() {
      if (yamanoteState.intervalId) { safeClearInterval(yamanoteState.intervalId); yamanoteState.intervalId = null; yamanoteState.isPlaying = false; }
      if (bananaState.beatInterval) { safeClearInterval(bananaState.beatInterval); bananaState.beatInterval = null; bananaState.isPlaying = false; }
      if (doremiState.beatInterval) { safeClearInterval(doremiState.beatInterval); doremiState.beatInterval = null; doremiState.isPlaying = false; }
    }

    function playTone(freq) {
      if (typeof Sound !== "undefined" && !Sound.isMuted && window.AudioContext) {
        try {
          Sound.init();
          if (Sound.ctx) {
            const osc = Sound.ctx.createOscillator();
            const gain = Sound.ctx.createGain();
            const now = Sound.ctx.currentTime;
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.28, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
            osc.connect(gain);
            gain.connect(Sound.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.35);
          }
        } catch (e) {}
      }
    }

    const splitTopics = typeof GameResult !== "undefined" && typeof GameResult.splitRhythmBoxTopics === "function"
      ? GameResult.splitRhythmBoxTopics(game && game.presets, typeof GAMES_DATA !== "undefined" ? GAMES_DATA : [])
      : {
          yamanote: (game && game.presets && game.presets.length > 0) ? game.presets.slice(0, 30) : [],
          banana: (game && game.presets && game.presets.length > 30) ? game.presets.slice(30) : []
        };

    const yamanoteSource = splitTopics.yamanote.length > 0 ? splitTopics.yamanote : [
      "日本の都道府県", "電化製品", "コンビニで買えるもの", "緑色の食べ物", "動物園にいる動物"
    ];
    const bananaSource = splitTopics.banana.length > 0 ? splitTopics.banana : [
      "バナナ", "りんご", "ゴリラ", "くるま", "アイス", "ねこ", "海", "カレー", "すいか", "テレビ"
    ];

    function getYamanoteTopic() {
      const item = drawShuffledTopic("rhythm-yamanote", yamanoteSource);
      return extractTopicText(item) || "日本の都道府県";
    }
    yamanoteState.currentTopic = getYamanoteTopic();

    function startYamanoteBeat() {
      if (yamanoteState.isPlaying) return;
      yamanoteState.isPlaying = true;
      yamanoteState.foulMessage = "";
      const intervalMs = (60 / yamanoteState.bpm) * 1000;
      yamanoteState.intervalId = safeSetInterval(() => {
        Sound.playTick(1000);
        const beatEl = container.querySelector(".rhythm-display-box");
        const dotEl = container.querySelector(".rhythm-pulse-dot");
        if (beatEl) {
          beatEl.classList.add("beating");
          safeSetTimeout(() => beatEl.classList.remove("beating"), 110);
        }
        if (dotEl) {
          dotEl.classList.add("beat-hit");
          safeSetTimeout(() => dotEl.classList.remove("beat-hit"), 110);
        }
      }, intervalMs);
    }

    function getNextBananaWord() {
      const item = drawShuffledTopic("magical-banana", bananaSource);
      return extractTopicText(item) || "バナナ";
    }
    bananaState.currentWord = getNextBananaWord();

    function playBananaStep() {
      bananaState.beatStep = (bananaState.beatStep + 1) % 4;
      const beatEl = container.querySelector("#banana-beat-indicator");
      if (beatEl) {
        beatEl.textContent = bananaState.beatStep === 0 ? "1拍目（パン）" : (bananaState.beatStep === 1 ? "2拍目（パン）" : (bananaState.beatStep === 2 ? "3拍目（言う）" : "4拍目（言う）"));
        beatEl.className = "banana-beat-box " + (bananaState.beatStep < 2 ? "active-clap" : "active-voice");
      }
      if (bananaState.beatStep < 2) Sound.playTick(1000); else Sound.playTick(600);
    }

    function startBananaBeat() {
      if (bananaState.isPlaying) return;
      bananaState.isPlaying = true;
      bananaState.foulMessage = "";
      bananaState.beatStep = -1;
      const intervalMs = (60 / bananaState.bpm) * 1000;
      playBananaStep();
      bananaState.beatInterval = safeSetInterval(() => { playBananaStep(); }, intervalMs);
    }

    function playDoremiStep() {
      doremiState.beatStep = (doremiState.beatStep + 1) % 4;
      const beatEl = container.querySelector("#doremi-beat-indicator");
      if (beatEl) {
        beatEl.textContent = doremiState.beatStep === 0 ? "1拍目（パン）" : (doremiState.beatStep === 1 ? "2拍目" : (doremiState.beatStep === 2 ? "3拍目" : "4拍目（歌う）"));
        beatEl.className = "doremi-beat-box " + (doremiState.beatStep === 3 ? "active-sing" : "active-beat");
      }
      if (doremiState.beatStep === 0) Sound.playTick(1200); else Sound.playTick(800);
    }

    function startDoremiBeat() {
      if (doremiState.isPlaying) return;
      doremiState.isPlaying = true;
      doremiState.foulMessage = "";
      doremiState.beatStep = -1;
      const intervalMs = (60 / doremiState.bpm) * 1000;
      playDoremiStep();
      doremiState.beatInterval = safeSetInterval(() => { playDoremiStep(); }, intervalMs);
    }

    function renderFoulBanner(message, retryId, batsuId) {
      if (!message) return "";
      if (typeof GameResult !== "undefined") {
        return GameResult.renderResultCard({
          tone: "danger",
          compact: true,
          eyebrow: "ラウンド終了",
          title: "アウト判定",
          subtitle: message,
          actionsHtml: `
            <button class="btn btn-primary btn-sm flex-1" id="${retryId}">次のラウンドへ</button>
            <button class="btn btn-outline btn-sm flex-1" id="${batsuId}">ソフトミッション</button>
          `
        });
      }
      return `<div class="topic-box mt-2"><p class="font-bold text-danger">${escapeHTML(message)}</p></div>`;
    }

    function render() {
      let subMarkup = "";

      if (currentSubTab === "yamanote") {
        subMarkup = `
          <div class="topic-box my-3">
            <span class="topic-tag">山手線・古今東西 お題</span>
            <div class="topic-text font-bold text-lg">${escapeHTML(yamanoteState.currentTopic)}</div>
            <button class="btn btn-sm btn-outline mt-2" id="btn-next-yamanote-topic">お題を変える</button>
          </div>

          <div class="rhythm-display-box my-3 ${yamanoteState.isPlaying ? 'beating' : ''}">
            <div class="rhythm-pulse-dot" aria-hidden="true"></div>
            <div class="rhythm-bpm-display font-mono">BPM: ${yamanoteState.bpm}</div>
          </div>

          ${renderFoulBanner(yamanoteState.foulMessage, "btn-yamanote-continue", "btn-yamanote-foul-batsu")}

          <div class="flex gap-2 justify-center my-2">
            <button class="btn ${yamanoteState.isPlaying ? 'btn-danger' : 'btn-success'} btn-lg flex-1 font-bold" id="btn-toggle-yamanote">
              ${yamanoteState.isPlaying ? 'リズム停止' : 'リズムスタート（手拍子）'}
            </button>
          </div>

          <div class="setting-group mt-2">
            <label class="setting-label text-xs">テンポ (BPM)</label>
            <div class="flex gap-2 justify-center items-center">
              <button class="btn btn-sm btn-outline" id="btn-bpm-down">-10</button>
              <input type="range" class="range-slider" min="60" max="160" value="${yamanoteState.bpm}" id="range-yamanote-bpm">
              <button class="btn btn-sm btn-outline" id="btn-bpm-up">+10</button>
            </div>
          </div>

          <div class="flex gap-2 mt-3">
            <button class="btn btn-danger flex-1 font-bold" id="btn-yamanote-foul">アウト判定</button>
            <button class="btn btn-secondary flex-1 font-bold" id="btn-yamanote-batsu">ソフトミッション</button>
          </div>
        `;
      } else if (currentSubTab === "magical-banana") {
        subMarkup = `
          <div class="p-3 my-3 border rounded text-center rhythm-accent-panel rhythm-accent-amber">
            <span class="topic-tag">最初のお題ワード</span>
            <div class="font-black text-2xl text-warning my-1">${escapeHTML(bananaState.currentWord)}</div>
            <p class="text-xs text-muted">「${escapeHTML(bananaState.currentWord)}と言ったら〇〇！」と連想を繋ぎましょう。</p>
            <button class="btn btn-xs btn-outline mt-1" id="btn-next-banana-word">お題を変える</button>
          </div>

          <div class="setting-group my-2">
            <label class="setting-label text-xs">テンポ (BPM)</label>
            <div class="btn-toggle-group">
              <button class="btn-toggle ${bananaState.bpm === 90 ? 'active' : ''}" data-banana-bpm="90">ゆっくり 90</button>
              <button class="btn-toggle ${bananaState.bpm === 120 ? 'active' : ''}" data-banana-bpm="120">普通 120</button>
              <button class="btn-toggle ${bananaState.bpm === 150 ? 'active' : ''}" data-banana-bpm="150">高速 150</button>
            </div>
          </div>

          <div class="my-2">
            <div id="banana-beat-indicator" class="rhythm-beat-indicator ${bananaState.isPlaying ? 'is-playing' : 'is-idle'}">
              ${bananaState.isPlaying ? 'リズムに合わせて連想しよう' : '「リズムスタート」で開始'}
            </div>
          </div>

          ${renderFoulBanner(bananaState.foulMessage, "btn-banana-continue", "btn-banana-foul-batsu")}

          <div class="flex gap-2 my-3">
            <button class="btn ${bananaState.isPlaying ? 'btn-danger' : 'btn-primary'} btn-lg flex-1 font-bold" id="btn-toggle-banana">
              ${bananaState.isPlaying ? 'リズム停止' : 'リズムスタート'}
            </button>
          </div>

          <div class="flex gap-2">
            <button class="btn btn-danger flex-1 font-bold" id="btn-banana-foul">アウト判定</button>
            <button class="btn btn-secondary flex-1 font-bold" id="btn-banana-batsu">ソフトミッション</button>
          </div>
        `;
      } else if (currentSubTab === "doremi") {
        const note = noteDefs[doremiIndex];
        subMarkup = `
          <div class="my-3 p-3 rounded border text-center rhythm-accent-panel rhythm-accent-blue">
            <span class="topic-tag">指定された音階</span>
            <div class="font-black text-3xl text-primary my-1">${note.name}</div>
            <button class="btn btn-xs btn-outline mt-1" id="btn-play-doremi-tone">音階を鳴らす (${note.key})</button>
          </div>

          <div class="setting-group my-2">
            <label class="setting-label text-xs">テンポ (BPM)</label>
            <div class="btn-toggle-group">
              <button class="btn-toggle ${doremiState.bpm === 100 ? 'active' : ''}" data-doremi-bpm="100">通常 100</button>
              <button class="btn-toggle ${doremiState.bpm === 130 ? 'active' : ''}" data-doremi-bpm="130">高速 130</button>
              <button class="btn-toggle ${doremiState.bpm === 160 ? 'active' : ''}" data-doremi-bpm="160">上級 160</button>
            </div>
          </div>

          <div class="my-2">
            <div id="doremi-beat-indicator" class="rhythm-beat-indicator ${doremiState.isPlaying ? 'is-playing' : 'is-idle'}">
              ${doremiState.isPlaying ? 'テンポを刻み中…' : '「リズム開始」でスタート'}
            </div>
          </div>

          ${renderFoulBanner(doremiState.foulMessage, "btn-doremi-continue", "btn-doremi-foul-batsu")}

          <div class="flex flex-col gap-2 my-2">
            <button class="btn btn-primary btn-block btn-lg py-3 font-bold" id="btn-next-doremi">
              次の音階をランダム指定
            </button>
            <div class="flex gap-2">
              <button class="btn btn-outline flex-1 font-bold" id="btn-toggle-doremi">
                ${doremiState.isPlaying ? 'リズム停止' : 'リズム開始'}
              </button>
              <button class="btn btn-danger flex-1 font-bold" id="btn-doremi-foul">歌詞・音程ミス</button>
            </div>
            <button class="btn btn-secondary btn-block font-bold" id="btn-doremi-batsu">ソフトミッション</button>
          </div>
        `;
      }

      container.innerHTML = `
        <div class="tool-card text-center rhythm-box-card">
          ${renderSoundHintMarkup()}
          <div class="btn-toggle-group rhythm-subtab-group mb-3">
            <button class="btn-toggle flex-1 ${currentSubTab === 'yamanote' ? 'active' : ''}" data-subtab="yamanote">古今東西</button>
            <button class="btn-toggle flex-1 ${currentSubTab === 'magical-banana' ? 'active' : ''}" data-subtab="magical-banana">マジカルバナナ</button>
            <button class="btn-toggle flex-1 ${currentSubTab === 'doremi' ? 'active' : ''}" data-subtab="doremi">ドレミの歌</button>
          </div>

          ${subMarkup}
        </div>
      `;

      container.querySelectorAll("[data-subtab]").forEach(btn => {
        btn.addEventListener("click", () => {
          Sound.playClick();
          stopAllRhythms();
          currentSubTab = btn.dataset.subtab;
          render();
        });
      });

      const triggerBatsu = () => {
        Sound.playSelect();
        if (typeof window.openBatsuModal === "function") {
          window.openBatsuModal();
        }
      };

      if (currentSubTab === "yamanote") {
        container.querySelector("#btn-next-yamanote-topic").addEventListener("click", () => {
          Sound.playClick();
          yamanoteState.currentTopic = getYamanoteTopic();
          yamanoteState.foulMessage = "";
          render();
        });

        container.querySelector("#btn-toggle-yamanote").addEventListener("click", () => {
          if (yamanoteState.isPlaying) {
            stopAllRhythms();
            Sound.playClick();
          } else {
            Sound.playSelect();
            startYamanoteBeat();
          }
          render();
        });

        container.querySelector("#btn-bpm-down").addEventListener("click", () => {
          yamanoteState.bpm = Math.max(60, yamanoteState.bpm - 10);
          if (yamanoteState.isPlaying) { stopAllRhythms(); startYamanoteBeat(); }
          render();
        });

        container.querySelector("#btn-bpm-up").addEventListener("click", () => {
          yamanoteState.bpm = Math.min(160, yamanoteState.bpm + 10);
          if (yamanoteState.isPlaying) { stopAllRhythms(); startYamanoteBeat(); }
          render();
        });

        container.querySelector("#range-yamanote-bpm").addEventListener("input", (e) => {
          yamanoteState.bpm = parseInt(e.target.value, 10);
          if (yamanoteState.isPlaying) { stopAllRhythms(); startYamanoteBeat(); }
          const display = container.querySelector(".rhythm-bpm-display");
          if (display) display.textContent = `BPM: ${yamanoteState.bpm}`;
        });

        container.querySelector("#btn-yamanote-foul").addEventListener("click", () => {
          stopAllRhythms();
          Sound.playWrong();
          Sound.hapticMedium();
          if (typeof window !== "undefined" && window.StampRally) {
            window.StampRally.markPlayed("rhythm-box");
          }
          yamanoteState.foulMessage = `お題「${yamanoteState.currentTopic}」で詰まり・重複が発生しました`;
          render();
        });

        container.querySelector("#btn-yamanote-continue")?.addEventListener("click", () => {
          Sound.playSelect();
          yamanoteState.currentTopic = getYamanoteTopic();
          yamanoteState.foulMessage = "";
          render();
        });
        container.querySelector("#btn-yamanote-foul-batsu")?.addEventListener("click", triggerBatsu);
        container.querySelector("#btn-yamanote-batsu").addEventListener("click", triggerBatsu);
      }

      if (currentSubTab === "magical-banana") {
        container.querySelector("#btn-next-banana-word").addEventListener("click", () => {
          Sound.playClick();
          bananaState.currentWord = getNextBananaWord();
          bananaState.foulMessage = "";
          render();
        });

        container.querySelectorAll("[data-banana-bpm]").forEach(btn => {
          btn.addEventListener("click", () => {
            Sound.playClick();
            bananaState.bpm = parseInt(btn.dataset.bananaBpm, 10);
            if (bananaState.isPlaying) { stopAllRhythms(); startBananaBeat(); }
            render();
          });
        });

        container.querySelector("#btn-toggle-banana").addEventListener("click", () => {
          if (bananaState.isPlaying) {
            Sound.playClick();
            stopAllRhythms();
          } else {
            Sound.playSelect();
            startBananaBeat();
          }
          render();
        });

        container.querySelector("#btn-banana-foul").addEventListener("click", () => {
          stopAllRhythms();
          Sound.playWrong();
          Sound.hapticMedium();
          if (typeof window !== "undefined" && window.StampRally) {
            window.StampRally.markPlayed("rhythm-box");
          }
          bananaState.foulMessage = "リズムに乗れず連想が途切れました";
          render();
        });

        container.querySelector("#btn-banana-continue")?.addEventListener("click", () => {
          Sound.playSelect();
          bananaState.currentWord = getNextBananaWord();
          bananaState.foulMessage = "";
          render();
        });
        container.querySelector("#btn-banana-foul-batsu")?.addEventListener("click", triggerBatsu);
        container.querySelector("#btn-banana-batsu").addEventListener("click", triggerBatsu);
      }

      if (currentSubTab === "doremi") {
        container.querySelector("#btn-play-doremi-tone").addEventListener("click", () => {
          playTone(noteDefs[doremiIndex].freq);
        });

        container.querySelector("#btn-next-doremi").addEventListener("click", () => {
          doremiIndex = (doremiIndex + Math.floor(Math.random() * (noteDefs.length - 1)) + 1) % noteDefs.length;
          doremiState.foulMessage = "";
          playTone(noteDefs[doremiIndex].freq);
          render();
        });

        container.querySelectorAll("[data-doremi-bpm]").forEach(btn => {
          btn.addEventListener("click", () => {
            Sound.playClick();
            doremiState.bpm = parseInt(btn.dataset.doremiBpm, 10);
            if (doremiState.isPlaying) { stopAllRhythms(); startDoremiBeat(); }
            render();
          });
        });

        container.querySelector("#btn-toggle-doremi").addEventListener("click", () => {
          if (doremiState.isPlaying) {
            Sound.playClick();
            stopAllRhythms();
          } else {
            Sound.playSelect();
            startDoremiBeat();
          }
          render();
        });

        container.querySelector("#btn-doremi-foul").addEventListener("click", () => {
          stopAllRhythms();
          Sound.playWrong();
          Sound.hapticMedium();
          if (typeof window !== "undefined" && window.StampRally) {
            window.StampRally.markPlayed("rhythm-box");
          }
          doremiState.foulMessage = `指定音階「${noteDefs[doremiIndex].name}」で歌詞・音程ミス`;
          render();
        });

        container.querySelector("#btn-doremi-continue")?.addEventListener("click", () => {
          Sound.playSelect();
          doremiIndex = (doremiIndex + 1) % noteDefs.length;
          doremiState.foulMessage = "";
          render();
        });
        container.querySelector("#btn-doremi-foul-batsu")?.addEventListener("click", triggerBatsu);
        container.querySelector("#btn-doremi-batsu").addEventListener("click", triggerBatsu);
      }
    }

    const unbindSoundHint = bindSoundHintInContainer(container);
    render();

    return () => {
      unbindSoundHint();
      stopAllRhythms();
    };
  },

  renderYamanote(container, game) {
    return this.renderRhythmBox(container, Object.assign({}, game, { subTab: "yamanote" }));
  },

  // ===================================================
  // 20. 指スマ / いっせーのせ (親番＆コールアシスト)
  // ===================================================
  renderStandUp(container, game) {
    let hands = Array(4).fill(2);
    let parent = 0;
    let started = false;

    function render() {
      const available = hands.map((n, i) => n > 0 ? i : -1).filter(i => i >= 0);
      const max = hands.reduce((a, b) => a + b, 0);
      const finished = available.length <= 1;
      const lastPlayer = (available[0] ?? 0) + 1;

      const finishCard = finished
        ? (typeof GameResult !== "undefined"
            ? GameResult.renderResultCard({
                tone: "win",
                eyebrow: "ゲーム終了",
                title: `終了！ 最後に残ったのはプレイヤー ${lastPlayer}`,
                subtitle: "他の全員が勝ち抜けました",
                metrics: [
                  { label: "参加人数", value: `${hands.length}人` },
                  { label: "残り親指", value: `${max}本` }
                ],
                actionsHtml: `
                  <button class="btn btn-primary flex-1" id="stand-restart">新しい対戦</button>
                  <button class="btn btn-outline flex-1" id="stand-batsu">ソフトミッション</button>
                `
              })
            : `<h3>終了！ 最後に残ったのはプレイヤー ${lastPlayer}</h3>`)
        : "";

      container.innerHTML = `<div class="tool-card text-center">
        <div class="setting-group">
          <label class="setting-label">参加人数：${hands.length}人</label>
          <input class="range-slider" id="range-standup-players" type="range" min="2" max="8" value="${hands.length}" ${started ? "disabled" : ""}>
        </div>
        <p class="text-sm text-sub">残っている親指：${max}本</p>
        ${finished ? finishCard : `
          <div class="topic-box my-3">
            <span class="topic-tag">今の親番</span>
            <div class="mt-1"><strong class="parent-name-display text-xl">プレイヤー ${parent + 1}</strong></div>
            <p class="text-sm mt-2">「いっせーのーで、0〜${max}」から予想してコール</p>
          </div>
          <div class="btn-group-row flex-wrap my-2">
            <button class="btn btn-success flex-1" id="stand-hit">的中・片手を抜く</button>
            <button class="btn btn-primary flex-1" id="btn-next-parent">外れ・次の親へ</button>
            <button class="btn btn-outline btn-block mt-1" id="btn-random-parent">ランダム親指名</button>
          </div>`}
        <p class="text-sm text-sub mt-3">${hands.map((n, i) => `P${i + 1}：${n ? n + "本" : "勝ち抜け"}`).join(" ／ ")}</p>
        ${started && !finished ? '<button class="btn btn-outline btn-block mt-3" id="stand-restart">新しい対戦</button>' : ''}
      </div>`;

      container.querySelector("#range-standup-players").oninput = event => {
        hands = Array(Number(event.target.value)).fill(2);
        parent = 0;
        render();
      };
      function next(hit) {
        started = true;
        if (hit) hands[parent]--;
        const remainingPlayers = hands.filter(n => n > 0).length;
        if (remainingPlayers <= 1) {
          Sound.playFanfare();
          if (typeof Confetti !== "undefined") Confetti.burst(46);
        } else {
          do { parent = (parent + 1) % hands.length; } while (!hands[parent]);
          if (hit) Sound.playCorrect();
          else Sound.playSelect();
        }
        window.StampRally?.markPlayed("stand-up-game");
        render();
      }
      container.querySelector("#stand-hit")?.addEventListener("click", () => next(true));
      container.querySelector("#btn-next-parent")?.addEventListener("click", () => next(false));
      container.querySelector("#btn-random-parent")?.addEventListener("click", () => {
        parent = available[Math.floor(Math.random() * available.length)];
        Sound.playSelect();
        render();
      });
      container.querySelector("#stand-restart")?.addEventListener("click", () => {
        Sound.playClick();
        hands.fill(2);
        parent = 0;
        started = false;
        render();
      });
      container.querySelector("#stand-batsu")?.addEventListener("click", () => {
        Sound.playSelect();
        if (typeof window.openBatsuModal === "function") window.openBatsuModal();
      });
    }
    render();
  },

  // ===================================================
  // 21. ピンポンパンゲーム (テンポアップマシン)
  // ===================================================
  renderPingPong(container, game) {
    let state = {
      step: 0,
      combo: 0,
      lastPeakCombo: 0,
      lastSummary: null,
      isPlaying: false,
      bpm: 100,
      autoAccelerate: true,
      beatInterval: null
    };

    const words = ["ピン", "ポン", "パン（誰かを指名）"];

    function nextStep() {
      state.lastSummary = null;
      state.step = (state.step + 1) % 3;
      state.combo++;
      if (state.step === 2) {
        Sound.playJajan();
        if (state.autoAccelerate && state.bpm < 200) {
          state.bpm += 4;
          if (state.isPlaying) {
            restartInterval();
          }
        }
      } else {
        Sound.playTick(800 + state.step * 200);
      }
      updateDisplay();
    }

    function startAutoPlay() {
      if (state.isPlaying) return;
      state.lastSummary = null;
      state.isPlaying = true;
      restartInterval();
      render();
    }

    function stopAutoPlay() {
      if (!state.isPlaying) return;
      state.isPlaying = false;
      if (state.beatInterval) {
        safeClearInterval(state.beatInterval);
        state.beatInterval = null;
      }
      updateControls();
    }

    function restartInterval() {
      if (state.beatInterval) safeClearInterval(state.beatInterval);
      const intervalMs = (60 / state.bpm) * 1000;
      state.beatInterval = safeSetInterval(() => {
        nextStep();
      }, intervalMs);
    }

    function updateControls() {
      const btn = container.querySelector("#btn-pingpong-auto");
      if (btn) {
        btn.className = state.isPlaying ? "btn btn-danger btn-block btn-lg" : "btn btn-primary btn-block btn-lg";
        btn.textContent = state.isPlaying ? "ストップ" : "スタート";
      }
    }

    function updateDisplay() {
      const wordEl = container.querySelector(".pingpong-word");
      const comboEl = container.querySelector(".pingpong-combo");
      const bpmEl = container.querySelector("#pingpong-bpm-val");
      if (wordEl) wordEl.textContent = words[state.step];
      if (comboEl) comboEl.textContent = `コンボ: ${state.combo} 回`;
      if (bpmEl) bpmEl.textContent = `${state.bpm}`;
    }

    function render() {
      const optionsOpen = container.querySelector("#pingpong-options")?.open;
      const summaryCard = state.lastSummary && typeof GameResult !== "undefined"
        ? GameResult.renderResultCard({
            tone: state.lastSummary.combo >= 9 ? "win" : "danger",
            compact: true,
            eyebrow: "ラウンド終了",
            title: `${state.lastSummary.combo}回コンボでストップ`,
            subtitle: `最高テンポ BPM ${state.lastSummary.peakBpm} まで到達しました`,
            metrics: [
              { label: "到達コンボ", value: `${state.lastSummary.combo}回` },
              { label: "最高BPM", value: `${state.lastSummary.peakBpm}` }
            ],
            actionsHtml: `
              <button class="btn btn-primary btn-sm flex-1" id="btn-pingpong-retry">次のラウンドへ</button>
              <button class="btn btn-outline btn-sm flex-1" id="btn-pingpong-batsu">ソフトミッション</button>
            `
          })
        : "";

      container.innerHTML = `
        <div class="tool-card text-center">
          ${renderSoundHintMarkup()}
          <div class="flex justify-end items-center mb-1">
            <span class="badge badge-info font-mono text-xs">BPM <span id="pingpong-bpm-val">${state.bpm}</span></span>
          </div>

          <div class="pingpong-display my-3 p-4 rounded border animate-scale" style="background: rgba(59,130,246,0.06); border-color: rgba(59,130,246,0.3);">
            <div class="pingpong-word font-black text-3xl text-primary">${words[state.step]}</div>
            <div class="pingpong-combo badge badge-success mt-2">コンボ: ${state.combo} 回</div>
            ${state.lastPeakCombo > 0 ? `<div class="text-xs text-sub mt-2">これまでの最高記録: ${state.lastPeakCombo}回コンボ</div>` : ""}
          </div>

          ${summaryCard ? `<div class="my-3">${summaryCard}</div>` : ""}

          <div class="setting-group my-2 flex justify-between items-center px-2">
            <label class="setting-label text-xs mb-0">連続成功で自動加速</label>
            <button class="btn btn-xs ${state.autoAccelerate ? 'btn-secondary' : 'btn-outline'}" id="btn-toggle-accel" aria-pressed="${state.autoAccelerate}">
              ${state.autoAccelerate ? 'ON（徐々に加速）' : 'OFF（一定速）'}
            </button>
          </div>

          <div class="flex flex-col gap-2 mt-3">
            <button class="btn ${state.isPlaying ? 'btn-danger' : 'btn-primary'} btn-block btn-lg py-3 font-bold" id="btn-pingpong-auto">
              ${state.isPlaying ? 'ストップ' : 'スタート'}
            </button>
            <button class="btn btn-danger btn-sm btn-block mt-1" id="btn-pingpong-reset">
              リセット
            </button>
          </div>
          <details class="tool-optional-settings" id="pingpong-options" ${optionsOpen ? "open" : ""}>
            <summary>補助設定</summary>
            <button class="btn btn-outline btn-block" id="btn-pingpong-next">手動で次の合図へ</button>
          </details>
        </div>
      `;

      container.querySelector("#btn-pingpong-auto").addEventListener("click", () => {
        if (state.isPlaying) {
          Sound.playClick();
          stopAutoPlay();
        } else {
          Sound.playSelect();
          startAutoPlay();
        }
      });

      container.querySelector("#btn-toggle-accel").addEventListener("click", () => {
        Sound.playClick();
        state.autoAccelerate = !state.autoAccelerate;
        render();
      });

      container.querySelector("#btn-pingpong-next").addEventListener("click", () => {
        nextStep();
      });

      container.querySelector("#btn-pingpong-reset").addEventListener("click", () => {
        Sound.playWrong();
        Sound.hapticMedium();
        if (typeof window !== "undefined" && window.StampRally) {
          window.StampRally.markPlayed("ping-pong-pang");
        }
        const reachedCombo = state.combo;
        const peakBpm = state.bpm;
        if (reachedCombo > state.lastPeakCombo) state.lastPeakCombo = reachedCombo;
        state.lastSummary = reachedCombo > 0 ? { combo: reachedCombo, peakBpm } : null;
        stopAutoPlay();
        state.step = 0;
        state.combo = 0;
        state.bpm = 100;
        render();
      });

      container.querySelector("#btn-pingpong-retry")?.addEventListener("click", () => {
        Sound.playSelect();
        state.lastSummary = null;
        render();
      });
      container.querySelector("#btn-pingpong-batsu")?.addEventListener("click", () => {
        Sound.playSelect();
        if (typeof window.openBatsuModal === "function") window.openBatsuModal();
      });
    }

    const unbindSoundHint = bindSoundHintInContainer(container);
    render();

    return () => {
      unbindSoundHint();
      stopAutoPlay();
    };
  },

  // ===================================================
  // 22. たけのこニョッキ
  // ===================================================
  renderTakenoko(container, game) {
    let state = {
      currentCount: 0,
      result: "",
      resultTone: "neutral",
      playerCount: 5,
      calloutText: ""
    };
    let calloutTimers = [];
    const clearCallout = () => {
      calloutTimers.forEach(id => safeClearTimeout(id));
      calloutTimers = [];
    };

    function update() {
      const resultBanner = state.result && typeof GameResult !== "undefined"
        ? GameResult.renderResultCard({
            tone: state.resultTone,
            compact: true,
            eyebrow: "ラウンド終了",
            title: state.resultTone === "win" ? "ラウンド終了" : "被りアウト",
            subtitle: state.result,
            metrics: [
              { label: "参加人数", value: `${state.playerCount}人` },
              { label: "成功回数", value: `${state.currentCount}ニョッキ` }
            ],
            actionsHtml: `
              <button class="btn btn-primary btn-sm flex-1" id="btn-takenoko-retry">もう1回遊ぶ</button>
              <button class="btn btn-outline btn-sm flex-1" id="btn-takenoko-batsu">ソフトミッション</button>
            `
          })
        : "";

      container.innerHTML = `
        <div class="tool-card text-center">
          <h3 class="tool-title">たけのこニョッキ カウンター</h3>

          <div class="setting-group my-3">
            <label class="setting-label">参加人数: <span class="badge-num">${state.playerCount}人</span></label>
            <input type="range" class="range-slider" min="3" max="${game.maxPlayers}" value="${state.playerCount}" id="range-takenoko" ${state.currentCount || state.result ? "disabled" : ""}>
          </div>

          <div class="takenoko-display-box my-4">
            <div class="takenoko-count font-black font-mono">${state.currentCount === 0 ? '準備中' : `${state.currentCount} ニョッキ`}</div>
            <p id="takenoko-status-line" aria-live="polite">${escapeHTML(state.calloutText || state.result || "「たけのこたけのこニョッキッキ」でスタート")}</p>
          </div>

          ${!state.result && state.currentCount === 0 ? `
            <button class="btn btn-outline btn-sm btn-block mb-3" id="btn-takenoko-call">開始の掛け声ガイド（リズム合図）</button>
          ` : ''}

          ${resultBanner}

          <div class="flex gap-2 justify-center mt-3">
            <button class="btn btn-success btn-lg flex-1" id="btn-takenoko-next" ${state.result ? "disabled" : ""}>
              ${state.currentCount + 1}ニョッキを記録
            </button>
            <button class="btn btn-danger btn-lg" id="btn-takenoko-foul" ${state.result ? "disabled" : ""}>被った</button>
          </div>

          <button class="btn btn-outline btn-block mt-3" id="btn-takenoko-reset">ゲームやり直し</button>
        </div>
      `;

      const resetTakenoko = () => {
        clearCallout();
        state.currentCount = 0;
        state.result = "";
        state.resultTone = "neutral";
        state.calloutText = "";
        update();
      };

      container.querySelector("#range-takenoko").addEventListener("input", (e) => {
        state.playerCount = parseInt(e.target.value, 10);
        update();
      });

      container.querySelector("#btn-takenoko-call")?.addEventListener("click", () => {
        clearCallout();
        const phrases = ["たけのこ…", "たけのこ…", "ニョッキッキ！"];
        phrases.forEach((phrase, idx) => {
          const id = safeSetTimeout(() => {
            state.calloutText = phrase;
            if (idx < 2) Sound.playTick(750 + idx * 150);
            else Sound.playJajan();
            const status = container.querySelector("#takenoko-status-line");
            if (status) status.textContent = phrase;
          }, idx * 550);
          calloutTimers.push(id);
        });
      });

      container.querySelector("#btn-takenoko-next").addEventListener("click", () => {
        clearCallout();
        state.calloutText = "";
        state.currentCount++;
        if (state.currentCount === state.playerCount - 1) {
          state.result = "残り1人！ 最後まで残った人の負けです。";
          state.resultTone = "win";
          Sound.playFanfare();
          if (typeof Confetti !== "undefined") Confetti.burst(42);
          window.StampRally?.markPlayed("takenoko-nyokki");
        } else {
          Sound.playCountBeep(false);
        }
        update();
      });

      container.querySelector("#btn-takenoko-foul").addEventListener("click", () => {
        clearCallout();
        state.calloutText = "";
        Sound.playWrong();
        Sound.hapticMedium();
        if (typeof window !== "undefined" && window.StampRally) {
          window.StampRally.markPlayed("takenoko-nyokki");
        }
        state.result = "同時に声を出した人がアウト！ この回は終了です。";
        state.resultTone = "danger";
        update();
      });

      container.querySelector("#btn-takenoko-reset").addEventListener("click", () => {
        Sound.playClick();
        resetTakenoko();
      });
      container.querySelector("#btn-takenoko-retry")?.addEventListener("click", () => {
        Sound.playSelect();
        resetTakenoko();
      });
      container.querySelector("#btn-takenoko-batsu")?.addEventListener("click", () => {
        Sound.playSelect();
        if (typeof window.openBatsuModal === "function") window.openBatsuModal();
      });
    }

    update();
    return () => {
      clearCallout();
    };
  },

  // ===================================================
  // 23. 数当てゲーム (High & Low / 1〜1000)
  // ===================================================
  renderHighLow(container, game) {
    let state = {
      maxRange: 100,
      target: 0,
      min: 1,
      max: 100,
      attempts: 0,
      history: [],
      isWon: false
    };

    function resetGame() {
      state.target = Math.floor(Math.random() * state.maxRange) + 1;
      state.min = 1;
      state.max = state.maxRange;
      state.attempts = 0;
      state.history = [];
      state.isWon = false;
    }

    resetGame();

    function update() {
      const wonMarkup = state.isWon
        ? (typeof GameResult !== "undefined"
            ? GameResult.renderResultCard({
                tone: "win",
                eyebrow: "ジャスト一致",
                title: `正解！ 数字は「${state.target}」でした`,
                subtitle: `${state.attempts}回のコールで当て切りました`,
                metrics: [
                  { label: "範囲", value: `1〜${state.maxRange}` },
                  { label: "コール回数", value: `${state.attempts}回` }
                ],
                actionsHtml: `<button class="btn btn-primary btn-block" id="btn-highlow-restart">次の問題へ</button>`
              })
            : `<div class="won-box my-3">
                <h2 class="text-success">正解！数字は【${state.target}】でした</h2>
                <button class="btn btn-primary mt-2" id="btn-highlow-restart">次の問題へ</button>
              </div>`)
        : "";

      container.innerHTML = `
        <div class="tool-card text-center">
          <h3 class="tool-title">数当てゲーム (High & Low)</h3>

          <div class="btn-toggle-group my-3">
            <button class="btn-toggle ${state.maxRange === 100 ? 'active' : ''}" data-range="100">1〜100</button>
            <button class="btn-toggle ${state.maxRange === 1000 ? 'active' : ''}" data-range="1000">1〜1000（上級）</button>
          </div>

          <div class="highlow-range-box my-3">
            <div class="range-text">絞り込み範囲: <strong class="text-primary font-mono">${state.min} 〜 ${state.max}</strong></div>
            <div class="attempt-badge mt-1">コール回数: ${state.attempts}回</div>
          </div>

          ${!state.isWon ? `
            <form id="highlow-form" class="input-group my-3 flex gap-2 justify-center">
              <input type="number" inputmode="numeric" min="${state.min}" max="${state.max}" step="1" required class="input-num" id="input-highlow-guess" aria-label="予想する整数" placeholder="予想数字を入力">
              <button class="btn btn-primary" id="btn-highlow-submit">判定</button>
            </form>
          ` : wonMarkup}

          <div class="history-list mt-3">
            ${state.history.map(h => `
              <div class="history-item ${h.result === 'HIGH' ? 'text-danger' : h.result === 'LOW' ? 'text-primary' : 'text-success'}">
                ${h.guess} → ${h.result === 'HIGH' ? '高すぎます（もっと小さい数）' : h.result === 'LOW' ? '低すぎます（もっと大きい数）' : 'ジャスト正解！'}
              </div>
            `).reverse().join('')}
          </div>
        </div>
      `;

      container.querySelectorAll("[data-range]").forEach(btn => {
        btn.addEventListener("click", () => {
          Sound.playClick();
          state.maxRange = parseInt(btn.dataset.range, 10);
          resetGame();
          update();
        });
      });

      container.querySelector("#highlow-form")?.addEventListener("submit", (event) => {
        event.preventDefault();
        doGuess();
      });

      const restartBtn = container.querySelector("#btn-highlow-restart");
      if (restartBtn) {
        restartBtn.addEventListener("click", () => {
          Sound.playClick();
          resetGame();
          update();
          container.querySelector("#input-highlow-guess")?.focus();
        });
      }
    }

    function doGuess() {
      const inp = container.querySelector("#input-highlow-guess");
      const val = inp.valueAsNumber;
      if (!Number.isInteger(val) || val < state.min || val > state.max) return;
      state.attempts++;

      if (val === state.target) {
        state.isWon = true;
        Sound.playFanfare();
        if (typeof Confetti !== "undefined") Confetti.burst(50);
        if (typeof window !== "undefined" && window.StampRally) {
          window.StampRally.markPlayed("high-and-low-guess");
        }
        state.history.push({ guess: val, result: "BINGO" });
      } else if (val > state.target) {
        Sound.playTick(500);
        state.max = Math.min(state.max, val - 1);
        state.history.push({ guess: val, result: "HIGH" });
      } else {
        Sound.playTick(900);
        state.min = Math.max(state.min, val + 1);
        state.history.push({ guess: val, result: "LOW" });
      }
      update();
      if (!state.isWon) {
        container.querySelector("#input-highlow-guess")?.focus();
      }
    }

    update();
  },

  // ===================================================
  // 24. マジカルバナナ (連想リズムマシン)
  // ===================================================
  renderMagicalBanana(container, game) {
    return this.renderRhythmBox(container, Object.assign({}, game, { subTab: "magical-banana" }));
  },

  // ===================================================
  // 25. 20の扉 (20 Questions ログボード)
  // ===================================================
  renderTwentyQuestions(container, game) {
    const topicList = (game && game.presets && game.presets.length > 0) ? game.presets : [];
    let state = {
      remaining: 20,
      logs: [],
      secretTopic: null,
      showSecret: false,
      outcome: null // null | "solved" | "giveup" | "out"
    };

    function update() {
      const usedCount = 20 - state.remaining;
      const secretText = state.secretTopic ? extractTopicText(state.secretTopic) : "";
      const finishCard = state.outcome && typeof GameResult !== "undefined"
        ? GameResult.renderResultCard({
            tone: state.outcome === "solved" ? "win" : "neutral",
            eyebrow: state.outcome === "solved" ? "正解クリア" : "ラウンド終了",
            title: state.outcome === "solved"
              ? `${usedCount}問で正解に到達しました`
              : (state.outcome === "out" ? "20回の質問を使い切りました" : "答えを公開して終了"),
            subtitle: secretText ? `秘密のお題：「${secretText}」` : "次の問題に切り替えられます",
            metrics: [
              { label: "使った質問", value: `${usedCount} / 20` },
              { label: "YESの数", value: `${state.logs.filter(l => l.type === "YES").length}回` }
            ],
            actionsHtml: `<button class="btn btn-primary btn-block" id="btn-twenty-next-round">次の局を始める</button>`
          })
        : "";

      container.innerHTML = `
        <div class="tool-card text-center">
          <div class="remaining-badge-box my-3">
            <span class="badge badge-info">残り質問可能数</span>
            <div class="remaining-count ${state.remaining <= 5 ? 'text-danger' : 'text-primary'} font-black font-mono">
              ${state.remaining} / 20
            </div>
          </div>

          ${topicList.length > 0 ? `
            <div class="secret-topic-drawer my-3 p-3 bg-light border rounded">
              <div class="flex gap-2 justify-center flex-wrap">
                <button class="btn btn-sm btn-outline" id="btn-draw-secret">${state.secretTopic || state.logs.length ? "別のお題で新しい局を始める" : "出題者用：お題を引く"}</button>
                ${state.secretTopic ? `
                  <button class="btn btn-sm btn-secondary" id="btn-toggle-secret">
                    ${state.showSecret ? 'お題を隠す' : 'お題を見る'}
                  </button>
                ` : ''}
              </div>
              ${state.secretTopic && state.showSecret ? `
                <div class="secret-topic-display mt-2 font-bold text-primary animate-fade-in">
                  【秘密のお題】 ${escapeHTML(secretText)}
                </div>
              ` : ''}
            </div>
          ` : ''}

          ${finishCard}

          <div class="flex gap-2 justify-center my-3">
            <button class="btn btn-success flex-1" id="btn-log-yes" aria-label="はい (YES)" ${state.remaining === 0 || state.outcome ? "disabled" : ""}>はい</button>
            <button class="btn btn-danger flex-1" id="btn-log-no" aria-label="いいえ (NO)" ${state.remaining === 0 || state.outcome ? "disabled" : ""}>いいえ</button>
            <button class="btn btn-outline flex-1" id="btn-log-irrelevant" ${state.remaining === 0 || state.outcome ? "disabled" : ""}>関係ない</button>
          </div>

          ${!state.outcome ? `
            <div class="flex gap-2 my-2">
              <button class="btn btn-primary btn-sm flex-1" id="btn-twenty-solved">正解した！</button>
              <button class="btn btn-outline btn-sm flex-1" id="btn-twenty-giveup">答えを見て終了</button>
            </div>
          ` : ''}

          <div class="history-list mt-4">
            <h4 class="text-sm font-bold text-muted">回答履歴:</h4>
            ${state.logs.map((l, i) => `
              <div class="log-item">
                Q${i + 1}: ${l.type === 'YES' ? '<span class="text-success font-bold">YES</span>' : l.type === 'NO' ? '<span class="text-danger font-bold">NO</span>' : '<span class="text-muted">関係なし</span>'}
              </div>
            `).reverse().join('')}
          </div>

          <button class="btn btn-outline btn-block mt-3" id="btn-reset-twenty">リセット</button>
        </div>
      `;

      const resetBoard = (drawNew) => {
        state.remaining = 20;
        state.logs = [];
        state.outcome = null;
        state.showSecret = false;
        if (drawNew && topicList.length > 0) {
          state.secretTopic = drawShuffledTopic(game.id || "twenty-questions", topicList);
        } else if (!drawNew) {
          state.secretTopic = null;
        }
        update();
      };

      if (container.querySelector("#btn-draw-secret")) {
        container.querySelector("#btn-draw-secret").addEventListener("click", async () => {
          Sound.playSelect();
          if (state.logs.length && !state.outcome) {
            const ok = typeof GameResult !== "undefined" && typeof GameResult.confirmAction === "function"
              ? await GameResult.confirmAction({
                  title: "新しいお題に切り替えますか？",
                  message: "現在の回答履歴をリセットして、新しいお題を引きます。",
                  confirmLabel: "切り替える",
                  cancelLabel: "続ける"
                })
              : true;
            if (!ok) return;
          }
          resetBoard(true);
        });
      }

      if (container.querySelector("#btn-toggle-secret")) {
        container.querySelector("#btn-toggle-secret").addEventListener("click", () => {
          Sound.playClick();
          state.showSecret = !state.showSecret;
          update();
        });
      }

      container.querySelector("#btn-log-yes").addEventListener("click", () => addLog("YES"));
      container.querySelector("#btn-log-no").addEventListener("click", () => addLog("NO"));
      container.querySelector("#btn-log-irrelevant").addEventListener("click", () => addLog("IRRELEVANT"));

      container.querySelector("#btn-twenty-solved")?.addEventListener("click", () => {
        state.outcome = "solved";
        if (state.secretTopic) state.showSecret = true;
        Sound.playFanfare();
        if (typeof Confetti !== "undefined") Confetti.burst(48);
        window.StampRally?.markPlayed("twenty-questions");
        update();
      });

      container.querySelector("#btn-twenty-giveup")?.addEventListener("click", () => {
        state.outcome = "giveup";
        if (state.secretTopic) state.showSecret = true;
        Sound.playClick();
        window.StampRally?.markPlayed("twenty-questions");
        update();
      });

      container.querySelector("#btn-twenty-next-round")?.addEventListener("click", () => {
        Sound.playSelect();
        resetBoard(Boolean(state.secretTopic));
      });

      container.querySelector("#btn-reset-twenty").addEventListener("click", () => {
        Sound.playClick();
        resetBoard(false);
      });
    }

    function addLog(type) {
      if (state.remaining <= 0 || state.outcome) return;
      state.remaining--;
      state.logs.push({ type });
      if (typeof window !== "undefined" && window.StampRally) {
        window.StampRally.markPlayed("twenty-questions");
      }
      if (state.remaining === 0) {
        state.outcome = "out";
        if (state.secretTopic) state.showSecret = true;
        if (typeof Sound.playTimeUp === "function") Sound.playTimeUp();
        else Sound.playWrong();
      } else if (type === "YES") {
        Sound.playCorrect();
      } else if (type === "NO") {
        Sound.playWrong();
      } else {
        Sound.playClick();
      }
      update();
    }

    update();
  },

  // ===================================================
  // 26. 良いニュースと悪いニュース
  // ===================================================
  renderGoodBadNews(container, game) {
    const sitList = (game && game.presets && game.presets.length > 0) ? game.presets : [
      "無人島に漂着した", "宝くじで1億円が当たった", "異世界に転生した",
      "ゾンビが街に溢れ出した", "明日から会社の社長になった", "宇宙人に遭遇した",
      "朝起きたら透明人間になっていた", "タイムマシンが完成した", "動物と会話ができるようになった"
    ];
    let state = {
      situations: sitList,
      current: extractTopicText(drawShuffledTopic(game.id || "good-bad-news", sitList)) || "無人島に漂着した",
      turnType: "good",
      storyCount: 1,
      finished: false,
      timerSec: 30,
      timerRunning: false,
      timerInterval: null
    };

    function startTimer() {
      if (state.timerInterval) {
        safeClearInterval(state.timerInterval);
        state.timerInterval = null;
      }
      state.timerSec = 30;
      state.timerRunning = true;
      updateTimerDisplay();

      state.timerInterval = safeSetInterval(() => {
        state.timerSec--;
        if (state.timerSec <= 5 && state.timerSec > 0) {
          Sound.playTick(900);
        } else if (state.timerSec <= 0) {
          safeClearInterval(state.timerInterval);
          state.timerInterval = null;
          state.timerRunning = false;
          if (typeof Sound.playTimeUp === "function") Sound.playTimeUp();
          else Sound.playWrong();
          Toast.warning("30秒経過。そろそろニュースを繋げましょう");
        }
        updateTimerDisplay();
      }, 1000);
    }

    function stopTimer() {
      if (state.timerInterval) {
        safeClearInterval(state.timerInterval);
        state.timerInterval = null;
      }
      state.timerRunning = false;
      state.timerSec = 30;
      updateTimerDisplay();
    }

    function updateTimerDisplay() {
      const el = container.querySelector("#goodbad-timer");
      if (el) {
        el.textContent = `${state.timerSec}秒`;
        el.className = "font-mono font-bold text-sm " + (state.timerSec <= 5 ? "text-danger animate-pulse" : "text-sub");
      }
    }

    function render() {
      const isGood = state.turnType === "good";
      const finishedCard = state.finished && typeof GameResult !== "undefined"
        ? GameResult.renderResultCard({
            tone: "win",
            eyebrow: "お話完成",
            title: `第${state.storyCount}話で物語が完結しました`,
            subtitle: `導入：「${state.current}」`,
            metrics: [
              { label: "繋いだターン", value: `${state.storyCount}話` }
            ],
            actionsHtml: `<button class="btn btn-primary btn-block" id="btn-goodbad-new">新しい導入で始める</button>`
          })
        : "";

      container.innerHTML = `
        <div class="tool-card text-center">
          <div class="flex justify-between items-center mb-1">
            <h3 class="tool-title" style="margin:0;">良いニュースと悪いニュース</h3>
            <span class="badge badge-info text-xs">第${state.storyCount}話</span>
          </div>

          <div class="topic-box my-3">
            <span class="topic-tag">導入シチュエーション</span>
            <div class="topic-text font-bold">${escapeHTML(state.current)}</div>
            <button class="btn btn-sm btn-outline mt-2" id="btn-next-situation">お題を変える</button>
          </div>

          ${state.finished ? finishedCard : `
            <div class="p-3 my-3 rounded" style="background: ${isGood ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}; border: 2px solid ${isGood ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'};">
              <div class="text-xs font-bold ${isGood ? 'text-success' : 'text-danger'} mb-1">
                ${isGood ? 'ポジティブに受ける番' : 'ハプニングを起こす番'}
              </div>
              <div class="font-black text-xl ${isGood ? 'text-success' : 'text-danger'} animate-scale">
                ${isGood ? '「良いニュースは、〇〇です！」' : '「しかし悪いニュースは、〇〇です！」'}
              </div>
              <div class="mt-2 flex justify-between items-center px-2">
                <span class="text-xs text-muted">シンキングタイム</span>
                <span id="goodbad-timer" class="font-mono font-bold text-sm text-sub">${state.timerSec}秒</span>
              </div>
            </div>

            <div class="flex flex-col gap-2 mt-3">
              <button class="btn btn-primary btn-block btn-lg py-3 font-bold" id="btn-next-turn">
                語り終わった・交代（${isGood ? '悪いニュースへ' : '良いニュースへ'}）
              </button>
              <div class="flex gap-2">
                <button class="btn btn-outline flex-1 btn-sm" id="btn-start-timer">30秒タイマー</button>
                <button class="btn btn-success flex-1 btn-sm" id="btn-story-finish">物語を締めくくる</button>
              </div>
            </div>
          `}
        </div>
      `;

      const resetStory = () => {
        Sound.playClick();
        state.current = extractTopicText(drawShuffledTopic(game.id || "good-bad-news", state.situations)) || "無人島に漂着した";
        state.turnType = "good";
        state.storyCount = 1;
        state.finished = false;
        stopTimer();
        render();
      };

      container.querySelector("#btn-next-situation").addEventListener("click", resetStory);
      container.querySelector("#btn-goodbad-new")?.addEventListener("click", resetStory);

      container.querySelector("#btn-next-turn")?.addEventListener("click", () => {
        Sound.playSelect();
        state.turnType = state.turnType === "good" ? "bad" : "good";
        state.storyCount++;
        startTimer();
        render();
      });

      container.querySelector("#btn-start-timer")?.addEventListener("click", () => {
        Sound.playClick();
        startTimer();
      });

      container.querySelector("#btn-story-finish")?.addEventListener("click", () => {
        stopTimer();
        state.finished = true;
        Sound.playFanfare();
        if (typeof Confetti !== "undefined") Confetti.burst(42);
        if (typeof window !== "undefined" && window.StampRally) {
          window.StampRally.markPlayed("good-and-bad-news");
        }
        render();
      });
    }

    render();

    return () => {
      stopTimer();
    };
  },

  // ===================================================
  // 27. 30言ったら負け (21カウント対戦ボード)
  // ===================================================
  renderCount30(container, game) {
    let state = {
      current: 0,
      target: 30,
      turns: 0,
      finished: false
    };

    function update() {
      const finishCard = state.finished && typeof GameResult !== "undefined"
        ? GameResult.renderResultCard({
            tone: "danger",
            eyebrow: "ゲーム終了",
            title: `${state.target} に到達しました`,
            subtitle: `${state.target} を言ったプレイヤーの負けです`,
            metrics: [
              { label: "最終カウント", value: `${state.current} / ${state.target}` },
              { label: "経過ターン", value: `${state.turns}ターン` }
            ],
            actionsHtml: `
              <button class="btn btn-primary flex-1" id="btn-count30-retry">もう一度遊ぶ</button>
              <button class="btn btn-outline flex-1" id="btn-count30-batsu">ソフトミッション</button>
            `
          })
        : "";

      container.innerHTML = `
        <div class="tool-card text-center">
          <h3 class="tool-title">30言ったら負け（21ゲーム）</h3>

          <div class="btn-toggle-group my-3">
            <button class="btn-toggle ${state.target === 21 ? 'active' : ''}" data-target="21">21ゲーム</button>
            <button class="btn-toggle ${state.target === 30 ? 'active' : ''}" data-target="30">30ゲーム</button>
          </div>

          <div class="count-display-box my-4">
            <span class="badge badge-warning">現在のカウント</span>
            <div class="current-number font-black font-mono ${state.current >= state.target - 3 ? 'text-danger' : 'text-primary'}">
              ${state.current} / ${state.target}
            </div>
            <small class="text-muted">${state.target} を言わされたプレイヤーが敗北です</small>
          </div>

          ${state.finished ? finishCard : `
            <div class="flex gap-2 justify-center my-3">
              <button class="btn btn-primary btn-lg flex-1 font-mono" data-add="1" aria-label="1進める">+1</button>
              <button class="btn btn-primary btn-lg flex-1 font-mono" data-add="2" aria-label="2進める">+2</button>
              <button class="btn btn-primary btn-lg flex-1 font-mono" data-add="3" aria-label="3進める">+3</button>
            </div>
            <button class="btn btn-outline btn-block mt-3" id="btn-reset-count30">ゲームやり直し</button>
          `}
        </div>
      `;

      const resetCount = (newTarget = state.target) => {
        state.target = newTarget;
        state.current = 0;
        state.turns = 0;
        state.finished = false;
        update();
      };

      container.querySelectorAll("[data-target]").forEach(btn => {
        btn.addEventListener("click", () => {
          Sound.playClick();
          resetCount(parseInt(btn.dataset.target, 10));
        });
      });

      container.querySelectorAll("[data-add]").forEach(btn => {
        btn.addEventListener("click", () => {
          if (state.finished) return;
          const add = parseInt(btn.dataset.add, 10);
          state.current = Math.min(state.target, state.current + add);
          state.turns++;
          if (state.current >= state.target) {
            state.finished = true;
            Sound.playWrong();
            Sound.hapticMedium();
            if (typeof window !== "undefined" && window.StampRally) {
              window.StampRally.markPlayed("counting-game-30");
            }
          } else {
            Sound.playClick();
            Sound.hapticLight?.();
          }
          update();
        });
      });

      container.querySelector("#btn-reset-count30")?.addEventListener("click", () => {
        Sound.playClick();
        resetCount();
      });
      container.querySelector("#btn-count30-retry")?.addEventListener("click", () => {
        Sound.playSelect();
        resetCount();
      });
      container.querySelector("#btn-count30-batsu")?.addEventListener("click", () => {
        Sound.playSelect();
        if (typeof window.openBatsuModal === "function") window.openBatsuModal();
      });
    }

    update();
  },

  // ===================================================
  // 28. 縛りしりとり (縛りルーレット＆履歴メモ)
  // ===================================================
  renderWordChain(container, game) {
    const ruleList = (game && game.presets && game.presets.length > 0) ? game.presets : [
      "3文字固定", "4文字固定", "5文字以上", "食べ物限定", "生き物限定", "カタカナ語限定",
      "最後の2文字を繋ぐ", "濁音・半濁音スタート", "地名・国名限定", "有名人・キャラクター限定"
    ];
    let state = {
      rules: ruleList,
      currentRule: extractTopicText(drawShuffledTopic(game.id || "word-chain", ruleList)) || "3文字固定",
      timerSec: 5,
      timerMax: 5,
      words: [],
      foulMessage: "",
      timerRunning: false,
      timerInterval: null
    };

    function startTimer() {
      if (state.timerInterval) {
        safeClearInterval(state.timerInterval);
        state.timerInterval = null;
      }
      state.foulMessage = "";
      state.timerSec = state.timerMax;
      state.timerRunning = true;
      Sound.playTick(1000);
      updateTimerDisplay();

      state.timerInterval = safeSetInterval(() => {
        state.timerSec--;
        if (state.timerSec > 0) {
          Sound.playTick(800 + (state.timerMax - state.timerSec) * 50);
          updateTimerDisplay();
        } else {
          safeClearInterval(state.timerInterval);
          state.timerInterval = null;
          state.timerRunning = false;
          if (typeof Sound.playTimeUp === "function") Sound.playTimeUp();
          else Sound.playWrong();
          Sound.hapticMedium();
          if (typeof window !== "undefined" && window.StampRally) {
            window.StampRally.markPlayed("word-chain-limit");
          }
          state.foulMessage = `制限時間（${state.timerMax}秒）オーバーでアウト`;
          render();
        }
      }, 1000);
    }

    function stopTimer() {
      if (state.timerInterval) {
        safeClearInterval(state.timerInterval);
        state.timerInterval = null;
      }
      state.timerRunning = false;
      state.timerSec = state.timerMax;
      updateTimerDisplay();
    }

    function updateTimerDisplay() {
      const el = container.querySelector("#word-chain-timer");
      const btn = container.querySelector("#btn-timer-toggle");
      const stopBtn = container.querySelector("#btn-timer-stop");
      if (el) {
        el.textContent = `${state.timerSec}秒`;
        el.className = "font-black font-mono text-4xl my-2 " + (state.timerSec <= 2 ? "text-danger animate-pulse" : "text-primary");
      }
      if (btn) {
        btn.textContent = state.timerRunning ? "次の人へ（タイマーリセット）" : "タイマースタート";
        btn.className = state.timerRunning ? "btn btn-warning btn-block btn-lg font-black py-4 pulse-scale" : "btn btn-primary btn-block btn-lg font-black py-4";
      }
      if (stopBtn) {
        stopBtn.classList.toggle("hidden", !state.timerRunning);
      }
    }

    function render() {
      const logOpen = container.querySelector("#chain-word-details")?.open;
      const lastNextKana = state.words.length > 0 && typeof GameResult !== "undefined" && typeof GameResult.validateWordChainEntry === "function"
        ? (() => {
            const prev = toHiragana(state.words[state.words.length - 1]).replace(/[ー〜～・\s、。！？!?]+$/g, "");
            return prev ? prev[prev.length - 1] : "";
          })()
        : "";
      const foulCard = state.foulMessage && typeof GameResult !== "undefined"
        ? GameResult.renderResultCard({
            tone: "danger",
            compact: true,
            eyebrow: "ラウンド終了",
            title: "アウト判定",
            subtitle: state.foulMessage,
            metrics: [
              { label: "縛りルール", value: state.currentRule },
              { label: "記録した言葉", value: `${state.words.length}語` }
            ],
            actionsHtml: `
              <button class="btn btn-primary btn-sm flex-1" id="btn-chain-next-round">次のラウンドへ</button>
              <button class="btn btn-outline btn-sm flex-1" id="btn-chain-foul-batsu">ソフトミッション</button>
            `
          })
        : "";

      container.innerHTML = `
        <div class="tool-card text-center">
          <h3 class="tool-title">縛りしりとり（スピードタイマー）</h3>

          <div class="topic-box my-3">
            <span class="topic-tag">発動中の縛りルール</span>
            <div class="topic-text font-black text-xl text-danger my-1">${escapeHTML(state.currentRule)}</div>
            <button class="btn btn-sm btn-outline mt-1" id="btn-next-rule">ルールを変える</button>
          </div>

          <details class="tool-optional-settings" id="chain-word-details" ${logOpen ? "open" : ""}>
            <summary>使った言葉を記録（重複・しりとりチェック）</summary>
            <form id="chain-word-form">
              <label for="chain-word">今の言葉${lastNextKana ? `（次は「${escapeHTML(lastNextKana)}」から）` : ""}</label>
              <input id="chain-word" maxlength="100" required placeholder="ひらがな・カタカナで入力">
              <button class="btn btn-sm btn-outline">記録</button>
            </form>
            <p id="chain-word-list" aria-live="polite">${escapeHTML(state.words.join(" → "))}</p>
            <button class="btn btn-sm btn-outline" id="chain-clear">履歴を消す</button>
          </details>
          <div class="setting-group my-2">
            <label class="setting-label text-xs">制限時間</label>
            <div class="btn-toggle-group">
              <button class="btn-toggle ${state.timerMax === 3 ? 'active' : ''}" data-timer-sec="3">3秒</button>
              <button class="btn-toggle ${state.timerMax === 5 ? 'active' : ''}" data-timer-sec="5">5秒</button>
              <button class="btn-toggle ${state.timerMax === 10 ? 'active' : ''}" data-timer-sec="10">10秒</button>
            </div>
          </div>

          ${foulCard}

          <div class="p-4 my-3 border rounded text-center two-choice-panel">
            <div id="word-chain-timer" class="font-black font-mono text-4xl text-primary my-2">${state.timerSec}秒</div>
            <button class="btn ${state.timerRunning ? 'btn-warning pulse-scale' : 'btn-primary'} btn-block btn-lg font-black py-4 mt-2" id="btn-timer-toggle">
              ${state.timerRunning ? '次の人へ（タイマーリセット）' : 'タイマースタート'}
            </button>
            <button class="btn btn-outline btn-sm btn-block mt-2 ${state.timerRunning ? '' : 'hidden'}" id="btn-timer-stop">
              タイマーを止める
            </button>
          </div>

          <div class="flex gap-2 mt-3">
            <button class="btn btn-danger flex-1 font-bold" id="btn-chain-foul">アウト判定</button>
            <button class="btn btn-secondary flex-1 font-bold" id="btn-chain-batsu">ソフトミッション</button>
          </div>
        </div>
      `;

      container.querySelector("#btn-next-rule").addEventListener("click", () => {
        Sound.playDrumRoll(0.6);
        safeSetTimeout(() => {
          Sound.playJajan();
          state.currentRule = extractTopicText(drawShuffledTopic(game.id || "word-chain", state.rules)) || "3文字固定";
          state.foulMessage = "";
          render();
        }, 600);
      });

      container.querySelectorAll("[data-timer-sec]").forEach(btn => {
        btn.addEventListener("click", () => {
          Sound.playClick();
          state.timerMax = parseInt(btn.dataset.timerSec, 10);
          state.timerSec = state.timerMax;
          if (state.timerRunning) startTimer();
          render();
        });
      });

      container.querySelector("#btn-timer-toggle").addEventListener("click", () => {
        startTimer();
      });

      container.querySelector("#btn-timer-stop").addEventListener("click", () => {
        Sound.playClick();
        stopTimer();
      });

      const history = container.querySelector("#chain-word-list");
      container.querySelector("#chain-word-form").addEventListener("submit", event => {
        event.preventDefault();
        const field = container.querySelector("#chain-word");
        const word = field.value.trim();
        if (!word) return;
        const check = typeof GameResult !== "undefined" && typeof GameResult.validateWordChainEntry === "function"
          ? GameResult.validateWordChainEntry(word, state.words, toHiragana)
          : { ok: !state.words.some(used => toHiragana(used) === toHiragana(word)), reason: "duplicate", message: "もう使った言葉です" };
        if (!check.ok) {
          Sound.playWrong();
          Toast.warning(check.message);
          if (check.reason === "ends_with_n" || check.reason === "duplicate") {
            stopTimer();
            state.foulMessage = `「${word}」：${check.message}`;
            render();
          }
          return;
        }
        Sound.playClick();
        state.words.push(word);
        history.textContent = state.words.join(" → ");
        field.value = "";
        render();
        container.querySelector("#chain-word")?.focus();
      });
      container.querySelector("#chain-clear").addEventListener("click", () => {
        Sound.playClick();
        state.words = [];
        history.textContent = "";
        render();
      });
      container.querySelector("#btn-chain-foul").addEventListener("click", () => {
        stopTimer();
        Sound.playWrong();
        Sound.hapticMedium();
        if (typeof window !== "undefined" && window.StampRally) {
          window.StampRally.markPlayed("word-chain-limit");
        }
        state.foulMessage = "言葉が出ない・重複でアウトになりました";
        render();
      });

      container.querySelector("#btn-chain-next-round")?.addEventListener("click", () => {
        Sound.playSelect();
        state.foulMessage = "";
        state.timerSec = state.timerMax;
        render();
      });

      const openBatsu = () => {
        Sound.playSelect();
        if (typeof window.openBatsuModal === "function") window.openBatsuModal();
      };
      container.querySelector("#btn-chain-foul-batsu")?.addEventListener("click", openBatsu);
      container.querySelector("#btn-chain-batsu").addEventListener("click", openBatsu);
    }

    render();
    return () => {
      stopTimer();
    };
  },

  // ===================================================
  // 29. 嘘つき自己紹介 (2真1偽 投票ボード)
  // ===================================================
  renderTwoTruths(container, game) {
    const promptList = (game && game.presets && game.presets.length > 0) ? game.presets : [];
    let state = {
      ep1: "",
      ep2: "",
      ep3: "",
      shuffled: [],
      suggestedPrompt: null
    };

    function update() {
      container.innerHTML = `
        <div class="tool-card">
          <p class="text-sm text-muted text-center mb-3">本当の出来事2つと、嘘の出来事1つを入力してシャッフルします。</p>

          ${promptList.length > 0 ? `
            <div class="mb-3 text-center">
              <button class="btn btn-sm btn-outline" id="btn-suggest-prompt">ネタのヒントを引く</button>
              ${state.suggestedPrompt ? `
                <div class="mt-2 text-xs font-bold text-primary animate-fade-in p-2 bg-light rounded border">
                  テーマ例: ${escapeHTML(extractTopicText(state.suggestedPrompt))}
                </div>
              ` : ''}
            </div>
          ` : ''}

          <div class="setting-group">
            <input type="text" class="input-player-name mb-2" required id="input-ep1" placeholder="本当のエピソード 1" value="${escapeHTML(state.ep1)}">
            <input type="text" class="input-player-name mb-2" required id="input-ep2" placeholder="本当のエピソード 2" value="${escapeHTML(state.ep2)}">
            <input type="text" class="input-player-name mb-2" required id="input-ep3" placeholder="嘘のエピソード（1つ）" value="${escapeHTML(state.ep3)}">
          </div>

          <button class="btn btn-primary btn-block btn-lg" id="btn-shuffle-truths">
            シャッフルしてお披露目
          </button>
        </div>
      `;

      if (container.querySelector("#btn-suggest-prompt")) {
        container.querySelector("#btn-suggest-prompt").addEventListener("click", () => {
          Sound.playSelect();
          state.ep1 = container.querySelector("#input-ep1").value;
          state.ep2 = container.querySelector("#input-ep2").value;
          state.ep3 = container.querySelector("#input-ep3").value;
          state.suggestedPrompt = drawShuffledTopic(game.id || "two-truths", promptList);
          update();
        });
      }

      container.querySelector("#btn-shuffle-truths").addEventListener("click", () => {
        state.ep1 = container.querySelector("#input-ep1").value.trim();
        state.ep2 = container.querySelector("#input-ep2").value.trim();
        state.ep3 = container.querySelector("#input-ep3").value.trim();

        const missing = [state.ep1, state.ep2, state.ep3].findIndex(value => !value);
        if (missing >= 0) {
          const field = container.querySelector(`#input-ep${missing + 1}`);
          field.focus();
          Toast.warning("本当の話を2つ、嘘の話を1つ入力してください");
          return;
        }
        const arr = [
          { text: state.ep1, isLie: false, votes: 0, opened: false },
          { text: state.ep2, isLie: false, votes: 0, opened: false },
          { text: state.ep3, isLie: true, votes: 0, opened: false }
        ];
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }

        Sound.playSelect();
        showRevealed(arr);
      });
    }

    function showRevealed(items) {
      let revealedAll = false;
      let guessedRight = null;

      function renderBoard() {
        const totalVotes = items.reduce((sum, item) => sum + item.votes, 0);
        const lieIdx = items.findIndex(item => item.isLie);
        const resultSlotHtml = revealedAll && typeof GameResult !== "undefined"
          ? GameResult.renderResultCard({
              tone: guessedRight === true ? "win" : guessedRight === false ? "wolf" : "neutral",
              compact: true,
              eyebrow: "結果発表",
              title: guessedRight === true
                ? `見破り成功！ #${lieIdx + 1} が嘘でした`
                : guessedRight === false
                  ? `騙し切り成功！ #${lieIdx + 1} が嘘でした`
                  : `#${lieIdx + 1} が嘘でした`,
              subtitle: `「${items[lieIdx].text}」`,
              metrics: totalVotes > 0
                ? items.map((item, i) => ({ label: `#${i + 1}${item.isLie ? "（嘘）" : ""}`, value: `${item.votes}票` }))
                : []
            })
          : "";

        container.innerHTML = `
          <div class="tool-card text-center">
            <h3 class="tool-title">どれが嘘？</h3>
            <p class="text-sm text-muted">質問しながら怪しい番号に投票し、最後に正解をオープンしましょう。</p>

            ${resultSlotHtml ? `<div id="two-truths-result-slot" class="my-3">${resultSlotHtml}</div>` : '<div id="two-truths-result-slot"></div>'}

            <div class="my-4">
              ${items.map((item, idx) => `
                <div class="topic-box mb-2 ${item.opened ? (item.isLie ? 'card-error' : 'card-success') : ''}" id="truth-card-${idx}">
                  <div class="font-bold">#${idx + 1}: ${escapeHTML(item.text)}</div>
                  ${!revealedAll ? `
                    <div class="flex gap-2 justify-center items-center mt-2 flex-wrap">
                      <button class="btn btn-xs btn-outline btn-vote-minus" data-idx="${idx}" ${item.votes === 0 ? "disabled" : ""}>-</button>
                      <span class="text-xs font-bold">疑い票: ${item.votes}票</span>
                      <button class="btn btn-xs btn-secondary btn-vote-plus" data-idx="${idx}">怪しい (+1)</button>
                      ${!item.opened ? `<button class="btn btn-xs btn-outline btn-check-lie" data-idx="${idx}">これだけ開示</button>` : ''}
                    </div>
                  ` : ''}
                  ${item.opened ? `
                    <div class="${item.isLie ? 'text-danger font-black' : 'text-success font-bold'} mt-2">
                      ${item.isLie ? 'こちらが嘘のエピソードでした' : 'こちらは本当の話です'}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>

            ${!revealedAll ? `
              <button class="btn btn-primary btn-block btn-lg mb-2" id="btn-reveal-all-truths">
                投票終了・正解を発表する
              </button>
            ` : ''}

            <button class="btn btn-outline btn-block" id="btn-restart-truths">次の人のエピソードを作成</button>
          </div>
        `;

        container.querySelectorAll(".btn-vote-plus").forEach(btn => {
          btn.addEventListener("click", () => {
            Sound.playClick();
            items[parseInt(btn.dataset.idx, 10)].votes++;
            renderBoard();
          });
        });

        container.querySelectorAll(".btn-vote-minus").forEach(btn => {
          btn.addEventListener("click", () => {
            const idx = parseInt(btn.dataset.idx, 10);
            if (items[idx].votes > 0) {
              Sound.playClick();
              items[idx].votes--;
              renderBoard();
            }
          });
        });

        container.querySelectorAll(".btn-check-lie").forEach(btn => {
          btn.addEventListener("click", () => {
            const idx = parseInt(btn.dataset.idx, 10);
            const previouslyOpenedTruths = items.filter(it => it.opened && !it.isLie).length;
            items[idx].opened = true;
            if (typeof window !== "undefined" && window.StampRally) {
              window.StampRally.markPlayed("two-truths-one-lie");
            }
            if (items[idx].isLie) {
              revealedAll = true;
              items.forEach(it => { it.opened = true; });
              guessedRight = previouslyOpenedTruths === 0;
              if (guessedRight) {
                Sound.playFanfare();
                if (typeof Confetti !== "undefined") Confetti.burst(42);
              } else {
                Sound.playSelect();
              }
            } else {
              Sound.playCorrect();
            }
            renderBoard();
          });
        });

        container.querySelector("#btn-reveal-all-truths")?.addEventListener("click", () => {
          revealedAll = true;
          items.forEach(it => { it.opened = true; });
          const maxVotes = Math.max(...items.map(it => it.votes));
          if (maxVotes > 0) {
            const topVoted = items.filter(it => it.votes === maxVotes);
            guessedRight = topVoted.length === 1 && topVoted[0].isLie;
          } else {
            guessedRight = null;
          }
          if (typeof window !== "undefined" && window.StampRally) {
            window.StampRally.markPlayed("two-truths-one-lie");
          }
          if (guessedRight === true) {
            Sound.playFanfare();
            if (typeof Confetti !== "undefined") Confetti.burst(42);
          } else {
            Sound.playSelect();
          }
          renderBoard();
        });

        container.querySelector("#btn-restart-truths").addEventListener("click", () => {
          Sound.playClick();
          state.ep1 = "";
          state.ep2 = "";
          state.ep3 = "";
          state.suggestedPrompt = null;
          update();
        });
      }

      renderBoard();
    }

    update();
  },

  // ===================================================
  // 30. ドレミの歌ゲーム (ランダム音階ルーレット)
  // ===================================================
  renderDoremi(container, game) {
    return this.renderRhythmBox(container, Object.assign({}, game, { subTab: "doremi" }));
  },

  // ===================================================
  // 31. サイレント・ジェスチャーゲーム (お題＆タイマー)
  // ===================================================
  renderGesture(container, game) { /* Canonical implementation in js/quality/tool-fixes.js */ }
};

window.DeckManager = DeckManager;
GameTools.toHiragana = toHiragana;
window.GameTools = GameTools;
