'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const APP_ROOT = path.join(ROOT, 'my-webservice', 'asobi-pocket');
const SEO_ROOT = path.join(APP_ROOT, 'seo');
const SITEMAP_PATH = path.join(APP_ROOT, 'sitemap.xml');
const GAMES_PATH = path.join(APP_ROOT, 'data', 'games.js');
const HUB_PATH = path.join(SEO_ROOT, 'index.html');
const ANALYTICS_PATH = path.join(SEO_ROOT, 'analytics.js');
const GUIDE_CSS_PATH = path.join(SEO_ROOT, 'seo-guide.css');
const BASE_URL = 'https://katakatalab.com/asobi-pocket/seo/';
const EXPECTED_ARTICLE_COUNT = 34;
const LEGACY_ALIASES = new Map(Object.entries({
  "two-players.html": "two-player-games.html", "no-tools.html": "party-games-no-tools.html",
  "nomikai.html": "drinking-party-games.html", "large-group.html": "large-group-games.html",
  "waiting-time.html": "waiting-time-games.html", "drive.html": "travel-car-games.html",
  "ng-word.html": "ng-word-game-odai.html", "shiritori-rule.html": "restricted-shiritori-rules.html"
}));

const LEGACY_CTA_FIXED_BY_PR58 = new Set([
  'ito-odai.html',
  'wordwolf-odai.html',
  'asa-sore-odai.html',
  'sea-turtle-quiz.html'
]);

const DEPTH_PAGES = new Set([
  'two-player-games.html',
  'three-player-games.html',
  'four-player-games.html',
  'drinking-party-games.html',
  'large-group-games.html',
  'waiting-time-games.html',
  'icebreaker-games.html',
  'seated-games.html',
  'quiet-games.html',
  'family-games.html',
  'twenty-questions-guide.html',
  'safe-penalty-game-ideas.html'
]);

const PLAYER_GUIDE_COUNTS = new Map([
  ['two-player-games.html', 10],
  ['three-player-games.html', 14],
  ['four-player-games.html', 12]
]);

const errors = [];
const notes = [];

function fail(message) { errors.push(message); }
function note(message) { notes.push(message); }
function read(filePath) { return fs.readFileSync(filePath, 'utf8'); }
function stripTags(value) { return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); }

function firstMatch(source, regex) {
  const match = source.match(regex);
  return match ? match[1].trim() : '';
}

function countMatches(source, regex) {
  return (source.match(regex) || []).length;
}

function hasNoindex(source) {
  return [...String(source || '').matchAll(/<meta\b[^>]*>/gi)].some(match => {
    const tag = match[0];
    return /name=["']robots["']/i.test(tag) && /content=["'][^"']*\bnoindex\b[^"']*["']/i.test(tag);
  });
}

function findArticleJsonLd(jsonLdNodes) {
  for (const node of jsonLdNodes) {
    if (!node || typeof node !== 'object') continue;
    if (node['@type'] === 'Article') return node;
    if (Array.isArray(node['@graph'])) {
      const article = node['@graph'].find(item => item && item['@type'] === 'Article');
      if (article) return article;
    }
  }
  return null;
}

function parseJsonLdBlocks(source, file) {
  const blocks = [...source.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const parsed = [];
  blocks.forEach((match, index) => {
    try {
      const value = JSON.parse(match[1]);
      if (Array.isArray(value)) parsed.push(...value);
      else parsed.push(value);
    } catch (error) {
      fail(`${file}: JSON-LD block #${index + 1} is invalid JSON -> ${error.message}`);
    }
  });
  return parsed;
}

function loadGameIds() {
  const source = read(GAMES_PATH) + '\n;globalThis.__ASOBI_GAMES__ = GAMES_DATA;';
  const context = {};
  vm.runInNewContext(source, context, { filename: GAMES_PATH, timeout: 2000 });
  if (!Array.isArray(context.__ASOBI_GAMES__)) throw new Error('GAMES_DATA could not be loaded');
  return new Set(context.__ASOBI_GAMES__.map(game => game && game.id).filter(Boolean));
}

function listArticleFiles() {
  return fs.readdirSync(SEO_ROOT, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.html') && entry.name !== 'index.html')
    .map(entry => entry.name)
    .sort();
}

function extractLocalHtmlLinks(source) {
  const links = [];
  const regex = /href=["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(source)) !== null) {
    const href = match[1];
    if (/^(?:https?:|mailto:|tel:|javascript:|#)/i.test(href)) continue;
    if (href.startsWith('../#game/')) continue;
    const clean = href.split(/[?#]/)[0];
    if (clean.endsWith('.html')) links.push(clean);
  }
  return links;
}

function extractGameIds(source) {
  const ids = [];
  const regex = /href=["']\.\.\/#game\/([^"'#?]+)["']/gi;
  let match;
  while ((match = regex.exec(source)) !== null) ids.push(decodeURIComponent(match[1]));
  return ids;
}

function countCardsBetween(source, startHeading, endHeading) {
  const start = source.indexOf(startHeading);
  const end = source.indexOf(endHeading, start + startHeading.length);
  if (start < 0 || end < 0 || end <= start) return -1;
  return (source.slice(start, end).match(/class=["']seo-card["']/g) || []).length;
}

function checkUnique(label, items) {
  const seen = new Map();
  for (const item of items) {
    if (!item.value) {
      fail(`${item.file}: missing ${label}`);
      continue;
    }
    if (seen.has(item.value)) fail(`${label} duplicate: ${item.file} and ${seen.get(item.value)} -> ${item.value}`);
    else seen.set(item.value, item.file);
  }
}

try {
  const articleFiles = listArticleFiles().filter(file => !LEGACY_ALIASES.has(file));
  for (const [alias, target] of LEGACY_ALIASES) {
    const aliasPath = path.join(SEO_ROOT, alias);
    if (!fs.existsSync(aliasPath) || !fs.existsSync(path.join(SEO_ROOT, target))) { fail(`${alias}: legacy alias or its canonical target is missing`); continue; }
    const source = read(aliasPath);
    const canonical = firstMatch(source, /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
    if (canonical !== BASE_URL + target) fail(`${alias}: legacy canonical must point to ${target}`);
  }
  note(`Legacy aliases validated: ${LEGACY_ALIASES.size}`);
  if (articleFiles.length !== EXPECTED_ARTICLE_COUNT) {
    fail(`SEO article count must be ${EXPECTED_ARTICLE_COUNT}; found ${articleFiles.length}`);
  } else {
    note(`SEO article count: ${articleFiles.length}`);
  }

  const analytics = read(ANALYTICS_PATH);
  if (!analytics.includes("transport_type: 'beacon'")) fail('analytics.js must use beacon transport for outbound SEO navigation events');
  if (analytics.includes('event.preventDefault()') || analytics.includes('setTimeout(navigate')) {
    fail('analytics.js must not block article-to-game/article navigation for tracking');
  } else {
    note('SEO navigation tracking stays off the critical navigation path');
  }

  const guideCss = read(GUIDE_CSS_PATH);
  if (!guideCss.includes(':focus-visible')) fail('seo-guide.css must expose a visible keyboard focus state');
  if (!guideCss.includes('prefers-reduced-motion')) fail('seo-guide.css must respect prefers-reduced-motion');
  if (!guideCss.includes('--bg-card:var(--card-bg)') && !guideCss.includes('--bg-card: var(--card-bg)')) {
    fail('seo-guide.css must bridge legacy --bg-card to canonical --card-bg until shell migration');
  } else {
    note('SEO guide accessibility and background-token compatibility are present');
  }

  const gameIds = loadGameIds();
  note(`Game IDs loaded: ${gameIds.size}`);

  const hub = read(HUB_PATH);
  const sitemap = read(SITEMAP_PATH);
  if (hasNoindex(hub)) fail('SEO hub must remain indexable; accidental noindex detected');
  const titles = [];
  const descriptions = [];
  const canonicals = [];

  for (const file of articleFiles) {
    const filePath = path.join(SEO_ROOT, file);
    const source = read(filePath);
    const title = firstMatch(source, /<title>([\s\S]*?)<\/title>/i);
    const description = firstMatch(source, /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
    const canonical = firstMatch(source, /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
    const h1 = stripTags(firstMatch(source, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i));
    const ogTitle = firstMatch(source, /<meta\s+property=["']og:title["']\s+content=["']([^"']*)["']/i);
    const ogDescription = firstMatch(source, /<meta\s+property=["']og:description["']\s+content=["']([^"']*)["']/i);
    const ogType = firstMatch(source, /<meta\s+property=["']og:type["']\s+content=["']([^"']*)["']/i);
    const ogUrl = firstMatch(source, /<meta\s+property=["']og:url["']\s+content=["']([^"']*)["']/i);
    const twitterCard = firstMatch(source, /<meta\s+name=["']twitter:card["']\s+content=["']([^"']*)["']/i);
    const pageGameIds = extractGameIds(source);
    const jsonLdNodes = parseJsonLdBlocks(source, file);

    titles.push({ file, value: title });
    descriptions.push({ file, value: description });
    canonicals.push({ file, value: canonical });

    if (!/^\s*<!doctype\s+html>/i.test(source)) fail(`${file}: missing HTML5 doctype`);
    if (!/<html\b[^>]*\blang=["']ja["']/i.test(source)) fail(`${file}: html lang must be ja`);
    if (!/<meta\s+charset=["']?utf-8["']?/i.test(source)) fail(`${file}: missing UTF-8 charset`);
    if (!/<meta\s+name=["']viewport["']\s+content=["'][^"']*width=device-width/i.test(source)) fail(`${file}: missing responsive viewport`);
    if (countMatches(source, /<h1\b/gi) !== 1) fail(`${file}: must contain exactly one h1`);
    if (!h1) fail(`${file}: missing visible h1`);
    if (!source.includes('class="seo-breadcrumbs"')) fail(`${file}: missing breadcrumbs`);
    if (source.includes('"aggregateRating"')) fail(`${file}: unsupported aggregateRating must not be added`);
    if (/href=["']\s*javascript:/i.test(source)) fail(`${file}: javascript: links are not allowed`);
    if (/href=["']\s*["']/i.test(source)) fail(`${file}: empty href is not allowed`);
    if (hasNoindex(source)) fail(`${file}: searchable SEO article must not contain noindex`);

    if (!ogTitle) fail(`${file}: missing og:title`);
    if (!ogDescription) fail(`${file}: missing og:description`);
    if (ogType !== 'article') fail(`${file}: og:type must be article`);
    if (ogUrl !== canonical) fail(`${file}: og:url must match canonical`);
    if (!['summary', 'summary_large_image'].includes(twitterCard)) fail(`${file}: missing/invalid twitter:card`);
    if (!source.includes('href="../style.css"')) fail(`${file}: shared root style.css is not loaded`);

    const expectedCanonical = `${BASE_URL}${file}`;
    if (canonical !== expectedCanonical) fail(`${file}: canonical mismatch; expected ${expectedCanonical}, got ${canonical || '(missing)'}`);
    if (!sitemap.includes(`<loc>${expectedCanonical}</loc>`)) fail(`${file}: canonical URL missing from sitemap`);
    if (!hub.includes(`href="${file}"`)) fail(`${file}: missing from SEO hub`);

    for (const href of extractLocalHtmlLinks(source)) {
      const target = path.resolve(SEO_ROOT, href);
      if (!target.startsWith(SEO_ROOT + path.sep) || !fs.existsSync(target)) fail(`${file}: broken local article link -> ${href}`);
    }

    if (!LEGACY_CTA_FIXED_BY_PR58.has(file)) {
      for (const gameId of pageGameIds) {
        if (!gameIds.has(gameId)) fail(`${file}: unknown game CTA id -> ${gameId}`);
      }
    }

    if (PLAYER_GUIDE_COUNTS.has(file)) {
      const expectedCount = PLAYER_GUIDE_COUNTS.get(file);
      const actualCount = new Set(pageGameIds).size;
      if (actualCount !== expectedCount) fail(`${file}: visible selection claim expects ${expectedCount} unique games, found ${actualCount}`);
      if (!title.includes(`${expectedCount}選`) || !h1.includes(`${expectedCount}選`)) fail(`${file}: title/h1 must declare ${expectedCount} selections`);
      const hubLabel = file === 'two-player-games.html'
        ? '2人でできるゲーム10選'
        : file === 'three-player-games.html'
          ? '3人でできるゲーム14選'
          : '4人でできるゲーム12選';
      if (!hub.includes(`${file}">${hubLabel}`)) fail(`${file}: SEO hub selection count is out of sync`);
    }

    if (file === 'twenty-questions-guide.html') {
      const count = countCardsBetween(source, '初心者向けお題10選', '良いお題・悪いお題の違い');
      if (count !== 40) fail(`${file}: title promises 40 topics but counted ${count}`);
      if (!title.includes('お題40選') || !h1.includes('お題40選')) fail(`${file}: title/h1 must declare 40 topics`);
    }

    if (file === 'safe-penalty-game-ideas.html') {
      const count = countCardsBetween(source, '声・言い方だけで終わる10選', '罰ゲームにしない方がいいもの');
      if (count !== 40) fail(`${file}: title promises 40 missions but counted ${count}`);
      if (!title.includes('40選') || !h1.includes('40選')) fail(`${file}: title/h1 must declare 40 missions`);
      for (const requiredSafety of ['パス', '飲酒', '痛み', '個人情報', '周囲の人を巻き込まない']) {
        if (!source.includes(requiredSafety)) fail(`${file}: missing safety principle -> ${requiredSafety}`);
      }
    }

    if (DEPTH_PAGES.has(file)) {
      for (const signal of ['class="seo-byline"', 'class="seo-answer-box"', 'class="seo-article-note"']) {
        if (!source.includes(signal)) fail(`${file}: depth-page signal missing -> ${signal}`);
      }
      if (!source.includes('src="analytics.js"')) fail(`${file}: shared SEO analytics.js is not loaded`);

      const article = findArticleJsonLd(jsonLdNodes);
      if (!article) {
        fail(`${file}: Article JSON-LD missing`);
      } else {
        if (article.mainEntityOfPage !== canonical) fail(`${file}: Article mainEntityOfPage must match canonical`);
        if (article.inLanguage !== 'ja-JP') fail(`${file}: Article inLanguage must be ja-JP`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(article.datePublished || ''))) fail(`${file}: Article datePublished must be YYYY-MM-DD`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(article.dateModified || ''))) fail(`${file}: Article dateModified must be YYYY-MM-DD`);
        if (article.datePublished && article.dateModified && article.dateModified < article.datePublished) {
          fail(`${file}: Article dateModified cannot be earlier than datePublished`);
        }
        const visibleDate = firstMatch(source, /<time\b[^>]*datetime=["']([^"']+)["']/i);
        if (visibleDate !== article.dateModified) fail(`${file}: visible update date must match Article dateModified`);
      }
    }
  }

  checkUnique('title', titles);
  checkUnique('meta description', descriptions);
  checkUnique('canonical', canonicals);

  const sitemapLocs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  const duplicateSitemapLocs = sitemapLocs.filter((loc, index) => sitemapLocs.indexOf(loc) !== index);
  if (duplicateSitemapLocs.length) fail(`sitemap duplicate loc: ${[...new Set(duplicateSitemapLocs)].join(', ')}`);

  if (!hub.includes(`特集${EXPECTED_ARTICLE_COUNT}記事`)) fail(`SEO hub does not visibly declare ${EXPECTED_ARTICLE_COUNT}-article coverage`);
  if (!hub.includes('3人でできるゲーム14選')) fail('SEO hub regressed the 3-player guide count from 14');
  if (!hub.includes('"@type":"CollectionPage"')) fail('SEO hub CollectionPage JSON-LD missing');
  if (!sitemap.includes('<loc>https://katakatalab.com/asobi-pocket/seo/</loc>')) fail('SEO hub missing from sitemap');

  for (const noteMessage of notes) console.log(`OK: ${noteMessage}`);
  console.log(`NOTE: legacy CTA validation is deferred to PR #58 for ${[...LEGACY_CTA_FIXED_BY_PR58].join(', ')}`);

  if (errors.length) {
    for (const error of errors) console.error(`ERROR: ${error}`);
    process.exit(1);
  }
  console.log('OK: Asobi Pocket SEO content integrity passed');
} catch (error) {
  console.error(`ERROR: ${error.stack || error.message}`);
  process.exit(1);
}
