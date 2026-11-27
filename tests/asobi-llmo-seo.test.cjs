'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const APP_ROOT = path.join(__dirname, '../my-webservice/asobi-pocket');
const SEO_ROOT = path.join(APP_ROOT, 'seo');
const LEGACY_ALIASES = new Set([
  'two-players.html',
  'no-tools.html',
  'nomikai.html',
  'large-group.html',
  'waiting-time.html',
  'drive.html',
  'ng-word.html',
  'shiritori-rule.html'
]);

function loadGames() {
  const source = fs.readFileSync(path.join(APP_ROOT, 'data/games.js'), 'utf8') + '\n;globalThis.__G = GAMES_DATA;';
  const ctx = {};
  vm.runInNewContext(source, ctx, { timeout: 2000 });
  return ctx.__G;
}

function parseJsonLd(html) {
  const nodes = [];
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    const parsed = JSON.parse(match[1]);
    if (Array.isArray(parsed)) nodes.push(...parsed);
    else if (Array.isArray(parsed['@graph'])) nodes.push(...parsed['@graph']);
    else nodes.push(parsed);
  }
  return nodes;
}

test('llms.txt と llms-full.txt が全32ゲーム・全38正規記事を網羅している', () => {
  const games = loadGames();
  assert.equal(games.length, 32);

  const llms = fs.readFileSync(path.join(APP_ROOT, 'llms.txt'), 'utf8');
  const llmsFull = fs.readFileSync(path.join(APP_ROOT, 'llms-full.txt'), 'utf8');

  for (const game of games) {
    const gameUrl = `https://katakatalab.com/asobi-pocket/#game/${game.id}`;
    assert.ok(llms.includes(gameUrl), `llms.txt missing game ${game.id}`);
    assert.ok(llmsFull.includes(gameUrl), `llms-full.txt missing game ${game.id}`);
  }

  const canonicalArticles = fs.readdirSync(SEO_ROOT)
    .filter(f => f.endsWith('.html') && f !== 'index.html' && !LEGACY_ALIASES.has(f))
    .sort();
  assert.equal(canonicalArticles.length, 38);

  for (const file of canonicalArticles) {
    const url = `https://katakatalab.com/asobi-pocket/seo/${file}`;
    assert.ok(llmsFull.includes(url), `llms-full.txt missing canonical guide ${file}`);
  }
});

test('robots.txt が検索エンジン・AI検索クローラー・サイトマップ・llms.txtを明示している', () => {
  const robots = fs.readFileSync(path.join(APP_ROOT, 'robots.txt'), 'utf8');
  assert.match(robots, /User-agent:\s*\*/);
  assert.match(robots, /User-agent:\s*OAI-SearchBot/);
  assert.match(robots, /User-agent:\s*PerplexityBot/);
  assert.match(robots, /User-agent:\s*ClaudeBot/);
  assert.match(robots, /Sitemap:\s*https:\/\/katakatalab\.com\/asobi-pocket\/sitemap\.xml/);
  assert.ok(robots.includes('https://katakatalab.com/asobi-pocket/llms.txt'));
});

test('トップ index.html に llms.txt 参照と WebApplication / ItemList / FAQPage 構造化データがある', () => {
  const indexHtml = fs.readFileSync(path.join(APP_ROOT, 'index.html'), 'utf8');
  assert.ok(indexHtml.includes('href="https://katakatalab.com/asobi-pocket/llms.txt"'));
  assert.doesNotMatch(indexHtml, /aggregateRating/i);

  const nodes = parseJsonLd(indexHtml);
  const types = new Set(nodes.map(n => n['@type']));
  assert.ok(types.has('WebSite'));
  assert.ok(types.has('WebApplication'));
  assert.ok(types.has('ItemList'));
  assert.ok(types.has('FAQPage'));

  const webApp = nodes.find(n => n['@type'] === 'WebApplication');
  assert.ok(Array.isArray(webApp.featureList) && webApp.featureList.length >= 4);
  const faq = nodes.find(n => n['@type'] === 'FAQPage');
  assert.ok(Array.isArray(faq.mainEntity) && faq.mainEntity.length >= 5);
});

test('全38正規SEO記事に回答要約ボックス・更新日・Article/FAQPage/BreadcrumbList JSON-LDが揃っている', () => {
  const canonicalArticles = fs.readdirSync(SEO_ROOT)
    .filter(f => f.endsWith('.html') && f !== 'index.html' && !LEGACY_ALIASES.has(f))
    .sort();
  assert.equal(canonicalArticles.length, 38);

  for (const file of canonicalArticles) {
    const html = fs.readFileSync(path.join(SEO_ROOT, file), 'utf8');
    assert.ok(html.includes('class="seo-answer-box"'), `${file}: missing seo-answer-box`);
    assert.ok(html.includes('class="seo-byline"'), `${file}: missing static seo-byline`);
    assert.ok(html.includes('class="seo-article-note"'), `${file}: missing seo-article-note`);
    assert.ok(html.includes('href="../style.css"'), `${file}: must reference exact ../style.css`);
    assert.doesNotMatch(html, /aggregateRating/i, `${file}: aggregateRating is forbidden`);

    const nodes = parseJsonLd(html);
    const types = new Set(nodes.map(n => n['@type']));
    assert.ok(types.has('Article'), `${file}: missing Article JSON-LD`);
    assert.ok(types.has('FAQPage'), `${file}: missing FAQPage JSON-LD`);
    assert.ok(types.has('BreadcrumbList'), `${file}: missing BreadcrumbList JSON-LD`);

    const article = nodes.find(n => n['@type'] === 'Article');
    const timeMatch = html.match(/<time\s+datetime="(\d{4}-\d{2}-\d{2})"/);
    assert.ok(timeMatch, `${file}: missing visible <time datetime>`);
    assert.equal(timeMatch[1], article.dateModified, `${file}: <time> must match Article.dateModified`);
  }
});
