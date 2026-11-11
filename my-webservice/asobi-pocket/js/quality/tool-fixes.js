(() => {
  "use strict";

  if (typeof GameTools === "undefined") return;

  const esc = (value) => {
    if (typeof escapeHTML === "function") return escapeHTML(String(value ?? ""));
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const play = (method, ...args) => {
    if (typeof Sound !== "undefined" && typeof Sound[method] === "function") {
      Sound[method](...args);
    }
  };

  const toast = (method, message) => {
    if (typeof Toast !== "undefined" && typeof Toast[method] === "function") {
      Toast[method](message);
    }
  };

  const celebrate = (count = 70) => {
    play("playFanfare");
    if (typeof Confetti !== "undefined" && typeof Confetti.burst === "function") {
      Confetti.burst(count);
    }
  };

  const formatTime = (sec) => {
    const safe = Math.max(0, Number(sec) || 0);
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Word Wolf: keep the actual majority/minority words in round state so
  // result judging never falls back to the unswapped preset values.
  GameTools.renderWordWolf = function renderWordWolfFixed(container, game) {
    const state = {
      playerCount: 4,
      wolfCount: 1,
      step: "setup",
      players: [],
      currentPlayerIdx: 0,
      timerSec: 180,
      timerInterval: null,
      selectedPreset: null,
      citizenWord: "",
      wolfWord: "",
      selectedVoteId: null
    };

    const clearTimer = () => {
      if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
      }
    };

    const restart = () => {
      clearTimer();
      state.step = "setup";
      state.players = [];
      state.currentPlayerIdx = 0;
      state.selectedPreset = null;
      state.citizenWord = "";
      state.wolfWord = "";
      state.selectedVoteId = null;
      render();
    };

    function render() {
      clearTimer();

      if (state.step === "setup") {
        container.innerHTML = `
          <div class="tool-card">
            <h3 class="tool-title">🐺 ワードウルフ設定</h3>
            <div class="setting-group">
              <label class="setting-label">参加人数: <span id="val-player-count" class="badge-num">${state.playerCount}人</span></label>
              <input type="range" class="range-slider" min="3" max="10" value="${state.playerCount}" id="range-player-count">
            </div>
            <div class="setting-group">
              <label class="setting-label">ウルフの人数: <span class="badge-num">${state.wolfCount}人</span></label>
              <div class="btn-toggle-group">
                <button class="btn-toggle ${state.wolfCount === 1 ? "active" : ""}" data-wolf="1">1人</button>
                <button class="btn-toggle ${state.wolfCount === 2 ? "active" : ""}" data-wolf="2" ${state.playerCount < 5 ? "disabled" : ""}>2人 (5人以上)</button>
              </div>
            </div>
            <div class="setting-group">
              <label class="setting-label">トーク時間:</label>
              <div class="btn-toggle-group">
                <button class="btn-toggle ${state.timerSec === 120 ? "active" : ""}" data-time="120">2分</button>
                <button class="btn-toggle ${state.timerSec === 180 ? "active" : ""}" data-time="180">3分</button>
                <button class="btn-toggle ${state.timerSec === 300 ? "active" : ""}" data-time="300">5分</button>
              </div>
            </div>
            <button class="btn btn-primary btn-block btn-lg" id="btn-start-wolf">役職とお題を配る ➔</button>
          </div>`;

        container.querySelector("#range-player-count").addEventListener("input", (event) => {
          state.playerCount = Number(event.target.value);
          if (state.playerCount < 5 && state.wolfCount === 2) state.wolfCount = 1;
          render();
        });
        container.querySelectorAll("[data-wolf]").forEach((button) => {
          button.addEventListener("click", () => {
            play("playClick");
            state.wolfCount = Number(button.dataset.wolf);
            render();
          });
        });
        container.querySelectorAll("[data-time]").forEach((button) => {
          button.addEventListener("click", () => {
            play("playClick");
            state.timerSec = Number(button.dataset.time);
            render();
          });
        });
        container.querySelector("#btn-start-wolf").addEventListener("click", () => {
          const presets = Array.isArray(game.presets) ? game.presets : [];
          if (!presets.length) {
            toast("warning", "ワードウルフのお題がありません");
            return;
          }

          play("playSelect");
          state.selectedPreset = presets[Math.floor(Math.random() * presets.length)];
          const swapped = Math.random() < 0.5;
          state.citizenWord = swapped ? state.selectedPreset.citizen : state.selectedPreset.wolf;
          state.wolfWord = swapped ? state.selectedPreset.wolf : state.selectedPreset.citizen;

          const roles = Array(state.playerCount).fill("citizen");
          const wolfIndexes = [];
          while (wolfIndexes.length < state.wolfCount) {
            const index = Math.floor(Math.random() * state.playerCount);
            if (!wolfIndexes.includes(index)) wolfIndexes.push(index);
          }
          wolfIndexes.forEach((index) => { roles[index] = "wolf"; });

          state.players = roles.map((role, index) => ({
            id: index + 1,
            name: `プレイヤー ${index + 1}`,
            role,
            word: role === "citizen" ? state.citizenWord : state.wolfWord
          }));
          state.currentPlayerIdx = 0;
          state.selectedVoteId = null;
          state.step = "passing";
          render();
        });
        return;
      }

      if (state.step === "passing") {
        const player = state.players[state.currentPlayerIdx];
        container.innerHTML = `
          <div class="tool-card text-center">
            <div class="pass-indicator">順番: ${state.currentPlayerIdx + 1} / ${state.playerCount} 人目</div>
            <h3 class="player-turn-title">📱 ${esc(player.name)} さん</h3>
            <p class="pass-desc">スマホを受け取った本人だけが、お題を確認してください。</p>
            <div class="secret-box-wrapper">
              <button class="btn btn-secret" id="btn-reveal-word"><span class="secret-icon">🔒</span><span class="secret-text">タップしてお題を見る</span></button>
              <div class="secret-word-card hidden" id="secret-word-card">
                <span class="word-category">ジャンル: ${esc(state.selectedPreset?.category || "トーク")}</span>
                <div class="the-word">${esc(player.word)}</div>
                <p class="word-caution">※この言葉そのものは言わずに会話しよう</p>
                <button class="btn btn-outline btn-xs mt-2" id="btn-hide-word">🙈 伏せる</button>
              </div>
            </div>
            <button class="btn btn-primary btn-block mt-4 hidden" id="btn-next-player">${state.currentPlayerIdx + 1 < state.playerCount ? "確認した！次の人へ ➔" : "全員完了！トークを始める ⏱️"}</button>
          </div>`;

        const reveal = container.querySelector("#btn-reveal-word");
        const card = container.querySelector("#secret-word-card");
        const next = container.querySelector("#btn-next-player");
        reveal.addEventListener("click", () => {
          play("playClick");
          reveal.classList.add("hidden");
          card.classList.remove("hidden");
          next.classList.remove("hidden");
        });
        container.querySelector("#btn-hide-word").addEventListener("click", () => {
          play("playClick");
          card.classList.add("hidden");
          reveal.classList.remove("hidden");
        });
        next.addEventListener("click", () => {
          play("playSelect");
          if (state.currentPlayerIdx + 1 < state.playerCount) {
            state.currentPlayerIdx += 1;
          } else {
            state.step = "timer";
          }
          render();
        });
        return;
      }

      if (state.step === "timer") {
        let remaining = state.timerSec;
        let running = true;
        container.innerHTML = `
          <div class="tool-card text-center">
            <div class="timer-badge">💬 トークタイム中！</div>
            <div class="timer-display-lg" id="wolf-timer-display">${formatTime(remaining)}</div>
            <p class="timer-guide">自分のお題を直接言わず、少数派を探ろう。</p>
            <div class="btn-group-row">
              <button class="btn btn-secondary" id="btn-toggle-timer">一時停止</button>
              <button class="btn btn-danger" id="btn-finish-talk">トーク終了＆投票 ➔</button>
            </div>
          </div>`;

        const display = container.querySelector("#wolf-timer-display");
        const toggle = container.querySelector("#btn-toggle-timer");
        const finish = container.querySelector("#btn-finish-talk");

        state.timerInterval = setInterval(() => {
          if (!running) return;
          remaining -= 1;
          display.textContent = formatTime(remaining);
          if (remaining <= 10 && remaining > 0) {
            display.classList.add("pulse-red");
            play("playTick", 1000);
          }
          if (remaining <= 0) {
            clearTimer();
            play("playExplosion");
            state.step = "vote";
            render();
          }
        }, 1000);

        toggle.addEventListener("click", () => {
          play("playClick");
          running = !running;
          toggle.textContent = running ? "一時停止" : "再開";
        });
        finish.addEventListener("click", () => {
          play("playSelect");
          state.step = "vote";
          render();
        });
        return;
      }

      if (state.step === "vote") {
        container.innerHTML = `
          <div class="tool-card text-center">
            <h3 class="tool-title">🗳️ 最多票の人を選択</h3>
            <p class="vote-instruction">みんなの投票で最も怪しかった人を1人タップしてください。</p>
            <div class="vote-player-grid">
              ${state.players.map((player) => `<button class="btn btn-outline btn-vote-target ${state.selectedVoteId === player.id ? "active" : ""}" data-pid="${player.id}">👤 ${esc(player.name)}</button>`).join("")}
            </div>
            <button class="btn btn-warning btn-lg btn-block mt-4" id="btn-open-roles" ${state.selectedVoteId ? "" : "disabled"}>投票確定！結果発表 🎉</button>
          </div>`;

        container.querySelectorAll(".btn-vote-target").forEach((button) => {
          button.addEventListener("click", () => {
            play("playClick");
            state.selectedVoteId = Number(button.dataset.pid);
            render();
          });
        });
        container.querySelector("#btn-open-roles").addEventListener("click", () => {
          celebrate(80);
          state.step = "result";
          render();
        });
        return;
      }

      const votedPlayer = state.players.find((player) => player.id === state.selectedVoteId);
      const caughtWolf = votedPlayer?.role === "wolf";
      container.innerHTML = `
        <div class="tool-card text-center">
          <h3 class="tool-title">🎉 正解 ＆ 役職オープン！</h3>
          <div class="roles-list my-3">
            ${state.players.map((player) => `
              <div class="role-item ${player.role === "wolf" ? "is-wolf" : "is-citizen"}">
                <span class="role-icon">${player.role === "wolf" ? "🐺 ウルフ" : "👤 市民"}</span>
                <span class="role-player">${esc(player.name)}</span>
                <span class="role-word">お題: <strong>${esc(player.word)}</strong></span>
              </div>`).join("")}
          </div>
          <div class="topic-box my-3 text-left">
            <span class="topic-tag">🗳️ 投票結果</span>
            <p class="mt-1 font-bold">${esc(votedPlayer?.name || "未選択")} は ${caughtWolf ? "🐺 ウルフでした。市民側が少数派を発見！" : "👤 市民でした。ウルフ側の勝利！"}</p>
          </div>
          ${caughtWolf ? `
            <div class="topic-box my-3 text-left wolf-guess-box">
              <span class="topic-tag">🐺 ウルフの逆転チャンス</span>
              <p class="text-xs text-sub mt-1">市民に実際に配られた多数派ワードを当てれば逆転です。</p>
              <div class="decision-input-row mt-2">
                <input type="text" class="decision-input" id="input-wolf-guess" placeholder="市民のお題を入力...">
                <button class="btn btn-danger" id="btn-judge-wolf-guess">判定！ 🎯</button>
              </div>
              <div id="wolf-guess-result-msg" class="mt-2 font-bold text-center"></div>
            </div>` : ""}
          <button class="btn btn-primary btn-block mt-4" id="btn-restart-wolf">もう一度遊ぶ 🔄</button>
        </div>`;

      if (caughtWolf) {
        const input = container.querySelector("#input-wolf-guess");
        const judge = container.querySelector("#btn-judge-wolf-guess");
        const result = container.querySelector("#wolf-guess-result-msg");
        judge.addEventListener("click", () => {
          const guess = input.value.trim();
          if (!guess) {
            toast("warning", "お題を入力してください");
            return;
          }
          const expected = String(state.citizenWord);
          // 部分一致だと1文字だけで正解になる。正規化した全文一致だけ認める。
          const normalizeAnswer = (value) => String(value).normalize("NFKC").toLowerCase()
            .replace(/\s+/g, "")
            .replace(/[ァ-ヶ]/g, char => String.fromCharCode(char.charCodeAt(0) - 0x60));
          const correct = normalizeAnswer(guess) === normalizeAnswer(expected);
          if (correct) {
            celebrate(100);
            result.innerHTML = `<span class="text-danger font-bold text-lg">🎉 大正解！【${esc(expected)}】<br>🐺 ウルフ側の逆転勝利！</span>`;
          } else {
            play("playWrong");
            result.innerHTML = `<span class="text-success font-bold">⭕ 市民のお題は【${esc(expected)}】でした。市民側の勝利！</span>`;
          }
          input.disabled = true;
          judge.disabled = true;
        });
      }
      container.querySelector("#btn-restart-wolf").addEventListener("click", restart);
    }

    render();
    return clearTimer;
  };

  // Finger roulette: touch remains multi-touch; desktop can place virtual
  // fingers by clicking two or more positions on the board.
  GameTools.renderFingerRoulette = function renderFingerRouletteFixed(container) {
    container.innerHTML = `
      <div class="finger-roulette-container" id="touch-area">
        <div class="roulette-overlay" id="roulette-overlay">
          <div class="roulette-title">👆 指を置く / PCは2か所以上クリック</div>
          <div class="roulette-desc">スマホはマルチタッチ、PCはクリックした位置を仮想の指として抽選します。</div>
          <div class="roulette-mode-select">
            <span>選ぶ人数: </span>
            <button class="btn-pill active" data-pick="1">1人選ぶ</button>
            <button class="btn-pill" data-pick="2">2人選ぶ</button>
          </div>
        </div>
        <canvas id="roulette-canvas"></canvas>
      </div>`;

    const area = container.querySelector("#touch-area");
    const canvas = container.querySelector("#roulette-canvas");
    const ctx = canvas.getContext("2d");
    const overlay = container.querySelector("#roulette-overlay");
    const colors = ["#FF5A5F", "#48BB78", "#4299E1", "#ECC94B", "#9F7AEA", "#ED64A6", "#38B2AC", "#FF9800"];
    const points = new Map();
    let pickCount = 1;
    let phase = "waiting";
    let countdownTimer = null;
    let winners = [];
    let rafId = null;
    let desktopId = 1000;

    const resize = () => {
      const rect = area.getBoundingClientRect();
      canvas.width = Math.max(300, Math.floor(rect.width || 300));
      canvas.height = Math.max(400, Math.floor(rect.height || 400));
    };

    const reset = () => {
      if (countdownTimer) clearTimeout(countdownTimer);
      countdownTimer = null;
      points.clear();
      winners = [];
      phase = "waiting";
      overlay.classList.remove("hidden");
    };

    const decide = () => {
      if (points.size < 2) return reset();
      phase = "decided";
      const ids = [...points.keys()];
      winners = [];
      while (winners.length < Math.min(pickCount, ids.length)) {
        const id = ids[Math.floor(Math.random() * ids.length)];
        if (!winners.includes(id)) winners.push(id);
      }
      celebrate(60);
      toast("success", "決定しました！もう一度なら指を離す / PCは再クリック");
    };

    const maybeStart = () => {
      if (points.size < 2) {
        if (countdownTimer) clearTimeout(countdownTimer);
        countdownTimer = null;
        phase = "waiting";
        overlay.classList.remove("hidden");
        return;
      }
      overlay.classList.add("hidden");
      if (phase === "waiting") {
        phase = "counting";
        play("playTick", 600);
        countdownTimer = setTimeout(decide, 1800);
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      points.forEach((point, id) => {
        const winner = winners.includes(id);
        const radius = winner ? 72 : 54;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius + 10 * Math.sin(Date.now() / 160), 0, Math.PI * 2);
        ctx.strokeStyle = `${point.color}66`;
        ctx.lineWidth = 6;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = winner ? "#FFD700" : point.color;
        ctx.fill();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = winner ? "bold 32px sans-serif" : "24px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(winner ? "👑" : "👆", point.x, point.y);
      });
      rafId = requestAnimationFrame(draw);
    };

    const syncTouches = (event) => {
      event.preventDefault();
      if (phase === "decided" && event.touches.length === 0) {
        reset();
        return;
      }
      [...points.keys()].filter((id) => String(id).startsWith("t-")).forEach((id) => points.delete(id));
      const rect = canvas.getBoundingClientRect();
      [...event.touches].forEach((touch, index) => {
        points.set(`t-${touch.identifier}`, {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
          color: colors[index % colors.length]
        });
      });
      if (phase !== "decided") maybeStart();
    };

    area.addEventListener("touchstart", syncTouches, { passive: false });
    area.addEventListener("touchmove", syncTouches, { passive: false });
    area.addEventListener("touchend", syncTouches, { passive: false });
    area.addEventListener("touchcancel", syncTouches, { passive: false });
    area.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      if (phase === "decided") {
        reset();
        return;
      }
      if (event.detail === 0) return;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const existing = [...points.entries()].find(([id, point]) => String(id).startsWith("m-") && Math.hypot(point.x - x, point.y - y) < 60);
      if (existing) {
        points.delete(existing[0]);
      } else if (points.size < 8) {
        desktopId += 1;
        points.set(`m-${desktopId}`, { x, y, color: colors[points.size % colors.length] });
      }
      maybeStart();
    });

    container.querySelectorAll(".btn-pill").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        play("playClick");
        pickCount = Number(button.dataset.pick);
        container.querySelectorAll(".btn-pill").forEach((item) => item.classList.toggle("active", item === button));
      });
    });

    resize();
    window.addEventListener("resize", resize);
    draw();

    return () => {
      if (countdownTimer) clearTimeout(countdownTimer);
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  };

  GameTools.renderDuelReflex = function renderDuelReflexFixed(container) {
    let disposed = false;
    const state = {
      scoreP1: 0,
      scoreP2: 0,
      phase: "ready",
      matchWinner: null,
      message: "",
      reactionMs: null,
      startAt: 0,
      cueTimer: null,
      nextTimer: null
    };

    const cleanup = () => {
      if (state.cueTimer) clearTimeout(state.cueTimer);
      if (state.nextTimer) clearTimeout(state.nextTimer);
      state.cueTimer = null;
      state.nextTimer = null;
    };

    const startRound = () => {
      if (disposed) return;
      cleanup();
      state.phase = "waiting";
      state.message = "待て…";
      state.reactionMs = null;
      render();
      state.cueTimer = setTimeout(() => {
        if (disposed) return;
        state.phase = "go";
        state.startAt = performance.now();
        state.message = "押せ！！！";
        play("playCountBeep", true);
        play("hapticWarning");
        render();
      }, 1400 + Math.random() * 2600);
    };

    const afterPoint = (winner, message) => {
      if (disposed) return;
      if (winner === 1) state.scoreP1 += 1;
      if (winner === 2) state.scoreP2 += 1;
      state.message = message;
      if (state.scoreP1 >= 3 || state.scoreP2 >= 3) {
        state.matchWinner = state.scoreP1 >= 3 ? 1 : 2;
        state.phase = "win";
        celebrate(90);
        render();
        return;
      }
      state.phase = "feedback";
      render();
      state.nextTimer = setTimeout(startRound, 1100);
    };

    const handleTap = (player) => {
      if (state.phase === "waiting") {
        if (state.cueTimer) clearTimeout(state.cueTimer);
        state.cueTimer = null;
        play("playWrong");
        play("hapticExplosion");
        afterPoint(player === 1 ? 2 : 1, `PLAYER ${player} フライング！`);
      } else if (state.phase === "go") {
        state.reactionMs = Math.round(performance.now() - state.startAt);
        play("playCorrect");
        play("hapticSuccess");
        afterPoint(player, `PLAYER ${player}: ${state.reactionMs}ms`);
      }
    };

    function render() {
      container.innerHTML = `
        <div class="duel-container ${state.phase}">
          <div class="duel-half duel-top" id="duel-p1-area"><div class="duel-content rotate-180"><div class="duel-score">スコア: ${state.scoreP1} / 3</div><div class="duel-player-label">PLAYER 1</div><div class="duel-status-text ${state.phase === "go" ? "go" : ""}">${state.phase === "ready" ? "準備" : state.message}</div></div></div>
          <div class="duel-divider">
            ${state.phase === "ready" ? '<button class="btn btn-primary btn-sm" id="btn-duel-start">勝負スタート！</button>' : ""}
            ${state.phase === "win" ? `<div class="duel-win-banner">🏆 PLAYER ${state.matchWinner} の勝利！<button class="btn btn-sm btn-outline mt-1" id="btn-duel-restart">もう一度対決</button></div>` : ""}
            ${!["ready", "win"].includes(state.phase) ? `<div class="duel-center-text">${state.reactionMs == null ? state.message : `${state.reactionMs}ms`}</div>` : ""}
          </div>
          <div class="duel-half duel-bottom" id="duel-p2-area"><div class="duel-content"><div class="duel-player-label">PLAYER 2</div><div class="duel-score">スコア: ${state.scoreP2} / 3</div><div class="duel-status-text ${state.phase === "go" ? "go" : ""}">${state.phase === "ready" ? "準備" : state.message}</div></div></div>
        </div>`;

      const start = container.querySelector("#btn-duel-start");
      if (start) start.addEventListener("click", startRound);
      const restart = container.querySelector("#btn-duel-restart");
      if (restart) restart.addEventListener("click", () => {
        cleanup();
        state.scoreP1 = 0;
        state.scoreP2 = 0;
        state.phase = "ready";
        state.matchWinner = null;
        state.message = "";
        render();
      });
      if (["waiting", "go"].includes(state.phase)) {
        container.querySelector("#duel-p1-area").addEventListener("pointerdown", (event) => { event.preventDefault(); handleTap(1); }, { passive: false });
        container.querySelector("#duel-p2-area").addEventListener("pointerdown", (event) => { event.preventDefault(); handleTap(2); }, { passive: false });
      }
    }

    render();
    return () => {
      disposed = true;
      cleanup();
    };
  };

  GameTools.renderDuelMash = function renderDuelMashFixed(container) {
    const state = { p1Taps: 0, p2Taps: 0, gauge: 50, timeLeft: 15, phase: "ready", timerId: null };

    const cleanup = () => {
      if (state.timerId) clearInterval(state.timerId);
      state.timerId = null;
    };

    const finish = () => {
      cleanup();
      if (state.phase !== "playing") return;
      state.phase = "result";
      celebrate(80);
      render();
    };

    const refresh = () => {
      const g1 = container.querySelector(".mash-gauge-p1");
      const g2 = container.querySelector(".mash-gauge-p2");
      const c1 = container.querySelector("#mash-p1-btn .mash-count");
      const c2 = container.querySelector("#mash-p2-btn .mash-count");
      if (g1) g1.style.height = `${100 - state.gauge}%`;
      if (g2) g2.style.height = `${state.gauge}%`;
      if (c1) c1.textContent = `連打数: ${state.p1Taps}`;
      if (c2) c2.textContent = `連打数: ${state.p2Taps}`;
      if (state.gauge <= 0 || state.gauge >= 100) finish();
    };

    const tap = (player, event) => {
      if (state.phase !== "playing") return;
      event.preventDefault();
      if (player === 1) {
        state.p1Taps += 1;
        state.gauge = Math.max(0, state.gauge - 1.2);
      } else {
        state.p2Taps += 1;
        state.gauge = Math.min(100, state.gauge + 1.2);
      }
      play("hapticLight");
      refresh();
    };

    function render() {
      const winner = state.gauge < 50 ? "PLAYER 1" : state.gauge > 50 ? "PLAYER 2" : null;
      container.innerHTML = `
        <div class="duel-container mash-battle ${state.phase}">
          <div class="duel-half duel-top" id="mash-p1-btn"><div class="duel-content rotate-180"><div class="duel-player-label">PLAYER 1</div><div class="mash-count">連打数: ${state.p1Taps}</div><div class="mash-tap-hint">ここを全力連打！👆</div></div></div>
          <div class="mash-gauge-track"><div class="mash-gauge-p1" style="height:${100 - state.gauge}%"></div><div class="mash-gauge-center-line"><span class="badge badge-warning font-mono">⏱️ ${state.timeLeft}s</span></div><div class="mash-gauge-p2" style="height:${state.gauge}%"></div></div>
          <div class="duel-half duel-bottom" id="mash-p2-btn"><div class="duel-content"><div class="duel-player-label">PLAYER 2</div><div class="mash-count">連打数: ${state.p2Taps}</div><div class="mash-tap-hint">ここを全力連打！👆</div></div></div>
          ${state.phase === "ready" ? '<div class="duel-overlay"><div class="tool-card text-center"><h3>💥 連打パワーバトル</h3><p>15秒間、1台の画面を上下から連打！</p><button class="btn btn-primary btn-lg mt-2" id="btn-mash-start">FIGHT スタート！</button></div></div>' : ""}
          ${state.phase === "result" ? `<div class="duel-overlay"><div class="tool-card text-center"><h2>${winner ? '🏆 ' + winner + ' の勝利！' : '🤝 引き分け！'}</h2><p class="my-2">P1: ${state.p1Taps}回 vs P2: ${state.p2Taps}回</p><button class="btn btn-primary btn-block mt-3" id="btn-mash-retry">もう一度対決 🔄</button></div></div>` : ""}
        </div>`;

      const start = container.querySelector("#btn-mash-start");
      if (start) start.addEventListener("click", () => {
        cleanup();
        state.p1Taps = 0;
        state.p2Taps = 0;
        state.gauge = 50;
        state.timeLeft = 15;
        state.phase = "playing";
        play("playSelect");
        render();
        const deadlineAt = Date.now() + 15000;
        state.timerId = setInterval(() => {
          state.timeLeft = Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000));
          const badge = container.querySelector(".mash-gauge-center-line span");
          if (badge) badge.textContent = `⏱️ ${state.timeLeft}s`;
          if (state.timeLeft <= 0) finish();
        }, 1000);
      });
      const retry = container.querySelector("#btn-mash-retry");
      if (retry) retry.addEventListener("click", () => {
        cleanup();
        state.phase = "ready";
        state.timeLeft = 15;
        state.gauge = 50;
        render();
      });
      if (state.phase === "playing") {
        container.querySelector("#mash-p1-btn").addEventListener("pointerdown", (event) => tap(1, event), { passive: false });
        container.querySelector("#mash-p2-btn").addEventListener("pointerdown", (event) => tap(2, event), { passive: false });
      }
    }

    render();
    return cleanup;
  };

  GameTools.renderYamanote = function renderYamanoteFixed(container, game) {
    const state = { bpm: 80, isPlaying: false, intervalId: null, currentTopic: "", foulCount: 0 };

    const getTopic = () => {
      const source = typeof getActiveTopicsForGame === "function"
        ? getActiveTopicsForGame(game.id, game.presets)
        : (Array.isArray(game.presets) ? game.presets : []);
      if (!source.length) return "日本の都道府県";
      const item = source[Math.floor(Math.random() * source.length)];
      return typeof extractTopicText === "function" ? extractTopicText(item) : (typeof item === "string" ? item : item.text || item.title || "お題");
    };

    const cleanup = () => {
      if (state.intervalId) clearInterval(state.intervalId);
      state.intervalId = null;
      state.isPlaying = false;
    };

    const startRhythm = () => {
      if (state.intervalId) clearInterval(state.intervalId);
      state.intervalId = setInterval(() => {
        play("playClap");
        const visual = container.querySelector(".rhythm-visual-beat");
        if (visual) {
          visual.classList.add("beat-hit");
          setTimeout(() => visual.classList.remove("beat-hit"), 140);
        }
      }, (60 / state.bpm) * 1000);
    };

    state.currentTopic = getTopic();

    function render() {
      container.innerHTML = `
        <div class="tool-card text-center">
          <h3 class="tool-title">🚃 山手線ゲーム ＆ リズムマシーン</h3>
          <div class="topic-box my-3"><span class="topic-tag">🎯 お題</span><div class="topic-text">${esc(state.currentTopic)}</div><button class="btn btn-sm btn-outline mt-2" id="btn-next-yamanote-topic">お題チェンジ 🎲</button></div>
          <div class="rhythm-display-box my-4 ${state.isPlaying ? "beating" : ""}"><div class="rhythm-visual-beat">👏</div><div class="rhythm-bpm-display font-mono">BPM: ${state.bpm}</div></div>
          <div class="flex gap-2 justify-center my-3"><button class="btn ${state.isPlaying ? "btn-danger" : "btn-success"} btn-lg" id="btn-toggle-rhythm">${state.isPlaying ? "⏹️ リズム停止" : "▶️ リズムスタート"}</button></div>
          <div class="setting-group mt-3"><label class="setting-label">テンポ (BPM):</label><div class="flex gap-2 justify-center items-center"><button class="btn btn-sm btn-outline" id="btn-bpm-down">-10</button><input type="range" class="range-slider" min="60" max="160" value="${state.bpm}" id="range-bpm"><button class="btn btn-sm btn-outline" id="btn-bpm-up">+10</button></div></div>
          <div class="scoreboard-quick-box mt-4"><span>アウト回数: <strong class="badge-num">${state.foulCount}</strong></span><button class="btn btn-sm btn-danger ml-2" id="btn-add-foul">アウト！ ✕</button><button class="btn btn-sm btn-outline ml-1" id="btn-reset-foul">リセット</button></div>
        </div>`;

      container.querySelector("#btn-next-yamanote-topic").addEventListener("click", () => {
        state.currentTopic = getTopic();
        play("playClick");
        render();
      });
      container.querySelector("#btn-toggle-rhythm").addEventListener("click", () => {
        state.isPlaying = !state.isPlaying;
        if (state.isPlaying) startRhythm(); else cleanup();
        render();
      });
      container.querySelector("#range-bpm").addEventListener("input", (event) => {
        state.bpm = Number(event.target.value);
        if (state.isPlaying) startRhythm();
        render();
      });
      container.querySelector("#btn-bpm-up").addEventListener("click", () => {
        state.bpm = Math.min(160, state.bpm + 10);
        if (state.isPlaying) startRhythm();
        render();
      });
      container.querySelector("#btn-bpm-down").addEventListener("click", () => {
        state.bpm = Math.max(60, state.bpm - 10);
        if (state.isPlaying) startRhythm();
        render();
      });
      container.querySelector("#btn-add-foul").addEventListener("click", () => { state.foulCount += 1; play("playWrong"); render(); });
      container.querySelector("#btn-reset-foul").addEventListener("click", () => { state.foulCount = 0; render(); });
    }

    render();
    return cleanup;
  };

  GameTools.renderGesture = function renderGestureFixed(container, game) {
    const state = { score: 0, timeLeft: 60, phase: "ready", timerId: null, currentTopic: "" };

    const getTopic = () => {
      const source = typeof getActiveTopicsForGame === "function"
        ? getActiveTopicsForGame(game.id, game.presets)
        : (Array.isArray(game.presets) ? game.presets : []);
      if (!source.length) return "ゴリラがバナナを食べているところ";
      const item = source[Math.floor(Math.random() * source.length)];
      return typeof extractTopicText === "function" ? extractTopicText(item) : (typeof item === "string" ? item : item.text || item.title || "お題");
    };

    const cleanup = () => {
      if (state.timerId) clearInterval(state.timerId);
      state.timerId = null;
    };

    const nextTopic = () => {
      state.currentTopic = getTopic();
      render();
    };

    const finish = () => {
      if (state.phase !== "playing") return;
      cleanup();
      state.phase = "result";
      play("playExplosion");
      render();
    };

    state.currentTopic = getTopic();

    function render() {
      container.innerHTML = `
        <div class="tool-card text-center">
          <h3 class="tool-title">🤫 サイレント・ジェスチャーゲーム</h3>
          <div class="gesture-score-badge my-2">正解数: <strong class="badge-num font-mono">${state.score}</strong> 問</div>
          <div class="topic-box my-4"><span class="topic-tag">🎭 ジェスチャーお題</span><div class="topic-text font-black text-xl">${esc(state.currentTopic)}</div></div>
          <div class="timer-display font-mono text-2xl ${state.timeLeft <= 10 ? "text-danger animate-pulse" : "text-primary"}">⏱️ 残り: ${state.timeLeft} 秒</div>
          ${state.phase === "ready" ? '<button class="btn btn-primary btn-lg btn-block mt-3" id="btn-gesture-start">スタート！ (60秒)</button>' : ""}
          ${state.phase === "playing" ? '<div class="flex gap-2 justify-center my-3"><button class="btn btn-success btn-lg flex-1" id="btn-gesture-correct">⭕ 正解！次へ</button><button class="btn btn-outline btn-lg" id="btn-gesture-pass">パス ➔</button></div>' : ""}
          ${state.phase === "result" ? `<div class="won-box my-3"><h2 class="text-success">終了！ ${state.score} 問正解 🎉</h2><button class="btn btn-primary mt-2" id="btn-gesture-retry">もう一度</button></div>` : ""}
        </div>`;

      const start = container.querySelector("#btn-gesture-start");
      if (start) start.addEventListener("click", () => {
        cleanup();
        state.score = 0;
        state.timeLeft = 60;
        state.phase = "playing";
        state.currentTopic = getTopic();
        play("playSelect");
        render();
        const deadlineAt = Date.now() + 60000;
        state.timerId = setInterval(() => {
          state.timeLeft = Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000));
          const timer = container.querySelector(".timer-display");
          if (timer) {
            timer.textContent = `⏱️ 残り: ${state.timeLeft} 秒`;
            if (state.timeLeft <= 10) timer.classList.add("text-danger", "animate-pulse");
          }
          if (state.timeLeft <= 0) finish();
        }, 1000);
      });
      const correct = container.querySelector("#btn-gesture-correct");
      if (correct) correct.addEventListener("click", () => { state.score += 1; play("playCorrect"); nextTopic(); });
      const pass = container.querySelector("#btn-gesture-pass");
      if (pass) pass.addEventListener("click", () => { play("playClick"); nextTopic(); });
      const retry = container.querySelector("#btn-gesture-retry");
      if (retry) retry.addEventListener("click", () => { state.phase = "ready"; state.timeLeft = 60; state.currentTopic = getTopic(); render(); });
    }

    render();
    return cleanup;
  };
})();
