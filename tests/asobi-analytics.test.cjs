const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '../my-webservice/asobi-pocket');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const appAnalytics = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map(match => match[1]).find(source => source.includes("gtag('config'"));
const articleAnalytics = fs.readFileSync(path.join(root, 'seo/analytics.js'), 'utf8');

test('全正規記事と記事一覧に計測ローダーがあり、旧URLには重複追加しない', () => {
  const directory = path.join(root, 'seo');
  for (const name of fs.readdirSync(directory).filter(name => name.endsWith('.html'))) {
    const source = fs.readFileSync(path.join(directory, name), 'utf8');
    const canonical = source.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)/)?.[1];
    const expectedPath = '/asobi-pocket/seo/' + (name === 'index.html' ? '' : name);
    if (/http-equiv=["']refresh["']/i.test(source) || (canonical && new URL(canonical).pathname !== expectedPath)) {
      assert.doesNotMatch(source, /<script[^>]+src=["']analytics\.js["']/, name);
      continue;
    }
    assert.equal((source.match(/<script[^>]+src=["']analytics\.js["']/g) || []).length, 1, name);
  }
});

function run(source, href, storage = new Map(), blockedStorage = false, optedOut = false, analyticsOnly = false) {
  const listeners = new Map();
  const appended = [];
  const context = {
    URLSearchParams, Date,
    location: new URL(href),
    sessionStorage: {
      getItem(key) { if (blockedStorage) throw new Error('disabled'); return storage.get(key) ?? null; },
      setItem(key, value) { if (blockedStorage) throw new Error('disabled'); storage.set(key, value); },
      removeItem(key) { if (blockedStorage) throw new Error('disabled'); storage.delete(key); },
    },
    addEventListener(name, callback) {
      listeners.set(name, [...(listeners.get(name) || []), callback]);
    },
    setTimeout(callback) { callback(); },
    document: {
      title: 'あそびポケット',
      currentScript: { hasAttribute: () => analyticsOnly },
      querySelector: () => { if (analyticsOnly) throw new Error('既存DOMを変更しない'); return null; },
      querySelectorAll: () => { if (analyticsOnly) throw new Error('既存DOMを変更しない'); return []; },
      addEventListener() {},
      createElement: () => ({}),
      head: { appendChild(script) { appended.push(script); } },
    },
  };
  context.window = context;
  if (optedOut) context['ga-disable-G-FYFPS7L9X9'] = true;
  vm.runInNewContext(source, context);
  for (const name of ['load', 'pointerdown', 'keydown', 'scroll']) {
    for (const callback of listeners.get(name) || []) callback();
  }
  return { context, appended, storage };
}

for (const [name, source, pathname] of [
  ['ゲーム', appAnalytics, '/asobi-pocket/'],
  ['記事', articleAnalytics, '/asobi-pocket/seo/ito-odai.html'],
]) {
  test(name + ': ChatGPTタグ付きの一般アクセスを保持し、共通プロパティ内で分類する', () => {
    const href = 'https://katakatalab.com' + pathname + '?utm_source=chatgpt.com#game/ito';
    const { context, appended } = run(source, href);
    assert.equal(appended.length, 1);
    assert.equal(context['ga-disable-G-FYFPS7L9X9'], undefined);
    const config = context.dataLayer.find(args => args[0] === 'config');
    assert.equal(config[1], 'G-FYFPS7L9X9');
    assert.equal(config[2].content_group, 'Asobi Pocket');
    assert.equal(context.location.href, href);
    assert.equal(config[2].campaign_source, undefined);
    assert.equal(config[2].campaign_medium, undefined);
  });

  test(name + ': 明示したテスト・ローカル確認・既存オプトアウトではタグを読み込まない', () => {
    for (const [href, blocked, optedOut] of [
      ['https://katakatalab.com' + pathname + '?asobi_test=1', false, false],
      ['https://katakatalab.com' + pathname + '?asobi_test=1', true, false],
      ['http://localhost:4174' + pathname, false, false],
      ['https://katakatalab.com' + pathname, false, true],
    ]) {
      const result = run(source, href, new Map(), blocked, optedOut);
      assert.equal(result.appended.length, 0);
      assert.equal(result.context['ga-disable-G-FYFPS7L9X9'], true);
    }
  });

  test(name + ': 保存不可でも一般利用の計測を止めない', () => {
    assert.equal(run(source, 'https://katakatalab.com' + pathname, new Map(), true).appended.length, 1);
  });
}

test('同じタブの記事・ゲーム間でテスト指定を引き継ぎ、明示解除できる', () => {
  const storage = new Map();
  run(articleAnalytics, 'https://katakatalab.com/asobi-pocket/seo/ito-odai.html?asobi_test=1', storage);
  assert.equal(run(appAnalytics, 'https://katakatalab.com/asobi-pocket/#game/ito', storage).appended.length, 0);
  assert.equal(run(appAnalytics, 'https://katakatalab.com/asobi-pocket/?asobi_test=0', storage).appended.length, 1);
  assert.equal(run(articleAnalytics, 'https://katakatalab.com/asobi-pocket/seo/ito-odai.html', storage).appended.length, 1);
});

test('計測だけを補う記事では本文・パンくず・メタ情報のDOMを変更しない', () => {
  const result = run(articleAnalytics, 'https://katakatalab.com/asobi-pocket/seo/ito-odai.html', new Map(), false, false, true);
  assert.equal(result.appended.length, 1);
});
