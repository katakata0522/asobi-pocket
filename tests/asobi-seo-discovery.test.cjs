const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = path.join(__dirname, '../my-webservice/asobi-pocket');
const urls = [...fs.readFileSync(path.join(base, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);

test('全正規記事はJavaScriptなしでも記事一覧へ戻れ、構造化データと同じ階層を示す', () => {
  for (const url of urls.filter(url => url.endsWith('.html'))) {
    const file = path.join(base, new URL(url).pathname.slice('/asobi-pocket/'.length));
    const source = fs.readFileSync(file, 'utf8');
    const nav = source.match(/<nav\b[^>]*class=["'][^"']*seo-breadcrumbs[^"']*["'][^>]*>([\s\S]*?)<\/nav>/i)?.[1];
    assert.match(nav || '', /<a href="\.\/">ゲーム特集<\/a>/, url);
    const nodes = [...source.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g)]
      .flatMap(match => { const data = JSON.parse(match[1]); return Array.isArray(data) ? data : [data, ...(data['@graph'] || [])]; });
    const breadcrumb = nodes.filter(node => node['@type'] === 'BreadcrumbList');
    assert.equal(breadcrumb.length, 1, url);
    assert.deepEqual(breadcrumb[0].itemListElement.map(item => item.item), ['https://katakatalab.com/asobi-pocket/', 'https://katakatalab.com/asobi-pocket/seo/', url]);
    assert.deepEqual(breadcrumb[0].itemListElement.map(item => item.position), [1, 2, 3]);
  }
});
