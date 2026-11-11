(() => {
  "use strict";

  const normalizeText = (value) => String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  const escapeMarkup = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  const SCENE_LABELS = Object.freeze({
    friends: "友達・ドライブ",
    family: "家族・子ども",
    party: "飲み会・パーティー",
    work: "職場・アイスブレイク"
  });

  const sceneLabel = (scene) => SCENE_LABELS[scene] || "お題";

  const presetText = (item) => {
    if (typeof item === "string") return item;
    if (!item || typeof item !== "object") return String(item ?? "");
    return String(item.text ?? item.q ?? item.word ?? item.title ?? item.question ?? "");
  };

  const splitPair = (value, separator) => {
    const parts = String(value ?? "").split(separator).map((part) => part.trim()).filter(Boolean);
    return parts.length === 2 ? parts : null;
  };

  const KATAKANA_HINTS = Object.freeze({
    "ハンバーガー": "丸い小麦の焼き物で肉や野菜をはさんだ食べ物",
    "エレベーター": "建物の中で人を上下の階へ運ぶ箱",
    "スマートフォン": "電話や情報閲覧ができる携帯端末",
    "チョコレート": "甘くて茶色いことが多いお菓子",
    "スニーカー": "ひもが付いた歩きやすい運動靴",
    "インターネット": "世界中の機器をつなぐ通信網",
    "リモコン": "離れた場所から機械を操作する道具",
    "カラオケ": "伴奏に合わせて歌を楽しむ遊び",
    "ハイボール": "蒸留酒を炭酸水で割った飲み物",
    "タピオカミルクティー": "もちもちした粒が入った甘いお茶",
    "バーベキュー": "屋外で肉や野菜を焼いて食べる料理",
    "プレゼンテーション": "人前で資料を見せながら考えを説明すること"
  });

  const SAFE_BATSU_MISSIONS = Object.freeze([
    ...[
      "ニュースキャスター風に今日の出来事を10秒で話す",
      "ロボット声で「次は勝ちます」と宣言する",
      "時代劇風に「参りました」と言う",
      "実況アナウンサー風に目の前の飲み物を紹介する",
      "小声で早口言葉を1回言う",
      "好きな食べ物をCM風に褒める",
      "今日の天気を大げさに伝える",
      "動物を1種類選び、その鳴き声を1回だけまねる",
      "「ありがとう」を3種類の言い方で言う",
      "架空の必殺技名を1つ発表する"
    ].map((text) => ({ category: "声・言い方", text })),
    ...[
      "透明な重い箱を持ち上げる演技を10秒",
      "映画の予告編っぽい表情を3秒キープ",
      "宇宙飛行士が無重力で動くまねをする",
      "眠気と戦う人を無言で演じる",
      "突然プレゼントをもらった人のリアクション",
      "猫を見つけた人のリアクション",
      "すごく熱い食べ物を食べたふり",
      "宝くじが当たった瞬間を無言で演じる",
      "透明な壁にぶつかったふり",
      "スローモーションで拍手を3回する"
    ].map((text) => ({ category: "演技", text })),
    ...[
      "「あ」から始まる褒め言葉を1つ考える",
      "目の前の物に新しい商品名を付ける",
      "10秒で架空の祝日を1つ作る",
      "コンビニに追加してほしい新サービスを1つ考える",
      "新しいスポーツ名とルールを一言で作る",
      "存在しない映画のタイトルを1つ言う",
      "今いる場所のキャッチコピーを作る",
      "無人島に持っていく意外な物を1つ選び理由を言う",
      "動物2種類を合体させた新生物に名前を付ける",
      "100年後にありそうな道具を1つ考える"
    ].map((text) => ({ category: "言葉・発想", text })),
    ...[
      "次のゲームのお題を決める係になる",
      "次の1ラウンドだけ最初の手番を担当する",
      "3択からみんなに次のゲームを選んでもらう",
      "利き手と逆の手で自分の名前を空中に書く",
      "10秒以内に赤い物を3つ見つける",
      "その場にある丸い物を2つ探す",
      "5秒間だけ目を閉じて10秒を予想する",
      "次のゲームのスタート合図を担当する",
      "全員におすすめのお菓子を1つ教える",
      "「次こそ勝つ」ポーズを1つ決める"
    ].map((text) => ({ category: "ミニチャレンジ", text }))
  ]);

  const normalizePresetContracts = (game) => {
    if (!Array.isArray(game?.presets)) return;

    game.presets.forEach((preset) => {
      if (!preset || typeof preset !== "object" || typeof preset.text !== "string") return;
      const text = preset.text.trim();
      if (!text) return;

      if (game.toolType === "wordwolf") {
        const pair = splitPair(text, /\s+(?:＆|&)\s+/);
        if (pair) {
          preset.citizen = pair[0];
          preset.wolf = pair[1];
          preset.category = sceneLabel(preset.scene);
        }
        return;
      }

      if (game.toolType === "two-choices") {
        const pair = splitPair(text, /\s+(?:VS|ＶＳ)\s+/i);
        if (pair) {
          preset.a = pair[0];
          preset.b = pair[1];
        }
        return;
      }

      if (game.toolType === "katakana-ban") {
        preset.word = text;
        preset.hint = KATAKANA_HINTS[text] || "特徴・用途・見た目を日本語だけで説明";
        return;
      }

      if (!preset.q) preset.q = text;
      if (!preset.category) preset.category = sceneLabel(preset.scene);
    });
  };

  const textOf = (game) => normalizeText([
    game.id,
    game.title,
    game.ruby,
    game.badge,
    game.catchphrase,
    game.category,
    game.overview,
    ...(Array.isArray(game.tags) ? game.tags : [])
  ].filter(Boolean).join(" "));

  const inferGenre = (game) => {
    const corpus = textOf(game);

    if (game.category === "talk") return "talk";
    if (game.category === "mystery") return "mystery";
    if (game.category === "quiz") return "quiz";

    if (/人狼|心理|嘘|ポーカー|ngワード|少数派/.test(corpus)) return "mystery";
    if (/クイズ|謎解き|ウミガメ|20の扉|数当て|推理問題/.test(corpus)) return "quiz";
    if (/大喜利|言葉|しりとり|俳句|朝まで|ドレミ|マジカルバナナ|カタカナ|連想/.test(corpus)) return "laugh";
    if (game.category === "action" || /反射|スピード|連打|タイマー|指置き|ジャスト|ニョッキ|ピンポン|ジェスチャー|リズム/.test(corpus)) return "speed";
    if (/価値観|トーク|自己紹介|2択|ニュース/.test(corpus)) return "talk";
    return "talk";
  };

  const inferVoice = (game) => {
    const corpus = textOf(game);
    if (/手ぶら|声だけ|会話中心|トーク|連想|しりとり|山手線|古今東西/.test(corpus)) return true;
    return ["talk", "laugh"].includes(game.genre);
  };

  const parseDurationMin = (duration) => {
    const text = String(duration ?? "").normalize("NFKC").trim();
    const match = text.match(/\d+(?:\.\d+)?/);
    if (!match) return 999;

    const firstValue = Number(match[0]);
    if (!Number.isFinite(firstValue)) return 999;

    const firstNumberEnd = (match.index ?? 0) + match[0].length;
    const unitTail = text.slice(firstNumberEnd).trimStart();
    if (unitTail.startsWith("秒")) return firstValue / 60;
    if (unitTail.startsWith("時間")) return firstValue * 60;
    return firstValue;
  };

  const makeSearchIndex = (game) => normalizeText([
    game.id,
    game.title,
    game.ruby,
    game.badge,
    game.catchphrase,
    game.category,
    game.genre,
    game.preparation,
    game.overview,
    ...(Array.isArray(game.tags) ? game.tags : [])
  ].filter(Boolean).join(" "));

  if (typeof GAMES_DATA !== "undefined" && Array.isArray(GAMES_DATA)) {
    GAMES_DATA.forEach((game) => {
      if (game.id === "batsu-roulette") {
        game.badge = "パスOK";
        game.catchphrase = "負けた人も安心！飲酒・痛み・暴露なしのソフトミッションをルーレットで即決";
        game.overview = "飲酒・痛み・個人情報の暴露・第三者への迷惑行為を使わないソフトミッションをランダム抽選。カテゴリを選べて、嫌なお題は理由を言わず何度でもパス・引き直しできます。";
        game.rules = [
          { step: "1", title: "カテゴリを選んでルーレット", desc: "声・演技・言葉遊び・ミニチャレンジから、その場に合うカテゴリを選びます。" },
          { step: "2", title: "嫌なら理由なしでパス", desc: "少しでもやりたくないお題は、そのまま引き直してOK。説得や強制はしません。" },
          { step: "3", title: "本人がOKなら短く挑戦", desc: "30秒〜1分程度で終わる軽いミッションとして楽しみます。" }
        ];
        game.tags = ["スマホ1台", "罰ゲーム", "ルーレット", "パスOK", "安全配慮", "短時間"];
        game.presets = SAFE_BATSU_MISSIONS.map((item) => ({ ...item, scene: "friends" }));
      }

      if (game.id === "finger-roulette") {
        game.catchphrase = "画面に指を置くだけ！PCでもクリック位置を使って担当者をサクッと抽選";
        game.overview = "スマホでは2人以上が同じ画面に指を置き、PCでは2か所以上をクリックして仮想の指を置きます。短いカウント後に1人または2人をランダム選出できます。";
        game.rules = [
          { step: "1", title: "2人以上で位置を登録", desc: "スマホは画面に指を置き、PCは画面内の2か所以上をクリックします。" },
          { step: "2", title: "選ぶ人数を1人か2人から選択", desc: "抽選前に選出人数を切り替えられます。" },
          { step: "3", title: "短いカウント後に抽選", desc: "選ばれた位置が王冠表示になったら結果確定です。" }
        ];
        game.tips = ["PCでは登録済みの位置の近くをクリックすると、その仮想の指を取り消せます。"];
      }

      if (game.id === "talk-gacha") {
        game.badge = "会話ネタガチャ";
        game.catchphrase = "話題に迷った時のきっかけに。カテゴリを選んで質問をランダム表示";
        game.overview = "「ライト」「もしも」「本音」「恋愛」「ディープ」からカテゴリを選び、会話のきっかけになる質問をランダム表示します。答えにくい質問は無理に答えず、別の質問へ切り替えて遊べます。";
        game.rules = [
          { step: "1", title: "カテゴリを選ぶ", desc: "ライト・もしも・本音・恋愛・ディープから、その場に合うカテゴリを選びます。" },
          { step: "2", title: "質問ガチャを回す", desc: "表示された質問を会話のきっかけとして使います。" },
          { step: "3", title: "無理に答えず会話を広げる", desc: "答えにくければ別の質問へ。答えた内容から自然に話を広げます。" }
        ];
      }

      if (game.id === "twenty-questions") {
        game.overview = "出題者が隠した言葉を、20回以内の「はい／いいえ」で答えられる質問で当てる知的ゲーム。ツールが残り質問数とYES・NO・関係なしの回答履歴を記録し、何問使ったかを見失わずに進行できます。";
        game.rules = [
          { step: "1", title: "出題者が秘密の答えを決める", desc: "答えはツール外で決め、ゲーム中に変えないようにします。" },
          { step: "2", title: "質問ごとに回答を記録", desc: "YES・NO・関係なしのボタンを押すたび、残り質問数と回答履歴が更新されます。" },
          { step: "3", title: "20回以内に答えを当てる", desc: "質問文そのものは保存されないため、必要なら口頭や別メモで管理します。" }
        ];
      }

      normalizePresetContracts(game);
      game.hasTool = Boolean(game.toolType && game.toolType !== "guide-only");
      game.genre = game.genre || inferGenre(game);
      game.isVoice = typeof game.isVoice === "boolean" ? game.isVoice : inferVoice(game);
      game.durationMin = Number.isFinite(game.durationMin) ? game.durationMin : parseDurationMin(game.duration);

      const rating = Number.isFinite(Number(game.rating)) ? Number(game.rating) : 0;
      const tags = Array.isArray(game.tags) ? game.tags : [];
      const baseline = rating * 100;
      const toolBonus = game.hasTool ? 20 : 0;
      const classicBonus = tags.some((tag) => /定番|大人気|神ゲーム/.test(String(tag))) ? 12 : 0;
      const easyStartBonus = Number(game.minPlayers) <= 2 ? 4 : 0;
      game.recommendScore = Number.isFinite(game.recommendScore)
        ? game.recommendScore
        : baseline + toolBonus + classicBonus + easyStartBonus;

      game._searchIndex = makeSearchIndex(game);
    });
  }

  // Some tools still expect the pre-TPO preset shape. Adapt only at the tool
  // boundary until Issue #65 moves every renderer onto one canonical schema.
  if (typeof GameTools !== "undefined" && !GameTools.__presetContractCompat) {
    GameTools.__presetContractCompat = true;

    const wrapTextPresetTool = (toolName) => {
      const original = GameTools[toolName];
      if (typeof original !== "function") return;
      GameTools[toolName] = function renderWithTextPresetCompat(container, game) {
        const compatibleGame = {
          ...game,
          presets: (Array.isArray(game?.presets) ? game.presets : [])
            .map(presetText)
            .filter(Boolean)
        };
        return original.call(this, container, compatibleGame);
      };
    };

    wrapTextPresetTool("renderAsaSore");
    wrapTextPresetTool("renderBombTimer");
    wrapTextPresetTool("renderNgWord");

    const originalTalkGacha = GameTools.renderTalkGacha;
    if (typeof originalTalkGacha === "function") {
      const classifyTalkCategory = (item) => {
        const text = presetText(item);
        if (/異性|恋人|結婚|デート|仕草|ギャップ/.test(text)) return "恋愛";
        if (/もし|宝くじ|世界が終|無人島|100年後/.test(text)) return "もしも";
        if (/黒歴史|恥ずか|痛い思い出|秘密/.test(text)) return "ディープ";
        if (/性格|マイルール|影響を受け|譲れない条件/.test(text)) return "本音";
        return "ライト";
      };

      GameTools.renderTalkGacha = function renderTalkGachaCompat(container, game) {
        const compatibleGame = {
          ...game,
          presets: (Array.isArray(game?.presets) ? game.presets : [])
            .map((item) => ({ q: presetText(item), category: classifyTalkCategory(item) }))
            .filter((item) => item.q)
        };
        return originalTalkGacha.call(this, container, compatibleGame);
      };
    }

    GameTools.renderBatsuRoulette = function renderSafeBatsuRoulette(container, game) {
      let selectedCategory = "all";
      let current = SAFE_BATSU_MISSIONS[Math.floor(Math.random() * SAFE_BATSU_MISSIONS.length)];
      let spinInterval = null;

      const candidates = () => selectedCategory === "all"
        ? SAFE_BATSU_MISSIONS
        : SAFE_BATSU_MISSIONS.filter((item) => item.category === selectedCategory);

      const clearSpin = () => {
        if (spinInterval) {
          clearInterval(spinInterval);
          spinInterval = null;
        }
      };

      const pick = () => {
        const list = candidates();
        return list[Math.floor(Math.random() * list.length)] || SAFE_BATSU_MISSIONS[0];
      };

      const markStarted = () => {
        globalThis.AsobiPlayLifecycle?.start?.(game.id);
      };

      const render = () => {
        clearSpin();
        const categories = ["all", "声・言い方", "演技", "言葉・発想", "ミニチャレンジ"];
        container.innerHTML = `
          <div class="tool-card text-center batsu-card">
            <h3 class="tool-title">⚡ ソフトミッションルーレット</h3>
            <p class="text-sub text-sm mb-2">飲酒・痛み・暴露なし。嫌なら理由を言わずパスできます。</p>
            <div class="gacha-cat-filters" aria-label="ミッションカテゴリ">
              ${categories.map((category) => `<button class="btn-filter-tag ${selectedCategory === category ? "active" : ""}" data-batsu-category="${escapeMarkup(category)}">${category === "all" ? "すべて" : escapeMarkup(category)}</button>`).join("")}
            </div>
            <div class="batsu-mission-box my-4" id="batsu-box" aria-live="polite">
              <span class="batsu-badge">🎯 ${escapeMarkup(current.category)}</span>
              <div class="batsu-text" id="batsu-text">${escapeMarkup(current.text)}</div>
            </div>
            <div class="batsu-actions">
              <button class="btn btn-danger btn-lg btn-block pulse-scale" id="btn-spin-batsu">ルーレットを回す！ 🎰</button>
              <button class="btn btn-outline btn-block mt-2" id="btn-batsu-pass">↩ これはパス・引き直す</button>
              <button class="btn btn-success btn-block mt-2" id="btn-batsu-done">ミッション達成！ 👏</button>
            </div>
            <p class="text-xs text-sub mt-3">パスに理由は不要です。本人の意思とその場のルールを優先してください。</p>
          </div>`;

        container.querySelectorAll("[data-batsu-category]").forEach((button) => {
          button.addEventListener("click", () => {
            selectedCategory = button.dataset.batsuCategory;
            current = pick();
            if (typeof Sound !== "undefined") Sound.playClick();
            render();
          });
        });

        container.querySelector("#btn-spin-batsu").addEventListener("click", () => {
          markStarted();
          if (typeof Sound !== "undefined") Sound.playSelect();
          const box = container.querySelector("#batsu-box");
          const text = container.querySelector("#batsu-text");
          let count = 0;
          clearSpin();
          box?.classList.add("spinning");
          spinInterval = setInterval(() => {
            count += 1;
            current = pick();
            if (text) text.textContent = current.text;
            if (typeof Sound !== "undefined") Sound.playTick(800 + count * 30);
            if (count >= 15) {
              clearSpin();
              box?.classList.remove("spinning");
              render();
            }
          }, 80);
        });

        container.querySelector("#btn-batsu-pass").addEventListener("click", () => {
          markStarted();
          current = pick();
          if (typeof Sound !== "undefined") Sound.playClick();
          if (typeof Toast !== "undefined") Toast.info("パスOK！別のミッションに引き直しました ↩");
          render();
        });

        container.querySelector("#btn-batsu-done").addEventListener("click", () => {
          markStarted();
          if (typeof Sound !== "undefined") Sound.playFanfare();
          if (typeof Confetti !== "undefined") Confetti.burst(60);
          if (typeof Toast !== "undefined") Toast.success("ナイス！ミッション達成 👏");
        });
      };

      render();
      return clearSpin;
    };
  }

  const BRAND_OLD = "あそびばポケット";
  const BRAND = "あそびポケット";

  const normalizeAsobiShareUrl = (rawUrl) => {
    try {
      const parsed = new URL(String(rawUrl), window.location.href);
      if (parsed.hostname !== "twitter.com" || parsed.pathname !== "/intent/tweet") return rawUrl;
      const text = parsed.searchParams.get("text");
      if (!text || !text.includes(BRAND_OLD)) return rawUrl;
      parsed.searchParams.set("text", text.split(BRAND_OLD).join(BRAND));
      return parsed.toString();
    } catch {
      return rawUrl;
    }
  };
  globalThis.__normalizeAsobiShareUrl = normalizeAsobiShareUrl;

  if (!globalThis.__asobiWindowOpenBrandPatched && typeof window.open === "function") {
    globalThis.__asobiWindowOpenBrandPatched = true;
    const nativeOpen = window.open.bind(window);
    window.open = function openWithCanonicalAsobiBrand(url, ...args) {
      return nativeOpen(normalizeAsobiShareUrl(url), ...args);
    };
  }

  const syncVisiblePublicCopy = () => {
    const popularOption = document.querySelector('#sort-select option[value="popular"]');
    if (popularOption) popularOption.textContent = "⭐ 編集部おすすめ順";

    const footerTitle = document.querySelector(".footer-seo-links-row strong");
    if (footerTitle) footerTitle.textContent = "💡 お題集・ゲーム特集:";

    const footerLabels = new Map([
      ["seo/ito-odai.html", "ito 自作お題60選"],
      ["seo/wordwolf-odai.html", "ワードウルフ 自作お題60ペア"],
      ["seo/asa-sore-odai.html", "朝までそれ正解 自作お題50選"],
      ["seo/sea-turtle-quiz.html", "ウミガメのスープ 自作12問"]
    ]);
    document.querySelectorAll(".footer-seo-links-row a[href]").forEach((link) => {
      const label = footerLabels.get(link.getAttribute("href"));
      if (label) link.textContent = label;
    });
  };

  const syncDynamicPublicCopy = () => {
    const topicManagerButton = document.querySelector("#btn-open-topic-custom");
    if (topicManagerButton && topicManagerButton.textContent !== "⚙️ お題を追加・管理する") {
      topicManagerButton.textContent = "⚙️ お題を追加・管理する";
    }

    if (location.hash === "#game/twenty-questions") {
      const historyTitle = document.querySelector("#tool-mount-point .history-list h4");
      if (historyTitle && historyTitle.textContent !== "回答履歴:") historyTitle.textContent = "回答履歴:";
    }
  };

  const setupPublicCopySync = () => {
    syncVisiblePublicCopy();
    syncDynamicPublicCopy();
    const detail = document.getElementById("view-detail");
    if (detail && typeof MutationObserver !== "undefined") {
      const observer = new MutationObserver(syncDynamicPublicCopy);
      observer.observe(detail, { childList: true, subtree: true });
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupPublicCopySync, { once: true });
  } else {
    setupPublicCopySync();
  }

  document.addEventListener("click", async (event) => {
    const shareButton = event.target.closest("#detail-share-btn");
    if (!shareButton) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const gameId = location.hash.match(/^#game\/(.+)$/)?.[1];
    const game = (typeof GAMES_DATA !== "undefined" ? GAMES_DATA : []).find((item) => item.id === gameId);
    if (!game) return;

    const shareData = {
      title: `${game.title} | ${BRAND}`,
      text: `スマホ1台・手ぶらですぐ遊べる「${game.title}」を遊ぼう！`,
      url: window.location.href
    };

    try {
      if (typeof navigator.share === "function") {
        await navigator.share(shareData);
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        if (typeof Toast !== "undefined") Toast.success("共有用テキストをコピーしました");
      }
    } catch (error) {
      if (error?.name !== "AbortError" && typeof Toast !== "undefined") {
        Toast.warning("共有を完了できませんでした");
      }
    }
  }, true);

  // 提携状況が未確認の間は通常の検索URLだけを表示する単一設定。
  globalThis.AFFILIATE_CONFIG = Object.freeze({
    isAffiliateEnabled: false,
    getAmazonUrl(keyword) {
      return `https://www.amazon.co.jp/s?k=${encodeURIComponent(String(keyword ?? ""))}`;
    },
    getRakutenUrl(keyword) {
      return `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(String(keyword ?? ""))}/`;
    }
  });
})();
