/**
 * あそびポケット (Asobi Pocket)
 * ゲームデータベース (全32ゲーム・コンテンツ整理＆スリム化対応版)
 */

const GAMES_DATA = [
  {
    "id": "ito",
    "title": "ito（イト・価値観連想ゲーム）",
    "ruby": "いと",
    "icon": "🧶",
    "badge": "神ゲーム",
    "catchphrase": "数字を言わずに例えで伝えろ！1〜100の数字を小さい順に並べる協力ゲーム",
    "category": "talk",
    "toolType": "ito",
    "minPlayers": 2,
    "maxPlayers": 8,
    "duration": "5〜10分",
    "preparation": "スマホ1台",
    "rating": 5,
    "tags": [
      "スマホ1台",
      "2人〜",
      "トーク",
      "協力",
      "定番",
      "神ゲーム",
      "アイスブレイク"
    ],
    "overview": "各プレイヤーに1〜100の数字がランダムに配られます。お題（例: 「人気の食べ物」「ゾンビに勝てそうなもの」）に沿って、自分の数字を言葉で例え合い、数字を直接言わずに全員で小さい順に並べられたら完全クリア！",
    "rules": [
      {
        "step": "1",
        "title": "お題と数字をこっそり確認",
        "desc": "お題が決まったら、スマホを回して各自1〜100の自分の数字をタップしてこっそり確認します。"
      },
      {
        "step": "2",
        "title": "数字を言わずに例えでトーク！",
        "desc": "「私はお寿司くらい！」「俺は駄菓子屋のガムくらい」など、お題に沿った例えで探り合います（数字そのものを言うのはNG！）。"
      },
      {
        "step": "3",
        "title": "全員で小さい順にカードを並べる",
        "desc": "話し合いながら「私が一番小さいから最初に出すね」「いや私の方が前かも」とカードを並べ替えます。"
      },
      {
        "step": "4",
        "title": "オープンして判定！",
        "desc": "並べたカードを一斉にオープン！完全に小さい順に並んでいれば全員大勝利！"
      }
    ],
    "tips": [
      "「100が世界一」「1が最弱」という基準を最初にみんなですり合わせると成功率UP！",
      "「50前後」の普通ゾーンの言葉選びが一番難しくて面白い！",
      "マスターモード（1人2枚）にすると、自分の数字同士の比較も加わって熱狂度倍増！"
    ],
    "presets": [
      {
        "text": "人気の食べ物 (1: 不人気 〜 100: 国民的大人気)",
        "scene": "friends"
      },
      {
        "text": "ゾンビと戦うとき頼りになる武器・アイテム (1: つまようじ 〜 100: 戦車)",
        "scene": "friends"
      },
      {
        "text": "テンションが上がる瞬間・出来事 (1: 最悪 〜 100: 最高の奇跡)",
        "scene": "friends"
      },
      {
        "text": "無人島に持っていきたいもの (1: 不要 〜 100: 最重要アイテム)",
        "scene": "friends"
      },
      {
        "text": "コンビニで買える美味しいもの (1: 地味 〜 100: 絶品)",
        "scene": "family"
      },
      {
        "text": "強そうな技・魔法の名前 (1: よわよわ 〜 100: 世界崩壊レベル)",
        "scene": "friends"
      },
      {
        "text": "デートで行きたい場所 (1: 最悪の場所 〜 100: 最高のロマンチック)",
        "scene": "party"
      },
      {
        "text": "カッコいい職業・肩書き (1: ダサい 〜 100: 憧れの的)",
        "scene": "work"
      },
      {
        "text": "地味に嫌なシチュエーション (1: 気にしない 〜 100: 絶望)",
        "scene": "friends"
      },
      {
        "text": "カバンに入っていたら嬉しいもの (1: ゴミ 〜 100: 100万円)",
        "scene": "friends"
      },
      {
        "text": "言われて嬉しい褒め言葉 (1: お世辞 〜 100: 一生忘れない)",
        "scene": "party"
      },
      {
        "text": "強そうな四字熟語 (1: 弱そう 〜 100: 最強)",
        "scene": "family"
      },
      {
        "text": "動物の強さランキング (1: ミジンコ 〜 100: ティラノサウルス)",
        "scene": "family"
      },
      {
        "text": "朝起きて目の前にあったら怖いもの (1: 普通 〜 100: 心停止レベル)",
        "scene": "friends"
      },
      {
        "text": "一生これしか食べられないなら選びたい料理 (1: 絶対嫌 〜 100: 余裕)",
        "scene": "friends"
      },
      {
        "text": "学校・職場で人気者になれる特技 (1: 痛い 〜 100: スーパースター)",
        "scene": "work"
      },
      {
        "text": "もらって嬉しい誕生日プレゼント (1: 困惑 〜 100: 感涙)",
        "scene": "party"
      },
      {
        "text": "もし手に入るなら欲しい超能力 (1: 地味すぎる 〜 100: 神の力)",
        "scene": "friends"
      },
      {
        "text": "部屋にあるとオシャレに見えるインテリア (1: ダサい 〜 100: モデルルーム)",
        "scene": "party"
      },
      {
        "text": "旅行で行きたい都道府県・国 (1: 近所 〜 100: 憧れの楽園)",
        "scene": "friends"
      },
      {
        "text": "映画館で観たい映画ジャンル・作品 (1: 退屈 〜 100: 鳥肌モノ)",
        "scene": "friends"
      },
      {
        "text": "居酒屋で最初に頼みたいメニュー (1: え？ 〜 100: 鉄板)",
        "scene": "party"
      },
      {
        "text": "ドライブ中に聴きたい曲・アーティスト (1: 眠くなる 〜 100: 爆アガり)",
        "scene": "friends"
      },
      {
        "text": "言われたら思わず好きになっちゃうセリフ (1: 寒気 〜 100: 即落ち)",
        "scene": "party"
      },
      {
        "text": "子供の頃に憧れた大人像・アイテム (1: どうでもいい 〜 100: 永遠のロマン)",
        "scene": "family"
      },
      {
        "text": "キャンプに持っていくと盛り上がるもの (1: 邪魔 〜 100: ヒーローになれる)",
        "scene": "friends"
      },
      {
        "text": "カラオケで1曲目に歌うと盛り上がる曲 (1: お通夜 〜 100: 全員大熱唱)",
        "scene": "party"
      },
      {
        "text": "歴史上の偉人で友達になりたい人 (1: 絶交 〜 100: 親友)",
        "scene": "family"
      },
      {
        "text": "雨の日に家でやりたい最高の過ごし方 (1: 虚無 〜 100: 至高の至福)",
        "scene": "friends"
      },
      {
        "text": "上司・先輩に奢ってもらいたいご飯 (1: うまい棒 〜 100: 高級回らない寿司)",
        "scene": "work"
      },
      {
        "text": "結婚相手に求める絶対条件 (1: どうでもいい 〜 100: 最重要)",
        "scene": "party"
      },
      {
        "text": "人生で一度は体験したいスリル (1: 退屈 〜 100: 一生モノの伝説)",
        "scene": "friends"
      },
      {
        "text": "言われたら立ち直れない厳しいダメ出し (1: 蚊に刺された程度 〜 100: メンタル崩壊)",
        "scene": "work"
      },
      {
        "text": "無人島に一緒に遭難するなら誰？ (1: 足手まとい 〜 100: 生還確定)",
        "scene": "friends"
      },
      {
        "text": "お弁当に入っているとテンションが上がるおかず (1: 謎のパセリ 〜 100: エビフライ)",
        "scene": "family"
      },
      {
        "text": "仕事・勉強中に一番嬉しい差し入れ (1: ぬるい水 〜 100: 高級スイーツ)",
        "scene": "work"
      },
      {
        "text": "子供に習わせたい習い事 (1: 意味不明 〜 100: 将来安泰)",
        "scene": "family"
      },
      {
        "text": "友達の家に行って置いてあったら好感度が上がるもの (1: 怪しい壺 〜 100: センス抜群の家具)",
        "scene": "friends"
      },
      {
        "text": "朝の目覚ましにピッタリな音・声 (1: 騒音 〜 100: 天使のささやき)",
        "scene": "friends"
      },
      {
        "text": "1人暮らしの部屋にあったらQOL爆上がりする家電 (1: 邪魔なだけ 〜 100: 人生変わる)",
        "scene": "friends"
      },
      {
        "text": "もしタイムマシンがあるなら行きたい時代 (1: 暗黒時代 〜 100: 黄金時代)",
        "scene": "friends"
      },
      {
        "text": "居酒屋の割り勘で許せる端数の差額 (1: 1円も嫌 〜 100: 全額奢り)",
        "scene": "party"
      },
      {
        "text": "人生の最後に聴きたいラストソング (1: 絶望 〜 100: 昇天)",
        "scene": "friends"
      },
      {
        "text": "コンビニのレジ横ホットスナック最強決定戦 (1: 微妙 〜 100: 覇者)",
        "scene": "family"
      },
      {
        "text": "世界遺産で一度は訪れるべき絶景 (1: 写真で十分 〜 100: 死ぬ前に絶対)",
        "scene": "friends"
      },
      {
        "text": "もし飼えるならペットにしたい架空の生き物 (1: 凶暴すぎる 〜 100: 最高の相棒)",
        "scene": "family"
      },
      {
        "text": "学校の行事で一番燃え上がったイベント (1: 苦痛 〜 100: 青春のすべて)",
        "scene": "family"
      },
      {
        "text": "社会人になって一番痛感した大人の現実 (1: 些細なこと 〜 100: 深い絶望)",
        "scene": "work"
      },
      {
        "text": "スマホのアプリで1つだけ残すなら？ (1: 電卓 〜 100: 命綱)",
        "scene": "work"
      },
      {
        "text": "最強の睡眠環境を作るアイテム (1: 煎餅布団 〜 100: 雲の上の寝心地)",
        "scene": "friends"
      },
      {
        "text": "初対面で相手にされたらキュンとする仕草 (1: 恐怖 〜 100: 即恋に落ちる)",
        "scene": "party"
      },
      {
        "text": "異性の部屋にあって一番テンションが上がるもの (1: 幻滅 〜 100: 結婚を意識)",
        "scene": "party"
      },
      {
        "text": "合コンで言われたら一番嬉しい褒め言葉 (1: 社交辞令 〜 100: 有頂天)",
        "scene": "party"
      },
      {
        "text": "職場の上司にしたい理想の人物像 (1: パワハラ 〜 100: 一生ついていく)",
        "scene": "work"
      },
      {
        "text": "会社の飲み会で絶対に頼んではいけない禁忌の行動 (1: 平気 〜 100: 即クビレベル)",
        "scene": "work"
      },
      {
        "text": "新入社員がやっていたら好感度MAXな気配り (1: 余計なお世話 〜 100: 天才)",
        "scene": "work"
      },
      {
        "text": "家族旅行で行ったら全員が大満足するスポット (1: 大喧嘩 〜 100: 最高の思い出)",
        "scene": "family"
      },
      {
        "text": "休日の朝に家族全員が笑顔になる朝食 (1: 納豆のみ 〜 100: 豪華ホテルのビュッフェ)",
        "scene": "family"
      },
      {
        "text": "子供の頃に親に買ってもらって一番嬉しかったオモチャ (1: 地味 〜 100: 宝物)",
        "scene": "family"
      },
      {
        "text": "徹夜明けの体に一番染み渡るドリンク (1: 泥水 〜 100: 命の雫)",
        "scene": "friends"
      }
    ],
    "affiliateKeyword": "ito ボードゲーム",
    "seoSlug": "seo/ito-odai.html",
    "section": "main"
  },
  {
    "id": "asa-sore",
    "title": "朝それ（朝までそれ正解）",
    "ruby": "あさそれ",
    "searchAliases": [
      "あさまでそれせいかい"
    ],
    "icon": "☀️",
    "badge": "大喜利・議論",
    "catchphrase": "「『あ』で始まる怖いものは？」全員が納得する唯一の『それ正解』を決めろ！",
    "category": "talk",
    "toolType": "asa-sore",
    "minPlayers": 3,
    "maxPlayers": 20,
    "duration": "5〜15分",
    "preparation": "スマホ1台",
    "rating": 4.9,
    "tags": [
      "スマホ1台",
      "3人〜",
      "大喜利",
      "大人数",
      "飲み会",
      "定番",
      "声だけ"
    ],
    "overview": "テレビ番組で大流行した伝説のゲーム。ランダムに決定された『五十音の頭文字』と『お題テーマ』を掛け合わせ、各自がフリートークで自分の考える最強の回答を発表！全員が満場一致で納得する『それ正解！』を議論して決定します。",
    "rules": [
      {
        "step": "1",
        "title": "頭文字とお題を決定",
        "desc": "ツールをタップして「頭文字（例: 『あ』）」と「お題（例: 『怖いもの』）」を決定します。"
      },
      {
        "step": "2",
        "title": "シンキングタイム（30秒〜1分）",
        "desc": "各自頭の中で、または手元のメモに自分の回答を思い浮かべます。"
      },
      {
        "step": "3",
        "title": "一斉または順番に発表！",
        "desc": "「『あ』で始まる怖いもの、せーの、『赤点！』『暗闇！』『朝のアラーム！』」と発表し合います。"
      },
      {
        "step": "4",
        "title": "議論して『それ正解』を決める！",
        "desc": "どれが一番しっくりくるか熱く議論し、全員一致の『それ正解！』を1つ決定します。"
      }
    ],
    "tips": [
      "「おもしろい理由」をプレゼンできた人が勝利！論理性よりも共感と納得感がカギ。",
      "最初に出た意見に引っ張られず、あえて別角度（マイナーだけど確実）から攻めると高評価！",
      "「満場一致」を目指して、みんなの納得がいくまでプレゼン合戦を楽しもう！"
    ],
    "presets": [
      {
        "text": "テンションが上がるもの",
        "scene": "friends"
      },
      {
        "text": "朝起きて一番にしたいこと",
        "scene": "friends"
      },
      {
        "text": "無人島に1つだけ持っていくなら？",
        "scene": "friends"
      },
      {
        "text": "コンビニでつい買ってしまうもの",
        "scene": "family"
      },
      {
        "text": "地味にショックな出来事",
        "scene": "friends"
      },
      {
        "text": "言われて嬉しい褒め言葉",
        "scene": "party"
      },
      {
        "text": "カバンに入っていると安心するもの",
        "scene": "family"
      },
      {
        "text": "カッコいい四字熟語",
        "scene": "family"
      },
      {
        "text": "子供の頃に憧れた職業",
        "scene": "family"
      },
      {
        "text": "デートで行きたい場所",
        "scene": "party"
      },
      {
        "text": "居酒屋で絶対頼むメニュー",
        "scene": "party"
      },
      {
        "text": "部屋にあるとオシャレに見えるもの",
        "scene": "friends"
      },
      {
        "text": "最強の武器",
        "scene": "friends"
      },
      {
        "text": "一生に一度はやってみたい体験",
        "scene": "friends"
      },
      {
        "text": "怒られると分かっていてもやめられないこと",
        "scene": "friends"
      },
      {
        "text": "ドライブ中に聴きたい曲・アーティスト",
        "scene": "friends"
      },
      {
        "text": "冬の寒い日に食べたいもの",
        "scene": "family"
      },
      {
        "text": "夏の海でやりたいこと",
        "scene": "friends"
      },
      {
        "text": "世界平和のために必要なもの",
        "scene": "work"
      },
      {
        "text": "ゾンビから生き残るために必要なアイテム",
        "scene": "friends"
      },
      {
        "text": "初対面で言われたらキュンとする言葉",
        "scene": "party"
      },
      {
        "text": "合コンで絶対にやってはいけないこと",
        "scene": "party"
      },
      {
        "text": "上司に言われて一番背筋が凍るセリフ",
        "scene": "work"
      },
      {
        "text": "仕事ができる人が必ず持っているもの",
        "scene": "work"
      },
      {
        "text": "家族みんなで笑顔になれる休日の過ごし方",
        "scene": "family"
      },
      {
        "text": "小学校の給食で一番テンションが上がったメニュー",
        "scene": "family"
      }
    ],
    "affiliateKeyword": "朝までそれ正解 ボードゲーム",
    "seoSlug": "seo/asa-sore-odai.html",
    "section": "main"
  },
  {
    "id": "word-wolf",
    "title": "ワードウルフ (Word Wolf)",
    "ruby": "わーどうるふ",
    "icon": "🐺",
    "badge": "超人気推理",
    "catchphrase": "1人だけ違うお題を見ているのは誰だ？会話の違和感から人狼を見破る心理戦！",
    "category": "mystery",
    "toolType": "wordwolf",
    "minPlayers": 3,
    "maxPlayers": 10,
    "duration": "5〜10分",
    "preparation": "スマホ1台",
    "rating": 5,
    "tags": [
      "スマホ1台",
      "3人〜",
      "心理戦",
      "推理",
      "騙し合い",
      "人狼",
      "定番"
    ],
    "overview": "全員に似ているけれど微妙に異なるお題が配られます（例: 市民「りんご」、ウルフ「梨」）。自分が市民かウルフか分からない状態でフリートークを行い、会話のズレからウルフを見つけ出す人気No.1心理ゲーム！",
    "rules": [
      {
        "step": "1",
        "title": "プレイヤー名とお題の確認",
        "desc": "スマホを順番に回し、各プレイヤーが画面をタップしてお題をこっそり確認します。"
      },
      {
        "step": "2",
        "title": "お題についてフリートーク（3分）",
        "desc": "直接お題の言葉を言わずに、「甘いよね」「赤色が多いかな」など特徴を話し合います。"
      },
      {
        "step": "3",
        "title": "投票でウルフを追放！",
        "desc": "話し合い終了後、せーので一番怪しいと思う人を指差して投票します。"
      },
      {
        "step": "4",
        "title": "ウルフの逆転チャンス！",
        "desc": "ウルフが最多票を集めた場合、市民のお題をズバリ当てることができればウルフの大逆転勝利！"
      }
    ],
    "tips": [
      "お題の核心（色や名前そのもの）をいきなり言わず、周辺の特徴（シチュエーションや頻度）から探るのがコツ！",
      "自分がウルフだと気づいたら、市民の話にさりげなく乗っかってカモフラージュしよう！",
      "怪しまれたら逆転チャンスのお題当てを意識して、市民の会話を注意深くメモ・記憶しておこう！"
    ],
    "presets": [
      {
        "citizen": "りんご",
        "wolf": "なし",
        "category": "食べ物",
        "scene": "family",
        "text": "りんご ＆ なし"
      },
      {
        "citizen": "うどん",
        "wolf": "そば",
        "category": "食べ物",
        "scene": "family",
        "text": "うどん ＆ そば"
      },
      {
        "citizen": "映画館",
        "wolf": "プラネタリウム",
        "category": "レジャー",
        "scene": "friends",
        "text": "映画館 ＆ プラネタリウム"
      },
      {
        "citizen": "遊園地",
        "wolf": "水族館",
        "category": "レジャー",
        "scene": "friends",
        "text": "遊園地 ＆ 水族館"
      },
      {
        "citizen": "コーヒー",
        "wolf": "紅茶",
        "category": "飲み物",
        "scene": "work",
        "text": "コーヒー ＆ 紅茶"
      },
      {
        "citizen": "焼肉",
        "wolf": "すき焼き",
        "category": "食べ物",
        "scene": "party",
        "text": "焼肉 ＆ すき焼き"
      },
      {
        "citizen": "居酒屋",
        "wolf": "ファミレス",
        "category": "場所",
        "scene": "party",
        "text": "居酒屋 ＆ ファミレス"
      },
      {
        "citizen": "合コン",
        "wolf": "街コン",
        "category": "イベント",
        "scene": "party",
        "text": "合コン ＆ 街コン"
      },
      {
        "citizen": "LINE",
        "wolf": "X (Twitter)",
        "category": "SNS",
        "scene": "friends",
        "text": "LINE ＆ X (Twitter)"
      },
      {
        "citizen": "ノートパソコン",
        "wolf": "タブレット",
        "category": "家電・PC",
        "scene": "work",
        "text": "ノートパソコン ＆ タブレット"
      },
      {
        "citizen": "新幹線",
        "wolf": "飛行機",
        "category": "乗り物",
        "scene": "friends",
        "text": "新幹線 ＆ 飛行機"
      },
      {
        "citizen": "サウナ",
        "wolf": "温泉",
        "category": "リフレッシュ",
        "scene": "friends",
        "text": "サウナ ＆ 温泉"
      },
      {
        "citizen": "マクドナルド",
        "wolf": "モスバーガー",
        "category": "食べ物",
        "scene": "family",
        "text": "マクドナルド ＆ モスバーガー"
      },
      {
        "citizen": "ボウリング",
        "wolf": "カラオケ",
        "category": "遊び",
        "scene": "friends",
        "text": "ボウリング ＆ カラオケ"
      },
      {
        "citizen": "上司",
        "wolf": "先輩",
        "category": "人間関係",
        "scene": "work",
        "text": "上司 ＆ 先輩"
      },
      {
        "citizen": "テレワーク",
        "wolf": "出社",
        "category": "仕事",
        "scene": "work",
        "text": "テレワーク ＆ 出社"
      },
      {
        "citizen": "初デート",
        "wolf": "記念日デート",
        "category": "恋愛",
        "scene": "party",
        "text": "初デート ＆ 記念日デート"
      },
      {
        "citizen": "告白",
        "wolf": "プロポーズ",
        "category": "恋愛",
        "scene": "party",
        "text": "告白 ＆ プロポーズ"
      },
      {
        "citizen": "犬",
        "wolf": "猫",
        "category": "動物",
        "scene": "family",
        "text": "犬 ＆ 猫"
      },
      {
        "citizen": "宿題",
        "wolf": "テスト",
        "category": "学校",
        "scene": "family",
        "text": "宿題 ＆ テスト"
      },
      {
        "citizen": "カレーライス",
        "wolf": "ハヤシライス",
        "category": "食べ物",
        "scene": "family",
        "text": "カレーライス ＆ ハヤシライス"
      },
      {
        "citizen": "ラーメン",
        "wolf": "つけ麺",
        "category": "食べ物",
        "scene": "friends",
        "text": "ラーメン ＆ つけ麺"
      },
      {
        "citizen": "シャンプー",
        "wolf": "ボディーソープ",
        "category": "日用品",
        "scene": "family",
        "text": "シャンプー ＆ ボディーソープ"
      },
      {
        "citizen": "歯ブラシ",
        "wolf": "電動歯ブラシ",
        "category": "日用品",
        "scene": "family",
        "text": "歯ブラシ ＆ 電動歯ブラシ"
      },
      {
        "citizen": "アイスコーヒー",
        "wolf": "アイスティー",
        "category": "飲み物",
        "scene": "work",
        "text": "アイスコーヒー ＆ アイスティー"
      },
      {
        "citizen": "エアコン",
        "wolf": "扇風機",
        "category": "家電",
        "scene": "family",
        "text": "エアコン ＆ 扇風機"
      },
      {
        "citizen": "スマホ",
        "wolf": "スマートウォッチ",
        "category": "ガジェット",
        "scene": "work",
        "text": "スマホ ＆ スマートウォッチ"
      },
      {
        "citizen": "イヤホン",
        "wolf": "ヘッドホン",
        "category": "ガジェット",
        "scene": "friends",
        "text": "イヤホン ＆ ヘッドホン"
      },
      {
        "citizen": "リュック",
        "wolf": "トートバッグ",
        "category": "ファッション",
        "scene": "friends",
        "text": "リュック ＆ トートバッグ"
      },
      {
        "citizen": "スニーカー",
        "wolf": "革靴",
        "category": "ファッション",
        "scene": "work",
        "text": "スニーカー ＆ 革靴"
      },
      {
        "citizen": "プール",
        "wolf": "海",
        "category": "レジャー",
        "scene": "friends",
        "text": "プール ＆ 海"
      },
      {
        "citizen": "スキー",
        "wolf": "スノーボード",
        "category": "スポーツ",
        "scene": "friends",
        "text": "スキー ＆ スノーボード"
      },
      {
        "citizen": "キャンプ",
        "wolf": "グランピング",
        "category": "レジャー",
        "scene": "friends",
        "text": "キャンプ ＆ グランピング"
      },
      {
        "citizen": "動物園",
        "wolf": "サファリパーク",
        "category": "レジャー",
        "scene": "family",
        "text": "動物園 ＆ サファリパーク"
      },
      {
        "citizen": "おにぎり",
        "wolf": "サンドイッチ",
        "category": "食べ物",
        "scene": "family",
        "text": "おにぎり ＆ サンドイッチ"
      },
      {
        "citizen": "ポテトチップス",
        "wolf": "ポップコーン",
        "category": "お菓子",
        "scene": "friends",
        "text": "ポテトチップス ＆ ポップコーン"
      },
      {
        "citizen": "ショートケーキ",
        "wolf": "チーズケーキ",
        "category": "スイーツ",
        "scene": "family",
        "text": "ショートケーキ ＆ チーズケーキ"
      },
      {
        "citizen": "ビール",
        "wolf": "ハイボール",
        "category": "お酒",
        "scene": "party",
        "text": "ビール ＆ ハイボール"
      },
      {
        "citizen": "ワイン",
        "wolf": "シャンパン",
        "category": "お酒",
        "scene": "party",
        "text": "ワイン ＆ シャンパン"
      },
      {
        "citizen": "焼き鳥",
        "wolf": "串カツ",
        "category": "食べ物",
        "scene": "party",
        "text": "焼き鳥 ＆ 串カツ"
      },
      {
        "citizen": "夜更かし",
        "wolf": "朝寝坊",
        "category": "生活習慣",
        "scene": "friends",
        "text": "夜更かし ＆ 朝寝坊"
      },
      {
        "citizen": "有給休暇",
        "wolf": "休日出勤",
        "category": "仕事",
        "scene": "work",
        "text": "有給休暇 ＆ 休日出勤"
      },
      {
        "citizen": "昇給",
        "wolf": "ボーナス",
        "category": "仕事",
        "scene": "work",
        "text": "昇給 ＆ ボーナス"
      },
      {
        "citizen": "別れ話",
        "wolf": "ケンカ",
        "category": "恋愛",
        "scene": "party",
        "text": "別れ話 ＆ ケンカ"
      },
      {
        "citizen": "一目惚れ",
        "wolf": "運命の出会い",
        "category": "恋愛",
        "scene": "party",
        "text": "一目惚れ ＆ 運命の出会い"
      },
      {
        "citizen": "同棲",
        "wolf": "ルームシェア",
        "category": "生活",
        "scene": "friends",
        "text": "同棲 ＆ ルームシェア"
      },
      {
        "citizen": "ジェットコースター",
        "wolf": "お化け屋敷",
        "category": "アトラクション",
        "scene": "friends",
        "text": "ジェットコースター ＆ お化け屋敷"
      },
      {
        "citizen": "富士山",
        "wolf": "エベレスト",
        "category": "山",
        "scene": "friends",
        "text": "富士山 ＆ エベレスト"
      },
      {
        "citizen": "花火大会",
        "wolf": "夏祭り",
        "category": "イベント",
        "scene": "friends",
        "text": "花火大会 ＆ 夏祭り"
      },
      {
        "citizen": "クリスマス",
        "wolf": "バレンタイン",
        "category": "イベント",
        "scene": "friends",
        "text": "クリスマス ＆ バレンタイン"
      },
      {
        "citizen": "お正月",
        "wolf": "大晦日",
        "category": "行事",
        "scene": "family",
        "text": "お正月 ＆ 大晦日"
      },
      {
        "citizen": "タクシー",
        "wolf": "バス",
        "category": "交通",
        "scene": "work",
        "text": "タクシー ＆ バス"
      },
      {
        "citizen": "自転車",
        "wolf": "電動キックボード",
        "category": "乗り物",
        "scene": "friends",
        "text": "自転車 ＆ 電動キックボード"
      },
      {
        "citizen": "ギター",
        "wolf": "ベース",
        "category": "楽器",
        "scene": "friends",
        "text": "ギター ＆ ベース"
      },
      {
        "citizen": "ピアノ",
        "wolf": "キーボード",
        "category": "楽器",
        "scene": "family",
        "text": "ピアノ ＆ キーボード"
      },
      {
        "citizen": "小説",
        "wolf": "漫画",
        "category": "本",
        "scene": "friends",
        "text": "小説 ＆ 漫画"
      },
      {
        "citizen": "YouTube",
        "wolf": "TikTok",
        "category": "動画",
        "scene": "friends",
        "text": "YouTube ＆ TikTok"
      },
      {
        "citizen": "Netflix",
        "wolf": "映画館",
        "category": "エンタメ",
        "scene": "friends",
        "text": "Netflix ＆ 映画館"
      },
      {
        "citizen": "傘",
        "wolf": "カッパ（レインコート）",
        "category": "日用品",
        "scene": "family",
        "text": "傘 ＆ カッパ（レインコート）"
      },
      {
        "citizen": "マスク",
        "wolf": "サングラス",
        "category": "身につけるもの",
        "scene": "friends",
        "text": "マスク ＆ サングラス"
      }
    ],
    "affiliateKeyword": "ワードウルフ ボードゲーム",
    "seoSlug": "seo/wordwolf-odai.html",
    "section": "main"
  },
  {
    "id": "duel-reflex",
    "title": "⚡ 反射神経タップ対決 (2人画面分割)",
    "ruby": "はんしゃしんけいたいけつ",
    "icon": "⚡",
    "badge": "2人対戦",
    "catchphrase": "合図が出たら即タップ！スマホを挟んで0.01秒を競う真剣勝負！",
    "category": "action",
    "toolType": "duel-reflex",
    "minPlayers": 2,
    "maxPlayers": 2,
    "duration": "1〜3分",
    "preparation": "スマホ1台 (机に置く)",
    "rating": 4.9,
    "tags": [
      "2人専用",
      "スマホ1台",
      "反射神経",
      "アクション",
      "早押し",
      "勝負"
    ],
    "overview": "スマホを机の真ん中に置き、2人で画面の上下を陣取ります。画面が「赤」から「緑」に変わった瞬間、または「GO!」の合図が出た瞬間に自分のエリアをタップ！フライングは即失点。3本先取で勝敗を決めます。",
    "rules": [
      {
        "step": "1",
        "title": "スマホを挟んで構える",
        "desc": "スマホを2人の間に置き、プレイヤー1（上）とプレイヤー2（下）で画面に指を近づけます。"
      },
      {
        "step": "2",
        "title": "合図を待つ（赤画面）",
        "desc": "画面が赤く点灯し、「待て…」の緊迫したカウントダウンがランダム秒数流れます。"
      },
      {
        "step": "3",
        "title": "緑に変わったら即連打！",
        "desc": "「今だ！ (GO!)」で緑に変わった瞬間、先にタップしたプレイヤーに1ポイント！"
      },
      {
        "step": "4",
        "title": "3ポイント先取で勝利！",
        "desc": "先に3勝したプレイヤーが勝者となります。フライングは相手にポイントが入るので注意！"
      }
    ],
    "tips": [
      "画面の中央に集中し、色が変わった瞬間に迷わず叩くのが勝敗の決め手！",
      "フライングは即座に相手へポイントが入るため、フェイントに引っかからない冷静さが重要！",
      "スマホを机にしっかり固定して置くとタップのブレがなくなって反応速度が上がります。"
    ],
    "affiliateKeyword": "パーティーゲーム 2人対戦",
    "seoSlug": "seo/two-player-games.html",
    "presets": [],
    "section": "main"
  },
  {
    "id": "duel-mash",
    "title": "💥 連打パワーバトル (2人画面分割・綱引き)",
    "ruby": "れんだぱわーばとる",
    "icon": "💥",
    "badge": "2人対戦",
    "catchphrase": "限界突破の高速タップ！ゲージを相手の陣地へ押し込め！",
    "category": "action",
    "toolType": "duel-mash",
    "minPlayers": 2,
    "maxPlayers": 2,
    "duration": "1〜2分",
    "preparation": "スマホ1台",
    "rating": 4.8,
    "tags": [
      "2人専用",
      "スマホ1台",
      "連打",
      "フィジカル",
      "爽快",
      "勝負"
    ],
    "overview": "画面の上下に分かれて、自分のエリアを猛烈にタップ！タップした回数に応じて中央の綱引きゲージが相手側へ押し込まれます。制限時間内に押し切るか、ゲージを制圧したプレイヤーの完全勝利！",
    "rules": [
      {
        "step": "1",
        "title": "ポジションにつく",
        "desc": "プレイヤー1と2でスマホの上下を持ち、人差し指または親指をセットします。"
      },
      {
        "step": "2",
        "title": "スタート合図で猛連打！",
        "desc": "「3, 2, 1, FIGHT!」の合図と同時に画面を全力で連打します！"
      },
      {
        "step": "3",
        "title": "ゲージを押し切れ！",
        "desc": "相手の陣地までゲージを100%押し込むか、15秒経過時に有利な方が勝ち！"
      }
    ],
    "tips": [
      "親指だけでなく人差し指＋中指の2本交互連打（ピアノ打ち）を使うと爆速タップ可能！",
      "スマホが机の上で滑らないよう、反対の手でしっかり端を押さえるのがポイント。",
      "15秒間の短期決戦なので、最初から全力全開で押し切るのが勝利の秘訣！"
    ],
    "affiliateKeyword": "パーティーゲーム アクション",
    "seoSlug": "seo/two-player-games.html",
    "presets": [],
    "section": "main"
  },
  {
    "id": "duel-color",
    "title": "🎨 カラー早見分けバトル (ストループ効果対決)",
    "ruby": "からーはやみわけ",
    "icon": "🎨",
    "badge": "2人対戦",
    "catchphrase": "文字の意味と色が一致しているか？脳を惑わす爆速ジャッジ対決！",
    "category": "action",
    "toolType": "duel-color",
    "minPlayers": 2,
    "maxPlayers": 2,
    "duration": "2〜3分",
    "preparation": "スマホ1台",
    "rating": 4.8,
    "tags": [
      "2人専用",
      "スマホ1台",
      "脳トレ",
      "早押し",
      "反射神経",
      "勝負"
    ],
    "overview": "画面に「あか（青色で描かれている）」のような文字が表示されます。「文字の意味」と「文字の色」が一致しているかどうかを、相手より0.1秒早く見極めて【〇 (一致)】または【✕ (不一致)】をタップ！",
    "rules": [
      {
        "step": "1",
        "title": "問題が表示される",
        "desc": "中央に文字とその色が表示されます（例: 「みどり」という文字が緑色なら正解）。"
      },
      {
        "step": "2",
        "title": "正誤を素早くタップ！",
        "desc": "一致なら【〇】、不一致なら【✕】を相手より先にタップ！"
      },
      {
        "step": "3",
        "title": "5問先取で勝利！",
        "desc": "先に5ポイント獲得したプレイヤーが勝者となります（誤答は-1pt）。"
      }
    ],
    "tips": [
      "文字の『意味（漢字・読み）』に脳が引っ張られる『ストループ効果』を意識して、純粋に『塗られている色』だけを直視しよう！",
      "声に出して『あか！あお！』と言ってしまうと文字の読みと混ざりやすいので、頭の中で色だけを捉えるのがコツ。",
      "スピードも大事ですが、お手つきはマイナスになるので正確性ファーストで挑もう！"
    ],
    "affiliateKeyword": "ストループ カードゲーム",
    "seoSlug": "seo/two-player-games.html",
    "presets": [],
    "section": "main"
  },
  {
    "id": "bomb-timer",
    "title": "爆弾タイマー ＆ 古今東西",
    "ruby": "ばくだんたいまー",
    "icon": "💣",
    "badge": "スリル満点",
    "catchphrase": "いつ爆発するか分からない！お題を答えて素早く隣の人へスマホをパス！",
    "category": "action",
    "toolType": "bomb-timer",
    "minPlayers": 2,
    "maxPlayers": 15,
    "duration": "3〜5分",
    "preparation": "スマホ1台",
    "rating": 4.9,
    "tags": [
      "スマホ1台",
      "スリル",
      "定番",
      "飲み会",
      "宴会",
      "爆発",
      "アクション"
    ],
    "overview": "ランダム秒数（20秒〜90秒）で爆発する時限爆弾タイマー！お題（例: 「赤いもの」「日本の駅名」）に答えたらスマホを隣の人へパス！手元でドカーンと爆発した人が罰ゲーム！",
    "rules": [
      {
        "step": "1",
        "title": "お題とタイマーをスタート",
        "desc": "お題を決めてスタートボタンを押すと、チクタクと緊迫したカウント音が始まります。"
      },
      {
        "step": "2",
        "title": "答えてスマホを隣へパス！",
        "desc": "お題に合う言葉を1つ言ったら、素早くスマホを時計回りに隣の人へ渡します。"
      },
      {
        "step": "3",
        "title": "ドカン！爆発したら負け！",
        "desc": "スマホを持っていた人が敗北！そのまま罰ゲームルーレットへ直行！"
      }
    ],
    "tips": [
      "タイマーの残り時間は誰にも見えないので、答えが出ない時は恥ずかしがらずにすぐパスして次の人へ回そう！",
      "前の人と同じジャンルに固執せず、視点をパッと切り替える（例: 食べ物から家電へ）と回答が出やすい！",
      "効果音がどんどん速くなるドキドキ感をみんなで共有して盛り上がろう！"
    ],
    "presets": [
      {
        "text": "赤いもの (トマト、ポスト、リンゴ…)",
        "scene": "family"
      },
      {
        "text": "コンビニで売っているもの",
        "scene": "family"
      },
      {
        "text": "丸いもの (ボール、地球、目玉焼き…)",
        "scene": "family"
      },
      {
        "text": "日本の都道府県・県庁所在地",
        "scene": "family"
      },
      {
        "text": "居酒屋のメニュー・おつまみ",
        "scene": "party"
      },
      {
        "text": "合コンでモテる趣味・特技",
        "scene": "party"
      },
      {
        "text": "会社・オフィスにあるもの",
        "scene": "work"
      },
      {
        "text": "ドライブ中に行きたい場所・パーキングエリア",
        "scene": "friends"
      },
      {
        "text": "冷たい食べ物・飲み物",
        "scene": "family"
      },
      {
        "text": "動物園にいる動物",
        "scene": "family"
      },
      {
        "text": "赤い色の食べ物・果物",
        "scene": "family"
      },
      {
        "text": "丸い形をしている日用品",
        "scene": "family"
      },
      {
        "text": "冬に食べたくなる温かい料理",
        "scene": "family"
      },
      {
        "text": "カタカナ4文字の言葉",
        "scene": "friends"
      },
      {
        "text": "学校の教室にあるもの",
        "scene": "family"
      },
      {
        "text": "「か」で始まる動物・生き物",
        "scene": "friends"
      },
      {
        "text": "無人島に持って行きたい道具",
        "scene": "friends"
      },
      {
        "text": "コンビニで100円前後で買えるもの",
        "scene": "friends"
      },
      {
        "text": "冷蔵庫に常備されている調味料",
        "scene": "family"
      },
      {
        "text": "夏休みの宿題・イベント",
        "scene": "family"
      },
      {
        "text": "水族館にいる生き物",
        "scene": "family"
      },
      {
        "text": "言われてテンションが上がる褒め言葉",
        "scene": "party"
      },
      {
        "text": "朝起きて一番最初にすること",
        "scene": "friends"
      },
      {
        "text": "遊園地にあるアトラクション",
        "scene": "friends"
      },
      {
        "text": "カバンの中に入っている必需品",
        "scene": "work"
      }
    ],
    "affiliateKeyword": "爆弾タイマー パニックゲーム",
    "seoSlug": "seo/waiting-time-games.html",
    "section": "main"
  },
  {
    "id": "katakana-ban",
    "title": "カタカナ禁止ゲーム（ボブジテン風）",
    "ruby": "かたかなきんしげーむ",
    "icon": "🈲",
    "badge": "大爆笑トーク",
    "catchphrase": "カタカナ語を一切使わずに説明せよ！思わずポロッと出たら即ツッコミ！",
    "category": "talk",
    "toolType": "katakana-ban",
    "minPlayers": 3,
    "maxPlayers": 10,
    "duration": "5〜10分",
    "preparation": "スマホ1台",
    "rating": 4.8,
    "tags": [
      "スマホ1台",
      "トーク",
      "大爆笑",
      "飲み会",
      "語彙力",
      "定番"
    ],
    "overview": "出題者は画面に表示されたカタカナ語（例: 「ハンバーガー」「エレベーター」）を、カタカナを一切使わずに日本語（大和言葉や漢字）だけで説明します。回答者が当てたらポイント！カタカナを言ったら即アウト！",
    "rules": [
      {
        "step": "1",
        "title": "出題者がお題を確認",
        "desc": "出題者はスマホに表示されたお題をこっそり見ます。"
      },
      {
        "step": "2",
        "title": "カタカナなしで説明！",
        "desc": "「パン」「チーズ」は禁止。「お肉」は使えます。たとえば「丸い小麦の焼き物でお肉を挟んだ料理」と説明してみましょう。"
      },
      {
        "step": "3",
        "title": "早い者勝ちで解答！",
        "desc": "他のプレイヤーは分かった瞬間にお題を答えます。カタカナを言わせない監視員も兼任！"
      }
    ],
    "tips": [
      "「あ、キャンセル！」「ちょっと待って、スタート」など日常で無意識に出るカタカナを指摘された瞬間が大爆笑ポイント！",
      "身振りもお休みにすると、言葉だけで伝える練習になります。",
      "解答者は積極的にたくさん答えて、出題者にプレッシャーをかけよう！"
    ],
    "presets": [
      {
        "word": "ハンバーガー",
        "hint": "丸い小麦の焼き物で肉や野菜を挟んだ料理",
        "scene": "family",
        "text": "ハンバーガー"
      },
      {
        "word": "エレベーター",
        "hint": "建物の中で人を乗せて上下の階を行き来する箱",
        "scene": "work",
        "text": "エレベーター"
      },
      {
        "word": "スマートフォン",
        "hint": "画面を指で触って操作する携帯電話",
        "scene": "work",
        "text": "スマートフォン"
      },
      {
        "word": "チョコレート",
        "hint": "豆から作る、甘くて少し苦い板状のお菓子",
        "scene": "family",
        "text": "チョコレート"
      },
      {
        "word": "スニーカー",
        "hint": "ひもを結んで履くことの多い運動靴",
        "scene": "friends",
        "text": "スニーカー"
      },
      {
        "word": "インターネット",
        "hint": "世界中の機器をつなぐ通信網",
        "scene": "work",
        "text": "インターネット"
      },
      {
        "word": "タクシー",
        "hint": "行き先を告げ、乗った距離などに応じて料金を払う車",
        "scene": "work",
        "text": "タクシー"
      },
      {
        "word": "クリスマス",
        "hint": "冬に木を飾り、贈り物を交換する行事",
        "scene": "family",
        "text": "クリスマス"
      },
      {
        "word": "アイスクリーム",
        "hint": "牛乳などを凍らせ、すくって食べる冷たいお菓子",
        "scene": "family",
        "text": "アイスクリーム"
      },
      {
        "word": "シャンプー",
        "hint": "髪を洗うときに使う、泡立つ洗浄料",
        "scene": "family",
        "text": "シャンプー"
      },
      {
        "word": "メガネ",
        "hint": "物がよく見えるように、鼻と耳に掛ける道具",
        "scene": "family",
        "text": "メガネ"
      },
      {
        "word": "カラオケ",
        "hint": "伴奏に合わせて好きな曲を歌う遊び",
        "scene": "friends",
        "text": "カラオケ"
      },
      {
        "word": "コンビニエンスストア",
        "hint": "おにぎりや日用品が買える、長時間営業の小さな店",
        "scene": "work",
        "text": "コンビニエンスストア"
      },
      {
        "word": "カメラ",
        "hint": "光を取り込んで目の前の景色を写真に残す道具",
        "scene": "friends",
        "text": "カメラ"
      },
      {
        "word": "リモコン",
        "hint": "離れた場所から家電を操作する道具",
        "scene": "family",
        "text": "リモコン"
      },
      {
        "word": "マフラー",
        "hint": "寒い日に首に巻く、細長い防寒具",
        "scene": "friends",
        "text": "マフラー"
      },
      {
        "word": "パトカー",
        "hint": "警察官が乗る、屋根に赤い警告灯が付いた車",
        "scene": "family",
        "text": "パトカー"
      },
      {
        "word": "トランプ",
        "hint": "四種類の印と数字が付いた札を使う遊び",
        "scene": "family",
        "text": "トランプ"
      },
      {
        "word": "サッカー",
        "hint": "足で球を操り、相手の陣地の網に入れて得点する競技",
        "scene": "friends",
        "text": "サッカー"
      },
      {
        "word": "テニス",
        "hint": "網を挟んで向かい合い、柄の付いた道具で球を打ち合う競技",
        "scene": "friends",
        "text": "テニス"
      },
      {
        "word": "ギター",
        "hint": "六本の弦を指で弾いたり、かき鳴らしたりする楽器",
        "scene": "friends",
        "text": "ギター"
      },
      {
        "word": "ピアノ",
        "hint": "白と黒の鍵を指で押し、弦をたたいて音を出す楽器",
        "scene": "family",
        "text": "ピアノ"
      },
      {
        "word": "シャープペンシル",
        "hint": "上の部分を押して細い芯を繰り出す筆記具",
        "scene": "work",
        "text": "シャープペンシル"
      },
      {
        "word": "ホッチキス",
        "hint": "小さな金属の針で何枚もの紙を一緒にとじる道具",
        "scene": "work",
        "text": "ホッチキス"
      },
      {
        "word": "エスカレーター",
        "hint": "人を乗せたまま段が動いて、上や下の階へ運ぶ設備",
        "scene": "work",
        "text": "エスカレーター"
      },
      {
        "word": "電子レンジ",
        "hint": "皿に載せた料理を、火を使わずに短時間で温める家電",
        "scene": "family",
        "text": "電子レンジ"
      },
      {
        "word": "トースター",
        "hint": "朝食の薄切りの小麦の焼きものの表面をこんがり焼く家電",
        "scene": "family",
        "text": "トースター"
      },
      {
        "word": "冷蔵庫",
        "hint": "食材が長持ちするよう、中を低温に保つ家電",
        "scene": "family",
        "text": "冷蔵庫"
      },
      {
        "word": "コーヒー",
        "hint": "いった豆をひいて、お湯でいれる苦みのある飲み物",
        "scene": "work",
        "text": "コーヒー"
      },
      {
        "word": "フライドポテト",
        "hint": "細長く切ったじゃがいもを油で揚げて、塩を振った料理",
        "scene": "family",
        "text": "フライドポテト"
      },
      {
        "word": "ピザ",
        "hint": "丸く伸ばした生地に具を載せ、高温の窯で焼く料理",
        "scene": "party",
        "text": "ピザ"
      },
      {
        "word": "パスタ",
        "hint": "小麦粉でできた麺をゆで、肉や野菜の味付けで食べる料理",
        "scene": "friends",
        "text": "パスタ"
      },
      {
        "word": "サンドイッチ",
        "hint": "薄く切った小麦の焼きもので、卵や野菜などの具を挟んだ軽食",
        "scene": "family",
        "text": "サンドイッチ"
      },
      {
        "word": "ドーナツ",
        "hint": "真ん中に穴のある形がよく知られた、甘い揚げ菓子",
        "scene": "family",
        "text": "ドーナツ"
      },
      {
        "word": "ケーキ",
        "hint": "誕生日にろうそくを立てて切り分けることの多い洋菓子",
        "scene": "family",
        "text": "ケーキ"
      },
      {
        "word": "プリン",
        "hint": "卵と牛乳を固めた、焦がし砂糖のほろ苦さが合うお菓子",
        "scene": "family",
        "text": "プリン"
      },
      {
        "word": "カレー",
        "hint": "複数の香辛料で肉や野菜を煮込み、ご飯にかけて食べる料理",
        "scene": "family",
        "text": "カレー"
      },
      {
        "word": "オムライス",
        "hint": "味付けしたご飯を薄く焼いた卵で包む料理",
        "scene": "family",
        "text": "オムライス"
      },
      {
        "word": "ステーキ",
        "hint": "厚く切った肉を焼き、熱いうちに切り分けて食べる料理",
        "scene": "party",
        "text": "ステーキ"
      },
      {
        "word": "ソーセージ",
        "hint": "ひき肉に味を付け、腸などに詰めて作る食品",
        "scene": "party",
        "text": "ソーセージ"
      },
      {
        "word": "ビール",
        "hint": "麦芽から造る、注ぐと白い泡が立つお酒",
        "scene": "party",
        "text": "ビール"
      },
      {
        "word": "ワイン",
        "hint": "ぶどうの果汁を発酵させて造るお酒",
        "scene": "party",
        "text": "ワイン"
      },
      {
        "word": "ウイスキー",
        "hint": "穀物を原料に蒸留し、木のたるで熟成させるお酒",
        "scene": "party",
        "text": "ウイスキー"
      },
      {
        "word": "カクテル",
        "hint": "お酒に果汁などを混ぜ、組み合わせで味や色を変える飲み物",
        "scene": "party",
        "text": "カクテル"
      },
      {
        "word": "イヤホン",
        "hint": "耳に入れて自分だけで音を聴く小さな機器",
        "scene": "friends",
        "text": "イヤホン"
      },
      {
        "word": "キーボード",
        "hint": "文字や数字の付いた鍵を押して文章を入力する道具",
        "scene": "work",
        "text": "キーボード"
      },
      {
        "word": "マウス",
        "hint": "机の上で動かして画面の矢印を操作する道具",
        "scene": "work",
        "text": "マウス"
      },
      {
        "word": "プロジェクター",
        "hint": "光を当てて白い壁や幕に大きな映像を映す機械",
        "scene": "work",
        "text": "プロジェクター"
      },
      {
        "word": "プリンター",
        "hint": "画面で作った文章や写真を紙に印刷する機械",
        "scene": "work",
        "text": "プリンター"
      },
      {
        "word": "マスク",
        "hint": "鼻と口を覆うために顔に着けるもの",
        "scene": "work",
        "text": "マスク"
      },
      {
        "word": "リュックサック",
        "hint": "二本のひもを肩に掛け、背中に背負うかばん",
        "scene": "friends",
        "text": "リュックサック"
      },
      {
        "word": "スーツケース",
        "hint": "旅行の着替えを入れ、取っ手を伸ばして転がすかばん",
        "scene": "friends",
        "text": "スーツケース"
      },
      {
        "word": "パスポート",
        "hint": "海外に渡るとき、国籍や本人の身分を示す公的な手帳",
        "scene": "friends",
        "text": "パスポート"
      },
      {
        "word": "チケット",
        "hint": "乗り物に乗ったり、会場に入ったりするために提示する券",
        "scene": "friends",
        "text": "チケット"
      },
      {
        "word": "テーマパーク",
        "hint": "物語などの世界を再現し、園内を巡って遊べる施設",
        "scene": "friends",
        "text": "テーマパーク"
      },
      {
        "word": "ジェットコースター",
        "hint": "軌道を高速で走り、急降下や急旋回を楽しむ乗り物",
        "scene": "friends",
        "text": "ジェットコースター"
      },
      {
        "word": "観覧車",
        "hint": "小部屋をつった大きな輪がゆっくり回り、高い所から景色を眺める乗り物",
        "scene": "friends",
        "text": "観覧車"
      },
      {
        "word": "水族館",
        "hint": "魚や海の生き物を大きな水槽などで展示する施設",
        "scene": "friends",
        "text": "水族館"
      },
      {
        "word": "サウナ",
        "hint": "熱い部屋に座り、体を温めて汗をかく入浴法",
        "scene": "friends",
        "text": "サウナ"
      },
      {
        "word": "キャンプ",
        "hint": "野外で天幕を張り、食事を作ったり泊まったりする遊び",
        "scene": "friends",
        "text": "キャンプ"
      }
    ],
    "affiliateKeyword": "ボブジテン カタカナ禁止",
    "seoSlug": "seo/katakana-ban.html",
    "section": "main"
  },
  {
    "id": "finger-roulette",
    "title": "指置きロシアンルーレット (Chwazi風)",
    "ruby": "ゆびおきるーれっと",
    "icon": "👆",
    "badge": "即決ツール",
    "catchphrase": "画面に指を置くだけ！PCでもクリック位置を使って担当者をサクッと抽選",
    "category": "action",
    "toolType": "finger-roulette",
    "minPlayers": 2,
    "maxPlayers": 8,
    "duration": "10秒",
    "preparation": "スマホ1台",
    "rating": 4.9,
    "tags": [
      "スマホ1台",
      "即決",
      "マルチタッチ",
      "飲み会",
      "奢り決め",
      "便利ツール"
    ],
    "overview": "スマホでは2人以上が同じ画面に指を置き、PCでは2か所以上をクリックして仮想の指を置きます。短いカウント後に1人または2人をランダム選出できます。",
    "rules": [
      {
        "step": "1",
        "title": "2人以上で位置を登録",
        "desc": "スマホは画面に指を置き、PCは画面内の2か所以上をクリックします。"
      },
      {
        "step": "2",
        "title": "選ぶ人数を1人か2人から選択",
        "desc": "抽選前に選出人数を切り替えられます。"
      },
      {
        "step": "3",
        "title": "短いカウント後に抽選",
        "desc": "選ばれた位置が王冠表示になったら結果確定です。"
      }
    ],
    "tips": [
      "PCでは登録済みの位置の近くをクリックすると、その仮想の指を取り消せます。"
    ],
    "affiliateKeyword": "パーティーゲーム ルーレット",
    "seoSlug": "seo/drinking-party-games.html",
    "presets": [],
    "section": "U"
  },
  {
    "id": "two-choices",
    "title": "究極の2択 ＆ 価値観トーク",
    "ruby": "きゅうきょくのにたく",
    "icon": "⚖️",
    "badge": "盛り上がり保証",
    "catchphrase": "どっちを選んでも地獄or天国！深層心理と価値観が丸裸になる究極議論！",
    "category": "talk",
    "toolType": "two-choices",
    "minPlayers": 2,
    "maxPlayers": 20,
    "duration": "5〜15分",
    "preparation": "スマホ1台",
    "rating": 4.7,
    "tags": [
      "スマホ1台",
      "トーク",
      "価値観",
      "合コン",
      "ドライブ",
      "飲み会"
    ],
    "overview": "「一生ネットが使えない VS 一生お風呂に入れない」「恋人の浮気を1回許す VS 絶対許さない」など、甲乙つけがたい究極の2択を出題。せーので多数決を取り、なぜそっちを選んだのか理由を語り合います。",
    "rules": [
      {
        "step": "1",
        "title": "お題を引く",
        "desc": "ボタンを押して究極の2択（A or B）を表示します。"
      },
      {
        "step": "2",
        "title": "せーので指差し！",
        "desc": "「せーの、A！」で全員が一斉にどちらかを選択します。"
      },
      {
        "step": "3",
        "title": "理由を深掘りトーク！",
        "desc": "少数派の意見や意外な理由に大盛り上がり！"
      }
    ],
    "presets": [
      {
        "text": "一生ネットが使えない VS 一生お風呂に入れない",
        "scene": "friends"
      },
      {
        "text": "過去に戻れるタイムマシン VS 未来に行けるタイムマシン",
        "scene": "friends"
      },
      {
        "text": "恋人のスマホを自由に見られる能力 VS 自分の心が読まれる能力",
        "scene": "party"
      },
      {
        "text": "一生お金に困らないが友達ゼロ VS 一生極貧だが最高の親友10人",
        "scene": "work"
      },
      {
        "text": "1日だけ異性になれる VS 1日だけ透明人間になれる",
        "scene": "party"
      },
      {
        "text": "毎日高級ディナーだが1人きり VS 毎日カップ麺だが好きな人と一緒",
        "scene": "party"
      },
      {
        "text": "過去のやり直しができるタイムマシン VS 未来の宝くじ当選番号がわかる予知能力",
        "scene": "friends"
      },
      {
        "text": "他人の嘘が100%見抜ける能力 VS 誰からも絶対に好かれる能力",
        "scene": "party"
      },
      {
        "text": "一生スマホ使えない VS 一生お風呂に入れない",
        "scene": "friends"
      },
      {
        "text": "毎日高級ステーキだが友達ゼロ VS 毎日塩おにぎりだが大親友とワイワイ",
        "scene": "work"
      },
      {
        "text": "見た目は超タイプだが性格最悪 VS 見た目は全く好みでないが性格が神",
        "scene": "party"
      },
      {
        "text": "恋人の過去の恋愛をすべて知る VS 恋人のこれからの浮気を1度だけ許す",
        "scene": "party"
      },
      {
        "text": "どんな言語でもペラペラ話せる VS どんな楽器でもプロ級に演奏できる",
        "scene": "work"
      },
      {
        "text": "一生夏（最高気温38度） VS 一生冬（最低気温氷点下10度）",
        "scene": "family"
      },
      {
        "text": "睡眠時間3時間で超元気になれる VS 1日何時間寝ても怒られない不労所得",
        "scene": "work"
      },
      {
        "text": "身長が20cm高くなる VS 毎月自由に使えるお小遣いが10万円増える",
        "scene": "friends"
      },
      {
        "text": "記憶力が天才（嫌なことも全部覚えている） VS 悩み事があっても寝たら全部忘れる",
        "scene": "friends"
      },
      {
        "text": "無人島に1年間1人きりでサバイバル VS 刑務所で1年間快適な独房生活",
        "scene": "friends"
      },
      {
        "text": "透明人間になれる（1日1回1時間） VS 空を飛べる（時速40km）",
        "scene": "party"
      },
      {
        "text": "恋人に自分のスマホの中身を全公開 VS 親に自分の検索履歴を全公開",
        "scene": "party"
      },
      {
        "text": "一生ラーメンしか食べられない VS 一生甘いスイーツしか食べられない",
        "scene": "family"
      },
      {
        "text": "どんな本でも1秒で読破できる VS どんなスポーツでも初見でこなせる",
        "scene": "work"
      },
      {
        "text": "1億円もらえるが全裸で渋谷交差点ダッシュ VS 1円ももらえないが英雄として称賛される",
        "scene": "party"
      },
      {
        "text": "自分の死ぬ日がわかる VS 自分の死因がわかる",
        "scene": "friends"
      },
      {
        "text": "一生ジャンクフード食べ放題（太らない） VS 一生病気にかからない健康体",
        "scene": "family"
      },
      {
        "text": "好きな人の一番の親友で居続ける VS 告白して振られて二度と会えなくなる",
        "scene": "party"
      },
      {
        "text": "動物と会話ができる能力 VS 死者と会話ができる能力",
        "scene": "friends"
      },
      {
        "text": "世界一周旅行に無料で行ける（1人きり） VS 国内温泉旅行に好きな人と行ける",
        "scene": "party"
      },
      {
        "text": "仕事で大成功するがプライベート孤独 VS 平凡な仕事だが温かい家庭と趣味満喫",
        "scene": "work"
      },
      {
        "text": "自分のクローンが代わりに仕事してくれる VS 自分のロボットが家事を全部完璧にしてくれる",
        "scene": "work"
      }
    ],
    "affiliateKeyword": "会話ゲーム 価値観 カードゲーム",
    "seoSlug": "seo/two-choices.html",
    "tips": [
      "「絶対Aでしょ！」という自分の常識が相手の「ありえない！」とぶつかる瞬間が一番盛り上がる！",
      "選んだ理由を深掘りすることで、相手の生い立ちや隠れたこだわり・価値観が丸見えになります。",
      "初対面ならライトな選択肢、仲良しグループなら恋愛や本音のディープな選択肢がおすすめ！"
    ],
    "section": "merged"
  },
  {
    "id": "sea-turtle",
    "title": "ウミガメのスープ (水平思考推理クイズ)",
    "ruby": "うみがめのすーぷ",
    "icon": "🐢",
    "badge": "本格推理",
    "catchphrase": "出題者に質問を重ねて真相を暴け！Yes/Noで解き明かす知的ミステリークイズ",
    "category": "mystery",
    "toolType": "sea-turtle",
    "minPlayers": 2,
    "maxPlayers": 10,
    "duration": "10〜20分",
    "preparation": "スマホ1台",
    "rating": 4.9,
    "tags": [
      "スマホ1台",
      "推理",
      "謎解き",
      "水平思考",
      "ドライブ",
      "じっくり"
    ],
    "overview": "出題者が奇妙な物語を読み上げます。回答者は出題者に対して「はい」「いいえ」「関係ありません」で答えられる質問を自由に行い、物語に隠された驚愕の真実を論理的思考で解き明かします。",
    "rules": [
      {
        "step": "1",
        "title": "出題者が問題と真相を確認",
        "desc": "出題者1人がスマホを持ち、問題文と「真相・ヒント」を確認します。"
      },
      {
        "step": "2",
        "title": "回答者が質問を繰り返す",
        "desc": "「男は一人でしたか？」「はい」「その日は雨でしたか？」「いいえ」のように探ります。"
      },
      {
        "step": "3",
        "title": "真相を宣言してクリア！",
        "desc": "真実にたどり着いた人が答えを発表し、出題者が正解をジャッジ！"
      }
    ],
    "presets": [
      {
        "title": "ウミガメのスープ",
        "question": "ある男がレストランで『ウミガメのスープ』を注文し、一口飲んで店を出た後、自ら命を絶った。一体なぜ？",
        "answer": "男はかつて遭難し、仲間から『ウミガメのスープだ』と言われて差し出された肉を食べて生き延びた。本物のウミガメのスープの味を知り、当時食べた肉が遭難死した仲間の肉だったと気づいて絶望したため。",
        "hints": [
          "男は過去に無人島で遭難したことがある",
          "本物のウミガメのスープを飲んだのはこの時が初めてだった",
          "レストランのスープに毒は入っていなかった"
        ],
        "difficulty": "名作",
        "scene": "friends"
      },
      {
        "title": "バーの男とコップの水",
        "question": "ある男がバーに入ってきて、バーテンダーに『水を一杯くれ』と頼んだ。バーテンダーは黙ってピストルを取り出し、男に突きつけた。男は『ありがとう』と言って帰っていった。なぜ？",
        "answer": "男はしゃっくりが止まらなくて困っていた。バーテンダーはそれに気づき、銃口を突きつけて驚かせることでしゃっくりを一瞬で止めてあげた。男はしゃっくりが止まったことに感謝して帰った。",
        "hints": [
          "男は体に困った症状（生理現象）を抱えていた",
          "バーテンダーは男を脅す悪気はなかった",
          "ピストルは本物だったが発砲はしなかった"
        ],
        "difficulty": "初級",
        "scene": "party"
      },
      {
        "title": "二人の登山家",
        "question": "吹雪の山で遭難した登山家が救助された。彼のザックには、亡くなった仲間の服が入っていた。自分が着るために持っていたのではない。なぜ？",
        "answer": "仲間が自分で脱いだ服が雪の上に散らばっていた。吹き飛ばされる前に遺族へ届けようと、生き残った登山家が拾い集めた。",
        "hints": [
          "服は雪の上に落ちていました。",
          "服を脱いだのは亡くなった仲間自身です。",
          "生き残った登山家には服を届けたい相手がいました。"
        ],
        "difficulty": "中級",
        "scene": "friends"
      },
      {
        "title": "深夜の読書",
        "question": "ある女性が深夜、部屋の明かりをすべて消し、真っ暗闇の中で本を夢中で読んでいた。彼女は夜目が利くわけでも暗視スコープをつけているわけでもない。一体どうやって読んでいた？",
        "answer": "女性は視覚障害者であり、点字で書かれた本を指先の感触で読んでいたため、部屋の明かりを必要としなかった。",
        "hints": [
          "女性の身体的特徴に関する問題",
          "本は一般的な紙の本である",
          "電子書籍やスマホの画面ではない"
        ],
        "difficulty": "初級",
        "scene": "family"
      },
      {
        "title": "野原に残った荷物",
        "question": "男が野原の真ん中でうつ伏せに倒れて死んでいた。彼の背中には未開封のリュックサックがあり、周囲には争った形跡も足跡も一切ない。彼はなぜ死んだのか？",
        "answer": "男は上空からスカイダイビングをしていたが、パラシュート（リュックサックの中身）が開かずに地上へ猛スピードで激突死してしまった。",
        "hints": [
          "男はどこからやってきたか？",
          "リュックサックの中身は何だったか？",
          "野原には足跡が全くなかった"
        ],
        "difficulty": "初級",
        "scene": "friends"
      },
      {
        "title": "奇妙な遺言",
        "question": "大富豪が亡くなり、遺言書が見つかった。『我が全財産は、私を毒殺した者に譲る』と書かれていた。警察は毒殺と断定したが、犯人は名乗り出ず逮捕もされなかった。なぜ？",
        "answer": "富豪は自ら毒をあおって自殺した。つまり自分自身を毒殺したため、遺産を受け取るべき犯人は最初からこの世に存在しなかった。",
        "hints": [
          "毒殺した犯人は誰か？",
          "富豪自身の意志が関係している",
          "第三者の犯人は存在しない"
        ],
        "difficulty": "中級",
        "scene": "party"
      },
      {
        "title": "命を救った嘘",
        "question": "男は医者から『あなたは余命3ヶ月です』と宣告された。しかし男は健康そのもので病気ではなかった。医者は故意に嘘をつき、その嘘のおかげで男は命拾いした。どういうことか？",
        "answer": "男は極度の鬱状態で自殺を決意していた。医者は男の自死の気配を察知し、『あと3ヶ月で自然に死ねるなら、苦しい自殺をやめて3ヶ月待とう』と思わせて自殺を思いとどまらせ、その間に心の治療を行って命を救った。",
        "hints": [
          "男は死にたがっていた",
          "医者は男を救うために嘘をついた",
          "他殺されそうだったわけではない"
        ],
        "difficulty": "上級",
        "scene": "friends"
      },
      {
        "title": "3分間のレコード",
        "question": "男はあるレコードをプレーヤーに乗せて針を落とした。3分後、曲が終わると男は窓から飛び降りて自殺してしまった。一体なぜ？",
        "answer": "男は音楽家だったが、耳が聞こえなくなっていた。男は自分が完全に失聴したのか確かめるため、爆音で鳴るはずのレコードを再生した。しかし何も聞こえなかったため、音楽家としての絶望から命を絶ってしまった。",
        "hints": [
          "男の職業は音楽に関係している",
          "レコードの内容は音楽だけではない",
          "男の耳には重大な異変が起きていた"
        ],
        "difficulty": "上級",
        "scene": "friends"
      },
      {
        "title": "止まった時計",
        "question": "男の部屋の壁掛け時計が突然止まった。男は時計を見た瞬間、真っ青になって部屋から飛び出し、警察へ自首した。なぜ？",
        "answer": "男は完全犯罪を狙い、時計の針を止めて写真に撮ることでアリバイを作ろうとしていた。しかし、時計が止まったのは『地震』が原因であり、地震の正確な発生時刻と男のアリバイ時刻が矛盾して嘘が暴かれると悟り、逃げ切れないと観念して自首した。",
        "hints": [
          "男はある重大な犯罪を犯していた",
          "時計が止まった原因は電池切れではない",
          "男のアリバイ工作が関係している"
        ],
        "difficulty": "中級",
        "scene": "friends"
      },
      {
        "title": "暗闇の映画館",
        "question": "満員の映画館で映画の上映中、突然男が立ち上がって叫び声を上げ、観客全員が一斉に出口へ殺到した。しかし火事でも事件でもなかった。一体何が起きた？",
        "answer": "上映されていたのは3Dパニック映画で、巨大な岩（または猛獣）がスクリーンから客席へ飛び出してくる超リアルな演出があった。あまりの臨場感に先頭の男が本気で驚いて叫び、集団パニック（つられ逃げ）が発生してしまった。",
        "hints": [
          "映画のジャンルは？",
          "観客全員がパニックになった理由",
          "上映されていた映像に関係がある"
        ],
        "difficulty": "初級",
        "scene": "family"
      },
      {
        "title": "10階のエレベーター",
        "question": "ある男は15階建てマンションの最上階（15階）に住んでいる。雨の日はエレベーターで15階まで直行するが、晴れた日はなぜか10階で降りて残りの5階分を階段で登る。なぜ？",
        "answer": "男は背の低い子供（または低身長症の人）だった。15階のボタンに手が届かず、普段は手が届く10階のボタンを押して階段を使っていたが、雨の日は持っている『傘の先端』で15階のボタンを押すことができたため。",
        "hints": [
          "男の身体的特徴に関する超有名問題",
          "雨の日に男が持っているもの",
          "10階のボタンと15階のボタンの高さ"
        ],
        "difficulty": "名作",
        "scene": "family"
      },
      {
        "title": "嵐の夜の停電",
        "question": "嵐の夜、海辺の施設で停電が起きた。中にいた男は、自分の身は安全なのに沖を見て青ざめた。なぜ？",
        "answer": "男は灯台守だった。灯台の光が消えたため、沖を進む船が浅瀬の位置を見失うかもしれないと気づいた。",
        "hints": [
          "施設は病院ではない",
          "男は犯罪者ではない",
          "高所や乗り物が関係している"
        ],
        "difficulty": "中級",
        "scene": "friends"
      },
      {
        "title": "毎日の手紙",
        "question": "男は毎日のように想い人へ熱烈なラブレターを投函し続けた。しかし想い人は別の男と結婚してしまった。その結婚相手は一体誰？",
        "answer": "想い人が結婚したのは、毎日のようにラブレターを届けに来て直接顔を合わせていた『郵便配達員』だった。",
        "hints": [
          "想い人と毎日顔を合わせていた人物",
          "手紙を届けていたのは誰か？",
          "郵便の仕組み"
        ],
        "difficulty": "初級",
        "scene": "party"
      },
      {
        "title": "切られたロープ",
        "question": "絶壁を登っていた2人の登山者。上と下で1本のロープで繋がっていた。下の男が突然ナイフを取り出し、命綱であるロープを自ら切り落とした。なぜ？",
        "answer": "上の男が足を滑らせて宙吊りになり、支点となるハーケンが抜けかけていた。このままでは2人とも滑落死してしまうと悟った下の男は、仲間を助けるために自らロープを切断して犠牲になった。",
        "hints": [
          "上の男はどういう状態だったか？",
          "下の男は生き残れたのか？",
          "自己犠牲の物語"
        ],
        "difficulty": "上級",
        "scene": "friends"
      },
      {
        "title": "床の水とガラス",
        "question": "部屋の床に水が広がり、割れたガラスの破片と、息絶えたトムとジェリーが倒れていた。そばには濡れた猫がいた。事件の真相は？",
        "answer": "トムとジェリーは飼われていた2匹の『金魚』だった。猫が水槽にいたずらして床に落として割ってしまったため、2匹は窒息死してしまった。",
        "hints": [
          "トムとジェリーは人間ではない",
          "猫は何をしたのか？",
          "水槽の中身"
        ],
        "difficulty": "初級",
        "scene": "family"
      },
      {
        "title": "高層ビルの窓拭き",
        "question": "高層ビルの窓拭き清掃をしていた男が、足を滑らせて落下した。しかし男は無傷で立ち上がり、何事もなかったかのように立ち去った。なぜ？",
        "answer": "男はその時、ビルの1階部分の窓を清掃しており、地上30センチの高さから落ちただけだったため。",
        "hints": [
          "男は超能力者でも鳥人間でもない",
          "男が作業していた階数に秘密がある",
          "実際に落ちた高さは地上何センチ？"
        ],
        "difficulty": "初級",
        "scene": "family"
      },
      {
        "title": "砂漠の死体",
        "question": "砂漠の真ん中で男が全裸で死んでいた。男の手には折れたマッチが一本握りしめられていた。一体何が起きた？",
        "answer": "男たちは熱気球に乗っていたが、重量過多で墜落の危機に瀕した。服や荷物をすべて投げ捨てた後、誰か1人が飛び降りるためにマッチの棒でくじ引きを行い、短い折れたマッチを引いた男が犠牲になって飛び降りたため。",
        "hints": [
          "男は1人で砂漠に来たわけではない",
          "空からの落下が関係している",
          "折れたマッチの意味"
        ],
        "difficulty": "名作",
        "scene": "friends"
      },
      {
        "title": "消えた凶器",
        "question": "暖房がガンガンに効いた密室で、心臓を一突きにされて殺された男。現場には凶器となるナイフや刃物は一本も見つからなかった。凶器はどこへ消えた？",
        "answer": "犯人は『鋭利に尖らせた氷の柱（つらら）』で男を刺した。暖房の熱によって氷が溶けて蒸発・水たまりとなり、凶器が跡形もなく消え失せてしまった。",
        "hints": [
          "暖房が強く効いていた理由",
          "凶器の材質に注目",
          "水たまりがあった"
        ],
        "difficulty": "初級",
        "scene": "friends"
      },
      {
        "title": "泣き出した美容師",
        "question": "客の髪を切り終えた美容師が、仕上がりを鏡で見せた瞬間、突然その場で泣き崩れてしまった。客は大満足していたのに、なぜ？",
        "answer": "客は抗がん剤治療を控えた美容師の最愛の母親（または娘）だった。治療で髪が抜け落ちる前に、信頼する我が子の手で綺麗に切ってもらいに来ていた。",
        "hints": [
          "美容師と客の関係",
          "切った髪の毛に秘密がある",
          "客は病気だった"
        ],
        "difficulty": "中級",
        "scene": "family"
      },
      {
        "title": "買えなかったパン",
        "question": "男はパン屋で100円のパンを買い、100円玉を渡した。店員は『100円足りません』と言った。パンは値上げされておらず税込み100円だった。なぜ？",
        "answer": "男は100円のパンを『2個』レジに出していたのに、1個分だと思い込んで100円玉を1枚しか出していなかったため。",
        "hints": [
          "100円玉は本物で、偽物や外国硬貨ではない",
          "パンは税込み1個100円で間違いない",
          "男のトレイの上をよく見ると…？"
        ],
        "difficulty": "初級",
        "scene": "friends"
      },
      {
        "title": "音のしない踏切",
        "question": "警報機がカンカンと鳴り響き、遮断機が下りている踏切。電車が通過しているのに、目の前に立っている男には電車の音が一切聞こえなかった。なぜ？",
        "answer": "男が見ていたのは、自宅のテレビで再生されていた電車の事故映像（または鉄道模型のジオラマ）だった。",
        "hints": [
          "男は耳が聞こえる",
          "電車の種類",
          "男はどこにいるか？"
        ],
        "difficulty": "初級",
        "scene": "family"
      },
      {
        "title": "濡れた傘の謎",
        "question": "外は雲一つない快晴の晴天。しかし男はびしょ濡れの長い傘を持って電車に乗ってきた。男は雨宿りしていたわけでも、誰かに水をかけられたわけでもない。なぜ？",
        "answer": "男は鍾乳洞（または長いトンネル・水族館のトンネル水槽の点検）の観光帰りで、天井から滴り落ちる地下水の水滴を避けるために傘を差していた。",
        "hints": [
          "男はどこから電車に乗ってきたか？",
          "傘が濡れた本当の原因",
          "水滴の正体"
        ],
        "difficulty": "初級",
        "scene": "friends"
      }
    ],
    "affiliateKeyword": "ウミガメのスープ 水平思考 推理 本",
    "seoSlug": "seo/sea-turtle-quiz.html",
    "tips": [
      "出題者への質問は『はい』『いいえ』『関係ありません』で答えられる形式にするのが鉄則！",
      "「男の職業は？」「死因は何？」など前提条件を一つずつ確認して消去法で事実を固めよう。",
      "一見不自然な行動には、当人にとっては絶対にそうせざるを得ない『切実な理由』が隠されています。"
    ],
    "section": "main"
  },
  {
    "id": "ten-seconds",
    "title": "体内時計ジャスト対決",
    "ruby": "たいないどけい",
    "icon": "⏱️",
    "badge": "秒殺対決",
    "catchphrase": "画面を見ずにピッタリ止めろ！3秒・5秒・10秒の感覚マスターは誰だ！",
    "category": "action",
    "toolType": "ten-seconds",
    "minPlayers": 2,
    "maxPlayers": 10,
    "duration": "1〜3分",
    "preparation": "スマホ1台",
    "rating": 4.8,
    "tags": [
      "スマホ1台",
      "体内時計",
      "手軽",
      "飲み会",
      "勝負",
      "アクション"
    ],
    "overview": "「10.00秒ピッタリで止めろ！」スタートボタンを押すと画面が真っ黒になり、自分の頭の中のカウントだけで指定秒数ジャストを狙ってストップ！誤差が最も少ない人の勝利！",
    "rules": [
      {
        "step": "1",
        "title": "目標秒数（5秒/10秒/7.77秒）を選択",
        "desc": "対決する秒数を選びます。"
      },
      {
        "step": "2",
        "title": "スタートして画面隠蔽！",
        "desc": "スタートするとカウント表示が消え、頭の中で秒数を刻みます。"
      },
      {
        "step": "3",
        "title": "ストップして結果判定！",
        "desc": "「ここだ！」でボタンを押すとミリ秒単位の誤差が集計されます。"
      }
    ],
    "affiliateKeyword": "ストップウォッチ 10秒ゲーム",
    "seoSlug": "seo/party-games-no-tools.html",
    "presets": [],
    "tips": [
      "10秒ジャストを狙う時は、心拍数や一定のリズム（1秒をイチ・ニ・サン・シと区切る）を刻むのがコツ！",
      "途中で画面表示が消えるので、周りの歓声や話し声に惑わされない集中力が勝負を分けます。",
      "±0.05秒以内の奇跡のジャストが出たら大喝采間違いなし！"
    ],
    "section": "main"
  },
  {
    "id": "talk-gacha",
    "title": "深掘りトークガチャ ＆ 究極の2択",
    "ruby": "とーくがちゃ",
    "icon": "🎁",
    "badge": "会話ネタガチャ",
    "catchphrase": "話題に迷った時のきっかけに。カテゴリを選んで質問をランダム表示",
    "category": "talk",
    "toolType": "talk-gacha",
    "minPlayers": 2,
    "maxPlayers": 20,
    "duration": "5〜30分",
    "preparation": "スマホ1台",
    "rating": 4.9,
    "tags": [
      "スマホ1台",
      "トーク",
      "質問",
      "合コン",
      "初対面",
      "ドライブ",
      "飲み会"
    ],
    "overview": "「ライト」「もしも」「本音」「恋愛」「ディープ」からカテゴリを選び、会話のきっかけになる質問をランダム表示します。答えにくい質問は無理に答えず、別の質問へ切り替えて遊べます。",
    "rules": [
      {
        "step": "1",
        "title": "カテゴリを選ぶ",
        "desc": "ライト・もしも・本音・恋愛・ディープから、その場に合うカテゴリを選びます。"
      },
      {
        "step": "2",
        "title": "質問ガチャを回す",
        "desc": "表示された質問を会話のきっかけとして使います。"
      },
      {
        "step": "3",
        "title": "無理に答えず会話を広げる",
        "desc": "答えにくければ別の質問へ。答えた内容から自然に話を広げます。"
      }
    ],
    "presets": [
      {
        "q": "人生で一番大笑いしたハプニングは？",
        "category": "ライト",
        "scene": "friends",
        "text": "人生で一番大笑いしたハプニングは？"
      },
      {
        "q": "最近買ったもので「これ買って大正解！」と思ったものは？",
        "category": "ライト",
        "scene": "friends",
        "text": "最近買ったもので「これ買って大正解！」と思ったものは？"
      },
      {
        "q": "子供の頃に本気で信じていた可愛い勘違いは？",
        "category": "ライト",
        "scene": "family",
        "text": "子供の頃に本気で信じていた可愛い勘違いは？"
      },
      {
        "q": "コンビニでついつい買ってしまう魔性の商品は？",
        "category": "ライト",
        "scene": "family",
        "text": "コンビニでついつい買ってしまう魔性の商品は？"
      },
      {
        "q": "休日にこれをしてる時が一番幸せ！という瞬間は？",
        "category": "ライト",
        "scene": "friends",
        "text": "休日にこれをしてる時が一番幸せ！という瞬間は？"
      },
      {
        "q": "スマホのカメラロールにある最新のスクショは何？",
        "category": "ライト",
        "scene": "friends",
        "text": "スマホのカメラロールにある最新のスクショは何？"
      },
      {
        "q": "今まで行った旅行先で一番ご飯が美味しかった場所は？",
        "category": "ライト",
        "scene": "friends",
        "text": "今まで行った旅行先で一番ご飯が美味しかった場所は？"
      },
      {
        "q": "カラオケで絶対に入れる勝負曲・鉄板曲は？",
        "category": "ライト",
        "scene": "party",
        "text": "カラオケで絶対に入れる勝負曲・鉄板曲は？"
      },
      {
        "q": "自分の部屋の中で一番落ち着くお気に入りの場所は？",
        "category": "ライト",
        "scene": "friends",
        "text": "自分の部屋の中で一番落ち着くお気に入りの場所は？"
      },
      {
        "q": "朝起きて一番最初にすることは何？",
        "category": "ライト",
        "scene": "friends",
        "text": "朝起きて一番最初にすることは何？"
      },
      {
        "q": "もし明日世界が終わるなら最後の晩餐は何を食べる？",
        "category": "もしも",
        "scene": "family",
        "text": "もし明日世界が終わるなら最後の晩餐は何を食べる？"
      },
      {
        "q": "もし宝くじで3億円当たったら最初に何を買う？",
        "category": "もしも",
        "scene": "work",
        "text": "もし宝くじで3億円当たったら最初に何を買う？"
      },
      {
        "q": "もし1日だけ透明人間になれたら何をしてみたい？",
        "category": "もしも",
        "scene": "friends",
        "text": "もし1日だけ透明人間になれたら何をしてみたい？"
      },
      {
        "q": "もし動物と1種類だけ会話できるならどの動物を選ぶ？",
        "category": "もしも",
        "scene": "family",
        "text": "もし動物と1種類だけ会話できるならどの動物を選ぶ？"
      },
      {
        "q": "もし超能力を1つだけ手に入れられるならどんな能力？",
        "category": "もしも",
        "scene": "friends",
        "text": "もし超能力を1つだけ手に入れられるならどんな能力？"
      },
      {
        "q": "もしタイムマシンがあるなら過去と未来どちらに行きたい？",
        "category": "もしも",
        "scene": "friends",
        "text": "もしタイムマシンがあるなら過去と未来どちらに行きたい？"
      },
      {
        "q": "もし性別が1週間だけ入れ替わったら何を体験したい？",
        "category": "もしも",
        "scene": "party",
        "text": "もし性別が1週間だけ入れ替わったら何を体験したい？"
      },
      {
        "q": "もし無人島に誰か1人だけ連れて行くならこの中の誰？",
        "category": "もしも",
        "scene": "friends",
        "text": "もし無人島に誰か1人だけ連れて行くならこの中の誰？"
      },
      {
        "q": "もし明日から別の職業になれるなら何になりたい？",
        "category": "もしも",
        "scene": "work",
        "text": "もし明日から別の職業になれるなら何になりたい？"
      },
      {
        "q": "もし1年間働かなくても生活できるなら何をして過ごす？",
        "category": "もしも",
        "scene": "work",
        "text": "もし1年間働かなくても生活できるなら何をして過ごす？"
      },
      {
        "q": "自分の性格を一言で表すと何？周りからは何て言われる？",
        "category": "本音",
        "scene": "work",
        "text": "自分の性格を一言で表すと何？周りからは何て言われる？"
      },
      {
        "q": "人にはあまり言ってないけど「実はこれ苦手…」なことは？",
        "category": "本音",
        "scene": "friends",
        "text": "人にはあまり言ってないけど「実はこれ苦手…」なことは？"
      },
      {
        "q": "他人の行動で「これだけは地味に許せない」マナーは？",
        "category": "本音",
        "scene": "friends",
        "text": "他人の行動で「これだけは地味に許せない」マナーは？"
      },
      {
        "q": "最近「自分大人になったな…」としみじみ感じた瞬間は？",
        "category": "本音",
        "scene": "work",
        "text": "最近「自分大人になったな…」としみじみ感じた瞬間は？"
      },
      {
        "q": "仕事や学校で今までで一番ピンチだった出来事は？",
        "category": "本音",
        "scene": "work",
        "text": "仕事や学校で今までで一番ピンチだった出来事は？"
      },
      {
        "q": "「これにお金をかけるのだけは惜しまない」というこだわりは？",
        "category": "本音",
        "scene": "friends",
        "text": "「これにお金をかけるのだけは惜しまない」というこだわりは？"
      },
      {
        "q": "初対面の人と仲良くなる時の自分なりのマイルールは？",
        "category": "本音",
        "scene": "work",
        "text": "初対面の人と仲良くなる時の自分なりのマイルールは？"
      },
      {
        "q": "今までの人生で一番怒られたエピソードは何？",
        "category": "本音",
        "scene": "friends",
        "text": "今までの人生で一番怒られたエピソードは何？"
      },
      {
        "q": "友達と遊ぶ時「自分は幹事タイプ？それともついて行く派？」",
        "category": "本音",
        "scene": "friends",
        "text": "友達と遊ぶ時「自分は幹事タイプ？それともついて行く派？」"
      },
      {
        "q": "最近泣いた出来事はある？感動？それとも悔し泣き？",
        "category": "本音",
        "scene": "friends",
        "text": "最近泣いた出来事はある？感動？それとも悔し泣き？"
      },
      {
        "q": "異性のどんな仕草やギャップに思わずキュンとする？",
        "category": "恋愛",
        "scene": "party",
        "text": "異性のどんな仕草やギャップに思わずキュンとする？"
      },
      {
        "q": "恋人や結婚相手にこれだけは絶対に譲れない条件は？",
        "category": "恋愛",
        "scene": "party",
        "text": "恋人や結婚相手にこれだけは絶対に譲れない条件は？"
      },
      {
        "q": "初デートで行くならどこが理想？NGな場所は？",
        "category": "恋愛",
        "scene": "party",
        "text": "初デートで行くならどこが理想？NGな場所は？"
      },
      {
        "q": "好きな人ができたら自分からアプローチする？待つ派？",
        "category": "恋愛",
        "scene": "party",
        "text": "好きな人ができたら自分からアプローチする？待つ派？"
      },
      {
        "q": "「あ、この人自分のこと好きなのかな？」と勘違いしちゃう行動は？",
        "category": "恋愛",
        "scene": "party",
        "text": "「あ、この人自分のこと好きなのかな？」と勘違いしちゃう行動は？"
      },
      {
        "q": "恋人に求めるのは「ドキドキ感」と「安心感」どっちが大事？",
        "category": "恋愛",
        "scene": "party",
        "text": "恋人に求めるのは「ドキドキ感」と「安心感」どっちが大事？"
      },
      {
        "q": "一目惚れしたことある？それともじっくり仲良くなってから？",
        "category": "恋愛",
        "scene": "party",
        "text": "一目惚れしたことある？それともじっくり仲良くなってから？"
      },
      {
        "q": "今だから笑って話せる「過去の恋愛の大失敗」は？",
        "category": "恋愛",
        "scene": "party",
        "text": "今だから笑って話せる「過去の恋愛の大失敗」は？"
      },
      {
        "q": "恋人に毎日連絡したい派？それとも用事がある時だけでいい？",
        "category": "恋愛",
        "scene": "party",
        "text": "恋人に毎日連絡したい派？それとも用事がある時だけでいい？"
      },
      {
        "q": "言われて一番嬉しかった褒め言葉・告白のセリフは？",
        "category": "恋愛",
        "scene": "party",
        "text": "言われて一番嬉しかった褒め言葉・告白のセリフは？"
      },
      {
        "q": "学生時代の黒歴史・今だから笑える痛い思い出は？",
        "category": "ディープ",
        "scene": "friends",
        "text": "学生時代の黒歴史・今だから笑える痛い思い出は？"
      },
      {
        "q": "人生で一番影響を受けた映画や本・アニメ・音楽は？",
        "category": "ディープ",
        "scene": "friends",
        "text": "人生で一番影響を受けた映画や本・アニメ・音楽は？"
      },
      {
        "q": "自分の人生の「ターニングポイント」になった出来事は？",
        "category": "ディープ",
        "scene": "work",
        "text": "自分の人生の「ターニングポイント」になった出来事は？"
      },
      {
        "q": "10年後の自分はどうなっていると思う？どうなっていたい？",
        "category": "ディープ",
        "scene": "work",
        "text": "10年後の自分はどうなっていると思う？どうなっていたい？"
      },
      {
        "q": "今までで一番感謝している人は誰？どんなことをしてもらった？",
        "category": "ディープ",
        "scene": "friends",
        "text": "今までで一番感謝している人は誰？どんなことをしてもらった？"
      },
      {
        "q": "死ぬまでに絶対にやっておきたいバケットリスト1位は？",
        "category": "ディープ",
        "scene": "friends",
        "text": "死ぬまでに絶対にやっておきたいバケットリスト1位は？"
      },
      {
        "q": "過去の自分に1つだけアドバイスできるなら何歳の自分に何と言う？",
        "category": "ディープ",
        "scene": "friends",
        "text": "過去の自分に1つだけアドバイスできるなら何歳の自分に何と言う？"
      },
      {
        "q": "生きていく上で最も大切にしているモットーや座右の銘は？",
        "category": "ディープ",
        "scene": "work",
        "text": "生きていく上で最も大切にしているモットーや座右の銘は？"
      },
      {
        "q": "落ち込んだ時や辛い時に自分を立ち直らせるルーティンは？",
        "category": "ディープ",
        "scene": "friends",
        "text": "落ち込んだ時や辛い時に自分を立ち直らせるルーティンは？"
      },
      {
        "q": "もし人生をもう一度最初からやり直せるならやり直したい？",
        "category": "ディープ",
        "scene": "friends",
        "text": "もし人生をもう一度最初からやり直せるならやり直したい？"
      }
    ],
    "affiliateKeyword": "会話カード 質問カードゲーム",
    "seoSlug": "seo/icebreak-work.html",
    "tips": [
      "答える人はできるだけ『具体的なエピソード（いつ、どこで、誰と）』を話すとトークが弾む！",
      "周りの人は回答を聴くだけでなく、『なんでそうなったの？』『その時どう思った？』と質問を重ねよう。",
      "シーン別に切り替えられるので、初対面の自己紹介から深夜のぶっちゃけトークまで幅広く対応可能！"
    ],
    "section": "main"
  },
  {
    "id": "ng-word",
    "title": "NGワードゲーム (2人対面バトル＆お題ガチャ)",
    "ruby": "えぬじーわーど",
    "icon": "🚫",
    "badge": "誘導心理戦",
    "catchphrase": "相手に言わせたら勝ち！2人対面分割バトル＆多人数向け紙メモ用お題ガチャ両対応",
    "category": "mystery",
    "toolType": "ng-word",
    "minPlayers": 2,
    "maxPlayers": 8,
    "duration": "5〜15分",
    "preparation": "2人はスマホ1台。3〜8人は紙とペンも使用",
    "rating": 4.8,
    "tags": [
      "スマホ1台",
      "心理戦",
      "騙し合い",
      "飲み会",
      "トーク",
      "定番"
    ],
    "overview": "各プレイヤーに「言ったら即脱落のNGワード（例: 『マジで』『それな』『可愛い』）」が配られます。自分以外の全員のNGワードが見えている状態で会話を誘導し、トラップにハメて言わせる心理ゲーム！",
    "rules": [
      {
        "step": "1",
        "title": "NGワードを確認＆セット",
        "desc": "2人なら交代で相手の札を確認。3〜8人なら隣の人の札だけを見て紙に書き、本人に見えないように渡します。札にある言葉のどれかを言ったらアウトです。"
      },
      {
        "step": "2",
        "title": "フリートークで誘導！",
        "desc": "自然な会話をしながら、相手が自分のNGワードを言ってしまうように質問や話題を振ります。"
      },
      {
        "step": "3",
        "title": "言ったら即アウト！",
        "desc": "NGワードを発した瞬間に周りから指摘されて脱落！最後まで残った人が勝者！"
      }
    ],
    "presets": [
      {
        "text": "マジで / やばい / それな",
        "scene": "friends"
      },
      {
        "text": "かわいい / かっこいい / 好き",
        "scene": "party"
      },
      {
        "text": "なるほど / 確かに / そうですね",
        "scene": "work"
      },
      {
        "text": "でも / だって / どうして",
        "scene": "family"
      },
      {
        "text": "知らんけど / 嘘でしょ / ほんとに？",
        "scene": "friends"
      },
      {
        "text": "すごい / ヤバ / 天才",
        "scene": "friends"
      },
      {
        "text": "確かに / そうなんだ / ふーん",
        "scene": "work"
      },
      {
        "text": "知らんけど / たぶん / 絶対",
        "scene": "friends"
      },
      {
        "text": "暑い / 寒い / 眠い",
        "scene": "family"
      },
      {
        "text": "お腹すいた / 美味しい / うまっ",
        "scene": "family"
      },
      {
        "text": "誰？ / どこ？ / いつ？",
        "scene": "party"
      },
      {
        "text": "えーっと / あの / なんか",
        "scene": "work"
      },
      {
        "text": "マジで / ガチで / ほんまに",
        "scene": "friends"
      },
      {
        "text": "無理 / 嫌だ / だるい",
        "scene": "friends"
      },
      {
        "text": "おすすめ / 人気 / 定番",
        "scene": "party"
      },
      {
        "text": "仕事 / 会社 / 上司",
        "scene": "work"
      },
      {
        "text": "お金 / 高い / 安い",
        "scene": "work"
      },
      {
        "text": "今日 / 明日 / 昨日",
        "scene": "family"
      },
      {
        "text": "LINE / インスタ / Twitter",
        "scene": "friends"
      },
      {
        "text": "可愛い / カッコいい / おしゃれ",
        "scene": "party"
      },
      {
        "text": "嘘つき / 信じられない / 冗談",
        "scene": "friends"
      },
      {
        "text": "わかる / 共感 / 同感",
        "scene": "work"
      },
      {
        "text": "スマホ / 充電 / 電池",
        "scene": "friends"
      },
      {
        "text": "ビール / お酒 / 乾杯",
        "scene": "party"
      },
      {
        "text": "ラーメン / カレー / 肉",
        "scene": "family"
      },
      {
        "text": "ゲーム / アニメ / 映画",
        "scene": "friends"
      },
      {
        "text": "休みたい / 帰りたい / 疲れた",
        "scene": "work"
      },
      {
        "text": "秘密 / ナイショ / 言えない",
        "scene": "party"
      },
      {
        "text": "勝ち / 負け / 引き分け",
        "scene": "friends"
      },
      {
        "text": "ありがとう / ごめん / すみません",
        "scene": "work"
      }
    ],
    "affiliateKeyword": "NGワードゲーム ボードゲーム",
    "seoSlug": "seo/ng-word-game-odai.html",
    "tips": [
      "相手に言わせたいあまり、自分が誘導質問で無理をして自分のNGワードを言ってしまうトラップに注意！",
      "「〜だよね？」「最近どう？」とオープンクエスチョンを投げかけて相手に長く話させるとNGワードを引き出しやすい。",
      "相手のNGワードが見えているので、あえてその話題に自然と誘導するチームプレイも熱い！"
    ],
    "section": "main"
  },
  {
    "id": "indian-poker",
    "title": "2人対戦：対面インディアンポーカー",
    "ruby": "いんでぃあんぽーかー",
    "icon": "🎴",
    "badge": "ブラフ心理戦",
    "catchphrase": "スマホを挟んで向かい合え！相手のカードだけが見える究極の心理戦ブラフバトル",
    "category": "mystery",
    "toolType": "indian-poker",
    "minPlayers": 2,
    "maxPlayers": 2,
    "duration": "3〜5分",
    "preparation": "スマホ1台",
    "rating": 4.7,
    "tags": [
      "スマホ1台",
      "心理戦",
      "ブラフ",
      "飲み会",
      "ポーカー",
      "対面",
      "2人対戦"
    ],
    "overview": "スマホを順番に受け取り、相手のカードだけを確認します。画面を伏せて話し合い、相手の表情や言葉から自分の強さを推理して、勝負するか降りるかを決めます。",
    "rules": [
      {
        "step": "1",
        "title": "相手のカードを確認",
        "desc": "1人ずつ相手の数字を見て、伏せてから次の人へ渡します。"
      },
      {
        "step": "2",
        "title": "相手のカードを見て心理戦トーク",
        "desc": "「それ勝負した方がいいよ（笑）」などブラフを仕掛け合います。"
      },
      {
        "step": "3",
        "title": "勝負か降りるかを選択してオープン！",
        "desc": "手を1人ずつ決めてから開示します。両者が勝負ならAが最強で、残りは数字の大きい方が勝ち。同じ数字や両者が降りた場合は0点。双方が勝負したら±2点、片方が降りたら±1点で、3局の合計点を競います。"
      }
    ],
    "affiliateKeyword": "トランプ インディアンポーカー",
    "seoSlug": "seo/drinking-party-games.html",
    "presets": [],
    "tips": [
      "自分の数字が見えないため、周りの視線や表情、相手のベット（強気・弱気）から自分の数字を推理しよう！",
      "Aが最強で、その次はK。相手のカードを見たら、自分の手をどう伝えるか考えてみましょう。",
      "ハッタリ（ブラフ）で弱いカードなのに強気に出て、相手をフォールド（降り）させる心理戦が醍醐味！"
    ],
    "section": "main",
    "isDuo": true
  },
  {
    "id": "one-night-werewolf",
    "title": "ワンナイト人狼 (One Night Werewolf)",
    "ruby": "わんないとじんろう",
    "icon": "🌕",
    "badge": "超高速人狼",
    "catchphrase": "司会者不要！たった一晩で決着がつくスリリングな超高速人狼ゲーム！",
    "category": "mystery",
    "toolType": "one-night-werewolf",
    "minPlayers": 3,
    "maxPlayers": 7,
    "duration": "5〜10分",
    "preparation": "スマホ1台",
    "rating": 5,
    "tags": [
      "スマホ1台",
      "人狼",
      "心理戦",
      "騙し合い",
      "司会不要",
      "定番",
      "神ゲーム"
    ],
    "overview": "スマホを回して夜の役職を確認し、朝は全員で議論します。指差し投票の結果を入力すると、最後の役職と勝利チームが分かります。村人・人狼・占い師・怪盗などの役職が一夜にして交錯する大人気ゲーム。",
    "rules": [
      {
        "step": "1",
        "title": "夜のアクション（スマホを回す）",
        "desc": "順番にスマホを手に取り、自分の役職確認や夜の能力（占い・カード交換）を実行します。"
      },
      {
        "step": "2",
        "title": "朝の議論（3分〜5分）",
        "desc": "全員で「私は占い師でした」「怪盗で人狼を取りました」など推理と嘘の騙し合い！"
      },
      {
        "step": "3",
        "title": "投票で処刑者を決定！",
        "desc": "せーので投票し、最多票の人狼を処刑できれば村人勝利！逃げ切れば人狼勝利！"
      }
    ],
    "affiliateKeyword": "ワンナイト人狼",
    "seoSlug": "seo/large-group-games.html",
    "presets": [],
    "tips": [
      "夜の行動でカードが入れ替わる可能性があるため、自分の役職すら変わっているかもしれない混沌を楽しもう！",
      "怪盗や占師は嘘をつくメリットが少ないですが、人狼はあえて村人の役職を騙って議論を混乱させよう！",
      "時間は3分間！怪しい人を絞り込んでせーので指差し投票だ！"
    ],
    "section": "main"
  },
  {
    "id": "yomibito",
    "title": "詠み人知らず（リレー五七五）",
    "ruby": "よみびとしらず",
    "icon": "📜",
    "badge": "大爆笑創作",
    "catchphrase": "1人5文字ずつ回して書く！奇跡の名句・迷句が誕生する傑作ゲーム！",
    "category": "talk",
    "toolType": "yomibito",
    "minPlayers": 3,
    "maxPlayers": 10,
    "duration": "5〜10分",
    "preparation": "スマホ1台",
    "rating": 5,
    "tags": [
      "スマホ1台",
      "大爆笑",
      "創作",
      "五七五",
      "大喜利",
      "神ゲーム"
    ],
    "overview": "1人目が「上の句（5文字）」、2人目が「中の句（7文字）」、3人目が「下の句（5文字）」を前の文章を見ずに（または直前だけ見て）スマホに入力して回す！最後に完成した句を読み上げると大爆笑必至！",
    "rules": [
      {
        "step": "1",
        "title": "1人目が上の句（5文字）を入力",
        "desc": "例: 「あさおきて」と入力して次へ。"
      },
      {
        "step": "2",
        "title": "2人目が中の句（7文字）を入力",
        "desc": "例: 「らーめんたべたら」と入力して次へ。"
      },
      {
        "step": "3",
        "title": "3人目が下の句（5文字）を入力",
        "desc": "例: 「もうよるだ」と入力。"
      },
      {
        "step": "4",
        "title": "完成した句を一斉オープン！",
        "desc": "感情を込めて朗読し、一番笑えた句に拍手！"
      }
    ],
    "affiliateKeyword": "詠み人知らず ゲーム",
    "seoSlug": "seo/drinking-party-games.html",
    "presets": [],
    "tips": [
      "前後の句を見ずに書くからこそ生まれる、シュールで意味不明な文章の爆笑ギャップが最高！",
      "真面目な美文を狙う人と、日常のくだらない単語を入れる人が混ざると奇跡の名作が生まれます。",
      "完成した俳句はぜひ声に出して朗読し、SNSやLINEでシェアして思い出に残そう！"
    ],
    "section": "main"
  },
  {
    "id": "batsu-roulette",
    "title": "罰ゲームルーレット＆ミッションガチャ",
    "ruby": "ばつげーむるーれっと",
    "icon": "⚡",
    "badge": "パスOK",
    "catchphrase": "負けた人も安心！飲酒・痛み・暴露なしのソフトミッションをルーレットで即決",
    "category": "action",
    "toolType": "batsu-roulette",
    "minPlayers": 2,
    "maxPlayers": 20,
    "duration": "1〜2分",
    "preparation": "スマホ1台",
    "rating": 4.8,
    "tags": [
      "スマホ1台",
      "罰ゲーム",
      "ルーレット",
      "パスOK",
      "安全配慮",
      "短時間"
    ],
    "overview": "飲酒・痛み・個人情報の暴露・第三者への迷惑行為を使わないソフトミッションをランダム抽選。カテゴリを選べて、嫌なお題は理由を言わず何度でもパス・引き直しできます。",
    "rules": [
      {
        "step": "1",
        "title": "カテゴリを選んでルーレット",
        "desc": "声・演技・言葉遊び・ミニチャレンジから、その場に合うカテゴリを選びます。"
      },
      {
        "step": "2",
        "title": "嫌なら理由なしでパス",
        "desc": "少しでもやりたくないお題は、そのまま引き直してOK。説得や強制はしません。"
      },
      {
        "step": "3",
        "title": "本人がOKなら短く挑戦",
        "desc": "30秒〜1分程度で終わる軽いミッションとして楽しみます。"
      }
    ],
    "presets": [
      {
        "category": "声・言い方",
        "text": "ニュースキャスター風に今日の出来事を10秒で話す",
        "scene": "friends"
      },
      {
        "category": "声・言い方",
        "text": "ロボット声で「次は勝ちます」と宣言する",
        "scene": "friends"
      },
      {
        "category": "声・言い方",
        "text": "時代劇風に「参りました」と言う",
        "scene": "friends"
      },
      {
        "category": "声・言い方",
        "text": "実況アナウンサー風に目の前の飲み物を紹介する",
        "scene": "friends"
      },
      {
        "category": "声・言い方",
        "text": "小声で早口言葉を1回言う",
        "scene": "friends"
      },
      {
        "category": "声・言い方",
        "text": "好きな食べ物をCM風に褒める",
        "scene": "friends"
      },
      {
        "category": "声・言い方",
        "text": "今日の天気を大げさに伝える",
        "scene": "friends"
      },
      {
        "category": "声・言い方",
        "text": "動物を1種類選び、その鳴き声を1回だけまねる",
        "scene": "friends"
      },
      {
        "category": "声・言い方",
        "text": "「ありがとう」を3種類の言い方で言う",
        "scene": "friends"
      },
      {
        "category": "声・言い方",
        "text": "架空の必殺技名を1つ発表する",
        "scene": "friends"
      },
      {
        "category": "演技",
        "text": "透明な重い箱を持ち上げる演技を10秒",
        "scene": "friends"
      },
      {
        "category": "演技",
        "text": "映画の予告編っぽい表情を3秒キープ",
        "scene": "friends"
      },
      {
        "category": "演技",
        "text": "宇宙飛行士が無重力で動くまねをする",
        "scene": "friends"
      },
      {
        "category": "演技",
        "text": "眠気と戦う人を無言で演じる",
        "scene": "friends"
      },
      {
        "category": "演技",
        "text": "突然プレゼントをもらった人のリアクション",
        "scene": "friends"
      },
      {
        "category": "演技",
        "text": "猫を見つけた人のリアクション",
        "scene": "friends"
      },
      {
        "category": "演技",
        "text": "すごく熱い食べ物を食べたふり",
        "scene": "friends"
      },
      {
        "category": "演技",
        "text": "宝くじが当たった瞬間を無言で演じる",
        "scene": "friends"
      },
      {
        "category": "演技",
        "text": "透明な壁にぶつかったふり",
        "scene": "friends"
      },
      {
        "category": "演技",
        "text": "スローモーションで拍手を3回する",
        "scene": "friends"
      },
      {
        "category": "言葉・発想",
        "text": "「あ」から始まる褒め言葉を1つ考える",
        "scene": "friends"
      },
      {
        "category": "言葉・発想",
        "text": "目の前の物に新しい商品名を付ける",
        "scene": "friends"
      },
      {
        "category": "言葉・発想",
        "text": "10秒で架空の祝日を1つ作る",
        "scene": "friends"
      },
      {
        "category": "言葉・発想",
        "text": "コンビニに追加してほしい新サービスを1つ考える",
        "scene": "friends"
      },
      {
        "category": "言葉・発想",
        "text": "新しいスポーツ名とルールを一言で作る",
        "scene": "friends"
      },
      {
        "category": "言葉・発想",
        "text": "存在しない映画のタイトルを1つ言う",
        "scene": "friends"
      },
      {
        "category": "言葉・発想",
        "text": "今いる場所のキャッチコピーを作る",
        "scene": "friends"
      },
      {
        "category": "言葉・発想",
        "text": "無人島に持っていく意外な物を1つ選び理由を言う",
        "scene": "friends"
      },
      {
        "category": "言葉・発想",
        "text": "動物2種類を合体させた新生物に名前を付ける",
        "scene": "friends"
      },
      {
        "category": "言葉・発想",
        "text": "100年後にありそうな道具を1つ考える",
        "scene": "friends"
      },
      {
        "category": "ミニチャレンジ",
        "text": "次のゲームのお題を決める係になる",
        "scene": "friends"
      },
      {
        "category": "ミニチャレンジ",
        "text": "次の1ラウンドだけ最初の手番を担当する",
        "scene": "friends"
      },
      {
        "category": "ミニチャレンジ",
        "text": "3択からみんなに次のゲームを選んでもらう",
        "scene": "friends"
      },
      {
        "category": "ミニチャレンジ",
        "text": "利き手と逆の手で自分の名前を空中に書く",
        "scene": "friends"
      },
      {
        "category": "ミニチャレンジ",
        "text": "10秒以内に赤い物を3つ見つける",
        "scene": "friends"
      },
      {
        "category": "ミニチャレンジ",
        "text": "その場にある丸い物を2つ探す",
        "scene": "friends"
      },
      {
        "category": "ミニチャレンジ",
        "text": "5秒間だけ目を閉じて10秒を予想する",
        "scene": "friends"
      },
      {
        "category": "ミニチャレンジ",
        "text": "次のゲームのスタート合図を担当する",
        "scene": "friends"
      },
      {
        "category": "ミニチャレンジ",
        "text": "全員におすすめのお菓子を1つ教える",
        "scene": "friends"
      },
      {
        "category": "ミニチャレンジ",
        "text": "「次こそ勝つ」ポーズを1つ決める",
        "scene": "friends"
      }
    ],
    "affiliateKeyword": "罰ゲーム トランプ ルーレット",
    "seoSlug": "seo/batsu-game-list.html",
    "tips": [
      "誰も傷つかない、場の空気が明るくなるソフトなミッションを厳選しています。",
      "少しでもやりたくないお題は、理由を言わず何度でもパス・引き直しOKです。"
    ],
    "section": "U"
  },
  {
    "id": "rhythm-box",
    "section": "main",
    "title": "バラエティ・リズムボックス (古今東西・マジカルバナナ・ドレミ)",
    "ruby": "ばらえてぃ・りずむぼっくす",
    "icon": "🎵",
    "badge": "定番リズム",
    "catchphrase": "手拍子＆テンポ音に合わせて即答！古今東西・マジカルバナナ・ドレミの歌の3大人気リズムゲームが集結！",
    "category": "action",
    "toolType": "rhythm-box",
    "minPlayers": 2,
    "maxPlayers": 99,
    "duration": "3〜5分",
    "preparation": "スマホ1台",
    "rating": 5,
    "tags": [
      "スマホ1台",
      "2人〜",
      "リズム",
      "飲み会",
      "定番",
      "手ぶら",
      "大人数",
      "アイスブレイク"
    ],
    "overview": "「山手線ゲーム（古今東西）」「マジカルバナナ」「ドレミの歌」の3大人気リズムゲームを1つのゲームマスターツールに集約！手拍子・テンポ音（BPM変更対応）やお題自動抽選、ピアノ音階再生機能で、飲み会・ドライブ・暇つぶしを盛り上げます。",
    "rules": [
      {
        "step": "1",
        "title": "遊びたいリズムゲームを選択！",
        "desc": "「山手線ゲーム（古今東西）」「マジカルバナナ」「ドレミの歌」から好きなモードを選びます。"
      },
      {
        "step": "2",
        "title": "テンポ（BPM）をセットしてリズムスタート！",
        "desc": "参加者のレベルに合わせてテンポを選び、スタートボタンを押して手拍子やBGMを鳴らします。"
      },
      {
        "step": "3",
        "title": "リズムに合わせて順番に回答・歌唱！",
        "desc": "山手線はお題に沿った単語、マジカルバナナは連想ワード、ドレミの歌は指定された音階のフレーズをリズムよく返します。"
      },
      {
        "step": "4",
        "title": "詰まったり噛んだらアウト！",
        "desc": "リズムに乗れなかったり、言葉が出なかった人はアウト！罰ゲームルーレットで楽しくミッションを決めよう！"
      }
    ],
    "tips": [
      "最初はBPM80〜90のゆったりテンポで慣れて、徐々にテンポアップ（120〜140）すると大爆笑！",
      "マジカルバナナは前の人の言葉をしっかり復唱するのがリズムキープのコツ！",
      "ドレミの歌は音階ボタンで実際の音階を確認できるので音痴防止にも大活躍！"
    ],
    "presets": [
      {
        "text": "日本の駅名 (山手線・新幹線など)",
        "scene": "family"
      },
      {
        "text": "ジブリ・ディズニーのアニメ映画タイトル",
        "scene": "friends"
      },
      {
        "text": "居酒屋で頼める飲み物・お酒",
        "scene": "party"
      },
      {
        "text": "コンビニのおにぎりの具材",
        "scene": "family"
      },
      {
        "text": "マクドナルドのメニュー",
        "scene": "family"
      },
      {
        "text": "日本の歴代総理大臣・戦国武将",
        "scene": "work"
      },
      {
        "text": "居酒屋のスピードメニュー・定番おつまみ",
        "scene": "party"
      },
      {
        "text": "少年ジャンプの歴代人気アニメ・漫画",
        "scene": "friends"
      },
      {
        "text": "任天堂（マリオ、ポケモン、ゼルダ等）のゲームキャラ",
        "scene": "friends"
      },
      {
        "text": "日本の都道府県庁所在地",
        "scene": "work"
      },
      {
        "text": "スターバックスのメニュー（ドリンク・フード）",
        "scene": "party"
      },
      {
        "text": "ディズニーランド・シーのアトラクション",
        "scene": "friends"
      },
      {
        "text": "コンビニのホットスナック・お惣菜",
        "scene": "family"
      },
      {
        "text": "カラオケで盛り上がる定番ソング（アニソン・J-POP）",
        "scene": "party"
      },
      {
        "text": "ファミレス（ガスト、サイゼリヤ等）の人気メニュー",
        "scene": "family"
      },
      {
        "text": "有名なお笑い芸人・コンビ名",
        "scene": "party"
      },
      {
        "text": "焼肉の部位・ホルモンの種類",
        "scene": "party"
      },
      {
        "text": "世界の国名とその首都",
        "scene": "work"
      },
      {
        "text": "映画『ハリー・ポッター』の呪文・キャラクター",
        "scene": "friends"
      },
      {
        "text": "日本の祝日・年中行事",
        "scene": "family"
      },
      {
        "text": "回転寿司のネタ（魚・創作寿司・デザート）",
        "scene": "family"
      },
      {
        "text": "動物園・水族館の人気動物",
        "scene": "family"
      },
      {
        "text": "オリンピックの正式競技種目",
        "scene": "work"
      },
      {
        "text": "プロ野球の球団名または歴代名選手",
        "scene": "friends"
      },
      {
        "text": "文房具・オフィス用品の名前",
        "scene": "work"
      },
      {
        "text": "家電製品・キッチン家電の名前",
        "scene": "family"
      },
      {
        "text": "有名な戦国武将・歴史上の偉人",
        "scene": "work"
      },
      {
        "text": "アイスクリームのフレーバー・人気商品",
        "scene": "family"
      },
      {
        "text": "日本の世界遺産（富士山、屋久島など）",
        "scene": "work"
      },
      {
        "text": "無印良品やニトリの便利グッズ",
        "scene": "party"
      },
      {
        "text": "バナナ",
        "scene": "family"
      },
      {
        "text": "りんご",
        "scene": "family"
      },
      {
        "text": "海",
        "scene": "friends"
      },
      {
        "text": "学校",
        "scene": "friends"
      },
      {
        "text": "ラーメン",
        "scene": "friends"
      },
      {
        "text": "飛行機",
        "scene": "family"
      },
      {
        "text": "おばけ",
        "scene": "friends"
      },
      {
        "text": "スマートフォン",
        "scene": "friends"
      },
      {
        "text": "カレーライス",
        "scene": "family"
      },
      {
        "text": "遊園地",
        "scene": "friends"
      },
      {
        "text": "猫（ねこ）",
        "scene": "family"
      },
      {
        "text": "新幹線",
        "scene": "family"
      },
      {
        "text": "アイスクリーム",
        "scene": "family"
      },
      {
        "text": "太陽",
        "scene": "friends"
      },
      {
        "text": "雪だるま",
        "scene": "family"
      },
      {
        "text": "チョコレート",
        "scene": "family"
      },
      {
        "text": "ハンバーガー",
        "scene": "friends"
      },
      {
        "text": "キャンプ",
        "scene": "friends"
      },
      {
        "text": "警察官",
        "scene": "friends"
      },
      {
        "text": "忍者（にんじゃ）",
        "scene": "family"
      },
      {
        "text": "宇宙人",
        "scene": "friends"
      },
      {
        "text": "恐竜",
        "scene": "family"
      },
      {
        "text": "お祭り",
        "scene": "friends"
      },
      {
        "text": "花火",
        "scene": "friends"
      },
      {
        "text": "富士山",
        "scene": "family"
      },
      {
        "text": "温泉",
        "scene": "friends"
      },
      {
        "text": "映画館",
        "scene": "friends"
      },
      {
        "text": "水族館",
        "scene": "family"
      },
      {
        "text": "お寿司",
        "scene": "family"
      },
      {
        "text": "居酒屋",
        "scene": "party"
      },
      {
        "text": "ビール",
        "scene": "party"
      },
      {
        "text": "合コン",
        "scene": "party"
      },
      {
        "text": "カラオケ",
        "scene": "party"
      },
      {
        "text": "宝くじ",
        "scene": "party"
      },
      {
        "text": "無人島",
        "scene": "friends"
      },
      {
        "text": "ゾンビ",
        "scene": "friends"
      },
      {
        "text": "魔法使い",
        "scene": "family"
      },
      {
        "text": "タイムマシン",
        "scene": "friends"
      },
      {
        "text": "ダイヤモンド",
        "scene": "party"
      },
      {
        "text": "クリスマス",
        "scene": "family"
      },
      {
        "text": "お正月",
        "scene": "family"
      },
      {
        "text": "運動会",
        "scene": "family"
      },
      {
        "text": "ピザ",
        "scene": "friends"
      },
      {
        "text": "お化け屋敷",
        "scene": "friends"
      },
      {
        "text": "ジェットコースター",
        "scene": "friends"
      },
      {
        "text": "パトカー",
        "scene": "family"
      },
      {
        "text": "消防車",
        "scene": "family"
      },
      {
        "text": "ケーキ",
        "scene": "family"
      },
      {
        "text": "ドラえもん",
        "scene": "family"
      },
      {
        "text": "ピカチュウ",
        "scene": "family"
      }
    ]
  },
  {
    "id": "yamanote-game",
    "title": "山手線ゲーム (古今東西) ＆ リズムマシーン",
    "ruby": "やまのてげーむ",
    "icon": "🚃",
    "badge": "リズムツール付",
    "catchphrase": "手拍子BPM音とお題ガチャ付き！リズムに乗ってお題を答える王道ゲーム！",
    "category": "action",
    "toolType": "yamanote",
    "minPlayers": 2,
    "maxPlayers": 20,
    "duration": "3〜10分",
    "preparation": "スマホ1台",
    "rating": 4.8,
    "tags": [
      "スマホ1台",
      "リズム",
      "手拍子",
      "定番",
      "飲み会",
      "古今東西"
    ],
    "overview": "パンパンとリズムを刻む手拍子マシンを搭載！お題ガチャ（都道府県、ジブリ作品、居酒屋メニュー等）を引き、BPMテンポアップ機能でどんどん難易度が上がる超快適仕様！",
    "rules": [
      {
        "step": "1",
        "title": "お題とテンポをスタート",
        "desc": "お題を引き、リズムマシン（手拍子）を鳴らします。"
      },
      {
        "step": "2",
        "title": "リズムに合わせて回答",
        "desc": "「パンパン（手拍子）→『東京！』→パンパン→『神奈川！』」と順番に答えます。"
      },
      {
        "step": "3",
        "title": "詰まる・被ったら脱落！",
        "desc": "リズムに乗れなかったり重複したらアウト！"
      }
    ],
    "presets": [
      {
        "text": "日本の駅名 (山手線・新幹線など)",
        "scene": "family"
      },
      {
        "text": "ジブリ・ディズニーのアニメ映画タイトル",
        "scene": "friends"
      },
      {
        "text": "居酒屋で頼める飲み物・お酒",
        "scene": "party"
      },
      {
        "text": "コンビニのおにぎりの具材",
        "scene": "family"
      },
      {
        "text": "マクドナルドのメニュー",
        "scene": "family"
      },
      {
        "text": "日本の歴代総理大臣・戦国武将",
        "scene": "work"
      },
      {
        "text": "居酒屋のスピードメニュー・定番おつまみ",
        "scene": "party"
      },
      {
        "text": "少年ジャンプの歴代人気アニメ・漫画",
        "scene": "friends"
      },
      {
        "text": "任天堂（マリオ、ポケモン、ゼルダ等）のゲームキャラ",
        "scene": "friends"
      },
      {
        "text": "日本の都道府県庁所在地",
        "scene": "work"
      },
      {
        "text": "スターバックスのメニュー（ドリンク・フード）",
        "scene": "party"
      },
      {
        "text": "ディズニーランド・シーのアトラクション",
        "scene": "friends"
      },
      {
        "text": "コンビニのホットスナック・お惣菜",
        "scene": "family"
      },
      {
        "text": "カラオケで盛り上がる定番ソング（アニソン・J-POP）",
        "scene": "party"
      },
      {
        "text": "ファミレス（ガスト、サイゼリヤ等）の人気メニュー",
        "scene": "family"
      },
      {
        "text": "有名なお笑い芸人・コンビ名",
        "scene": "party"
      },
      {
        "text": "焼肉の部位・ホルモンの種類",
        "scene": "party"
      },
      {
        "text": "世界の国名とその首都",
        "scene": "work"
      },
      {
        "text": "映画『ハリー・ポッター』の呪文・キャラクター",
        "scene": "friends"
      },
      {
        "text": "日本の祝日・年中行事",
        "scene": "family"
      },
      {
        "text": "回転寿司のネタ（魚・創作寿司・デザート）",
        "scene": "family"
      },
      {
        "text": "動物園・水族館の人気動物",
        "scene": "family"
      },
      {
        "text": "オリンピックの正式競技種目",
        "scene": "work"
      },
      {
        "text": "プロ野球の球団名または歴代名選手",
        "scene": "friends"
      },
      {
        "text": "文房具・オフィス用品の名前",
        "scene": "work"
      },
      {
        "text": "家電製品・キッチン家電の名前",
        "scene": "family"
      },
      {
        "text": "有名な戦国武将・歴史上の偉人",
        "scene": "work"
      },
      {
        "text": "アイスクリームのフレーバー・人気商品",
        "scene": "family"
      },
      {
        "text": "日本の世界遺産（富士山、屋久島など）",
        "scene": "work"
      },
      {
        "text": "無印良品やニトリの便利グッズ",
        "scene": "party"
      }
    ],
    "affiliateKeyword": "山手線ゲーム カードゲーム",
    "seoSlug": "seo/drinking-party-games.html",
    "tips": [
      "手拍子のリズムマシンに合わせてテンポよく答えるのがルール！リズムに乗り遅れたらアウト！",
      "マニアックな回答を狙いすぎて詰まるより、王道の回答を素早く出す方が生き残りやすい。",
      "BPM（テンポ）を少しずつ上げていくとパニック度が急上昇して大爆笑に！"
    ],
    "section": "merged"
  },
  {
    "id": "stand-up-game",
    "title": "指スマ / いっせーのせ (親番＆コールアシスト)",
    "ruby": "ゆびすま",
    "icon": "👍",
    "badge": "親番アシスト付",
    "catchphrase": "「いっせーのーで、3！」上がった親指の数をピッタリ当てて脱出せよ！",
    "category": "action",
    "toolType": "stand-up",
    "minPlayers": 2,
    "maxPlayers": 8,
    "duration": "2〜5分",
    "preparation": "スマホ1台",
    "rating": 4.7,
    "tags": [
      "親番ルーレット",
      "定番",
      "手軽",
      "学校",
      "飲み会"
    ],
    "overview": "両手（または片手）の親指を立てる数を当てる伝統ゲーム！ツールが親番順・残っている指の合計最大数を自動計算し、コール音とともに判定をサポート！",
    "rules": [
      {
        "step": "1",
        "title": "親がコールする",
        "desc": "親が「いっせーのーで、〇！」と数字を叫びます。"
      },
      {
        "step": "2",
        "title": "全員が0本〜2本の指を立てる",
        "desc": "コールと同時に各自好きな本数の親指を上げます。"
      },
      {
        "step": "3",
        "title": "当たったら片手抜け！",
        "desc": "合計本数がコールと一致したら片手を引っ込め、両手抜けたら勝ち！"
      }
    ],
    "affiliateKeyword": "パーティーゲーム 定番",
    "seoSlug": "seo/drinking-party-games.html",
    "presets": [],
    "tips": [
      "「いっせーの、2！」など、親のコールと全員の上がった親指の合計数が一致したら勝ち抜ける伝統ゲーム！",
      "相手の癖（コールする時に自分も指を上げがち、など）を見抜くと的中率が上がります。",
      "残り2人になった時の心理戦とスピード感が一番の盛り上がりポイント！"
    ],
    "section": "C"
  },
  {
    "id": "ping-pong-pang",
    "title": "ピンポンパンゲーム (テンポアップマシン)",
    "ruby": "ぴんぽんぱん",
    "icon": "🏓",
    "badge": "爆速リズム付",
    "catchphrase": "ピン！ポン！パン！指名された人が次のピン！テンポアップについて来れるか？",
    "category": "action",
    "toolType": "ping-pong",
    "minPlayers": 3,
    "maxPlayers": 15,
    "duration": "2〜5分",
    "preparation": "スマホ1台",
    "rating": 4.7,
    "tags": [
      "リズムマシン",
      "反射神経",
      "飲み会",
      "宴会",
      "定番"
    ],
    "overview": "「ピン（1人目）」「ポン（2人目）」「パン（3人目＋誰かを指差し）」のコンボを続けるリズムゲーム！テンポが徐々に加速するBGMアシスト搭載！",
    "rules": [
      {
        "step": "1",
        "title": "1人目がリズムに乗って『ピン！』",
        "desc": "手拍子のリズムに合わせて最初のプレイヤーが『ピン！』とコール。"
      },
      {
        "step": "2",
        "title": "時計回りに『ポン！』➔『パン！』",
        "desc": "次の人が『ポン！』、その次の人が『パン！』と言いながら誰かを勢いよく指差します。"
      },
      {
        "step": "3",
        "title": "指された人が即座に『ピン！』でループ再開！",
        "desc": "指名された人は1秒以内に『ピン！』とコールして再開。テンポが崩れたり言葉を間違えたらアウト！"
      },
      {
        "step": "4",
        "title": "テンポアップで限界バトル！",
        "desc": "回数を重ねるごとにスピードアップ！最後までミスせず生き残った人の勝利！"
      }
    ],
    "affiliateKeyword": "リズムゲーム パーティー",
    "seoSlug": "seo/camp-bbq.html",
    "presets": [],
    "tips": [
      "『ピン』➔『ポン』➔『パン！（誰かを指名）』のリズムを淀みなく続ける反射神経ゲーム！",
      "指名された人が次の『ピン』になるので、油断している人を狙い撃ちにするのが鉄則！",
      "テンポが速くなるにつれて、指名されたのに気づかなかったり言い間違えたりするハプニングが続出！"
    ],
    "section": "C"
  },
  {
    "id": "takenoko-nyokki",
    "title": "たけのこニョッキ (掛け声カウンター)",
    "ruby": "たけのこのっき",
    "icon": "🎋",
    "badge": "カウンター付",
    "catchphrase": "「1ニョッキ！」「2ニョッキ！」被ったら即アウトの空気読みバトル！",
    "category": "action",
    "toolType": "takenoko",
    "minPlayers": 3,
    "maxPlayers": 12,
    "duration": "2〜5分",
    "preparation": "スマホ1台",
    "rating": 4.8,
    "tags": [
      "空気読み",
      "心理戦",
      "定番",
      "飲み会",
      "ツール付"
    ],
    "overview": "「たけのこたけのこニョッキッキ！」の合図でスタート。1人ずつ順番に数字を宣言して立ち上がります。2人以上が同時にコールするか、最後まで残ってしまった人が負け！",
    "rules": [
      {
        "step": "1",
        "title": "合図でスタート",
        "desc": "参加人数を選び、全員で「たけのこたけのこニョッキッキ！」と声を合わせます。"
      },
      {
        "step": "2",
        "title": "空気を読んでニョッキ！",
        "desc": "タイミングを見計らって「1ニョッキ！」「2ニョッキ！」と宣言。"
      },
      {
        "step": "3",
        "title": "被り・ラストが負け！",
        "desc": "1人だけなら数字を記録します。声が重なったら「被った！」で終了。最後の1人まで残っても負けです。"
      }
    ],
    "affiliateKeyword": "パーティーゲーム 定番",
    "seoSlug": "seo/themepark-waiting.html",
    "presets": [],
    "tips": [
      "「1ニョッキ！」「2ニョッキ！」と誰とも合図なしに宣言していく、空気読みと直感のゲーム！",
      "他の人と宣言が被ったら即アウト！最後まで残ってしまってもアウト！",
      "お互いの目線や呼吸を読み合い、誰も言わない隙間を狙って飛び込むスリルがたまらない！"
    ],
    "section": "C"
  },
  {
    "id": "high-and-low-guess",
    "title": "数当てゲーム (High & Low / 1〜1000)",
    "ruby": "すうあてげーむ",
    "icon": "📈",
    "badge": "数当てツール付",
    "catchphrase": "1〜1000の隠された数字を当てろ！「もっと上」「もっと下」で絞り込む推理戦！",
    "category": "mystery",
    "toolType": "high-low",
    "minPlayers": 2,
    "maxPlayers": 10,
    "duration": "3〜5分",
    "preparation": "スマホ1台",
    "rating": 4.6,
    "tags": [
      "数当て",
      "推理",
      "手軽",
      "ツール付"
    ],
    "overview": "スマホが1〜1000の数字を秘密裏に生成。プレイヤーが数字をコールするたびに「HIGH（もっと下）」か「LOW（もっと上）」かを自動判定＆履歴ログを記録！最小回数で当てた人の勝ち！",
    "rules": [
      {
        "step": "1",
        "title": "難易度（範囲）を選択してスタート",
        "desc": "サクッと遊べる「1〜100」または激ムズの「1〜1000」を選択。ツールが秘密の数字をランダム設定！"
      },
      {
        "step": "2",
        "title": "順番に数字を予想してコール＆入力",
        "desc": "プレイヤーは順番に数字をコールし入力。「もっと上！(LOW)」「もっと下！(HIGH)」の判定を見て絞り込みます。"
      },
      {
        "step": "3",
        "title": "絞り込まれた範囲から見事ズバリ的中！",
        "desc": "コール回数が記録されます。最小手数で当てた人の勝利！対戦モードなら当ててしまった人が負けルールもおすすめ！"
      }
    ],
    "affiliateKeyword": "数字当てゲーム ボードゲーム",
    "seoSlug": "seo/travel-car-games.html",
    "presets": [],
    "tips": [
      "1〜100（または1〜1000）の数字を二分探索（半分ずつ絞り込む）するのが最速クリアの定石！",
      "「大きすぎる」「小さすぎる」のヒントを頼りに、最小手数で正解を当てよう！",
      "出題者を決めて質問形式で当てる対人戦にしても白熱します。"
    ],
    "section": "C"
  },
  {
    "id": "magical-banana",
    "title": "マジカルバナナ (連想リズムマシン)",
    "ruby": "まじかるばなな",
    "icon": "🍌",
    "badge": "連想BGM付",
    "catchphrase": "「バナナといったら黄色！」「黄色といったらレモン！」伝説の連想ゲーム！",
    "category": "talk",
    "toolType": "magical-banana",
    "minPlayers": 2,
    "maxPlayers": 15,
    "duration": "3〜8分",
    "preparation": "スマホ1台",
    "rating": 4.8,
    "tags": [
      "連想",
      "リズム",
      "定番",
      "テレビ番組",
      "大人気"
    ],
    "overview": "あの伝説の番組のリズムを再現！「〇〇といったら△△」のお題提案やお助けワード機能付きで、子供から大人まで白熱！",
    "rules": [
      {
        "step": "1",
        "title": "手拍子リズムマシンをスタート！",
        "desc": "「パンパン！」と手拍子を2回鳴らし、「マジカルバナナ！〇〇といったら△△！」とコールして開始。"
      },
      {
        "step": "2",
        "title": "時計回りに前の言葉から連想して繋げる",
        "desc": "「黄色といったらレモン！」「レモンといったら酸っぱい！」とリズムを止めずにテンポ良く連想！"
      },
      {
        "step": "3",
        "title": "詰まる・被る・連想が無理ならアウト！",
        "desc": "手拍子のリズムからズレたり、すでに出た言葉を言ったり、全員が納得できない連想なら脱落！"
      },
      {
        "step": "4",
        "title": "最後まで生き残った人が勝ち！",
        "desc": "お題ガチャでいつでも新しいスタート単語を引いて何回でも遊べます。"
      }
    ],
    "affiliateKeyword": "連想ゲーム ボードゲーム",
    "seoSlug": "seo/travel-car-games.html",
    "presets": [
      {
        "text": "バナナ",
        "scene": "family"
      },
      {
        "text": "りんご",
        "scene": "family"
      },
      {
        "text": "海",
        "scene": "friends"
      },
      {
        "text": "学校",
        "scene": "friends"
      },
      {
        "text": "ラーメン",
        "scene": "friends"
      },
      {
        "text": "飛行機",
        "scene": "family"
      },
      {
        "text": "おばけ",
        "scene": "friends"
      },
      {
        "text": "スマートフォン",
        "scene": "friends"
      },
      {
        "text": "カレーライス",
        "scene": "family"
      },
      {
        "text": "遊園地",
        "scene": "friends"
      },
      {
        "text": "猫（ねこ）",
        "scene": "family"
      },
      {
        "text": "新幹線",
        "scene": "family"
      },
      {
        "text": "アイスクリーム",
        "scene": "family"
      },
      {
        "text": "太陽",
        "scene": "friends"
      },
      {
        "text": "雪だるま",
        "scene": "family"
      },
      {
        "text": "チョコレート",
        "scene": "family"
      },
      {
        "text": "ハンバーガー",
        "scene": "friends"
      },
      {
        "text": "キャンプ",
        "scene": "friends"
      },
      {
        "text": "警察官",
        "scene": "friends"
      },
      {
        "text": "忍者（にんじゃ）",
        "scene": "family"
      },
      {
        "text": "宇宙人",
        "scene": "friends"
      },
      {
        "text": "恐竜",
        "scene": "family"
      },
      {
        "text": "お祭り",
        "scene": "friends"
      },
      {
        "text": "花火",
        "scene": "friends"
      },
      {
        "text": "富士山",
        "scene": "family"
      },
      {
        "text": "温泉",
        "scene": "friends"
      },
      {
        "text": "映画館",
        "scene": "friends"
      },
      {
        "text": "水族館",
        "scene": "family"
      },
      {
        "text": "お寿司",
        "scene": "family"
      },
      {
        "text": "居酒屋",
        "scene": "party"
      },
      {
        "text": "ビール",
        "scene": "party"
      },
      {
        "text": "合コン",
        "scene": "party"
      },
      {
        "text": "カラオケ",
        "scene": "party"
      },
      {
        "text": "宝くじ",
        "scene": "party"
      },
      {
        "text": "無人島",
        "scene": "friends"
      },
      {
        "text": "ゾンビ",
        "scene": "friends"
      },
      {
        "text": "魔法使い",
        "scene": "family"
      },
      {
        "text": "タイムマシン",
        "scene": "friends"
      },
      {
        "text": "ダイヤモンド",
        "scene": "party"
      },
      {
        "text": "クリスマス",
        "scene": "family"
      },
      {
        "text": "お正月",
        "scene": "family"
      },
      {
        "text": "運動会",
        "scene": "family"
      },
      {
        "text": "ピザ",
        "scene": "friends"
      },
      {
        "text": "お化け屋敷",
        "scene": "friends"
      },
      {
        "text": "ジェットコースター",
        "scene": "friends"
      },
      {
        "text": "パトカー",
        "scene": "family"
      },
      {
        "text": "消防車",
        "scene": "family"
      },
      {
        "text": "ケーキ",
        "scene": "family"
      },
      {
        "text": "ドラえもん",
        "scene": "family"
      },
      {
        "text": "ピカチュウ",
        "scene": "family"
      }
    ],
    "tips": [
      "「バナナといったら黄色！」「黄色といったらレモン！」とリズムに乗って連想を繋げる定番ゲーム！",
      "連想の理由が無理やりすぎたり、リズムから外れたりしたらアウト！",
      "「それ連想できる！？」というギリギリの回答が出た時にみんなで審議する時間が一番楽しい！"
    ],
    "section": "merged"
  },
  {
    "id": "twenty-questions",
    "title": "20の扉 (20 Questions ログボード)",
    "ruby": "にじゅうのとびら",
    "icon": "🚪",
    "badge": "質問管理付",
    "catchphrase": "20回以内の質問で正解に辿り着け！Yes/Noの回答を記録する本格推理ボード！",
    "category": "mystery",
    "toolType": "twenty-questions",
    "minPlayers": 2,
    "maxPlayers": 10,
    "duration": "5〜15分",
    "preparation": "スマホ1台",
    "rating": 4.7,
    "tags": [
      "20の扉",
      "推理",
      "質問ログ",
      "便利ツール"
    ],
    "overview": "出題者が隠した言葉を、20回以内の「はい／いいえ」で答えられる質問で当てる知的ゲーム。ツールが残り質問数とYES・NO・関係なしの回答履歴を記録し、何問使ったかを見失わずに進行できます。",
    "rules": [
      {
        "step": "1",
        "title": "出題者が秘密の答えを決める",
        "desc": "自分で決めるか、端末でお題を引いて出題者だけが確認します。回答を記録した後にお題を引き直すと新しい局になります。"
      },
      {
        "step": "2",
        "title": "質問ごとに回答を記録",
        "desc": "YES・NO・関係なしのボタンを押すたび、残り質問数と回答履歴が更新されます。"
      },
      {
        "step": "3",
        "title": "20回以内に答えを当てる",
        "desc": "質問文そのものは保存されないため、必要なら口頭や別メモで管理します。"
      }
    ],
    "affiliateKeyword": "水平思考 クイズ 本",
    "seoSlug": "seo/detective-mystery.html",
    "presets": [
      {
        "text": "冷蔵庫（家電・生活用品）",
        "scene": "family"
      },
      {
        "text": "ライオン（動物・生き物）",
        "scene": "family"
      },
      {
        "text": "カレーライス（食べ物）",
        "scene": "family"
      },
      {
        "text": "スマートフォン（電子機器）",
        "scene": "friends"
      },
      {
        "text": "富士山（日本の名所・山）",
        "scene": "family"
      },
      {
        "text": "新幹線（乗り物）",
        "scene": "family"
      },
      {
        "text": "ドラえもん（キャラクター）",
        "scene": "family"
      },
      {
        "text": "歯ブラシ（日用品）",
        "scene": "family"
      },
      {
        "text": "扇風機（家電）",
        "scene": "family"
      },
      {
        "text": "おにぎり（食べ物）",
        "scene": "family"
      },
      {
        "text": "ピカチュウ（キャラクター）",
        "scene": "family"
      },
      {
        "text": "東京スカイツリー（建築物）",
        "scene": "friends"
      },
      {
        "text": "信号機（街の設備）",
        "scene": "family"
      },
      {
        "text": "消しゴム（文房具）",
        "scene": "family"
      },
      {
        "text": "傘（かさ・雨具）",
        "scene": "family"
      },
      {
        "text": "キリン（動物）",
        "scene": "family"
      },
      {
        "text": "ペンギン（鳥類・水族館）",
        "scene": "family"
      },
      {
        "text": "ラーメン（食べ物・麺類）",
        "scene": "friends"
      },
      {
        "text": "ハサミ（刃物・文具）",
        "scene": "family"
      },
      {
        "text": "時計・腕時計（装飾品・道具）",
        "scene": "friends"
      },
      {
        "text": "自転車（乗り物）",
        "scene": "family"
      },
      {
        "text": "飛行機（航空機・乗り物）",
        "scene": "family"
      },
      {
        "text": "クジラ（海洋生物）",
        "scene": "family"
      },
      {
        "text": "スプーン（食器）",
        "scene": "family"
      },
      {
        "text": "ティッシュペーパー（消耗品）",
        "scene": "family"
      },
      {
        "text": "メガネ・眼鏡（装飾・視覚補助具）",
        "scene": "friends"
      },
      {
        "text": "電子レンジ（調理家電）",
        "scene": "family"
      },
      {
        "text": "サッカーボール（スポーツ用品）",
        "scene": "family"
      },
      {
        "text": "ギター（楽器）",
        "scene": "friends"
      },
      {
        "text": "ピアノ（大型楽器）",
        "scene": "family"
      },
      {
        "text": "チョコレート（お菓子・スイーツ）",
        "scene": "family"
      },
      {
        "text": "ビール（アルコール・飲み物）",
        "scene": "party"
      },
      {
        "text": "ポスト（郵便受け・街頭設備）",
        "scene": "family"
      },
      {
        "text": "鏡（日用品・家具）",
        "scene": "family"
      },
      {
        "text": "枕（寝具）",
        "scene": "family"
      }
    ],
    "tips": [
      "出題者への質問は20回まで！序盤は『生き物ですか？』『食べられますか？』と大きな分類から絞ろう！",
      "『家の中にありますか？』『1000円以内で買えますか？』など日常的な範囲を攻めるのがコツ。",
      "質問可能回数が残り少なくなってきた時の緊張感と、ひらめきでズバリ正解した時の快感は格別！"
    ],
    "section": "C"
  },
  {
    "id": "good-and-bad-news",
    "title": "良いニュースと悪いニュース (お題ガチャ付)",
    "ruby": "いいにゅーすとわるいにゅーす",
    "icon": "📰",
    "badge": "大喜利ツール付",
    "catchphrase": "「良いニュースは宝くじが当たったこと。悪いニュースは全額落としたこと。」",
    "category": "talk",
    "toolType": "good-bad-news",
    "minPlayers": 2,
    "maxPlayers": 10,
    "duration": "5〜10分",
    "preparation": "スマホ1台",
    "rating": 4.6,
    "tags": [
      "大喜利",
      "即興",
      "トーク",
      "発想力"
    ],
    "overview": "前の人の発言を受けて「良いニュース」と「悪いニュース」を交互に即興で繰り出すストーリーテリングゲーム！シチュエーションお題ガチャ付き！",
    "rules": [
      {
        "step": "1",
        "title": "導入シチュエーションをお題ガチャで引く",
        "desc": "「無人島に漂着した」「宝くじで1億円当たった」など、物語のオープニングとなるお題を決定。"
      },
      {
        "step": "2",
        "title": "1人目が『良いニュース』を即興で語る",
        "desc": "「良いニュースは、綺麗な真水の湧き水が見つかったことです！」とポジティブな展開を繋げます。"
      },
      {
        "step": "3",
        "title": "次の人が『しかし悪いニュースは…』と受ける",
        "desc": "「しかし悪いニュースは、その泉に巨大なワニが棲みついていたことです！」とハプニングを投下！"
      },
      {
        "step": "4",
        "title": "交互にニュースを語り合ってオチをつける！",
        "desc": "テンポよくアドリブでストーリーを転がし、大爆笑のオチを目指して物語を完結させよう！"
      }
    ],
    "affiliateKeyword": "大喜利 カードゲーム",
    "seoSlug": "seo/sleepover-night.html",
    "presets": [
      {
        "text": "無人島に漂着した",
        "scene": "friends"
      },
      {
        "text": "宝くじで1等10億円が当たった",
        "scene": "party"
      },
      {
        "text": "明日から会社の社長に就任した",
        "scene": "party"
      },
      {
        "text": "朝起きたら透明人間になっていた",
        "scene": "friends"
      },
      {
        "text": "タイムマシンが完成して過去に行けるようになった",
        "scene": "friends"
      },
      {
        "text": "動物と自由に会話ができるようになった",
        "scene": "family"
      },
      {
        "text": "街中にゾンビが溢れ出した",
        "scene": "friends"
      },
      {
        "text": "地球外生命体（宇宙人）と遭遇した",
        "scene": "friends"
      },
      {
        "text": "空を自由に飛べる羽が生えた",
        "scene": "family"
      },
      {
        "text": "異世界に勇者として召喚された",
        "scene": "friends"
      },
      {
        "text": "明日から1年間ずっと休日になった",
        "scene": "party"
      },
      {
        "text": "世界中の全言語がペラペラに話せるようになった",
        "scene": "friends"
      },
      {
        "text": "巨大な豪邸をタダでもらった",
        "scene": "party"
      },
      {
        "text": "憧れの超大物芸能人と同居することになった",
        "scene": "party"
      },
      {
        "text": "自分の分身（クローンロボット）が完成した",
        "scene": "friends"
      },
      {
        "text": "寿命が200年まで伸びる薬を飲んだ",
        "scene": "friends"
      },
      {
        "text": "スマホの充電が一生切れない奇跡のバッテリーを手に入れた",
        "scene": "friends"
      },
      {
        "text": "世界一美味しい幻のレストランに招待された",
        "scene": "party"
      },
      {
        "text": "夢を自分の思い通りに操れる能力に目覚めた",
        "scene": "friends"
      },
      {
        "text": "歴史上の偉人（織田信長）が現代にタイムスリップして転がり込んできた",
        "scene": "friends"
      },
      {
        "text": "家の庭を掘ったら天然温泉が湧き出た",
        "scene": "family"
      },
      {
        "text": "どんな病気も一瞬で治す特効薬を開発した",
        "scene": "friends"
      },
      {
        "text": "絶対に嘘を見抜ける超能力を手に入れた",
        "scene": "party"
      },
      {
        "text": "記憶を保持したまま10歳に戻った",
        "scene": "friends"
      },
      {
        "text": "明日から月面基地への移住が決まった",
        "scene": "friends"
      },
      {
        "text": "食べても食べても絶対に太らない体質になった",
        "scene": "party"
      },
      {
        "text": "世界中のどこへでも1秒でテレポートできるようになった",
        "scene": "friends"
      },
      {
        "text": "巨大な無人島のリゾートオーナーになった",
        "scene": "party"
      },
      {
        "text": "ペットの犬が人間の言葉で相談してきた",
        "scene": "family"
      },
      {
        "text": "全世界のテレビ中継で自分の顔が大写しになった",
        "scene": "party"
      }
    ],
    "tips": [
      "「良いニュースは〜」「しかし悪いニュースは〜」と交互に即興で物語を繋げるアドリブストーリーゲーム！",
      "前の人の設定をうまく活かしつつ、予想外のハプニングや急展開をぶち込むと大爆笑！",
      "オチをどう着地させるか、全員で協力してハッピーエンド（または超カオス）に導こう！"
    ],
    "section": "main"
  },
  {
    "id": "counting-game-30",
    "title": "30言ったら負け (21カウント対戦ボード)",
    "ruby": "さんじゅういったらまけ",
    "icon": "🔢",
    "badge": "対戦ボード付",
    "catchphrase": "1〜3個の数字を順番にコール！最後に『30』を言わされた人の負け！",
    "category": "mystery",
    "toolType": "count-30",
    "minPlayers": 2,
    "maxPlayers": 6,
    "duration": "2〜5分",
    "preparation": "スマホ1台",
    "rating": 4.7,
    "tags": [
      "数学",
      "必勝法",
      "対戦",
      "頭脳戦",
      "ツール付"
    ],
    "overview": "1ターンに1〜3個の数字を進めていき、目標の数字（21または30）を言った人が負けになる数学的戦略ゲーム。ボタンタップで数字が加算され、現在値と相手の選択肢を可視化！",
    "rules": [
      {
        "step": "1",
        "title": "目標ルール（21 or 30）を選択",
        "desc": "短時間決戦の「21ゲーム」か王道の「30ゲーム」を選択してスタート！"
      },
      {
        "step": "2",
        "title": "順番に1〜3個の数字をコール＆タップ",
        "desc": "自分の手番で進められる数字は1個、2個、または3個。「1, 2」「3, 4, 5」と声を出しながらボタンをタップ。"
      },
      {
        "step": "3",
        "title": "目標の数字を言わされた人の負け！",
        "desc": "最後に「21（または30）」をコールさせられた人が敗北！4の倍数を意識した数学的駆け引きが勝負のカギ！"
      }
    ],
    "affiliateKeyword": "頭脳戦 ボードゲーム 2人",
    "seoSlug": "seo/two-player-games.html",
    "presets": [],
    "tips": [
      "1人が言える数字は1〜3個まで。指定された数字（21または30）を言わされた人が負け！",
      "実は必勝法が存在する数学的ゲーム！相手の言った個数と合わせて『4の倍数』を維持できると有利に！",
      "必勝法を知らない人とやるとまるで魔法のように勝ててしまう心理トラップゲームです。"
    ],
    "section": "C"
  },
  {
    "id": "word-chain-limit",
    "title": "縛りしりとり (即死スピードタイマー)",
    "ruby": "しばりしりとり",
    "icon": "🔗",
    "badge": "縛りルーレット付",
    "catchphrase": "文字数・ジャンルの縛りルール×即死カウントダウン！詰まったら即脱落のスリリングしりとり",
    "category": "talk",
    "toolType": "word-chain",
    "minPlayers": 2,
    "maxPlayers": 10,
    "duration": "5〜10分",
    "preparation": "スマホ1台",
    "rating": 4.7,
    "tags": [
      "しりとり",
      "縛り",
      "語彙力",
      "ルーレット付"
    ],
    "overview": "ランダムに縛りルール（例: 「4文字固定」「食べ物限定」「濁音スタート」「最後の2文字を繋ぐ」）が発動！使用済み単語の履歴チェック機能付き！",
    "rules": [
      {
        "step": "1",
        "title": "縛りルーレットで難易度ルールを決定！",
        "desc": "「3文字固定」「食べ物限定」「濁音スタート」「最後の2文字を繋ぐ」などルーレットで縛りを抽選。"
      },
      {
        "step": "2",
        "title": "通常のしりとりルール＋縛りを守って回答！",
        "desc": "前の人の最後の文字を受け継ぎつつ、指定された縛り条件をクリアする単語を即答！"
      },
      {
        "step": "3",
        "title": "「ん」で終わるか、縛り違反・時間切れで負け！",
        "desc": "語尾が「ん」になるのはもちろん、条件を満たさない単語や5秒以上詰まったらアウト！"
      },
      {
        "step": "4",
        "title": "ラウンドごとに縛りを変えて白熱！",
        "desc": "途中で縛りルールが急に変わるカオスモードで遊ぶと爆笑のパニックが生まれます！"
      }
    ],
    "affiliateKeyword": "しりとり カードゲーム",
    "seoSlug": "seo/restricted-shiritori-rules.html",
    "presets": [
      {
        "text": "3文字固定（例: りんご、すいか、きつね）",
        "scene": "family"
      },
      {
        "text": "4文字固定（例: たまねぎ、ひこうき）",
        "scene": "friends"
      },
      {
        "text": "5文字以上（例: おこのみやき、かたつむり）",
        "scene": "friends"
      },
      {
        "text": "食べ物・飲み物限定",
        "scene": "family"
      },
      {
        "text": "生き物・動物・昆虫限定",
        "scene": "family"
      },
      {
        "text": "カタカナ語・外来語限定",
        "scene": "friends"
      },
      {
        "text": "最後の2文字を繋ぐ（例: しろくま ➔ くまのみ ➔ のみもの）",
        "scene": "friends"
      },
      {
        "text": "濁音・半濁音スタート（が・ざ・だ・ば・ぱ行）",
        "scene": "friends"
      },
      {
        "text": "地名・駅名・国名限定",
        "scene": "friends"
      },
      {
        "text": "有名人・アニメキャラクター限定",
        "scene": "party"
      },
      {
        "text": "学校・教室にあるもの限定",
        "scene": "family"
      },
      {
        "text": "家の中にある家具・家電限定",
        "scene": "family"
      },
      {
        "text": "コンビニで買えるもの限定",
        "scene": "friends"
      },
      {
        "text": "形容詞＋名詞の組み合わせ（例: あかいりんご）",
        "scene": "friends"
      },
      {
        "text": "英語（アルファベットしりとり）",
        "scene": "friends"
      },
      {
        "text": "感情・気持ちを表す言葉限定",
        "scene": "party"
      },
      {
        "text": "白または黒いもの限定",
        "scene": "family"
      },
      {
        "text": "水に関係するもの限定",
        "scene": "friends"
      },
      {
        "text": "空・宇宙に関係するもの限定",
        "scene": "friends"
      },
      {
        "text": "四字熟語・故事成語限定",
        "scene": "friends"
      },
      {
        "text": "音楽・楽器に関係するもの限定",
        "scene": "friends"
      },
      {
        "text": "乗り物・交通手段限定",
        "scene": "family"
      },
      {
        "text": "スポーツ・運動に関係するもの限定",
        "scene": "family"
      },
      {
        "text": "冷たいもの限定",
        "scene": "friends"
      },
      {
        "text": "赤いもの限定",
        "scene": "family"
      },
      {
        "text": "甘いもの限定",
        "scene": "family"
      },
      {
        "text": "辛いもの限定",
        "scene": "party"
      },
      {
        "text": "映画・ドラマ・漫画のタイトル限定",
        "scene": "party"
      },
      {
        "text": "歴史上の人物限定",
        "scene": "friends"
      },
      {
        "text": "100円均一で売っているもの限定",
        "scene": "friends"
      }
    ],
    "tips": [
      "普通のしりとりに「3文字限定」「食べ物限定」「濁音スタート」などの縛りが加わるだけで難易度激変！",
      "語彙力が試されるので、普段使わないような言葉を頭の引き出しから絞り出す脳トレ効果も抜群！",
      "ルーレットで縛りが急に変わるカオスモードで遊ぶとさらに盛り上がります！"
    ],
    "section": "main"
  },
  {
    "id": "two-truths-one-lie",
    "title": "嘘つき自己紹介（2真1偽 投票ボード）",
    "ruby": "うそつきじこしょうかい",
    "icon": "🎭",
    "badge": "投票ツール付",
    "catchphrase": "3つのエピソードのうち1つだけ真っ赤な嘘！見抜けるか？",
    "category": "talk",
    "toolType": "two-truths",
    "minPlayers": 3,
    "maxPlayers": 15,
    "duration": "5〜15分",
    "preparation": "スマホ1台",
    "rating": 4.8,
    "tags": [
      "自己紹介",
      "アイスブレイク",
      "嘘見抜き",
      "投票ツール付"
    ],
    "overview": "自分のエピソードを3つ（本当2つ、嘘1つ）入力し、シャッフルして表示。他の参加者がどれが嘘かを予想して投票する最高のアイスブレイクツール！",
    "rules": [
      {
        "step": "1",
        "title": "本当のエピソード2つと嘘1つを入力",
        "desc": "出題者は自分に関する「本当の話2つ」と「真っ赤な嘘1つ」をスマホにこっそり入力。"
      },
      {
        "step": "2",
        "title": "シャッフルボタンでお披露目！",
        "desc": "ツールが順序をランダムシャッフル！3つのエピソードを画面に表示してみんなの前で語ります。"
      },
      {
        "step": "3",
        "title": "みんなで質問攻めにしてボロを探す！",
        "desc": "回答者は「いつ行ったの？」「誰と？」「どんな味だった？」と突っ込んで嘘の綻びを推理！"
      },
      {
        "step": "4",
        "title": "せーので投票＆ツールで正解開示！",
        "desc": "全員で「嘘だと思う番号」を一斉に指差し！ツールを開示して正解発表！見抜けたら回答者の勝ち！"
      }
    ],
    "affiliateKeyword": "アイスブレイク 会話 カードゲーム",
    "seoSlug": "seo/icebreak-work.html",
    "presets": [
      {
        "text": "学生時代の恥ずかしい失敗談や珍事件",
        "scene": "friends"
      },
      {
        "text": "実は昔持っていた意外な特技・資格・習い事",
        "scene": "friends"
      },
      {
        "text": "行ったことのある意外な旅行先・珍スポット",
        "scene": "party"
      },
      {
        "text": "過去に遭遇した有名人・芸能人エピソード",
        "scene": "party"
      },
      {
        "text": "人にはあまり言えない変わった食のこだわり・大好物",
        "scene": "friends"
      },
      {
        "text": "幼少期の衝撃的な勘違いや思い出",
        "scene": "family"
      },
      {
        "text": "過去のアルバイトで起きたハプニング",
        "scene": "party"
      },
      {
        "text": "実はめちゃくちゃ苦手・恐怖症なもの",
        "scene": "friends"
      },
      {
        "text": "人生で一番高額な衝動買い",
        "scene": "party"
      },
      {
        "text": "今まで骨折・入院した理由",
        "scene": "friends"
      },
      {
        "text": "部活やサークルでの伝説の珍記録",
        "scene": "friends"
      },
      {
        "text": "初恋の人にまつわる甘酸っぱい記憶",
        "scene": "party"
      },
      {
        "text": "家にある一番高価な謎のお宝アイテム",
        "scene": "party"
      },
      {
        "text": "実は一回だけテレビや新聞に載ったことがある話",
        "scene": "friends"
      },
      {
        "text": "海外旅行で起きた最大のピンチ体験",
        "scene": "friends"
      }
    ],
    "tips": [
      "自己紹介で「本当の事実2つ」と「真っ赤な嘘1つ」を混ぜて披露し、どれが嘘か当てるゲーム！",
      "本当の話をあえて大げさに、嘘の話をリアルに語るのが相手を騙すテクニック！",
      "質問タイムを設けて詳細をツッコむと、嘘をついている時の表情やボロが出て推理が白熱します。"
    ],
    "section": "C"
  },
  {
    "id": "doremi-song",
    "title": "ドレミの歌ゲーム (ランダム音階ルーレット)",
    "ruby": "どれみのうたげーむ",
    "icon": "🎵",
    "badge": "音階ルーレット付",
    "catchphrase": "「ドはドーナツのド！」次は「ファ！」急な音階指定に即座に歌えるか？",
    "category": "action",
    "toolType": "doremi",
    "minPlayers": 2,
    "maxPlayers": 12,
    "duration": "2〜5分",
    "preparation": "スマホ1台",
    "rating": 4.7,
    "tags": [
      "リズム",
      "歌",
      "大爆笑",
      "飲み会",
      "定番"
    ],
    "overview": "ランダムに指定される音階（ド・レ・ミ・ファ・ソ・ラ・シ）に合わせて、即座に正しいフレーズを歌う反射神経ソングゲーム！テンポアップBGM付き！",
    "rules": [
      {
        "step": "1",
        "title": "音階ルーレットで指定音階をランダム抽選！",
        "desc": "画面に「ド！」「ファ！」「シ！」などランダムな音階が表示されます。"
      },
      {
        "step": "2",
        "title": "指名された人が正しいフレーズを即座に歌う！",
        "desc": "「ファ」なら「ファはファイトのファ〜♪」とリズム良く即座に歌い出します。"
      },
      {
        "step": "3",
        "title": "歌い終わったら次の人を指名して音階チェンジ！",
        "desc": "歌い切ったら次のターゲットを指名！ツールをタップして次の音階をルーレット！"
      },
      {
        "step": "4",
        "title": "歌詞を間違える・音程が迷子・詰まったらアウト！",
        "desc": "急に音階を振られてパニックになったり、フレーズが出てこなかったら罰ゲーム！"
      }
    ],
    "affiliateKeyword": "音感ゲーム パーティー",
    "seoSlug": "seo/travel-car-games.html",
    "presets": [],
    "tips": [
      "指定された音階のフレーズ（例: 『ソ』なら『ソはあおいそら〜』）を即座に歌うリズムゲーム！",
      "急に音階を振られると、頭では分かっていても口から出てこないパニックが楽しい！",
      "歌うのが恥ずかしい時は、その音階から始まる言葉を即答するアレンジルールでも遊べます！"
    ],
    "section": "merged"
  },
  {
    "id": "silent-gesture",
    "title": "サイレント・ジェスチャーゲーム (お題＆タイマー)",
    "ruby": "さいれんとじぇすちゃー",
    "icon": "🤫",
    "badge": "タイマー＆お題付",
    "catchphrase": "声出し厳禁！体全体の身振り手振りだけでお題を伝えろ！",
    "category": "action",
    "toolType": "gesture",
    "minPlayers": 3,
    "maxPlayers": 15,
    "duration": "3〜10分",
    "preparation": "スマホ1台",
    "rating": 4.9,
    "tags": [
      "ジェスチャー",
      "体感",
      "大爆笑",
      "チーム対戦",
      "タイマー付"
    ],
    "overview": "声を出さずにお題（動物、職業、スポーツ、シチュエーション）を体で表現！60秒タイマーとお題自動送り、正解数スコアカウントを搭載した決定版！",
    "rules": [
      {
        "step": "1",
        "title": "出題者がお題を確認して60秒タイマー始動！",
        "desc": "出題者は画面のお題（動物・職業・シチュエーション）を確認しスタートボタンをタップ！"
      },
      {
        "step": "2",
        "title": "声出し・物音は一切厳禁！全身でジェスチャー！",
        "desc": "口パクや声は完全NG！身振り手振り・表情・体全体の動きだけで必死にお題を表現！"
      },
      {
        "step": "3",
        "title": "回答者が当てたら「正解！」ボタンで次のお題へ！",
        "desc": "当ててもらったら即座にボタンを押してスコア加算＆次のお題へスキップ！パスも可能。"
      },
      {
        "step": "4",
        "title": "制限時間内に何問正解できたかチーム対抗！",
        "desc": "60秒終了時にファンファーレと最終スコアが表示！チームを交代して最多正解チームが優勝！"
      }
    ],
    "presets": [
      {
        "text": "ゴリラがバナナを食べているところ",
        "scene": "family"
      },
      {
        "text": "電車の吊り革につかまりながら寝落ちする人",
        "scene": "work"
      },
      {
        "text": "プロポーズで指輪を渡す瞬間",
        "scene": "party"
      },
      {
        "text": "ゾンビに追い詰められて絶望する人",
        "scene": "friends"
      },
      {
        "text": "熱湯風呂に入るダチョウ倶楽部",
        "scene": "friends"
      },
      {
        "text": "満員電車で必死に耐えるサラリーマン",
        "scene": "work"
      },
      {
        "text": "初めてわさびを大量に食べてしまった人",
        "scene": "family"
      },
      {
        "text": "蚊に刺されて痒くて狂いそうな人",
        "scene": "friends"
      },
      {
        "text": "PK戦でシュートを止めたサッカーのゴールキーパー",
        "scene": "friends"
      },
      {
        "text": "重いバーベルを持ち上げようとして失敗する人",
        "scene": "friends"
      },
      {
        "text": "ジェットコースターの急降下で絶叫する人",
        "scene": "party"
      },
      {
        "text": "熱いピザを食べて口の中をやけどした人",
        "scene": "family"
      },
      {
        "text": "美容室でシャンプーされて気持ちよくなっている客",
        "scene": "friends"
      },
      {
        "text": "ボウリングでストライクを出してドヤ顔する人",
        "scene": "party"
      },
      {
        "text": "歩きスマホをしていて電柱にぶつかった人",
        "scene": "friends"
      },
      {
        "text": "路上で突然フラッシュモブに巻き込まれた人",
        "scene": "party"
      },
      {
        "text": "面接でめちゃくちゃ緊張して足が震えている就活生",
        "scene": "work"
      },
      {
        "text": "猫カフェで猫に完全に無視される人",
        "scene": "friends"
      },
      {
        "text": "寿司職人が魂を込めて大トロを握る姿",
        "scene": "family"
      },
      {
        "text": "赤ちゃんをあやして変顔をするお父さん",
        "scene": "family"
      },
      {
        "text": "サウナで限界まで我慢して水風呂に飛び込む人",
        "scene": "friends"
      },
      {
        "text": "お化け屋敷の先頭を歩かされてビビり倒す人",
        "scene": "party"
      },
      {
        "text": "映画館で感動して涙が止まらない人",
        "scene": "friends"
      },
      {
        "text": "遅刻しそうでパンをくわえながらダッシュする女子高生",
        "scene": "friends"
      },
      {
        "text": "告白しようとして指輪を落として探す人",
        "scene": "party"
      },
      {
        "text": "オーケストラの熱狂的な指揮者",
        "scene": "work"
      },
      {
        "text": "釣りで巨大魚がかかって引きずり込まれそうな人",
        "scene": "friends"
      },
      {
        "text": "激辛ラーメンをスープまで完飲しようとする人",
        "scene": "friends"
      },
      {
        "text": "ゾンビから逃げてクローゼットに隠れて息を殺す人",
        "scene": "party"
      },
      {
        "text": "UFOに連れ去られそうになって浮き上がる人",
        "scene": "friends"
      }
    ],
    "affiliateKeyword": "ジェスチャーゲーム カードゲーム",
    "seoSlug": "seo/camp-bbq.html",
    "tips": [
      "声や物音を一切出さずに、全身の身振り手振りだけでお題を伝える定番パーティーゲーム！",
      "お題の特徴的な動作や感情の動きを大げさに表現するのが伝わるコツ！",
      "制限時間60秒の中で何問正解できるかチーム対抗戦にすると熱狂度が跳ね上がります！"
    ],
    "section": "main"
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GAMES_DATA };
}
