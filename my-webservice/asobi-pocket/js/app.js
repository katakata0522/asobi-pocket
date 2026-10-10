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
        Toast.success("💡 画面常時点灯（スリープ防止）をONにしました");
      } else {
        this.release();
        Toast.info("💤 画面常時点灯をOFFにしました");
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
      this.activeModal = modal;
      document.body.classList.add("modal-open");
      Sound.playClick();

      this._setInertBackground(true);

      // フォーカス移動（最初のインタラクティブ要素へ）
      const focusables = this._getFocusables(modal);
      if (focusables.length > 0) {
        focusables[0].focus();
      }
    },

    close(modalOrId) {
      const modal = modalOrId ? (typeof modalOrId === "string" ? document.getElementById(modalOrId) : modalOrId) : this.activeModal;
      if (!modal) return false;
      modal.classList.add("hidden");
      if (this.activeModal === modal) {
        this.activeModal = null;
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
          closedAny = true;
        }
      });
      const drawer = document.getElementById("scoreboard-drawer");
      if (drawer && !drawer.classList.contains("hidden")) {
        drawer.classList.add("hidden");
        closedAny = true;
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
        document.getElementById("app-container"),
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
        this.closeAll();
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
    addCustomTopic(gameId, topic) {
      if (!topic || !topic.trim()) return false;
      const data = Storage.get("asobi_custom_topics", {});
      if (!data[gameId]) data[gameId] = [];
      data[gameId].push(topic.trim());
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
      Toast.success(`「${n}」を追加しました`);
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
      Toast.info("スコアを0にリセットしました");
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
        Sound.playFanfare();
        const total = this.getActiveTotal();
        const activeCount = this.getActivePlayedCount();
        Toast.success(`👑 ゲーム制覇スタンプ獲得！ (${activeCount}/${total})`);
        this.render();
        renderGrid();

        if (activeCount >= total) {
          if (typeof Confetti !== "undefined") Confetti.launch(200);
          if (typeof Sound !== "undefined" && typeof Sound.playCelebrate === "function") {
            Sound.playCelebrate();
          }
          Toast.success("🎉 全ゲーム完全制覇！真のパーティーマスター達成！🏆");
        }
      }
    },
    getRank(count) {
      const total = this.getActiveTotal();
      if (count >= total) return "マスター 👑";
      if (count >= Math.ceil(total * 0.7)) return "エキスパート 🥇";
      if (count >= Math.ceil(total * 0.4)) return "ベテラン 🥈";
      if (count >= 2) return "チャレンジャー 🥉";
      return "ルーキー 🌱";
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
          Sound.playExplosion();
          Toast.warning(`⏰ 『${this.title}』のタイマーが終了しました！`);
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
            Sound.playExplosion();
            Toast.warning("⏰ トークタイム終了です！");
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
      timerEl.textContent = `⏱️ ${m}:${s}`;
      const toggleBtn = document.getElementById("btn-focus-toggle-timer");
      if (toggleBtn) {
        toggleBtn.textContent = (this.timer && this.timer.isRunning) ? "一時停止" : "スタート";
      }
    }
  };
  window.TalkFocus = TalkFocus;

  // 状態管理
  const state = {
    games: [...GAMES_DATA],
    favorites: Storage.get("asobi_favorites", []),
    filter: {
      tag: "all",
      player: "all",
      exactPlayers: "all",
      maxDuration: "all",
      genre: "all",
      scene: "all",
      search: "",
      onlyFavorite: false,
      sort: "recommended"
    },
    activeGameId: null,
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
    if (state.kidsMode && game.ruby) {
      return `<ruby>${escapeHTML(game.title)}<rt>${escapeHTML(game.ruby)}</rt></ruby>`;
    }
    const shortTitles = { "ito": "ito（価値観ゲーム）", "rhythm-box": "リズムボックス", "indian-poker": "インディアンポーカー", "finger-roulette": "指置きルーレット", "duel-reflex": "反射神経対決", "duel-mash": "連打パワーバトル", "duel-color": "カラー早見分け", "bomb-timer": "爆弾タイマー", "ng-word": "NGワードゲーム" };
    const title = compact ? (shortTitles[game.id] || game.title.replace(/\s*[（(].*$/u, "").trim()) : game.title;
    return escapeHTML(title);
  }

  // 検索インデックスの事前生成（超高速フィルタリング用）
  state.games.forEach(game => {
    const tokens = [
      game.title || "",
      game.ruby || "",
      game.catchphrase || "",
      game.overview || "",
      game.category || "",
      ...(Array.isArray(game.tags) ? game.tags : []),
      ...(Array.isArray(game.presets) ? game.presets.map(p => typeof p === "string" ? p : (p.text || p.title || p.question || "")) : [])
    ];
    game._searchIndex = tokens.join(" ").toLowerCase();
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
  const emptyState = document.getElementById("empty-state");
  const searchInput = document.getElementById("search-input");
  const clearSearchBtn = document.getElementById("btn-clear-search");
  const smartTagChips = document.querySelectorAll(".smart-tag-chip");
  const filterResultCount = document.getElementById("filter-result-count");
  const sortSelect = document.getElementById("sort-select");
  const favToggleBtn = document.getElementById("btn-toggle-fav-filter");
  const favCountBadge = document.getElementById("fav-count-badge");
  const btnRandomRoulette = document.getElementById("btn-random-roulette");
  const modalRoulette = document.getElementById("modal-roulette");
  const btnCloseRoulette = document.getElementById("btn-close-roulette");
  const btnSpinRoulette = document.getElementById("btn-spin-roulette");
  const btnThemeToggle = document.getElementById("btn-theme-toggle");
  const btnSoundToggle = document.getElementById("btn-sound-toggle");
  const soundIcon = document.getElementById("sound-icon");
  const themeIcon = document.getElementById("theme-icon");

  // ==========================================
  // テーマ ＆ サウンド初期化
  // ==========================================
  function applyTheme() {
    document.documentElement.classList.toggle("dark-mode", state.isDark);
    if (themeIcon) themeIcon.textContent = state.isDark ? "☀️" : "🌙";
  }
  applyTheme();

  if (btnThemeToggle) {
    btnThemeToggle.addEventListener("click", () => {
      Sound.playClick();
      state.isDark = !state.isDark;
      Storage.set("asobi_theme_dark", state.isDark);
      applyTheme();
    });
  }

  function updateSoundIcon() {
    if (soundIcon) soundIcon.textContent = Sound.isMuted ? "🔇" : "🔊";
  }
  updateSoundIcon();

  if (btnSoundToggle) {
    btnSoundToggle.addEventListener("click", () => {
      Sound.toggleMute();
      updateSoundIcon();
      Sound.playClick();
    });
  }

  // ==========================================
  // お気に入り管理
  // ==========================================
  function toggleFavorite(gameId, e) {
    if (e) e.stopPropagation();
    Sound.playClick();

    const idx = state.favorites.indexOf(gameId);
    if (idx >= 0) {
      state.favorites.splice(idx, 1);
      Toast.info("お気に入りから解除しました");
    } else {
      state.favorites.push(gameId);
      Toast.success("★ お気に入りに追加しました！");
    }
    Storage.set("asobi_favorites", state.favorites);
    updateFavBadge();
    renderGrid();
    if (state.activeGameId) {
      updateDetailFavButton();
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
    const q = state.filter.search.trim().toLowerCase();

    return state.games.filter(game => {
      // メイン枠スリム化: 検索語がない場合はメインゲーム(19枠)のみ表示。
      // 区分C(定番ルール)、区分U(常設ツール)、区分merged(統合済み旧URL)はメイン一覧から除外。
      if (q === "" && !state.filter.onlyFavorite) {
        if (game.section && game.section !== "main") return false;
      } else {
        // 検索時は統合済み旧エイリアス以外(メイン・定番ルール・ツール)を検索可能に
        if (game.section === "merged") return false;
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
        if (!game._searchIndex || !game._searchIndex.includes(q)) {
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
    const conditions = [];
    if (state.filter.onlyFavorite) conditions.push({ key: "favorite", text: "お気に入り" });
    if (state.filter.search) conditions.push({ key: "search", text: "検索：" + state.filter.search });
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
        if (condition.key === "players") { state.filter.exactPlayers = "all"; fitPlayers.value = "all"; }
        if (condition.key === "duration") { state.filter.maxDuration = "all"; fitDuration.value = "all"; }
        if (condition.key === "tag") state.filter.tag = "all";
        if (condition.key === "sort") { state.filter.sort = "recommended"; sortSelect.value = "recommended"; }
        renderGrid();
      });
      summary.appendChild(button);
    });
    document.getElementById("btn-clear-filters")?.classList.toggle("hidden", conditions.length === 0);
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
    const filtered = state.filter.onlyFavorite || state.filter.search || state.filter.tag !== "all" || state.filter.exactPlayers !== "all" || state.filter.maxDuration !== "all";
    section.classList.toggle("hidden", games.length === 0 || Boolean(filtered));
    list.innerHTML = games.map(game => '<a href="#game/' + game.id + '" class="recent-game-link"><span aria-hidden="true">' + game.icon + '</span>' + renderGameTitle(game, true) + '</a>').join("");
  }

  function revealSearch() {
    if (state.activeGameId && !canLeaveGame()) return;
    const reveal = () => {
      document.getElementById("discovery-filters").open = true;
      searchInput.focus({ preventScroll: true });
      searchInput.scrollIntoView({ block: "center", behavior: "smooth" });
    };
    if (state.activeGameId) { window.location.hash = ""; requestAnimationFrame(() => requestAnimationFrame(reveal)); }
    else reveal();
  }

  window.addEventListener("asobi:play-start", event => {
    if (!event.detail?.gameId || event.detail.gameId === state.activeGameId) state.toolHasProgress = true;
  });

  function canLeaveGame() {
    const completed = viewDetail.querySelector("#btn-ito-retry,#btn-restart-wolf,#btn-restart-ww,#btn-duel-restart,#btn-mash-retry,#btn-color-retry,#btn-restart-truths");
    if (!state.toolHasProgress || completed) return true;
    state.leaveApproved = confirm("進行中のゲームを終了して別の画面に移りますか？");
    return state.leaveApproved;
  }

  function renderGrid() {
    syncDiscoverySummary();
    const list = getFilteredGames();
    filterResultCount?.setAttribute("role", "status");
    filterResultCount?.setAttribute("aria-live", "polite");

    if (filterResultCount) {
      filterResultCount.textContent = `${state.filter.onlyFavorite ? 'お気に入り ' : ''}${list.length}件`;
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

    list.forEach(game => {
      const isFav = state.favorites.includes(game.id);
      const card = document.createElement("div");
      card.className = "game-card";
      card.dataset.id = game.id;
      card.tabIndex = -1;
      card.setAttribute("role", "group");
      card.setAttribute("aria-label", `${game.title}の詳細を見る`);

      // 先頭の殿堂入り神ゲー (ito) の特別装飾
      const isHero = (game.id === "ito" && state.filter.tag === "all" && !state.filter.search && state.filter.sort === "recommended");
      if (isHero) {
        card.classList.add("hero-card");
      }

      const hasTool = game.toolType !== "guide-only";
      const isPlayed = StampRally.played.includes(game.id);

      card.innerHTML = `
        <div class="card-top">
          <span class="card-icon" aria-hidden="true">${game.icon}</span>
          <div class="card-badges-row">
            ${isHero ? '<span class="card-badge card-badge-hero">👑 殿堂入り</span>' : ''}
            ${isPlayed ? '<span class="card-badge card-badge-played">👑 プレイ済</span>' : ''}
            ${!isHero && game.badge ? `<span class="card-badge badge-${game.category}">${escapeHTML(game.badge)}</span>` : ''}
          </div>
          <button class="btn-card-fav ${isFav ? 'active' : ''}" data-action="fav" data-id="${game.id}" title="お気に入り" aria-pressed="${isFav}" aria-label="${escapeHTML(game.title)}を${isFav ? 'お気に入りから削除' : 'お気に入りに追加'}">
            ${isFav ? '★' : '☆'}
          </button>
        </div>
        <div class="card-body">
          <h3 class="card-title"><a href="#game/${game.id}" class="card-title-link">${renderGameTitle(game, true)}</a></h3>
          <p class="card-catchphrase">${escapeHTML(game.catchphrase)}</p>
          <div class="card-meta">
            <span class="meta-pill pill-players">👥 ${game.minPlayers === game.maxPlayers ? game.minPlayers : `${game.minPlayers}〜${game.maxPlayers === 99 ? '大人数' : game.maxPlayers}`}人</span>
            <span class="meta-pill pill-time">⏱️ ${game.duration}</span>
            <span class="meta-pill pill-props">${hasTool ? '📱 スマホ1台' : '✋ 手ぶら'}</span>
          </div>
        </div>
        <div class="card-footer">
          <span class="card-play-btn ${hasTool ? 'btn-tool' : 'btn-guide'}">
            ${hasTool ? '遊ぶ' : 'ルールを見る'} <span aria-hidden="true">↗</span>
          </span>
        </div>
      `;

      fragment.appendChild(card);
    });

    gamesGrid.innerHTML = "";
    gamesGrid.appendChild(fragment);

  }

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
    grid.innerHTML = classicGames.map(game => `
      <div class="classic-rule-card" data-id="${game.id}" role="button" tabindex="0" aria-label="${game.title}のルールを見る">
        <div class="classic-rule-card-header">
          <span class="classic-rule-icon" aria-hidden="true">${game.icon}</span>
          <div class="classic-rule-header-info">
            <h4 class="classic-rule-title">${game.title}</h4>
            <span class="classic-rule-meta">👥 ${game.minPlayers}〜${game.maxPlayers === 99 ? '∞' : game.maxPlayers}人 ｜ ⏱️ ${game.duration}</span>
          </div>
        </div>
        <p class="classic-rule-desc">${escapeHTML(game.catchphrase || game.overview || "")}</p>
        <div class="classic-rule-action">
          <span class="btn-classic-rule-view">
            📖 ルールを見る ➔
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
      btnToggleClassicRules.setAttribute("aria-expanded", !isExpanded);
      classicRulesPanel.classList.toggle("hidden", isExpanded);
      const arrow = btnToggleClassicRules.querySelector(".classic-toggle-arrow");
      if (arrow) arrow.textContent = isExpanded ? "▼" : "▲";
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
    state.filter.maxDuration = fitDuration.value;
    renderGrid();
    Analytics.track("asobi_filter", { players: fitPlayers.value, duration: fitDuration.value });
  };
  fitPlayers?.addEventListener("change", syncFit);
  fitDuration?.addEventListener("change", syncFit);
  document.getElementById("fit-reset")?.addEventListener("click", () => {
    fitPlayers.value = "all";
    fitDuration.value = "all";
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

  if (favToggleBtn) {
    favToggleBtn.addEventListener("click", () => {
      if (state.activeGameId && !canLeaveGame()) return;
      if (state.activeGameId) window.location.hash = "";
      Sound.playClick();
      state.filter.onlyFavorite = !state.filter.onlyFavorite;
      favToggleBtn.classList.toggle("active", state.filter.onlyFavorite);
      renderGrid();
    });
  }

  // ==========================================
  // ランダム即決ルーレットモーダル
  // ==========================================
  if (btnRandomRoulette) {
    btnRandomRoulette.addEventListener("click", () => {
      if (modalRoulette) ModalManager.open(modalRoulette);
    });
  }

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
          Toast.success(`「${randomGame.title}」が出ました！🎲`);
          btnSpinRoulette.disabled = false;
          btnGoGame.classList.remove("hidden");

          btnGoGame.onclick = () => {
            modalRoulette.classList.add("hidden");
            navigateToGame(randomGame.id);
          };
        }
      }, 80);
    });
  }

  // ==========================================
  // ⚡ 幹事のための即決コンシェルジュ（3秒ゲーム診断）
  // ==========================================
  const btnQuickConcierge = document.getElementById("btn-quick-concierge");
  const modalConcierge = document.getElementById("modal-concierge");
  const btnCloseConcierge = document.getElementById("btn-close-concierge");
  const btnConciergeSubmit = document.getElementById("btn-concierge-submit");
  const conciergeResultArea = document.getElementById("concierge-result-area");
  const conciergeResIcon = document.getElementById("concierge-res-icon");
  const conciergeResTitle = document.getElementById("concierge-res-title");
  const conciergeResCatch = document.getElementById("concierge-res-catch");
  const btnConciergePlay = document.getElementById("btn-concierge-play");
  const btnConciergeReroll = document.getElementById("btn-concierge-reroll");

  let conciergeSelectedPlayers = "2";
  let conciergeSelectedMood = "laugh";
  let conciergeMatchingGames = [];
  let conciergeCurrentIndex = 0;

  if (btnQuickConcierge) {
    btnQuickConcierge.addEventListener("click", () => {
      Sound.playClick();
      if (modalConcierge) ModalManager.open(modalConcierge);
    });
  }

  if (btnCloseConcierge) {
    btnCloseConcierge.addEventListener("click", () => {
      if (modalConcierge) ModalManager.close(modalConcierge);
    });
  }

  document.querySelectorAll("#concierge-players-group .btn-concierge-opt").forEach(btn => {
    btn.addEventListener("click", () => {
      Sound.playClick();
      document.querySelectorAll("#concierge-players-group .btn-concierge-opt").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      conciergeSelectedPlayers = btn.dataset.players;
    });
  });

  document.querySelectorAll("#concierge-mood-group .btn-concierge-opt").forEach(btn => {
    btn.addEventListener("click", () => {
      Sound.playClick();
      document.querySelectorAll("#concierge-mood-group .btn-concierge-opt").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      conciergeSelectedMood = btn.dataset.mood;
    });
  });

  function getConciergeRecommendations(playersKey, moodKey) {
    return state.games.filter(g => {
      let matchesPlayers = false;
      if (playersKey === "2") {
        matchesPlayers = g.minPlayers <= 2 && g.maxPlayers >= 2;
      } else if (playersKey === "3-4") {
        matchesPlayers = g.minPlayers <= 4 && g.maxPlayers >= 3;
      } else if (playersKey === "5+") {
        matchesPlayers = g.maxPlayers >= 5;
      }

      if (!matchesPlayers || g.section === "merged" || g.section === "U") return false;

      const tags = g.tags || [];
      const cat = String(g.category || "").toLowerCase();
      if (moodKey === "laugh") {
        return tags.some(t => ["飲み会", "大喜利", "アクション", "パーティー", "アクション対決"].includes(t)) || ["action", "アクション", "大喜利"].includes(cat) || ["action", "アクション", "大喜利"].includes(g.category);
      } else if (moodKey === "chill") {
        return tags.some(t => ["トーク", "協力", "まったり", "定番"].includes(t)) || ["talk", "トーク"].includes(cat) || ["talk", "トーク"].includes(g.category);
      } else if (moodKey === "mind") {
        return tags.some(t => ["心理戦", "人狼", "推理"].includes(t)) || ["mystery", "心理戦", "推理"].includes(cat) || ["mystery", "心理戦", "推理"].includes(g.category);
      } else if (moodKey === "icebreak") {
        return tags.some(t => ["アイスブレイク", "初対面", "協力", "定番"].includes(t));
      }
      return true;
    });
  }

  function displayConciergeGame(game) {
    if (!game) return;
    conciergeResIcon.textContent = game.icon;
    conciergeResTitle.textContent = game.title;
    conciergeResCatch.textContent = game.catchphrase;
    conciergeResultArea.classList.remove("hidden");

    btnConciergePlay.onclick = () => {
      Sound.playSelect();
      if (modalConcierge) ModalManager.close(modalConcierge);
      navigateToGame(game.id);
    };
  }

  if (btnConciergeSubmit) {
    btnConciergeSubmit.addEventListener("click", () => {
      Sound.playSelect();
      conciergeMatchingGames = getConciergeRecommendations(conciergeSelectedPlayers, conciergeSelectedMood);
      if (conciergeMatchingGames.length === 0) {
        conciergeMatchingGames = state.games.filter(g => {
          if (conciergeSelectedPlayers === "2") return g.minPlayers <= 2 && g.maxPlayers >= 2;
          if (conciergeSelectedPlayers === "3-4") return g.minPlayers <= 4 && g.maxPlayers >= 3;
          return g.maxPlayers >= 5;
        });
      }
      conciergeMatchingGames.sort(() => Math.random() - 0.5);
      conciergeCurrentIndex = 0;
      displayConciergeGame(conciergeMatchingGames[0]);
      Sound.playFanfare();
      if (typeof Confetti !== "undefined") Confetti.burst(60);
    });
  }

  if (btnConciergeReroll) {
    btnConciergeReroll.addEventListener("click", () => {
      Sound.playClick();
      if (conciergeMatchingGames.length > 0) {
        conciergeCurrentIndex = (conciergeCurrentIndex + 1) % conciergeMatchingGames.length;
        displayConciergeGame(conciergeMatchingGames[conciergeCurrentIndex]);
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
    if (state.activeGameId && window.location.hash !== `#game/${state.activeGameId}` && !state.leaveApproved && !canLeaveGame()) {
      history.replaceState(null, "", location.pathname + location.search + `#game/${state.activeGameId}`);
      return;
    }
    state.leaveApproved = false;
    if (!state.activeGameId && window.location.hash.startsWith("#game/")) state.homeScrollY = window.scrollY;
    cleanupActiveTool(); // 前のツールを確実に破棄
    const hash = window.location.hash;
    if (hash.startsWith("#game/")) {
      const rawId = hash.replace("#game/", "").trim();
      const ALIAS_MAP = {
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
      const gameId = ALIAS_MAP[rawId] || rawId;
      const game = state.games.find(g => g.id === gameId);
      if (game) {
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
    state.toolHasProgress = false;
    viewHome.classList.remove("hidden");
    viewDetail.classList.add("hidden");
    renderGrid();
    requestAnimationFrame(() => window.scrollTo({ top: state.homeScrollY, behavior: "instant" }));
  }

  function updateDetailFavButton() {
    const btnFav = document.getElementById("detail-fav-btn");
    if (!btnFav || !state.activeGameId) return;
    const isFav = state.favorites.includes(state.activeGameId);
    btnFav.classList.toggle("active", isFav);
    btnFav.innerHTML = isFav ? '★' : '☆';
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
          <h3 class="product-box-title">📦 本物のカード・公式版で遊ぶとさらに盛り上がる！</h3>
        </div>
        <div class="product-box-body">
          <h4 class="product-item-name">${escapeHTML(prod.name)}</h4>
          <span class="product-publisher">${escapeHTML(prod.publisher)}</span>
          <p class="product-desc">${escapeHTML(prod.desc)}</p>
          <div class="product-btn-group">
            <a href="${AFFILIATE_CONFIG.getAmazonUrl(prod.keyword)}" target="_blank" rel="noopener noreferrer sponsored nofollow" class="btn-affiliate btn-amazon">
              <span class="btn-aff-icon">📦</span> Amazonで見る ➔
            </a>
            <a href="${AFFILIATE_CONFIG.getRakutenUrl(prod.keyword)}" target="_blank" rel="noopener noreferrer sponsored nofollow" class="btn-affiliate btn-rakuten">
              <span class="btn-aff-icon">🛍️</span> 楽天市場で探す ➔
            </a>
          </div>
          <p class="product-disclaimer">※上記リンクから購入されると、当サイト運営者に一定の手数料が支払われる場合があります。</p>
        </div>
      </div>
    ` : `
      <div class="section-box mt-4 official-product-box">
        <div class="product-box-header">
          <span class="product-badge-pr">PR</span>
          <h3 class="product-box-title">🎲 『${escapeHTML(game.title)}』に関連するカードゲーム</h3>
        </div>
        <div class="product-box-body">
          <p class="product-desc">カードを囲んで遊びたいときに。関連する市販のゲームを探せます。</p>
          <div class="product-btn-group">
            <a href="${AFFILIATE_CONFIG.getAmazonUrl(affKeyword)}" target="_blank" rel="noopener noreferrer sponsored nofollow" class="btn-affiliate btn-amazon">
              <span class="btn-aff-icon">📦</span> Amazonで探す ➔
            </a>
            <a href="${AFFILIATE_CONFIG.getRakutenUrl(affKeyword)}" target="_blank" rel="noopener noreferrer sponsored nofollow" class="btn-affiliate btn-rakuten">
              <span class="btn-aff-icon">🛍️</span> 楽天市場で探す ➔
            </a>
          </div>
          <p class="product-disclaimer">※上記リンクから購入されると、当サイト運営者に一定の手数料が支払われる場合があります。</p>
        </div>
      </div>
    `;

    // AdSense広告枠（審査対応レディ）
    const adPlaceholderMarkup = `
      <div class="ad-placeholder-container mt-4">
        <span class="ad-label">スポンサーリンク</span>
        <div class="ad-slot-box">
          <div class="ad-slot-content">
            <span class="ad-slot-text">🎲 あそびポケット | 快適なゲーム体験をサポート</span>
          </div>
        </div>
      </div>
    `;

    // お題カスタムマネージャー用のカウント
    const customTopics = TopicManager.getCustomTopics(game.id);
    const totalPresets = (game.presets ? game.presets.length : 0) + customTopics.length;

    viewDetail.innerHTML = `
      <div class="detail-container">
        <!-- スリムな詳細ナビバー -->
        <nav class="detail-nav-bar" aria-label="詳細ナビゲーション">
          <button class="btn-nav-back" id="btn-back-home" aria-label="ゲーム一覧に戻る">
            <span>◀</span> <span>一覧</span>
          </button>
          <div class="detail-nav-title">
            <span class="nav-icon" aria-hidden="true">${game.icon}</span>
            <span class="nav-name">${renderGameTitle(game)}</span>
          </div>
          <div class="detail-nav-right">
            <button class="btn-compact-share" id="detail-share-btn" aria-label="共有：この遊びを友達に送る" title="この遊びを友達に送る">共有</button>
            <button type="button" class="btn-detail-scoreboard" id="btn-detail-scoreboard" aria-label="得点を記録する">得点</button>
            <button class="btn-mute-toggle" id="btn-detail-mute" aria-label="音声をミュート切替">🔊</button>
            ${game.isDuo ? '<span class="nav-pill pill-duo">2人用</span>' : ''}
            <span class="nav-pill pill-category">${escapeHTML(game.badge || '定番')}</span>
          </div>
        </nav>

        <!-- メインカード・ヒーロー -->
        <div class="detail-compact-hero">
          <div class="detail-hero-left">
            <span class="detail-compact-icon" aria-hidden="true">${game.icon}</span>
            <div class="detail-hero-info">
              <h2 class="detail-compact-title">${renderGameTitle(game)}</h2>
              <p class="detail-compact-catch">${escapeHTML(game.catchphrase)}</p>
              <div class="detail-compact-meta">
                <span>👥 ${game.minPlayers}〜${game.maxPlayers === 99 ? '大人数' : game.maxPlayers + '人'}</span>
                <span>⏱️ ${game.duration}</span>
                <span>🎒 ${escapeHTML(game.preparation)}</span>
              </div>
            </div>
          </div>
          <div class="detail-hero-actions">
            <button class="btn-compact-fav" id="detail-fav-btn" title="お気に入り"></button>
            <button class="btn-compact-line" id="detail-line-btn" title="LINEで送る">LINE</button>

          </div>
        </div>

        <!-- 📢 幹事必見！10秒口頭ルール説明バナー -->
        <div class="speech-banner-box" role="region" aria-label="10秒口頭ルール説明">
          <div class="speech-banner-badge">📢 幹事の10秒口頭ルール</div>
          <p class="speech-banner-text">「${escapeHTML(game.catchphrase)}」</p>
        </div>

        <!-- タブ切り替えバー (スリム) -->
        <div class="detail-tabs-bar">
          ${hasTool ? `
            <button class="detail-tab-btn ${state.activeTab === 'tool' ? 'active' : ''}" data-tab="tool">
              🎮 遊ぶ
            </button>
          ` : ''}
          <button class="detail-tab-btn ${state.activeTab === 'rules' ? 'active' : ''}" data-tab="rules">
            📖 遊び方
          </button>
          ${game.presets && game.presets.length > 0 ? `
            <button class="detail-tab-btn ${state.activeTab === 'presets' ? 'active' : ''}" data-tab="presets">
              💡 お題 (${totalPresets})
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
              ${adPlaceholderMarkup}
            </div>
          ` : ''}

          <!-- 2. ルールタブ -->
          <div class="tab-pane ${state.activeTab === 'rules' ? 'active' : ''}" id="pane-rules">
            <div class="rules-section">
              <div class="section-box">
                <h3 class="section-title">🌟 ゲームの概要</h3>
                <p class="section-text">${escapeHTML(game.overview)}</p>
              </div>

              <div class="section-box mt-4">
                <h3 class="section-title">📋 遊び方ステップ（10秒解説）</h3>
                <div class="rules-step-list">
                  ${game.rules.map(r => `
                    <div class="rule-step-item">
                      <div class="step-badge">STEP ${r.step}</div>
                      <div class="step-content">
                        <h4 class="step-title">${escapeHTML(r.title)}</h4>
                        <p class="step-desc">${escapeHTML(r.desc).replace(/\n/g, '<br>')}</p>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>

              ${game.tips && game.tips.length > 0 ? `
                <div class="section-box mt-4 tips-box">
                  <h3 class="section-title">🔥 盛り上がるコツ ＆ アレンジ</h3>
                  <ul class="tips-list">
                    ${game.tips.map(t => `<li>${escapeHTML(t)}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}

                <div class="section-box mt-4 p-3 border rounded text-center" style="background: rgba(255,90,95,0.05); border: 1.5px dashed rgba(255,90,95,0.3);">
                  <p class="text-xs text-muted mb-2 font-bold">実際にこのゲームで遊んだら制覇スタンプを獲得しよう！</p>
                  <button class="btn btn-sm ${StampRally.played.includes(game.id) ? 'btn-secondary' : 'btn-primary'}" id="btn-mark-rules-played" ${StampRally.played.includes(game.id) ? 'disabled' : ''}>
                    ${StampRally.played.includes(game.id) ? '👑 制覇スタンプ獲得済み！' : '🎉 実際に遊んだ！（スタンプ獲得）'}
                  </button>
                </div>

              <!-- 公式アイテム・アフィリエイト枠 -->
              ${affiliateMarkup}
              ${adPlaceholderMarkup}
            </div>
          </div>

          <!-- 3. お題リストタブ -->
          ${game.presets && game.presets.length > 0 ? `
            <div class="tab-pane ${state.activeTab === 'presets' ? 'active' : ''}" id="pane-presets">
              <div class="presets-section">
                <div class="presets-header-bar">
                  <h3 class="section-title">💡 収録お題一覧</h3>
                  <button class="btn btn-sm btn-outline" id="btn-open-topic-custom" aria-expanded="false" aria-controls="custom-topic-editor">⚙️ お題を追加・管理する</button>
                </div>
                <div id="custom-topic-editor" class="section-box mt-3 hidden">
                  <label for="custom-topic-text">自分たちのお題（この端末に保存）</label>
                  <form id="custom-topic-form" class="mt-2">
                    <input id="custom-topic-text" class="search-input-field" maxlength="160" required placeholder="例：旅行に持っていきたいもの">
                    <button class="btn btn-primary mt-2" type="submit">お題を追加</button>
                  </form>
                </div>

                <div class="presets-grid mt-3">
                  ${customTopics.map((c, idx) => `
                    <div class="preset-item-card custom-preset-card">
                      <span class="preset-tag preset-tag-custom">オリジナル</span>
                      <div class="preset-text">${escapeHTML(c)}</div>
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
                      text = `<span class="preset-tag">${escapeHTML(p.category)}</span><div>市民: <strong>${escapeHTML(p.citizen)}</strong> / 🐺: <strong>${escapeHTML(p.wolf)}</strong></div>`;
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
                      <span class="seo-banner-tag">📖 完全版WEB記事</span>
                      <h4 class="seo-banner-title">『${escapeHTML(game.title)}』の厳選お題＆ルールまとめを見る</h4>
                    </div>
                    <p class="seo-banner-desc">遊び方と自作お題、シーン別のコツを詳しく紹介しています。</p>
                    <a href="${game.seoSlug}" target="_blank" class="btn btn-outline btn-block mt-2">
                      お題まとめ記事を開く ➔
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
          <h3 class="recommend-title">🎲 他のおすすめゲーム</h3>
          <div class="recommend-grid" id="recommend-grid"></div>
        </div>
      </div>
    `;

    // 自作お題の追加・削除。端末内だけに保存し、既存の抽選機能と共有する。
    const topicButton = viewDetail.querySelector('#btn-open-topic-custom');
    topicButton?.addEventListener('click', () => {
      const editor = viewDetail.querySelector('#custom-topic-editor');
      const expanded = topicButton.getAttribute('aria-expanded') !== 'true';
      topicButton.setAttribute('aria-expanded', String(expanded));
      editor.classList.toggle('hidden', !expanded);
      if (expanded) editor.querySelector('input').focus();
    });
    viewDetail.querySelector('#custom-topic-form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = viewDetail.querySelector('#custom-topic-text');
      if (TopicManager.addCustomTopic(game.id, input.value)) {
        state.activeTab = 'presets';
        cleanupActiveTool();
        showGameDetail(game, 'presets');
        Toast.success('お題を追加しました');
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
      if (!canLeaveGame()) return;
      document.body.classList.remove("is-tool-active");
      Sound.playClick();
      window.location.hash = "";
    });

    // 道具なしゲームのスタンプ手動獲得ボタン
    const markRulesBtn = viewDetail.querySelector("#btn-mark-rules-played");
    if (markRulesBtn) {
      markRulesBtn.addEventListener("click", () => {
        Sound.playFanfare();
        StampRally.markPlayed(game.id);
        markRulesBtn.textContent = '👑 制覇スタンプ獲得済み！';
        markRulesBtn.className = 'btn btn-sm btn-secondary';
        markRulesBtn.disabled = true;
      });
    }

    // お気に入りボタン
    updateDetailFavButton();
    viewDetail.querySelector("#detail-fav-btn").addEventListener("click", (e) => {
      toggleFavorite(game.id, e);
    });

    // シェアボタン
    viewDetail.querySelector("#detail-share-btn").addEventListener("click", async () => {
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
          Toast.success("🔗 リンクをクリップボードにコピーしました！");
        } catch (e) {
          const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`;
          window.open(xUrl, "_blank");
        }
      }
    });

    // LINE共有ボタン
    const detailLineBtn = viewDetail.querySelector("#detail-line-btn");
    if (detailLineBtn) {
      detailLineBtn.addEventListener("click", () => {
        Sound.playClick();
        const lineText = `スマホ1台・手ぶらですぐ遊べる「${game.title}」をみんなで遊ぼう！\n${window.location.href}`;
        window.open(`https://line.me/R/msg/text/?${encodeURIComponent(lineText)}`, "_blank");
      });
    }

    viewDetail.querySelector("#btn-detail-scoreboard")?.addEventListener("click", () => document.getElementById("btn-toggle-scoreboard")?.click());

    // 詳細画面の消音（ミュート）トグルボタン
    const detailMuteBtn = viewDetail.querySelector("#btn-detail-mute");
    if (detailMuteBtn) {
      detailMuteBtn.addEventListener("click", () => {
        handleMuteToggle();
      });
    }
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
          currentToolCleanup = renderFn(mount, game);
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
        <span class="rec-icon">${rec.icon}</span>
        <div class="rec-info">
          <strong class="rec-title">${escapeHTML(rec.title)}</strong>
          <span class="rec-meta">👥 ${rec.minPlayers}〜${rec.maxPlayers}人 / ⏱️ ${rec.duration}</span>
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
      if (!canLeaveGame()) return;
      Sound.playClick();
      window.location.hash = "";
      if (!state.activeGameId) showHome();
    });
  }

  if (btmNavRoulette) {
    btmNavRoulette.addEventListener("click", () => {
      Sound.playClick();
      modalRoulette.classList.remove("hidden");
    });
  }

  if (btmNavFav) {
    btmNavFav.addEventListener("click", () => {
      if (state.activeGameId && !canLeaveGame()) return;
      Sound.playClick();
      if (window.location.hash !== "") {
        window.location.hash = "";
      }
      state.filter.onlyFavorite = !state.filter.onlyFavorite;
      favToggleBtn.classList.toggle("active", state.filter.onlyFavorite);
      btmNavFav.classList.toggle("active", state.filter.onlyFavorite);
      renderGrid();
      if (state.filter.onlyFavorite) {
        Toast.info("★ お気に入りのゲームを表示中");
      }
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
      if (!modalRoulette.classList.contains("hidden")) {
        modalRoulette.classList.add("hidden");
        return;
      }
      if (state.activeGameId) {
        if (!canLeaveGame()) return;
        window.location.hash = "";
        return;
      }
    }

    if (!isTyping) {
      if (e.key === "/") {
        e.preventDefault();
        if (searchInput) { revealSearch(); searchInput.select(); }
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        Sound.playClick();
        modalRoulette.classList.remove("hidden");
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        Sound.playClick();
        if (window.location.hash !== "") {
          window.location.hash = "";
        }
        state.filter.onlyFavorite = !state.filter.onlyFavorite;
        if (favToggleBtn) favToggleBtn.classList.toggle("active", state.filter.onlyFavorite);
        if (btmNavFav) btmNavFav.classList.toggle("active", state.filter.onlyFavorite);
        renderGrid();
        Toast.info(state.filter.onlyFavorite ? "★ お気に入りのゲームを表示中" : "すべてのゲームを表示中");
      } else if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        Sound.playClick();
        if (!canLeaveGame()) return;
        window.location.hash = "";
        if (!state.activeGameId) showHome();
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
  const btnFooterPwa = document.getElementById("btn-footer-pwa-install");
  const modalPwaGuide = document.getElementById("modal-pwa-guide");
  const btnClosePwaGuide = document.getElementById("btn-close-pwa-guide");
  const btnPwaGuideOk = document.getElementById("btn-pwa-guide-ok");

  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;

  if (!isStandalone) {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e;
      // ユーザーのゲーム選択・即プレイ体験を最優先し、画面を遮るバナーの自動表示は行わない。
      // インストールはヘッダー・設定モーダル・フッターからいつでもスムーズに実行可能。
    });
  }

  async function triggerPwaInstall() {
    Sound.playClick();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        Toast.success("🎉 アプリのインストールを開始しました！");
        if (pwaInstallBanner) pwaInstallBanner.classList.add("hidden");
      }
      deferredPrompt = null;
    } else {
      if (modalPwaGuide) {
        ModalManager.open(modalPwaGuide);
      }
    }
  }

  const btnHeaderPwa = document.getElementById("btn-header-pwa-install");
  if (btnHeaderPwa) {
    btnHeaderPwa.addEventListener("click", triggerPwaInstall);
  }

  if (btnPwaInstall) {
    btnPwaInstall.addEventListener("click", triggerPwaInstall);
  }

  if (btnFooterPwa) {
    btnFooterPwa.addEventListener("click", triggerPwaInstall);
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
    const icon = isMuted ? "🔇" : "🔊";
    const label = isMuted ? "音なし：効果音をオンにする" : "音あり：効果音をオフにする";

    const headerMuteBtn = document.getElementById("btn-header-mute");
    if (headerMuteBtn) {
      headerMuteBtn.innerHTML = `<span aria-hidden="true">${icon}</span><span class="sound-state-label">${isMuted ? '音なし' : '音あり'}</span>`;
      headerMuteBtn.setAttribute("aria-pressed", String(isMuted));
      headerMuteBtn.setAttribute("aria-label", label);
      headerMuteBtn.title = label;
      headerMuteBtn.classList.toggle("is-muted", isMuted);
    }
    const detailMuteBtn = document.getElementById("btn-detail-mute");
    if (detailMuteBtn) {
      detailMuteBtn.innerHTML = `<span aria-hidden="true">${icon}</span><span class="sound-state-label">${isMuted ? '音なし' : '音あり'}</span>`;
      detailMuteBtn.setAttribute("aria-pressed", String(isMuted));
      detailMuteBtn.setAttribute("aria-label", label);
      detailMuteBtn.title = label;
      detailMuteBtn.classList.toggle("is-muted", isMuted);
    }
  }

  function handleMuteToggle() {
    const isMuted = Sound.toggleMute();
    updateMuteButtons();
    syncSettingsModal();
    if (isMuted) {
      Toast.info("🔇 完全消音（マナーモード）にしました");
    } else {
      Toast.success("🔊 効果音をオンにしました");
    }
  }

  const btnHeaderMute = document.getElementById("btn-header-mute");
  if (btnHeaderMute) {
    btnHeaderMute.addEventListener("click", handleMuteToggle);
  }
  updateMuteButtons();

  function syncSettingsModal() {
    if (settingSoundToggle) settingSoundToggle.checked = !Sound.isMuted;
    if (settingThemeToggle) settingThemeToggle.checked = state.isDark;
    if (settingWakeLockToggle) settingWakeLockToggle.checked = WakeLockManager.isEnabled;
    if (settingKidsToggle) settingKidsToggle.checked = state.kidsMode;
  }

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
      Toast.info(e.target.checked ? "🔊 効果音をONにしました" : "🔇 効果音をOFF（完全消音）にしました");
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
      Toast.info(e.target.checked ? "🧒 ふりがなモード（キッズ対応）をONにしました" : "🧒 ふりがなモードをOFFにしました");
    });
  }

  if (settingThemeToggle) {
    settingThemeToggle.addEventListener("change", (e) => {
      Sound.playClick();
      state.isDark = e.target.checked;
      Storage.set("asobi_theme_dark", state.isDark);
      applyTheme();
      Toast.info(e.target.checked ? "🌙 ダークモードに切り替えました" : "☀️ ライトモードに切り替えました");
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
    btnResetAppData.addEventListener("click", () => {
      if (confirm("【確認】お気に入り、プレイ履歴、スタンプラリー、カスタムお題など、すべての保存データを初期化しますか？")) {
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
    btnResetScores.addEventListener("click", () => {
      if (confirm("全員のスコアを0にリセットしますか？")) {
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
  const btnHeaderFinger = document.getElementById("btn-header-finger");
  const btnQuickFinger = document.getElementById("btn-quick-finger");

  const modalBatsuRoulette = document.getElementById("modal-batsu-roulette");
  const btnCloseBatsuModal = document.getElementById("btn-close-batsu-modal");
  const batsuModalMount = document.getElementById("batsu-modal-mount");
  const btnHeaderBatsu = document.getElementById("btn-header-batsu");
  const btnQuickBatsu = document.getElementById("btn-quick-batsu");

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
      window.__cleanupActiveModal("modal-finger-roulette");
    });
  }

  if (btnCloseBatsuModal && modalBatsuRoulette) {
    btnCloseBatsuModal.addEventListener("click", () => {
      ModalManager.close(modalBatsuRoulette);
      window.__cleanupActiveModal("modal-batsu-roulette");
    });
  }

  if (btnHeaderFinger) btnHeaderFinger.addEventListener("click", () => { Sound.playClick(); openFingerModal(); });
  if (btnQuickFinger) btnQuickFinger.addEventListener("click", () => { Sound.playClick(); openFingerModal(); });
  if (btnHeaderBatsu) btnHeaderBatsu.addEventListener("click", () => { Sound.playClick(); openBatsuModal(); });
  if (btnQuickBatsu) btnQuickBatsu.addEventListener("click", () => { Sound.playClick(); openBatsuModal(); });

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
    Toast.warning("📴 オフラインになりました（オフラインでも遊べます！）");
  });
  window.addEventListener("online", () => {
    Toast.success("🌐 オンラインに復帰しました");
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log("[SW] Controller changed: New Service Worker active");
    });
  }

  // ==========================================
  // ルーティング監視
  // ==========================================
  window.addEventListener("hashchange", handleRoute);
  handleRoute();
});
