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

  const celebrate = (count = 54) => {
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

  const scrollIntoViewSafe = (el) => {
    if (typeof GameResult !== "undefined" && typeof GameResult.scrollResultIntoView === "function") {
      GameResult.scrollResultIntoView(el);
    }
  };

  // Word Wolf: keep the actual majority/minority words in round state so
  // result judging never falls back to the unswapped preset values.
  GameTools.renderWordWolf = function renderWordWolfFixed(container, game) {
    const roster = tableRoster();
    let articlePreset = game.articleTopic;
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
      selectedVoteId: null,
      spokenGuess: "",
      guessCorrect: null
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
      state.guessCorrect = null;
      state.spokenGuess = "";
      render();
    };

    function render() {
      clearTimer();

      if (state.step === "setup") {
        container.innerHTML = `
          <div class="tool-card">
            <h3 class="tool-title">ワードウルフ設定</h3>
            ${articlePreset ? '<p class="text-sm text-sub mb-3">記事で選んだペアを使います。</p>' : ""}
            <div class="setting-group">
              <label class="setting-label">参加人数: <span id="val-player-count" class="badge-num">${state.playerCount}人</span></label>
              <input type="range" class="range-slider" min="3" max="${game.maxPlayers}" value="${state.playerCount}" id="range-player-count">
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
            <details class="player-custom-accordion"><summary>席順と名前を設定（任意）</summary><div class="table-roster"></div></details>
            <button class="btn btn-primary btn-block btn-lg" id="btn-start-wolf">役職とお題を配る</button>
          </div>`;

        roster.mount(container, state.playerCount);
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
          const presets = getActiveTopicsForGame(game.id, game.presets)
            .map((topic) => (typeof topic === "string" ? customWolfPair(topic) : topic))
            .filter((topic) => topic?.citizen && topic?.wolf);
          if (!articlePreset && !presets.length) {
            toast("warning", "ワードウルフのお題がありません");
            return;
          }

          play("playSelect");
          state.selectedPreset = articlePreset || presets[Math.floor(Math.random() * presets.length)];
          articlePreset = null;
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

          const names = roster.labels(state.playerCount);
          state.players = roles.map((role, index) => ({
            id: index + 1,
            name: names[index],
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
            <h3 class="player-turn-title">${esc(player.name)} さん</h3>
            <p class="pass-desc">スマホを受け取った本人だけが、お題を確認してください。</p>
            <div class="secret-box-wrapper">
              <button class="btn btn-secret" id="btn-reveal-word"><span class="secret-text">タップしてお題を見る</span></button>
              <div class="secret-word-card hidden" id="secret-word-card">
                <span class="word-category">ジャンル: ${esc(state.selectedPreset?.category || "トーク")}</span>
                <div class="the-word">${esc(player.word)}</div>
                <p class="word-caution">※この言葉そのものは言わずに会話しましょう</p>
                <button class="btn btn-outline btn-xs mt-2" id="btn-hide-word">伏せる</button>
              </div>
            </div>
            <button class="btn btn-primary btn-block mt-4 hidden" id="btn-next-player">${state.currentPlayerIdx + 1 < state.playerCount ? "確認した・次の人へ" : "全員確認完了・トークを始める"}</button>
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
            <div class="timer-badge">トークタイム中</div>
            <div class="timer-display-lg" id="wolf-timer-display">${formatTime(remaining)}</div>
            <p class="timer-guide">まず一周、「いつ、どこで見かける？」に一言ずつ答えてみましょう。自分のお題は秘密です。</p>
            <div class="btn-group-row">
              <button class="btn btn-secondary" id="btn-toggle-timer">一時停止</button>
              <button class="btn btn-danger" id="btn-finish-talk">トーク終了・投票へ</button>
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
            play("playTimeUp");
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
            <h3 class="tool-title">最多票の人を選択</h3>
            <p class="vote-instruction">一斉に指差し、最多票の人を1人選びます。同票なら候補者が一言ずつ話し、その人たちだけでもう一度投票してください。</p>
            <div class="vote-player-grid">
              ${state.players.map((player) => `<button class="btn btn-outline btn-vote-target ${state.selectedVoteId === player.id ? "active" : ""}" data-pid="${player.id}">${esc(player.name)}</button>`).join("")}
            </div>
            <button class="btn btn-warning btn-lg btn-block mt-4" id="btn-open-roles" ${state.selectedVoteId ? "" : "disabled"}>投票を確定して結果を見る</button>
          </div>`;

        container.querySelectorAll(".btn-vote-target").forEach((button) => {
          button.addEventListener("click", () => {
            play("playClick");
            state.selectedVoteId = Number(button.dataset.pid);
            render();
          });
        });
        container.querySelector("#btn-open-roles").addEventListener("click", () => {
          const picked = state.players.find((p) => p.id === state.selectedVoteId);
          if (picked?.role === "wolf") {
            // 逆転チャンスが残っている段階では早まった祝福を出さない
            play("playSelect");
          } else {
            celebrate(54);
          }
          state.step = "result";
          render();
          const titleEl = container.querySelector("#wolf-result-title");
          if (titleEl) titleEl.focus({ preventScroll: true });
          scrollIntoViewSafe(container.querySelector(".tool-card"));
        });
        return;
      }

      const votedPlayer = state.players.find((player) => player.id === state.selectedVoteId);
      const caughtWolf = votedPlayer?.role === "wolf";
      const waitingForGuess = caughtWolf && state.guessCorrect === null;
      const outcome = typeof GameResult !== "undefined"
        ? GameResult.judgeWordWolfOutcome({ votedRole: caughtWolf ? "wolf" : "citizen", guessCorrect: state.guessCorrect })
        : {
          tone: waitingForGuess ? "pending" : (caughtWolf && !state.guessCorrect ? "win" : "wolf"),
          eyebrow: waitingForGuess ? "ウルフを発見" : "ゲーム終了",
          title: waitingForGuess ? "ウルフの逆転チャンス" : (caughtWolf && !state.guessCorrect ? "市民チームの勝利" : "ウルフ側の勝利"),
          subtitle: ""
        };

      const rolesHtml = waitingForGuess ? "" : `
        <div class="roles-list my-3">
          ${state.players.map((player) => `
            <div class="role-item ${player.role === "wolf" ? "is-wolf" : "is-citizen"}">
              <span class="role-icon">${player.role === "wolf" ? "ウルフ" : "市民"}</span>
              <span class="role-player">${esc(player.name)}</span>
              <span class="role-word">お題: <strong>${esc(player.word)}</strong></span>
            </div>`).join("")}
        </div>`;

      const voteSummaryHtml = `
        <div class="topic-box my-3 text-left">
          <span class="topic-tag">投票結果</span>
          <p class="mt-1 font-bold">${esc(votedPlayer?.name || "未選択")} は ${caughtWolf ? "ウルフでした。市民側が少数派を発見！" : "市民でした。ウルフ側の勝利です。"}</p>
        </div>`;

      const guessSectionHtml = waitingForGuess && state.spokenGuess ? `
        <div class="topic-box my-3 text-left" id="wolf-host-verdict">
          <span class="topic-tag">司会による判定</span>
          <p class="mt-1">確定した回答: <strong>${esc(state.spokenGuess)}</strong></p>
          <p>市民のお題: <strong>${esc(state.citizenWord)}</strong></p>
          <p class="text-xs text-sub mt-1">同じものを指す言い方であれば正解です。</p>
          <div class="flex gap-2 mt-3">
            <button class="btn btn-success flex-1" id="wolf-host-yes">同じものを指す</button>
            <button class="btn btn-secondary flex-1" id="wolf-host-no">別のものを指す</button>
          </div>
        </div>` : waitingForGuess ? `
        <form class="topic-box my-3 text-left wolf-guess-box" id="wolf-guess-form">
          <span class="topic-tag">逆転回答</span>
          <p class="text-xs text-sub mt-1">最多票になったウルフ本人が1回だけ回答します。市民に配られたお題を当てれば逆転勝利です。</p>
          <div class="decision-input-row mt-2">
            <input type="text" class="decision-input" id="input-wolf-guess" aria-label="市民のお題" placeholder="市民のお題を入力..." autocomplete="off">
            <button type="submit" class="btn btn-danger" id="btn-judge-wolf-guess">判定する</button>
          </div>
          <div class="flex gap-2 mt-2 flex-wrap">
            <button type="submit" class="btn btn-sm btn-outline" id="btn-host-wolf-guess">この回答を確定して司会が判定</button>
            <button type="button" class="btn btn-sm btn-outline" id="btn-skip-wolf-guess">パスしてお題を公開</button>
          </div>
        </form>` : "";

      const guessOutcomeHtml = caughtWolf && !waitingForGuess ? `
        <div id="wolf-guess-result-msg" class="topic-box my-3 font-bold">
          ${state.guessCorrect
            ? `正解！市民のお題は「${esc(state.citizenWord)}」でした。ウルフ側の逆転勝利！`
            : `市民のお題は「${esc(state.citizenWord)}」でした。市民側の勝利です！`}
        </div>` : "";

      const resultHeaderHtml = typeof GameResult !== "undefined"
        ? GameResult.renderResultCard({
          tone: outcome.tone,
          eyebrow: outcome.eyebrow,
          title: outcome.title,
          subtitle: outcome.subtitle,
          titleId: "wolf-result-title",
          metrics: waitingForGuess ? [] : [
            { label: "市民のお題", value: state.citizenWord },
            { label: "ウルフのお題", value: state.wolfWord }
          ]
        })
        : `<h3 class="mb-2" id="wolf-result-title" tabindex="-1">${esc(outcome.title)}</h3>`;

      container.innerHTML = `
        <div class="tool-card text-center">
          ${resultHeaderHtml}
          ${rolesHtml}
          ${voteSummaryHtml}
          ${guessSectionHtml}
          ${guessOutcomeHtml}
          <button class="btn btn-primary btn-block mt-4" id="btn-restart-wolf">もう一度遊ぶ</button>
        </div>`;

      const titleNode = container.querySelector("#wolf-result-title");
      if (titleNode) titleNode.tabIndex = -1;

      if (waitingForGuess) {
        const form = container.querySelector("#wolf-guess-form");
        const input = container.querySelector("#input-wolf-guess");
        const finishGuess = (correct) => {
          if (state.guessCorrect !== null) return;
          state.guessCorrect = correct;
          celebrate(56);
          render();
          const heading = container.querySelector("#wolf-result-title");
          if (heading) heading.focus({ preventScroll: true });
          scrollIntoViewSafe(container.querySelector(".tool-card"));
        };
        container.querySelector("#wolf-host-yes")?.addEventListener("click", () => finishGuess(true));
        container.querySelector("#wolf-host-no")?.addEventListener("click", () => finishGuess(false));
        form?.addEventListener("submit", (event) => {
          event.preventDefault();
          const guess = input.value.trim();
          if (!guess) {
            toast("warning", "お題を入力してください");
            input.focus();
            return;
          }
          if (event.submitter?.id === "btn-host-wolf-guess") {
            state.spokenGuess = guess;
            render();
            container.querySelector("#wolf-host-yes")?.focus();
            return;
          }
          finishGuess(matchesTopicAnswer(state.citizenWord, guess));
        });
        container.querySelector("#btn-skip-wolf-guess")?.addEventListener("click", () => finishGuess(false));
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
          <div class="roulette-title">画面に指を置く / PCは2か所以上クリック</div>
          <div class="roulette-desc">スマホは全員の指を同時に置き、PCはクリックした位置を仮想の指として抽選します。</div>
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
    const colors = ["#E54B36", "#2F855A", "#2B6CB0", "#D69E2E", "#7C5CBF", "#C84B8C", "#2C7A7B", "#DD6B20"];
    const points = new Map();
    let pickCount = 1;
    let phase = "waiting";
    let countdownTimer = null;
    let countdownStart = 0;
    const COUNTDOWN_MS = 2200;
    let lastCount = 0;
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
      countdownStart = 0;
      lastCount = 0;
      points.clear();
      winners = [];
      phase = "waiting";
      overlay.classList.remove("hidden");
    };

    const decide = () => {
      if (points.size < 2) return reset();
      phase = "decided";
      countdownTimer = null;
      const ids = [...points.keys()];
      winners = [];
      while (winners.length < Math.min(pickCount, ids.length)) {
        const id = ids[Math.floor(Math.random() * ids.length)];
        if (!winners.includes(id)) winners.push(id);
      }
      celebrate(48);
    };

    const maybeStart = (forceReset = false) => {
      if (points.size < 2) {
        if (countdownTimer) clearTimeout(countdownTimer);
        countdownTimer = null;
        countdownStart = 0;
        lastCount = points.size;
        phase = "waiting";
        overlay.classList.remove("hidden");
        return;
      }
      overlay.classList.add("hidden");
      // 3人目以降が指を置いた（人数が変わった）ときはカウントダウンをリセットして全員が揃うのを待つ
      if (phase === "waiting" || forceReset || points.size !== lastCount) {
        if (countdownTimer) clearTimeout(countdownTimer);
        phase = "counting";
        lastCount = points.size;
        countdownStart = Date.now();
        play("playTick", 600 + Math.min(points.size, 8) * 55);
        countdownTimer = setTimeout(decide, COUNTDOWN_MS);
      }
    };

    const drawStar = (x, y, spikes, outerR, innerR) => {
      let rot = (Math.PI / 2) * 3;
      const step = Math.PI / spikes;
      ctx.beginPath();
      ctx.moveTo(x, y - outerR);
      for (let i = 0; i < spikes; i++) {
        ctx.lineTo(x + Math.cos(rot) * outerR, y + Math.sin(rot) * outerR);
        rot += step;
        ctx.lineTo(x + Math.cos(rot) * innerR, y + Math.sin(rot) * innerR);
        rot += step;
      }
      ctx.closePath();
      ctx.fill();
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const now = Date.now();
      const progress = phase === "counting" && countdownStart > 0
        ? Math.min(1, (now - countdownStart) / COUNTDOWN_MS)
        : 0;
      let idx = 0;
      points.forEach((point, id) => {
        idx += 1;
        const winner = winners.includes(id);
        const dimmed = phase === "decided" && !winner;
        const radius = winner ? 68 : 48;
        ctx.save();
        if (dimmed) ctx.globalAlpha = 0.28;

        // 外側の波紋リング
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius + 10 + 6 * Math.sin(now / 180 + idx), 0, Math.PI * 2);
        ctx.strokeStyle = winner ? "rgba(230, 184, 76, 0.55)" : `${point.color}55`;
        ctx.lineWidth = winner ? 5 : 4;
        ctx.stroke();

        // カウントダウン進捗アーク（全員が置いたあと決定までの目安）
        if (phase === "counting" && progress > 0) {
          ctx.beginPath();
          ctx.arc(point.x, point.y, radius + 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
          ctx.lineWidth = 4;
          ctx.stroke();
        }

        // メインサークル
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = winner ? "#E6B84C" : point.color;
        ctx.fill();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 3.5;
        ctx.stroke();

        // 中央の図形（絵文字を使わず端正なベクター描画）
        ctx.fillStyle = "#FFFFFF";
        if (winner) {
          drawStar(point.x, point.y - 6, 5, 18, 8);
          ctx.font = "700 13px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("決定", point.x, point.y + 22);
        } else {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 12, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(255,255,255,0.85)";
          ctx.lineWidth = 2.5;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(point.x, point.y, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // 上部に現在の参加人数・抽選ステータスを控えめに表示
      if (points.size > 0) {
        const remainSec = Math.max(0, Math.ceil((COUNTDOWN_MS - (now - countdownStart)) / 1000));
        const label = phase === "decided"
          ? `${points.size}人から ${winners.length}人 を決定`
          : phase === "counting"
            ? `${points.size}人が待機中 · あと ${remainSec}秒（追加で指を置くと延長）`
            : `${points.size}人配置中 · もう1人置くと抽選開始`;
        ctx.save();
        ctx.font = "700 13px sans-serif";
        const tw = ctx.measureText(label).width;
        const bw = tw + 28;
        const bx = (canvas.width - bw) / 2;
        ctx.fillStyle = "rgba(18, 22, 28, 0.72)";
        ctx.beginPath();
        ctx.roundRect(bx, 14, bw, 32, 8);
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, canvas.width / 2, 30);
        ctx.restore();
      }
      rafId = requestAnimationFrame(draw);
    };

    const syncTouches = (event) => {
      event.preventDefault();
      if (phase === "decided" && event.touches.length === 0) {
        reset();
        return;
      }
      const prevTouchCount = [...points.keys()].filter((id) => String(id).startsWith("t-")).length;
      [...points.keys()].filter((id) => String(id).startsWith("t-")).forEach((id) => points.delete(id));
      const rect = canvas.getBoundingClientRect();
      [...event.touches].forEach((touch, index) => {
        points.set(`t-${touch.identifier}`, {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
          color: colors[index % colors.length]
        });
      });
      if (phase !== "decided") maybeStart(event.touches.length !== prevTouchCount);
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
      maybeStart(true);
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
    const state = {
      scoreP1: 0,
      scoreP2: 0,
      phase: "ready",
      matchWinner: null,
      message: "",
      reactionMs: null,
      bestMs: null,
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
      cleanup();
      state.phase = "waiting";
      state.message = "待て…";
      state.reactionMs = null;
      render();
      state.cueTimer = setTimeout(() => {
        state.phase = "go";
        state.startAt = performance.now();
        state.message = "今だ！(GO!)";
        play("playCountBeep", true);
        play("hapticWarning");
        render();
      }, 1400 + Math.random() * 2600);
    };

    const afterPoint = (winner, message) => {
      if (winner === 1) state.scoreP1 += 1;
      if (winner === 2) state.scoreP2 += 1;
      state.message = message;
      if (state.scoreP1 >= 3 || state.scoreP2 >= 3) {
        state.matchWinner = state.scoreP1 >= 3 ? 1 : 2;
        state.phase = "win";
        celebrate(56);
        render();
        scrollIntoViewSafe(container.querySelector(".duel-container"));
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
        play("hapticWarning");
        afterPoint(player === 1 ? 2 : 1, `PLAYER ${player} フライング！`);
      } else if (state.phase === "go") {
        state.reactionMs = Math.round(performance.now() - state.startAt);
        if (state.bestMs === null || state.reactionMs < state.bestMs) {
          state.bestMs = state.reactionMs;
        }
        play("playCorrect");
        play("hapticSuccess");
        afterPoint(player, `PLAYER ${player}: ${state.reactionMs}ms`);
      }
    };

    function render() {
      const winOverlay = state.phase === "win"
        ? `<div class="duel-overlay">
            <div class="tool-card duel-result-card text-center">
              ${typeof GameResult !== "undefined"
                ? GameResult.renderResultCard({
                  tone: "win",
                  eyebrow: "勝負決着",
                  title: `PLAYER ${state.matchWinner} の勝利`,
                  subtitle: state.message,
                  compact: true,
                  metrics: [
                    { label: "最終スコア", value: `${state.scoreP1} - ${state.scoreP2}` },
                    ...(state.bestMs !== null ? [{ label: "最速反応", value: `${state.bestMs}ms` }] : [])
                  ]
                })
                : `<h3>PLAYER ${state.matchWinner} の勝利</h3>`}
              <button class="btn btn-primary btn-block mt-3" id="btn-duel-restart">もう一度対決する</button>
            </div>
          </div>`
        : "";

      container.innerHTML = `
        <div class="duel-container ${state.phase}">
          <div class="duel-half duel-top" id="duel-p1-area"><div class="duel-content rotate-180"><div class="duel-score">スコア: ${state.scoreP1} / 3</div><div class="duel-player-label">PLAYER 1</div><div class="duel-status-text ${state.phase === "go" ? "go" : ""}">${state.phase === "ready" ? "準備" : state.message}</div></div></div>
          <div class="duel-divider">
            ${state.phase === "ready" ? '<div class="duel-ready-cta"><button class="btn btn-primary duel-start-cta" id="btn-duel-start">勝負スタート</button><p class="duel-ready-rule">画面が緑になったらタップ · 3本先取</p></div>' : ""}
            ${!["ready", "win"].includes(state.phase) ? `<div class="duel-center-text">${state.reactionMs == null ? esc(state.message) : `${state.reactionMs}ms`}</div>` : ""}
          </div>
          <div class="duel-half duel-bottom" id="duel-p2-area"><div class="duel-content"><div class="duel-player-label">PLAYER 2</div><div class="duel-score">スコア: ${state.scoreP2} / 3</div><div class="duel-status-text ${state.phase === "go" ? "go" : ""}">${state.phase === "ready" ? "準備" : state.message}</div></div></div>
          ${winOverlay}
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
        state.bestMs = null;
        render();
      });
      if (["waiting", "go"].includes(state.phase)) {
        container.querySelector("#duel-p1-area").addEventListener("pointerdown", (event) => { event.preventDefault(); handleTap(1); }, { passive: false });
        container.querySelector("#duel-p2-area").addEventListener("pointerdown", (event) => { event.preventDefault(); handleTap(2); }, { passive: false });
      }
    }

    render();
    return cleanup;
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
      const verdict = typeof GameResult !== "undefined"
        ? GameResult.judgeDuelMash(state.p1Taps, state.p2Taps, 100 - state.gauge)
        : { shouldCelebrate: state.gauge !== 50 };
      if (verdict.shouldCelebrate) celebrate(56);
      else play("playTimeUp");
      render();
      scrollIntoViewSafe(container.querySelector(".duel-container"));
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
      // state.gauge decreases toward 0 when P1 pushes, increases toward 100 when P2 pushes.
      // Pass p1Progress = 100 - state.gauge into judgeDuelMash (100 = P1 KO, 0 = P2 KO).
      const verdict = typeof GameResult !== "undefined"
        ? GameResult.judgeDuelMash(state.p1Taps, state.p2Taps, 100 - state.gauge)
        : {
          tone: state.gauge === 50 ? "neutral" : "win",
          headline: state.gauge < 50 ? "PLAYER 1 の勝利" : state.gauge > 50 ? "PLAYER 2 の勝利" : "引き分け",
          subtitle: `P1 ${state.p1Taps}回 対 P2 ${state.p2Taps}回`
        };

      const resultOverlay = state.phase === "result"
        ? `<div class="duel-overlay">
            <div class="tool-card duel-result-card text-center">
              ${typeof GameResult !== "undefined"
                ? GameResult.renderResultCard({
                  tone: verdict.tone,
                  eyebrow: verdict.isKo ? "完全決着" : "タイムアップ",
                  title: verdict.headline,
                  subtitle: verdict.subtitle,
                  compact: true,
                  metrics: [
                    { label: "PLAYER 1", value: `${state.p1Taps}回` },
                    { label: "PLAYER 2", value: `${state.p2Taps}回` }
                  ]
                })
                : `<h2>${esc(verdict.headline)}</h2><p class="my-2">P1: ${state.p1Taps}回 vs P2: ${state.p2Taps}回</p>`}
              <button class="btn btn-primary btn-block mt-3" id="btn-mash-retry">もう一度対決する</button>
            </div>
          </div>`
        : "";

      container.innerHTML = `
        <div class="duel-container mash-battle ${state.phase}">
          <div class="duel-half duel-top" id="mash-p1-btn"><div class="duel-content rotate-180"><div class="duel-player-label">PLAYER 1</div><div class="mash-count">連打数: ${state.p1Taps}</div><div class="mash-tap-hint">ここを全力連打</div></div></div>
          <div class="mash-gauge-track"><div class="mash-gauge-p1" style="height:${100 - state.gauge}%"></div><div class="mash-gauge-center-line"><span class="badge badge-warning font-mono">${state.timeLeft}s</span></div><div class="mash-gauge-p2" style="height:${state.gauge}%"></div></div>
          <div class="duel-half duel-bottom" id="mash-p2-btn"><div class="duel-content"><div class="duel-player-label">PLAYER 2</div><div class="mash-count">連打数: ${state.p2Taps}</div><div class="mash-tap-hint">ここを全力連打</div></div></div>
          ${state.phase === "ready" ? '<div class="duel-overlay"><div class="tool-card duel-result-card text-center"><h3 class="tool-title">連打パワーバトル</h3><p class="text-sm text-sub my-2">15秒間、1台の画面を上下から連打して相手の陣地を押し切ります。</p><button class="btn btn-primary btn-lg btn-block mt-2" id="btn-mash-start">バトルスタート</button></div></div>' : ""}
          ${resultOverlay}
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
        state.timerId = setInterval(() => {
          state.timeLeft -= 1;
          const badge = container.querySelector(".mash-gauge-center-line span");
          if (badge) badge.textContent = `${state.timeLeft}s`;
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
    if (typeof GameTools.renderRhythmBox === "function") {
      return GameTools.renderRhythmBox(container, Object.assign({}, game, { subTab: "yamanote" }));
    }
    return () => {};
  };

  GameTools.renderGesture = function renderGestureFixed(container, game) {
    const state = { score: 0, passed: 0, timeLeft: 60, phase: "ready", timerId: null, currentTopic: "" };

    const getTopic = () => {
      const source = typeof getActiveTopicsForGame === "function"
        ? getActiveTopicsForGame(game.id, game.presets)
        : (Array.isArray(game.presets) ? game.presets : []);
      if (!source.length) return "ゴリラがバナナを食べているところ";
      const item = typeof window !== "undefined" && window.DeckManager && typeof window.DeckManager.getNext === "function"
        ? window.DeckManager.getNext(`gesture-fixed_${game.id || "gesture"}`, source)
        : source[Math.floor(Math.random() * source.length)];
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
      cleanup();
      state.phase = "result";
      if (state.score > 0) celebrate(54);
      else play("playTimeUp");
      render();
      scrollIntoViewSafe(container.querySelector(".tool-card"));
    };

    function render() {
      const resultHtml = state.phase === "result"
        ? `<div class="won-box my-3">
            ${typeof GameResult !== "undefined"
              ? GameResult.renderResultCard({
                tone: state.score > 0 ? "win" : "neutral",
                eyebrow: "タイムアップ",
                title: `${state.score} 問正解`,
                subtitle: state.score >= 5 ? "息ぴったりの好記録です。" : state.score > 0 ? "ナイスジェスチャーでした。" : "次はテンポよくパスも使ってみましょう。",
                compact: true,
                metrics: [
                  { label: "正解数", value: `${state.score}問` },
                  { label: "パス回数", value: `${state.passed}回` }
                ]
              })
              : `<h2 class="text-success">終了！ ${state.score} 問正解</h2>`}
            <button class="btn btn-primary btn-block mt-3" id="btn-gesture-retry">もう一度遊ぶ</button>
          </div>`
        : "";

      container.innerHTML = `
        <div class="tool-card text-center">
          <h3 class="tool-title">サイレント・ジェスチャー</h3>
          <div class="gesture-score-badge my-2">正解数: <strong class="badge-num font-mono">${state.score}</strong> 問</div>
          ${state.phase === "playing" ? `<div class="topic-box my-4"><span class="topic-tag">演じる人だけが見るお題</span><div class="topic-text font-black text-xl">${esc(state.currentTopic)}</div></div>` : ""}
          ${state.phase === "ready" ? '<p class="text-sm text-sub my-3">演じる人にスマホを渡してください。回答する人に画面が見えないようにしてスタートします。</p>' : ""}
          ${state.phase !== "result" ? `<div class="timer-display font-mono text-2xl ${state.timeLeft <= 10 ? "text-danger animate-pulse" : "text-primary"}">残り ${state.timeLeft} 秒</div>` : ""}
          ${state.phase === "ready" ? '<button class="btn btn-primary btn-lg btn-block mt-3" id="btn-gesture-start">スタート (60秒)</button>' : ""}
          ${state.phase === "playing" ? '<div class="flex gap-2 justify-center my-3"><button class="btn btn-success btn-lg flex-1" id="btn-gesture-correct">正解・次へ</button><button class="btn btn-outline btn-lg" id="btn-gesture-pass">パス</button></div>' : ""}
          ${resultHtml}
        </div>`;

      const start = container.querySelector("#btn-gesture-start");
      if (start) start.addEventListener("click", () => {
        cleanup();
        state.score = 0;
        state.passed = 0;
        state.timeLeft = 60;
        state.phase = "playing";
        state.currentTopic = getTopic();
        play("playSelect");
        render();
        state.timerId = setInterval(() => {
          state.timeLeft -= 1;
          const timer = container.querySelector(".timer-display");
          if (timer) {
            timer.textContent = `残り ${state.timeLeft} 秒`;
            if (state.timeLeft <= 10) timer.classList.add("text-danger", "animate-pulse");
          }
          if (state.timeLeft <= 0) finish();
        }, 1000);
      });
      const correct = container.querySelector("#btn-gesture-correct");
      if (correct) correct.addEventListener("click", () => { state.score += 1; play("playCorrect"); nextTopic(); });
      const pass = container.querySelector("#btn-gesture-pass");
      if (pass) pass.addEventListener("click", () => { state.passed += 1; play("playClick"); nextTopic(); });
      const retry = container.querySelector("#btn-gesture-retry");
      if (retry) retry.addEventListener("click", () => { state.phase = "ready"; state.score = 0; state.passed = 0; state.timeLeft = 60; render(); });
    }

    render();
    return cleanup;
  };
})();
