(() => {
  'use strict';
  const start = () => {
    // 集客→遊び→関連商品の導線を区別する。自由入力は送信しない。
    let interacted = false;
    window.addEventListener('hashchange', () => { interacted = false; });
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a.btn-affiliate');
      const match = location.hash.match(/^#game\/([a-z0-9-]+)$/);
      if (link && match && typeof Analytics !== 'undefined') {
        const merchant = new URL(link.href).hostname.includes('amazon') ? 'amazon' : 'rakuten';
        Analytics.track('asobi_product_click', { game_id: match[1], merchant, surface: link.closest('.tab-pane')?.id || 'detail' });
      }
      const toolAction = event.target.closest('#tool-mount-point button');
      if (toolAction && match && !interacted && typeof Analytics !== 'undefined') {
        interacted = true;
        Analytics.track('asobi_game_interaction', { game_id: match[1] });
      }
    }, true);
    document.querySelectorAll('[data-pocket-game]').forEach(button => button.addEventListener('click', () => {
      const gameId = button.dataset.pocketGame;
      if (typeof Analytics !== 'undefined') Analytics.track('asobi_hero_pick', { game_id: gameId });
      location.hash = 'game/' + gameId;
    }));
    document.getElementById('btn-hero-choose')?.addEventListener('click', () => {
      document.getElementById('btn-quick-concierge')?.click();
    });
    document.getElementById('btn-share-pocket')?.addEventListener('click', async () => {
      const data = { title: 'あそびポケット', text: '次の集まり、何して遊ぶ？ スマホ1台でみんなと遊べる「あそびポケット」。', url: 'https://katakatalab.com/asobi-pocket/' };
      try {
        if (navigator.share) await navigator.share(data);
        else if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(`${data.text}\n${data.url}`);
          if (typeof Toast !== 'undefined') Toast.success('友達に送るリンクをコピーしました');
        } else {
          if (typeof Toast !== 'undefined') Toast.info('アドレスバーのURLをコピーして友達に送ってください');
          return;
        }
        if (typeof Analytics !== 'undefined') Analytics.track('asobi_share', { surface: 'home', method: navigator.share ? 'native' : 'clipboard' });
      } catch (error) {
        if (error?.name !== 'AbortError' && typeof Toast !== 'undefined') Toast.warning('共有できませんでした。アドレスバーのURLをコピーしてください');
      }
    });
    // 静的な案内は読み込み中にも表示し、ゲーム詳細では現在の画面にフォーカスを移す。
    const syncRoute = () => {
      const detail = document.getElementById('view-detail');
      const inGame = location.hash.startsWith('#game/');
      document.body.classList.toggle('pocket-in-game', inGame);
      if (inGame && detail && !detail.classList.contains('hidden')) {
        const heading = detail.querySelector('h1,h2,h3');
        if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
      }
    };
    window.addEventListener('hashchange', () => requestAnimationFrame(syncRoute));
    syncRoute();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
