// Original initialization extracted from HTML to permit a restrictive script-src CSP.
"use strict";
window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', 'G-FYFPS7L9X9', { anonymize_ip: true, send_page_view: false });
    (function () {
      let loaded = false;
      const loadAnalytics = function () {
        if (loaded) return;
        loaded = true;
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=G-FYFPS7L9X9';
        document.head.appendChild(script);
      };
      const trackPageView = function () {
        const hash = window.location.hash || '#home';
        gtag('event', 'page_view', {
          page_title: document.title,
          page_location: window.location.href,
          page_path: window.location.pathname + window.location.search + hash
        });
        if (hash.startsWith('#game/')) {
          gtag('event', 'asobi_game_view', { game_id: hash.slice('#game/'.length) });
        }
      };
      ['pointerdown', 'keydown', 'scroll'].forEach(function (eventName) {
        window.addEventListener(eventName, loadAnalytics, { once: true, passive: true });
      });
      window.addEventListener('load', function () {
        window.setTimeout(loadAnalytics, 2500);
        trackPageView();
      }, { once: true });
      window.addEventListener('hashchange', trackPageView);
    }());

// Site-scoped SW registration must not block page startup.
if ("serviceWorker" in navigator) {
      const registerPwa = () => navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" }).catch(() => {});
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", registerPwa, { once: true });
      else registerPwa();
    }
