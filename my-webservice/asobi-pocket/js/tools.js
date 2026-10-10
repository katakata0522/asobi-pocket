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

function toHiragana(str) {
  if (!str) return "";
  return String(str)
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[\u30a1-\u30f6]/g, m => String.fromCharCode(m.charCodeAt(0) - 0x60));
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
      step: "setup", // setup, dealing, playing, reveal, result
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

    state.selectedTopic = getRandomTopic();

    function update() {
      if (state.step === "setup") {
        container.innerHTML = `
          <div class="tool-card">
            <h3 class="tool-title">🧶 ito（イト）設定</h3>

            <details class="tool-optional-settings">
              <summary>お題の場面を変える<span aria-hidden="true">⌄</span></summary>
            <div class="setting-group">
              <label class="setting-label">🎭 シーン別お題フィルター:</label>
              <div class="scene-filter-tabs">
                <button class="btn-scene ${state.selectedScene === 'all' ? 'active' : ''}" data-scene="all">🌟 全て</button>
                <button class="btn-scene ${state.selectedScene === 'party' ? 'active' : ''}" data-scene="party">🍻 飲み会・合コン</button>
                <button class="btn-scene ${state.selectedScene === 'friends' ? 'active' : ''}" data-scene="friends">🚗 友達・ドライブ</button>
                <button class="btn-scene ${state.selectedScene === 'family' ? 'active' : ''}" data-scene="family">👨‍👩‍👧 家族・子供</button>
                <button class="btn-scene ${state.selectedScene === 'work' ? 'active' : ''}" data-scene="work">💼 職場・アイスブレイク</button>
              </div>
            </div>

            </details>

            <div class="setting-group">
              <label class="setting-label">参加人数: <span id="val-ito-players" class="badge-num">${state.playerCount}人</span></label>
              <input type="range" class="range-slider" min="2" max="8" value="${state.playerCount}" id="range-ito-players">
            </div>

            <details class="player-custom-accordion">
    <summary class="player-custom-summary">👤 プレイヤー名を個別設定する (任意)</summary>
    <div class="player-names-grid mt-2" id="ito-player-inputs">
      ${Array.from({ length: state.playerCount }, (_, i) => `
        <input type="text" class="input-player-name" data-idx="${i}" value="${state.playerNames[i] || 'プレイヤー' + (i + 1)}" placeholder="名前 ${i + 1}">
      `).join('')}
    </div>
  </details>

            <details class="tool-optional-settings">
              <summary>カード枚数：${state.cardsPerPlayer}枚<span aria-hidden="true">⌄</span></summary>
            <div class="setting-group">
              <label class="setting-label">1人のカード枚数:</label>
              <div class="btn-toggle-group">
                <button class="btn-toggle ${state.cardsPerPlayer === 1 ? 'active' : ''}" data-cards="1">1枚 (通常)</button>
                <button class="btn-toggle ${state.cardsPerPlayer === 2 ? 'active' : ''}" data-cards="2">2枚 (マスターモード🔥)</button>
              </div>
            </div>

            </details>

            <div class="topic-box mb-4">
              <span class="topic-tag">🎯 今回のお題</span>
              <div class="topic-text" id="ito-topic-display">${escapeHTML(state.selectedTopic)}</div>
              <button class="btn btn-sm btn-outline mt-2" id="btn-ito-next-topic">お題を変える 🎲</button>
            </div>

            <button class="btn btn-primary btn-block btn-lg" id="btn-start-ito">
              <span>数字を配る！</span> ➔
            </button>
          </div>
        `;

        // イベントバインド
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
          state.playerCount = parseInt(e.target.value);
          while (state.playerNames.length < state.playerCount) {
            state.playerNames.push(`プレイヤー${state.playerNames.length + 1}`);
          }
          container.querySelector("#val-ito-players").textContent = `${state.playerCount}人`;
          update();
        });

        container.querySelectorAll(".input-player-name").forEach(inp => {
          inp.addEventListener("input", (e) => {
            const idx = parseInt(e.target.dataset.idx);
            state.playerNames[idx] = e.target.value.trim() || `プレイヤー${idx + 1}`;
          });
        });

        container.querySelectorAll("[data-cards]").forEach(btn => {
          btn.addEventListener("click", () => {
            Sound.playClick();
            state.cardsPerPlayer = parseInt(btn.dataset.cards);
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
          state.step = "passing";
          update();
        });
      } else if (state.step === "passing") {
        const curPlayer = state.players[state.currentPlayerIdx];
        const progress = Math.round(((state.currentPlayerIdx) / state.playerCount) * 100);

        container.innerHTML = `
          <div class="tool-card text-center">
            <div class="passing-progress-bar"><div class="passing-progress-fill" style="width: ${progress}%"></div></div>
            <div class="passing-header">
              <span class="badge badge-info">確認中 (${state.currentPlayerIdx + 1}/${state.playerCount})</span>
              <h2 class="passing-name-call">📱 次は【<span class="highlight-name">${escapeHTML(curPlayer.name)}</span>】さんへ渡してください</h2>
            </div>

            <div class="topic-box-compact my-3">
              <small>🎯 お題: ${escapeHTML(state.selectedTopic)}</small>
            </div>

            <div class="secret-card-container">
              <div class="secret-card-box" id="secret-card-box">
                <div class="secret-card-closed">
                  <div class="lock-icon">🔒</div>
                  <p class="font-bold">ここを長押し または タップして<br>自分の数字をこっそり確認</p>
                  <small class="text-muted">（他の人に見られないように注意！）</small>
                </div>
                <div class="secret-card-revealed hidden">
                  <div class="card-num-badge-group">
                    ${curPlayer.numbers.map(num => `<div class="card-large-number">${num}</div>`).join('')}
                  </div>
                  <p class="mt-2 text-warning font-bold">数字そのものは言わずに、お題の例えで伝えよう！</p>
                </div>
              </div>
            </div>

            <button class="btn btn-primary btn-block btn-lg mt-4 hidden" id="btn-ito-next-person">
              ${state.currentPlayerIdx + 1 < state.playerCount ? '次の人へ渡す ➔' : '全員確認完了！トーク開始 ➔'}
            </button>
          </div>
        `;

        const box = container.querySelector("#secret-card-box");
        const closed = box.querySelector(".secret-card-closed");
        const revealed = box.querySelector(".secret-card-revealed");
        const nextBtn = container.querySelector("#btn-ito-next-person");

        let isRevealed = false;
        function revealCard() {
          if (isRevealed) return;
          isRevealed = true;
          Sound.playSelect();
          Sound.hapticMedium();
          closed.classList.add("hidden");
          revealed.classList.remove("hidden");
          box.classList.add("revealed");
          nextBtn.classList.remove("hidden");
        }

        box.addEventListener("click", revealCard);

        nextBtn.addEventListener("click", () => {
          Sound.playClick();
          if (state.currentPlayerIdx + 1 < state.playerCount) {
            state.currentPlayerIdx++;
            update();
          } else {
            state.step = "talk";
            update();
          }
        });
      } else if (state.step === "talk") {
        // 全員のカードを小さい順に並べ替える画面
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
              <span class="badge badge-success">話し合いタイム ＆ カード並べ替え</span>
              <h3 class="tool-title mt-1">🎯 ${escapeHTML(state.selectedTopic)}</h3>
              <p class="text-sm text-muted">例え合いながら、数字が小さいと思う順にカードをドラッグまたは上下移動して並べよう！</p>
            </div>

            <div class="ito-card-list" id="ito-sortable-list">
              ${state.placedOrder.map((card, idx) => `
                <div class="ito-card-item" data-idx="${idx}">
                  <span class="ito-order-num">#${idx + 1}</span>
                  <div class="ito-card-holder">
                    <span class="ito-player-tag">${escapeHTML(card.playerName)}</span>
                    <span class="ito-card-masked" id="ito-card-masked-${idx}">❓ [秘匿カード]</span>
                  </div>
                  <div class="ito-card-moves flex items-center gap-1">
                    <button type="button" class="btn btn-xs btn-outline btn-ito-peep" data-peep-idx="${idx}" title="押している間だけこっそり数字を確認">👁️ 押して覗く</button>
                    <button class="btn btn-sm btn-icon btn-move-up" data-idx="${idx}" ${idx === 0 ? 'disabled' : ''}>▲</button>
                    <button class="btn btn-sm btn-icon btn-move-down" data-idx="${idx}" ${idx === state.placedOrder.length - 1 ? 'disabled' : ''}>▼</button>
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="mt-4 flex flex-col gap-2">
              <button class="btn btn-outline btn-block" id="btn-ito-focus-mode">
                🗣️ 大画面トーク集中モード
              </button>
              <button class="btn btn-danger btn-block btn-lg" id="btn-ito-open-cards">
                🔥 運命のオープン！
              </button>
            </div>
          </div>
        `;

        // ピープ（押している間だけこっそり確認）機能
        container.querySelectorAll(".btn-ito-peep").forEach(btn => {
          const idx = parseInt(btn.dataset.peepIdx);
          const maskedEl = container.querySelector(`#ito-card-masked-${idx}`);
          if (!maskedEl) return;
          const cardNum = state.placedOrder[idx].number;
          let isPeeping = false;
          const showNum = (e) => {
            if (e.cancelable) e.preventDefault();
            if (isPeeping) return;
            isPeeping = true;
            maskedEl.innerHTML = `<span class="badge badge-warning font-bold text-sm animate-scale">👀 数字: ${cardNum}</span>`;
            btn.classList.add("btn-warning");
            if (typeof Sound !== "undefined" && typeof Sound.hapticLight === "function") {
              Sound.hapticLight();
            }
          };
          const hideNum = (e) => {
            if (!isPeeping) return;
            isPeeping = false;
            maskedEl.innerHTML = `❓ [秘匿カード]`;
            btn.classList.remove("btn-warning");
          };
          btn.addEventListener("mousedown", showNum);
          btn.addEventListener("mouseup", hideNum);
          btn.addEventListener("mouseleave", hideNum);
          btn.addEventListener("touchstart", showNum, { passive: false });
          btn.addEventListener("touchend", hideNum);
          btn.addEventListener("touchcancel", hideNum);
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
            const idx = parseInt(btn.dataset.idx);
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
            const idx = parseInt(btn.dataset.idx);
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

        container.querySelector("#btn-ito-open-cards").addEventListener("click", () => {
          Sound.playDrumRoll(2.0);
          state.step = "result";
          safeSetTimeout(() => {
            update();
          }, 2000);
        });
      } else if (state.step === "result") {
        if (typeof window !== "undefined" && window.StampRally) {
          window.StampRally.markPlayed("ito");
        }
        let isPerfect = true;
        for (let i = 0; i < state.placedOrder.length - 1; i++) {
          if (state.placedOrder[i].number > state.placedOrder[i + 1].number) {
            isPerfect = false;
            break;
          }
        }

        if (isPerfect) {
          Sound.playFanfare();
          Sound.playJajan();
          if (typeof Confetti !== "undefined") Confetti.launch();
        } else {
          Sound.playWrong();
        }

        container.innerHTML = `
          <div class="tool-card text-center">
            ${isPerfect ? `
              <div class="result-celebration animate-bounce">🎉 完璧！完全クリア！！ 🎉</div>
              <h2 class="result-title text-success font-black">全員の絆と価値観がシンクロ！</h2>
            ` : `
              <div class="result-celebration text-danger">💥 惜しい！順番ミス！ 💥</div>
              <h2 class="result-title text-danger font-black">価値観のズレが発覚！？</h2>
            `}

            <div class="topic-box-compact my-3">
              <small>🎯 お題: ${escapeHTML(state.selectedTopic)}</small>
            </div>

            <div class="ito-result-cards mt-3">
              ${state.placedOrder.map((card, idx) => {
                const prev = idx > 0 ? state.placedOrder[idx - 1].number : -1;
                const isError = prev > card.number;
                return `
                  <div class="ito-result-card-item ${isError ? 'card-error' : 'card-success'} animate-fade-in">
                    <span class="ito-order-num">#${idx + 1}</span>
                    <span class="ito-player-name">${escapeHTML(card.playerName)}</span>
                    <span class="ito-actual-num">${card.number}</span>
                    ${isError ? '<span class="badge-error">逆転！</span>' : ''}
                  </div>
                `;
              }).join('')}
            </div>

            <div class="mt-4 flex gap-2">
              <button class="btn btn-primary btn-block btn-lg" id="btn-ito-retry">もう一度遊ぶ 🔄</button>
            </div>
          </div>
        `;

        container.querySelector("#btn-ito-retry").addEventListener("click", () => {
          Sound.playClick();
          state.step = "setup";
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

    let currentKana = DeckManager.getNext('asa-sore-kana', KANA_LIST);
    let currentTopic = getRandomTopic();
    let answersLog = [];

    const asaTimer = new GameTimer({
      totalSeconds: 60,
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
        Sound.playExplosion();
        Toast.warning("⏰ シンキングタイム終了です！");
        updateTimerBtns();
      }
    });

    function updateTimerBtns() {
      const btn = container.querySelector("#btn-toggle-asa-timer");
      if (btn) {
        btn.textContent = asaTimer.isRunning ? '一時停止' : `タイマースタート (${asaTimer.remaining}秒)`;
        btn.className = `btn ${asaTimer.isRunning ? 'btn-secondary' : 'btn-primary'} btn-sm`;
      }
      const numEl = container.querySelector(".asa-timer-num");
      if (numEl) {
        numEl.textContent = `${asaTimer.remaining}秒`;
        numEl.className = `asa-timer-num ${asaTimer.remaining <= 10 && asaTimer.isRunning ? 'pulse-red' : ''}`;
      }
    }

    function render() {
      container.innerHTML = `
        <div class="tool-card text-center asa-sore-card">
          <div class="asa-sore-banner">☀️ 朝までそれ正解ジェネレーター</div>

          <!-- お題ディスプレイ -->
          <div class="asa-sore-display">
            <div class="asa-kana-badge">「${escapeHTML(currentKana)}」で始まる</div>
            <div class="asa-topic-main">${escapeHTML(currentTopic)}</div>
            <div class="asa-sore-suffix">…といえば？</div>
          </div>

          <div class="asa-controls-grid">
            <button class="btn btn-outline btn-sm" id="btn-shuffle-both">お題を全抽選 🎲</button>
            <button class="btn btn-outline btn-sm" id="btn-shuffle-kana">文字だけ変える (「${escapeHTML(currentKana)}」➔)</button>
            <button class="btn btn-outline btn-sm" id="btn-shuffle-topic">テーマだけ変える 🔄</button>
          </div>

          <!-- タイマー -->
          <div class="asa-timer-box">
            <div class="asa-timer-header">
              <span>🤔 シンキングタイム</span>
              <strong class="asa-timer-num ${asaTimer.remaining <= 10 && asaTimer.isRunning ? 'pulse-red' : ''}">${asaTimer.remaining}秒</strong>
            </div>
            <div class="asa-timer-btns">
              <button class="btn ${asaTimer.isRunning ? 'btn-secondary' : 'btn-primary'} btn-sm" id="btn-toggle-asa-timer">
                ${asaTimer.isRunning ? '一時停止' : `タイマースタート (${asaTimer.remaining}秒)`}
              </button>
              <button class="btn btn-outline btn-sm" id="btn-reset-asa-timer">リセット</button>
            </div>
          </div>

          <!-- 正解決定メモ機能 -->
          <div class="asa-decision-box">
            <label class="decision-label">🏆 全員で議論して決まった「今日のそれ正解」:</label>
            <div class="decision-input-row">
              <input type="text" class="decision-input" id="input-asa-answer" placeholder="例: 「${escapeHTML(currentKana)}」から始まる正解を入力...">
              <button class="btn btn-success" id="btn-save-asa-answer">決定！ 🎉</button>
            </div>
          </div>

          <!-- 履歴 ＆ Xシェア -->
          ${answersLog.length > 0 ? `
            <div class="asa-history-section">
              <h4 class="history-title">📜 今日の決定した『それ正解』リスト</h4>
              <div class="history-list">
                ${answersLog.map((item, idx) => `
                  <div class="history-item">
                    <div class="history-left">
                      <span class="history-q">「${escapeHTML(item.kana)}」で始まる${escapeHTML(item.topic)}</span>
                      <strong class="history-a">➔ ${escapeHTML(item.answer)}</strong>
                    </div>
                    <button class="btn btn-xs btn-outline btn-share-sore" data-idx="${idx}">
                      𝕏 ポスト
                    </button>
                    <button class="btn btn-xs btn-line btn-share-sore-line" data-idx="${idx}">
                      LINE
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;

      container.querySelector("#btn-shuffle-both").addEventListener("click", () => {
        Sound.playClick();
        currentKana = DeckManager.getNext('asa-sore-kana', KANA_LIST);
        currentTopic = getRandomTopic();
        asaTimer.reset(60);
        render();
      });

      container.querySelector("#btn-shuffle-kana").addEventListener("click", () => {
        Sound.playClick();
        currentKana = DeckManager.getNext('asa-sore-kana', KANA_LIST);
        render();
      });

      container.querySelector("#btn-shuffle-topic").addEventListener("click", () => {
        Sound.playClick();
        currentTopic = getRandomTopic();
        render();
      });

      container.querySelector("#btn-toggle-asa-timer").addEventListener("click", () => {
        Sound.playClick();
        asaTimer.toggle();
        updateTimerBtns();
      });

      container.querySelector("#btn-reset-asa-timer").addEventListener("click", () => {
        Sound.playClick();
        asaTimer.reset(60);
        updateTimerBtns();
      });

      const inputAns = container.querySelector("#input-asa-answer");
      container.querySelector("#btn-save-asa-answer").addEventListener("click", () => {
        const val = inputAns.value.trim();
        if (val) {
          Sound.playFanfare();
          Confetti.burst(60);
          Toast.success(`「${val}」をそれ正解に決定！`);
          if (typeof window !== "undefined" && window.StampRally) {
            window.StampRally.markPlayed("asa-sore");
          }
          answersLog.unshift({
            kana: currentKana,
            topic: currentTopic,
            answer: val
          });
          inputAns.value = "";
          render();
        }
      });

      container.querySelectorAll(".btn-share-sore").forEach(btn => {
        btn.addEventListener("click", () => {
          Sound.playClick();
          const item = answersLog[parseInt(btn.dataset.idx)];
          if (item) {
            const tweetText = `【朝までそれ正解】\nお題：「${item.kana}」で始まる${item.topic}…といえば？\n満場一致の正解：『${item.answer}』！\n\n#朝までそれ正解 #あそびポケット\n${window.location.href}`;
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, "_blank");
          }
        });
      });

      container.querySelectorAll(".btn-share-sore-line").forEach(btn => {
        btn.addEventListener("click", () => {
          Sound.playClick();
          const item = answersLog[parseInt(btn.dataset.idx)];
          if (item) {
            const lineText = `【朝までそれ正解】\nお題：「${item.kana}」で始まる${item.topic}…といえば？\n満場一致の正解：『${item.answer}』！\n\nあそびポケットで遊ぼう！\n${window.location.href}`;
            window.open(`https://line.me/R/msg/text/?${encodeURIComponent(lineText)}`, "_blank");
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
  renderWordWolf(container, game) {
    let state = {
      playerCount: 4,
      wolfCount: 1,
      step: "setup",
      players: [],
      currentPlayerIdx: 0,
      timerSec: 180,
      timerInterval: null,
      selectedPreset: null
    };

    function update() {
      if (state.step === "setup") {
        container.innerHTML = `
          <div class="tool-card">
            <h3 class="tool-title">🐺 ワードウルフ設定</h3>
            <div class="setting-group">
              <label class="setting-label">参加人数: <span id="val-player-count" class="badge-num">${state.playerCount}人</span></label>
              <input type="range" class="range-slider" min="3" max="8" value="${state.playerCount}" id="range-player-count">
            </div>
            <div class="setting-group">
              <label class="setting-label">ウルフの人数: <span id="val-wolf-count" class="badge-num">${state.wolfCount}人</span></label>
              <div class="btn-toggle-group">
                <button class="btn-toggle ${state.wolfCount === 1 ? 'active' : ''}" data-wolf="1">1人</button>
                <button class="btn-toggle ${state.wolfCount === 2 ? 'active' : ''}" data-wolf="2" ${state.playerCount < 5 ? 'disabled' : ''}>2人 (5人以上)</button>
              </div>
            </div>
            <div class="setting-group">
              <label class="setting-label">トーク時間: <span id="val-time" class="badge-num">${Math.floor(state.timerSec / 60)}分</span></label>
              <div class="btn-toggle-group">
                <button class="btn-toggle ${state.timerSec === 120 ? 'active' : ''}" data-time="120">2分</button>
                <button class="btn-toggle ${state.timerSec === 180 ? 'active' : ''}" data-time="180">3分</button>
                <button class="btn-toggle ${state.timerSec === 300 ? 'active' : ''}" data-time="300">5分</button>
              </div>
            </div>
            <button class="btn btn-primary btn-block btn-lg" id="btn-start-wolf">
              <span>役職とお題を配る</span> ➔
            </button>
          </div>
        `;

        const range = container.querySelector("#range-player-count");
        range.addEventListener("input", (e) => {
          state.playerCount = parseInt(e.target.value);
          container.querySelector("#val-player-count").textContent = `${state.playerCount}人`;
          if (state.playerCount < 5 && state.wolfCount === 2) state.wolfCount = 1;
          update();
        });

        container.querySelectorAll("[data-wolf]").forEach(btn => {
          btn.addEventListener("click", () => {
            Sound.playClick();
            state.wolfCount = parseInt(btn.dataset.wolf);
            update();
          });
        });

        container.querySelectorAll("[data-time]").forEach(btn => {
          btn.addEventListener("click", () => {
            Sound.playClick();
            state.timerSec = parseInt(btn.dataset.time);
            update();
          });
        });

        container.querySelector("#btn-start-wolf").addEventListener("click", () => {
          Sound.playSelect();
          state.selectedPreset = drawShuffledTopic(game.id, game.presets) || (game.presets && game.presets[0]) || { citizen: "りんご", wolf: "なし", category: "食べ物" };

          let w1 = state.selectedPreset.citizen || "";
          let w2 = state.selectedPreset.wolf || "";
          if ((!w1 || !w2) && state.selectedPreset) {
            const raw = state.selectedPreset.text || (typeof state.selectedPreset === "string" ? state.selectedPreset : "");
            const parts = raw.split(/\s*(?:＆|&|VS|vs|、|\/)\s*/i);
            if (parts.length >= 2) {
              w1 = parts[0].trim();
              w2 = parts[1].trim();
            } else if (raw) {
              w1 = raw;
              w2 = raw + " (ウルフ)";
            }
          }
          if (!w1) w1 = "りんご";
          if (!w2) w2 = "なし";

          const roles = Array(state.playerCount).fill("citizen");
          const wolfIndices = [];
          while (wolfIndices.length < state.wolfCount) {
            const r = Math.floor(Math.random() * state.playerCount);
            if (!wolfIndices.includes(r)) wolfIndices.push(r);
          }
          wolfIndices.forEach(idx => roles[idx] = "wolf");

          const swap = Math.random() < 0.5;
          const citizenWord = swap ? w1 : w2;
          const wolfWord = swap ? w2 : w1;
          state.citizenWord = citizenWord;
          state.wolfWord = wolfWord;
          state.category = state.selectedPreset.category || "定番・日常";

          state.players = roles.map((role, idx) => ({
            id: idx + 1,
            name: `プレイヤー ${idx + 1}`,
            role: role,
            word: role === "citizen" ? citizenWord : wolfWord
          }));

          state.currentPlayerIdx = 0;
          state.step = "passing";
          update();
        });

      } else if (state.step === "passing") {
        const player = state.players[state.currentPlayerIdx];
        container.innerHTML = `
          <div class="tool-card text-center">
            <div class="pass-indicator">順番: ${state.currentPlayerIdx + 1} / ${state.playerCount} 人目</div>
            <h3 class="player-turn-title">📱 ${escapeHTML(player.name)} さん</h3>
            <p class="pass-desc">スマホを受け取ったら、下のボタンをタップしてお題を確認してください。</p>

            <div class="secret-box-wrapper">
              <button class="btn btn-secret" id="btn-reveal-word">
                <span class="secret-icon">🔒</span>
                <span class="secret-text">タップしてお題を見る</span>
              </button>
              <div class="secret-word-card hidden" id="secret-word-card">
                <span class="word-category">ジャンル: ${escapeHTML(state.category || (state.selectedPreset && state.selectedPreset.category) || '定番・日常')}</span>
                <div class="the-word">${escapeHTML(player.word)}</div>
                <p class="word-caution">※この言葉について周りとトークしてね！</p>
                <button class="btn btn-outline btn-xs mt-2" id="btn-hide-word">🙈 伏せる（隠す）</button>
              </div>
            </div>

            <button class="btn btn-primary btn-block mt-4 hidden" id="btn-next-player">
              ${state.currentPlayerIdx + 1 < state.playerCount ? '確認した！次の人へ ➔' : '全員完了！トークを始める ⏱️'}
            </button>
          </div>
        `;

        const btnReveal = container.querySelector("#btn-reveal-word");
        const cardWord = container.querySelector("#secret-word-card");
        const btnNext = container.querySelector("#btn-next-player");
        const btnHide = container.querySelector("#btn-hide-word");

        btnReveal.addEventListener("click", () => {
          Sound.playClick();
          btnReveal.classList.add("hidden");
          cardWord.classList.remove("hidden");
          btnNext.classList.remove("hidden");
        });

        if (btnHide) {
          btnHide.addEventListener("click", () => {
            Sound.playClick();
            cardWord.classList.add("hidden");
            btnReveal.classList.remove("hidden");
          });
        }

        btnNext.addEventListener("click", () => {
          Sound.playSelect();
          if (state.currentPlayerIdx + 1 < state.playerCount) {
            state.currentPlayerIdx++;
            update();
          } else {
            state.step = "timer";
            update();
          }
        });

      } else if (state.step === "timer") {
        container.innerHTML = `
          <div class="tool-card text-center">
            <div class="timer-badge">💬 トークタイム中！</div>
            <div class="timer-display-lg" id="wolf-timer-display">${formatTime(state.timerSec)}</div>
            <p class="timer-guide">自分のお題を直接言わずに、探り合おう！</p>

            <div class="btn-group-row">
              <button class="btn btn-secondary" id="btn-toggle-timer">一時停止</button>
              <button class="btn btn-danger" id="btn-finish-talk">トーク終了＆投票 ➔</button>
            </div>
          </div>
        `;

        const display = container.querySelector("#wolf-timer-display");
        const btnToggle = container.querySelector("#btn-toggle-timer");
        const btnFinish = container.querySelector("#btn-finish-talk");

        if (state.timer) state.timer.destroy();
        state.timer = new GameTimer({
          totalSeconds: state.timerSec,
          tickSoundInterval: 10,
          title: "ワードウルフ",
          gameId: "word-wolf",
          onTick: (rem) => {
            display.textContent = formatTime(rem);
            if (rem === 60) {
              Sound.playTick(1200);
              Toast.warning("⏱️ 残り1分です！");
            } else if (rem === 30) {
              Sound.playTick(1400);
              Toast.warning("⏱️ 残り30秒！そろそろ怪しい人を絞ろう！");
            }
            if (rem <= 10 && rem > 0) {
              display.classList.add("pulse-red");
            }
          },
          onFinish: () => {
            Sound.playExplosion();
            Toast.info("🔔 タイムアップ！投票に移ります！");
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
            <h3 class="tool-title">🗳️ 投票フェーズ！</h3>
            <p class="vote-instruction">怪しいと思う人に投票してください（タップで選択）:</p>

            <div class="vote-player-grid">
              ${state.players.map(p => `
                <button class="btn btn-outline btn-vote-target" data-pid="${p.id}">
                  👤 ${escapeHTML(p.name)} に投票
                </button>
              `).join('')}
            </div>

            <div class="mt-4">
              <button class="btn btn-warning btn-lg btn-block" id="btn-open-roles">
                <span>投票完了！結果発表 ＆ 正解オープン</span> 🎉
              </button>
            </div>
          </div>
        `;

        container.querySelectorAll(".btn-vote-target").forEach(btn => {
          btn.addEventListener("click", () => {
            Sound.playClick();
            container.querySelectorAll(".btn-vote-target").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
          });
        });

        container.querySelector("#btn-open-roles").addEventListener("click", () => {
          Sound.playFanfare();
          Confetti.burst(80);
          state.step = "result";
          update();
        });

      } else if (state.step === "result") {
        const citizenWord = state.citizenWord || (state.selectedPreset && state.selectedPreset.citizen) || "市民のお題";
        const wolfWord = state.wolfWord || (state.selectedPreset && state.selectedPreset.wolf) || "ウルフのお題";

        container.innerHTML = `
          <div class="tool-card text-center">
            <h3 class="tool-title">🎉 投票結果 ＆ 役職オープン！</h3>

            <div class="roles-list my-3" id="wolf-roles-list">
              ${state.players.map(p => `
                <div class="role-item ${state.isWordsRevealed ? (p.role === 'wolf' ? 'is-wolf' : 'is-citizen') : 'is-citizen'}">
                  <span class="role-icon">${state.isWordsRevealed ? (p.role === 'wolf' ? '🐺 ウルフ' : '👤 市民') : '❓ 役職・お題'}</span>
                  <span class="role-player">${escapeHTML(p.name)}</span>
                  <span class="role-word">${state.isWordsRevealed ? `お題: <strong class="text-primary font-bold">${escapeHTML(p.word)}</strong>` : '<span class="badge badge-secondary text-2xs">🔒 逆転推理・判定後に公開</span>'}</span>
                </div>
              `).join('')}
            </div>

            ${!state.isWordsRevealed ? `
              <div class="text-center mb-2">
                <button class="btn btn-xs btn-outline" id="btn-reveal-wolf-words">👁️ 推理をスキップして全員の役職・お題を公開</button>
              </div>
            ` : ''}

            <!-- ウルフ逆転お題当てチャレンジセクション -->
            <div class="topic-box my-3 text-left wolf-guess-box">
              <span class="topic-tag">🐺 ウルフの逆転チャンス！</span>
              <p class="text-xs text-sub mt-1">
                もしウルフが吊られた場合でも、ウルフが【市民のお題（多数派）】を当てられたら<strong>ウルフの逆転大勝利</strong>です！
              </p>
              <div class="mt-2" id="wolf-guess-action-area">
                <button class="btn btn-warning btn-sm btn-block" id="btn-show-wolf-guess">
                  🐺 市民のお題を推理して解答する！
                </button>
                <div class="hidden mt-2" id="wolf-guess-input-group">
                  <div class="decision-input-row">
                    <input type="text" class="decision-input" id="input-wolf-guess" placeholder="市民のお題を入力...">
                    <button class="btn btn-danger" id="btn-judge-wolf-guess">判定！ 🎯</button>
                  </div>
                </div>
                <div id="wolf-guess-result-msg" class="mt-2 font-bold text-center"></div>
              </div>
            </div>

            <button class="btn btn-primary btn-block mt-4" id="btn-restart-wolf">もう一度遊ぶ 🔄</button>
          </div>
        `;

        const btnRevealWords = container.querySelector("#btn-reveal-wolf-words");
        if (btnRevealWords) {
          btnRevealWords.addEventListener("click", () => {
            Sound.playSelect();
            state.isWordsRevealed = true;
            if (typeof window !== "undefined" && window.StampRally) {
              window.StampRally.markPlayed("word-wolf");
            }
            update();
          });
        }

        const btnShowGuess = container.querySelector("#btn-show-wolf-guess");
        const guessInputGroup = container.querySelector("#wolf-guess-input-group");
        const inputGuess = container.querySelector("#input-wolf-guess");
        const btnJudge = container.querySelector("#btn-judge-wolf-guess");
        const resultMsg = container.querySelector("#wolf-guess-result-msg");

        if (btnShowGuess) {
          btnShowGuess.addEventListener("click", () => {
            Sound.playClick();
            btnShowGuess.classList.add("hidden");
            guessInputGroup.classList.remove("hidden");
          });
        }

        if (btnJudge) {
          btnJudge.addEventListener("click", () => {
            const guess = inputGuess.value.trim();
            if (!guess) {
              Toast.warning("お題を入力してください！");
              return;
            }
            state.isWordsRevealed = true;
            if (typeof window !== "undefined" && window.StampRally) {
              window.StampRally.markPlayed("word-wolf");
            }
            const rolesListEl = container.querySelector("#wolf-roles-list");
            if (rolesListEl) {
              rolesListEl.innerHTML = state.players.map(p => `
                <div class="role-item ${p.role === 'wolf' ? 'is-wolf' : 'is-citizen'} animate-fade-in">
                  <span class="role-icon">${p.role === 'wolf' ? '🐺 ウルフ' : '👤 市民'}</span>
                  <span class="role-player">${escapeHTML(p.name)}</span>
                  <span class="role-word">お題: <strong class="text-primary font-bold">${escapeHTML(p.word)}</strong></span>
                </div>
              `).join('');
            }
            if (btnRevealWords) btnRevealWords.remove();

            const cleanNorm = (s) => toHiragana(s).replace(/\s+/g, "");
            const normGuess = cleanNorm(guess);
            const normCitizen = cleanNorm(citizenWord);
            const isMatch = normGuess === normCitizen ||
              (normGuess.length >= 2 && normCitizen.includes(normGuess) && normGuess.length >= Math.floor(normCitizen.length * 0.5)) ||
              (normCitizen.length >= 2 && normGuess.includes(normCitizen));

            if (isMatch) {
              Sound.playFanfare();
              Confetti.burst(100);
              resultMsg.innerHTML = `<span class="text-danger font-bold text-lg">🎉 大正解！【${escapeHTML(citizenWord)}】<br>🐺 ウルフチームの奇跡の逆転勝利！！</span>`;
            } else {
              Sound.playExplosion();
              resultMsg.innerHTML = `<span class="text-sub font-bold">❌ 残念！市民のお題は【${escapeHTML(citizenWord)}】でした！<br>🏆 市民チームの完全勝利！！</span>`;
            }
            btnJudge.disabled = true;
            inputGuess.disabled = true;
          });
        }

        container.querySelector("#btn-restart-wolf").addEventListener("click", () => {
          Sound.playClick();
          state.step = "setup";
          state.isWordsRevealed = false;
          update();
        });
      }
    }

    function formatTime(sec) {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    update();
    return () => {
      if (state.timer) state.timer.destroy();
      if (state.timerInterval) safeClearInterval(state.timerInterval);
    };
  },

  // ===================================================
  // 2. 爆弾タイマー ＆ 古今東西
  // ===================================================
  renderBombTimer(container, game) {
    let tickId = null;
    let isRunning = false;
    let timeMode = "normal";
    let rallyCount = 0;
    let currentTopic = "";

    function getRandomTopic() {
      const item = drawShuffledTopic(game.id, game.presets);
      return extractTopicText(item) || "赤いもの";
    }

    currentTopic = getRandomTopic();

    function render() {
      container.innerHTML = `
        <div class="tool-card text-center bomb-game-card">
          <div class="topic-box">
            <span class="topic-tag">🎯 今のお題</span>
            <div class="topic-text" id="bomb-topic-text">${escapeHTML(currentTopic)}</div>
            <button class="btn btn-sm btn-outline mt-2" id="btn-next-topic">お題を変える 🎲</button>
          </div>

          <div class="bomb-visual" id="bomb-visual">
            <div class="bomb-emoji">💣</div>
            <div class="bomb-spark hidden" id="bomb-spark">💥</div>
          </div>

          <div class="rally-counter-box mb-3 ${isRunning ? '' : 'hidden'}" id="rally-box">
            <span>🔥 ラリー回数: <strong id="rally-count-num">${rallyCount}</strong> 回</span>
          </div>

          <div class="bomb-status" id="bomb-status">
            ${isRunning ? '⚠️ 答えたら画面をタップして隣へパス！' : '時間モードを選んでスタート！'}
          </div>

          ${!isRunning ? `
            <div class="time-mode-selector mb-3">
              <span class="filter-label">⏱️ 時間設定:</span>
              <div class="btn-toggle-group">
                <button class="btn-toggle ${timeMode === 'short' ? 'active' : ''}" data-mode="short">ショート (15-30秒)</button>
                <button class="btn-toggle ${timeMode === 'normal' ? 'active' : ''}" data-mode="normal">ノーマル (30-60秒)</button>
                <button class="btn-toggle ${timeMode === 'long' ? 'active' : ''}" data-mode="long">ロング (60-100秒)</button>
              </div>
            </div>
          ` : ''}

          <div class="bomb-controls">
            ${!isRunning ? `
              <button class="btn btn-danger btn-lg btn-block" id="btn-start-bomb">
                <span>爆弾スタート！</span> 🔥
              </button>
            ` : `
              <button class="btn btn-warning btn-lg btn-block pulse-scale" id="btn-pass-bomb">
                <span>答えた！次へパス (タップ) ➔</span>
              </button>
              <button class="btn btn-secondary btn-sm btn-block mt-2" id="btn-stop-bomb">
                強制停止（リセット）
              </button>
            `}
          </div>
        </div>
      `;

      container.querySelector("#btn-next-topic").addEventListener("click", () => {
        Sound.playClick();
        currentTopic = getRandomTopic();
        render();
      });

      if (!isRunning) {
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
          if (rallyCount % 5 === 0) {
            Toast.info(`🔥 ラリー ${rallyCount} 回突破！加速中！`);
          }
        });

        container.querySelector("#btn-stop-bomb").addEventListener("click", resetBomb);
      }
    }

    function startBomb() {
      Sound.playSelect();
      isRunning = true;
      rallyCount = 0;

      let minS = 30, maxS = 60;
      if (timeMode === "short") { minS = 15; maxS = 30; }
      else if (timeMode === "long") { minS = 60; maxS = 100; }

      const totalSeconds = Math.floor(Math.random() * (maxS - minS)) + minS;
      const endTime = Date.now() + totalSeconds * 1000;

      render();

      const bombVisual = container.querySelector("#bomb-visual");
      const sparkEl = container.querySelector("#bomb-spark");
      if (bombVisual) bombVisual.classList.add("ticking");
      if (sparkEl) sparkEl.classList.remove("hidden");

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

        if (bombVisual) {
          if (isUrgent) {
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
      if (GameTimer.activeTimer && GameTimer.activeTimer.gameId === "bomb-timer") {
        GameTimer.activeTimer = null;
      }
      if (tickId) safeClearTimeout(tickId);
      Sound.playExplosion();
      if (typeof window !== "undefined" && window.StampRally) {
        window.StampRally.markPlayed("bomb-timer");
      }
      render();

      const bombVisual = container.querySelector("#bomb-visual");
      const statusEl = container.querySelector("#bomb-status");
      if (bombVisual) {
        bombVisual.className = "bomb-visual exploded";
        bombVisual.querySelector(".bomb-emoji").textContent = "💥";
      }
      if (statusEl) {
        statusEl.innerHTML = `<strong class="text-danger-lg">ドッカーン！！！</strong><br>ラリー記録: <strong>${rallyCount}</strong> 回！<br>今スマホを持っていた人の負け！罰ゲーム！`;
      }
    }

    function resetBomb() {
      isRunning = false;
      if (GameTimer.activeTimer && GameTimer.activeTimer.gameId === "bomb-timer") {
        GameTimer.activeTimer = null;
      }
      if (tickId) safeClearTimeout(tickId);
      render();
    }

    render();
    return () => {
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

    function shuffle() {
      for (let i = presets.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [presets[i], presets[j]] = [presets[j], presets[i]];
      }
      currentIndex = 0;
    }

    shuffle();

    const kataTimer = new GameTimer({
      totalSeconds: 60,
      tickSoundInterval: 10,
      title: "カタカナーシ",
      gameId: "katakana-ban",
      onTick: (rem) => {
        const badge = container.querySelector(".timer-badge-sm");
        if (badge) {
          badge.textContent = `⏱️ ${rem}秒`;
          badge.className = `timer-badge-sm ${rem <= 10 && kataTimer.isRunning ? 'pulse-red' : ''}`;
        }
      },
      onFinish: () => {
        Sound.playExplosion();
        Toast.info(`タイムアップ！ 最終スコア: ${score} 点！`);
        updateTimerBtn();
      }
    });

    function updateTimerBtn() {
      const btn = container.querySelector("#btn-kata-timer");
      if (btn) {
        btn.textContent = kataTimer.isRunning ? 'タイマー一時停止' : `タイマースタート (${kataTimer.remaining}秒)`;
      }
      const badge = container.querySelector(".timer-badge-sm");
      if (badge) {
        badge.textContent = `⏱️ ${kataTimer.remaining}秒`;
        badge.className = `timer-badge-sm ${kataTimer.remaining <= 10 && kataTimer.isRunning ? 'pulse-red' : ''}`;
      }
    }

    function render() {
      const item = presets[currentIndex] || { word: "終了！", hint: "すべてのお題が終わりました" };
      const displayWord = item.word || item.text || "お題";
      const displayHint = item.hint || "カタカナ語を使わずに特徴や用途を説明しよう！";
      container.innerHTML = `
        <div class="tool-card text-center katakana-card">
          <div class="card-header-flex">
            <span class="score-badge">🏆 正解数: <strong>${score}</strong></span>
            <span class="timer-badge-sm ${kataTimer.remaining <= 10 && kataTimer.isRunning ? 'pulse-red' : ''}">⏱️ ${kataTimer.remaining}秒</span>
          </div>

          <div class="katakana-word-box">
            <div class="katakana-tag">🈲 カタカナを使わずに説明！</div>
            <div class="katakana-target-word">${escapeHTML(displayWord)}</div>
            <div class="katakana-subhint">※例: 「${escapeHTML(displayHint)}」</div>
          </div>

          <div class="tool-btn-grid">
            <button class="btn btn-success btn-lg" id="btn-kata-correct">⭕ 正解！ (+1点)</button>
            <button class="btn btn-danger btn-lg" id="btn-kata-fail">❌ カタカナ言った！</button>
            <button class="btn btn-outline" id="btn-kata-pass">パス ➔</button>
          </div>

          <div class="timer-controls mt-3">
            <button class="btn btn-secondary btn-sm" id="btn-kata-timer">
              ${kataTimer.isRunning ? 'タイマー一時停止' : `タイマースタート (${kataTimer.remaining}秒)`}
            </button>
            <button class="btn btn-outline btn-sm" id="btn-kata-reset">リセット</button>
          </div>
        </div>
      `;

      container.querySelector("#btn-kata-correct").addEventListener("click", () => {
        Sound.playCorrect();
        score++;
        if (typeof window !== "undefined" && window.StampRally) {
          window.StampRally.markPlayed("katakana-ban");
        }
        Toast.success(`正解！ 現在 ${score} 点！`);
        nextWord();
      });

      container.querySelector("#btn-kata-fail").addEventListener("click", () => {
        Sound.playWrong();
        if (typeof window !== "undefined" && window.StampRally) {
          window.StampRally.markPlayed("katakana-ban");
        }
        Toast.warning("アウト！カタカナを言っちゃいました！");
        nextWord();
      });

      container.querySelector("#btn-kata-pass").addEventListener("click", () => {
        Sound.playClick();
        nextWord();
      });

      container.querySelector("#btn-kata-timer").addEventListener("click", () => {
        Sound.playClick();
        kataTimer.toggle();
        updateTimerBtn();
      });

      container.querySelector("#btn-kata-reset").addEventListener("click", () => {
        Sound.playClick();
        kataTimer.reset(60);
        score = 0;
        shuffle();
        render();
      });
    }

    function nextWord() {
      currentIndex = (currentIndex + 1) % presets.length;
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
  renderFingerRoulette(container) {
    container.innerHTML = `
      <div class="finger-roulette-container" id="touch-area">
        <div class="roulette-overlay" id="roulette-overlay">
          <div class="roulette-title">👆 画面にみんなで指を置いてね！</div>
          <div class="roulette-desc">マルチタッチ対応（スマホ）/ クリックでも抽選OK（PC）</div>
          <div class="roulette-mode-select">
            <span>選ぶ人数: </span>
            <button class="btn-pill active" data-pick="1">1人選ぶ</button>
            <button class="btn-pill" data-pick="2">2人選ぶ</button>
          </div>
        </div>
        <canvas id="roulette-canvas"></canvas>
      </div>
    `;

    const area = container.querySelector("#touch-area");
    const canvas = container.querySelector("#roulette-canvas");
    const ctx = canvas.getContext("2d");
    const overlay = container.querySelector("#roulette-overlay");

    let pickCount = 1;
    let touches = new Map();
    let state = "waiting";
    let countdownTimer = null;
    let winnerIds = [];
    let rafId = null;

    const colors = [
      "#FF5A5F", "#48BB78", "#4299E1", "#ECC94B", "#9F7AEA", "#ED64A6", "#38B2AC", "#FF9800"
    ];

    container.querySelectorAll(".btn-pill").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        Sound.playClick();
        container.querySelectorAll(".btn-pill").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        pickCount = parseInt(btn.dataset.pick);
      });
    });

    function resize() {
      if (canvas && area) {
        canvas.width = area.clientWidth || 300;
        canvas.height = area.clientHeight || 400;
      }
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      touches.forEach((touch, id) => {
        const isWinner = winnerIds.includes(id);
        const radius = isWinner ? 75 : 55;

        ctx.beginPath();
        ctx.arc(touch.x, touch.y, radius + 15 * Math.sin(Date.now() / 150), 0, Math.PI * 2);
        ctx.strokeStyle = touch.color + "66";
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(touch.x, touch.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isWinner ? "#FFD700" : touch.color;
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#FFFFFF";
        ctx.stroke();

        ctx.fillStyle = "#FFFFFF";
        ctx.font = isWinner ? "bold 32px sans-serif" : "24px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(isWinner ? "👑" : "👆", touch.x, touch.y);
      });

      rafId = requestAnimationFrame(draw);
    }
    draw();

    function handleTouchChange(e) {
      e.preventDefault();
      if (state === "decided") {
        if (e.touches.length === 0) {
          state = "waiting";
          winnerIds = [];
          overlay.classList.remove("hidden");
        }
        return;
      }

      touches.clear();
      for (let i = 0; i < e.touches.length; i++) {
        const t = e.touches[i];
        const rect = canvas.getBoundingClientRect();
        const id = t.identifier;
        touches.set(id, {
          x: t.clientX - rect.left,
          y: t.clientY - rect.top,
          color: colors[id % colors.length]
        });
      }

      if (touches.size >= 2 && state === "waiting") {
        overlay.classList.add("hidden");
        startCountdown();
      } else if (touches.size < 2 && state === "counting") {
        if (countdownTimer) safeClearTimeout(countdownTimer);
        state = "waiting";
      }
    }

    function startCountdown() {
      state = "counting";
      Sound.playTick(600);

      countdownTimer = safeSetTimeout(() => {
        if (touches.size >= 2) {
          decideWinner();
        } else {
          state = "waiting";
        }
      }, 2500);
    }

    function decideWinner() {
      state = "decided";
      const ids = Array.from(touches.keys());
      winnerIds = [];
      const count = Math.min(pickCount, ids.length);
      while (winnerIds.length < count) {
        const randId = ids[Math.floor(Math.random() * ids.length)];
        if (!winnerIds.includes(randId)) winnerIds.push(randId);
      }
      Sound.playFanfare();
      Confetti.burst(60);
      Toast.success("決定しました！！👑");
      if (typeof window !== "undefined" && window.StampRally) {
        window.StampRally.markPlayed("finger-roulette");
      }
    }

    // PC / マウスクリックサポート（クリックで指アイコンを配置＆抽選）
    function handleMouseClick(e) {
      if (e.target && e.target.closest && e.target.closest(".roulette-mode-select")) return;
      if (state === "decided") {
        state = "waiting";
        winnerIds = [];
        touches.clear();
        overlay.classList.remove("hidden");
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // 既存ポイントの近くをクリックした場合は削除、それ以外は追加
      let removed = false;
      for (const [id, t] of touches.entries()) {
        if (Math.hypot(t.x - x, t.y - y) < 45) {
          touches.delete(id);
          removed = true;
          break;
        }
      }
      if (!removed && touches.size < 8) {
        const id = "mouse_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4);
        touches.set(id, {
          x,
          y,
          color: colors[touches.size % colors.length]
        });
        Sound.playClick();
      }

      if (touches.size >= 2 && state === "waiting") {
        overlay.classList.add("hidden");
        startCountdown();
      } else if (touches.size < 2 && state === "counting") {
        if (countdownTimer) safeClearTimeout(countdownTimer);
        state = "waiting";
      }
    }

    area.addEventListener("click", handleMouseClick);
    area.addEventListener("touchstart", handleTouchChange, { passive: false });
    area.addEventListener("touchmove", handleTouchChange, { passive: false });
    area.addEventListener("touchend", handleTouchChange, { passive: false });
    area.addEventListener("touchcancel", handleTouchChange, { passive: false });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (countdownTimer) safeClearTimeout(countdownTimer);
      window.removeEventListener("resize", resize);
      area.removeEventListener("click", handleMouseClick);
      area.removeEventListener("touchstart", handleTouchChange);
      area.removeEventListener("touchmove", handleTouchChange);
      area.removeEventListener("touchend", handleTouchChange);
      area.removeEventListener("touchcancel", handleTouchChange);
    };
  },

  // ===================================================
  // 5. 究極の2択 ＆ トークガチャ
  // ===================================================
  renderTwoChoices(container, game) {
    let currentItem = drawShuffledTopic(game.id, game.presets);
    let state = {
      votesA: 0,
      votesB: 0,
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
          updateCountdownDisplay("どん！👉");
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

      container.innerHTML = `
        <div class="tool-card text-center two-choice-card">
          <div class="two-choice-header">⚖️ あなたならどっちを選ぶ！？</div>

          <div class="two-choice-options my-3">
            <div class="choice-box choice-a" id="choice-a">
              <span class="choice-label">A</span>
              <div class="choice-content">${escapeHTML(aText)}</div>
            </div>
            <div class="vs-divider">VS</div>
            <div class="choice-box choice-b" id="choice-b">
              <span class="choice-label">B</span>
              <div class="choice-content">${escapeHTML(bText)}</div>
            </div>
          </div>

          <!-- せーので判定カウントダウン -->
          <div class="my-3 p-3 rounded border" style="background: rgba(0,0,0,0.02);">
            <div id="choice-countdown-box" style="min-height: 38px; display: flex; align-items: center; justify-content: center;">
              <span class="text-xs font-bold text-muted">「せーの」で全員一斉に指差し！</span>
            </div>
            <button class="btn btn-warning btn-block btn-lg font-bold mt-2" id="btn-choice-countdown">
              📢 せーので判定！ (3・2・1・どん！)
            </button>
          </div>

          <!-- 多数決集計バー -->
          <div class="my-3 p-3 rounded border text-left" style="background: rgba(0,0,0,0.02);">
            <div class="flex justify-between items-center text-xs font-bold text-muted mb-2">
              <span>📊 多数決集計 (合計: ${totalVotes}票)</span>
              ${totalVotes > 0 ? `<span class="badge badge-info">${pctA}% vs ${pctB}%</span>` : ''}
            </div>

            <div style="height: 12px; border-radius: 6px; background: #e5e7eb; overflow: hidden; display: flex;" class="mb-2">
              <div style="width: ${totalVotes > 0 ? pctA : 50}%; background: #3b82f6; transition: width 0.3s;"></div>
              <div style="width: ${totalVotes > 0 ? pctB : 50}%; background: #ef4444; transition: width 0.3s;"></div>
            </div>

            <div class="flex justify-between items-center text-xs">
              <div class="flex items-center gap-1">
                <span class="font-bold text-primary">A: ${state.votesA}票</span>
                <button class="btn btn-xs btn-outline" id="btn-vote-a-minus">-</button>
                <button class="btn btn-xs btn-primary" id="btn-vote-a-plus">+</button>
              </div>
              <div class="flex items-center gap-1">
                <button class="btn btn-xs btn-outline" id="btn-vote-b-minus">-</button>
                <button class="btn btn-xs btn-danger" id="btn-vote-b-plus">+</button>
                <span class="font-bold text-danger">B: ${state.votesB}票</span>
              </div>
            </div>
          </div>

          <button class="btn btn-primary btn-lg btn-block mt-3" id="btn-next-choice">
            <span>次の究極の2択を引く</span> ➔
          </button>
        </div>
      `;

      container.querySelector("#choice-a").addEventListener("click", () => {
        Sound.playSelect();
        container.querySelector("#choice-a").classList.toggle("selected");
      });
      container.querySelector("#choice-b").addEventListener("click", () => {
        Sound.playSelect();
        container.querySelector("#choice-b").classList.toggle("selected");
      });

      container.querySelector("#btn-choice-countdown").addEventListener("click", () => {
        startCountdown();
      });

      container.querySelector("#btn-vote-a-plus").addEventListener("click", () => {
        Sound.playClick();
        state.votesA++;
        render();
      });
      container.querySelector("#btn-vote-a-minus").addEventListener("click", () => {
        if (state.votesA > 0) {
          Sound.playClick();
          state.votesA--;
          render();
        }
      });
      container.querySelector("#btn-vote-b-plus").addEventListener("click", () => {
        Sound.playClick();
        state.votesB++;
        render();
      });
      container.querySelector("#btn-vote-b-minus").addEventListener("click", () => {
        if (state.votesB > 0) {
          Sound.playClick();
          state.votesB--;
          render();
        }
      });

      container.querySelector("#btn-next-choice").addEventListener("click", () => {
        Sound.playClick();
        currentItem = drawShuffledTopic(game.id, game.presets);
        state.votesA = 0;
        state.votesB = 0;
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
  // ===================================================
  // 6. ウミガメのスープ (水平思考クイズ)
  // ===================================================
  renderSeaTurtle(container, game) {
    let presets = getActiveTopicsForGame(game.id, game.presets);
    let currentIndex = 0;
    let showAnswer = false;
    let openedHints = new Set(); // 開いたヒントのインデックス

    function render() {
      const q = presets[currentIndex] || { title: "お題なし", question: "お題がありません", hints: [], answer: "" };
      const hintsList = Array.isArray(q.hints) ? q.hints : (q.hint ? [q.hint] : []);

      container.innerHTML = `
        <div class="tool-card sea-turtle-card">
          <div class="card-header-flex">
            <span class="puzzle-num">問題 ${currentIndex + 1} / ${presets.length}</span>
            <div class="nav-btn-group">
              <button class="btn btn-sm btn-outline" id="btn-prev-q">◀ 前へ</button>
              <button class="btn btn-sm btn-outline" id="btn-next-q">次へ ▶</button>
            </div>
          </div>

          <h3 class="puzzle-title">${escapeHTML(q.title || "謎のスープ")}</h3>
          <div class="puzzle-question-box">
            <p>${escapeHTML(q.question)}</p>
          </div>

          <div class="puzzle-action-box">
            <p class="puzzle-tip">出題者に「YES」「NO」「関係ありません」で答えられる質問をしよう！</p>

            <!-- 出題者用レスポンス・効果音ボタン -->
            <div class="gm-sound-response-bar my-3">
              <span class="field-label">📢 出題者リアクション効果音:</span>
              <div class="gm-sound-btn-grid mt-2">
                <button class="btn btn-success btn-sm" id="btn-ans-yes">⭕ YES！</button>
                <button class="btn btn-danger btn-sm" id="btn-ans-no">❌ NO…</button>
                <button class="btn btn-secondary btn-sm" id="btn-ans-na">❓ 関係なし</button>
                <button class="btn btn-warning btn-sm" id="btn-ans-good">✨ 鋭い質問！</button>
              </div>
            </div>

            <!-- 段階的ヒント（出題者アシスト） -->
            ${hintsList.length > 0 ? `
              <div class="phased-hints-section my-3">
                <span class="field-label">💡 段階的ヒント（詰まったら出題者が公開）:</span>
                <div class="phased-hints-list mt-2">
                  ${hintsList.map((h, hIdx) => {
                    const isOpen = openedHints.has(hIdx);
                    return `
                      <div class="phased-hint-item ${isOpen ? 'is-open' : ''}">
                        <button class="btn-phased-hint-toggle" data-hidx="${hIdx}">
                          <span>${isOpen ? '🔓' : '🔒'} ヒント ${hIdx + 1} ${isOpen ? '（公開中）' : 'を見る'}</span>
                          <span class="hint-arrow">${isOpen ? '▼' : '▶'}</span>
                        </button>
                        ${isOpen ? `<div class="phased-hint-content"><p>${escapeHTML(h)}</p></div>` : ''}
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            ` : ''}

            <div class="btn-group-row mt-3">
              <button class="btn btn-warning btn-block" id="btn-toggle-answer">
                ${showAnswer ? '解答を隠す 🔒' : '💡 出題者用：真相（解答）を見る'}
              </button>
            </div>
          </div>

          <div class="puzzle-answer-box ${showAnswer ? '' : 'hidden'}" id="answer-box">
            <span class="answer-label">【真相】</span>
            <p>${escapeHTML(q.answer)}</p>
          </div>
        </div>
      `;

      // サウンドボタン
      container.querySelector("#btn-ans-yes").addEventListener("click", () => {
        Sound.playCorrect();
        Toast.success("⭕ YES！");
      });
      container.querySelector("#btn-ans-no").addEventListener("click", () => {
        Sound.playWrong();
        Toast.warning("❌ NO（違います）");
      });
      container.querySelector("#btn-ans-na").addEventListener("click", () => {
        Sound.playTick(500);
        Toast.info("❓ 関係ありません");
      });
      container.querySelector("#btn-ans-good").addEventListener("click", () => {
        Sound.playFanfare();
        Toast.success("✨ 鋭い質問です！！真相に近づいています！");
      });

      // 段階的ヒントの開閉
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

      container.querySelector("#btn-prev-q").addEventListener("click", () => {
        Sound.playClick();
        currentIndex = (currentIndex - 1 + presets.length) % presets.length;
        showAnswer = false;
        openedHints.clear();
        render();
      });

      container.querySelector("#btn-next-q").addEventListener("click", () => {
        Sound.playClick();
        currentIndex = (currentIndex + 1) % presets.length;
        showAnswer = false;
        openedHints.clear();
        render();
      });
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
    let scores = [];

    function render() {
      let timeText = "00.00";
      let message = "";
      let diff = 0;

      if (state === "stopped") {
        const elapsed = (stopTime - startTime) / 1000;
        timeText = elapsed.toFixed(2);
        diff = Math.abs(elapsed - targetTime);

        if (diff === 0.00) {
          message = "🎉 神降臨！奇跡のジャスト！！";
          Confetti.burst(120);
        } else if (diff <= 0.20) {
          message = "🔥 凄すぎる！超絶プロフェッショナル！";
          Confetti.burst(50);
        } else if (diff <= 0.50) {
          message = "✨ かなり惜しい！グッド感覚！";
        } else {
          message = "🤣 全然違う！体内時計狂ってます！罰ゲーム確定！";
        }
      }

      container.innerHTML = `
        <div class="tool-card text-center ten-sec-card">
          <h3 class="tool-title">⏱️ ジャスト対決</h3>

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

          ${state === 'stopped' ? `<div class="stopwatch-result-msg">${message}</div>` : ''}

          <div class="stopwatch-actions">
            ${state === 'ready' || state === 'stopped' ? `
              <button class="btn btn-primary btn-lg btn-block" id="btn-sw-start">スタート！ 🚀</button>
            ` : `
              <button class="btn btn-danger btn-lg btn-block pulse-scale" id="btn-sw-stop">ストップ！ 🛑</button>
            `}
          </div>

          ${scores.length > 0 ? `
            <div class="scores-history-list mt-3">
              <span class="field-label">直近の記録:</span>
              <div class="score-chips">
                ${scores.map(s => `<span class="score-chip">${s}秒</span>`).join('')}
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
          render();
        });
      });

      if (state === "ready" || state === "stopped") {
        container.querySelector("#btn-sw-start").addEventListener("click", () => {
          Sound.playSelect();
          state = "running";
          startTime = performance.now();
          render();
        });
      } else {
        container.querySelector("#btn-sw-stop").addEventListener("click", () => {
          stopTime = performance.now();
          state = "stopped";
          const elapsed = (stopTime - startTime) / 1000;
          scores.unshift(elapsed.toFixed(2));
          if (scores.length > 5) scores.pop();

          if (Math.abs(elapsed - targetTime) <= 0.3) Sound.playFanfare();
          else Sound.playExplosion();
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

    let currentItem = drawGachaItem("all");

    let choiceState = {
      item: twoChoicesPresets[0] || { a: "選択肢A", b: "選択肢B" },
      countdown: -1,
      countdownInterval: null,
      votesA: 0,
      votesB: 0
    };

    function drawChoiceItem() {
      const rand = twoChoicesPresets[Math.floor(Math.random() * twoChoicesPresets.length)];
      choiceState.item = rand || { a: "選択肢A", b: "選択肢B" };
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
          <div class="flex justify-between items-center mb-3">
            <h3 class="tool-title" style="margin:0;">💬 トークガチャ ＆ 究極の2択</h3>
            <div class="btn-toggle-group">
              <button class="btn-toggle btn-sm ${mode === 'gacha' ? 'active' : ''}" data-talkmode="gacha">💬 質問ガチャ</button>
              <button class="btn-toggle btn-sm ${mode === 'choices' ? 'active' : ''}" data-talkmode="choices">⚖️ 究極の2択</button>
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
              <span>質問ガチャを回す！</span> 🎲
            </button>
          ` : `
            <div class="two-choices-box my-3">
              <span class="badge badge-warning text-xs font-black">⚖️ 究極の2択</span>
              <div class="grid grid-cols-2 gap-2 my-3">
                <div class="p-3 border rounded text-center choice-opt-a" style="background: rgba(59,130,246,0.08); border-color: rgba(59,130,246,0.4);">
                  <span class="font-black text-xs text-primary">A</span>
                  <div class="font-bold text-sm my-2">${escapeHTML(choiceState.item.a)}</div>
                  <button class="btn btn-xs btn-outline" id="btn-vote-a">👍 投票 (${choiceState.votesA})</button>
                </div>
                <div class="p-3 border rounded text-center choice-opt-b" style="background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.4);">
                  <span class="font-black text-xs text-danger">B</span>
                  <div class="font-bold text-sm my-2">${escapeHTML(choiceState.item.b)}</div>
                  <button class="btn btn-xs btn-outline" id="btn-vote-b">👍 投票 (${choiceState.votesB})</button>
                </div>
              </div>

              <div class="countdown-display my-2">
                ${choiceState.countdown > 0 ? `
                  <div class="font-black text-3xl text-primary animate-scale">${choiceState.countdown}</div>
                ` : choiceState.countdown === 0 ? `
                  <div class="font-black text-xl text-danger animate-scale">せーの、どん！👉</div>
                ` : `
                  <div class="text-xs text-muted">「せーの！」で選んだ方を一斉に指差そう！</div>
                `}
              </div>

              <div class="flex gap-2 mt-3">
                <button class="btn btn-primary flex-1 font-bold" id="btn-choice-countdown">
                  ⏱️ せーの！でカウント
                </button>
                <button class="btn btn-outline" id="btn-choice-next">次の2択 🎲</button>
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
      p1Word: "",
      p2Word: "",
      duelTimerSec: 180,
      duelTimerRunning: false,
      duelTimerInterval: null,
      winner: null,
      gachaCount: 4,
      gachaWords: []
    };

    function pickRandomWord() {
      const item = drawShuffledTopic(game.id, presets);
      return extractTopicText(item) || "マジで / やばい / それな";
    }

    function initDuel() {
      state.p1Word = pickRandomWord();
      state.p2Word = pickRandomWord();
      while (state.p2Word === state.p1Word && presets.length > 1) {
        state.p2Word = pickRandomWord();
      }
      state.duelTimerSec = 180;
      state.winner = null;
    }
    initDuel();

    function initGacha() {
      state.gachaWords = [];
      DeckManager.reset(game.id);
      for (let i = 0; i < state.gachaCount; i++) {
        state.gachaWords.push({
          player: `プレイヤー ${i + 1}`,
          word: pickRandomWord(),
          revealed: true
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
          Sound.playFanfare();
          Toast.success("⏰ 制限時間終了！生き残ったプレイヤーの引き分け勝利！");
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
        btn.textContent = state.duelTimerRunning ? "⏸️ 一時停止" : "▶️ スタート";
        btn.className = state.duelTimerRunning ? "btn btn-xs btn-warning" : "btn btn-xs btn-primary";
      }
    }

    function render() {
      container.innerHTML = `
        <div class="tool-card text-center p-2">
          <div class="flex justify-between items-center mb-2">
            <h3 class="tool-title text-base" style="margin:0;">🚫 NGワードゲーム</h3>
            <div class="btn-toggle-group">
              <button class="btn-toggle btn-sm ${state.mode === 'duel' ? 'active' : ''}" data-ngmode="duel">👥 2人対面バトル</button>
              <button class="btn-toggle btn-sm ${state.mode === 'gacha' ? 'active' : ''}" data-ngmode="gacha">📝 複数人・お題ガチャ</button>
            </div>
          </div>

          ${state.mode === 'duel' ? `
            <div class="ng-duel-wrapper border rounded p-2" style="background: rgba(0,0,0,0.02); min-height: 440px; display: flex; flex-direction: column; justify-content: space-between;">
              <div class="poker-p2-zone border rounded p-3 text-center" style="background: rgba(239,68,68,0.06); border-color: rgba(239,68,68,0.3);">
                <div class="text-xs font-bold text-danger mb-1">PLAYER 2 (相手)</div>
                <div class="text-xs text-muted mb-1">相手(P1)に言わせるNGワード:</div>
                <div class="ng-p-word font-black text-xl text-primary my-1">${escapeHTML(state.p1Word)}</div>
                <button class="btn btn-sm btn-danger btn-block mt-2 font-bold" id="btn-p1-said">
                  💥 P1が言った！ (P2勝利)
                </button>
              </div>

              <div class="my-2 py-2 border-y text-center" style="background: rgba(0,0,0,0.03);">
                ${state.winner ? `
                  <div class="animate-scale my-1">
                    <div class="font-black text-lg text-danger">🏆 PLAYER ${state.winner} の大勝利！</div>
                    <div class="text-xs text-muted mt-1">P1のNG: [${escapeHTML(state.p1Word)}] / P2のNG: [${escapeHTML(state.p2Word)}]</div>
                    <div class="flex gap-2 mt-2">
                      <button class="btn btn-primary btn-sm flex-1 font-bold" id="btn-ng-duel-next">次の対戦 🔄</button>
                      <button class="btn btn-danger btn-sm flex-1 font-bold" id="btn-ng-batsu">🔥 敗者の罰ゲーム！</button>
                    </div>
                  </div>
                ` : `
                  <div class="flex justify-between items-center px-2">
                    <span class="text-xs font-bold text-muted">トーク制限時間:</span>
                    <span id="duel-ng-timer" class="font-black font-mono text-xl text-primary">03:00</span>
                    <div class="flex gap-1">
                      <button class="btn btn-xs btn-primary" id="btn-duel-timer-toggle">▶️ スタート</button>
                      <button class="btn btn-xs btn-outline" id="btn-duel-timer-reset">リセット</button>
                    </div>
                  </div>
                  <p class="text-xs text-muted mt-1">※相手にだけ見えるNGワードを会話で自然に誘導しよう！</p>
                `}
              </div>

              <div class="border rounded p-3 text-center" style="background: rgba(59,130,246,0.06); border-color: rgba(59,130,246,0.3);">
                <div class="text-xs font-bold text-primary mb-1">PLAYER 1 (あなた)</div>
                <div class="text-xs text-muted mb-1">相手(P2)に言わせるNGワード:</div>
                <div class="ng-p-word font-black text-xl text-danger my-1">${escapeHTML(state.p2Word)}</div>
                <button class="btn btn-sm btn-primary btn-block mt-2 font-bold" id="btn-p2-said">
                  💥 P2が言った！ (P1勝利)
                </button>
              </div>
            </div>
          ` : `
            <div class="ng-gacha-wrapper text-left p-2">
              <div class="flex justify-between items-center mb-2">
                <label class="text-xs font-bold">参加人数: <span class="badge-num">${state.gachaCount}人</span></label>
                <button class="btn btn-sm btn-primary" id="btn-gacha-reroll">全員分再抽選 🎲</button>
              </div>
              <input type="range" class="range-slider mb-3" min="2" max="8" value="${state.gachaCount}" id="range-ng-gacha-count">

              <p class="text-xs text-muted mb-2">📝 各自のお題を紙や付箋にメモして、額（おでこ）に貼り付けてスタート！</p>

              <div class="gacha-list-grid flex flex-col gap-2">
                ${state.gachaWords.map((item, idx) => `
                  <div class="p-2 border rounded flex justify-between items-center" style="background: rgba(0,0,0,0.02);">
                    <span class="font-bold text-xs">${escapeHTML(item.player)}</span>
                    <span class="font-black text-danger text-sm">${escapeHTML(item.word)}</span>
                  </div>
                `).join('')}
              </div>

              <div class="flex gap-2 mt-4">
                <button class="btn btn-secondary flex-1" id="btn-gacha-batsu">⚡ 罰ゲームルーレット</button>
              </div>
            </div>
          `}
        </div>
      `;

      container.querySelectorAll("[data-ngmode]").forEach(btn => {
        btn.onclick = () => {
          Sound.playClick();
          stopDuelTimer();
          state.mode = btn.dataset.ngmode;
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

        const btnP1Said = container.querySelector("#btn-p1-said");
        if (btnP1Said) {
          btnP1Said.onclick = () => {
            stopDuelTimer();
            Sound.playExplosion();
            Sound.hapticExplosion();
            state.winner = 2;
            if (typeof window !== "undefined" && window.StampRally) {
              window.StampRally.markPlayed("ng-word");
            }
            render();
          };
        }

        const btnP2Said = container.querySelector("#btn-p2-said");
        if (btnP2Said) {
          btnP2Said.onclick = () => {
            stopDuelTimer();
            Sound.playExplosion();
            Sound.hapticExplosion();
            state.winner = 1;
            if (typeof window !== "undefined" && window.StampRally) {
              window.StampRally.markPlayed("ng-word");
            }
            render();
          };
        }

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
        const range = container.querySelector("#range-ng-gacha-count");
        if (range) {
          range.oninput = (e) => {
            state.gachaCount = parseInt(e.target.value);
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
    let state = {
      p1Card: Math.floor(Math.random() * 13) + 1,
      p2Card: Math.floor(Math.random() * 13) + 1,
      p1Suit: ["♠️", "♥️", "♦️", "♣️"][Math.floor(Math.random() * 4)],
      p2Suit: ["♠️", "♥️", "♦️", "♣️"][Math.floor(Math.random() * 4)],
      p1Action: null,
      p2Action: null,
      isDuelRevealed: false
    };

    function resetDuel() {
      const suits = ["♠️", "♥️", "♦️", "♣️"];
      state.p1Card = Math.floor(Math.random() * 13) + 1;
      state.p2Card = Math.floor(Math.random() * 13) + 1;
      state.p1Suit = suits[Math.floor(Math.random() * 4)];
      state.p2Suit = suits[Math.floor(Math.random() * 4)];
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

    function renderCard(suit, num, isVisible) {
      if (!isVisible) {
        return `
          <div class="playing-card card-back">
            <div style="font-size:1.2rem; margin-bottom:2px;">👀</div>
            <div style="font-weight:900;">相手にだけ</div>
            <div style="font-size:0.7rem; opacity:0.9;">見えています</div>
          </div>
        `;
      }
      const isRed = suit === "♥️" || suit === "♦️";
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

    function render() {
      const p1Score = getCardScore(state.p1Card);
      const p2Score = getCardScore(state.p2Card);

      let resultText = "";
      let winner = 0;
      if (state.isDuelRevealed) {
        if (state.p1Action === "fold" && state.p2Action === "fold") {
          resultText = "両者フォールド（引き分け）";
        } else if (state.p1Action === "fold") {
          resultText = "P1が降りたため、PLAYER 2の不戦勝！🎉";
          winner = 2;
        } else if (state.p2Action === "fold") {
          resultText = "P2が降りたため、PLAYER 1の不戦勝！🎉";
          winner = 1;
        } else {
          if (p1Score > p2Score) {
            resultText = "PLAYER 1の勝利！🎉 (A最強)";
            winner = 1;
          } else if (p2Score > p1Score) {
            resultText = "PLAYER 2の勝利！🎉 (A最強)";
            winner = 2;
          } else {
            resultText = "同じ数字！引き分け！🤝";
          }
        }
      }

      container.innerHTML = `
        <div class="tool-card text-center p-2">
          <div class="flex justify-between items-center mb-1">
            <h3 class="tool-title text-base" style="margin:0;">🃏 2人対戦：対面インディアンポーカー</h3>
            <span class="badge badge-primary text-xs font-bold">2人対面特化</span>
          </div>
          <p class="text-xs text-muted mb-2">スマホを机の真ん中に置き、相手の額のカードを見ながらブラフ対決！</p>

          <div class="duel-container" style="min-height: 480px; display: flex; flex-direction: column; justify-content: space-between;">
            <div class="poker-duel-half poker-p2-zone border rounded p-2" style="background: rgba(0,0,0,0.03);">
              <div class="flex justify-between items-center mb-1">
                <span class="font-black text-xs text-danger">PLAYER 2 (相手)</span>
                <span class="badge badge-sm font-mono ${state.p2Action ? 'badge-warning' : 'badge-secondary'}">
                  ${state.p2Action === 'bet' ? '🔥 コール (勝負)' : state.p2Action === 'fold' ? '🏳️ 降りた (フォールド)' : '🤔 思考中…'}
                </span>
              </div>
              <div class="flex justify-around items-center my-1">
                <div class="text-center">
                  <div class="text-xs text-muted mb-1 font-bold">自分(P2)のカード</div>
                  ${renderCard(state.p2Suit, state.p2Card, state.isDuelRevealed)}
                </div>
                <div class="text-center">
                  <div class="text-xs text-primary mb-1 font-bold">P1のカード(見えてる)</div>
                  ${renderCard(state.p1Suit, state.p1Card, true)}
                </div>
              </div>
              ${!state.isDuelRevealed ? `
                <div class="flex gap-1 mt-1">
                  <button class="btn btn-xs flex-1 ${state.p2Action === 'bet' ? 'btn-success font-bold' : 'btn-outline'}" id="btn-p2-bet" ${state.p2Action ? 'disabled' : ''}>
                    🔥 勝負 (コール)
                  </button>
                  <button class="btn btn-xs flex-1 ${state.p2Action === 'fold' ? 'btn-danger font-bold' : 'btn-outline'}" id="btn-p2-fold" ${state.p2Action ? 'disabled' : ''}>
                    🏳️ 降りる
                  </button>
                </div>
              ` : ''}
            </div>

            <div class="poker-duel-center my-2 py-2 border-y text-center" style="background: rgba(255,90,95,0.04);">
              ${!state.isDuelRevealed ? `
                <div class="text-xs text-muted font-bold mb-1">二人のアクションが決まったらオープン！</div>
                <button class="btn btn-primary btn-block btn-lg font-bold pulse-scale" id="btn-poker-open">
                  🃏 カードオープン判定！ ➔
                </button>
              ` : `
                <div class="animate-scale">
                  <div class="font-black text-base text-primary">${resultText}</div>
                  <div class="text-xs text-sub mt-1">P1: [${state.p1Suit}${getRank(state.p1Card)}] vs P2: [${state.p2Suit}${getRank(state.p2Card)}]</div>
                  <div class="flex gap-2 mt-2">
                    <button class="btn btn-primary btn-sm flex-1 font-bold" id="btn-poker-next">次のディール 🔄</button>
                    ${winner > 0 ? `<button class="btn btn-danger btn-sm flex-1 font-bold" id="btn-poker-batsu">🔥 敗者の罰ゲーム！</button>` : ''}
                  </div>
                </div>
              `}
            </div>

            <div class="poker-duel-half poker-p1-zone border rounded p-2" style="background: rgba(0,0,0,0.03);">
              <div class="flex justify-between items-center mb-1">
                <span class="font-black text-xs text-primary">PLAYER 1 (あなた)</span>
                <span class="badge badge-sm font-mono ${state.p1Action ? 'badge-warning' : 'badge-secondary'}">
                  ${state.p1Action === 'bet' ? '🔥 コール (勝負)' : state.p1Action === 'fold' ? '🏳️ 降りた (フォールド)' : '🤔 思考中…'}
                </span>
              </div>
              <div class="flex justify-around items-center my-1">
                <div class="text-center">
                  <div class="text-xs text-muted mb-1 font-bold">自分(P1)のカード</div>
                  ${renderCard(state.p1Suit, state.p1Card, state.isDuelRevealed)}
                </div>
                <div class="text-center">
                  <div class="text-xs text-danger mb-1 font-bold">P2のカード(見えてる)</div>
                  ${renderCard(state.p2Suit, state.p2Card, true)}
                </div>
              </div>
              ${!state.isDuelRevealed ? `
                <div class="flex gap-1 mt-1">
                  <button class="btn btn-xs flex-1 ${state.p1Action === 'bet' ? 'btn-success font-bold' : 'btn-outline'}" id="btn-p1-bet" ${state.p1Action ? 'disabled' : ''}>
                    🔥 勝負 (コール)
                  </button>
                  <button class="btn btn-xs flex-1 ${state.p1Action === 'fold' ? 'btn-danger font-bold' : 'btn-outline'}" id="btn-p1-fold" ${state.p1Action ? 'disabled' : ''}>
                    🏳️ 降りる
                  </button>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;

      const btnP2Bet = container.querySelector("#btn-p2-bet");
      if (btnP2Bet) btnP2Bet.onclick = () => { Sound.playClick(); state.p2Action = "bet"; render(); };

      const btnP2Fold = container.querySelector("#btn-p2-fold");
      if (btnP2Fold) btnP2Fold.onclick = () => { Sound.playClick(); state.p2Action = "fold"; render(); };

      const btnP1Bet = container.querySelector("#btn-p1-bet");
      if (btnP1Bet) btnP1Bet.onclick = () => { Sound.playClick(); state.p1Action = "bet"; render(); };

      const btnP1Fold = container.querySelector("#btn-p1-fold");
      if (btnP1Fold) btnP1Fold.onclick = () => { Sound.playClick(); state.p1Action = "fold"; render(); };

      const btnOpen = container.querySelector("#btn-poker-open");
      if (btnOpen) {
        btnOpen.onclick = () => {
          Sound.playFanfare();
          if (typeof Confetti !== "undefined") Confetti.burst(60);
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
  renderOneNightWerewolf(container) {
    let state = {
      playerCount: 4,
      step: "setup", // setup, confirm, night, talk, vote, result
      players: [],
      centerCards: [],
      currentPlayerIdx: 0,
      seerAction: null,
      robberAction: null,
      timerSec: 180,
      timerInterval: null
    };

    const ROLE_DEFS = {
      villager: { name: "村人", icon: "👤", team: "villager", desc: "特殊能力はありません。昼の議論で人狼を見破ろう！" },
      werewolf: { name: "人狼", icon: "🐺", team: "werewolf", desc: "村人を騙せ！仲間がいれば夜にお互いを確認できます。" },
      seer: { name: "占い師", icon: "🔮", team: "villager", desc: "夜に他のプレイヤー1人、または墓地のカード2枚を見られます。" },
      robber: { name: "怪盗", icon: "🎭", team: "villager", desc: "夜に他のプレイヤー1人と自分の役職をこっそり交換できます。" }
    };

    function update() {
      if (state.step === "setup") {
        container.innerHTML = `
          <div class="tool-card">
            <h3 class="tool-title">🌕 ワンナイト人狼 設定</h3>
            <div class="setting-group">
              <label class="setting-label">参加人数: <span id="val-ww-players" class="badge-num">${state.playerCount}人</span></label>
              <input type="range" class="range-slider" min="3" max="6" value="${state.playerCount}" id="range-ww-players">
            </div>

            <div class="topic-box mb-3 text-left">
              <span class="topic-tag">📋 使用される役職カード (${state.playerCount + 2}枚)</span>
              <div class="mt-2 text-sm">
                🐺 人狼 2枚 / 🔮 占い師 1枚 / 🎭 怪盗 1枚 / 👤 村人 ${state.playerCount - 2}枚<br>
                <span class="text-sub">※2枚は「墓地（中央）」に伏せられます。誰も人狼にならない平和村の可能性も！？</span>
              </div>
            </div>

            <button class="btn btn-primary btn-block btn-lg" id="btn-start-ww">
              <span>夜の役職を配る</span> ➔
            </button>
          </div>
        `;

        const range = container.querySelector("#range-ww-players");
        range.addEventListener("input", (e) => {
          state.playerCount = parseInt(e.target.value);
          container.querySelector("#val-ww-players").textContent = `${state.playerCount}人`;
        });

        container.querySelector("#btn-start-ww").addEventListener("click", () => {
          Sound.playSelect();
          // デッキ構築
          const deck = ["werewolf", "werewolf", "seer", "robber"];
          for (let i = 0; i < state.playerCount - 2; i++) {
            deck.push("villager");
          }
          // シャッフル
          for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
          }

          state.players = [];
          for (let i = 0; i < state.playerCount; i++) {
            state.players.push({
              id: i + 1,
              name: `プレイヤー ${i + 1}`,
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
            <h3 class="player-turn-title">📱 ${escapeHTML(p.name)} さん</h3>
            <p class="pass-desc">スマホを受け取ったら、下のボタンをタップして自分の役職を確認してください。</p>

            <div class="secret-box-wrapper">
              <button class="btn btn-secret" id="btn-reveal-role">
                <span class="secret-icon">🔒</span>
                <span class="secret-text">タップして役職を見る</span>
              </button>
              <div class="secret-word-card hidden" id="secret-role-card">
                <span class="word-category">${role.name}</span>
                <div class="the-word">${role.icon} ${role.name}</div>
                <p class="word-caution">${role.desc}</p>
                ${p.initialRole === 'werewolf' ? `
                  <div class="mt-2 text-sm font-bold">
                    ${state.players.filter(x => x.id !== p.id && x.initialRole === 'werewolf').length > 0
                      ? `🐺 仲間の人狼: ${state.players.filter(x => x.id !== p.id && x.initialRole === 'werewolf').map(x => x.name).join(', ')}`
                      : '🐺 あなたは【孤独な人狼】です（仲間はいません）'}
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- 役職固有のアクション -->
            <div class="role-action-section hidden mt-3" id="role-action-section">
              ${p.initialRole === 'seer' ? `
                <div class="seer-action-box">
                  <span class="field-label">🔮 占いのアクション（どちらか1つを選択）:</span>
                  <div class="mt-2 text-left">
                    <p class="text-xs text-sub mb-1">【① 他のプレイヤー1人を占う】</p>
                    <div class="btn-group-row flex-wrap mb-2">
                      ${state.players.filter(x => x.id !== p.id).map(x => `
                        <button class="btn btn-outline btn-xs btn-seer-target" data-target="${x.id}">${escapeHTML(x.name)}</button>
                      `).join('')}
                    </div>
                    <p class="text-xs text-sub mb-1">【② 墓地（中央の2枚）を占う】</p>
                    <button class="btn btn-outline btn-xs btn-block" id="btn-seer-center">中央の2枚を見る</button>
                  </div>
                  <div id="seer-result-area" class="mt-2 font-bold text-primary"></div>
                </div>
              ` : ''}

              ${p.initialRole === 'robber' ? `
                <div class="robber-action-box">
                  <span class="field-label">🎭 怪盗のアクション (誰かと役職を交換):</span>
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
              ${state.currentPlayerIdx + 1 < state.playerCount ? '確認完了！次の人へ ➔' : '全員完了！朝の議論を始める ☀️'}
            </button>
          </div>
        `;

        const btnReveal = container.querySelector("#btn-reveal-role");
        const cardRole = container.querySelector("#secret-role-card");
        const actionSec = container.querySelector("#role-action-section");
        const btnNext = container.querySelector("#btn-next-ww-player");

        btnReveal.addEventListener("click", () => {
          // 夜フェーズは役職が周囲にバレないよう消音（バイブレーションのみ）
          if (typeof Sound !== "undefined" && typeof Sound.hapticLight === "function") {
            Sound.hapticLight();
          }
          btnReveal.classList.add("hidden");
          cardRole.classList.remove("hidden");
          if (actionSec) actionSec.classList.remove("hidden");
          btnNext.classList.remove("hidden");

          // 役職バレ防止：村人・役職者問わず確認時間を均一化する演出
          const originalText = state.currentPlayerIdx + 1 < state.playerCount ? '確認完了！次の人へ ➔' : '全員完了！朝の議論を始める ☀️';
          btnNext.disabled = true;
          btnNext.textContent = "🤫 夜の確認中... (2秒)";
          let waitSec = 2;
          if (state.waitInterval) safeClearInterval(state.waitInterval);
          state.waitInterval = safeSetInterval(() => {
            waitSec--;
            if (waitSec > 0) {
              btnNext.textContent = `🤫 夜の確認中... (${waitSec}秒)`;
            } else {
              safeClearInterval(state.waitInterval);
              state.waitInterval = null;
              btnNext.disabled = false;
              btnNext.textContent = originalText;
            }
          }, 800);
        });

        // 占い師アクション（消音化）
        const seerResult = container.querySelector("#seer-result-area");
        container.querySelectorAll(".btn-seer-target").forEach(btn => {
          btn.addEventListener("click", () => {
            if (typeof Sound !== "undefined" && typeof Sound.hapticLight === "function") {
              Sound.hapticLight();
            }
            const targetId = parseInt(btn.dataset.target);
            const chosen = state.players.find(x => x.id === targetId);
            if (chosen) {
              seerResult.textContent = `🔮 ${chosen.name} の役職は【${ROLE_DEFS[chosen.initialRole].name}】でした！`;
              container.querySelectorAll(".btn-seer-target").forEach(b => b.disabled = true);
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
            seerResult.textContent = `🔮 墓地の2枚は【${ROLE_DEFS[state.centerCards[0]].name}】と【${ROLE_DEFS[state.centerCards[1]].name}】でした！`;
            btnSeerC.disabled = true;
            container.querySelectorAll(".btn-seer-target").forEach(b => b.disabled = true);
          });
        }

        // 怪盗アクション（消音化）
        container.querySelectorAll(".btn-rob").forEach(btn => {
          btn.addEventListener("click", () => {
            if (typeof Sound !== "undefined" && typeof Sound.hapticLight === "function") {
              Sound.hapticLight();
            }
            const targetId = parseInt(btn.dataset.target);
            const targetPlayer = state.players.find(x => x.id === targetId);
            if (targetPlayer) {
              const oldRole = targetPlayer.currentRole;
              targetPlayer.currentRole = p.currentRole;
              p.currentRole = oldRole;
              container.querySelector("#robber-result-area").textContent = `🎭 ${targetPlayer.name} と役職を交換しました！新役職: 【${ROLE_DEFS[oldRole].name}】`;
              container.querySelectorAll(".btn-rob").forEach(b => b.disabled = true);
            }
          });
        });

        btnNext.addEventListener("click", () => {
          if (typeof Sound !== "undefined" && typeof Sound.hapticLight === "function") {
            Sound.hapticLight();
          }
          if (state.currentPlayerIdx + 1 < state.playerCount) {
            state.currentPlayerIdx++;
            update();
          } else {
            Sound.playSelect(); // 朝の開始時のみ音声を再開
            state.step = "talk";
            update();
          }
        });

      } else if (state.step === "talk") {
        let remaining = state.timerSec;
        let isRunning = true;

        container.innerHTML = `
          <div class="tool-card text-center">
            <div class="timer-badge">☀️ 朝の議論タイム！</div>
            <div class="timer-display-lg" id="ww-talk-timer">${Math.floor(remaining / 60)}:00</div>
            <p class="timer-guide">夜に何が起きたかを話し合い、人狼を暴こう！（怪盗や占い師の騙りもOK）</p>

            <div class="btn-group-row">
              <button class="btn btn-secondary" id="btn-ww-toggle">一時停止</button>
              <button class="btn btn-danger" id="btn-ww-finish">議論終了＆投票へ ➔</button>
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
            Sound.playExplosion();
            Toast.info("🔔 朝の議論タイム終了！投票に移ります！");
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
            <h3 class="tool-title">🗳️ 投票フェーズ！</h3>
            <p class="vote-instruction">せーので怪しいと思う人を一斉に指差してください！</p>

            <div class="topic-box mb-3">
              <span class="topic-tag">💡 投票ルール</span>
              <div class="text-sm">
                ・最多得票の人が処刑されます（同率なら全員処刑）。<br>
                ・人狼を1人でも処刑できれば【村人チームの勝利】！<br>
                ・人狼が処刑されなければ【人狼チームの勝利】！<br>
                ・もし誰も人狼がいない場合、全員が1票ずつになる平和村投票なら【全員勝利】！
              </div>
            </div>

            <button class="btn btn-warning btn-lg btn-block" id="btn-open-ww-result">
              <span>投票完了！結果発表 ＆ 正解オープン</span> 🎉
            </button>
          </div>
        `;

        container.querySelector("#btn-open-ww-result").addEventListener("click", () => {
          Sound.playFanfare();
          Confetti.burst(80);
          state.step = "result";
          update();
        });

      } else if (state.step === "result") {
        if (typeof window !== "undefined" && window.StampRally) {
          window.StampRally.markPlayed("one-night-werewolf");
        }
        const werewolves = state.players.filter(p => p.currentRole === "werewolf");
        const hasWerewolf = werewolves.length > 0;

        container.innerHTML = `
          <div class="tool-card text-center">
            <h3 class="tool-title">🎉 最終役職オープン！</h3>

            <div class="roles-list my-3">
              ${state.players.map(p => `
                <div class="role-item ${p.currentRole === 'werewolf' ? 'is-wolf' : 'is-citizen'}">
                  <span class="role-icon">${ROLE_DEFS[p.currentRole].icon} ${ROLE_DEFS[p.currentRole].name}</span>
                  <span class="role-player">${escapeHTML(p.name)}</span>
                  <span class="role-word">${p.initialRole !== p.currentRole ? `(元: ${ROLE_DEFS[p.initialRole].name})` : ''}</span>
                </div>
              `).join('')}
            </div>

            <div class="topic-box mt-3 text-left">
              <span class="topic-tag">⚰️ 墓地（使われなかったカード）</span>
              <div class="font-bold mt-1">
                ${ROLE_DEFS[state.centerCards[0]].icon} ${ROLE_DEFS[state.centerCards[0]].name} ,
                ${ROLE_DEFS[state.centerCards[1]].icon} ${ROLE_DEFS[state.centerCards[1]].name}
              </div>
              ${!hasWerewolf ? '<div class="text-success font-bold mt-1">✨ この村には人狼がいませんでした（平和村）！</div>' : ''}
            </div>

            <button class="btn btn-primary btn-block mt-4" id="btn-restart-ww">もう一度遊ぶ 🔄</button>
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
      step: "input-kami", // input-kami (5), input-naka (7), input-shimo (5), reveal
      kami: "",
      naka: "",
      shimo: ""
    };

    function render() {
      if (state.step === "input-kami") {
        container.innerHTML = `
          <div class="tool-card text-center">
            <span class="card-badge badge-talk">📜 詠み人知らず (1人目)</span>
            <h3 class="tool-title mt-2">上の句（5文字）を入力</h3>
            <p class="text-sub text-sm mb-3">例: 「あさおきて」「すきなひと」「ねむれない」</p>

            <div class="haiku-input-box mb-3">
              <input type="text" class="decision-input" id="input-kami" placeholder="5文字程度のフレーズを入力..." maxlength="12">
            </div>

            <button class="btn btn-primary btn-block btn-lg" id="btn-submit-kami">
              <span>伏せて次の人へ渡す</span> ➔
            </button>
          </div>
        `;

        container.querySelector("#btn-submit-kami").addEventListener("click", () => {
          const val = container.querySelector("#input-kami").value.trim();
          if (val) {
            Sound.playSelect();
            state.kami = val;
            state.step = "input-naka";
            render();
          } else {
            Toast.warning("上の句を入力してください！");
          }
        });

      } else if (state.step === "input-naka") {
        container.innerHTML = `
          <div class="tool-card text-center">
            <span class="card-badge badge-talk">📜 詠み人知らず (2人目)</span>
            <h3 class="tool-title mt-2">中の句（7文字）を入力</h3>
            <p class="text-sub text-sm mb-3">前の人が書いた上の句は秘密！直感で7文字を入れてね！<br>例: 「カレーをたべて」「電車にゆられ」「全力疾走」</p>

            <div class="haiku-input-box mb-3">
              <input type="text" class="decision-input" id="input-naka" placeholder="7文字程度のフレーズを入力..." maxlength="15">
            </div>

            <button class="btn btn-primary btn-block btn-lg" id="btn-submit-naka">
              <span>伏せて次の人へ渡す</span> ➔
            </button>
          </div>
        `;

        container.querySelector("#btn-submit-naka").addEventListener("click", () => {
          const val = container.querySelector("#input-naka").value.trim();
          if (val) {
            Sound.playSelect();
            state.naka = val;
            state.step = "input-shimo";
            render();
          } else {
            Toast.warning("中の句を入力してください！");
          }
        });

      } else if (state.step === "input-shimo") {
        container.innerHTML = `
          <div class="tool-card text-center">
            <span class="card-badge badge-talk">📜 詠み人知らず (3人目)</span>
            <h3 class="tool-title mt-2">下の句（5文字・締め）を入力</h3>
            <p class="text-sub text-sm mb-3">上の句・中の句は秘密！オチとなる5文字を入れてね！<br>例: 「ふっとんだ」「ゆめでした」「ありがたや」</p>

            <div class="haiku-input-box mb-3">
              <input type="text" class="decision-input" id="input-shimo" placeholder="5文字程度のフレーズを入力..." maxlength="12">
            </div>

            <button class="btn btn-success btn-block btn-lg pulse-scale" id="btn-submit-shimo">
              <span>完成！全員でオープン！</span> 🎉
            </button>
          </div>
        `;

        container.querySelector("#btn-submit-shimo").addEventListener("click", () => {
          const val = container.querySelector("#input-shimo").value.trim();
          if (val) {
            Sound.playFanfare();
            Confetti.burst(100);
            if (typeof window !== "undefined" && window.StampRally) {
              window.StampRally.markPlayed("yomibito");
            }
            state.shimo = val;
            state.step = "reveal";
            render();
          } else {
            Toast.warning("下の句を入力してください！");
          }
        });

      } else if (state.step === "reveal") {
        const fullHaiku = `${state.kami}\n${state.naka}\n${state.shimo}`;
        container.innerHTML = `
          <div class="tool-card text-center haiku-reveal-card">
            <div class="asa-sore-banner">📜 合作の名句が完成！</div>

            <div class="haiku-scroll-display my-4">
              <div class="haiku-line kami">「 ${escapeHTML(state.kami)} 」</div>
              <div class="haiku-line naka">「 ${escapeHTML(state.naka)} 」</div>
              <div class="haiku-line shimo">「 ${escapeHTML(state.shimo)} 」</div>
            </div>

            <p class="text-sub text-sm">声に出して風流に詠み上げよう！</p>

            <div class="btn-group-row mt-3">
              <button class="btn btn-outline flex-1" id="btn-share-haiku">𝕏 でポスト</button>
              <button class="btn btn-line flex-1" id="btn-share-haiku-line">LINEで送る 💬</button>
              <button class="btn btn-primary flex-1" id="btn-restart-haiku">もう1句 🔄</button>
            </div>
          </div>
        `;

        container.querySelector("#btn-share-haiku").addEventListener("click", () => {
          Sound.playClick();
          const tweetText = `【詠み人知らず】奇跡の合作俳句が爆誕！\n\n${state.kami}\n${state.naka}\n${state.shimo}\n\n#詠み人知らず #あそびポケット\n${window.location.href}`;
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, "_blank");
        });

        container.querySelector("#btn-share-haiku-line").addEventListener("click", () => {
          Sound.playClick();
          const lineText = `【詠み人知らず】奇跡の合作俳句が爆誕！\n\n${state.kami}\n${state.naka}\n${state.shimo}\n\nあそびポケットで遊ぼう！\n${window.location.href}`;
          window.open(`https://line.me/R/msg/text/?${encodeURIComponent(lineText)}`, "_blank");
        });

        container.querySelector("#btn-restart-haiku").addEventListener("click", () => {
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
  renderBatsuRoulette(container, game) {
    let selectedScene = "all";
    let activeInterval = null;
    let presets = game.presets || [];

    function getBatsuList(scene = selectedScene) {
      if (scene === "all") return presets;
      const filtered = presets.filter(p => p.scene === scene);
      return filtered.length > 0 ? filtered : presets;
    }

    let currentBatsu = extractTopicText(DeckManager.getNext(`batsu_${selectedScene}`, getBatsuList())) || "全力で推しの魅力を30秒間熱弁する";

    function render() {
      container.innerHTML = `
        <div class="tool-card text-center batsu-card">
          <h3 class="tool-title">⚡ 罰ゲーム＆ミッションルーレット</h3>
          <p class="text-sub text-sm mb-3">負けた人に課す安全で楽しいミッションを即決！</p>

          <div class="gacha-cat-filters mb-3">
            <button class="btn-filter-tag ${selectedScene === 'all' ? 'active' : ''}" data-scene="all">すべて</button>
            <button class="btn-filter-tag ${selectedScene === 'party' ? 'active' : ''}" data-scene="party">🎉 パーティー</button>
            <button class="btn-filter-tag ${selectedScene === 'nomikai' ? 'active' : ''}" data-scene="nomikai">🍻 飲み会</button>
            <button class="btn-filter-tag ${selectedScene === 'friends' ? 'active' : ''}" data-scene="friends">👥 友達・安全</button>
          </div>

          <div class="batsu-mission-box my-4" id="batsu-box">
            <span class="batsu-badge">🎯 今日のミッション</span>
            <div class="batsu-text" id="batsu-text">${escapeHTML(currentBatsu)}</div>
          </div>

          <div class="batsu-actions">
            <button class="btn btn-danger btn-lg btn-block pulse-scale" id="btn-spin-batsu">
              <span>ルーレットを回す！</span> 🎰
            </button>
            <button class="btn btn-success btn-block mt-2" id="btn-batsu-done">
              <span>ミッション達成！</span> 👏
            </button>
          </div>
        </div>
      `;

      container.querySelectorAll(".btn-filter-tag").forEach(btn => {
        btn.addEventListener("click", () => {
          Sound.playClick();
          selectedScene = btn.dataset.scene;
          const list = getBatsuList(selectedScene);
          currentBatsu = extractTopicText(DeckManager.getNext(`batsu_${selectedScene}`, list)) || "全力で推しの魅力を30秒間熱弁する";
          render();
        });
      });

      container.querySelector("#btn-spin-batsu").addEventListener("click", () => {
        Sound.playSelect();
        const box = container.querySelector("#batsu-box");
        const text = container.querySelector("#batsu-text");
        box.classList.add("spinning");

        let count = 0;
        const currentList = getBatsuList(selectedScene);
        if (activeInterval) safeClearInterval(activeInterval);
        activeInterval = safeSetInterval(() => {
          count++;
          const rand = currentList[Math.floor(Math.random() * currentList.length)];
          text.textContent = extractTopicText(rand) || "ミッション抽選中...";
          Sound.playTick(800 + count * 30);
          if (count >= 14) {
            safeClearInterval(activeInterval);
            activeInterval = null;
            box.classList.remove("spinning");
            Sound.playExplosion();
            currentBatsu = extractTopicText(DeckManager.getNext(`batsu_${selectedScene}`, currentList)) || "全力で推しの魅力を30秒間熱弁する";
            text.textContent = currentBatsu;
            if (typeof window !== "undefined" && window.StampRally) {
              window.StampRally.markPlayed("batsu-roulette");
            }
          }
        }, 75);
      });

      container.querySelector("#btn-batsu-done").addEventListener("click", () => {
        Sound.playFanfare();
        Confetti.burst(80);
        if (typeof window !== "undefined" && window.StampRally) {
          window.StampRally.markPlayed("batsu-roulette");
        }
        Toast.success("ナイスファイト！ミッション達成！👏");
      });
    }

    render();
    return () => {
      if (activeInterval) safeClearInterval(activeInterval);
    };
  },

  // ===================================================
  // 新規追加ツール ＆ 2人対戦 ＆ ガイド完全ツール化
  // ===================================================
  renderDuelReflex(container, game) {
    let state = {
      scoreP1: 0,
      scoreP2: 0,
      phase: "ready", // ready, waiting, go, fault, win
      winner: null,
      reactionMs: 0,
      timerId: null,
      startTime: 0
    };

    function update() {
      container.innerHTML = `
        <div class="duel-container ${state.phase}">
          <!-- プレイヤー1（上画面・逆さま） -->
          <div class="duel-half duel-top ${state.phase === 'fault_p1' ? 'fault' : ''} ${state.winner === 1 ? 'winner' : ''}" id="duel-p1-area">
            <div class="duel-content rotate-180">
              <div class="duel-score">スコア: ${state.scoreP1} / 3</div>
              <div class="duel-player-label">PLAYER 1</div>
              ${state.phase === 'ready' ? '<div class="duel-instruction">準備ができたら中央をタップ</div>' : ''}
              ${state.phase === 'waiting' ? '<div class="duel-status-text">待て… (赤)</div>' : ''}
              ${state.phase === 'go' ? '<div class="duel-status-text go">押せ！！！ (緑)</div>' : ''}
              ${state.phase === 'fault_p1' ? '<div class="duel-status-text error">フライング！！相手に1点</div>' : ''}
            </div>
          </div>

          <!-- 中央仕切り線＆コントロール -->
          <div class="duel-divider">
            ${state.phase === 'ready' ? `
              <button class="btn btn-primary btn-sm" id="btn-duel-start">勝負スタート！</button>
            ` : state.phase === 'win' ? `
              <div class="duel-win-banner">
                🏆 PLAYER ${state.winner} の大勝利！ 🏆
                <button class="btn btn-sm btn-outline mt-1" id="btn-duel-restart">もう一度対決</button>
                <button class="btn btn-sm btn-danger mt-1 font-bold" id="btn-duel-batsu">🔥 敗者の罰ゲーム！</button>
              </div>
            ` : `
              <div class="duel-center-text">${state.phase === 'go' ? `${state.reactionMs}ms` : '集中せよ…'}</div>
            `}
          </div>

          <!-- プレイヤー2（下画面） -->
          <div class="duel-half duel-bottom ${state.phase === 'fault_p2' ? 'fault' : ''} ${state.winner === 2 ? 'winner' : ''}" id="duel-p2-area">
            <div class="duel-content">
              <div class="duel-player-label">PLAYER 2</div>
              <div class="duel-score">スコア: ${state.scoreP2} / 3</div>
              ${state.phase === 'ready' ? '<div class="duel-instruction">準備ができたら中央をタップ</div>' : ''}
              ${state.phase === 'waiting' ? '<div class="duel-status-text">待て… (赤)</div>' : ''}
              ${state.phase === 'go' ? '<div class="duel-status-text go">押せ！！！ (緑)</div>' : ''}
              ${state.phase === 'fault_p2' ? '<div class="duel-status-text error">フライング！！相手に1点</div>' : ''}
            </div>
          </div>
        </div>
      `;

      const startBtn = container.querySelector("#btn-duel-start");
      if (startBtn) {
        startBtn.addEventListener("click", startRound);
      }

      const restartBtn = container.querySelector("#btn-duel-restart");
      if (restartBtn) {
        restartBtn.addEventListener("click", () => {
          Sound.playClick();
          state.scoreP1 = 0;
          state.scoreP2 = 0;
          state.phase = "ready";
          state.winner = null;
          update();
        });
      }

      const btnDuelBatsu = container.querySelector("#btn-duel-batsu");
      if (btnDuelBatsu) btnDuelBatsu.onclick = () => { Sound.playSelect(); if (typeof window.openBatsuModal === "function") window.openBatsuModal(); };
      const p1Area = container.querySelector("#duel-p1-area");
      const p2Area = container.querySelector("#duel-p2-area");

      p1Area.addEventListener("touchstart", (e) => { e.preventDefault(); handleTap(1); }, { passive: false });
      p1Area.addEventListener("mousedown", () => handleTap(1));

      p2Area.addEventListener("touchstart", (e) => { e.preventDefault(); handleTap(2); }, { passive: false });
      p2Area.addEventListener("mousedown", () => handleTap(2));
    }

    function startRound() {
      Sound.playClick();
      state.phase = "waiting";
      update();

      const delayMs = 1500 + Math.random() * 3000;
      safeClearTimeout(state.timerId);
      state.timerId = safeSetTimeout(() => {
        state.phase = "go";
        state.startTime = Date.now();
        Sound.playCountBeep(true);
        Sound.hapticWarning();
        update();
      }, delayMs);
    }

    function handleTap(player) {
      if (state.phase === "waiting") {
        // フライング
        safeClearTimeout(state.timerId);
        Sound.playWrong();
        Sound.hapticExplosion();
        if (player === 1) {
          state.scoreP2++;
          state.phase = "fault_p1";
        } else {
          state.scoreP1++;
          state.phase = "fault_p2";
        }
        checkWinOrNext();
      } else if (state.phase === "go") {
        state.reactionMs = Date.now() - state.startTime;
        Sound.playCorrect();
        Sound.hapticSuccess();
        if (player === 1) {
          state.scoreP1++;
          state.winner = 1;
        } else {
          state.scoreP2++;
          state.winner = 2;
        }
        checkWinOrNext();
      }
    }

    function checkWinOrNext() {
      if (state.scoreP1 >= 3) {
        state.phase = "win";
        state.winner = 1;
        Sound.playFanfare();
        if (typeof Confetti !== "undefined") Confetti.launch();
        if (typeof window !== "undefined" && window.StampRally) {
          window.StampRally.markPlayed("duel-reflex");
        }
        update();
      } else if (state.scoreP2 >= 3) {
        state.phase = "win";
        state.winner = 2;
        Sound.playFanfare();
        if (typeof Confetti !== "undefined") Confetti.launch();
        if (typeof window !== "undefined" && window.StampRally) {
          window.StampRally.markPlayed("duel-reflex");
        }
        update();
      } else {
        update();
        safeSetTimeout(() => {
          if (state.phase !== "win") {
            startRound();
          }
        }, 1500);
      }
    }

    update();
    return () => {
      if (state.timerId) safeClearTimeout(state.timerId);
    };
  },

  // ===================================================
  // 5. 2人対戦：💥 連打パワーバトル (Tug of War Mash)
  // ===================================================
  renderDuelMash(container, game) {
    let state = {
      p1Taps: 0,
      p2Taps: 0,
      gauge: 50, // 0 (P1勝利) 〜 100 (P2勝利)
      timeLeft: 15,
      phase: "ready", // ready, playing, result
      timerId: null
    };

    function update() {
      container.innerHTML = `
        <div class="duel-container mash-battle ${state.phase}">
          <!-- P1 エリア（上画面） -->
          <div class="duel-half duel-top" id="mash-p1-btn">
            <div class="duel-content rotate-180">
              <div class="duel-player-label">PLAYER 1</div>
              <div class="mash-count">連打数: ${state.p1Taps}</div>
              <div class="mash-tap-hint">ここを全力連打！👆👆</div>
            </div>
          </div>

          <!-- 中央綱引きゲージ -->
          <div class="mash-gauge-track">
            <div class="mash-gauge-p1" style="height: ${100 - state.gauge}%"></div>
            <div class="mash-gauge-center-line">
              <span class="badge badge-warning font-mono">⏱️ ${state.timeLeft}s</span>
            </div>
            <div class="mash-gauge-p2" style="height: ${state.gauge}%"></div>
          </div>

          <!-- P2 エリア（下画面） -->
          <div class="duel-half duel-bottom" id="mash-p2-btn">
            <div class="duel-content">
              <div class="duel-player-label">PLAYER 2</div>
              <div class="mash-count">連打数: ${state.p2Taps}</div>
              <div class="mash-tap-hint">ここを全力連打！👆👆</div>
            </div>
          </div>

          ${state.phase === 'ready' ? `
            <div class="duel-overlay">
              <div class="tool-card text-center">
                <h3>💥 連打パワーバトル</h3>
                <p>15秒間でゲージを相手陣地に押し込め！</p>
                <button class="btn btn-primary btn-lg mt-2" id="btn-mash-start">FIGHT スタート！</button>
              </div>
            </div>
          ` : ''}

          ${state.phase === 'result' ? `
            <div class="duel-overlay">
              <div class="tool-card text-center animate-bounce">
                <h2>🏆 ${state.gauge < 50 ? 'PLAYER 1' : state.gauge > 50 ? 'PLAYER 2' : '引き分け'} の勝利！</h2>
                <p class="my-2">P1: ${state.p1Taps}回 vs P2: ${state.p2Taps}回</p>
                <button class="btn btn-primary btn-block mt-3" id="btn-mash-retry">もう一度対決 🔄</button>
                <button class="btn btn-danger btn-block mt-2 font-bold" id="btn-mash-batsu">🔥 敗者の罰ゲーム！ ➔</button>
              </div>
            </div>
          ` : ''}
        </div>
      `;

      const startBtn = container.querySelector("#btn-mash-start");
      if (startBtn) {
        startBtn.addEventListener("click", () => {
          Sound.playSelect();
          state.phase = "playing";
          state.gauge = 50;
          state.p1Taps = 0;
          state.p2Taps = 0;
          state.timeLeft = 15;
          update();

          if (state.timer) state.timer.destroy();
          state.timer = new GameTimer({
            totalSeconds: 15,
            tickSoundInterval: 3,
            onTick: (rem) => {
              state.timeLeft = rem;
              if (state.gauge <= 0 || state.gauge >= 100) {
                state.timer.stop();
                finishMash();
              } else {
                const timerBadge = container.querySelector(".mash-gauge-center-line span");
                if (timerBadge) timerBadge.textContent = `⏱️ ${rem}s`;
              }
            },
            onFinish: () => {
              finishMash();
            }
          });
          state.timer.start();

          function finishMash() {
            state.phase = "result";
            Sound.playFanfare();
            if (typeof Confetti !== "undefined") Confetti.launch();
            if (typeof window !== "undefined" && window.StampRally) {
              window.StampRally.markPlayed("duel-mash");
            }
            update();
          }
        });
      }

      const btnMashBatsu = container.querySelector("#btn-mash-batsu");
      if (btnMashBatsu) btnMashBatsu.onclick = () => { Sound.playSelect(); if (typeof window.openBatsuModal === "function") window.openBatsuModal(); };
      const retryBtn = container.querySelector("#btn-mash-retry");
      if (retryBtn) {
        retryBtn.addEventListener("click", () => {
          Sound.playClick();
          state.phase = "ready";
          update();
        });
      }

      const p1Btn = container.querySelector("#mash-p1-btn");
      const p2Btn = container.querySelector("#mash-p2-btn");

      function tapP1(e) {
        if (e.type === "touchstart") e.preventDefault();
        state.p1Taps++;
        state.gauge = Math.max(0, state.gauge - 1.2);
        Sound.playClick();
        Sound.hapticLight();
        refreshGauge();
      }

      function tapP2(e) {
        if (e.type === "touchstart") e.preventDefault();
        state.p2Taps++;
        state.gauge = Math.min(100, state.gauge + 1.2);
        Sound.playClick();
        Sound.hapticLight();
        refreshGauge();
      }

      if (p1Btn && state.phase === "playing") {
        p1Btn.addEventListener("touchstart", tapP1, { passive: false });
        p1Btn.addEventListener("mousedown", tapP1);
      }

      if (p2Btn && state.phase === "playing") {
        p2Btn.addEventListener("touchstart", tapP2, { passive: false });
        p2Btn.addEventListener("mousedown", tapP2);
      }
    }

    function refreshGauge() {
      const g1 = container.querySelector(".mash-gauge-p1");
      const g2 = container.querySelector(".mash-gauge-p2");
      const c1 = container.querySelector("#mash-p1-btn .mash-count");
      const c2 = container.querySelector("#mash-p2-btn .mash-count");
      if (g1 && g2) {
        g1.style.height = `${100 - state.gauge}%`;
        g2.style.height = `${state.gauge}%`;
      }
      if (c1) c1.textContent = `連打数: ${state.p1Taps}`;
      if (c2) c2.textContent = `連打数: ${state.p2Taps}`;
    }

    update();
    return () => {
      if (state.timer) state.timer.destroy();
    };
  },

  // ===================================================
  // 6. 2人対戦：🎨 カラー早見分けバトル (Color Matcher)
  // ===================================================
  renderDuelColor(container, game) {
    let state = {
      scoreP1: 0,
      scoreP2: 0,
      currentProblem: null,
      phase: "ready" // ready, playing, result
    };

    const colorDefs = [
      { text: "あか", name: "赤", color: "#ef4444" },
      { text: "あお", name: "青", color: "#3b82f6" },
      { text: "みどり", name: "緑", color: "#22c55e" },
      { text: "きいろ", name: "黄", color: "#eab308" },
      { text: "むらさき", name: "紫", color: "#a855f7" }
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
      container.innerHTML = `
        <div class="duel-container color-battle ${state.phase}">
          <!-- P1 エリア（上） -->
          <div class="duel-half duel-top">
            <div class="duel-content rotate-180">
              <div class="duel-score">スコア: ${state.scoreP1} / 5</div>
              <div class="color-btn-group">
                <button class="btn btn-success btn-lg" id="btn-p1-yes">〇 一致</button>
                <button class="btn btn-danger btn-lg" id="btn-p1-no">✕ 不一致</button>
              </div>
            </div>
          </div>

          <!-- 中央問題カード -->
          <div class="color-center-card">
            ${state.currentProblem ? `
              <div class="color-target-word" style="color: ${state.currentProblem.colorHex}">
                ${state.currentProblem.word}
              </div>
              <small class="text-muted">文字の意味と色は一致している？</small>
            ` : '準備完了'}
          </div>

          <!-- P2 エリア（下） -->
          <div class="duel-half duel-bottom">
            <div class="duel-content">
              <div class="color-btn-group">
                <button class="btn btn-success btn-lg" id="btn-p2-yes">〇 一致</button>
                <button class="btn btn-danger btn-lg" id="btn-p2-no">✕ 不一致</button>
              </div>
              <div class="duel-score">スコア: ${state.scoreP2} / 5</div>
            </div>
          </div>

          ${state.phase === 'ready' ? `
            <div class="duel-overlay">
              <div class="tool-card text-center">
                <h3>🎨 カラー早見分け対決</h3>
                <p>文字の意味と文字の色が一致しているかを即座にジャッジ！5問先取！</p>
                <button class="btn btn-primary btn-lg mt-2" id="btn-color-start">勝負スタート！</button>
              </div>
            </div>
          ` : ''}

          ${state.phase === 'result' ? `
            <div class="duel-overlay">
              <div class="tool-card text-center animate-bounce">
                <h2>🏆 PLAYER ${state.scoreP1 >= 5 ? 1 : 2} の完全勝利！</h2>
                <button class="btn btn-primary btn-block mt-3" id="btn-color-retry">もう一度対決 🔄</button>
                <button class="btn btn-danger btn-block mt-2 font-bold" id="btn-color-batsu">🔥 敗者の罰ゲーム！ ➔</button>
              </div>
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
        Sound.hapticExplosion();
        if (player === 1) state.scoreP1 = Math.max(0, state.scoreP1 - 1);
        else state.scoreP2 = Math.max(0, state.scoreP2 - 1);
      }

      if (state.scoreP1 >= 5 || state.scoreP2 >= 5) {
        state.phase = "result";
        Sound.playFanfare();
        if (typeof Confetti !== "undefined") Confetti.launch();
        if (typeof window !== "undefined" && window.StampRally) {
          window.StampRally.markPlayed("duel-color");
        }
        update();
      } else {
        nextProblem();
        update();
      }
    }

    update();
  },

  // ===================================================
  // 19. 山手線ゲーム (古今東西) (ツール化完了!)
  // ===================================================
  renderRhythmBox(container, game) {
    let currentSubTab = (game && game.subTab) ? game.subTab : "yamanote";
    if (game && game.id === "magical-banana") currentSubTab = "magical-banana";
    if (game && game.id === "doremi-song") currentSubTab = "doremi";

    let yamanoteState = { bpm: 80, isPlaying: false, intervalId: null, currentTopic: "" };
    let bananaState = { bpm: 90, isPlaying: false, beatInterval: null, beatStep: 0, currentWord: "バナナ" };

    const noteDefs = [
      { name: "ド (ドーナツ)", key: "ド", freq: 261.63 },
      { name: "レ (レモン)", key: "レ", freq: 293.66 },
      { name: "ミ (ミカン)", key: "ミ", freq: 329.63 },
      { name: "ファ (ファイト)", key: "ファ", freq: 349.23 },
      { name: "ソ (青い空)", key: "ソ", freq: 392.00 },
      { name: "ラ (ラッパ)", key: "ラ", freq: 440.00 },
      { name: "シ (幸せ)", key: "シ", freq: 493.88 }
    ];
    let doremiIndex = 0;
    let doremiState = { bpm: 100, isPlaying: false, beatInterval: null, beatStep: 0 };

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
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
            osc.connect(gain);
            gain.connect(Sound.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.35);
          }
        } catch (e) {}
      }
    }

    function getYamanoteTopic() {
      const presets = (game && game.presets && game.presets.length > 0) ? game.presets : [
        "日本の都道府県", "電化製品", "コンビニで買えるもの", "緑色の食べ物", "動物園にいる動物"
      ];
      const item = drawShuffledTopic("yamanote-game", presets);
      return extractTopicText(item) || "日本の都道府県";
    }
    yamanoteState.currentTopic = getYamanoteTopic();

    function startYamanoteBeat() {
      if (yamanoteState.isPlaying) return;
      yamanoteState.isPlaying = true;
      const intervalMs = (60 / yamanoteState.bpm) * 1000;
      yamanoteState.intervalId = safeSetInterval(() => {
        Sound.playTick(1000);
        const beatEl = container.querySelector(".rhythm-display-box");
        if (beatEl) {
          beatEl.classList.add("beating");
          safeSetTimeout(() => beatEl.classList.remove("beating"), 100);
        }
      }, intervalMs);
    }

    const starterWords = ["バナナ", "りんご", "ゴリラ", "くるま", "アイス", "ねこ", "海", "カレー", "すいか", "テレビ"];
    function getNextBananaWord() { return starterWords[Math.floor(Math.random() * starterWords.length)]; }

    function playBananaStep() {
      bananaState.beatStep = (bananaState.beatStep + 1) % 4;
      const beatEl = container.querySelector("#banana-beat-indicator");
      if (beatEl) {
        beatEl.textContent = bananaState.beatStep === 0 ? "👏 1拍目 (パン)" : (bananaState.beatStep === 1 ? "👏 2拍目 (パン)" : (bananaState.beatStep === 2 ? "🗣️ 3拍目 (言う)" : "🗣️ 4拍目 (言う)"));
        beatEl.className = "banana-beat-box " + (bananaState.beatStep < 2 ? "active-clap" : "active-voice");
      }
      if (bananaState.beatStep < 2) Sound.playTick(1000); else Sound.playTick(600);
    }

    function startBananaBeat() {
      if (bananaState.isPlaying) return;
      bananaState.isPlaying = true;
      bananaState.beatStep = 0;
      const intervalMs = (60 / bananaState.bpm) * 1000;
      playBananaStep();
      bananaState.beatInterval = safeSetInterval(() => { playBananaStep(); }, intervalMs);
    }

    function playDoremiStep() {
      doremiState.beatStep = (doremiState.beatStep + 1) % 4;
      const beatEl = container.querySelector("#doremi-beat-indicator");
      if (beatEl) {
        beatEl.textContent = doremiState.beatStep === 0 ? "🎵 1拍目 (パン)" : (doremiState.beatStep === 1 ? "👏 2拍目" : (doremiState.beatStep === 2 ? "👏 3拍目" : "🗣️ 歌う！"));
        beatEl.className = "doremi-beat-box " + (doremiState.beatStep === 3 ? "active-sing" : "active-beat");
      }
      if (doremiState.beatStep === 0) Sound.playTick(1200); else Sound.playTick(800);
    }

    function startDoremiBeat() {
      if (doremiState.isPlaying) return;
      doremiState.isPlaying = true;
      doremiState.beatStep = 0;
      const intervalMs = (60 / doremiState.bpm) * 1000;
      playDoremiStep();
      doremiState.beatInterval = safeSetInterval(() => { playDoremiStep(); }, intervalMs);
    }

    function render() {
      let subMarkup = "";

      if (currentSubTab === "yamanote") {
        subMarkup = `
          <div class="topic-box my-3">
            <span class="topic-tag">🎯 山手線・古今東西 お題</span>
            <div class="topic-text font-bold text-lg">${escapeHTML(yamanoteState.currentTopic)}</div>
            <button class="btn btn-sm btn-outline mt-2" id="btn-next-yamanote-topic">お題チェンジ 🎲</button>
          </div>

          <div class="rhythm-display-box my-3 ${yamanoteState.isPlaying ? 'beating' : ''}">
            <div class="rhythm-visual-beat">👏</div>
            <div class="rhythm-bpm-display font-mono">BPM: ${yamanoteState.bpm}</div>
          </div>

          <div class="flex gap-2 justify-center my-2">
            <button class="btn ${yamanoteState.isPlaying ? 'btn-danger' : 'btn-success'} btn-lg flex-1 font-bold" id="btn-toggle-yamanote">
              ${yamanoteState.isPlaying ? '⏹️ リズム停止' : '▶️ リズムスタート (手拍子)'}
            </button>
          </div>

          <div class="setting-group mt-2">
            <label class="setting-label text-xs">テンポ (BPM):</label>
            <div class="flex gap-2 justify-center items-center">
              <button class="btn btn-sm btn-outline" id="btn-bpm-down">-10</button>
              <input type="range" class="range-slider" min="60" max="160" value="${yamanoteState.bpm}" id="range-yamanote-bpm">
              <button class="btn btn-sm btn-outline" id="btn-bpm-up">+10 (テンポアップ🔥)</button>
            </div>
          </div>

          <div class="flex gap-2 mt-3">
            <button class="btn btn-danger flex-1 font-bold" id="btn-yamanote-foul">💥 アウト！ (ミス・詰まり)</button>
            <button class="btn btn-secondary font-bold" id="btn-yamanote-batsu">⚡ 罰ゲーム</button>
          </div>
        `;
      } else if (currentSubTab === "magical-banana") {
        subMarkup = `
          <div class="p-3 my-3 border rounded text-center" style="background: rgba(234,179,8,0.06); border-color: rgba(234,179,8,0.3);">
            <span class="topic-tag">🍌 最初のお題ワード</span>
            <div class="font-black text-2xl text-warning my-1">${escapeHTML(bananaState.currentWord)}</div>
            <p class="text-xs text-muted">「${escapeHTML(bananaState.currentWord)}と言ったら〇〇！」と連想を繋ごう！</p>
            <button class="btn btn-xs btn-outline mt-1" id="btn-next-banana-word">お題を変える 🎲</button>
          </div>

          <div class="setting-group my-2">
            <label class="setting-label text-xs">テンポ (BPM):</label>
            <div class="btn-toggle-group">
              <button class="btn-toggle ${bananaState.bpm === 90 ? 'active' : ''}" data-banana-bpm="90">ゆっくり (90)</button>
              <button class="btn-toggle ${bananaState.bpm === 120 ? 'active' : ''}" data-banana-bpm="120">普通 (120)</button>
              <button class="btn-toggle ${bananaState.bpm === 150 ? 'active' : ''}" data-banana-bpm="150">超特急 (150)</button>
            </div>
          </div>

          <div class="my-2">
            <div id="banana-beat-indicator" style="padding: 10px; border-radius: 8px; font-weight: 800; font-size: 1rem; background: rgba(0,0,0,0.03); min-height: 44px; display: flex; align-items: center; justify-content: center;">
              ${bananaState.isPlaying ? '🎵 リズムに合わせて復唱＆連想！' : 'スタートを押してリズム開始！'}
            </div>
          </div>

          <div class="flex gap-2 my-3">
            <button class="btn ${bananaState.isPlaying ? 'btn-danger' : 'btn-primary'} btn-lg flex-1 font-bold" id="btn-toggle-banana">
              ${bananaState.isPlaying ? '⏹️ リズム停止' : '▶️ リズムスタート'}
            </button>
          </div>

          <div class="flex gap-2">
            <button class="btn btn-danger flex-1 font-bold" id="btn-banana-foul">💥 詰まった・ミス！アウト</button>
            <button class="btn btn-secondary font-bold" id="btn-banana-batsu">⚡ 罰ゲーム</button>
          </div>
        `;
      } else if (currentSubTab === "doremi") {
        const note = noteDefs[doremiIndex];
        subMarkup = `
          <div class="my-3 p-3 rounded border text-center" style="background: rgba(59,130,246,0.06); border-color: rgba(59,130,246,0.3);">
            <span class="topic-tag">指定された音階</span>
            <div class="font-black text-3xl text-primary my-1">${note.name}</div>
            <button class="btn btn-xs btn-outline mt-1" id="btn-play-doremi-tone">🎹 音階を鳴らす (${note.key})</button>
          </div>

          <div class="setting-group my-2">
            <label class="setting-label text-xs">テンポ (BPM):</label>
            <div class="btn-toggle-group">
              <button class="btn-toggle ${doremiState.bpm === 100 ? 'active' : ''}" data-doremi-bpm="100">通常 (100)</button>
              <button class="btn-toggle ${doremiState.bpm === 130 ? 'active' : ''}" data-doremi-bpm="130">高速 (130)</button>
              <button class="btn-toggle ${doremiState.bpm === 160 ? 'active' : ''}" data-doremi-bpm="160">激ムズ (160)</button>
            </div>
          </div>

          <div class="my-2">
            <div id="doremi-beat-indicator" style="padding: 10px; border-radius: 8px; font-weight: 800; font-size: 1rem; background: rgba(0,0,0,0.03); min-height: 44px; display: flex; align-items: center; justify-content: center;">
              ${doremiState.isPlaying ? '🎵 テンポを刻み中...' : 'リズムに合わせて即座にフレーズを歌おう！'}
            </div>
          </div>

          <div class="flex flex-col gap-2 my-2">
            <button class="btn btn-primary btn-block btn-lg py-3 font-bold" id="btn-next-doremi">
              次の音階をランダム指定！ 🎲
            </button>
            <div class="flex gap-2">
              <button class="btn btn-outline flex-1 font-bold" id="btn-toggle-doremi">
                ${doremiState.isPlaying ? '⏹️ リズム停止' : '▶️ リズム開始'}
              </button>
              <button class="btn btn-danger flex-1 font-bold" id="btn-doremi-foul">💥 歌詞・音程ミス！</button>
              <button class="btn btn-secondary font-bold" id="btn-doremi-batsu">⚡ 罰ゲーム</button>
            </div>
          </div>
        `;
      }

      container.innerHTML = `
        <div class="tool-card text-center rhythm-box-card">
          <h3 class="tool-title mb-2">🎵 バラエティ・リズムボックス</h3>

          <div class="btn-toggle-group mb-3" style="width: 100%; display: flex;">
            <button class="btn-toggle flex-1 ${currentSubTab === 'yamanote' ? 'active' : ''}" data-subtab="yamanote">🚃 山手線・古今東西</button>
            <button class="btn-toggle flex-1 ${currentSubTab === 'magical-banana' ? 'active' : ''}" data-subtab="magical-banana">🍌 マジカルバナナ</button>
            <button class="btn-toggle flex-1 ${currentSubTab === 'doremi' ? 'active' : ''}" data-subtab="doremi">🎵 ドレミの歌</button>
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
        } else {
          Toast.info("⚡ 罰ゲームルーレットを起動します");
        }
      };

      if (currentSubTab === "yamanote") {
        container.querySelector("#btn-next-yamanote-topic").addEventListener("click", () => {
          Sound.playClick();
          yamanoteState.currentTopic = getYamanoteTopic();
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
          yamanoteState.bpm = parseInt(e.target.value);
          if (yamanoteState.isPlaying) { stopAllRhythms(); startYamanoteBeat(); }
          const display = container.querySelector(".rhythm-bpm-display");
          if (display) display.textContent = `BPM: ${yamanoteState.bpm}`;
        });

        container.querySelector("#btn-yamanote-foul").addEventListener("click", () => {
          Sound.playWrong();
          Sound.hapticExplosion();
          if (typeof window !== "undefined" && window.StampRally) {
            window.StampRally.markPlayed("rhythm-box");
          }
          Toast.warning("💥 詰まり・ミス！アウトです！");
        });

        container.querySelector("#btn-yamanote-batsu").addEventListener("click", triggerBatsu);
      }

      if (currentSubTab === "magical-banana") {
        container.querySelector("#btn-next-banana-word").addEventListener("click", () => {
          Sound.playClick();
          bananaState.currentWord = getNextBananaWord();
          render();
        });

        container.querySelectorAll("[data-banana-bpm]").forEach(btn => {
          btn.addEventListener("click", () => {
            Sound.playClick();
            bananaState.bpm = parseInt(btn.dataset.bananaBpm);
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
          Sound.playWrong();
          Sound.hapticExplosion();
          if (typeof window !== "undefined" && window.StampRally) {
            window.StampRally.markPlayed("rhythm-box");
          }
          Toast.warning("💥 言葉が出なかった！アウト！");
        });

        container.querySelector("#btn-banana-batsu").addEventListener("click", triggerBatsu);
      }

      if (currentSubTab === "doremi") {
        container.querySelector("#btn-play-doremi-tone").addEventListener("click", () => {
          playTone(noteDefs[doremiIndex].freq);
        });

        container.querySelector("#btn-next-doremi").addEventListener("click", () => {
          doremiIndex = (doremiIndex + Math.floor(Math.random() * (noteDefs.length - 1)) + 1) % noteDefs.length;
          playTone(noteDefs[doremiIndex].freq);
          render();
        });

        container.querySelectorAll("[data-doremi-bpm]").forEach(btn => {
          btn.addEventListener("click", () => {
            Sound.playClick();
            doremiState.bpm = parseInt(btn.dataset.doremiBpm);
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
          Sound.playWrong();
          Sound.hapticExplosion();
          if (typeof window !== "undefined" && window.StampRally) {
            window.StampRally.markPlayed("rhythm-box");
          }
          Toast.warning("💥 歌詞ミス or 音程迷子！アウトです！");
        });

        container.querySelector("#btn-doremi-batsu").addEventListener("click", triggerBatsu);
      }
    }

    render();

    return () => {
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
    let state = {
      playerCount: 4,
      currentParent: 1,
      maxFingers: 8
    };

    function update() {
      state.maxFingers = state.playerCount * 2;
      container.innerHTML = `
        <div class="tool-card text-center">
          <h3 class="tool-title">👍 指スマ / いっせーのせ アシスト</h3>

          <div class="setting-group my-3">
            <label class="setting-label">参加人数: <span class="badge-num">${state.playerCount}人</span> (最大指本数: ${state.maxFingers}本)</label>
            <input type="range" class="range-slider" min="2" max="8" value="${state.playerCount}" id="range-standup-players">
          </div>

          <div class="parent-roulette-box my-4">
            <span class="badge badge-warning">👑 今の親番</span>
            <div class="parent-name-display animate-bounce">プレイヤー ${state.currentParent}</div>
            <p class="text-sm text-muted">「いっせーのーで、0〜${state.maxFingers}」の好きな数字を叫ぼう！</p>
          </div>

          <div class="flex gap-2 justify-center mt-3">
            <button class="btn btn-primary btn-lg" id="btn-next-parent">次の親へ交代 ➔</button>
            <button class="btn btn-outline btn-lg" id="btn-random-parent">ランダム親指名 🎲</button>
          </div>
        </div>
      `;

      container.querySelector("#range-standup-players").addEventListener("input", (e) => {
        state.playerCount = parseInt(e.target.value);
        state.currentParent = Math.min(state.currentParent, state.playerCount);
        update();
      });

      container.querySelector("#btn-next-parent").addEventListener("click", () => {
        Sound.playSelect();
        state.currentParent = (state.currentParent % state.playerCount) + 1;
        if (typeof window !== "undefined" && window.StampRally) {
          window.StampRally.markPlayed("stand-up-game");
        }
        update();
      });

      container.querySelector("#btn-random-parent").addEventListener("click", () => {
        Sound.playDrumRoll(1.0);
        safeSetTimeout(() => {
          Sound.playJajan();
          state.currentParent = Math.floor(Math.random() * state.playerCount) + 1;
          if (typeof window !== "undefined" && window.StampRally) {
            window.StampRally.markPlayed("stand-up-game");
          }
          update();
        }, 1000);
      });
    }

    update();
  },

  // ===================================================
  // 21. ピンポンパンゲーム (テンポアップマシン)
  // ===================================================
  renderPingPong(container, game) {
    let state = {
      step: 0, // 0: ピン, 1: ポン, 2: パン
      combo: 0,
      isPlaying: false,
      bpm: 100,
      autoAccelerate: true,
      beatInterval: null
    };

    const words = ["ピン！ 🏓", "ポン！ 🏓", "パン！ 👉 (誰かを指名)"];

    function nextStep() {
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
      state.isPlaying = true;
      restartInterval();
      updateControls();
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
        btn.innerHTML = state.isPlaying ? "⏹️ 自動テンポマシン停止" : "⚡ 自動テンポマシン開始！";
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
      container.innerHTML = `
        <div class="tool-card text-center">
          <div class="flex justify-between items-center mb-1">
            <h3 class="tool-title" style="margin:0;">🏓 ピンポンパン ゲームマスター</h3>
            <span class="badge badge-info font-mono text-xs">BPM: <span id="pingpong-bpm-val">${state.bpm}</span></span>
          </div>

          <div class="pingpong-display my-4 p-4 rounded border animate-scale" style="background: rgba(59,130,246,0.06); border-color: rgba(59,130,246,0.3);">
            <div class="pingpong-word font-black text-3xl text-primary">${words[state.step]}</div>
            <div class="pingpong-combo badge badge-success mt-2">コンボ: ${state.combo} 回</div>
          </div>

          <div class="setting-group my-2 flex justify-between items-center px-2">
            <label class="setting-label text-xs mb-0">⚡ 連続成功で自動加速:</label>
            <button class="btn btn-xs ${state.autoAccelerate ? 'btn-primary' : 'btn-outline'}" id="btn-toggle-accel">
              ${state.autoAccelerate ? 'ON (徐々に加速)' : 'OFF (一定速)'}
            </button>
          </div>

          <div class="flex flex-col gap-2 mt-3">
            <button class="btn btn-primary btn-block btn-lg py-3 font-bold" id="btn-pingpong-auto">
              ${state.isPlaying ? '⏹️ 自動テンポマシン停止' : '⚡ 自動テンポマシン開始！'}
            </button>
            <button class="btn btn-outline btn-block btn-lg py-3 font-bold" id="btn-pingpong-next">
              手動で次の合図を刻む！ ➔
            </button>
            <button class="btn btn-danger btn-sm btn-block mt-1" id="btn-pingpong-reset">
              💥 ミス！リセット (0回に戻す) ✕
            </button>
          </div>
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
        Sound.hapticExplosion();
        if (typeof window !== "undefined" && window.StampRally) {
          window.StampRally.markPlayed("ping-pong-pang");
        }
        stopAutoPlay();
        state.step = 0;
        state.combo = 0;
        state.bpm = 100;
        render();
      });
    }

    render();

    return () => {
      stopAutoPlay();
    };
  },

  // ===================================================
  // 22. たけのこニョッキ
  // ===================================================
  renderTakenoko(container, game) {
    let state = {
      currentCount: 0,
      playerCount: 5
    };

    function update() {
      container.innerHTML = `
        <div class="tool-card text-center">
          <h3 class="tool-title">🎋 たけのこニョッキ カウンター</h3>

          <div class="setting-group my-3">
            <label class="setting-label">参加人数: <span class="badge-num">${state.playerCount}人</span></label>
            <input type="range" class="range-slider" min="3" max="10" value="${state.playerCount}" id="range-takenoko">
          </div>

          <div class="takenoko-display-box my-4">
            <div class="takenoko-count font-black font-mono">${state.currentCount === 0 ? '準備中' : `${state.currentCount} ニョッキ！`}</div>
            <small class="text-muted">「たけのこたけのこニョッキッキ！」でスタート！</small>
          </div>

          <div class="flex gap-2 justify-center">
            <button class="btn btn-success btn-lg flex-1" id="btn-takenoko-next">
              🌱 次のニョッキ！ (+${state.currentCount + 1})
            </button>
            <button class="btn btn-danger btn-lg" id="btn-takenoko-foul">💥 被った！</button>
          </div>

          <button class="btn btn-outline btn-block mt-3" id="btn-takenoko-reset">ゲームやり直し 🔄</button>
        </div>
      `;

      container.querySelector("#range-takenoko").addEventListener("input", (e) => {
        state.playerCount = parseInt(e.target.value);
        update();
      });

      container.querySelector("#btn-takenoko-next").addEventListener("click", () => {
        state.currentCount++;
        Sound.playCountBeep(false);
        update();
      });

      container.querySelector("#btn-takenoko-foul").addEventListener("click", () => {
        Sound.playWrong();
        Sound.hapticExplosion();
        if (typeof window !== "undefined" && window.StampRally) {
          window.StampRally.markPlayed("takenoko-nyokki");
        }
        Toast.warning("💥 被り発生！被った人は罰ゲームです！");
      });

      container.querySelector("#btn-takenoko-reset").addEventListener("click", () => {
        Sound.playClick();
        state.currentCount = 0;
        update();
      });
    }

    update();
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
      container.innerHTML = `
        <div class="tool-card text-center">
          <h3 class="tool-title">📈 数当てゲーム (High & Low)</h3>

          <div class="btn-toggle-group my-3">
            <button class="btn-toggle ${state.maxRange === 100 ? 'active' : ''}" data-range="100">1〜100</button>
            <button class="btn-toggle ${state.maxRange === 1000 ? 'active' : ''}" data-range="1000">1〜1000 (激ムズ)</button>
          </div>

          <div class="highlow-range-box my-3">
            <div class="range-text">絞り込み範囲: <strong class="text-primary font-mono">${state.min} 〜 ${state.max}</strong></div>
            <div class="attempt-badge mt-1">コール回数: ${state.attempts}回</div>
          </div>

          ${!state.isWon ? `
            <div class="input-group my-3 flex gap-2 justify-center">
              <input type="number" class="input-num" id="input-highlow-guess" placeholder="予想数字を入力">
              <button class="btn btn-primary" id="btn-highlow-submit">判定！</button>
            </div>
          ` : `
            <div class="won-box my-3 animate-bounce">
              <h2 class="text-success">🎉 正解！数字は【${state.target}】でした！</h2>
              <button class="btn btn-primary mt-2" id="btn-highlow-restart">次の問題へ 🔄</button>
            </div>
          `}

          <div class="history-list mt-3">
            ${state.history.map(h => `
              <div class="history-item ${h.result === 'HIGH' ? 'text-danger' : h.result === 'LOW' ? 'text-primary' : 'text-success'}">
                ${h.guess} ➔ ${h.result === 'HIGH' ? 'もっと下！(HIGH)' : h.result === 'LOW' ? 'もっと上！(LOW)' : '🎯 BINGO!!'}
              </div>
            `).reverse().join('')}
          </div>
        </div>
      `;

      container.querySelectorAll("[data-range]").forEach(btn => {
        btn.addEventListener("click", () => {
          state.maxRange = parseInt(btn.dataset.range);
          resetGame();
          update();
        });
      });

      const submitBtn = container.querySelector("#btn-highlow-submit");
      if (submitBtn) {
        submitBtn.addEventListener("click", doGuess);
      }

      const restartBtn = container.querySelector("#btn-highlow-restart");
      if (restartBtn) {
        restartBtn.addEventListener("click", () => {
          resetGame();
          update();
        });
      }
    }

    function doGuess() {
      const inp = container.querySelector("#input-highlow-guess");
      const val = parseInt(inp.value);
      if (isNaN(val)) return;
      state.attempts++;

      if (val === state.target) {
        state.isWon = true;
        Sound.playFanfare();
        Sound.playJajan();
        if (typeof Confetti !== "undefined") Confetti.launch();
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
      showSecret: false
    };

    function update() {
      container.innerHTML = `
        <div class="tool-card text-center">
          <h3 class="tool-title">🚪 20の扉 (20 Questions) ログボード</h3>

          <div class="remaining-badge-box my-3">
            <span class="badge badge-info">残り質問可能数</span>
            <div class="remaining-count ${state.remaining <= 5 ? 'text-danger' : 'text-primary'} font-black font-mono">
              ${state.remaining} / 20
            </div>
          </div>

          ${topicList.length > 0 ? `
            <div class="secret-topic-drawer my-3 p-3 bg-light border rounded">
              <div class="flex gap-2 justify-center">
                <button class="btn btn-sm btn-outline" id="btn-draw-secret">出題者用：お題を引く 🎲</button>
                ${state.secretTopic ? `
                  <button class="btn btn-sm btn-secondary" id="btn-toggle-secret">
                    ${state.showSecret ? 'お題を隠す 🔒' : 'お題を見る 👁️'}
                  </button>
                ` : ''}
              </div>
              ${state.secretTopic && state.showSecret ? `
                <div class="secret-topic-display mt-2 font-bold text-primary animate-fade-in">
                  【秘密のお題】 ${escapeHTML(extractTopicText(state.secretTopic))}
                </div>
              ` : ''}
            </div>
          ` : ''}

          <div class="flex gap-2 justify-center my-3">
            <button class="btn btn-success flex-1" id="btn-log-yes">⭕ はい (YES)</button>
            <button class="btn btn-danger flex-1" id="btn-log-no">❌ いいえ (NO)</button>
            <button class="btn btn-outline flex-1" id="btn-log-irrelevant">❓ 関係ない</button>
          </div>

          <div class="history-list mt-4">
            <h4 class="text-sm font-bold text-muted">質問ログ:</h4>
            ${state.logs.map((l, i) => `
              <div class="log-item">
                Q${i + 1}: ${l.type === 'YES' ? '<span class="text-success font-bold">⭕ YES</span>' : l.type === 'NO' ? '<span class="text-danger font-bold">❌ NO</span>' : '<span class="text-muted">❓ 関係なし</span>'}
              </div>
            `).reverse().join('')}
          </div>

          <button class="btn btn-outline btn-block mt-3" id="btn-reset-twenty">リセット 🔄</button>
        </div>
      `;

      if (container.querySelector("#btn-draw-secret")) {
        container.querySelector("#btn-draw-secret").addEventListener("click", () => {
          Sound.playSelect();
          state.secretTopic = drawShuffledTopic(game.id || "twenty-questions", topicList);
          state.showSecret = true;
          update();
        });
      }

      if (container.querySelector("#btn-toggle-secret")) {
        container.querySelector("#btn-toggle-secret").addEventListener("click", () => {
          state.showSecret = !state.showSecret;
          update();
        });
      }

      container.querySelector("#btn-log-yes").addEventListener("click", () => addLog("YES"));
      container.querySelector("#btn-log-no").addEventListener("click", () => addLog("NO"));
      container.querySelector("#btn-log-irrelevant").addEventListener("click", () => addLog("IRRELEVANT"));
      container.querySelector("#btn-reset-twenty").addEventListener("click", () => {
        state.remaining = 20;
        state.logs = [];
        state.secretTopic = null;
        state.showSecret = false;
        update();
      });
    }

    function addLog(type) {
      if (state.remaining <= 0) return;
      state.remaining--;
      state.logs.push({ type });
      if (typeof window !== "undefined" && window.StampRally) {
        window.StampRally.markPlayed("twenty-questions");
      }
      if (type === "YES") Sound.playCorrect();
      else if (type === "NO") Sound.playWrong();
      else Sound.playClick();
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
      turnType: "good", // "good" or "bad"
      storyCount: 1,
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
          Sound.playWrong();
          Toast.warning("⏱️ 30秒経過！そろそろニュースを繋げよう！");
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
      container.innerHTML = `
        <div class="tool-card text-center">
          <div class="flex justify-between items-center mb-1">
            <h3 class="tool-title" style="margin:0;">📰 良いニュースと悪いニュース</h3>
            <span class="badge badge-info text-xs">第${state.storyCount}話</span>
          </div>

          <div class="topic-box my-3">
            <span class="topic-tag">導入シチュエーション</span>
            <div class="topic-text font-bold">${escapeHTML(state.current)}</div>
            <button class="btn btn-sm btn-outline mt-2" id="btn-next-situation">お題チェンジ 🎲</button>
          </div>

          <!-- ターンインジケーター -->
          <div class="p-3 my-3 rounded" style="background: ${isGood ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}; border: 2px solid ${isGood ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'};">
            <div class="text-xs font-bold ${isGood ? 'text-success' : 'text-danger'} mb-1">
              ${isGood ? '✨ ポジティブに受ける番' : '⚠️ ハプニングを起こす番'}
            </div>
            <div class="font-black text-xl ${isGood ? 'text-success' : 'text-danger'} animate-scale">
              ${isGood ? '「良いニュースは、〇〇です！」' : '「しかし悪いニュースは、〇〇です！」'}
            </div>
            <div class="mt-2 flex justify-between items-center px-2">
              <span class="text-xs text-muted">シンキングタイム:</span>
              <span id="goodbad-timer" class="font-mono font-bold text-sm text-sub">${state.timerSec}秒</span>
            </div>
          </div>

          <div class="flex flex-col gap-2 mt-3">
            <button class="btn btn-primary btn-block btn-lg py-3 font-bold" id="btn-next-turn">
              🗣️ 語り終わった！交代 (${isGood ? '悪いニュースへ' : '良いニュースへ'}) ➔
            </button>
            <div class="flex gap-2">
              <button class="btn btn-outline flex-1 btn-sm" id="btn-start-timer">
                ⏱️ 30秒タイマー
              </button>
              <button class="btn btn-success flex-1 btn-sm" id="btn-story-finish">
                🎉 オチがついた！完結
              </button>
            </div>
          </div>
        </div>
      `;

      container.querySelector("#btn-next-situation").addEventListener("click", () => {
        Sound.playClick();
        state.current = extractTopicText(drawShuffledTopic(game.id || "good-bad-news", state.situations)) || "無人島に漂着した";
        state.turnType = "good";
        state.storyCount = 1;
        stopTimer();
        render();
      });

      container.querySelector("#btn-next-turn").addEventListener("click", () => {
        Sound.playSelect();
        state.turnType = state.turnType === "good" ? "bad" : "good";
        state.storyCount++;
        startTimer();
        render();
      });

      container.querySelector("#btn-start-timer").addEventListener("click", () => {
        startTimer();
      });

      container.querySelector("#btn-story-finish").addEventListener("click", () => {
        stopTimer();
        Sound.playFanfare();
        if (typeof window !== "undefined" && window.StampRally) {
          window.StampRally.markPlayed("good-and-bad-news");
        }
        Toast.success(`🎊 第${state.storyCount}話で見事オチがつきました！拍手！`);
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
      turn: 1
    };

    function update() {
      container.innerHTML = `
        <div class="tool-card text-center">
          <h3 class="tool-title">🔢 30言ったら負けゲーム (21ゲーム)</h3>

          <div class="btn-toggle-group my-3">
            <button class="btn-toggle ${state.target === 21 ? 'active' : ''}" data-target="21">21ゲーム</button>
            <button class="btn-toggle ${state.target === 30 ? 'active' : ''}" data-target="30">30ゲーム</button>
          </div>

          <div class="count-display-box my-4">
            <span class="badge badge-warning">現在のカウント</span>
            <div class="current-number font-black font-mono ${state.current >= state.target - 3 ? 'text-danger' : 'text-primary'}">
              ${state.current} / ${state.target}
            </div>
            <small class="text-muted">${state.target} を言わされたプレイヤーが敗北！</small>
          </div>

          <div class="flex gap-2 justify-center my-3">
            <button class="btn btn-primary btn-lg flex-1" data-add="1">+1個進める</button>
            <button class="btn btn-primary btn-lg flex-1" data-add="2">+2個進める</button>
            <button class="btn btn-primary btn-lg flex-1" data-add="3">+3個進める</button>
          </div>

          <button class="btn btn-outline btn-block mt-3" id="btn-reset-count30">ゲームやり直し 🔄</button>
        </div>
      `;

      container.querySelectorAll("[data-target]").forEach(btn => {
        btn.addEventListener("click", () => {
          state.target = parseInt(btn.dataset.target);
          state.current = 0;
          update();
        });
      });

      container.querySelectorAll("[data-add]").forEach(btn => {
        btn.addEventListener("click", () => {
          const add = parseInt(btn.dataset.add);
          state.current += add;
          Sound.playClick();
          Sound.hapticMedium();
          if (state.current >= state.target) {
            Sound.playExplosion();
            if (typeof window !== "undefined" && window.StampRally) {
              window.StampRally.markPlayed("counting-game-30");
            }
            Toast.warning(`💥 ${state.target}に到達！言った人の負けです！`);
            state.current = 0;
          }
          update();
        });
      });

      container.querySelector("#btn-reset-count30").addEventListener("click", () => {
        state.current = 0;
        update();
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
      timerRunning: false,
      timerInterval: null
    };

    function startTimer() {
      if (state.timerInterval) {
        safeClearInterval(state.timerInterval);
        state.timerInterval = null;
      }
      state.timerSec = state.timerMax;
      state.timerRunning = true;
      Sound.playTick(1000);
      updateTimerDisplay();

      state.timerInterval = safeSetInterval(() => {
        state.timerSec--;
        if (state.timerSec > 0) {
          Sound.playTick(800 + (state.timerMax - state.timerSec) * 50);
        } else {
          safeClearInterval(state.timerInterval);
          state.timerInterval = null;
          state.timerRunning = false;
          Sound.playWrong();
          Sound.hapticExplosion();
          if (typeof window !== "undefined" && window.StampRally) {
            window.StampRally.markPlayed("word-chain-limit");
          }
          Toast.warning("💥 制限時間オーバー！即死アウト！");
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
      state.timerSec = state.timerMax;
      updateTimerDisplay();
    }

    function updateTimerDisplay() {
      const el = container.querySelector("#word-chain-timer");
      const btn = container.querySelector("#btn-timer-toggle");
      if (el) {
        el.textContent = `${state.timerSec}秒`;
        el.className = "font-black font-mono text-4xl my-2 " + (state.timerSec <= 2 ? "text-danger animate-pulse" : "text-primary");
      }
      if (btn) {
        btn.innerHTML = state.timerRunning ? "🔄 次の人へ！ (タイマーリセット)" : "⏱️ タイマースタート！";
        btn.className = state.timerRunning ? "btn btn-warning btn-block btn-lg font-black py-4 pulse-scale" : "btn btn-primary btn-block btn-lg font-black py-4";
      }
    }

    function render() {
      container.innerHTML = `
        <div class="tool-card text-center">
          <h3 class="tool-title">🔗 縛りしりとり (即死スピードタイマー)</h3>

          <div class="topic-box my-3">
            <span class="topic-tag">発動中の縛りルール</span>
            <div class="topic-text font-black text-xl text-danger my-1">${escapeHTML(state.currentRule)}</div>
            <button class="btn btn-sm btn-outline mt-1" id="btn-next-rule">ルールを変える 🎲</button>
          </div>

          <div class="setting-group my-2">
            <label class="setting-label text-xs">制限時間:</label>
            <div class="btn-toggle-group">
              <button class="btn-toggle ${state.timerMax === 3 ? 'active' : ''}" data-timer-sec="3">⚡ 3秒 (激ムズ即死)</button>
              <button class="btn-toggle ${state.timerMax === 5 ? 'active' : ''}" data-timer-sec="5">⏱️ 5秒 (標準)</button>
              <button class="btn-toggle ${state.timerMax === 10 ? 'active' : ''}" data-timer-sec="10">🍵 10秒 (初心者)</button>
            </div>
          </div>

          <div class="p-4 my-3 border rounded text-center" style="background: rgba(0,0,0,0.02);">
            <div id="word-chain-timer" class="font-black font-mono text-4xl text-primary my-2">${state.timerSec}秒</div>
            <button class="btn ${state.timerRunning ? 'btn-warning pulse-scale' : 'btn-primary'} btn-block btn-lg font-black py-4 mt-2" id="btn-timer-toggle">
              ${state.timerRunning ? '🔄 次の人へ！ (タイマーリセット)' : '⏱️ タイマースタート！'}
            </button>
          </div>

          <div class="flex gap-2 mt-3">
            <button class="btn btn-danger flex-1 font-bold" id="btn-chain-foul">
              💥 詰まり・アウト判定！
            </button>
            <button class="btn btn-secondary font-bold" id="btn-chain-batsu">
              ⚡ 罰ゲーム
            </button>
          </div>
        </div>
      `;

      container.querySelector("#btn-next-rule").addEventListener("click", () => {
        Sound.playDrumRoll(0.8);
        safeSetTimeout(() => {
          Sound.playJajan();
          state.currentRule = extractTopicText(drawShuffledTopic(game.id || "word-chain", state.rules)) || "3文字固定";
          render();
        }, 800);
      });

      container.querySelectorAll("[data-timer-sec]").forEach(btn => {
        btn.addEventListener("click", () => {
          Sound.playClick();
          state.timerMax = parseInt(btn.dataset.timerSec);
          state.timerSec = state.timerMax;
          if (state.timerRunning) startTimer();
          render();
        });
      });

      container.querySelector("#btn-timer-toggle").addEventListener("click", () => {
        startTimer();
      });

      container.querySelector("#btn-chain-foul").addEventListener("click", () => {
        stopTimer();
        Sound.playWrong();
        Sound.hapticExplosion();
        if (typeof window !== "undefined" && window.StampRally) {
          window.StampRally.markPlayed("word-chain-limit");
        }
        Toast.warning("💥 詰まり・言葉が出ない！アウトです！");
      });

      container.querySelector("#btn-chain-batsu").addEventListener("click", () => {
        Sound.playSelect();
        if (typeof window.openBatsuModal === "function") window.openBatsuModal();
      });
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
          <h3 class="tool-title text-center">🎭 嘘つき自己紹介（2真1偽）</h3>
          <p class="text-sm text-muted text-center mb-3">本当の出来事2つと、真っ赤な嘘1つを入力してシャッフル！</p>

          ${promptList.length > 0 ? `
            <div class="mb-3 text-center">
              <button class="btn btn-sm btn-outline" id="btn-suggest-prompt">🎲 ネタのヒントを引く</button>
              ${state.suggestedPrompt ? `
                <div class="mt-2 text-xs font-bold text-primary animate-fade-in p-2 bg-light rounded border">
                  💡 テーマ例: ${escapeHTML(extractTopicText(state.suggestedPrompt))}
                </div>
              ` : ''}
            </div>
          ` : ''}

          <div class="setting-group">
            <input type="text" class="input-player-name mb-2" id="input-ep1" placeholder="本当のエピソード 1" value="${escapeHTML(state.ep1)}">
            <input type="text" class="input-player-name mb-2" id="input-ep2" placeholder="本当のエピソード 2" value="${escapeHTML(state.ep2)}">
            <input type="text" class="input-player-name mb-2" id="input-ep3" placeholder="真っ赤な嘘のエピソード" value="${escapeHTML(state.ep3)}">
          </div>

          <button class="btn btn-primary btn-block btn-lg" id="btn-shuffle-truths">
            シャッフルしてお披露目！ ➔
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
        state.ep1 = container.querySelector("#input-ep1").value.trim() || "本当のエピソードA";
        state.ep2 = container.querySelector("#input-ep2").value.trim() || "本当のエピソードB";
        state.ep3 = container.querySelector("#input-ep3").value.trim() || "嘘のエピソード";

        const arr = [
          { text: state.ep1, isLie: false },
          { text: state.ep2, isLie: false },
          { text: state.ep3, isLie: true }
        ].sort(() => Math.random() - 0.5);

        Sound.playSelect();
        showRevealed(arr);
      });
    }

    function showRevealed(items) {
      container.innerHTML = `
        <div class="tool-card text-center">
          <h3 class="tool-title">🎭 嘘はどれだ！？</h3>
          <p class="text-sm text-muted">質問をしながら、どれが真っ赤な嘘か見抜こう！</p>

          <div class="my-4">
            ${items.map((item, idx) => `
              <div class="topic-box mb-2" id="truth-card-${idx}">
                <div class="font-bold">#${idx + 1}: ${escapeHTML(item.text)}</div>
                <button class="btn btn-sm btn-outline mt-2 btn-check-lie" data-lie="${item.isLie}">
                  これを開示！ 👁️
                </button>
              </div>
            `).join('')}
          </div>

          <button class="btn btn-outline btn-block" id="btn-restart-truths">もう一度作成 🔄</button>
        </div>
      `;

      container.querySelectorAll(".btn-check-lie").forEach(btn => {
        btn.addEventListener("click", () => {
          const isLie = btn.dataset.lie === "true";
          if (typeof window !== "undefined" && window.StampRally) {
            window.StampRally.markPlayed("two-truths-one-lie");
          }
          if (isLie) {
            Sound.playFanfare();
            Sound.playJajan();
            btn.parentElement.classList.add("card-error");
            btn.parentElement.innerHTML += '<div class="text-danger font-black mt-1">💥 これが真っ赤な嘘でした！</div>';
          } else {
            Sound.playWrong();
            btn.parentElement.innerHTML += '<div class="text-success font-bold mt-1">⭕ これは本当の話です！</div>';
          }
          btn.remove();
        });
      });

      container.querySelector("#btn-restart-truths").addEventListener("click", update);
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
  renderGesture(container, game) {
    let state = {
      score: 0,
      timeLeft: 60,
      isPlaying: false,
      timerId: null,
      currentTopic: ""
    };

    function getRandomTopic() {
      const item = drawShuffledTopic(game.id, game.presets);
      if (!item) return "ゴリラがバナナを食べているところ";
      return extractTopicText(item);
    }

    state.currentTopic = getRandomTopic();

    function update() {
      container.innerHTML = `
        <div class="tool-card text-center">
          <h3 class="tool-title">🤫 サイレント・ジェスチャーゲーム</h3>

          <div class="gesture-score-badge my-2">
            正解数: <strong class="badge-num font-mono">${state.score}</strong> 問
          </div>

          <div class="topic-box my-4">
            <span class="topic-tag">🎭 ジェスチャーお題</span>
            <div class="topic-text font-black text-xl">${escapeHTML(state.currentTopic)}</div>
          </div>

          <div class="timer-display font-mono text-2xl ${state.timeLeft <= 10 ? 'text-danger animate-pulse' : 'text-primary'}">
            ⏱️ 残り: ${state.timeLeft} 秒
          </div>

          <div class="flex gap-2 justify-center my-3">
            ${!state.isPlaying ? `
              <button class="btn btn-primary btn-lg flex-1" id="btn-gesture-start">スタート！ (60秒)</button>
            ` : `
              <button class="btn btn-success btn-lg flex-1" id="btn-gesture-correct">⭕ 正解！次へ</button>
              <button class="btn btn-outline btn-lg" id="btn-gesture-pass">パス ➔</button>
            `}
          </div>
        </div>
      `;

      const startBtn = container.querySelector("#btn-gesture-start");
      if (startBtn) {
        startBtn.addEventListener("click", () => {
          Sound.playSelect();
          state.isPlaying = true;
          state.score = 0;
          state.timeLeft = 60;
          state.currentTopic = getRandomTopic();
          update();

          if (state.timer) state.timer.destroy();
          state.timer = new GameTimer({
            totalSeconds: 60,
            tickSoundInterval: 10,
            title: "サイレントジェスチャー",
            gameId: "silent-gesture",
            onTick: (rem) => {
              state.timeLeft = rem;
              const timerEl = container.querySelector(".timer-display");
              if (timerEl) timerEl.textContent = `⏱️ 残り: ${rem} 秒`;
            },
            onFinish: () => {
              state.isPlaying = false;
              Sound.playExplosion();
              if (typeof window !== "undefined" && window.StampRally) {
                window.StampRally.markPlayed("silent-gesture");
              }
              Toast.success(`🎉 終了！合計 ${state.score} 問正解でした！`);
              update();
            }
          });
          state.timer.start();
        });
      }

      const correctBtn = container.querySelector("#btn-gesture-correct");
      if (correctBtn) {
        correctBtn.addEventListener("click", () => {
          Sound.playCorrect();
          state.score++;
          state.currentTopic = getRandomTopic();
          update();
        });
      }

      const passBtn = container.querySelector("#btn-gesture-pass");
      if (passBtn) {
        passBtn.addEventListener("click", () => {
          Sound.playClick();
          state.currentTopic = getRandomTopic();
          update();
        });
      }
    }

    update();
    return () => {
      if (state.timer) state.timer.destroy();
      if (state.timerId) safeClearInterval(state.timerId);
    };
  }
};

window.DeckManager = DeckManager;
GameTools.toHiragana = toHiragana;
window.GameTools = GameTools;
