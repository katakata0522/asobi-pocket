(() => {
  "use strict";

  const esc = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  const storageGet = (key, fallback) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  };

  const storageSet = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  };

  // Snapshot before app.js' DOMContentLoaded callback runs. This allows the
  // quality layer to undo the legacy "detail view = played" write on a direct
  // #game/* entry without touching previously earned stamps.
  const playedBeforeInit = new Set(storageGet("asobi_played_games", []));

  const addQualityStylesheet = () => {
    if (document.querySelector('link[data-asobi-quality="true"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "quality-ui.css";
    link.dataset.asobiQuality = "true";
    document.head.appendChild(link);
  };

  const setupHomeIntent = () => {
    const controls = document.querySelector("#view-home .controls-wrapper");
    if (!controls || document.getElementById("quality-home-intro")) return;
    const section = document.createElement("section");
    section.id = "quality-home-intro";
    section.className = "quality-home-intro";
    section.innerHTML = `
      <p class="quality-home-kicker">スマホ1台ですぐ始める</p>
      <h2>いま、何して遊ぶ？</h2>
      <p>人数か気分で絞る。決めきれなければ「迷ったらコレ」で即決できます。</p>`;
    controls.parentNode.insertBefore(section, controls);
  };

  const setupStampRally = () => {
    const rally = globalThis.StampRally;
    if (!rally || rally.__qualityPatched) return;
    rally.__qualityPatched = true;

    const originalMarkPlayed = rally.markPlayed.bind(rally);
    const originalRender = rally.render.bind(rally);

    const initialMatch = location.hash.match(/^#game\/(.+)$/);
    if (initialMatch && !playedBeforeInit.has(initialMatch[1]) && rally.played.includes(initialMatch[1])) {
      rally.played = rally.played.filter((gameId) => gameId !== initialMatch[1]);
      storageSet("asobi_played_games", rally.played);
    }

    // app.js calls this when merely opening a detail page. From here onward,
    // only a meaningful interaction in the actual game tool counts as played.
    rally.markPlayed = () => {};
    rally.render = function renderQualityRally() {
      originalRender();
      const title = document.querySelector(".stamp-rally-title");
      const count = document.getElementById("stamp-rally-count");
      if (title) title.textContent = "遊んだゲームコレクション";
      if (count) count.textContent = `プレイ済み: ${this.played.length} / ${typeof GAMES_DATA !== "undefined" ? GAMES_DATA.length : 31}`;
    };

    const awardCurrent = () => {
      const match = location.hash.match(/^#game\/(.+)$/);
      if (match) globalThis.AsobiPlayLifecycle.start(match[1]);
    };

    // Explicit lifecycle event is the long-term contract. Legacy tools that do
    // not emit it yet continue through the guarded interaction fallback below.
    window.addEventListener("asobi:play-start", (event) => {
      const gameId = event.detail?.gameId;
      if (gameId) originalMarkPlayed(gameId);
      else awardCurrent();
    });

    globalThis.AsobiPlayLifecycle = Object.freeze({
      start(gameId) {
        window.dispatchEvent(new CustomEvent("asobi:play-start", {
          detail: { gameId: gameId || null }
        }));
      }
    });

    const detail = document.getElementById("view-detail");
    if (detail) {
      detail.addEventListener("click", (event) => {
        if (!event.target.closest("#tool-mount-point")) return;
        const button = event.target.closest("button");
        if (!button) return;
        if (button.matches(".btn-scene,[data-cards],[data-wolf],[data-time],[data-range],[data-target],[data-mode],[data-filter],.btn-filter-tag")) return;
        if (/^btn-(?:ito-next-topic|shuffle-(?:both|kana|topic)|bpm-|next-(?:topic|situation|rule|q|choice|doremi|yamanote-topic)|toggle-accel|suggest-prompt)/.test(button.id || "")) return;
        if (/reset|close|back|hide/i.test(button.id || "")) return;
        awardCurrent();
      }, true);

      detail.addEventListener("pointerdown", (event) => {
        if (event.target.closest("#touch-area, #roulette-canvas")) awardCurrent();
      }, true);
    }

    rally.render();
  };

  const recommendationScore = (current, candidate) => {
    let score = Number(candidate.rating || 0);
    if (current.category && candidate.category === current.category) score += 6;
    if (current.genre && candidate.genre === current.genre) score += 4;
    if (Number(candidate.minPlayers) <= Number(current.maxPlayers)
      && Number(candidate.maxPlayers) >= Number(current.minPlayers)) score += 3;
    if (Math.abs(Number(current.durationMin || 999) - Number(candidate.durationMin || 999)) <= 3) score += 2;

    const currentTags = new Set(Array.isArray(current.tags) ? current.tags : []);
    const sharedTags = (Array.isArray(candidate.tags) ? candidate.tags : [])
      .filter((tag) => currentTags.has(tag)).length;
    score += Math.min(4, sharedTags * 0.8);
    if (candidate.hasTool) score += 0.5;
    return score;
  };

  const enhanceRecommendations = () => {
    const match = location.hash.match(/^#game\/(.+)$/);
    const grid = document.getElementById("recommend-grid");
    if (!match || !grid || typeof GAMES_DATA === "undefined") return;
    const current = GAMES_DATA.find((game) => game.id === match[1]);
    if (!current || grid.dataset.qualityGame === current.id) return;

    const recs = GAMES_DATA
      .filter((game) => game.id !== current.id)
      .map((game) => ({ game, score: recommendationScore(current, game) }))
      .sort((a, b) => b.score - a.score || Number(b.game.rating || 0) - Number(a.game.rating || 0))
      .slice(0, 3)
      .map(({ game }) => game);

    grid.replaceChildren();
    recs.forEach((game) => {
      const card = document.createElement("div");
      card.className = "recommend-card quality-recommend-card";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `${game.title}を開く`);
      card.innerHTML = `
        <span class="rec-icon">${game.icon || "🎲"}</span>
        <div class="rec-info">
          <strong class="rec-title">${esc(game.title)}</strong>
          <span class="rec-meta">👥 ${game.minPlayers}〜${Number(game.maxPlayers) === 99 ? "大人数" : `${game.maxPlayers}人`} / ⏱️ ${esc(game.duration)}</span>
        </div>`;
      const open = () => { location.hash = `game/${game.id}`; };
      card.addEventListener("click", open);
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      });
      grid.appendChild(card);
    });

    const title = grid.closest(".detail-recommend-section")?.querySelector(".recommend-title");
    if (title) title.textContent = "🎲 次に遊ぶなら";
    grid.dataset.qualityGame = current.id;
  };

  const decorateMonetization = () => {
    if (globalThis.AFFILIATE_CONFIG?.isAffiliateEnabled !== false) return;
    document.querySelectorAll(".product-badge-pr").forEach((badge) => { badge.textContent = "関連商品"; });
    document.querySelectorAll(".product-disclaimer").forEach((item) => { item.hidden = true; });
  };

  const setupDetailObserver = () => {
    const detail = document.getElementById("view-detail");
    if (!detail) return;
    let queued = false;
    const enhance = () => {
      if (queued) return;
      queued = true;
      queueMicrotask(() => {
        queued = false;
        enhanceRecommendations();
        decorateMonetization();
      });
    };
    new MutationObserver(enhance).observe(detail, { childList: true, subtree: true });
    window.addEventListener("hashchange", enhance);
    enhance();
  };

  const setupGridHierarchy = () => {
    const grid = document.getElementById("games-grid");
    if (!grid) return;
    let applying = false;

    const isDefaultDiscovery = () => {
      const search = document.getElementById("search-input")?.value.trim() || "";
      const player = document.querySelector(".filter-player-btn.active")?.dataset.player || "all";
      const genre = document.querySelector(".quick-tag-chip.active")?.dataset.genre || "all";
      const sort = document.getElementById("sort-select")?.value || "recommended";
      const favoritesOnly = document.getElementById("btn-toggle-fav-filter")?.classList.contains("active");
      return !search && player === "all" && genre === "all" && sort === "recommended" && !favoritesOnly;
    };

    const apply = () => {
      if (applying) return;
      applying = true;
      try {
        const defaultMode = isDefaultDiscovery() && (document.querySelector(".smart-tag-chip.active")?.dataset.filterTag || "all") === "all" && (document.getElementById("fit-players")?.value || "all") === "all" && (document.getElementById("fit-duration")?.value || "all") === "all";
        const cards = [...grid.querySelectorAll(":scope > .game-card")];
        cards.forEach((card, index) => card.classList.toggle("quality-featured", defaultMode && index < 8));

        let separator = grid.querySelector(":scope > .quality-grid-separator");
        if (!defaultMode || cards.length <= 8) {
          if (separator) separator.remove();
          return;
        }

        if (!separator) {
          separator = document.createElement("div");
          separator.className = "quality-grid-separator";
          separator.innerHTML = '<strong>もっと探す</strong><span>ここから先はミニツールや定番ゲームも含めて一覧できます。</span>';
          cards[7].after(separator);
          return;
        }

        if (separator.previousElementSibling !== cards[7]) cards[7].after(separator);
      } finally {
        applying = false;
      }
    };

    const scheduleApply = () => queueMicrotask(apply);
    new MutationObserver(scheduleApply).observe(grid, { childList: true });
    document.getElementById("search-input")?.addEventListener("input", scheduleApply);
    document.getElementById("sort-select")?.addEventListener("change", scheduleApply);
    document.querySelectorAll(".filter-player-btn,.quick-tag-chip,.smart-tag-chip,#btn-toggle-fav-filter").forEach((element) => {
      element.addEventListener("click", scheduleApply);
    });
    apply();
  };

  const setupContextAwareRoulette = () => {
    const spinButton = document.getElementById("btn-spin-roulette");
    const modal = document.getElementById("modal-roulette");
    const resultBox = document.getElementById("roulette-result-box");
    const resultTitle = document.getElementById("roulette-result-title");
    const resultIcon = document.getElementById("roulette-result-icon");
    const resultCatch = document.getElementById("roulette-result-catch");
    const goButton = document.getElementById("btn-roulette-go");
    if (!spinButton || !modal || !resultBox || !resultTitle || !resultIcon || !resultCatch || !goButton) return;

    let spinTimer = null;
    const clearSpin = () => {
      if (spinTimer) {
        clearInterval(spinTimer);
        spinTimer = null;
      }
      spinButton.disabled = false;
      resultBox.classList.remove("spinning");
    };

    spinButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      clearSpin();
      goButton.classList.add("hidden");
      goButton.onclick = null;

      const visibleIds = [...document.querySelectorAll("#games-grid > .game-card[data-id]")]
        .map((card) => card.dataset.id)
        .filter(Boolean);
      const byId = new Map((typeof GAMES_DATA !== "undefined" ? GAMES_DATA : []).map((game) => [game.id, game]));
      const candidates = visibleIds.map((id) => byId.get(id)).filter(Boolean);

      if (!candidates.length) {
        if (typeof Toast !== "undefined") Toast.warning("現在の条件に合うゲームがありません。条件を少し広げてみてください");
        return;
      }

      if (typeof Sound !== "undefined") Sound.playSelect();
      spinButton.disabled = true;
      resultBox.classList.add("spinning");

      let count = 0;
      const maxCount = 20;
      let selected = candidates[0];
      spinTimer = setInterval(() => {
        count += 1;
        selected = candidates[Math.floor(Math.random() * candidates.length)];
        resultIcon.textContent = selected.icon;
        resultTitle.textContent = selected.title;
        resultCatch.textContent = selected.catchphrase;
        if (typeof Sound !== "undefined") Sound.playTick(700 + count * 20);

        if (count >= maxCount) {
          clearSpin();
          if (typeof Sound !== "undefined") Sound.playFanfare();
          if (typeof Confetti !== "undefined" && typeof Confetti.burst === "function") Confetti.burst(80);
          if (typeof Toast !== "undefined") Toast.success(`「${selected.title}」が出ました！🎲`);
          goButton.classList.remove("hidden");
          goButton.onclick = () => {
            modal.classList.add("hidden");
            location.hash = `game/${selected.id}`;
          };
        }
      }, 80);
    }, true);

    document.getElementById("btn-close-roulette")?.addEventListener("click", clearSpin);
    window.addEventListener("hashchange", clearSpin);
  };

  const setupModalAccessibility = () => {
    const returnFocus = new WeakMap();
    const focusableSelector = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    const visibleDialog = () => [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')]
      .reverse()
      .find((dialog) => !dialog.classList.contains("hidden") && dialog.getClientRects().length > 0);

    const focusDialog = (dialog, previous) => {
      if (!dialog) return;
      if (previous instanceof HTMLElement) returnFocus.set(dialog, previous);
      const first = dialog.querySelector(focusableSelector);
      if (first instanceof HTMLElement) first.focus({ preventScroll: true });
      else {
        dialog.tabIndex = -1;
        dialog.focus({ preventScroll: true });
      }
    };

    const closeDialog = (dialog) => {
      if (!dialog) return;
      const close = dialog.querySelector('[id^="btn-close-"], .modal-close-btn');
      if (close instanceof HTMLElement) close.click();
      else dialog.classList.add("hidden");
      const previous = returnFocus.get(dialog);
      if (previous instanceof HTMLElement && document.contains(previous)) {
        queueMicrotask(() => previous.focus({ preventScroll: true }));
      }
    };

    document.addEventListener("click", (event) => {
      const trigger = event.target.closest('#btn-random-roulette,#btn-open-settings,#btn-open-topic-custom,#btn-toggle-scoreboard');
      if (!trigger) return;
      const previous = trigger;
      queueMicrotask(() => {
        const dialog = visibleDialog();
        if (dialog) focusDialog(dialog, previous);
      });
    }, true);

    document.addEventListener("keydown", (event) => {
      const dialog = visibleDialog();
      if (!dialog) return;

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        closeDialog(dialog);
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = [...dialog.querySelectorAll(focusableSelector)]
        .filter((element) => element instanceof HTMLElement && element.getClientRects().length > 0);
      if (!focusable.length) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }, true);
  };

  const setupScoreboard = () => {
    const KEY = "asobi_scoreboard_players";
    const normalize = (players) => {
      if (!Array.isArray(players) || players.length === 0) {
        return [{ name: "プレイヤー1", score: 0 }, { name: "プレイヤー2", score: 0 }];
      }
      return players.slice(0, 20).map((player, index) => ({
        name: String(player?.name || `プレイヤー${index + 1}`).slice(0, 40),
        score: Number.isFinite(Number(player?.score)) ? Number(player.score) : 0
      }));
    };

    let players = normalize(storageGet(KEY, null));
    const drawer = document.getElementById("scoreboard-drawer");
    const list = document.getElementById("scoreboard-players-list");
    const toggleButton = document.getElementById("btn-toggle-scoreboard");

    const save = () => storageSet(KEY, players);
    const render = () => {
      if (!list) return;
      list.innerHTML = players.map((player, index) => `
        <div class="scoreboard-row">
          <input type="text" class="score-player-name" value="${esc(player.name)}" data-idx="${index}" placeholder="名前" maxlength="40">
          <div class="score-controls">
            <button class="btn-score-ctrl btn-score-minus" data-quality-score="minus" data-idx="${index}" aria-label="1点減点">−</button>
            <span class="score-value ${player.score > 0 ? "score-pos" : player.score < 0 ? "score-neg" : ""}">${player.score}</span>
            <button class="btn-score-ctrl btn-score-plus" data-quality-score="plus" data-idx="${index}" aria-label="1点加点">＋</button>
            ${players.length > 1 ? `<button class="btn-score-del" data-quality-score="del" data-idx="${index}" title="削除">✕</button>` : ""}
          </div>
        </div>`).join("");
    };

    const interceptClick = (event) => {
      const id = event.target.id;
      const scoreAction = event.target.closest("[data-quality-score]");
      const managed = ["btn-toggle-scoreboard", "btn-close-scoreboard", "btn-reset-scores", "btn-add-player"].includes(id) || Boolean(scoreAction);
      if (!managed) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (id === "btn-toggle-scoreboard") {
        drawer?.classList.toggle("hidden");
        render();
      } else if (id === "btn-close-scoreboard") {
        drawer?.classList.add("hidden");
      } else if (id === "btn-reset-scores") {
        if (confirm("全員のスコアを0にリセットしますか？")) {
          players.forEach((player) => { player.score = 0; });
          save();
          render();
        }
      } else if (id === "btn-add-player") {
        players.push({ name: `プレイヤー${players.length + 1}`, score: 0 });
        save();
        render();
      } else if (scoreAction) {
        const index = Number(scoreAction.dataset.idx);
        if (!players[index]) return;
        const action = scoreAction.dataset.qualityScore;
        if (action === "plus") players[index].score += 1;
        if (action === "minus") players[index].score -= 1;
        if (action === "del" && players.length > 1) players.splice(index, 1);
        save();
        render();
      }
    };

    document.addEventListener("click", interceptClick, true);
    document.addEventListener("change", (event) => {
      const input = event.target.closest(".score-player-name");
      if (!input || !list?.contains(input)) return;
      event.stopPropagation();
      event.stopImmediatePropagation();
      const index = Number(input.dataset.idx);
      if (!players[index]) return;
      players[index].name = input.value.trim() || `プレイヤー${index + 1}`;
      save();
      render();
    }, true);

    const updateVisibility = () => {
      const inGame = /^#game\//.test(location.hash);
      toggleButton?.classList.toggle("quality-utility-hidden", !inGame);
      if (!inGame) drawer?.classList.add("hidden");
    };
    window.addEventListener("hashchange", updateVisibility);
    updateVisibility();
    render();
  };

  addQualityStylesheet();
  document.addEventListener("DOMContentLoaded", () => {
    setupHomeIntent();
    setupStampRally();
    setupScoreboard();
    setupGridHierarchy();
    setupContextAwareRoulette();
    if (!globalThis.ModalManager) setupModalAccessibility();
    setupDetailObserver();
    decorateMonetization();
  });
})();
