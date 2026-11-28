/**
 * あそびポケット (Asobi Pocket)
 * メインアプリケーション制御（堅牢・ライフサイクル管理版）
 */

// アフィリエイト・検索URLマネージャー (グローバル・防御的定義)
const AFFILIATE_CONFIG = {
  amazonTag: "katakatalab-22",
  getAmazonUrl(keyword) {
    try {
      const q = encodeURIComponent(keyword || "ボードゲーム パーティーゲーム");
      return `https://www.amazon.co.jp/s?k=${q}&tag=${this.amazonTag}`;
    } catch (e) {
      return "https://www.amazon.co.jp/";
    }
  },
  getRakutenUrl(keyword) {
    try {
      const q = encodeURIComponent(keyword || "ボードゲーム パーティーゲーム");
      return `https://search.rakuten.co.jp/search/mall/${q}/`;
    } catch (e) {
      return "https://search.rakuten.co.jp/";
    }
  }
};
window.AFFILIATE_CONFIG = AFFILIATE_CONFIG;

// GA4 イベントトラッカー（防御的）
const Analytics = {
  track(eventName, params = {}) {
    try {
      if (typeof window.gtag === "function") {
        window.gtag("event", eventName, params);
      }
    } catch (e) {}
  },
  trackPageView(pagePath, pageTitle) {
    try {
      if (typeof window.gtag === "function") {
        window.gtag("event", "page_view", {
          page_path: pagePath,
          page_title: pageTitle
        });
      }
    } catch (e) {}
  }
};
window.Analytics = Analytics;

document.addEventListener("DOMContentLoaded", () => {
  // HTMLエスケープ（tools.jsと安全に共有・フォールバック付き）
  const escapeHTML = window.escapeHTML || function (str) {
    if (typeof str !== "string") return String(str || "");
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // 安全なlocalStorageラッパー
  const Storage = {
    get(key, defaultVal) {
      try {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : defaultVal;
      } catch (e) {
        return defaultVal;
      }
    },
    set(key, val) {
      try {
        localStorage.setItem(key, JSON.stringify(val));
      } catch (e) {}
    }
  };

  // 画面自動スリープ防止マネージャー (Wake Lock API) - デフォルトOFF
  const WakeLockManager = {
    sentinel: null,
    isEnabled: Storage.get("asobi_wakelock_enabled", false),
    async request() {
      if (!this.isEnabled) return;
      if ("wakeLock" in navigator) {
        try {
          this.sentinel = await navigator.wakeLock.request("screen");
        } catch (err) {
          console.warn("WakeLock request:", err);
        }
      }
    },
    async release() {
      if (this.sentinel) {
        try {
          await this.sentinel.release();
          this.sentinel = null;
        } catch (err) {
          console.warn("WakeLock release:", err);
        }
      }
    },
    setEnabled(enabled) {
      this.isEnabled = enabled;
      Storage.set("asobi_wakelock_enabled", enabled);
      if (enabled) {
        this.request();
      } else {
        this.release();
      }
    }
  };

  // 安全なタイマーライフサイクルマネージャー（メモリリーク・バックグラウンド動作の防止）
  const SafeTimer = {
    timers: new Set(),
    intervals: new Set(),
    setTimeout(fn, ms) {
      const id = window.setTimeout(() => {
        this.timers.delete(id);
        fn();
      }, ms);
      this.timers.add(id);
      return id;
    },
    clearTimeout(id) {
      window.clearTimeout(id);
      this.timers.delete(id);
    },
    setInterval(fn, ms) {
      const id = window.setInterval(fn, ms);
      this.intervals.add(id);
      return id;
    },
    clearInterval(id) {
      window.clearInterval(id);
      this.intervals.delete(id);
    },
    clearAll() {
      this.timers.forEach(id => window.clearTimeout(id));
      this.timers.clear();
      this.intervals.forEach(id => window.clearInterval(id));
      this.intervals.clear();
    }
  };
  window.SafeTimer = SafeTimer;

  // モーダル一元管理マネージャー（WAI-ARIA FocusTrap & inert & ScrollLock）
  const ModalManager = {
    activeModal: null,
    lastActiveElement: null,

    open(modalOrId) {
      const modal = typeof modalOrId === "string" ? document.getElementById(modalOrId) : modalOrId;
      if (!modal) return;
      this.lastActiveElement = document.activeElement;
      modal.classList.remove("hidden");
      modal.setAttribute("aria-hidden", "false");
      this.activeModal = modal;
      document.body.classList.add("modal-open");
      Sound.playClick();

      this._setInertBackground(true);
      if (modal.id === "modal-settings") {
        const opener = document.getElementById("btn-open-settings");
        if (opener) opener.setAttribute("aria-expanded", "true");
      }

      // フォーカス移動（最初のインタラクティブ要素へ）
      const focusables = this._getFocusables(modal);
      if (focusables.length > 0) {
        focusables[0].focus();
      }
    },

    close(modalOrId) {
      const modal = modalOrId ? (typeof modalOrId === "string" ? document.getElementById(modalOrId) : modalOrId) : this.activeModal;
      if (!modal || modal.classList.contains("hidden")) return false;
      modal.classList.add("hidden");
      modal.setAttribute("aria-hidden", "true");
      if (this.activeModal === modal) {
        this.activeModal = null;
      }
      if (modal.id === "modal-settings") {
        const opener = document.getElementById("btn-open-settings");
        if (opener) opener.setAttribute("aria-expanded", "false");
      }

      // 開いている他のモーダルがないか確認
      const anyOpen = Array.from(document.querySelectorAll(".modal-backdrop, .modal-overlay")).some(m => !m.classList.contains("hidden"));
      if (!anyOpen) {
        document.body.classList.remove("modal-open");
        this._setInertBackground(false);
      }

      Sound.playClick();
      if (modal.id === "modal-talk-focus" && typeof TalkFocus !== "undefined" && TalkFocus.close) {
        TalkFocus.close();
      }
      if (typeof window.__cleanupActiveModal === "function") {
        window.__cleanupActiveModal(modal.id);
      }

      // フォーカス復帰
      if (this.lastActiveElement && typeof this.lastActiveElement.focus === "function") {
        this.lastActiveElement.focus();
        this.lastActiveElement = null;
      }
      return true;
    },

    closeAll() {
      const modals = document.querySelectorAll(".modal-backdrop, .modal-overlay");
      let closedAny = false;
      modals.forEach(m => {
        if (!m.classList.contains("hidden")) {
          m.classList.add("hidden");
          m.setAttribute("aria-hidden", "true");
          if (m.id === "modal-settings") {
            const opener = document.getElementById("btn-open-settings");
            if (opener) opener.setAttribute("aria-expanded", "false");
          }
          closedAny = true;
        }
      });
      const drawer = document.getElementById("scoreboard-drawer");
      const scoreboardBackdrop = document.getElementById("scoreboard-backdrop");
      const scoreboardToggle = document.getElementById("btn-toggle-scoreboard");
      if (drawer && !drawer.classList.contains("hidden")) {
        drawer.classList.add("hidden");
        drawer.setAttribute("aria-hidden", "true");
        closedAny = true;
      }
      if (scoreboardBackdrop && !scoreboardBackdrop.classList.contains("hidden")) {
        scoreboardBackdrop.classList.add("hidden");
        scoreboardBackdrop.setAttribute("aria-hidden", "true");
      }
      if (scoreboardToggle) {
        scoreboardToggle.setAttribute("aria-expanded", "false");
      }
      document.body.classList.remove("modal-open");
      this._setInertBackground(false);
      this.activeModal = null;
      if (this.lastActiveElement && this.lastActiveElement.isConnected) {
        this.lastActiveElement.focus();
        this.lastActiveElement = null;
      }
      if (closedAny) {
        Sound.playClick();
        if (typeof TalkFocus !== "undefined" && typeof TalkFocus.close === "function") {
          TalkFocus.close();
        }
        if (typeof window.__cleanupActiveModal === "function") {
          window.__cleanupActiveModal();
        }
      }
      return closedAny;
    },

    _getFocusables(el) {
      return Array.from(el.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )).filter(node => node.offsetWidth > 0 || node.offsetHeight > 0 || node === document.activeElement);
    },

    _setInertBackground(isInert) {
      const bgTargets = [
        document.querySelector(".site-header"),
        document.getElementById("view-home"),
        document.getElementById("view-detail"),
        document.querySelector(".site-footer"),
        document.querySelector(".bottom-nav-bar"),
        document.getElementById("btn-toggle-scoreboard")
      ];
      bgTargets.forEach(el => {
        if (!el) return;
        if (isInert) {
          el.setAttribute("aria-hidden", "true");
          if ("inert" in el) el.inert = true;
        } else {
          el.removeAttribute("aria-hidden");
          if ("inert" in el) el.inert = false;
        }
      });
    },

    handleKeyDown(e) {
      if (e.key === "Escape") {
        if (this.closeAll()) {
          e.preventDefault();
          e.stopPropagation();
        }
        return;
      }
      if (e.key === "Tab" && this.activeModal) {
        const focusables = this._getFocusables(this.activeModal);
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first || !this.activeModal.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !this.activeModal.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }
  };
  window.ModalManager = ModalManager;

  document.addEventListener("keydown", (e) => ModalManager.handleKeyDown(e));

  // カスタムお題 ＆ スキップ除外マネージャー
  const TopicManager = {
    getCustomTopics(gameId) {
      const data = Storage.get("asobi_custom_topics", {});
      return data[gameId] || [];
    },
    addCustomTopic(gameId, topic, index = null) {
      const isQuiz = gameId === "sea-turtle" && topic && typeof topic === "object";
      const value = isQuiz ? {question: topic.question.trim(), answer: topic.answer.trim()} : String(topic || "").trim();
      if (isQuiz ? !value.question || !value.answer : !value) return false;
      if (gameId === "word-wolf" && !customWolfPair(value)) return false;
      const data = Storage.get("asobi_custom_topics", {});
      if (!data[gameId]) data[gameId] = [];
      if (index === null) data[gameId].push(value);
      else if (Number.isInteger(index) && index >= 0 && index < data[gameId].length) data[gameId][index] = value;
      else return false;
      Storage.set("asobi_custom_topics", data);
      return true;
    },
    removeCustomTopic(gameId, index) {
      const data = Storage.get("asobi_custom_topics", {});
      if (data[gameId]) {
        data[gameId].splice(index, 1);
        Storage.set("asobi_custom_topics", data);
      }
    },
    getExcludedTopics(gameId) {
      const data = Storage.get("asobi_excluded_topics", {});
      return data[gameId] || [];
    },
    excludeTopic(gameId, topic) {
      const data = Storage.get("asobi_excluded_topics", {});
      if (!data[gameId]) data[gameId] = [];
      if (!data[gameId].includes(topic)) {
        data[gameId].push(topic);
        Storage.set("asobi_excluded_topics", data);
      }
    },
    unexcludeTopic(gameId, topic) {
      const data = Storage.get("asobi_excluded_topics", {});
      if (data[gameId]) {
        data[gameId] = data[gameId].filter(t => t !== topic);
        Storage.set("asobi_excluded_topics", data);
      }
    },
    clearExcludedTopics(gameId) {
      const data = Storage.get("asobi_excluded_topics", {});
      if (data[gameId]) {
        delete data[gameId];
        Storage.set("asobi_excluded_topics", data);
      }
    },
    getActiveTopics(gameId, presetTopics = []) {
      const custom = this.getCustomTopics(gameId);
      const excluded = this.getExcludedTopics(gameId);
      const combined = [...presetTopics, ...custom];
      const filtered = combined.filter(t => {
        const str = typeof t === "string" ? t : (t.text || t.title || t.question || t.q || t.word || t.citizen || t.common || JSON.stringify(t));
        return !excluded.includes(str);
      });
      return filtered.length > 0 ? filtered : combined;
    }
  };
  window.TopicManager = TopicManager;

  // 万能ミニスコアボード
  const ScoreBoard = {
    players: Storage.get("asobi_scoreboard_players", [
      { name: "プレイヤー1", score: 0 },
      { name: "プレイヤー2", score: 0 }
    ]),
    save() {
      Storage.set("asobi_scoreboard_players", this.players);
    },
    addPlayer(name) {
      const n = name && name.trim() ? name.trim() : `プレイヤー${this.players.length + 1}`;
      this.players.push({ name: n, score: 0 });
      this.save();
      this.render();
    },
    removePlayer(index) {
      if (this.players.length <= 1) {
        Toast.warning("プレイヤーは1人以上必要です");
        return;
      }
      this.players.splice(index, 1);
      this.save();
      this.render();
    },
    changeScore(index, delta) {
      if (this.players[index]) {
        this.players[index].score += delta;
        Sound.playClick();
        this.save();
        const container = document.getElementById("scoreboard-players-list");
        if (container && container.children[index]) {
          const valEl = container.children[index].querySelector(".score-value");
          if (valEl) {
            valEl.textContent = this.players[index].score;
            valEl.className = `score-value ${this.players[index].score > 0 ? 'score-pos' : this.players[index].score < 0 ? 'score-neg' : ''}`;
            return;
          }
        }
        this.render();
      }
    },
    renamePlayer(index, newName) {
      if (this.players[index]) {
        const trimmed = (newName || "").trim();
        this.players[index].name = trimmed || `プレイヤー${index + 1}`;
        this.save();
      }
    },
    resetScores() {
      this.players.forEach(p => p.score = 0);
      this.save();
      this.render();
    },
    render() {
      const container = document.getElementById("scoreboard-players-list");
      if (!container) return;
      container.innerHTML = this.players.map((p, idx) => `
        <div class="scoreboard-row">
          <input type="text" class="score-player-name" value="${escapeHTML(p.name)}" data-idx="${idx}" placeholder="名前">
          <div class="score-controls">
            <button class="btn-score-ctrl btn-score-minus" data-action="minus" data-idx="${idx}" aria-label="1点減点">−</button>
            <span class="score-value ${p.score > 0 ? 'score-pos' : p.score < 0 ? 'score-neg' : ''}">${p.score}</span>
            <button class="btn-score-ctrl btn-score-plus" data-action="plus" data-idx="${idx}" aria-label="1点加点">＋</button>
            ${this.players.length > 1 ? `<button class="btn-score-del" data-action="del" data-idx="${idx}" title="削除">✕</button>` : ''}
          </div>
        </div>
      `).join("");
    }
  };
  window.ScoreBoard = ScoreBoard;

  // ==========================================
  // ⑧ 全ゲーム制覇スタンプラリーマネージャー (動的算出)
  // ==========================================
  const StampRally = {
    played: Storage.get("asobi_played_games", []),
    getActivePlayedCount() {
      const activeIds = new Set(
        (state.games || []).filter(g => !g.section || g.section === "main").map(g => g.id)
      );
      return this.played.filter(id => activeIds.has(id)).length;
    },
    getActiveTotal() {
      if (!state.games || state.games.length === 0) return 19;
      return state.games.filter(g => !g.section || g.section === "main").length;
    },
    markPlayed(gameId) {
      if (!this.played.includes(gameId)) {
        this.played.push(gameId);
        Storage.set("asobi_played_games", this.played);
        const total = this.getActiveTotal();
        const activeCount = this.getActivePlayedCount();
        this.render();
        renderGrid();

        if (activeCount >= total && total > 0) {
          if (typeof Confetti !== "undefined") Confetti.launch(56);
          Toast.success("すべてのゲームをプレイしました");
        }
      }
    },
    getRank(count) {
      const total = this.getActiveTotal();
      if (count >= total) return "マスター";
      if (count >= Math.ceil(total * 0.7)) return "エキスパート";
      if (count >= Math.ceil(total * 0.4)) return "ベテラン";
      if (count >= 2) return "チャレンジャー";
      return "ルーキー";
    },
    render() {
      const countEl = document.getElementById("stamp-rally-count");
      const barEl = document.getElementById("stamp-rally-progress-bar");
      const rankEl = document.getElementById("stamp-rally-rank");
      if (!countEl || !barEl) return;
      const total = this.getActiveTotal();
      const count = this.getActivePlayedCount();
      const pct = Math.min(100, Math.round((count / total) * 100));
      countEl.textContent = `制覇率: ${count} / ${total} (${pct}%)`;
      barEl.style.width = `${pct}%`;
      if (rankEl) rankEl.textContent = this.getRank(count);
    }
  };
  window.StampRally = StampRally;

  // ==========================================
  // ⑩ ダイナミックアイランド風・フローティングミニタイマー
  // ==========================================
  const DynamicTimer = {
    timer: null,
    secLeft: 0,
    title: "",
    gameId: null,
    start(title, sec, onFinish = null, gameId = null) {
      this.stop();
      this.title = title;
      this.secLeft = sec;
      this.gameId = gameId;

      const island = document.getElementById("dynamic-island-timer");
      const titleEl = document.getElementById("dynamic-island-title");
      const jumpBtn = document.getElementById("dynamic-island-jump");
      const closeBtn = document.getElementById("dynamic-island-close");

      if (titleEl) titleEl.textContent = title;
      if (island) island.classList.remove("hidden");
      this.updateDisplay();

      if (jumpBtn) {
        jumpBtn.onclick = () => {
          const targetId = this.gameId;
          this.stop();
          if (targetId) navigateToGame(targetId);
        };
      }

      if (closeBtn) {
        closeBtn.onclick = () => {
          this.stop();
        };
      }

      const TimerClass = window.GameTimer || GameTimer;
      this.timer = new TimerClass({
        totalSeconds: sec,
        isFloating: true,
        title: title,
        gameId: gameId,
        onTick: (rem) => {
          this.secLeft = rem;
          this.updateDisplay();
        },
        onFinish: () => {
          this.stop();
          if (typeof Sound.playTimeUp === "function") Sound.playTimeUp();
          Toast.warning(`「${this.title}」のタイマーが終了しました`);
          if (typeof onFinish === "function") onFinish();
        }
      });
      this.timer.start();
    },
    updateDisplay() {
      const timeEl = document.getElementById("dynamic-island-time");
      if (!timeEl) return;
      const m = Math.floor(this.secLeft / 60).toString().padStart(2, '0');
      const s = (this.secLeft % 60).toString().padStart(2, '0');
      timeEl.textContent = `${m}:${s}`;
    },
    stop() {
      if (this.timer) {
        this.timer.destroy();
        this.timer = null;
      }
      this.gameId = null;
      const island = document.getElementById("dynamic-island-timer");
      if (island) island.classList.add("hidden");
    }
  };
  window.DynamicTimer = DynamicTimer;

  // ==========================================
  // ④ トーク集中モードマネージャー
  // ==========================================
  const TalkFocus = {
    timer: null,
    secLeft: 180,
    open(topicText, initialSec = 180) {
      const modal = document.getElementById("modal-talk-focus");
      const topicEl = document.getElementById("talk-focus-topic");
      if (topicEl) topicEl.textContent = topicText;
      this.secLeft = initialSec;
      if (this.timer) {
        this.timer.destroy();
        this.timer = null;
      }
      this.updateDisplay();

      if (modal) {
        ModalManager.open(modal);
      }
    },
    close() {
      if (this.timer) {
        this.timer.destroy();
        this.timer = null;
      }
      const modal = document.getElementById("modal-talk-focus");
      if (modal && !modal.classList.contains("hidden")) {
        ModalManager.close(modal);
      }
    },
    toggleTimer() {
      if (!this.timer) {
        const TimerClass = window.GameTimer || GameTimer;
        this.timer = new TimerClass({
          totalSeconds: this.secLeft,
          tickSoundInterval: 5,
          onTick: (rem) => {
            this.secLeft = rem;
            this.updateDisplay();
          },
          onFinish: () => {
            if (typeof Sound.playTimeUp === "function") Sound.playTimeUp();
            Toast.warning("トークタイム終了です");
            this.updateDisplay();
          }
        });
        this.timer.start();
        Sound.playClick();
      } else {
        this.timer.toggle();
        Sound.playClick();
      }
      this.updateDisplay();
    },
    updateDisplay() {
      const timerEl = document.getElementById("talk-focus-timer");
      if (!timerEl) return;
      const m = Math.floor(this.secLeft / 60).toString().padStart(2, '0');
      const s = (this.secLeft % 60).toString().padStart(2, '0');
      timerEl.textContent = `${m}:${s}`;
      const toggleBtn = document.getElementById("btn-focus-toggle-timer");
      if (toggleBtn) {
        toggleBtn.textContent = (this.timer && this.timer.isRunning) ? "一時停止" : "スタート";
      }
    }
  };
  window.TalkFocus = TalkFocus;

  const GAME_ALIASES = {
    "seo/ito": "ito",
    "seo/asa-sore": "asa-sore",
    "seo/wordwolf": "word-wolf",
    "wordwolf": "word-wolf",
    "seo/sea-turtle": "sea-turtle",
    "batsu-game": "batsu-roulette",
    "shiritori-hard": "word-chain-limit",
    "stroop-effect": "duel-color",
    "gem-tap": "duel-reflex"
  };

  function resolveGameId(id) {
    return Object.hasOwn(GAME_ALIASES, id) ? GAME_ALIASES[id] : id;
  }

  const GAME_SVG_ICONS = {
    "ito": '<svg class="game-svg" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20L24 8"/><circle cx="7.5" cy="17.9" r="2.6" fill="var(--card-bg)"/><circle cx="14" cy="14" r="2.6" fill="var(--primary)" stroke="var(--primary)"/><circle cx="20.5" cy="10.1" r="2.6" fill="var(--card-bg)"/></svg>',
    "word-wolf": '<svg class="game-svg" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12L8.5 5l5.5 3.5L19.5 5 22 12c0 5.5-3.4 9.5-8 11-4.6-1.5-8-5.5-8-11z"/><circle cx="11" cy="13.5" r="1.1" fill="currentColor"/><circle cx="17" cy="13.5" r="1.1" fill="var(--primary)" stroke="var(--primary)"/><path d="M12.5 18h3"/></svg>',
    "katakana-ban": '<svg class="game-svg" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="14" cy="14" r="9.5"/><path d="M7.5 7.5l13 13" stroke="var(--primary)"/><path d="M11 11.5h6l-1.2 5.5"/></svg>',
    "bomb-timer": '<svg class="game-svg" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="16" r="7.5"/><path d="M16.5 9.2l2-2.2"/><path d="M19.5 5.5c1.5-.8 3-.3 3.5 1" stroke="var(--primary)"/><path d="M13 12.5v3.5l2.5 1.5"/></svg>',
    "asa-sore": '<svg class="game-svg" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19h20"/><path d="M8.5 19a5.5 5.5 0 0111 0"/><path d="M14 6.5v3M7.5 9.5l2 2M20.5 9.5l-2 2" stroke="var(--primary)"/></svg>',
    "sea-turtle": '<svg class="game-svg" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="14" cy="14" r="9.5"/><path d="M11.5 11.2a2.7 2.7 0 015.2.9c0 1.8-2.7 2.1-2.7 3.9"/><circle cx="14" cy="19.2" r="1" fill="var(--primary)" stroke="none"/></svg>',
    "silent-gesture": '<svg class="game-svg" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="6" width="18" height="16" rx="3"/><circle cx="14" cy="12" r="2.5"/><path d="M9.5 19c1-2.2 2.7-3.2 4.5-3.2s3.5 1 4.5 3.2"/><path d="M19.5 10l2-2" stroke="var(--primary)"/></svg>',
    "duel-reflex": '<svg class="game-svg" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 4L6.5 15.5h7L12.5 24l9-11.5h-7L15.5 4z"/></svg>',
    "duel-color": '<svg class="game-svg" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="11.2" cy="14" r="6"/><circle cx="16.8" cy="14" r="6" stroke="var(--primary)"/></svg>',
    "duel-mash": '<svg class="game-svg" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 14h18"/><path d="M9.5 9.5L5 14l4.5 4.5"/><path d="M18.5 9.5L23 14l-4.5 4.5" stroke="var(--primary)"/></svg>',
    "rhythm-box": '<svg class="game-svg" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M6 17v-6M10 21V7M14 18v-8M18 22V6" /><path d="M22 16v-4" stroke="var(--primary)"/></svg>',
    "one-night-werewolf": '<svg class="game-svg" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M19.5 17.8A8 8 0 0110.2 8.5a8.5 8.5 0 109.3 9.3z"/><circle cx="19.5" cy="8.5" r="1.3" fill="var(--primary)" stroke="none"/></svg>',
    "yomibito": '<svg class="game-svg" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="6" y="4.5" width="16" height="19" rx="2"/><path d="M18 9v10M14 9v8M10 9v6" /><circle cx="10" cy="18.5" r="1.2" fill="var(--primary)" stroke="none"/></svg>',
    "ng-word": '<svg class="game-svg" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 7.5h17v11h-9l-4.5 3.5v-3.5h-3.5v-11z"/><path d="M11 10.5l6 5M17 10.5l-6 5" stroke="var(--primary)"/></svg>',
    "talk-gacha": '<svg class="game-svg" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="7" width="12" height="15" rx="2"/><path d="M11 5h10a2 2 0 012 2v12"/><path d="M8.5 12h5M8.5 15.5h3.5" stroke="var(--primary)"/></svg>',
    "ten-seconds": '<svg class="game-svg" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="14" cy="15" r="8.5"/><path d="M11.5 4h5M14 4v2.5M14 15V10" /><circle cx="14" cy="15" r="1.3" fill="var(--primary)" stroke="none"/></svg>',
    "indian-poker": '<svg class="game-svg" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="6.5" y="4.5" width="15" height="19" rx="2.5"/><path d="M14 10l3.2 4-3.2 4-3.2-4 3.2-4z" stroke="var(--primary)"/></svg>',
    "word-chain-limit": '<svg class="game-svg" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="11" height="7" rx="3.5"/><rect x="12.5" y="10.5" width="11" height="7" rx="3.5" stroke="var(--primary)"/></svg>',
    "good-and-bad-news": '<svg class="game-svg" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="18" height="18" rx="2.5"/><path d="M14 5v18"/><path d="M8.5 14h3M10 12.5v3"/><path d="M16.5 14h3" stroke="var(--primary)"/></svg>',
    "finger-roulette": '<svg class="game-svg" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="14" cy="14" r="9"/><circle cx="14" cy="14" r="3" stroke="var(--primary)"/><path d="M14 3.5v3M14 21.5v3M3.5 14h3M21.5 14h3"/></svg>',
    "batsu-roulette": '<svg class="game-svg" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 4.5L7 15h6.5l-1 8.5L21 13h-6.5l1-8.5z" stroke="var(--primary)"/></svg>',
    "twenty-questions": '<svg class="game-svg" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M6 9h16M6 14h12M6 19h8"/><circle cx="20.5" cy="18.5" r="2.2" stroke="var(--primary)"/></svg>',
    "two-choices": '<svg class="game-svg" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 22V12M14 12L7.5 6.5M14 12l6.5-5.5"/><path d="M7.5 10.5v-4h4M20.5 10.5v-4h-4" stroke="var(--primary)"/></svg>',
    "two-truths": '<svg class="game-svg" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="8" cy="14" r="2.2"/><circle cx="14" cy="14" r="2.2"/><circle cx="20" cy="14" r="2.2" fill="var(--primary)" stroke="var(--primary)"/></svg>'
  };

  function getGameSvgIcon(gameId) {
    return GAME_SVG_ICONS[gameId] || '<svg class="game-svg" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="18" height="18" rx="3"/><circle cx="10.5" cy="10.5" r="1.2" fill="currentColor"/><circle cx="17.5" cy="17.5" r="1.2" fill="var(--primary)" stroke="none"/><circle cx="14" cy="14" r="1.2" fill="currentColor"/></svg>';
  }
  window.getGameSvgIcon = getGameSvgIcon;

  const partyPicks = new Map([
    ["ito", "数字を言わず、みんなの例えを小さい順に。"],
    ["word-wolf", "会話に紛れた、違うお題の人を探そう。"],
    ["katakana-ban", "カタカナを使わずに、お題を説明。"],
    ["bomb-timer", "答えたら次の人へ。爆弾が鳴るのはいつ？"],
    ["asa-sore", "同じ頭文字から、みんなが納得する答えを選ぼう。"],
    ["sea-turtle", "「はい」「いいえ」で答えられる質問で謎解き。"],
    ["silent-gesture", "声を出さずに演じて、チームで当てよう。"]
  ]);
  const moreCardSummaries = new Map([
    ["rhythm-box", "手拍子とテンポ音で即答。古今東西・マジカルバナナ・ドレミの歌を収録。"],
    ["one-night-werewolf", "司会者なしで一晩で決着。役職交換が絡むスピーディな人狼ゲーム。"],
    ["yomibito", "1人5文字ずつ回して詠む、思いがけない名句・迷句のリレー五七五。"],
    ["ng-word", "相手にNGワードを言わせたら勝ち。対面バトルにも多人数にも対応。"],
    ["talk-gacha", "話題に迷ったときのきっかけに。テーマを選んで質問をランダム表示。"],
    ["ten-seconds", "画面を見ずに感覚だけでストップ。3秒・5秒・10秒の体内時計勝負。"],
    ["indian-poker", "相手のカードだけを見て駆け引き。1台のスマホで遊べる対面心理戦。"],
    ["word-chain-limit", "文字数やジャンルの縛り付き。制限時間内に答えるスリリングなしりとり。"],
    ["good-and-bad-news", "良いニュースと悪いニュースを交互につなぐ、掛け合い大喜利トーク。"]
  ]);
  const duelModes = new Map([
    ["duel-reflex", {label: "反射", description: "合図が出たら先にタップ"}],
    ["duel-color", {label: "色判断", description: "文字と色が一致する？"}],
    ["duel-mash", {label: "連打", description: "15秒の連打で押し合い"}]
  ]);

  function formatPlayersText(game) {
    if (!game) return "";
    if (typeof GameResult !== "undefined" && typeof GameResult.formatPlayersRange === "function") {
      return GameResult.formatPlayersRange(game.minPlayers, game.maxPlayers);
    }
    const min = Number(game.minPlayers) || 2;
    const max = Number(game.maxPlayers);
    if (!Number.isFinite(max) || max >= 99) return `${min}人〜`;
    return min === max ? `${min}人` : `${min}〜${max}人`;
  }
  const savedFavorites = Storage.get("asobi_favorites", []);

  const GAME_STYLE_LABELS = {
    "ito": "価値観",
    "word-wolf": "心理戦",
    "katakana-ban": "言葉",
    "bomb-timer": "瞬発",
    "asa-sore": "大喜利",
    "sea-turtle": "推理",
    "silent-gesture": "演技",
    "rhythm-box": "リズム",
    "one-night-werewolf": "人狼",
    "yomibito": "創作",
    "ng-word": "心理戦",
    "talk-gacha": "トーク",
    "ten-seconds": "体感",
    "indian-poker": "心理戦",
    "word-chain-limit": "言葉",
    "good-and-bad-news": "掛け合い",
    "duel-reflex": "瞬発",
    "duel-color": "瞬発",
    "duel-mash": "連打"
  };

  function getGameStyleLabel(game) {
    if (!game) return "";
    if (GAME_STYLE_LABELS[game.id]) return GAME_STYLE_LABELS[game.id];
    const genreMap = { talk: "トーク", mystery: "心理戦", laugh: "笑い", speed: "瞬発", quiz: "クイズ" };
    return genreMap[game.genre] || "";
  }

  // 状態管理
  const state = {
    games: [...GAMES_DATA],
    favorites: Array.isArray(savedFavorites) ? [...new Set(savedFavorites.map(resolveGameId))] : [],
    filter: {
      tag: "all",
      player: "all",
      quickPlayers: "all",
      exactPlayers: "all",
      maxDuration: "all",
      genre: "all",
      scene: "all",
      search: "",
      onlyFavorite: false,
      sort: "recommended"
    },
    activeGameId: null,
    activeGameRoute: "",
    articleTopic: null,
    toolHasProgress: false,
    leaveApproved: false,
    homeScrollY: 0,
    activeTab: "tool", // tool, rules, presets
    isDark: Storage.get("asobi_theme_dark", false),
    kidsMode: Storage.get("asobi_kids_mode", false)
  };

  // ふりがな（ルビ）付きタイトル生成ヘルパー
  function renderGameTitle(game, compact = false) {
    if (!game) return "";
    const shortTitles = { "ito": "ito（価値観）", "katakana-ban": "カタカナ禁止", "asa-sore": "朝までそれ正解", "rhythm-box": "リズムボックス", "indian-poker": "インディアンポーカー", "finger-roulette": "指置きルーレット", "duel-reflex": "反射神経対決", "duel-mash": "連打パワーバトル", "duel-color": "カラー早見分け", "bomb-timer": "爆弾タイマー", "ng-word": "NGワードゲーム" };
    const title = compact ? (shortTitles[game.id] || game.title.replace(/\s*[（(].*$/u, "").trim()) : game.title;
    if (state.kidsMode && game.ruby) {
      return `<ruby class="game-title-ruby">${escapeHTML(title)}<rt>${escapeHTML(game.ruby)}</rt></ruby>`;
    }
    return escapeHTML(title);
  }

  // 検索インデックスの事前生成（超高速フィルタリング用）
  state.games.forEach(game => {
    const tokens = [
      game.title || "",
      game.ruby || "",
      ...(game.searchAliases || []),
      ...(duelModes.has(game.id) ? ["2人で対決", duelModes.get(game.id).label] : []),
      game.catchphrase || "",
      game.overview || "",
      game.category || "",
      ...(Array.isArray(game.tags) ? game.tags : []),
      ...(Array.isArray(game.presets) ? game.presets.map(p => typeof p === "string" ? p : (p.text || p.title || p.question || "")) : [])
    ];
    game._searchIndex = tokens.map(topicSearchText).join(" ");
  });

  // アクティブなツールのクリーンアップ関数
  let currentToolCleanup = null;

  function cleanupActiveTool() {
    SafeTimer.clearAll();
    if (typeof currentToolCleanup === "function") {
      try {
        currentToolCleanup();
      } catch (e) {}
      currentToolCleanup = null;
    }
  }

  // DOM要素
  const viewHome = document.getElementById("view-home");
  const viewDetail = document.getElementById("view-detail");
  const gamesGrid = document.getElementById("games-grid");
  const spotlightSection = document.getElementById("topic-spotlight");
  const emptyState = document.getElementById("empty-state");
  const searchInput = document.getElementById("search-input");
  const clearSearchBtn = document.getElementById("btn-clear-search");
  const smartTagChips = document.querySelectorAll(".smart-tag-chip");
  const filterResultCount = document.getElementById("filter-result-count");
  const sortSelect = document.getElementById("sort-select");
  const favToggleBtn = document.getElementById("btn-toggle-fav-filter");
  const favCountBadge = document.getElementById("fav-count-badge");
  const modalRoulette = document.getElementById("modal-roulette");
  const btnCloseRoulette = document.getElementById("btn-close-roulette");
  const btnSpinRoulette = document.getElementById("btn-spin-roulette");

  // ==========================================
  // テーマ初期化
  // ==========================================
  function applyTheme() {
    document.documentElement.classList.toggle("dark-mode", state.isDark);
  }
  applyTheme();

  // ==========================================
  // お気に入り管理
  // ==========================================
  function toggleFavorite(gameId, e) {
    if (e) e.stopPropagation();
    Sound.playClick();

    const idx = state.favorites.indexOf(gameId);
    const added = idx < 0;
    if (idx >= 0) {
      state.favorites.splice(idx, 1);
    } else {
      state.favorites.push(gameId);
    }
    Storage.set("asobi_favorites", state.favorites);
    updateFavBadge();
    renderGrid();
    if (added) {
      requestAnimationFrame(() => {
        document.querySelectorAll(`.btn-card-fav[data-fav-id="${gameId}"]`).forEach((btn) => {
          btn.classList.remove("is-popping");
          void btn.offsetWidth;
          btn.classList.add("is-popping");
        });
      });
    }
    if (state.activeGameId) {
      updateDetailFavButton(added);
    }
  }

  function updateFavBadge() {
    const count = state.favorites.length;
    if (favCountBadge) {
      favCountBadge.textContent = count;
      favCountBadge.classList.toggle("hidden", count === 0);
    }
    const btmBadge = document.getElementById("btm-fav-badge");
    if (btmBadge) {
      btmBadge.textContent = count;
      btmBadge.classList.toggle("hidden", count === 0);
    }
  }
  updateFavBadge();

  // ==========================================
  // フィルタリング ＆ ソート（高速化版）
  // ==========================================
  function getFilteredGames() {
    const q = toHiragana(state.filter.search);
    const terms = q.split(/\s+/).filter(Boolean);

    return state.games.filter(game => {
      // メイン枠スリム化: 検索語がない場合はメインゲーム(19枠)のみ表示。
      // 区分C(定番ルール)、区分U(常設ツール)、区分merged(統合済み旧URL)はメイン一覧から除外。
      if (q === "" && !state.filter.onlyFavorite) {
        if (game.section && game.section !== "main") return false;
      } else {
        // 検索時は統合済み旧エイリアス以外(メイン・定番ルール・ツール)を検索可能に
        if (game.section === "merged" && !state.filter.onlyFavorite) return false;
      }

      if (state.filter.quickPlayers !== "all") {
        const qp = state.filter.quickPlayers;
        if (qp === "2" && (game.minPlayers > 2 || game.maxPlayers < 2)) return false;
        if (qp === "3-4" && (game.minPlayers > 4 || game.maxPlayers < 3)) return false;
        if (qp === "5+" && game.maxPlayers < 5) return false;
      }
      if (state.filter.exactPlayers !== "all") {
        const players = Number(state.filter.exactPlayers);
        if (game.minPlayers > players || game.maxPlayers < players) return false;
      }
      if (state.filter.maxDuration !== "all" && game.durationMin > Number(state.filter.maxDuration)) return false;
      // お気に入り絞り込み
      if (state.filter.onlyFavorite && !state.favorites.includes(game.id)) {
        return false;
      }

      // 厳選スマートタグ絞り込み
      if (state.filter.tag && state.filter.tag !== "all") {
        const t = state.filter.tag;
        if (t === "nomikai") {
          const nomikaiIds = [
            "ito", "asa-sore", "word-wolf", "bomb-timer",
            "katakana-ban", "ng-word", "indian-poker",
            "one-night-werewolf", "duel-mash", "rhythm-box", "yomibito", "talk-gacha"
          ];
          if (!nomikaiIds.includes(game.id) && !(game.tags && (game.tags.includes("飲み会") || game.tags.includes("合コン")))) return false;
        } else if (t === "couple") {
          if (game.minPlayers > 2) return false;
          const coupleIds = [
            "ito", "sea-turtle", "talk-gacha", "ten-seconds",
            "duel-reflex", "duel-color", "duel-mash", "yomibito", "word-chain-limit",
            "indian-poker", "ng-word"
          ];
          if (!coupleIds.includes(game.id) && !game.isDuo && !(game.tags && game.tags.includes("2人"))) return false;
        } else if (t === "voice") {
          if (!game.isVoice && !(game.tags && (game.tags.includes("声だけ") || game.tags.includes("手ぶら")))) return false;
        } else if (t === "mystery") {
          if (game.genre !== "mystery" && !(game.tags && (game.tags.includes("人狼") || game.tags.includes("心理戦")))) return false;
        } else if (t === "party") {
          if (game.maxPlayers < 5 && game.maxPlayers !== 99) return false;
        }
      }

      // 検索キーワード（事前インデックスによる超高速判定）
      if (q !== "") {
        const matches = terms.every(term => {
          const count = /^(\d+)人$/.exec(term);
          if (count) return +count[1] >= game.minPlayers && +count[1] <= game.maxPlayers;
          return (namesByTopic.get(term) || [term]).some(name => game._searchIndex.includes(name));
        });
        if (!matches) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (state.filter.sort === "quick") {
        // 短時間（1〜3分）でサクッと遊べる順
        if (a.durationMin !== b.durationMin) return a.durationMin - b.durationMin;
        return b.recommendScore - a.recommendScore;
      }
      if (state.filter.sort === "players-few") {
        // 少人数（2人〜）向き順
        if (a.minPlayers !== b.minPlayers) return a.minPlayers - b.minPlayers;
        return a.maxPlayers - b.maxPlayers;
      }
      if (state.filter.sort === "players-many") {
        // 大人数（5人〜）で盛り上がる順
        if (b.maxPlayers !== a.maxPlayers) return b.maxPlayers - a.maxPlayers;
        return b.recommendScore - a.recommendScore;
      }
      if (state.filter.sort === "has-tool") {
        // スマホツール付き優先
        if (a.hasTool !== b.hasTool) return b.hasTool ? 1 : -1;
        return b.recommendScore - a.recommendScore;
      }
      if (state.filter.sort === "popular") {
        // 人気・評価順
        return b.rating - a.rating;
      }
      // recommended: 総合おすすめ神ゲー順
      return b.recommendScore - a.recommendScore;
    });
  }

  function syncDiscoverySummary() {
    const summary = document.getElementById("active-filter-summary");
    if (!summary) return;
    const quickLabels = { "2": "2人", "3-4": "3〜4人", "5+": "5人以上" };
    const conditions = [];
    if (state.filter.onlyFavorite) conditions.push({ key: "favorite", text: "お気に入り" });
    if (state.filter.search) conditions.push({ key: "search", text: "検索：" + state.filter.search });
    if (state.filter.quickPlayers !== "all") conditions.push({ key: "quickPlayers", text: quickLabels[state.filter.quickPlayers] || state.filter.quickPlayers });
    if (state.filter.exactPlayers !== "all") conditions.push({ key: "players", text: state.filter.exactPlayers + "人" });
    if (state.filter.maxDuration !== "all") conditions.push({ key: "duration", text: state.filter.maxDuration + "分くらい" });
    if (state.filter.tag !== "all") conditions.push({ key: "tag", text: [...smartTagChips].find(c => c.dataset.filterTag === state.filter.tag)?.textContent.trim() || state.filter.tag });
    if (state.filter.sort !== "recommended") conditions.push({ key: "sort", text: sortSelect.options[sortSelect.selectedIndex].text });
    summary.replaceChildren();
    conditions.forEach(condition => {
      const button = document.createElement("button");
      button.type = "button"; button.className = "condition-chip";
      button.textContent = condition.text + " ×";
      button.setAttribute("aria-label", condition.text + "の条件を解除");
      button.addEventListener("click", () => {
        if (condition.key === "favorite") state.filter.onlyFavorite = false;
        if (condition.key === "search") { clearTimeout(searchDebounceTimer); state.filter.search = ""; searchInput.value = ""; clearSearchBtn.classList.add("hidden"); }
        if (condition.key === "quickPlayers") { state.filter.quickPlayers = "all"; }
        if (condition.key === "players") { state.filter.exactPlayers = "all"; fitPlayers.value = "all"; }
        if (condition.key === "duration") { state.filter.maxDuration = "all"; fitDuration.value = "all"; }
        if (condition.key === "tag") state.filter.tag = "all";
        if (condition.key === "sort") { state.filter.sort = "recommended"; sortSelect.value = "recommended"; }
        renderGrid();
      });
      summary.appendChild(button);
    });
    document.getElementById("btn-clear-filters")?.classList.toggle("hidden", conditions.length === 0);
    document.querySelectorAll("[data-quick-players]").forEach(chip => {
      const active = chip.dataset.quickPlayers === state.filter.quickPlayers;
      chip.classList.toggle("active", active);
      chip.setAttribute("aria-pressed", String(active));
    });
    smartTagChips.forEach(chip => { const active = chip.dataset.filterTag === state.filter.tag; chip.classList.toggle("active", active); chip.setAttribute("aria-pressed", String(active)); });
    [favToggleBtn, document.getElementById("btm-nav-fav")].forEach(button => { button?.classList.toggle("active", state.filter.onlyFavorite); button?.setAttribute("aria-pressed", String(state.filter.onlyFavorite)); });
    renderRecentGames();
  }

  function renderRecentGames() {
    const section = document.getElementById("recent-games");
    const list = document.getElementById("recent-games-list");
    if (!section || !list) return;
    const ids = Storage.get("asobi_recent_history", []);
    const games = (Array.isArray(ids) ? ids : []).map(id => state.games.find(game => game.id === id)).filter(Boolean).slice(0, 3);
    const filtered = state.filter.onlyFavorite || state.filter.search || state.filter.tag !== "all" || state.filter.quickPlayers !== "all" || state.filter.exactPlayers !== "all" || state.filter.maxDuration !== "all";
    section.classList.toggle("hidden", games.length === 0 || Boolean(filtered));
    list.innerHTML = games.map(game => '<a href="#game/' + game.id + '" class="recent-game-link">' + renderGameTitle(game, true) + '</a>').join("");
  }

  function revealSearch() {
    const proceed = () => {
      const reveal = () => {
        document.getElementById("discovery-filters").open = true;
        searchInput.focus({ preventScroll: true });
        searchInput.scrollIntoView({ block: "center", behavior: "smooth" });
      };
      if (state.activeGameId) {
        window.location.hash = "";
        requestAnimationFrame(() => requestAnimationFrame(reveal));
      } else {
        reveal();
      }
    };
    if (state.activeGameId) {
      requestLeaveGame(proceed);
      return;
    }
    proceed();
  }

  window.addEventListener("asobi:play-start", event => {
    if (!event.detail?.gameId || event.detail.gameId === state.activeGameId) state.toolHasProgress = true;
  });

  function needsLeaveConfirmation() {
    const completed = viewDetail.querySelector("#btn-ito-retry,#btn-restart-wolf,#btn-restart-ww,#btn-duel-restart,#btn-mash-retry,#btn-color-retry,#btn-restart-truths,#btn-gesture-retry,#btn-count30-retry,#btn-katakana-retry,.result-stage");
    return Boolean(state.toolHasProgress && !completed);
  }

  let pendingLeaveConfirm = false;
  function requestLeaveGame(onProceed) {
    if (!needsLeaveConfirmation()) {
      state.leaveApproved = true;
      onProceed();
      return;
    }
    if (pendingLeaveConfirm) return;
    pendingLeaveConfirm = true;
    const ask = typeof GameResult !== "undefined" && typeof GameResult.confirmAction === "function"
      ? GameResult.confirmAction({
          title: "進行中のゲームを終了しますか？",
          message: "進行中のゲームを終了して別の画面に移ります。今の状態はリセットされます。",
          confirmLabel: "終了して移動",
          cancelLabel: "ゲームを続ける",
          danger: true
        })
      : Promise.resolve(true);
    ask.then((ok) => {
      pendingLeaveConfirm = false;
      if (ok) {
        state.leaveApproved = true;
        onProceed();
      }
    });
  }

  function favoriteButton(game) {
    const active = state.favorites.includes(game.id);
    return `<button class="btn-card-fav ${active ? "active" : ""}" data-action="fav" data-id="${game.id}"
      title="お気に入り" aria-pressed="${active}" aria-label="${escapeHTML(game.title)}を${active ? "お気に入りから削除" : "お気に入りに追加"}">${active ? "★" : "☆"}</button>`;
  }

  function makeDuelHub(games) {
    const hub = document.createElement("section");
    hub.className = "duel-hub";
    hub.setAttribute("aria-labelledby", "duel-hub-title");
    hub.innerHTML = `<div class="duel-hub-head">
        <h2 id="duel-hub-title" tabindex="-1">2人で対決</h2>
        <span class="duel-hub-note">1台のスマホを挟んで即勝負</span>
      </div>
      <div class="duel-mode-list">${games.map(game => {
        const mode = duelModes.get(game.id);
        return `<div class="duel-mode">
          <a class="duel-mode-link" href="#game/${game.id}" data-game-id="${game.id}">
            <span><strong>${mode.label}</strong><small>${mode.description}${StampRally.played.includes(game.id) ? " · プレイ済" : ""}</small></span>
          </a>${favoriteButton(game)}</div>`;
      }).join("")}</div>`;
    return hub;
  }

  function renderGrid() {
    syncDiscoverySummary();
    const list = getFilteredGames();
    const f = state.filter;
    const browse = !f.onlyFavorite && !f.search.trim() && f.sort === "recommended";
    const featured = browse && f.tag === "all" && f.quickPlayers === "all" && f.exactPlayers === "all" && f.maxDuration === "all";
    const modes = browse ? [...duelModes.keys()].map(id => list.find(g => g.id === id)).filter(Boolean) : [];
    const groupDuels = modes.length > 1;
    if (!featured && spotlightSection && gamesGrid.contains(spotlightSection)) {
      document.getElementById("discovery-filters").before(spotlightSection);
    }
    document.getElementById("games-grid-title").textContent = featured ? "みんなで遊ぶ おすすめ7選" : f.onlyFavorite ? "お気に入りの遊び" : "遊びを選ぶ";
    document.getElementById("jump-to-duels").hidden = !featured || !groupDuels;
    filterResultCount?.setAttribute("role", "status");
    filterResultCount?.setAttribute("aria-live", "polite");

    if (filterResultCount) {
      filterResultCount.textContent = featured ? `この一覧：${list.length}件` : `${state.filter.onlyFavorite ? 'お気に入り ' : ''}${list.length}件`;
    }

    if (list.length === 0) {
      const noFavorites = state.filter.onlyFavorite && state.favorites.length === 0;
      emptyState.querySelector("h3").textContent = noFavorites ? "お気に入りは、まだありません" : "条件に合う遊びが見つかりませんでした";
      emptyState.querySelector("p").textContent = noFavorites ? "気になる遊びの★を押すと、ここからすぐ開けます。" : "選択中の条件をひとつ外すか、すべてクリアして探してみてください。";
      btnEmptyReset.textContent = noFavorites ? "遊び一覧を見る" : "条件をクリアして一覧を見る";
      emptyState.classList.remove("hidden");
      gamesGrid.classList.add("hidden");
      gamesGrid.innerHTML = "";
      return;
    }

    emptyState.classList.add("hidden");
    gamesGrid.classList.remove("hidden");

    // DocumentFragmentで一括挿入
    const fragment = document.createDocumentFragment();

    const featuredPickIds = featured
      ? [...partyPicks.keys()].filter(id => list.some(item => item.id === id))
      : [];
    const lastFeaturedPickId = featuredPickIds.length % 2 === 1
      ? featuredPickIds[featuredPickIds.length - 1]
      : null;

    // 通常の一覧は7本、対決モード、その他の順。検索・お気に入りはゲーム単位で直接開く。
    const appendCard = game => {
      const card = document.createElement("div");
      card.className = "game-card";
      card.dataset.id = game.id;
      card.tabIndex = -1;
      card.setAttribute("role", "group");
      card.setAttribute("aria-label", `${game.title}の詳細を見る`);

      const isFeaturedPick = featured && partyPicks.has(game.id);
      const isPlayed = StampRally.played.includes(game.id);
      const summary = partyPicks.get(game.id) || moreCardSummaries.get(game.id) || game.catchphrase || "";
      const styleLabel = getGameStyleLabel(game);
      const metaParts = [formatPlayersText(game), game.duration];
      if (styleLabel) metaParts.push(styleLabel);
      if (isPlayed) metaParts.push("プレイ済");
      const metaText = metaParts.join(" · ");

      if (isFeaturedPick) {
        card.classList.add("party-pick");
        if (game.id === lastFeaturedPickId) {
          card.classList.add("party-pick-last");
        }
      } else if (game.id === "ito" && state.filter.tag === "all" && !state.filter.search && state.filter.sort === "recommended") {
        card.classList.add("hero-card");
      }

      card.innerHTML = `
        <div class="card-head-row">
          <h3 class="card-title"><a class="card-title-link" href="#game/${game.id}">${renderGameTitle(game, true)}</a></h3>
          ${favoriteButton(game)}
        </div>
        <p class="card-summary">${escapeHTML(summary)}</p>
        <div class="card-foot">
          <p class="card-meta">${escapeHTML(metaText)}</p>
          <span class="card-arrow" aria-hidden="true">↗</span>
        </div>
      `;

      fragment.appendChild(card);
    };

    if (featured) {
      for (const id of featuredPickIds) {
        const game = list.find(item => item.id === id);
        if (game) appendCard(game);
      }
      if (groupDuels) fragment.appendChild(makeDuelHub(modes));
      if (spotlightSection) fragment.appendChild(spotlightSection);
      const more = document.createElement("h2");
      more.className = "more-games-title";
      more.textContent = "ほかの遊び";
      fragment.appendChild(more);
    }
    const remainingGames = [];
    for (const game of list) {
      if (featured && partyPicks.has(game.id)) continue;
      if (groupDuels && duelModes.has(game.id)) {
        if (!featured && !fragment.querySelector(".duel-hub")) fragment.appendChild(makeDuelHub(modes));
        continue;
      }
      remainingGames.push(game);
    }
    remainingGames.forEach((game, idx) => {
      appendCard(game);
      if (remainingGames.length % 2 === 1 && idx === remainingGames.length - 1) {
        fragment.lastElementChild?.classList.add("more-game-last");
      }
    });

    gamesGrid.innerHTML = "";
    gamesGrid.appendChild(fragment);

  }

  document.getElementById("jump-to-duels").addEventListener("click", () => {
    const title = document.getElementById("duel-hub-title");
    title?.focus({preventScroll: true});
    title?.scrollIntoView({block: "start"});
  });

  // イベント委譲（グリッド全体のクリック・キー操作を一元処理）
  gamesGrid.addEventListener("click", (e) => {
    const favBtn = e.target.closest('[data-action="fav"]');
    if (favBtn) {
      e.stopPropagation();
      toggleFavorite(favBtn.dataset.id, e);
      return;
    }

    const card = e.target.closest(".game-card");
    if (card && card.dataset.id) {
      Sound.playSelect();
      navigateToGame(card.dataset.id);
    }
  });

  gamesGrid.addEventListener("keydown", (e) => {
    if (e.target.closest("button,a")) return;
    if (e.key === "Enter" || e.key === " ") {
      const card = e.target.closest(".game-card");
      if (card && card.dataset.id) {
        e.preventDefault();
        Sound.playSelect();
        navigateToGame(card.dataset.id);
      }
    }
  });

  // ==========================================
  // 定番ルール集（区分C: 折りたたみアコーディオン）
  // ==========================================
  function renderClassicRulesGrid() {
    const grid = document.getElementById("classic-rules-grid");
    if (!grid) return;
    const classicGames = state.games.filter(g => g.section === "C");
    const title = document.getElementById("classic-rules-title");
    if (title) title.textContent = `道具不要・その他の定番ルール集（${classicGames.length}選）`;
    grid.innerHTML = classicGames.map(game => `
      <div class="classic-rule-card" data-id="${game.id}" role="button" tabindex="0" aria-label="${game.title}のルールを見る">
        <div class="classic-rule-card-header">
          <div class="classic-rule-header-info">
            <h4 class="classic-rule-title">${game.title}</h4>
            <span class="classic-rule-meta">${escapeHTML(formatPlayersText(game))} · ${escapeHTML(game.duration)}</span>
          </div>
        </div>
        <p class="classic-rule-desc">${escapeHTML(game.catchphrase || game.overview || "")}</p>
        <div class="classic-rule-action">
          <span class="btn-classic-rule-view">
            ルールを見る <span aria-hidden="true">↗</span>
          </span>
        </div>
      </div>
    `).join("");

    grid.querySelectorAll(".classic-rule-card").forEach(card => {
      card.addEventListener("click", () => {
        const gameId = card.dataset.id;
        if (gameId) {
          Sound.playSelect();
          navigateToGame(gameId);
        }
      });
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const gameId = card.dataset.id;
          if (gameId) {
            Sound.playSelect();
            navigateToGame(gameId);
          }
        }
      });
    });
  }

  const btnToggleClassicRules = document.getElementById("btn-toggle-classic-rules");
  const classicRulesPanel = document.getElementById("classic-rules-panel");
  if (btnToggleClassicRules && classicRulesPanel) {
    btnToggleClassicRules.addEventListener("click", () => {
      Sound.playClick();
      const isExpanded = btnToggleClassicRules.getAttribute("aria-expanded") === "true";
      btnToggleClassicRules.setAttribute("aria-expanded", String(!isExpanded));
      classicRulesPanel.classList.toggle("hidden", isExpanded);
    });
  }

  // ==========================================
  // ファーストビュー即決バー ＆ 今日のお題プレビュー
  // ==========================================
  document.querySelectorAll("[data-quick-players]").forEach(chip => {
    chip.addEventListener("click", () => {
      Sound.playClick();
      const val = chip.dataset.quickPlayers || "all";
      state.filter.quickPlayers = state.filter.quickPlayers === val ? "all" : val;
      if (state.filter.quickPlayers !== "all" && fitPlayers) {
        fitPlayers.value = "all";
        state.filter.exactPlayers = "all";
      }
      renderGrid();
      Analytics.track("asobi_quick_players", { players: state.filter.quickPlayers });
    });
  });

  const btnHeroConcierge = document.getElementById("btn-hero-concierge");
  const btnHeroRoulette = document.getElementById("btn-hero-roulette");
  if (btnHeroRoulette) {
    btnHeroRoulette.addEventListener("click", () => {
      if (modalRoulette) ModalManager.open(modalRoulette);
    });
  }

  // 今日のお題プレビュー（1タップ切り替え＋該当ゲームへ直行）
  const spotlightGameEl = document.getElementById("spotlight-game");
  const spotlightPromptEl = document.getElementById("spotlight-prompt");
  const spotlightNextBtn = document.getElementById("btn-spotlight-next");
  const spotlightPlayLink = document.getElementById("btn-spotlight-play");
  let currentSpotlightKey = null;

  function renderSpotlightTopic({ initial = false } = {}) {
    if (!spotlightSection || typeof GameResult === "undefined" || typeof GameResult.pickSpotlightTopic !== "function") return;
    const now = new Date();
    const daySeed = ((now.getFullYear() * 372 + (now.getMonth() + 1) * 31 + now.getDate()) % 997) / 997;
    const pick = GameResult.pickSpotlightTopic(state.games, {
      excludeKey: initial ? null : currentSpotlightKey,
      rng: initial ? () => daySeed : Math.random
    });
    if (!pick) {
      spotlightSection.classList.add("hidden");
      return;
    }
    currentSpotlightKey = pick.key;
    if (spotlightGameEl) spotlightGameEl.textContent = pick.gameLabel;
    if (spotlightPromptEl) spotlightPromptEl.textContent = pick.prompt;
    if (spotlightPlayLink) {
      const spotlightQuery = Number.isInteger(pick.presetIndex) ? `?spotlight=${pick.presetIndex}` : "";
      spotlightPlayLink.href = `#game/${pick.gameId}${spotlightQuery}`;
      spotlightPlayLink.setAttribute("aria-label", `${pick.gameLabel}でこのお題を遊ぶ`);
    }
    if (!initial) {
      spotlightSection.classList.remove("is-swapped");
      void spotlightSection.offsetWidth;
      spotlightSection.classList.add("is-swapped");
    }
  }
  renderSpotlightTopic({ initial: true });

  if (spotlightNextBtn) {
    spotlightNextBtn.addEventListener("click", () => {
      Sound.playClick();
      renderSpotlightTopic({ initial: false });
    });
  }

  // ==========================================
  // イベントリスナー（厳選スマートタグ）
  // ==========================================
  smartTagChips.forEach(chip => {
    chip.addEventListener("click", () => {
      Sound.playClick();
      smartTagChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      state.filter.tag = chip.dataset.filterTag || "all";
      smartTagChips.forEach(c => c.setAttribute("aria-pressed", String(c === chip)));
      renderGrid();
    });
  });

  const fitPlayers = document.getElementById("fit-players");
  const fitDuration = document.getElementById("fit-duration");
  const syncFit = () => {
    state.filter.exactPlayers = fitPlayers.value;
    if (fitPlayers.value !== "all") state.filter.quickPlayers = "all";
    state.filter.maxDuration = fitDuration.value;
    renderGrid();
    Analytics.track("asobi_filter", { players: fitPlayers.value, duration: fitDuration.value });
  };
  fitPlayers?.addEventListener("change", syncFit);
  fitDuration?.addEventListener("change", syncFit);
  document.getElementById("fit-reset")?.addEventListener("click", () => {
    fitPlayers.value = "all";
    fitDuration.value = "all";
    state.filter.quickPlayers = "all";
    state.filter.exactPlayers = "all";
    state.filter.maxDuration = "all";
    document.getElementById("btn-empty-reset")?.click();
  });
  smartTagChips.forEach(c => c.setAttribute("aria-pressed", String(c.classList.contains("active"))));
  let searchDebounceTimer = null;
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const val = e.target.value;
      if (clearSearchBtn) clearSearchBtn.classList.toggle("hidden", val === "");
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        state.filter.search = val;
        renderGrid();
      }, 80);
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", () => {
      Sound.playClick();
      searchInput.value = "";
      state.filter.search = "";
      clearSearchBtn.classList.add("hidden");
      renderGrid();
    });
  }

  const btnEmptyReset = document.getElementById("btn-empty-reset");
  if (btnEmptyReset) {
    btnEmptyReset.addEventListener("click", () => {
      Sound.playClick();
      clearTimeout(searchDebounceTimer);
      state.filter.sort = "recommended";
      if (sortSelect) sortSelect.value = "recommended";
      if (searchInput) searchInput.value = "";
      if (clearSearchBtn) clearSearchBtn.classList.add("hidden");
      state.filter.search = "";
      state.filter.quickPlayers = "all";
      state.filter.exactPlayers = "all";
      state.filter.maxDuration = "all";
      if (fitPlayers) fitPlayers.value = "all";
      if (fitDuration) fitDuration.value = "all";
      state.filter.tag = "all";
      state.filter.onlyFavorite = false;
      if (favToggleBtn) favToggleBtn.classList.remove("active");
      const btmNavFav = document.getElementById("btm-nav-fav");
      if (btmNavFav) btmNavFav.classList.remove("active");
      smartTagChips.forEach(chip => {
        chip.classList.toggle("active", (chip.dataset.filterTag || "all") === "all");
      });
      renderGrid();
    });
  }

  document.getElementById("btn-clear-filters")?.addEventListener("click", () => btnEmptyReset.click());

  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      Sound.playClick();
      state.filter.sort = e.target.value;
      renderGrid();
    });
  }

  function toggleFavoriteFilter({ showToast = false } = {}) {
    const proceed = () => {
      Sound.playClick();
      if (state.activeGameId || window.location.hash !== "") {
        window.location.hash = "";
      }
      state.filter.onlyFavorite = !state.filter.onlyFavorite;
      renderGrid();
    };
    if (state.activeGameId) {
      requestLeaveGame(proceed);
      return;
    }
    proceed();
  }

  if (favToggleBtn) {
    favToggleBtn.addEventListener("click", () => toggleFavoriteFilter());
  }

  // ==========================================
  // ランダム即決ルーレットモーダル
  // ==========================================
  if (btnCloseRoulette) {
    btnCloseRoulette.addEventListener("click", () => {
      if (modalRoulette) ModalManager.close(modalRoulette);
    });
  }

  if (btnSpinRoulette) {
    btnSpinRoulette.addEventListener("click", () => {
      Sound.playSelect();
      const resultBox = document.getElementById("roulette-result-box");
      const resultTitle = document.getElementById("roulette-result-title");
      const resultIcon = document.getElementById("roulette-result-icon");
      const resultCatch = document.getElementById("roulette-result-catch");
      const btnGoGame = document.getElementById("btn-roulette-go");

      btnSpinRoulette.disabled = true;
      resultBox.classList.add("spinning");

      let count = 0;
      const maxCount = 20;
      const interval = setInterval(() => {
        if (!modalRoulette || modalRoulette.classList.contains("hidden")) {
          clearInterval(interval);
          resultBox.classList.remove("spinning");
          btnSpinRoulette.disabled = false;
          return;
        }
        count++;
        const randomGame = state.games[Math.floor(Math.random() * state.games.length)];
        resultIcon.textContent = randomGame.icon;
        resultTitle.textContent = randomGame.title;
        resultCatch.textContent = randomGame.catchphrase;
        Sound.playTick(700 + count * 20);

        if (count >= maxCount) {
          clearInterval(interval);
          resultBox.classList.remove("spinning");
          Sound.playFanfare();
          Confetti.burst(80);
          btnSpinRoulette.disabled = false;
          btnGoGame.classList.remove("hidden");

          btnGoGame.onclick = () => {
            ModalManager.close(modalRoulette);
            navigateToGame(randomGame.id);
          };
        }
      }, 80);
    });
  }

  // ==========================================
  // ⚡ 幹事のための即決コンシェルジュ（3秒ゲーム診断）
  // ==========================================
  const modalConcierge = document.getElementById("modal-concierge");
  const btnCloseConcierge = document.getElementById("btn-close-concierge");
  const btnConciergeSubmit = document.getElementById("btn-concierge-submit");
  const conciergeResultArea = document.getElementById("concierge-result-area");
  const conciergeResIcon = document.getElementById("concierge-res-icon");
  const conciergeResTitle = document.getElementById("concierge-res-title");
  const conciergeResCatch = document.getElementById("concierge-res-catch");
  const conciergeTagPlayers = document.getElementById("concierge-tag-players");
  const conciergeTagMood = document.getElementById("concierge-tag-mood");
  const conciergeResRank = document.getElementById("concierge-res-rank");
  const conciergeResReason = document.getElementById("concierge-res-reason");
  const conciergeResMeta = document.getElementById("concierge-res-meta");
  const btnConciergePlay = document.getElementById("btn-concierge-play");
  const btnConciergeReroll = document.getElementById("btn-concierge-reroll");

  let conciergeSelectedPlayers = "2";
  let conciergeSelectedMood = "laugh";
  let conciergeMatches = [];
  let conciergeCurrentIndex = 0;

  function getConciergeRecommendations(playersKey, moodKey) {
    if (typeof GameResult !== "undefined" && typeof GameResult.rankConciergeGames === "function") {
      return GameResult.rankConciergeGames(state.games, {
        players: playersKey,
        mood: moodKey
      });
    }
    return state.games
      .filter(g => g.section !== "merged" && g.section !== "U")
      .map((game, idx) => ({
        game,
        rank: idx + 1,
        matchTier: idx === 0 ? "best" : "good",
        reason: "",
        conditions: {
          player: { key: playersKey, label: playersKey === "5+" ? "5人以上" : playersKey === "3-4" ? "3〜4人" : "2人" },
          mood: { key: moodKey, label: moodKey }
        }
      }));
  }

  function formatConciergePlayersRange(game) {
    const min = Number(game.minPlayers);
    const max = Number(game.maxPlayers);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return "";
    if (min === max) return `${min}人専用`;
    if (max >= 99) return `${min}人〜`;
    return `${min}〜${max}人`;
  }

  function displayConciergeMatch(entry, index, total) {
    if (!entry || !entry.game) return;
    const game = entry.game;
    const cond = entry.conditions || (
      typeof GameResult !== "undefined" && typeof GameResult.getConciergeConditionMeta === "function"
        ? GameResult.getConciergeConditionMeta(conciergeSelectedPlayers, conciergeSelectedMood)
        : null
    );

    if (conciergeResIcon) conciergeResIcon.textContent = "";
    if (conciergeTagPlayers && cond && cond.player) {
      conciergeTagPlayers.textContent = cond.player.label;
    }
    if (conciergeTagMood && cond && cond.mood) {
      conciergeTagMood.textContent = cond.mood.label;
    }
    if (conciergeResRank) {
      const tierPrefix = entry.matchTier === "best" && index === 0 ? "最適" : "候補";
      conciergeResRank.textContent = `${tierPrefix} ${index + 1} / ${total}`;
      conciergeResRank.classList.toggle("is-best", entry.matchTier === "best" && index === 0);
    }

    conciergeResTitle.textContent = game.title;
    conciergeResCatch.textContent = game.catchphrase || "";

    if (conciergeResReason) {
      conciergeResReason.textContent = entry.reason || "";
      conciergeResReason.classList.toggle("hidden", !entry.reason);
    }

    if (conciergeResMeta) {
      const specs = [
        formatConciergePlayersRange(game),
        game.duration || "",
        "スマホ1台"
      ].filter(Boolean);
      conciergeResMeta.textContent = specs.join(" · ");
    }

    if (btnConciergeReroll) {
      btnConciergeReroll.disabled = total <= 1;
    }

    conciergeResultArea.classList.remove("hidden");
    conciergeResultArea.classList.remove("is-updated");
    void conciergeResultArea.offsetWidth;
    conciergeResultArea.classList.add("is-updated");

    btnConciergePlay.onclick = () => {
      Sound.playSelect();
      if (modalConcierge) ModalManager.close(modalConcierge);
      navigateToGame(game.id);
    };
  }

  function runConciergeDiagnosis({ celebrate = false } = {}) {
    conciergeMatches = getConciergeRecommendations(conciergeSelectedPlayers, conciergeSelectedMood);
    conciergeCurrentIndex = 0;
    if (conciergeMatches.length === 0) return;

    displayConciergeMatch(conciergeMatches[0], 0, conciergeMatches.length);
    if (celebrate) {
      Sound.playFanfare();
      if (conciergeResultArea && typeof conciergeResultArea.scrollIntoView === "function") {
        conciergeResultArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }

  function openConciergeWithContext() {
    Sound.playClick();
    if (state.filter.quickPlayers && state.filter.quickPlayers !== "all") {
      conciergeSelectedPlayers = state.filter.quickPlayers;
      document.querySelectorAll("#concierge-players-group .btn-concierge-opt").forEach(b => {
        const match = b.dataset.players === conciergeSelectedPlayers;
        b.classList.toggle("active", match);
        b.setAttribute("aria-pressed", String(match));
      });
    }
    if (modalConcierge) ModalManager.open(modalConcierge);
  }

  if (btnHeroConcierge) {
    btnHeroConcierge.addEventListener("click", openConciergeWithContext);
  }

  if (btnCloseConcierge) {
    btnCloseConcierge.addEventListener("click", () => {
      if (modalConcierge) ModalManager.close(modalConcierge);
    });
  }

  document.querySelectorAll("#concierge-players-group .btn-concierge-opt").forEach(btn => {
    btn.addEventListener("click", () => {
      Sound.playClick();
      document.querySelectorAll("#concierge-players-group .btn-concierge-opt").forEach(b => {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
      conciergeSelectedPlayers = btn.dataset.players;
      if (conciergeResultArea && !conciergeResultArea.classList.contains("hidden")) {
        runConciergeDiagnosis({ celebrate: false });
      }
    });
  });

  document.querySelectorAll("#concierge-mood-group .btn-concierge-opt").forEach(btn => {
    btn.addEventListener("click", () => {
      Sound.playClick();
      document.querySelectorAll("#concierge-mood-group .btn-concierge-opt").forEach(b => {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
      conciergeSelectedMood = btn.dataset.mood;
      if (conciergeResultArea && !conciergeResultArea.classList.contains("hidden")) {
        runConciergeDiagnosis({ celebrate: false });
      }
    });
  });

  if (btnConciergeSubmit) {
    btnConciergeSubmit.addEventListener("click", () => {
      Sound.playSelect();
      runConciergeDiagnosis({ celebrate: true });
    });
  }

  if (btnConciergeReroll) {
    btnConciergeReroll.addEventListener("click", () => {
      Sound.playClick();
      if (conciergeMatches.length > 1) {
        conciergeCurrentIndex = (conciergeCurrentIndex + 1) % conciergeMatches.length;
        displayConciergeMatch(conciergeMatches[conciergeCurrentIndex], conciergeCurrentIndex, conciergeMatches.length);
      }
    });
  }

  // ==========================================
  // ルーティング ＆ 個別詳細ビュー
  // ==========================================
  function navigateToGame(gameId) {
    window.location.hash = `game/${gameId}`;
  }

  function handleRoute() {
    const hash = window.location.hash;
    if (state.activeGameId && hash !== state.activeGameRoute && !state.leaveApproved && needsLeaveConfirmation()) {
      const targetHash = hash;
      history.replaceState(null, "", location.pathname + location.search + state.activeGameRoute);
      requestLeaveGame(() => {
        if (targetHash) {
          window.location.hash = targetHash;
        } else {
          history.replaceState(null, "", location.pathname + location.search);
          handleRoute();
        }
      });
      return;
    }
    state.leaveApproved = false;
    if (!state.activeGameId && hash.startsWith("#game/")) state.homeScrollY = window.scrollY;
    cleanupActiveTool(); // 前のツールを確実に破棄
    if (hash.startsWith("#game/")) {
      const [rawId, options] = hash.slice("#game/".length).trim().split("?", 2);
      const gameId = resolveGameId(rawId);
      const game = state.games.find(g => g.id === gameId);
      if (game) {
        if (state.activeGameRoute !== hash) state.toolHasProgress = false;
        state.activeGameRoute = hash;
        const params = new URLSearchParams(options);
        const topicNumber = params.get("topic");
        const spotlightIdx = params.get("spotlight");
        if (typeof ASOBI_ARTICLE_TOPICS !== "undefined" && /^[1-9]\d{0,2}$/.test(topicNumber)) {
          state.articleTopic = ASOBI_ARTICLE_TOPICS[gameId]?.[Number(topicNumber) - 1] || null;
        } else if (/^\d{1,3}$/.test(spotlightIdx) && Array.isArray(game.presets)) {
          const picked = game.presets[Number(spotlightIdx)];
          if (picked) {
            state.articleTopic = typeof picked === "string" ? { text: picked } : { ...picked };
          } else {
            state.articleTopic = null;
          }
        } else {
          state.articleTopic = null;
        }
        showGameDetail(game);
        return;
      }
    }
    showHome();
  }

  function showHome() {
    // DynamicTimer連携: タイマー稼働中にホームへ戻った場合、フローティングタイマーを起動
    if (typeof GameTimer !== "undefined" && GameTimer.activeTimer && GameTimer.activeTimer.isRunning) {
      const activeT = GameTimer.activeTimer;
      const rem = activeT.remaining;
      const targetGameId = activeT.gameId || state.activeGameId;
      const gameObj = state.games.find(g => g.id === targetGameId);
      const title = activeT.title || (gameObj ? gameObj.title : "タイマー");
      const finishCb = activeT.onFinish;

      if (typeof activeT.destroy === "function") {
        activeT.destroy();
      }
      GameTimer.activeTimer = null;

      if (rem > 0 && typeof DynamicTimer !== "undefined") {
        DynamicTimer.start(title, rem, () => {
          if (typeof finishCb === "function") finishCb();
        }, targetGameId);
      }
    }

    cleanupActiveTool();
    document.body.classList.remove("is-tool-active");
    WakeLockManager.release(); // ホームに戻ったらスリープ防止解除
    state.activeGameId = null;
    state.activeGameRoute = "";
    state.articleTopic = null;
    state.toolHasProgress = false;
    viewHome.classList.remove("hidden");
    viewDetail.classList.add("hidden");
    renderGrid();
    requestAnimationFrame(() => window.scrollTo({ top: state.homeScrollY, behavior: "instant" }));
  }

  function updateDetailFavButton(pop = false) {
    const isFav = Boolean(state.activeGameId && state.favorites.includes(state.activeGameId));
    const activeGame = state.activeGameId ? state.games.find(g => g.id === state.activeGameId) : null;
    const title = activeGame ? activeGame.title : "このゲーム";

    const btnFav = document.getElementById("detail-fav-btn");
    if (btnFav && state.activeGameId) {
      btnFav.classList.toggle("active", isFav);
      btnFav.setAttribute("aria-pressed", String(isFav));
      btnFav.setAttribute("aria-label", `${title}を${isFav ? "お気に入りから外す" : "お気に入りに追加"}`);
      btnFav.textContent = isFav ? "★" : "☆";
    }

    const menuContext = document.getElementById("menu-game-context");
    const menuFavBtn = document.getElementById("btn-menu-game-fav");
    const menuFavIcon = document.getElementById("menu-game-fav-icon");
    const menuFavTitle = document.getElementById("menu-game-fav-title");
    const menuFavSub = document.getElementById("menu-game-fav-sub");
    if (menuContext && menuFavBtn) {
      menuContext.classList.toggle("hidden", !state.activeGameId);
      if (state.activeGameId) {
        menuFavBtn.classList.toggle("is-favorited", isFav);
        menuFavBtn.setAttribute("aria-pressed", String(isFav));
        menuFavBtn.setAttribute("aria-label", `${title}を${isFav ? "お気に入りから外す" : "お気に入りに追加"}`);
        if (menuFavIcon) {
          menuFavIcon.textContent = isFav ? "★" : "☆";
          if (pop) {
            menuFavIcon.classList.remove("is-popping");
            void menuFavIcon.offsetWidth;
            menuFavIcon.classList.add("is-popping");
          }
        }
        if (menuFavTitle) menuFavTitle.textContent = isFav ? "お気に入り済み" : "お気に入りに追加";
        if (menuFavSub) menuFavSub.textContent = activeGame ? activeGame.title : "";
      }
    }
  }

  function showGameDetail(game, requestedTab = null) {
    if (typeof DynamicTimer !== "undefined" && DynamicTimer.gameId === game.id) {
      DynamicTimer.stop();
    }
    if (state.activeGameId !== game.id) state.toolHasProgress = false;
    state.activeGameId = game.id;

    // 最近遊んだ履歴を更新
    try {
      let recents = Storage.get("asobi_recent_history", []);
      recents = [game.id, ...recents.filter(id => id !== game.id)].slice(0, 6);
      Storage.set("asobi_recent_history", recents);
    } catch (e) {}

    WakeLockManager.request(); // ゲーム画面中は画面常時点灯（スリープ防止）

    viewHome.classList.add("hidden");
    viewDetail.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });

    const hasTool = game.toolType && game.toolType !== "guide-only";
    state.activeTab = requestedTab === 'presets' && game.presets?.length ? 'presets' : (hasTool ? "tool" : "rules");

    // アフィリエイト商品紹介HTMLの生成
    const prod = game.officialProduct;
    const affKeyword = game.affiliateKeyword || `${game.title} ボードゲーム`;
    const affiliateMarkup = prod ? `
      <div class="section-box mt-4 official-product-box">
        <div class="product-box-header">
          <span class="product-badge-pr">PR</span>
          <h3 class="product-box-title">本物のカード・公式版で遊ぶとさらに盛り上がります</h3>
        </div>
        <div class="product-box-body">
          <h4 class="product-item-name">${escapeHTML(prod.name)}</h4>
          <span class="product-publisher">${escapeHTML(prod.publisher)}</span>
          <p class="product-desc">${escapeHTML(prod.desc)}</p>
          <div class="product-btn-group">
            <a href="${AFFILIATE_CONFIG.getAmazonUrl(prod.keyword)}" target="_blank" rel="noopener noreferrer sponsored nofollow" class="btn-affiliate btn-amazon">
              Amazonで見る ↗
            </a>
            <a href="${AFFILIATE_CONFIG.getRakutenUrl(prod.keyword)}" target="_blank" rel="noopener noreferrer sponsored nofollow" class="btn-affiliate btn-rakuten">
              楽天市場で探す ↗
            </a>
          </div>
          <p class="product-disclaimer">※上記リンクから購入されると、当サイト運営者に一定の手数料が支払われる場合があります。</p>
        </div>
      </div>
    ` : `
      <div class="section-box mt-4 official-product-box">
        <div class="product-box-header">
          <span class="product-badge-pr">PR</span>
          <h3 class="product-box-title">『${escapeHTML(game.title)}』に関連するカードゲーム</h3>
        </div>
        <div class="product-box-body">
          <p class="product-desc">カードを囲んで遊びたいときに。関連する市販のゲームを探せます。</p>
          <div class="product-btn-group">
            <a href="${AFFILIATE_CONFIG.getAmazonUrl(affKeyword)}" target="_blank" rel="noopener noreferrer sponsored nofollow" class="btn-affiliate btn-amazon">
              Amazonで探す ↗
            </a>
            <a href="${AFFILIATE_CONFIG.getRakutenUrl(affKeyword)}" target="_blank" rel="noopener noreferrer sponsored nofollow" class="btn-affiliate btn-rakuten">
              楽天市場で探す ↗
            </a>
          </div>
          <p class="product-disclaimer">※上記リンクから購入されると、当サイト運営者に一定の手数料が支払われる場合があります。</p>
        </div>
      </div>
    `;

    // お題カスタムマネージャー用のカウント
    const customTopics = TopicManager.getCustomTopics(game.id);
    const totalPresets = (game.presets ? game.presets.length : 0) + customTopics.length;
    const speechSummaryText = game.speechSummary || (() => {
      const endSentence = (s) => (/[。！？!?]$/.test(s) ? s : `${s}。`);
      const sentences = String(game.overview || "")
        .split("。")
        .map(s => s.trim())
        .filter(Boolean);
      if (sentences.length >= 2 && sentences[0].length < 44) {
        return `${endSentence(sentences[0])}${endSentence(sentences[1])}`;
      }
      if (sentences.length >= 1 && sentences[0] !== game.catchphrase) {
        return endSentence(sentences[0]);
      }
      return game.catchphrase;
    })();

    viewDetail.innerHTML = `
      <div class="detail-container">
        <!-- スリムな詳細ナビバー（共有は外、得点・音・お気に入り・設定はハンバーガーへ） -->
        <nav class="detail-nav-bar" aria-label="詳細ナビゲーション">
          <button class="btn-nav-back" id="btn-back-home" aria-label="ゲーム一覧に戻る">
            <svg class="ui-svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.5 4.5L7 10l5.5 5.5"/></svg>
            <span>一覧</span>
          </button>
          <div class="detail-nav-title">
            <span class="nav-name">${renderGameTitle(game)}</span>
          </div>
          <div class="detail-nav-right">
            <button class="btn-compact-share" id="detail-share-btn" aria-label="この遊びを共有する" title="友達に共有する">
              <svg class="ui-svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 3v9.5M6.5 6.5L10 3l3.5 3.5"/><path d="M4.5 11.5v4a1.5 1.5 0 0 0 1.5 1.5h8a1.5 1.5 0 0 0 1.5-1.5v-4"/></svg>
              <span class="share-btn-label">共有</span>
            </button>
            <button class="btn-detail-menu" id="btn-detail-menu" aria-label="メニューと設定を開く" aria-haspopup="dialog" aria-controls="modal-settings" title="メニュー・設定">
              <svg class="ui-svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M3.5 5.5h13M3.5 10h13M3.5 14.5h13"/></svg>
            </button>
          </div>
        </nav>

        <!-- メインカード・ヒーロー（余計なボタンを引いてスッキリ） -->
        <div class="detail-compact-hero">
          <div class="detail-hero-info">
            <h2 class="detail-compact-title">${renderGameTitle(game)}</h2>
            <p class="detail-compact-catch">${escapeHTML(game.catchphrase)}</p>
            <div class="detail-compact-meta">
              <span class="meta-item"><svg class="meta-svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="6" cy="5.5" r="2.2"/><path d="M2.2 13c.4-2 2-3.2 3.8-3.2s3.4 1.2 3.8 3.2"/><circle cx="11.2" cy="6.2" r="1.7"/><path d="M10.8 10.1c1.3.2 2.5 1.1 2.9 2.7"/></svg>${escapeHTML(formatPlayersText(game))}</span>
              <span class="meta-item"><svg class="meta-svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="8" r="5.8"/><path d="M8 4.8V8l2.2 1.4"/></svg>${escapeHTML(game.duration)}</span>
              <span class="meta-item"><svg class="meta-svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><rect x="4.5" y="2" width="7" height="12" rx="1.5"/><path d="M7.2 11.8h1.6"/></svg>${escapeHTML(game.preparation)}</span>
            </div>
          </div>
        </div>

        <!-- タブ切り替えバー -->
        <div class="detail-tabs-bar">
          ${hasTool ? `
            <button class="detail-tab-btn ${state.activeTab === 'tool' ? 'active' : ''}" data-tab="tool">
              <span>遊ぶ</span>
            </button>
          ` : ''}
          <button class="detail-tab-btn ${state.activeTab === 'rules' ? 'active' : ''}" data-tab="rules">
            <span>ルール</span>
          </button>
          ${game.presets && game.presets.length > 0 ? `
            <button class="detail-tab-btn ${state.activeTab === 'presets' ? 'active' : ''}" data-tab="presets">
              <span>お題 (${totalPresets})</span>
            </button>
          ` : ''}
        </div>

        <!-- タブコンテンツエリア -->
        <div class="detail-tab-content">
          <!-- 1. ゲームツールタブ -->
          ${hasTool ? `
            <div class="tab-pane ${state.activeTab === 'tool' ? 'active' : ''}" id="pane-tool">
              <div id="tool-mount-point"></div>
              ${affiliateMarkup}
            </div>
          ` : ''}

          <!-- 2. ルールタブ（縦積みを1枚の落ち着いたカードに統合） -->
          <div class="tab-pane ${state.activeTab === 'rules' ? 'active' : ''}" id="pane-rules">
            <div class="rules-section">
              <div class="section-box rules-unified-card">
                <div class="rules-lead-block">
                  <h3 class="section-title">ルール</h3>
                  <p class="section-text">${escapeHTML(game.overview)}</p>
                </div>

                <div class="rules-flow-block">
                  <h4 class="rules-sub-heading">遊び方の流れ</h4>
                  <ol class="rules-step-list rules-timeline">
                    ${game.rules.map(r => `
                      <li class="rule-step-item">
                        <div class="step-badge" aria-hidden="true">${escapeHTML(String(r.step))}</div>
                        <div class="step-content">
                          <h5 class="step-title">${escapeHTML(r.title)}</h5>
                          <p class="step-desc">${escapeHTML(r.desc).replace(/\n/g, '<br>')}</p>
                        </div>
                      </li>
                    `).join('')}
                  </ol>
                </div>

                ${game.tips && game.tips.length > 0 ? `
                  <div class="rules-tips-note">
                    <h4 class="rules-sub-heading">楽しむコツ</h4>
                    <ul class="tips-list">
                      ${game.tips.map(t => `<li>${escapeHTML(t)}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}
              </div>

              <!-- 公式アイテム・アフィリエイト枠 -->
              ${affiliateMarkup}
            </div>
          </div>

          <!-- 3. お題リストタブ -->
          ${game.presets && game.presets.length > 0 ? `
            <div class="tab-pane ${state.activeTab === 'presets' ? 'active' : ''}" id="pane-presets">
              <div class="presets-section">
                <div class="presets-header-bar">
                  <h3 class="section-title">お題</h3>
                  <button class="btn btn-sm btn-outline" id="btn-open-topic-custom" aria-expanded="false" aria-controls="custom-topic-editor">お題を追加・管理する</button>
                </div>
                <div id="custom-topic-editor" class="section-box mt-3 hidden">
                  <label for="custom-topic-text">${game.id === "sea-turtle" ? "自作問題の問題文" : "自分たちのお題"}（この端末に保存）</label>
                  <form id="custom-topic-form" class="mt-2">
                    <input id="custom-topic-text" class="search-input-field" maxlength="${game.id === 'sea-turtle' ? 1000 : 160}" required placeholder="${game.id === 'sea-turtle' ? 'みんなに読んでもらう問題文' : game.id === 'word-wolf' ? '例：トンボ / チョウ' : '例：旅行に持っていきたいもの'}">
                    ${game.id === "sea-turtle" ? '<label for="custom-topic-answer">真相（出題者用）</label><textarea id="custom-topic-answer" class="search-input-field" maxlength="1500" required></textarea>' : ''}
                    <button class="btn btn-primary mt-2" type="submit">保存</button>
                  </form>
                </div>

                <div class="presets-grid mt-3">
                  ${customTopics.map((c, idx) => `
                    <div class="preset-item-card custom-preset-card">
                      <span class="preset-tag preset-tag-custom">オリジナル</span>
                      <div class="preset-text">${escapeHTML(typeof c === "string" ? c : c.question)}</div>
                      ${game.id === "sea-turtle" ? `<button class="btn btn-sm btn-outline" data-edit-quiz="${idx}">${typeof c === "string" ? "真相を追加して出題できるようにする" : "問題を編集"}</button>` : ''}
                      <button class="btn btn-sm btn-outline" data-remove-topic="${idx}" aria-label="追加したお題を削除">削除</button>
                    </div>
                  `).join('')}

                  ${game.presets.map((p, idx) => {
                    let text = '';
                    let rawStr = '';
                    if (typeof p === 'string') {
                      text = `<span class="preset-num">${idx + 1}</span>${escapeHTML(p)}`;
                      rawStr = p;
                    } else if (p.text) {
                      text = `<span class="preset-num">${idx + 1}</span><div>${escapeHTML(p.text)}</div>`;
                    } else if (p.citizen) {
                      text = `<span class="preset-tag">${escapeHTML(p.category)}</span><div>市民: <strong>${escapeHTML(p.citizen)}</strong> / ウルフ: <strong>${escapeHTML(p.wolf)}</strong></div>`;
                      rawStr = `${p.citizen} / ${p.wolf}`;
                    } else if (p.word) {
                      text = `<span class="preset-num">${idx + 1}</span><div><strong>${escapeHTML(p.word)}</strong> <span class="text-sub">(${escapeHTML(p.hint)})</span></div>`;
                      rawStr = p.word;
                    } else if (p.a) {
                      text = `<span class="preset-num">${idx + 1}</span><div>A: ${escapeHTML(p.a)} <br>B: ${escapeHTML(p.b)}</div>`;
                      rawStr = `A:${p.a} B:${p.b}`;
                    } else if (p.q) {
                      text = `<span class="preset-tag">${escapeHTML(p.category)}</span><div>${escapeHTML(p.q)}</div>`;
                      rawStr = p.q;
                    } else if (p.title) {
                      return `<div class="preset-item-card"><strong>${escapeHTML(p.title)}</strong>: ${escapeHTML(p.question)}</div>`;
                    }
                    return text ? `<div class="preset-item-card">${text}</div>` : '';
                  }).join('')}
                </div>
                ${game.seoSlug ? `
                  <div class="section-box mt-4 seo-link-banner">
                    <div class="seo-banner-header">
                      <span class="seo-banner-tag">まとめ記事</span>
                      <h4 class="seo-banner-title">『${escapeHTML(game.title)}』のお題・遊び方ガイド</h4>
                    </div>
                    <p class="seo-banner-desc">シーン別のお題やアレンジ例をまとめています。</p>
                    <a href="${game.seoSlug}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-block mt-2">
                      ガイドを読む ↗
                    </a>
                  </div>
                ` : ''}
                ${affiliateMarkup}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- 関連するおすすめゲーム -->
        <div class="detail-recommend-section">
          <h3 class="recommend-title">次に遊ぶなら</h3>
          <div class="recommend-grid" id="recommend-grid"></div>
        </div>
      </div>
    `;

    // 自作お題の追加・削除。端末内だけに保存し、既存の抽選機能と共有する。
    let editingQuiz = null;
    const topicButton = viewDetail.querySelector('#btn-open-topic-custom');
    topicButton?.addEventListener('click', () => {
      if (editingQuiz !== null) {
        editingQuiz = null;
        viewDetail.querySelector('#custom-topic-form').reset();
      }
      const editor = viewDetail.querySelector('#custom-topic-editor');
      const expanded = topicButton.getAttribute('aria-expanded') !== 'true';
      topicButton.setAttribute('aria-expanded', String(expanded));
      editor.classList.toggle('hidden', !expanded);
      if (expanded) editor.querySelector('input').focus();
    });
    viewDetail.querySelectorAll('[data-edit-quiz]').forEach(button => button.addEventListener('click', () => {
      editingQuiz = Number(button.dataset.editQuiz);
      const item = customTopics[editingQuiz];
      const editor = viewDetail.querySelector('#custom-topic-editor');
      editor.classList.remove('hidden');
      topicButton.setAttribute('aria-expanded', 'true');
      editor.querySelector('#custom-topic-text').value = typeof item === 'string' ? item : item.question;
      editor.querySelector('#custom-topic-answer').value = item.answer || '';
      editor.querySelector('#custom-topic-answer').focus();
    }));
    viewDetail.querySelector('#custom-topic-form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = viewDetail.querySelector('#custom-topic-text');
      const answer = viewDetail.querySelector('#custom-topic-answer');
      const topic = answer ? {question: input.value, answer: answer.value} : input.value;
      if (game.id === "word-wolf" && !customWolfPair(input.value)) {
        Toast.warning("異なる2つのお題を「 / 」で区切ってください");
        input.focus();
        return;
      }
      if (answer && (!input.value.trim() || !answer.value.trim())) {
        Toast.warning("問題文と真相を入力してください");
        (input.value.trim() ? answer : input).focus();
        return;
      }
      if (TopicManager.addCustomTopic(game.id, topic, editingQuiz)) {
        state.activeTab = 'presets';
        cleanupActiveTool();
        showGameDetail(game, 'presets');
        Toast.success('お題を保存しました');
        viewDetail.querySelector('#btn-open-topic-custom')?.focus();
      }
    });
    viewDetail.querySelectorAll('[data-remove-topic]').forEach(button => button.addEventListener('click', () => {
      TopicManager.removeCustomTopic(game.id, Number(button.dataset.removeTopic));
      state.activeTab = 'presets';
      cleanupActiveTool();
      showGameDetail(game, 'presets');
      viewDetail.querySelector('#btn-open-topic-custom')?.focus();
    }));

    // 戻るボタン（プレイ中の誤タップ・誤爆防止ガード付き）
    viewDetail.querySelector("#btn-back-home").addEventListener("click", () => {
      requestLeaveGame(() => {
        document.body.classList.remove("is-tool-active");
        Sound.playClick();
        window.location.hash = "";
      });
    });

    // 道具なしゲームのスタンプ手動獲得ボタン
    const markRulesBtn = viewDetail.querySelector("#btn-mark-rules-played");
    if (markRulesBtn) {
      markRulesBtn.addEventListener("click", () => {
        Sound.playFanfare();
        if (window.AsobiPlayLifecycle && typeof window.AsobiPlayLifecycle.start === "function") {
          window.AsobiPlayLifecycle.start(game.id);
        } else {
          StampRally.markPlayed(game.id);
        }
        markRulesBtn.textContent = 'プレイ済みに記録済み';
        markRulesBtn.className = 'btn btn-sm btn-secondary';
        markRulesBtn.disabled = true;
      });
    }

    // お気に入り状態同期（ハンバーガーメニュー内の「このゲーム」欄）
    updateDetailFavButton();
    viewDetail.querySelector("#detail-fav-btn")?.addEventListener("click", (e) => {
      toggleFavorite(game.id, e);
    });

    // 詳細画面ハンバーガーメニュー
    viewDetail.querySelector("#btn-detail-menu")?.addEventListener("click", () => {
      Sound.playClick();
      syncSettingsModal();
      if (modalSettings) ModalManager.open(modalSettings);
    });

    // シェアボタン（コピー時はボタン自体が ✓ コピー済 に変わる）
    const shareBtn = viewDetail.querySelector("#detail-share-btn");
    shareBtn?.addEventListener("click", async () => {
      Sound.playClick();
      const shareData = {
        title: `${game.title} | あそびポケット`,
        text: `スマホ1台・手ぶらですぐ遊べる「${game.title}」を遊ぼう！`,
        url: window.location.href
      };
      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (e) {}
      } else {
        try {
          await navigator.clipboard.writeText(window.location.href);
          const lbl = shareBtn.querySelector(".share-btn-label");
          if (lbl) {
            lbl.textContent = "コピー済";
            shareBtn.classList.add("is-copied");
            setTimeout(() => {
              lbl.textContent = "共有";
              shareBtn.classList.remove("is-copied");
            }, 1600);
          }
        } catch (e) {
          const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`;
          window.open(xUrl, "_blank", "noopener,noreferrer");
        }
      }
    });

    updateMuteButtons();

    // タブ切り替え & ツール連動スリムヘッダー ＆ フルスクリーンゲームモード
    const detailContainer = viewDetail.querySelector(".detail-container");
    function syncToolTabHeader() {
      const isTool = state.activeTab === "tool";
      if (detailContainer) {
        detailContainer.classList.toggle("is-tool-tab", isTool);
      }
      document.body.classList.toggle("is-tool-active", isTool);
    }
    syncToolTabHeader();

    viewDetail.querySelectorAll(".detail-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        Sound.playClick();
        state.activeTab = btn.dataset.tab;
        viewDetail.querySelectorAll(".detail-tab-btn").forEach(b => b.classList.remove("active"));
        viewDetail.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
        btn.classList.add("active");
        viewDetail.querySelector(`#pane-${state.activeTab}`).classList.add("active");
        syncToolTabHeader();
      });
    });

    // ツールマウント（宣言的ディスパッチテーブル）
    const TOOL_RENDERERS = {
      "ito": (m, g) => GameTools.renderIto(m, g),
      "asa-sore": (m, g) => GameTools.renderAsaSore(m, g),
      "wordwolf": (m, g) => GameTools.renderWordWolf(m, g),
      "bomb-timer": (m, g) => GameTools.renderBombTimer(m, g),
      "katakana-ban": (m, g) => GameTools.renderKatakanaBan(m, g),
      "finger-roulette": (m, g) => GameTools.renderFingerRoulette(m, g),
      "two-choices": (m, g) => GameTools.renderTwoChoices(m, g),
      "sea-turtle": (m, g) => GameTools.renderSeaTurtle(m, g),
      "ten-seconds": (m, g) => GameTools.renderTenSeconds(m, g),
      "talk-gacha": (m, g) => GameTools.renderTalkGacha(m, g),
      "ng-word": (m, g) => GameTools.renderNgWord(m, g),
      "indian-poker": (m, g) => GameTools.renderIndianPoker(m, g),
      "one-night-werewolf": (m, g) => GameTools.renderOneNightWerewolf(m, g),
      "yomibito": (m, g) => GameTools.renderYomibito(m, g),
      "batsu-roulette": (m, g) => GameTools.renderBatsuRoulette(m, g),
      "duel-reflex": (m, g) => GameTools.renderDuelReflex(m, g),
      "duel-mash": (m, g) => GameTools.renderDuelMash(m, g),
      "duel-color": (m, g) => GameTools.renderDuelColor(m, g),
      "yamanote": (m, g) => GameTools.renderYamanote(m, g),
      "stand-up": (m, g) => GameTools.renderStandUp(m, g),
      "ping-pong": (m, g) => GameTools.renderPingPong(m, g),
      "takenoko": (m, g) => GameTools.renderTakenoko(m, g),
      "high-low": (m, g) => GameTools.renderHighLow(m, g),
      "magical-banana": (m, g) => GameTools.renderMagicalBanana(m, g),
      "twenty-questions": (m, g) => GameTools.renderTwentyQuestions(m, g),
      "good-bad-news": (m, g) => GameTools.renderGoodBadNews(m, g),
      "count-30": (m, g) => GameTools.renderCount30(m, g),
      "word-chain": (m, g) => GameTools.renderWordChain(m, g),
      "two-truths": (m, g) => GameTools.renderTwoTruths(m, g),
      "doremi": (m, g) => GameTools.renderDoremi(m, g),
      "rhythm-box": (m, g) => GameTools.renderRhythmBox(m, g),
      "gesture": (m, g) => GameTools.renderGesture(m, g),
      "gesture-game": (m, g) => GameTools.renderGesture(m, g)
    };

    if (hasTool && typeof GameTools !== "undefined") {
      const mount = viewDetail.querySelector("#tool-mount-point");
      const renderFn = TOOL_RENDERERS[game.toolType];
      if (typeof renderFn === "function") {
        try {
          const toolGame = state.articleTopic ? { ...game, articleTopic: state.articleTopic } : game;
          currentToolCleanup = renderFn(mount, toolGame);
        } catch (err) {
          console.error(`[AsobiPocket] Error mounting tool "${game.toolType}":`, err);
        }
      }
    }

    // レコメンド表示
    const recGrid = viewDetail.querySelector("#recommend-grid");
    const recs = state.games.filter(g => g.id !== game.id).slice(0, 3);
    recs.forEach(rec => {
      const rCard = document.createElement("div");
      rCard.className = "recommend-card";
      rCard.innerHTML = `
        <div class="rec-info">
          <strong class="rec-title">${escapeHTML(rec.title)}</strong>
          <span class="rec-meta">${escapeHTML(formatPlayersText(rec))} · ${escapeHTML(rec.duration)}</span>
        </div>
      `;
      rCard.addEventListener("click", () => {
        Sound.playSelect();
        navigateToGame(rec.id);
      });
      recGrid.appendChild(rCard);
    });
  }

  // ==========================================
  // ボトムナビゲーションバー連動
  // ==========================================
  const btmNavHome = document.getElementById("btm-nav-home");
  const btmNavRoulette = document.getElementById("btm-nav-roulette");
  const btmNavFav = document.getElementById("btm-nav-fav");
  const btmNavSearch = document.getElementById("btm-nav-search");

  if (btmNavHome) {
    btmNavHome.addEventListener("click", (e) => {
      e.preventDefault();
      requestLeaveGame(() => {
        Sound.playClick();
        window.location.hash = "";
        if (!state.activeGameId) showHome();
      });
    });
  }

  if (btmNavRoulette) {
    btmNavRoulette.addEventListener("click", () => {
      if (modalRoulette) ModalManager.open(modalRoulette);
    });
  }

  if (btmNavFav) {
    btmNavFav.addEventListener("click", () => {
      toggleFavoriteFilter({ showToast: !state.filter.onlyFavorite });
    });
  }

  if (btmNavSearch) {
    btmNavSearch.addEventListener("click", () => {
      Sound.playClick();
      revealSearch();
    });
  }

  // ==========================================
  // グローバル・キーボードショートカット
  // ==========================================
  document.addEventListener("keydown", (e) => {
    // 入力フォームフォーカス中はスキップ
    const activeEl = document.activeElement;
    const isTyping = activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.isContentEditable);

    if (e.key === "Escape") {
      if (e.defaultPrevented) return;
      const anyOpenModal = document.querySelector(".modal-backdrop:not(.hidden), .modal-overlay:not(.hidden)");
      if (anyOpenModal) {
        ModalManager.closeAll();
        return;
      }
      if (state.activeGameId) {
        requestLeaveGame(() => {
          window.location.hash = "";
        });
        return;
      }
    }

    // 修飾キー併用（Ctrl+R/F等）やモーダル表示中はアプリ固有ショートカットを発火させない
    const hasOpenModal = Boolean(
      ModalManager.activeModal ||
      document.querySelector(".modal-backdrop:not(.hidden), .modal-overlay:not(.hidden)")
    );
    if (!isTyping && !hasOpenModal && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (e.key === "/") {
        e.preventDefault();
        if (searchInput) { revealSearch(); searchInput.select(); }
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        if (modalRoulette) ModalManager.open(modalRoulette);
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFavoriteFilter({ showToast: true });
      } else if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        requestLeaveGame(() => {
          Sound.playClick();
          window.location.hash = "";
          if (!state.activeGameId) showHome();
        });
      }
    }
  });

  // ==========================================
  // PWA アプリインストールプロンプト制御
  // ==========================================
  let deferredPrompt = null;
  const pwaInstallBanner = document.getElementById("pwa-install-banner");
  const btnPwaInstall = document.getElementById("btn-pwa-install");
  const btnPwaClose = document.getElementById("btn-pwa-close");
  const btnMenuPwa = document.getElementById("btn-menu-pwa-install");
  const menuPwaCard = document.getElementById("menu-pwa-card");
  const modalPwaGuide = document.getElementById("modal-pwa-guide");
  const btnClosePwaGuide = document.getElementById("btn-close-pwa-guide");
  const btnPwaGuideOk = document.getElementById("btn-pwa-guide-ok");

  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;

  if (isStandalone && menuPwaCard) {
    menuPwaCard.classList.add("hidden");
  }

  if (!isStandalone) {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e;
      // ユーザーのゲーム選択・即プレイ体験を最優先し、画面を遮るバナーの自動表示は行わない。
      // インストールは右上のハンバーガーメニュー最上段からいつでも実行可能。
    });
  }

  async function triggerPwaInstall() {
    Sound.playClick();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        Toast.success("アプリのインストールを開始しました");
        if (pwaInstallBanner) pwaInstallBanner.classList.add("hidden");
        if (menuPwaCard) menuPwaCard.classList.add("hidden");
      }
      deferredPrompt = null;
    } else {
      if (modalPwaGuide) {
        ModalManager.open(modalPwaGuide);
      }
    }
  }

  if (btnMenuPwa) {
    btnMenuPwa.addEventListener("click", () => {
      if (modalSettings && !modalSettings.classList.contains("hidden")) {
        ModalManager.close(modalSettings);
      }
      triggerPwaInstall();
    });
  }

  if (btnPwaInstall) {
    btnPwaInstall.addEventListener("click", triggerPwaInstall);
  }

  if (btnPwaClose) {
    btnPwaClose.addEventListener("click", () => {
      Sound.playClick();
      if (pwaInstallBanner) pwaInstallBanner.classList.add("hidden");
      Storage.set("asobi_pwa_dismissed", true);
    });
  }

  if (btnClosePwaGuide) {
    btnClosePwaGuide.addEventListener("click", () => {
      if (modalPwaGuide) ModalManager.close(modalPwaGuide);
    });
  }

  if (btnPwaGuideOk) {
    btnPwaGuideOk.addEventListener("click", () => {
      if (modalPwaGuide) ModalManager.close(modalPwaGuide);
    });
  }

  // ==========================================
  // ⚙️ アプリ設定 ＆ 便利機能モーダル制御
  // ==========================================
  const btnOpenSettings = document.getElementById("btn-open-settings");
  const modalSettings = document.getElementById("modal-settings");
  const btnCloseSettings = document.getElementById("btn-close-settings");
  const settingSoundToggle = document.getElementById("setting-sound-toggle");
  const settingThemeToggle = document.getElementById("setting-theme-toggle");
  const settingWakeLockToggle = document.getElementById("setting-wakelock-toggle");
  const settingKidsToggle = document.getElementById("setting-kids-toggle");

  function updateMuteButtons() {
    const isMuted = Sound.isMuted;
    const icon = isMuted
      ? '<svg class="ui-svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8v4h3.2l4.3 3.5V4.5L7.2 8H4z"/><path d="M14 8l4 4M18 8l-4 4"/></svg>'
      : '<svg class="ui-svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8v4h3.2l4.3 3.5V4.5L7.2 8H4z"/><path d="M14.5 7.5a3.5 3.5 0 010 5"/></svg>';
    const label = isMuted ? "音なし：効果音をオンにする" : "音あり：効果音をオフにする";

    const detailMuteBtn = document.getElementById("btn-detail-mute");
    if (detailMuteBtn) {
      detailMuteBtn.innerHTML = `<span class="mute-svg-wrap" aria-hidden="true">${icon}</span><span class="sound-state-label">${isMuted ? '音なし' : '音あり'}</span>`;
      detailMuteBtn.setAttribute("aria-pressed", String(isMuted));
      detailMuteBtn.setAttribute("aria-label", label);
      detailMuteBtn.title = label;
      detailMuteBtn.classList.toggle("is-muted", isMuted);
    }
    const menuSoundStatus = document.getElementById("menu-sound-status");
    if (menuSoundStatus) {
      menuSoundStatus.textContent = isMuted ? "音なし" : "音あり";
      menuSoundStatus.classList.toggle("is-on", !isMuted);
    }
  }

  function handleMuteToggle() {
    Sound.toggleMute();
    updateMuteButtons();
    syncSettingsModal();
    window.dispatchEvent(new CustomEvent("asobi:sound-change", { detail: { muted: Sound.isMuted } }));
  }

  window.enableAsobiSound = function enableAsobiSound() {
    Sound.isMuted = false;
    Storage.set("asobi_sound_muted", false);
    Sound.playClick();
    updateMuteButtons();
    syncSettingsModal();
    window.dispatchEvent(new CustomEvent("asobi:sound-change", { detail: { muted: false } }));
  };

  updateMuteButtons();

  function syncSettingsModal() {
    if (settingSoundToggle) settingSoundToggle.checked = !Sound.isMuted;
    if (settingThemeToggle) settingThemeToggle.checked = state.isDark;
    if (settingWakeLockToggle) settingWakeLockToggle.checked = WakeLockManager.isEnabled;
    if (settingKidsToggle) settingKidsToggle.checked = state.kidsMode;
    const menuSoundStatus = document.getElementById("menu-sound-status");
    if (menuSoundStatus) {
      menuSoundStatus.textContent = Sound.isMuted ? "音なし" : "音あり";
      menuSoundStatus.classList.toggle("is-on", !Sound.isMuted);
    }
    updateDetailFavButton();
  }

  document.getElementById("btn-menu-game-fav")?.addEventListener("click", (e) => {
    if (state.activeGameId) {
      toggleFavorite(state.activeGameId, e);
    }
  });

  if (btnOpenSettings) {
    btnOpenSettings.addEventListener("click", () => {
      syncSettingsModal();
      if (modalSettings) ModalManager.open(modalSettings);
    });
  }

  if (btnCloseSettings) {
    btnCloseSettings.addEventListener("click", () => {
      if (modalSettings) ModalManager.close(modalSettings);
    });
  }

  if (settingSoundToggle) {
    settingSoundToggle.addEventListener("change", (e) => {
      Sound.isMuted = !e.target.checked;
      if (!Sound.isMuted) Sound.playClick();
      Storage.set("asobi_sound_muted", Sound.isMuted);
      updateMuteButtons();
      window.dispatchEvent(new CustomEvent("asobi:sound-change", { detail: { muted: Sound.isMuted } }));
    });
  }

  if (settingKidsToggle) {
    settingKidsToggle.addEventListener("change", (e) => {
      Sound.playClick();
      state.kidsMode = e.target.checked;
      Storage.set("asobi_kids_mode", state.kidsMode);
      renderGrid();
      if (state.activeGameId) {
        const game = state.games.find(g => g.id === state.activeGameId);
        if (game) showGameDetail(game);
      }
    });
  }

  if (settingThemeToggle) {
    settingThemeToggle.addEventListener("change", (e) => {
      Sound.playClick();
      state.isDark = e.target.checked;
      Storage.set("asobi_theme_dark", state.isDark);
      applyTheme();
    });
  }

  if (settingWakeLockToggle) {
    settingWakeLockToggle.addEventListener("change", (e) => {
      Sound.playClick();
      WakeLockManager.setEnabled(e.target.checked);
    });
  }

  // 設定項目の行全体タップでスイッチ切替（モバイル操作性向上）
  const settingRows = document.querySelectorAll(".setting-item-row");
  settingRows.forEach(row => {
    row.addEventListener("click", (e) => {
      if (e.target.closest("button") || e.target.closest("input") || e.target.closest("label.toggle-switch")) return;
      const checkbox = row.querySelector("input[type='checkbox']");
      if (checkbox) {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  });

  // アプリ保存データの一括初期化
  const btnResetAppData = document.getElementById("btn-reset-app-data");
  if (btnResetAppData) {
    btnResetAppData.addEventListener("click", async () => {
      const ok = typeof GameResult !== "undefined" && typeof GameResult.confirmAction === "function"
        ? await GameResult.confirmAction({
            title: "保存データを初期化しますか？",
            message: "お気に入り、プレイ履歴、スタンプラリー、カスタムお題など、すべての保存データを初期化します。",
            confirmLabel: "初期化する",
            cancelLabel: "キャンセル",
            danger: true
          })
        : true;
      if (ok) {
        Sound.playExplosion();
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("asobi_")) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        Toast.success("すべてのデータを初期化しました。再読み込みします...");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    });
  }

  // ==========================================
  // 万能ミニスコアボード制御
  // ==========================================
  const btnToggleScoreboard = document.getElementById("btn-toggle-scoreboard");
  const scoreboardDrawer = document.getElementById("scoreboard-drawer");
  const btnCloseScoreboard = document.getElementById("btn-close-scoreboard");
  const btnResetScores = document.getElementById("btn-reset-scores");
  const btnAddPlayer = document.getElementById("btn-add-player");
  const scoreboardList = document.getElementById("scoreboard-players-list");

  function openScoreboard() {
    Sound.playClick();
    if (scoreboardDrawer) scoreboardDrawer.classList.remove("hidden");
    ScoreBoard.render();
  }

  function closeScoreboard() {
    Sound.playClick();
    if (scoreboardDrawer) scoreboardDrawer.classList.add("hidden");
  }

  if (btnToggleScoreboard) {
    btnToggleScoreboard.addEventListener("click", () => {
      if (scoreboardDrawer && scoreboardDrawer.classList.contains("hidden")) {
        openScoreboard();
      } else {
        closeScoreboard();
      }
    });
  }

  if (btnCloseScoreboard) {
    btnCloseScoreboard.addEventListener("click", closeScoreboard);
  }

  if (btnResetScores) {
    btnResetScores.addEventListener("click", async () => {
      const ok = typeof GameResult !== "undefined" && typeof GameResult.confirmAction === "function"
        ? await GameResult.confirmAction({
            title: "スコアをリセットしますか？",
            message: "全員のスコアを0点に戻します。",
            confirmLabel: "リセットする",
            cancelLabel: "キャンセル",
            danger: true
          })
        : true;
      if (ok) {
        ScoreBoard.resetScores();
      }
    });
  }

  if (btnAddPlayer) {
    btnAddPlayer.addEventListener("click", () => {
      Sound.playClick();
      ScoreBoard.addPlayer();
    });
  }

  if (scoreboardList) {
    scoreboardList.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const idx = parseInt(btn.dataset.idx, 10);
      const action = btn.dataset.action;
      if (action === "plus") ScoreBoard.changeScore(idx, 1);
      else if (action === "minus") ScoreBoard.changeScore(idx, -1);
      else if (action === "del") ScoreBoard.removePlayer(idx);
    });

    scoreboardList.addEventListener("change", (e) => {
      if (e.target.classList.contains("score-player-name")) {
        const idx = parseInt(e.target.dataset.idx, 10);
        ScoreBoard.renamePlayer(idx, e.target.value);
      }
    });
  }
  ScoreBoard.render();

  // ==========================================
  // 親決め ＆ 罰ゲーム ルーレット常設モーダル制御
  // ==========================================
  const modalFingerRoulette = document.getElementById("modal-finger-roulette");
  const btnCloseFingerModal = document.getElementById("btn-close-finger-modal");
  const fingerModalMount = document.getElementById("finger-modal-mount");

  const modalBatsuRoulette = document.getElementById("modal-batsu-roulette");
  const btnCloseBatsuModal = document.getElementById("btn-close-batsu-modal");
  const batsuModalMount = document.getElementById("batsu-modal-mount");

  let fingerModalCleanup = null;
  let batsuModalCleanup = null;

  window.__cleanupActiveModal = function(modalId) {
    if (!modalId || modalId === "modal-finger-roulette") {
      if (typeof fingerModalCleanup === "function") {
        try { fingerModalCleanup(); } catch (e) {}
        fingerModalCleanup = null;
      }
    }
    if (!modalId || modalId === "modal-batsu-roulette") {
      if (typeof batsuModalCleanup === "function") {
        try { batsuModalCleanup(); } catch (e) {}
        batsuModalCleanup = null;
      }
    }
  };

  function openFingerModal() {
    if (!modalFingerRoulette || !fingerModalMount) return;
    window.__cleanupActiveModal("modal-finger-roulette");
    fingerModalMount.innerHTML = "";
    if (typeof GameTools !== "undefined" && typeof GameTools.renderFingerRoulette === "function") {
      const fingerGame = state.games.find(g => g.id === "finger-roulette") || { id: "finger-roulette", title: "親決めルーレット" };
      fingerModalCleanup = GameTools.renderFingerRoulette(fingerModalMount, fingerGame);
    }
    ModalManager.open(modalFingerRoulette);
  }
  window.openFingerModal = openFingerModal;

  function openBatsuModal() {
    if (!modalBatsuRoulette || !batsuModalMount) return;
    window.__cleanupActiveModal("modal-batsu-roulette");
    batsuModalMount.innerHTML = "";
    if (typeof GameTools !== "undefined" && typeof GameTools.renderBatsuRoulette === "function") {
      const batsuGame = state.games.find(g => g.id === "batsu-roulette") || { id: "batsu-roulette", title: "罰ゲームルーレット" };
      batsuModalCleanup = GameTools.renderBatsuRoulette(batsuModalMount, batsuGame);
    }
    ModalManager.open(modalBatsuRoulette);
  }
  window.openBatsuModal = openBatsuModal;

  if (btnCloseFingerModal && modalFingerRoulette) {
    btnCloseFingerModal.addEventListener("click", () => {
      ModalManager.close(modalFingerRoulette);
    });
  }

  if (btnCloseBatsuModal && modalBatsuRoulette) {
    btnCloseBatsuModal.addEventListener("click", () => {
      ModalManager.close(modalBatsuRoulette);
    });
  }

  // ハンバーガーメニュー内の便利ツール導線
  const btnMenuFinger = document.getElementById("btn-menu-finger");
  const btnMenuBatsu = document.getElementById("btn-menu-batsu");
  const btnMenuScoreboard = document.getElementById("btn-menu-scoreboard");
  const btnMenuRoulette = document.getElementById("btn-menu-roulette");

  if (btnMenuFinger) {
    btnMenuFinger.addEventListener("click", () => {
      if (modalSettings) ModalManager.close(modalSettings);
      openFingerModal();
    });
  }
  if (btnMenuBatsu) {
    btnMenuBatsu.addEventListener("click", () => {
      if (modalSettings) ModalManager.close(modalSettings);
      openBatsuModal();
    });
  }
  if (btnMenuScoreboard) {
    btnMenuScoreboard.addEventListener("click", () => {
      if (modalSettings) ModalManager.close(modalSettings);
      if (scoreboardDrawer && !scoreboardDrawer.classList.contains("hidden")) return;
      const toggleBtn = document.getElementById("btn-toggle-scoreboard");
      if (toggleBtn) toggleBtn.click();
      else openScoreboard();
    });
  }
  if (btnMenuRoulette) {
    btnMenuRoulette.addEventListener("click", () => {
      if (modalSettings) ModalManager.close(modalSettings);
      if (modalRoulette) ModalManager.open(modalRoulette);
    });
  }

  // ==========================================
  // ④ トーク集中モードのイベントバインド
  // ==========================================
  const btnCloseTalkFocus = document.getElementById("btn-close-talk-focus");
  const btnFocusToggleTimer = document.getElementById("btn-focus-toggle-timer");

  if (btnCloseTalkFocus) {
    btnCloseTalkFocus.addEventListener("click", () => {
      Sound.playClick();
      TalkFocus.close();
    });
  }

  if (btnFocusToggleTimer) {
    btnFocusToggleTimer.addEventListener("click", () => {
      Sound.playClick();
      TalkFocus.toggleTimer();
    });
  }

  // モーダル背景クリック ＆ 閉じるボタン委譲
  document.querySelectorAll(".modal-backdrop, .modal-overlay").forEach(modal => {
    modal.addEventListener("click", (e) => {
      if (
        e.target === modal ||
        e.target.classList.contains("modal-close-btn") ||
        e.target.closest(".modal-close-btn") ||
        e.target.classList.contains("btn-modal-close") ||
        e.target.closest(".btn-modal-close")
      ) {
        ModalManager.close(modal);
      }
    });
  });

  // スタンプラリー初期描画 ＆ 定番ルール集初期描画
  StampRally.render();
  renderClassicRulesGrid();

  // ==========================================
  // オフライン / オンライン検知 & SW更新監視
  // ==========================================
  window.addEventListener("offline", () => {
    Toast.warning("オフラインになりました（そのまま遊べます）");
  });
  window.addEventListener("online", () => {
    Toast.success("オンラインに復帰しました");
  });

  if ("serviceWorker" in navigator) {
    const workers = navigator.serviceWorker;
    let pageRelease = document.documentElement.dataset.asobiRelease;
    let firstInstall = !workers.controller && !pageRelease;
    let initialNetworkWorker;
    let pending = false;
    let reloading = false;
    let lastCheck = 0;
    let nextCheck;
    const blockers = [...document.querySelectorAll(".modal-backdrop, .modal-overlay, #scoreboard-drawer, #dynamic-island-timer")];
    const changes = new MutationObserver(applyAtHome);

    function applyAtHome() {
      if (!pending || reloading || document.hidden || location.hash.startsWith("#game/") ||
          state.activeGameId || viewHome.classList.contains("hidden")) return;
      if (blockers.some(element => !element.classList.contains("hidden")) ||
          document.activeElement?.matches("input, textarea, select, [contenteditable=true]")) return;
      reloading = true;
      changes.disconnect();
      if (state.filter.onlyFavorite) {
        try { sessionStorage.setItem("asobi_restore_favorites_view", "1"); } catch {}
      }
      location.reload();
    }

    function askRelease() {
      const worker = workers.controller;
      if (!worker) return;
      if (firstInstall) {
        initialNetworkWorker = worker;
        firstInstall = false;
      }
      worker.postMessage({ type: "ASOBI_GET_RELEASE" });
    }

    workers.addEventListener("message", event => {
      if (event.source !== workers.controller || event.data?.type !== "ASOBI_RELEASE") return;
      const release = event.data.release;
      if (typeof release !== "string" || !release.startsWith("asobi-pocket-")) return;
      if (!pageRelease && event.source === initialNetworkWorker) pageRelease = release;
      pending = pageRelease !== release;
      changes.disconnect();
      if (!pending) return;
      for (const element of [viewHome, ...blockers]) changes.observe(element, { attributes: true, attributeFilter: ["class"] });
      applyAtHome();
    });
    workers.addEventListener("controllerchange", askRelease);
    window.addEventListener("hashchange", applyAtHome);
    document.addEventListener("focusout", () => { if (pending) setTimeout(applyAtHome, 0); });

    function checkForRelease() {
      clearTimeout(nextCheck);
      if (document.hidden || !navigator.onLine) return;
      applyAtHome();
      if (reloading) return;
      const now = Date.now();
      if (now - lastCheck >= 60000) {
        lastCheck = now;
        askRelease();
        workers.getRegistration().then(reg => reg?.update()).catch(() => {});
      }
      nextCheck = setTimeout(checkForRelease, Math.max(1, 60000 - (now - lastCheck)));
    }
    document.addEventListener("visibilitychange", checkForRelease);
    window.addEventListener("pageshow", checkForRelease);
    window.addEventListener("online", checkForRelease);
    window.addEventListener("offline", checkForRelease);
    window.addEventListener("pagehide", () => clearTimeout(nextCheck));
    try {
      if (sessionStorage.getItem("asobi_restore_favorites_view") === "1") {
        state.filter.onlyFavorite = true;
        sessionStorage.removeItem("asobi_restore_favorites_view");
      }
    } catch {}
    checkForRelease();
  }

  // ==========================================
  // ルーティング監視
  // ==========================================
  window.addEventListener("hashchange", handleRoute);
  handleRoute();
});
