/**
 * あそびポケット (Asobi Pocket)
 * ゲーム終了演出・勝敗判定の共通ヘルパー（純粋ロジック＋洗練された結果カード生成）
 */
(function (root) {
  "use strict";

  const esc = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  /**
   * 10秒ぴったりゲームの判定（表示値と同じ小数第2位で丸めて整合させる）
   */
  function judgeTenSeconds(elapsedSec, targetSec = 10) {
    const safeTarget = Number.isFinite(Number(targetSec)) ? Number(targetSec) : 10;
    const roundedSec = Math.round(Number(elapsedSec || 0) * 100) / 100;
    const rawDiff = Math.round((roundedSec - safeTarget) * 100) / 100;
    const absDiff = Math.abs(rawDiff);
    const displaySec = roundedSec.toFixed(2);
    const signedDiff = `${rawDiff >= 0 ? "+" : "-"}${absDiff.toFixed(2)}秒`;

    if (absDiff < 0.005) {
      return {
        displaySec,
        diffSec: 0,
        signedDiff: "±0.00秒",
        tier: "just",
        tone: "win",
        eyebrow: "記録達成",
        verdict: "ぴったり達成",
        detail: "誤差0.00秒。完璧な体内時計です。",
        celebrate: true
      };
    }
    if (absDiff <= 0.15) {
      return {
        displaySec,
        diffSec: absDiff,
        signedDiff,
        tier: "pro",
        tone: "win",
        eyebrow: "好記録",
        verdict: "ほぼぴったり",
        detail: `誤差 ${signedDiff}。お見事な感覚です。`,
        celebrate: true
      };
    }
    if (absDiff <= 0.5) {
      return {
        displaySec,
        diffSec: absDiff,
        signedDiff,
        tier: "close",
        tone: "neutral",
        eyebrow: "惜しい",
        verdict: "あと少し",
        detail: `目標との差は ${signedDiff} でした。`,
        celebrate: false
      };
    }
    return {
      displaySec,
      diffSec: absDiff,
      signedDiff,
      tier: "miss",
      tone: "lose",
      eyebrow: "計測結果",
      verdict: rawDiff < 0 ? "すこし早め" : "すこし遅め",
      detail: `目標との差は ${signedDiff} でした。`,
      celebrate: false
    };
  }

  /**
   * ito の並び順（昇順）判定
   */
  function judgeItoOrder(cards) {
    const list = Array.isArray(cards) ? cards : [];
    const errorIndexes = [];
    for (let i = 1; i < list.length; i++) {
      if (Number(list[i].val) < Number(list[i - 1].val)) {
        errorIndexes.push(i);
      }
    }
    const isPerfect = list.length > 0 && errorIndexes.length === 0;
    return {
      isPerfect,
      errorIndexes,
      correctCount: Math.max(0, list.length - errorIndexes.length),
      total: list.length
    };
  }

  /**
   * ワードウルフの結果判定
   */
  function judgeWordWolfOutcome({ votedRole, guessCorrect = null }) {
    if (votedRole === "wolf") {
      if (guessCorrect === true) {
        return {
          tone: "wolf",
          eyebrow: "逆転決着",
          title: "ウルフ側の逆転勝利",
          subtitle: "多数派のお題を見事に言い当てました。",
          shouldCelebrate: true
        };
      }
      if (guessCorrect === false) {
        return {
          tone: "win",
          eyebrow: "ゲーム終了",
          title: "市民チームの勝利",
          subtitle: "ウルフを見破り、逆転も防ぎました。",
          shouldCelebrate: true
        };
      }
      return {
        tone: "pending",
        eyebrow: "ウルフを発見",
        title: "ウルフの逆転チャンス",
        subtitle: "市民側のお題を当てられたらウルフの逆転勝利になります。",
        shouldCelebrate: false
      };
    }

    return {
      tone: "wolf",
      eyebrow: "ゲーム終了",
      title: "ウルフ側の勝利",
      subtitle: "ウルフが最後まで紛れきりました。",
      shouldCelebrate: true
    };
  }

  /**
   * ワンナイト人狼の結果判定
   */
  function judgeOneNightOutcome({ hasWerewolf, peaceVote, caughtWerewolf }) {
    if (peaceVote) {
      if (!hasWerewolf) {
        return {
          tone: "win",
          eyebrow: "平和村",
          verdict: "全員の勝利（平和村）",
          detail: "村の中に人狼はいなかったため、処刑なしで全員の勝利です。",
          shouldCelebrate: true
        };
      }
      return {
        tone: "wolf",
        eyebrow: "ゲーム終了",
        verdict: "人狼チームの勝利",
        detail: "処刑なしのまま人狼が生き残りました。",
        shouldCelebrate: true
      };
    }

    if (caughtWerewolf) {
      return {
        tone: "win",
        eyebrow: "ゲーム終了",
        verdict: "村人チームの勝利",
        detail: "見事に人狼を処刑しました。",
        shouldCelebrate: true
      };
    }

    if (hasWerewolf) {
      return {
        tone: "wolf",
        eyebrow: "ゲーム終了",
        verdict: "人狼チームの勝利",
        detail: "人狼は逃げ切りに成功しました。",
        shouldCelebrate: true
      };
    }

    return {
      tone: "lose",
      eyebrow: "ゲーム終了",
      verdict: "全員敗北（引き分け）",
      detail: "人狼がいない村で処刑が発生したため、全員敗北となりました。",
      shouldCelebrate: false
    };
  }

  /**
   * 連打バトルの勝敗判定
   */
  function judgeDuelMash(p1Taps, p2Taps, gauge = 50) {
    const p1 = Number(p1Taps || 0);
    const p2 = Number(p2Taps || 0);
    const g = Number(gauge ?? 50);

    if (g >= 100) {
      return {
        winner: 1,
        isKo: true,
        tone: "win",
        headline: "PLAYER 1 の勝利",
        subtitle: "ゲージを押し切って完全決着！",
        shouldCelebrate: true
      };
    }
    if (g <= 0) {
      return {
        winner: 2,
        isKo: true,
        tone: "win",
        headline: "PLAYER 2 の勝利",
        subtitle: "ゲージを押し切って完全決着！",
        shouldCelebrate: true
      };
    }
    if (p1 > p2) {
      return {
        winner: 1,
        isKo: false,
        tone: "win",
        headline: "PLAYER 1 の勝利",
        subtitle: `${p1}回 対 ${p2}回でタイムアップ決着`,
        shouldCelebrate: true
      };
    }
    if (p2 > p1) {
      return {
        winner: 2,
        isKo: false,
        tone: "win",
        headline: "PLAYER 2 の勝利",
        subtitle: `${p2}回 対 ${p1}回でタイムアップ決着`,
        shouldCelebrate: true
      };
    }
    return {
      winner: 0,
      isKo: false,
      tone: "neutral",
      headline: "引き分け",
      subtitle: `両者 ${p1}回 の互角勝負でした`,
      shouldCelebrate: false
    };
  }

  /**
   * 絵文字に頼らない、端正なSVGエンブレム
   */
  function renderCrestSvg(tone) {
    if (tone === "win" || tone === "wolf") {
      return `<svg class="result-crest-svg" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.45"/>
        <circle cx="24" cy="24" r="14.5" stroke="currentColor" stroke-width="1.8"/>
        <path d="M24 14.5l2.5 5.4 5.9.8-4.3 4.1 1 5.9L24 27.9l-5.1 2.8 1-5.9-4.3-4.1 5.9-.8L24 14.5z" fill="currentColor" opacity="0.16" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
      </svg>`;
    }
    if (tone === "lose" || tone === "danger") {
      return `<svg class="result-crest-svg" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <circle cx="24" cy="24" r="18" stroke="currentColor" stroke-width="1.7" opacity="0.55"/>
        <path d="M17.5 17.5l13 13M30.5 17.5l-13 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`;
    }
    return `<svg class="result-crest-svg" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="18" stroke="currentColor" stroke-width="1.6" opacity="0.45"/>
      <path d="M16 24.5l5.2 5.2L32.5 18.5" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  /**
   * 統一された結果カードHTMLを生成
   */
  function renderResultCard(options = {}) {
    const tone = options.tone || "win";
    const eyebrow = options.eyebrow || "";
    const title = options.title || "";
    const subtitle = options.subtitle || "";
    const metrics = Array.isArray(options.metrics) ? options.metrics : [];
    const detailsHtml = options.detailsHtml || options.bodyHtml || "";
    const actionsHtml = options.actionsHtml || "";
    const note = options.note || "";
    const idAttr = options.id ? ` id="${esc(options.id)}"` : "";
    const titleIdAttr = options.titleId ? ` id="${esc(options.titleId)}"` : "";
    const compactClass = options.compact ? " result-stage-compact" : "";
    const extraClass = options.className ? ` ${esc(options.className)}` : "";

    const metricsHtml = metrics.length > 0
      ? `<div class="result-metrics" style="--metric-cols:${Math.min(3, metrics.length)}">
          ${metrics.map((m) => `
            <div class="result-metric-cell">
              <span class="result-metric-label">${esc(m.label)}</span>
              <strong class="result-metric-value">${esc(m.value)}</strong>
            </div>
          `).join("")}
        </div>`
      : "";

    return `
      <div class="result-stage result-tone-${esc(tone)}${compactClass}${extraClass}"${idAttr}>
        <div class="result-stage-head">
          <div class="result-crest" aria-hidden="true">${renderCrestSvg(tone)}</div>
          <div class="result-stage-copy">
            ${eyebrow ? `<span class="result-eyebrow">${esc(eyebrow)}</span>` : ""}
            <h4 class="result-headline"${titleIdAttr}>${esc(title)}</h4>
            ${subtitle ? `<p class="result-subline">${esc(subtitle)}</p>` : ""}
          </div>
        </div>
        ${metricsHtml}
        ${detailsHtml ? `<div class="result-details">${detailsHtml}</div>` : ""}
        ${note ? `<p class="result-note">${esc(note)}</p>` : ""}
        ${actionsHtml ? `<div class="result-actions">${actionsHtml}</div>` : ""}
      </div>
    `;
  }

  /**
   * 終了時に結果・盤面が画面上端で見切れないよう控えめにスクロール
   */
  function scrollResultIntoView(element) {
    if (!element || typeof element.getBoundingClientRect !== "function") return;
    try {
      const rect = element.getBoundingClientRect();
      const headerOffset = 76;
      const vh = window.innerHeight || 800;
      if (rect.top < headerOffset || rect.bottom > vh - 16) {
        const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        element.scrollIntoView({
          behavior: reduced ? "auto" : "smooth",
          block: "center"
        });
      }
    } catch {}
  }

  /**
   * 対面インディアンポーカー用：1組52枚から重複しない2枚を配る
   */
  function dealIndianPokerPair(rng = Math.random) {
    const suits = ["♠", "♥", "♦", "♣"];
    const deck = [];
    for (let s = 0; s < suits.length; s++) {
      for (let rank = 1; rank <= 13; rank++) {
        deck.push({ card: rank, suit: suits[s] });
      }
    }
    const pickIndex = (len) => {
      const r = typeof rng === "function" ? Number(rng()) : Math.random();
      const clamped = Number.isFinite(r) ? Math.min(0.999999, Math.max(0, r)) : 0;
      return Math.floor(clamped * len);
    };
    const firstIdx = pickIndex(deck.length);
    const first = deck.splice(firstIdx, 1)[0];
    const secondIdx = pickIndex(deck.length);
    const second = deck[secondIdx];
    return {
      p1Card: first.card,
      p1Suit: first.suit,
      p2Card: second.card,
      p2Suit: second.suit
    };
  }

  const SMALL_TO_LARGE_KANA = {
    "ぁ": "あ", "ぃ": "い", "ぅ": "う", "ぇ": "え", "ぉ": "お",
    "ゃ": "や", "ゅ": "ゆ", "ょ": "よ", "っ": "つ", "ゎ": "わ"
  };

  function defaultToHiragana(str) {
    return String(str || "")
      .trim()
      .replace(/[\u30a1-\u30f6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
  }

  function extractLastKana(normalized) {
    const cleaned = String(normalized || "").replace(/[ー〜～・\s、。！？!?]+$/g, "");
    if (!cleaned) return "";
    const last = cleaned[cleaned.length - 1];
    return SMALL_TO_LARGE_KANA[last] || last;
  }

  function extractFirstKana(normalized) {
    const cleaned = String(normalized || "").replace(/^[\s・]+/g, "");
    if (!cleaned) return "";
    const first = cleaned[0];
    return SMALL_TO_LARGE_KANA[first] || first;
  }

  /**
   * 縛りしりとりの入力語バリデーション（重複・「ん」終了・頭文字不一致）
   */
  function validateWordChainEntry(word, existingWords = [], toHiraganaFn = defaultToHiragana) {
    const trimmed = String(word || "").trim();
    if (!trimmed) return { ok: false, reason: "empty", message: "言葉を入力してください" };
    const norm = (v) => (typeof toHiraganaFn === "function" ? toHiraganaFn(v) : defaultToHiragana(v));
    const currentNorm = norm(trimmed);
    const list = Array.isArray(existingWords) ? existingWords : [];

    if (list.some((used) => norm(used) === currentNorm)) {
      return { ok: false, reason: "duplicate", message: "もう使った言葉です（重複アウト）" };
    }

    if (list.length > 0) {
      const prevNorm = norm(list[list.length - 1]);
      const expected = extractLastKana(prevNorm);
      const actual = extractFirstKana(currentNorm);
      const isKana = (ch) => /^[\u3041-\u3096]$/.test(ch);
      if (isKana(expected) && isKana(actual) && expected !== actual) {
        return {
          ok: false,
          reason: "mismatch",
          expected,
          actual,
          message: `前の言葉の最後「${expected}」から始まる言葉を入れてください`
        };
      }
    }

    const lastChar = extractLastKana(currentNorm);
    if (lastChar === "ん") {
      return { ok: false, reason: "ends_with_n", message: "「ん」で終わる言葉です（アウト）" };
    }

    return { ok: true, reason: "ok", nextKana: lastChar };
  }

  /**
   * リズムボックス用：山手線お題（カテゴリ系）とマジカルバナナお題（単語系）を明確に分離
   */
  function splitRhythmBoxTopics(rhythmPresets = [], gamesList = []) {
    const list = Array.isArray(gamesList) ? gamesList : [];
    const yamanoteGame = list.find((g) => g && g.id === "yamanote-game");
    const bananaGame = list.find((g) => g && g.id === "magical-banana");

    const yamanote = (yamanoteGame && Array.isArray(yamanoteGame.presets) && yamanoteGame.presets.length > 0)
      ? yamanoteGame.presets
      : (Array.isArray(rhythmPresets) ? rhythmPresets.slice(0, 30) : []);

    const banana = (bananaGame && Array.isArray(bananaGame.presets) && bananaGame.presets.length > 0)
      ? bananaGame.presets
      : (Array.isArray(rhythmPresets) && rhythmPresets.length > 30 ? rhythmPresets.slice(30) : []);

    return { yamanote, banana };
  }

  /**
   * クリップボードコピー（iframe環境でもフォールバック動作）
   */
  async function copyText(text) {
    const value = String(text || "");
    if (!value) return false;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch {}
    try {
      if (typeof document !== "undefined") {
        const area = document.createElement("textarea");
        area.value = value;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.top = "-9999px";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(area);
        return Boolean(ok);
      }
    } catch {}
    return false;
  }

  /**
   * アプリ内確認ダイアログ（window.confirm代替）
   */
  function confirmAction(options = {}) {
    if (typeof document === "undefined") {
      return Promise.resolve(true);
    }
    const title = options.title || "確認";
    const message = options.message || "この操作を実行してもよろしいですか？";
    const confirmLabel = options.confirmLabel || "続ける";
    const cancelLabel = options.cancelLabel || "キャンセル";
    const danger = Boolean(options.danger);

    const existing = document.getElementById("asobi-inline-confirm-modal");
    if (existing) existing.remove();

    return new Promise((resolve) => {
      const prevFocus = document.activeElement;
      const backdrop = document.createElement("div");
      backdrop.id = "asobi-inline-confirm-modal";
      backdrop.className = "modal-backdrop asobi-confirm-backdrop";
      backdrop.setAttribute("role", "dialog");
      backdrop.setAttribute("aria-modal", "true");
      backdrop.setAttribute("aria-labelledby", "asobi-confirm-title");
      backdrop.innerHTML = `
        <div class="modal-dialog asobi-confirm-dialog">
          <div class="modal-header">
            <h3 id="asobi-confirm-title" class="modal-title">${esc(title)}</h3>
          </div>
          <div class="modal-body">
            <p class="text-sm" style="margin:0; line-height:1.7;">${esc(message)}</p>
          </div>
          <div class="modal-footer asobi-confirm-actions">
            <button type="button" class="btn btn-outline flex-1" data-confirm-choice="cancel">${esc(cancelLabel)}</button>
            <button type="button" class="btn ${danger ? "btn-danger" : "btn-primary"} flex-1" data-confirm-choice="ok">${esc(confirmLabel)}</button>
          </div>
        </div>
      `;

      let settled = false;
      const close = (result) => {
        if (settled) return;
        settled = true;
        document.removeEventListener("keydown", onKeydown, true);
        backdrop.remove();
        if (prevFocus && typeof prevFocus.focus === "function") {
          try { prevFocus.focus(); } catch {}
        }
        resolve(result);
      };

      const onKeydown = (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          close(false);
        }
      };

      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) close(false);
      });
      backdrop.querySelector('[data-confirm-choice="cancel"]').addEventListener("click", () => close(false));
      backdrop.querySelector('[data-confirm-choice="ok"]').addEventListener("click", () => close(true));
      document.addEventListener("keydown", onKeydown, true);
      document.body.appendChild(backdrop);
      backdrop.querySelector('[data-confirm-choice="ok"]')?.focus();
    });
  }

  const CONCIERGE_PLAYER_META = {
    "2": { key: "2", label: "2人", detail: "対戦・サシ飲み", fullLabel: "2人（対戦・サシ飲み）" },
    "3-4": { key: "3-4", label: "3〜4人", detail: "友達・少人数", fullLabel: "3〜4人（友達・少人数）" },
    "5+": { key: "5+", label: "5人以上", detail: "集まり・大人数", fullLabel: "5人以上（集まり・大人数）" }
  };

  const CONCIERGE_MOOD_META = {
    laugh: { key: "laugh", label: "盛り上がり・笑い", shortLabel: "盛り上がり・笑い" },
    chill: { key: "chill", label: "ゆったり・トーク", shortLabel: "ゆったり・トーク" },
    mind: { key: "mind", label: "心理戦・推理", shortLabel: "心理戦・推理" },
    icebreak: { key: "icebreak", label: "アイスブレイク・初対面", shortLabel: "アイスブレイク・初対面" }
  };

  const CONCIERGE_MOOD_PROFILES = {
    laugh: {
      tagWeights: {
        "大爆笑": 24,
        "大喜利": 22,
        "ジェスチャー": 22,
        "スリル": 18,
        "宴会": 16,
        "リズム": 15,
        "リズムマシン": 15,
        "早押し": 14,
        "連打": 14,
        "アクション": 14,
        "反射神経": 14,
        "体感": 14,
        "創作": 12,
        "チーム対戦": 12,
        "爽快": 10,
        "爆発": 10,
        "飲み会": 8,
        "勝負": 8,
        "パーティー": 16
      },
      categoryWeights: { action: 10, talk: 2, mystery: -4 },
      gameBoosts: {
        "yomibito": 22,
        "silent-gesture": 22,
        "asa-sore": 28,
        "katakana-ban": 24,
        "bomb-timer": 18,
        "rhythm-box": 20,
        "duel-reflex": 20,
        "duel-mash": 20,
        "duel-color": 16,
        "ten-seconds": 16,
        "ping-pong-pang": 10,
        "good-and-bad-news": 14,
        "takenoko-nyokki": 12,
        "word-chain-limit": 12,
        "stand-up-game": 10,
        "sea-turtle": -24,
        "twenty-questions": -20,
        "counting-game-30": -18,
        "high-and-low-guess": -14,
        "talk-gacha": -6
      },
      reasonText: "笑いとテンポで場が一気に盛り上がります"
    },
    chill: {
      tagWeights: {
        "じっくり": 24,
        "トーク": 22,
        "価値観": 20,
        "質問": 18,
        "ドライブ": 16,
        "協力": 14,
        "自己紹介": 14,
        "水平思考": 12,
        "20の扉": 12,
        "語彙力": 8,
        "発想力": 8,
        "まったり": 20
      },
      categoryWeights: { talk: 14, mystery: 4, action: -10 },
      gameBoosts: {
        "talk-gacha": 24,
        "ito": 24,
        "sea-turtle": 22,
        "twenty-questions": 16,
        "two-truths-one-lie": 18,
        "good-and-bad-news": 12,
        "katakana-ban": 10,
        "asa-sore": 10,
        "ng-word": 10,
        "word-chain-limit": 6,
        "high-and-low-guess": 8,
        "duel-mash": -32,
        "duel-reflex": -28,
        "duel-color": -22,
        "bomb-timer": -30,
        "ping-pong-pang": -26,
        "silent-gesture": -24,
        "rhythm-box": -22,
        "stand-up-game": -18,
        "one-night-werewolf": -14,
        "ten-seconds": -8
      },
      reasonText: "落ち着いたペースで会話ややり取りを楽しめます"
    },
    mind: {
      tagWeights: {
        "心理戦": 26,
        "人狼": 24,
        "推理": 24,
        "騙し合い": 22,
        "ブラフ": 22,
        "水平思考": 20,
        "頭脳戦": 20,
        "謎解き": 18,
        "嘘見抜き": 16,
        "空気読み": 16,
        "必勝法": 14,
        "数当て": 14,
        "20の扉": 14
      },
      categoryWeights: { mystery: 16, talk: -4, action: -10 },
      gameBoosts: {
        "word-wolf": 24,
        "one-night-werewolf": 22,
        "ng-word": 20,
        "indian-poker": 24,
        "sea-turtle": 20,
        "counting-game-30": 18,
        "twenty-questions": 14,
        "high-and-low-guess": 12,
        "takenoko-nyokki": 22,
        "two-truths-one-lie": 10,
        "duel-color": 4,
        "duel-mash": -32,
        "duel-reflex": -24,
        "silent-gesture": -26,
        "ping-pong-pang": -24,
        "rhythm-box": -24,
        "bomb-timer": -22,
        "yomibito": -18,
        "talk-gacha": -16
      },
      reasonText: "読み合いや推理の駆け引きを味わえます"
    },
    icebreak: {
      tagWeights: {
        "アイスブレイク": 28,
        "初対面": 28,
        "自己紹介": 26,
        "合コン": 20,
        "協力": 18,
        "手軽": 14,
        "価値観": 14,
        "質問": 14,
        "手ぶら": 10,
        "トーク": 10,
        "声だけ": 8
      },
      categoryWeights: { talk: 10, action: 2, mystery: -4 },
      gameBoosts: {
        "ito": 24,
        "talk-gacha": 24,
        "two-truths-one-lie": 26,
        "asa-sore": 18,
        "katakana-ban": 14,
        "rhythm-box": 10,
        "ten-seconds": 20,
        "ng-word": 10,
        "takenoko-nyokki": 12,
        "word-chain-limit": 10,
        "duel-reflex": 10,
        "duel-color": 10,
        "high-and-low-guess": 8,
        "twenty-questions": 8,
        "one-night-werewolf": -24,
        "word-wolf": -6,
        "duel-mash": -20,
        "silent-gesture": -14,
        "counting-game-30": -16,
        "indian-poker": -12,
        "bomb-timer": -10
      },
      reasonText: "ルールがわかりやすく、初対面でも打ち解けやすい定番です"
    }
  };

  function getConciergeConditionMeta(playersKey, moodKey) {
    const player = CONCIERGE_PLAYER_META[playersKey] || CONCIERGE_PLAYER_META["2"];
    const mood = CONCIERGE_MOOD_META[moodKey] || CONCIERGE_MOOD_META.laugh;
    return { player, mood };
  }

  function matchesConciergePlayers(game, playersKey) {
    const min = Number(game && game.minPlayers);
    const max = Number(game && game.maxPlayers);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return false;
    if (playersKey === "2") return min <= 2 && max >= 2;
    if (playersKey === "3-4") return min <= 4 && max >= 3;
    if (playersKey === "5+") return max >= 5;
    return true;
  }

  function scoreConciergePlayerFit(game, playersKey) {
    const min = Number(game.minPlayers || 2);
    const max = Number(game.maxPlayers || 10);
    const tags = Array.isArray(game.tags) ? game.tags : [];
    const id = String(game.id || "");

    if (playersKey === "2") {
      if (game.isDuo || max === 2 || tags.includes("2人専用") || tags.includes("2人対戦")) {
        return { score: 32, reason: "2人対戦向けに設計された一作" };
      }
      if (["ng-word", "sea-turtle", "ito", "talk-gacha", "ten-seconds", "counting-game-30", "twenty-questions", "high-and-low-guess"].includes(id)) {
        return { score: 24, reason: "2人でもテンポよく遊べる構成" };
      }
      if (max >= 12) {
        return { score: 10, reason: "2人から遊べる定番" };
      }
      return { score: 17, reason: "2人で手軽に始められる構成" };
    }

    if (playersKey === "3-4") {
      if (min >= 3 && max <= 10) {
        return { score: 28, reason: "3〜4人で最も盛り上がる人数設計" };
      }
      if (min <= 3 && max >= 4) {
        return { score: 22, reason: "3〜4人の少人数グループに好相性" };
      }
      return { score: 15, reason: "少人数でそのまま遊べる構成" };
    }

    if (playersKey === "5+") {
      if (id === "counting-game-30") {
        return { score: 2, reason: "少人数〜中人数向けの頭脳戦" };
      }
      if (max >= 12 || tags.includes("大人数") || tags.includes("チーム対戦")) {
        return { score: 30, reason: "5人以上の大人数でも一体感が出る設計" };
      }
      if (max >= 8) {
        return { score: 23, reason: "5人以上の集まりにちょうどよい規模" };
      }
      return { score: 14, reason: "5〜7人規模の集まりに対応" };
    }

    return { score: 15, reason: "人数に合わせて遊びやすい構成" };
  }

  function scoreConciergeMoodFit(game, moodKey) {
    const profile = CONCIERGE_MOOD_PROFILES[moodKey] || CONCIERGE_MOOD_PROFILES.laugh;
    const tags = Array.isArray(game.tags) ? game.tags : [];
    const cat = String(game.category || "").toLowerCase();
    const id = String(game.id || "");

    let tagScore = 0;
    const matchedTags = [];
    for (const tag of tags) {
      const w = profile.tagWeights[tag];
      if (typeof w === "number") {
        tagScore += w;
        if (w > 0) matchedTags.push(tag);
      }
    }
    // Cap raw tag stacking so games with many tags don't unfairly drown out focused classics
    tagScore = Math.min(tagScore, 42);

    const catScore = typeof profile.categoryWeights[cat] === "number" ? profile.categoryWeights[cat] : 0;
    const boost = typeof profile.gameBoosts[id] === "number" ? profile.gameBoosts[id] : 0;

    return {
      score: tagScore + catScore + boost,
      matchedTags,
      reason: profile.reasonText
    };
  }

  function rankConciergeGames(games, options = {}) {
    const list = Array.isArray(games) ? games : [];
    const playersKey = CONCIERGE_PLAYER_META[options.players] ? options.players : "2";
    const moodKey = CONCIERGE_MOOD_META[options.mood] ? options.mood : "laugh";
    const conditionMeta = getConciergeConditionMeta(playersKey, moodKey);

    const eligible = list.filter((game) => {
      if (!game || !game.id) return false;
      if (game.section === "merged" || game.section === "U") return false;
      return matchesConciergePlayers(game, playersKey);
    });

    const scored = eligible.map((game) => {
      const playerFit = scoreConciergePlayerFit(game, playersKey);
      const moodFit = scoreConciergeMoodFit(game, moodKey);
      const ratingBonus = Math.max(0, Math.min(6, (Number(game.rating || 4.5) - 4.4) * 10));
      const sectionBonus = game.section === "main" ? 4 : 0;
      const totalScore = Math.round((playerFit.score + moodFit.score + ratingBonus + sectionBonus) * 10) / 10;

      return {
        game,
        score: totalScore,
        playerScore: playerFit.score,
        moodScore: moodFit.score,
        matchedTags: moodFit.matchedTags,
        reason: `${playerFit.reason}。${moodFit.reason}。`,
        conditions: conditionMeta
      };
    });

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.moodScore !== a.moodScore) return b.moodScore - a.moodScore;
      if (b.playerScore !== a.playerScore) return b.playerScore - a.playerScore;
      return String(a.game.id).localeCompare(String(b.game.id));
    });

    // Prefer genuine mood matches; fall back cleanly to top player-compatible games only if < 3 exist.
    const primary = scored.filter((item) => item.moodScore >= 8);
    let results = primary.length >= 3 ? primary : scored.slice(0, Math.max(primary.length, Math.min(5, scored.length)));

    const topScore = results.length > 0 ? results[0].score : 0;
    results = results.map((item, idx) => ({
      ...item,
      rank: idx + 1,
      matchTier: idx === 0 || item.score >= topScore - 8 ? "best" : "good"
    }));

    return results;
  }

  /**
   * プレイ人数の表示文言を整形（例: 2, 99 -> "2人〜" / 2, 2 -> "2人" / 3, 10 -> "3〜10人"）
   */
  function formatPlayersRange(minPlayers, maxPlayers) {
    const min = Number(minPlayers);
    const max = Number(maxPlayers);
    const safeMin = Number.isFinite(min) && min > 0 ? Math.floor(min) : 2;
    if (!Number.isFinite(max) || max >= 99) {
      return `${safeMin}人〜`;
    }
    const safeMax = Math.max(safeMin, Math.floor(max));
    if (safeMin === safeMax) {
      return `${safeMin}人`;
    }
    return `${safeMin}〜${safeMax}人`;
  }

  /**
   * ホーム画面「今日のお題プレビュー」用：実在するプリセットからワクワクする1題を抽出
   */
  function collectSpotlightTopics(games = []) {
    const list = Array.isArray(games) ? games : [];
    const byId = new Map(list.filter(Boolean).map((g) => [g.id, g]));
    const pool = [];

    const addEntries = (gameId, gameLabel, kicker, mapper) => {
      const game = byId.get(gameId);
      if (!game || !Array.isArray(game.presets)) return;
      game.presets.forEach((preset, idx) => {
        const prompt = mapper(preset);
        if (!prompt || prompt.length > 56) return;
        pool.push({
          key: `${gameId}:${idx}`,
          gameId,
          presetIndex: idx,
          gameLabel,
          kicker,
          prompt
        });
      });
    };

    addEntries("ito", "ito（価値観）", "価値観トーク", (p) => {
      const text = typeof p === "string" ? p : (p && p.text);
      return text ? String(text).trim() : "";
    });
    addEntries("asa-sore", "朝までそれ正解", "大喜利トーク", (p) => {
      const text = typeof p === "string" ? p : (p && p.text);
      return text ? String(text).trim() : "";
    });
    addEntries("talk-gacha", "トークガチャ", "会話のきっかけ", (p) => {
      const text = typeof p === "string" ? p : (p && (p.q || p.text));
      return text ? String(text).trim() : "";
    });
    addEntries("katakana-ban", "カタカナ禁止", "言葉あそび", (p) => {
      if (!p || typeof p !== "object" || !p.word) return "";
      return `カタカナを使わずに「${String(p.word).trim()}」を説明してみよう`;
    });
    addEntries("sea-turtle", "ウミガメのスープ", "水平思考クイズ", (p) => {
      if (!p || typeof p !== "object" || !p.title) return "";
      const title = String(p.title).trim();
      const q = String(p.question || "").trim();
      if (!q) return "";
      const shortQ = q.length > 34 ? `${q.slice(0, 33)}…` : q;
      return `『${title}』${shortQ}`;
    });

    return pool;
  }

  function pickSpotlightTopic(games = [], options = {}) {
    const pool = collectSpotlightTopics(games);
    if (pool.length === 0) return null;
    const excludeKey = options.excludeKey || null;
    const candidates = excludeKey && pool.length > 1
      ? pool.filter((item) => item.key !== excludeKey)
      : pool;
    const rng = typeof options.rng === "function" ? options.rng : Math.random;
    const raw = Number(rng());
    const clamped = Number.isFinite(raw) ? Math.min(0.999999, Math.max(0, raw)) : 0;
    return candidates[Math.floor(clamped * candidates.length)];
  }

  const api = {
    judgeTenSeconds,
    judgeItoOrder,
    judgeWordWolfOutcome,
    judgeOneNightOutcome,
    judgeDuelMash,
    dealIndianPokerPair,
    validateWordChainEntry,
    splitRhythmBoxTopics,
    formatPlayersRange,
    collectSpotlightTopics,
    pickSpotlightTopic,
    getConciergeConditionMeta,
    rankConciergeGames,
    copyText,
    confirmAction,
    renderCrestSvg,
    renderResultCard,
    scrollResultIntoView
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.GameResult = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
