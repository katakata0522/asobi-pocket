(() => {
  try {
    if (window.localStorage && window.localStorage.getItem('asobi_theme_dark') === 'true') {
      document.documentElement?.classList?.add('dark-mode');
    }
  } catch { /* ローカル保存不可でも記事表示を継続する。 */ }
  const measurementId = 'G-FYFPS7L9X9';
  const testMode = new URLSearchParams(window.location.search).get('asobi_test');
  let analyticsTest = testMode === '1';
  try {
    if (testMode === '1') window.sessionStorage.setItem('asobi-pocket:analytics-test', '1');
    if (testMode === '0') window.sessionStorage.removeItem('asobi-pocket:analytics-test');
    if (testMode !== '0') analyticsTest = analyticsTest || window.sessionStorage.getItem('asobi-pocket:analytics-test') === '1';
  } catch { /* 保存不可でも明示したテスト指定は適用する。 */ }
  analyticsTest = analyticsTest || window.location.protocol === 'file:' || ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
  // 記事からゲームへ移動しても、同じタブのテスト操作は送信しない。
  if (analyticsTest) window['ga-disable-' + measurementId] = true;
  const articleSlug = window.location.pathname.split('/').filter(Boolean).pop() || 'seo-index';
  const seoHubUrl = 'https://katakatalab.com/asobi-pocket/seo/';
  const analyticsOnly = document.currentScript?.hasAttribute('data-analytics-only') === true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(){ window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { anonymize_ip: true, content_group: 'Asobi Pocket' });

  const isSeoHub =
    window.location.pathname.endsWith('/seo/') ||
    window.location.pathname.endsWith('/seo/index.html');

  const findArticleJsonLd = () => {
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const parsed = JSON.parse(script.textContent || '{}');
        const nodes = Array.isArray(parsed) ? parsed : [parsed];
        for (const node of nodes) {
          if (node && node['@type'] === 'Article') return node;
          if (node && Array.isArray(node['@graph'])) {
            const article = node['@graph'].find(item => item && item['@type'] === 'Article');
            if (article) return article;
          }
        }
      } catch {
        // A malformed unrelated JSON-LD block must not break navigation or analytics.
      }
    }
    return null;
  };

  const formatJpDate = (value) => {
    const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return '';
    return `${Number(match[1])}年${Number(match[2])}月${Number(match[3])}日`;
  };

  const ensureVisibleArticleMetadata = () => {
    if (isSeoHub || document.querySelector('.seo-byline')) return;
    const hero = document.querySelector('.seo-hero');
    if (!hero) return;

    const article = findArticleJsonLd();
    const modified = article && article.dateModified;
    const displayDate = formatJpDate(modified);
    const byline = document.createElement('div');
    byline.className = 'seo-byline';
    byline.setAttribute('aria-label', '記事情報');

    const editor = document.createElement('span');
    editor.textContent = '編集: KatakataLab';
    byline.appendChild(editor);

    if (modified && displayDate) {
      const time = document.createElement('time');
      time.dateTime = String(modified).slice(0, 10);
      time.textContent = `更新: ${displayDate}`;
      byline.appendChild(time);
    }

    hero.appendChild(byline);
  };

  if (!isSeoHub && !analyticsOnly) {
    const breadcrumb = document.querySelector('.seo-breadcrumbs');
    const rootLink = breadcrumb && breadcrumb.querySelector('a[href="../"]');
    const heading = document.querySelector('h1');

    if (breadcrumb && rootLink && heading) {
      const hubLink = document.createElement('a');
      hubLink.href = './';
      hubLink.textContent = 'ゲーム特集';
      breadcrumb.replaceChildren(
        rootLink,
        document.createTextNode(' ➔ '),
        hubLink,
        document.createTextNode(` ➔ ${heading.textContent.trim()}`)
      );
    }

    const hasBreadcrumbJsonLd = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .some((script) => script.textContent.includes('BreadcrumbList'));

    if (!hasBreadcrumbJsonLd && heading) {
      const breadcrumbJsonLd = document.createElement('script');
      breadcrumbJsonLd.type = 'application/ld+json';
      breadcrumbJsonLd.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'あそびポケット',
            item: 'https://katakatalab.com/asobi-pocket/'
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'ゲーム特集',
            item: seoHubUrl
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: heading.textContent.trim()
          }
        ]
      });
      document.head.appendChild(breadcrumbJsonLd);
    }
  }

  if (!analyticsOnly) ensureVisibleArticleMetadata();

  let loaded = false;
  const loadAnalytics = () => {
    if (loaded || analyticsTest || window['ga-disable-' + measurementId]) return;
    loaded = true;
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
  };

  ['pointerdown','keydown','scroll'].forEach((eventName) => {
    window.addEventListener(eventName, loadAnalytics, { once: true, passive: true });
  });
  window.addEventListener('load', () => window.setTimeout(loadAnalytics, 2500), { once: true });

  // Analytics must never sit on the critical path from an SEO article to a
  // playable game. Queue the event with beacon transport and let the browser
  // follow the link immediately.
  const trackNavigation = (link, eventName, params) => {
    loadAnalytics();
    window.gtag('event', eventName, {
      ...params,
      transport_type: 'beacon'
    });
  };

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    const linkText = (link.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80);

    if (href.startsWith('../#game/')) {
      trackNavigation(link, 'asobi_seo_game_click', {
        article_slug: articleSlug,
        game_id: href.slice('../#game/'.length).split('?')[0],
        link_text: linkText
      });
      return;
    }

    if (href === './' || href === 'index.html' || /^[^#?]+\.html(?:[?#].*)?$/.test(href)) {
      trackNavigation(link, 'asobi_seo_related_click', {
        article_slug: articleSlug,
        target_slug: href === './' ? 'seo-index' : href.split(/[?#]/)[0],
        link_text: linkText
      });
    }
  });
})();
