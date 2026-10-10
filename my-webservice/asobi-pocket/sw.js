const CACHE_NAME = "asobi-pocket-ea159f2cd713ac44cee7";

// 起動に必要な資産を一括で保存し、欠けた版を有効化しない。
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./terms.html",
  "./privacy.html",
  "./style.css",
  "./style.css?v=20261001",
  "./evolution.css?v=20261001-ux1",
  "./js/evolution.js",
  "./assets/pocket-mark.svg",
  "./manifest.json",
  "./data/games.js",
  "./js/audio.js",
  "./js/confetti.js",
  "./js/toast.js",
  "./js/tools.js",
  "./js/app.js",
  "./js/bootstrap.js",
  "./seo/ito-odai.html",
  "./seo/wordwolf-odai.html",
  "./seo/asa-sore-odai.html",
  "./seo/sea-turtle-quiz.html"
];

const QUALITY_ASSETS = [
  "./quality-ui.css",
  "./js/quality/data-contract.js",
  "./js/quality/tool-fixes.js",
  "./js/quality/product-ux.js"
];


// 自分の範囲だけを扱い、インストール済みの画面を通信待ちで止めない。
importScripts('./pwa-runtime.js');
self.PwaRuntime.configure({ cacheName: CACHE_NAME, cachePrefix: 'asobi-pocket-', assets: [...CORE_ASSETS, ...QUALITY_ASSETS, "./pwa-runtime.js", "./assets/pocket-192.png", "./assets/pocket-512.png", "./seo/seo-guide.css", "./seo/analytics.js"] });
