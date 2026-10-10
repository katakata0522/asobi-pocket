'use strict';

// 同一オリジンにある複数PWAの通信・保存障害を、各アプリの範囲内で扱う。
self.PwaRuntime = {
  configure({ cacheName, cachePrefix, assets, fallbackAsset = './index.html',
    excludedPaths = [], autoUpdate = true, timeoutMs = 4000 }) {
    const scope = self.registration.scope;
    const coreUrls = new Set(assets.map(asset => {
      const url = new URL(asset, scope); url.search = ''; return url.href;
    }));
    const keyFor = request => {
      const url = new URL(request.url); url.hash = '';
      const bare = new URL(url); bare.search = '';
      if (coreUrls.has(bare.href) || request.mode === 'navigate') url.search = '';
      return url.href;
    };
    const safeOpen = () => caches.open(cacheName).catch(() => null);
    const safeMatch = async (cache, request) => {
      try { return cache && await cache.match(request); } catch { return undefined; }
    };
    async function fetchBounded(request) {
      const controller = new AbortController();
      let timer;
      try {
        return await Promise.race([
          (async () => {
            const response = await fetch(request, { signal: controller.signal });
            await response.clone().arrayBuffer();
            return response;
          })(),
          new Promise((_, reject) => {
            timer = setTimeout(() => {
              controller.abort();
              reject(new Error('PWA通信待ちの上限に達しました'));
            }, timeoutMs);
          }),
        ]);
      } finally { clearTimeout(timer); }
    }
    async function store(cache, key, response) {
      if (!cache || !response.ok || response.type !== 'basic') return;
      try {
        await cache.put(key, response.clone());
        // 任意の閲覧URLを無制限に増やさず、必須資産は削除しない。
        const keys = await cache.keys();
        const extra = keys.filter(request => !coreUrls.has(keyFor(request)));
        for (const request of extra.slice(0, Math.max(0, extra.length - 80))) {
          await cache.delete(request);
        }
      } catch {
        // 保存容量不足で、取得できた画面を失わせない。
      }
    }
    self.addEventListener('install', event => {
      event.waitUntil((async () => {
        const cache = await caches.open(cacheName);
        await cache.addAll([...coreUrls].map(url => new Request(url, { cache: 'reload' })));
        if (autoUpdate) await self.skipWaiting();
      })());
    });
    self.addEventListener('activate', event => {
      event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.filter(key => key.startsWith(cachePrefix) && key !== cacheName)
          .map(key => caches.delete(key)));
        await self.clients.claim();
      })());
    });
    self.addEventListener('message', event => {
      if (event.data === 'SKIP_WAITING' || event.data?.type === 'SKIP_WAITING') {
        event.waitUntil(self.skipWaiting());
      }
    });
    self.addEventListener('fetch', event => {
      const request = event.request;
      if (request.method !== 'GET') return;
      if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return;
      const url = new URL(request.url);
      const key = keyFor(request);
      if (url.origin !== self.location.origin) return;
      if (excludedPaths.some(path => url.pathname.startsWith(path))) return;
      if (/\/(?:sw|service-worker|sw-hardened)\.js$/.test(url.pathname)
        || (url.pathname.endsWith('/pwa-runtime.js') && !coreUrls.has(key))) return;
      const navigation = request.mode === 'navigate';
      const inScope = url.href.startsWith(scope);
      const known = coreUrls.has(key);
      if (!inScope && !known) return;
      if (!navigation && !known && !['style', 'script', 'image', 'font', 'manifest'].includes(request.destination)) return;
      let complete;
      const lifetime = new Promise(resolve => { complete = resolve; });
      // 応答後の補助保存もイベントへ結び付けるが、画面表示は保存を待たない。
      event.waitUntil(lifetime);
      event.respondWith((async () => {
        const cache = await safeOpen();
        const cached = await safeMatch(cache, key);
        if (cached) { complete(); return cached; }
        try {
          const response = await fetchBounded(request);
          if (response.status >= 500 && navigation) throw new Error('サーバーが応答できません');
          store(cache, key, response).finally(complete);
          return response;
        } catch {
          complete();
          if (navigation) {
            const fallback = await safeMatch(cache, new URL(fallbackAsset, scope).href);
            if (fallback) return fallback;
            return new Response('<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>接続を確認してください</title><h1>画面を読み込めませんでした</h1><p>通信が戻ったら、もう一度開いてください。</p><button onclick="location.reload()">再読み込み</button></html>',
              { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
          }
          return Response.error();
        }
      })());
    });
  }
};
