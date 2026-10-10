'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..', 'my-webservice', 'asobi-pocket');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const gameSource = read('data/games.js');
const toolsSource = read('js/tools.js');
const appSource = read('js/app.js');
const qualitySource = read('js/quality/product-ux.js');

class FakeElement {
  constructor(name) {
    this.name = name; this.innerHTML = ''; this.textContent = ''; this.value = '';
    this.dataset = { idx: '0' }; this.disabled = false; this.listeners = {};
    this.children = []; this.style = {}; this.width = 300; this.height = 300;
    this.classList = { add() {}, remove() {}, toggle() { return false; }, contains() { return false; } };
  }
  addEventListener(type, callback) { this.listeners[type] = callback; }
  removeEventListener() {}
  querySelector(name) { return new FakeElement(name); }
  querySelectorAll() { return []; }
  setAttribute() {}
  getAttribute() { return ''; }
  appendChild(element) { this.children.push(element); }
  getBoundingClientRect() { return { left: 0, top: 0, width: 300, height: 300 }; }
  getContext() { return new Proxy({ measureText: () => ({ width: 10 }) }, { get: (obj, key) => obj[key] || (() => {}) }); }
}
class FakeContainer extends FakeElement {
  constructor() { super('container'); this.elements = new Map(); }
  querySelector(name) {
    if (!this.elements.has(name)) this.elements.set(name, new FakeElement(name));
    return this.elements.get(name);
  }
  querySelectorAll(name) {
    if (name === '.input-player-name') return [this.querySelector(name)];
    if (name === '.btn-vote-target') {
      if (!this.voteTargets) this.voteTargets = [1, 2, 3, 4].map(index => {
        const button = new FakeElement('vote-' + index);
        button.dataset.pid = String(index);
        return button;
      });
      return this.voteTargets;
    }
    if (name === '.btn-ww-vote-target') {
      if (this.voteHTML !== this.innerHTML) {
        this.voteHTML = this.innerHTML;
        this.ballotTargets = [...this.innerHTML.matchAll(/data-vote-id="(\d+)"/g)]
          .map(match => {
            const button = new FakeElement('ww-' + match[1]);
            button.dataset.voteId = match[1];
            return button;
          });
      }
      return this.ballotTargets || [];
    }
    if (name === '[data-add]' || name === '[data-target]') {
      const prop = name === '[data-add]' ? 'add' : 'target';
      const regex = name === '[data-add]' ? /data-add="(\d+)"/g : /data-target="(\d+)"/g;
      if (!this.groupCache) this.groupCache = new Map();
      const key = name + this.innerHTML;
      if (!this.groupCache.has(key)) {
        const elements = [...this.innerHTML.matchAll(regex)].map(match => {
          const button = new FakeElement(prop + '-' + match[1]);
          button.dataset[prop] = match[1];
          return button;
        });
        this.groupCache.set(key, elements);
      }
      return this.groupCache.get(key);
    }
    return [];
  }
}

function boot(warnings) {
  const noOp = () => {};
  const sound = new Proxy({}, { get: (_, key) => key === 'warning'
    ? (message) => warnings.push(message) : noOp });
  const context = {
    console,
    window: { SafeTimer: { setInterval: () => 1, clearInterval: noOp, setTimeout: () => 1, clearTimeout: noOp },
      addEventListener: noOp, removeEventListener: noOp, devicePixelRatio: 1, innerWidth: 500, innerHeight: 500 },
    document: { readyState: 'loading', createElement: (tag) => new FakeElement(tag), addEventListener: noOp,
      querySelector: () => new FakeElement('document'), querySelectorAll: () => [],
      body: { classList: { add: noOp, remove: noOp } } },
    navigator: {}, Sound: sound, Toast: sound, Confetti: sound,
    requestAnimationFrame: () => 1, cancelAnimationFrame: noOp,
    setInterval: () => 1, clearInterval: noOp, setTimeout: () => 1, clearTimeout: noOp,
    performance: { now: () => 100 }, Audio: function Audio() { return { play: () => Promise.resolve(), pause: noOp }; }
  };
  vm.createContext(context);
  vm.runInContext(gameSource + '\n' + toolsSource, context, { timeout: 2500, filename: 'game-harness.js' });
  return {
    games: vm.runInContext('GAMES_DATA', context),
    tools: vm.runInContext('GameTools', context),
    context
  };
}

const dispatch = new Map([...appSource.matchAll(/"([^"\n]+)": \(m, g\) => GameTools\.(\w+)\(m, g\)/g)]
  .map(match => [match[1], match[2]]));

test('every one of the 32 registered game routes can render an initial screen and release a cleanup callback', () => {
  const { games, tools } = boot([]);
  assert.equal(games.length, 32, 'new games require explicit review of smoke coverage');
  const ids = games.map(game => game.id);
  assert.equal(new Set(ids).size, games.length, 'game IDs are unique');
  for (const game of games) {
    const method = dispatch.get(game.toolType);
    assert.ok(method && typeof tools[method] === 'function', game.id + ': missing renderer');
    const container = new FakeContainer();
    const cleanup = tools[method](container, game);
    assert.ok(container.innerHTML.length > 50, game.id + ': missing first screen');
    assert.match(container.innerHTML, /class="[^"]*\b(?:tool-card|duel-container|roulette-container)\b/, game.id + ': game interface missing');
    if (typeof cleanup === 'function') cleanup();
  }
});

test('production data contract and tool-fix overrides still render all 32 games', () => {
  const { context } = boot([]);
  vm.runInContext(read('js/quality/data-contract.js'), context, { timeout: 2500 });
  vm.runInContext(read('js/quality/tool-fixes.js'), context, { timeout: 2500 });
  const games = vm.runInContext('GAMES_DATA', context);
  const tools = vm.runInContext('GameTools', context);
  assert.equal(games.length, 32);
  for (const game of games) {
    const method = dispatch.get(game.toolType);
    assert.ok(method && typeof tools[method] === 'function', game.id + ': no final renderer');
    const mount = new FakeContainer();
    const cleanup = tools[method](mount, game);
    assert.ok(mount.innerHTML.length > 50, game.id + ': empty production screen');
    assert.match(mount.innerHTML, /class="[^"]*\b(?:tool-card|duel-container|roulette-container)\b/, game.id + ': game interface missing');
    assert.doesNotMatch(mount.innerHTML, /\[object Object\]/, game.id + ': preset rendered as object');
    if (typeof cleanup === 'function') cleanup();
  }
});

test('ito escapes player names in quoted input attributes after a rerender', () => {
  const { tools } = boot([]);
  const container = new FakeContainer();
  tools.renderIto(container, { id: 'ito', presets: ['好きな食べ物'] });
  const payload = 'A" autofocus onfocus="alert(1) <svg onload=alert(1)>';
  container.querySelector('.input-player-name').listeners.input({ target: { dataset: { idx: '0' }, value: payload } });
  container.querySelector('#range-ito-players').listeners.input({ target: { value: '4' } });
  const markup = container.innerHTML;
  const input = markup.match(/<input type="text" class="input-player-name" data-idx="0"[^>]*>/);
  assert.ok(input, 'first player input is present');
  assert.match(input[0], /&quot;/);
  assert.match(input[0], /&lt;svg/);
  // Attribute-looking text inside a quoted value is data, not a new attribute.
  const attributes = input[0].replace(/"[^"]*"|'[^']*'/g, '""');
  assert.doesNotMatch(attributes, /\s(?:autofocus|onfocus|onload)\b/i);
  assert.match('<input value="A" autofocus onfocus="alert(1)">'.replace(/"[^"]*"|'[^']*'/g, '""'), /\s(?:autofocus|onfocus|onload)\b/i, 'unsafe attribute breakout must still be detected');
  assert.doesNotMatch(input[0], /<svg/);
  assert.match(input[0], /maxlength="40"/);
});

test('High & Low rejects invalid or out-of-range guesses without consuming an attempt', () => {
  const warnings = [];
  const { tools } = boot(warnings);
  const container = new FakeContainer();
  tools.renderHighLow(container, { id: 'high-and-low-guess' });
  for (const guess of ['0', '1001', '-2', '3.5', '42abc', 'Infinity']) {
    container.querySelector('#input-highlow-guess').value = guess;
    container.querySelector('#btn-highlow-submit').listeners.click();
  }
  assert.equal(warnings.length, 6);
  assert.match(container.innerHTML, /コール回数: 0回/);
  assert.match(container.innerHTML, /min="1" max="100" step="1"/);
});

test('One Night Werewolf settings allow all seven players advertised in its data', () => {
  const { tools } = boot([]);
  const container = new FakeContainer();
  tools.renderOneNightWerewolf(container, { id: 'one-night-werewolf' });
  assert.match(container.innerHTML, /min="3" max="7"/);
  container.querySelector('#range-ww-players').listeners.input({ target: { value: '7' } });
  container.querySelector('#btn-start-ww').listeners.click();
  assert.match(container.innerHTML, /順番: 1 \/ 7 人目/);
});

test('monetization decoration is idempotent under MutationObserver', () => {
  const match = qualitySource.match(/  const decorateMonetization = \(\) => \{[\s\S]*?\n  \};/);
  assert.ok(match);
  let writes = 0;
  const badge = { _text: 'PR', get textContent() { return this._text; },
    set textContent(value) { writes++; this._text = value; } };
  const note = { hidden: false };
  const detail = { querySelectorAll: (selector) => selector === '.product-badge-pr' ? [badge] : [note] };
  const doc = {
    getElementById: (id) => id === 'view-detail' ? detail : null,
    querySelectorAll: () => { throw new Error('must not rescan the entire document'); }
  };
  const decorate = Function('document', 'globalThis', match[0] + '\nreturn decorateMonetization;')(
    doc, { AFFILIATE_CONFIG: { isAffiliateEnabled: false } });
  decorate(); decorate(); decorate();
  assert.equal(writes, 1, 'repeat DOM writes would cause observer microtask loops');
  assert.equal(badge.textContent, '関連商品');
  assert.equal(note.hidden, true);
});

test('new share windows cannot retain window.opener', () => {
  for (const [name, content] of [['tools.js', toolsSource], ['app.js', appSource]]) {
    const calls = [...content.matchAll(/window\.open\([^\n;]+\);/g)].map(match => match[0]);
    assert.ok(calls.length > 0, name + ': missing expected share popup coverage');
    for (const call of calls) {
      assert.match(call, /"_blank", "noopener,noreferrer"/, name + ': popup must not have an opener');
    }
  }
});

test('game runtime does not evaluate arbitrary text as JavaScript or fetch external game instructions', () => {
  for (const [name, content] of [['tools.js', toolsSource], ['app.js', appSource]]) {
    assert.doesNotMatch(content, /\beval\s*\(|\bnew\s+Function\s*\(|\bdocument\.write\s*\(/, name);
  }
  assert.doesNotMatch(toolsSource, /\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/);
});

test('Word Wolf does not accept a single-character guess as the entire majority topic', () => {
  const { tools, context } = boot([]);
  context.Math = Object.create(Math);
  context.Math.random = () => 0;
  vm.runInContext(read('js/quality/tool-fixes.js'), context, { filename: 'tool-fixes.js' });
  const fixture = { id: 'word-wolf', presets: [{ citizen: 'こいぬ', wolf: 'ねこ', category: '動物' }] };

  function playRound(answer) {
    const container = new FakeContainer();
    tools.renderWordWolf(container, fixture);
    container.querySelector('#btn-start-wolf').listeners.click();
    for (let index = 0; index < 4; index++) {
      container.querySelector('#btn-reveal-word').listeners.click();
      container.querySelector('#btn-next-player').listeners.click();
    }
    assert.match(container.innerHTML, /トークタイム中/);
    container.querySelector('#btn-finish-talk').listeners.click();
    assert.match(container.innerHTML, /最多票の人を選択/);
    container.querySelectorAll('.btn-vote-target')[0].listeners.click();
    container.querySelector('#btn-open-roles').listeners.click();
    assert.match(container.innerHTML, /ウルフの逆転チャンス/);
    container.querySelector('#input-wolf-guess').value = answer;
    container.querySelector('#btn-judge-wolf-guess').listeners.click();
    return container.querySelector('#wolf-guess-result-msg').innerHTML;
  }

  assert.match(playRound('こ'), /市民側の勝利/);
  assert.match(playRound('こいぬ'), /ウルフ側の逆転勝利/);
  assert.match(playRound('コイヌ'), /ウルフ側の逆転勝利/);
  assert.match(read('js/quality/tool-fixes.js'), /max="10" value/);
});

test('Takenoko accepts twelve advertised players but never counts past the group', () => {
  const { tools } = boot([]);
  const container = new FakeContainer();
  tools.renderTakenoko(container, { id: 'takenoko-nyokki' });
  assert.match(container.innerHTML, /min="3" max="12"/);
  container.querySelector('#range-takenoko').listeners.input({ target: { value: '12' } });
  for (let index = 0; index < 12; index++) container.querySelector('#btn-takenoko-next').listeners.click();
  assert.match(container.innerHTML, /12 ニョッキ/);
  assert.match(container.innerHTML, /全員の番が終わりました/);
  container.querySelector('#btn-takenoko-next').listeners.click();
  assert.match(container.innerHTML, /12 ニョッキ/);
});

test('stored topics tolerate malformed schemas, reject unknown games, and cap repeated entries', () => {
  const sectionStart = appSource.indexOf('  const TopicManager = {');
  const sectionEnd = appSource.indexOf('  window.TopicManager = TopicManager;', sectionStart);
  assert.ok(sectionStart >= 0 && sectionEnd > sectionStart);
  const code = appSource.slice(sectionStart, sectionEnd);
  const { games } = boot([]);
  const map = new Map([['asobi_custom_topics', { ito: 'invalid-schema' }], ['asobi_excluded_topics', []]]);
  const storage = {
    get: (key, fallback) => map.has(key) ? map.get(key) : fallback,
    set: (key, value) => map.set(key, value)
  };
  const manager = Function('Storage', 'GAMES_DATA', code + '\nreturn TopicManager;')(storage, games);
  assert.deepEqual(manager.getCustomTopics('ito'), []);
  assert.deepEqual(manager.getExcludedTopics('ito'), []);
  assert.equal(manager.addCustomTopic('__proto__', 'test'), false);
  assert.equal(manager.addCustomTopic('unknown', 'test'), false);
  assert.equal(manager.addCustomTopic('ito', 42), false);
  assert.equal(manager.addCustomTopic('ito', '<svg onload=alert(1)>'), true);
  assert.equal(manager.addCustomTopic('ito', '<svg onload=alert(1)>'), false);
  assert.equal(manager.addCustomTopic('ito', 'x'.repeat(500)), true);
  assert.equal(manager.getCustomTopics('ito')[1].length, 160);
  assert.ok(manager.getActiveTopics('ito', ['ねこ']).includes('ねこ'));
});


test('HTML escaping coerces objects before encoding potentially executable markup', () => {
  const { context } = boot([]);
  const encoded = vm.runInContext(
    'escapeHTML({ toString() { return "<svg onload=alert(1)>\\\"&"; } })', context
  );
  assert.equal(encoded, '&lt;svg onload=alert(1)&gt;&quot;&amp;');
  assert.equal(vm.runInContext('escapeHTML(0)', context), '0');
  assert.equal(vm.runInContext('escapeHTML(null)', context), '');
});

test('GameTimer keeps wall-clock time after a throttled tab and finishes only once', () => {
  const start = toolsSource.indexOf('class GameTimer {');
  const endMarker = 'GameTimer.activeTimer = null;';
  const end = toolsSource.indexOf('\n' + endMarker, start);
  assert.ok(start > -1 && end > start);
  let now = 1_000, callback, cleared = 0, finished = 0;
  const scope = {
    Date: { now: () => now },
    safeSetInterval: (fn) => { callback = fn; return 7; },
    safeClearInterval: () => { cleared++; },
    Sound: { playTick() {} }
  };
  const Timer = vm.runInNewContext(toolsSource.slice(start, end + 1 + endMarker.length) + '\nGameTimer', scope);
  const seen = [];
  const timer = new Timer({ totalSeconds: 10, onTick: n => seen.push(n), onFinish: () => { finished++; } });
  timer.start();
  now += 6_200; callback();
  assert.equal(timer.remaining, 4);
  timer.pause();
  now += 20_000;
  assert.equal(timer.remaining, 4, 'pausing freezes the remaining time');
  timer.start();
  now += 4_100; callback();
  assert.equal(timer.remaining, 0);
  assert.equal(finished, 1);
  assert.deepEqual(seen, [4, 0]);
  assert.equal(cleared, 2);
  callback();
  assert.equal(finished, 1, 'a stale callback cannot finish a second time');
});

test('CSP bootstrap uses external JavaScript and Xserver headers are scoped and staged', () => {
  const html = read('index.html');
  const bootstrap = read('js/bootstrap.js');
  const headers = read('.htaccess');
  assert.match(html, /<script defer src="js\/bootstrap\.js"><\/script>/);
  assert.doesNotMatch(html, /<script>(?:.|[\r\n])*?<\/script>/, 'no executable inline scripts');
  assert.match(bootstrap, /G-FYFPS7L9X9/);
  assert.match(bootstrap, /serviceWorker\.register\("\.\/sw\.js"/);
  for (const expected of [
    'X-Content-Type-Options', 'Referrer-Policy', 'X-Frame-Options',
    'Permissions-Policy', 'Content-Security-Policy "', 'Content-Security-Policy-Report-Only "'
  ]) assert.ok(headers.includes(expected), 'missing header: ' + expected);
  assert.match(headers, /script-src 'self' https:\/\/www\.googletagmanager\.com/);
  assert.doesNotMatch(headers, /script-src[^;\n]*'unsafe-inline'/);
  assert.match(read('sw.js'), /"\.\/js\/bootstrap\.js"/);
});


test('corrupt persisted application state falls back without breaking games or the scoreboard', () => {
  const begin = appSource.indexOf('  const Storage = {');
  const end = appSource.indexOf('  // 画面自動スリープ防止', begin);
  assert.ok(begin > 0 && end > begin, 'storage source must remain discoverable');
  const data = new Map([
    ['asobi_played_games', JSON.stringify({ unexpected: true })],
    ['asobi_favorites', JSON.stringify([42, null, 'ito', '<svg>'.repeat(200)])],
    ['asobi_recent_history', JSON.stringify(['ito', 'word-wolf'])],
    ['asobi_scoreboard_players', JSON.stringify(['broken', null, { name: 'テスト', score: '17' },
      { name: '<img src=x onerror=alert(1)>', score: 'Infinity' }])],
    ['asobi_theme_dark', JSON.stringify('true')],
    ['asobi_kids_mode', 'not valid JSON'],
    ['asobi_custom_topics', JSON.stringify(['wrong type'])]
  ]);
  const store = {
    getItem(key) { return data.get(key) ?? null; },
    setItem(key, value) { data.set(key, value); }
  };
  const Storage = Function('localStorage', appSource.slice(begin, end) + '\nreturn Storage;')(store);
  assert.deepEqual(Storage.get('asobi_played_games', []), []);
  assert.deepEqual(Storage.get('asobi_favorites', []), ['ito']);
  assert.deepEqual(Storage.get('asobi_recent_history', []), ['ito', 'word-wolf']);
  assert.equal(Storage.get('asobi_theme_dark', false), false);
  assert.equal(Storage.get('asobi_kids_mode', false), false);
  assert.deepEqual(Storage.get('asobi_custom_topics', {}), {});
  assert.deepEqual(Storage.get('asobi_scoreboard_players', []), [
    { name: 'テスト', score: 17 },
    { name: '<img src=x onerror=alert(1)>', score: 0 }
  ]);
  data.set('asobi_scoreboard_players', JSON.stringify([{ name: { unexpected: true }, score: 0 }]));
  assert.equal(Storage.get('asobi_scoreboard_players', [])[0].name, 'プレイヤー1');
  const previous = Storage.get('asobi_recent_history', []);
  assert.deepEqual(previous, ['ito', 'word-wolf'], 'valid records are kept');
});


test('scoreboard normalization clamps huge and invalid persisted values', () => {
  const start = qualitySource.indexOf('    const MAX_PLAYERS = ', qualitySource.indexOf('  const setupScoreboard = () => {'));
  const end = qualitySource.indexOf('\n\n    let players =', start);
  assert.ok(start > 0 && end > start);
  const normalize = Function(qualitySource.slice(start, end) + '\nreturn normalize;')();
  const people = normalize([
    { name: 'X'.repeat(200), score: 1e308 },
    { name: 'minus', score: -1e308 },
    { name: 'bad', score: 'not-a-number' }
  ]);
  assert.equal(people.length, 3);
  assert.equal(people[0].name.length, 40);
  assert.equal(people[0].score, 999999);
  assert.equal(people[1].score, -999999);
  assert.equal(people[2].score, 0);
  assert.equal(normalize([{ name: {}, score: 0 }])[0].name, 'プレイヤー1');
  assert.equal(normalize(null).length, 2);
  assert.equal(normalize([]).length, 2);
  assert.equal(normalize(Array.from({ length: 100 }, (_, i) => ({ name: String(i), score: 0 }))).length, 20);
});


test('SEO guide destinations never accept external scripts or path traversal', () => {
  const beginning = appSource.indexOf('    const seoSlug = typeof game.seoSlug');
  assert.ok(beginning > 0, 'detail view must validate article links');
  const end = appSource.indexOf(';', beginning);
  assert.ok(end > beginning);
  const resolve = Function('game', appSource.slice(beginning, end + 1) + '\nreturn seoSlug;');
  assert.equal(resolve({ seoSlug: 'seo/ito-odai.html' }), 'seo/ito-odai.html');
  for (const hostile of [
    'javascript:alert(1)', 'https://attacker.example/foo.html',
    'seo/../../index.html', 'seo/test.html" onmouseover="alert(1)',
    '/seo/test.html', 'seo/test.svg', null, 100
  ]) {
    assert.equal(resolve({ seoSlug: hostile }), null, String(hostile));
  }
  assert.match(appSource, /href="\$\{escapeHTML\(seoSlug\)\}" target="_blank" rel="noopener noreferrer"/);
});

test('One Night Werewolf supports every private vote and computes the all-ones no-execution rule', () => {
  const { tools, context } = boot([]);
  vm.runInContext(read('js/quality/data-contract.js'), context);
  vm.runInContext(read('js/quality/tool-fixes.js'), context);
  const c = new FakeContainer();
  const cleanup = tools.renderOneNightWerewolf(c);
  c.querySelector('#btn-start-ww').listeners.click();
  for (let i = 0; i < 4; i++) {
    c.querySelector('#btn-reveal-role').listeners.click();
    c.querySelector('#btn-next-ww-player').listeners.click();
  }
  assert.match(c.innerHTML, /朝の議論タイム/);
  c.querySelector('#btn-ww-finish').listeners.click();
  const targets = [2, 3, 4, 1];
  for (let i = 0; i < targets.length; i++) {
    const btn = c.querySelectorAll('.btn-ww-vote-target')
      .find(item => Number(item.dataset.voteId) === targets[i]);
    assert.ok(btn, 'voter ' + (i + 1) + ' can select another player');
    btn.listeners.click();
    c.querySelector('#btn-ww-confirm-vote').listeners.click();
  }
  assert.match(c.innerHTML, /全員の投票が完了/);
  c.querySelector('#btn-open-ww-result').listeners.click();
  assert.match(c.innerHTML, /処刑なし（全員に1票ずつ）/);
  assert.match(c.innerHTML, /投票結果・最終役職/);
  c.querySelector('#btn-restart-ww').listeners.click();
  assert.match(c.innerHTML, /ワンナイト人狼 設定/);
  if (typeof cleanup === 'function') cleanup();
});

test('Count to 21 stops at the exact target and retains result until replay', () => {
  const { tools } = boot([]);
  const c = new FakeContainer();
  tools.renderCount30(c, { id: 'counting-game-30' });
  c.querySelectorAll('[data-target]').find(button => button.dataset.target === '21').listeners.click();
  for (let i = 0; i < 7; i++) {
    c.querySelectorAll('[data-add]').find(button => button.dataset.add === '3').listeners.click();
  }
  assert.match(c.innerHTML, /21 \/ 21/);
  assert.match(c.innerHTML, /決着！/);
  const prior = c.innerHTML;
  c.querySelectorAll('[data-add]').find(button => button.dataset.add === '3').listeners.click();
  assert.equal(c.innerHTML, prior, 'invalid clicks cannot exceed the target');
  c.querySelector('#btn-reset-count30').listeners.click();
  assert.match(c.innerHTML, /0 \/ 21/);
});

test('20 Questions records inert question notes and disables logs at the 20-question limit', () => {
  const { tools } = boot([]);
  const c = new FakeContainer();
  tools.renderTwentyQuestions(c, { id: 'twenty-questions', presets: [] });
  const payload = '<svg onload=alert(1)>';
  c.querySelector('#input-twenty-question').value = payload;
  c.querySelector('#btn-log-yes').listeners.click();
  assert.match(c.innerHTML, /&lt;svg onload=alert\(1\)&gt;/);
  assert.doesNotMatch(c.innerHTML, /<svg onload=/);
  for (let i = 1; i < 20; i++) c.querySelector('#btn-log-no').listeners.click();
  assert.match(c.innerHTML, /0 \/ 20/);
  assert.match(c.innerHTML, /20問使い切りました/);
  const prior = c.innerHTML;
  c.querySelector('#btn-log-no').listeners.click();
  assert.equal(c.innerHTML, prior);
  c.querySelector('#btn-reset-twenty').listeners.click();
  assert.match(c.innerHTML, /20 \/ 20/);
});

test('Indian Poker deals two distinct cards and blocks reveal until both players decide', () => {
  const { tools, context } = boot([]);
  vm.runInContext('Math.random = () => 0.1', context);
  const c = new FakeContainer();
  tools.renderIndianPoker(c, { id: 'indian-poker' });
  assert.match(c.innerHTML, /id="btn-poker-open" disabled/);
  c.querySelector('#btn-poker-open').onclick();
  assert.doesNotMatch(c.innerHTML, /id="btn-poker-next"/);
  c.querySelector('#btn-p1-bet').onclick();
  assert.match(c.innerHTML, /id="btn-poker-open" disabled/);
  c.querySelector('#btn-p2-bet').onclick();
  c.querySelector('#btn-poker-open').onclick();
  const match = c.innerHTML.match(/P1: \[([^\]]+)\] vs P2: \[([^\]]+)\]/);
  assert.ok(match, 'revealed both ranks and suits');
  assert.notEqual(match[1], match[2], 'cannot draw the same deck card twice');
  c.querySelector('#btn-poker-next').onclick();
  assert.match(c.innerHTML, /id="btn-poker-open" disabled/);
});

test('active quality overrides own duel renderers, not the superseded tools.js methods', () => {
  const { tools, context } = boot([]);
  const legacy = Object.fromEntries(['renderDuelReflex','renderDuelMash','renderFingerRoulette','renderGesture']
    .map(key => [key, tools[key]]));
  vm.runInContext(read('js/quality/tool-fixes.js'), context);
  for (const key of Object.keys(legacy)) {
    assert.notEqual(tools[key], legacy[key], key + ' must be tested through the active override');
  }
});


test('Sea Turtle has 22 distinct, playable, internally consistent editorial puzzle contracts', () => {
  const { games } = boot([]);
  const game = games.find(record => record.id === 'sea-turtle');
  assert.ok(game, 'Sea Turtle game must exist');
  const puzzles = game.presets;
  assert.equal(puzzles.length, 22, 'unintended deletions require editorial review');

  const seen = new Set();
  puzzles.forEach((puzzle, index) => {
    const tag = 'riddle ' + (index + 1);
    for (const field of ['title', 'question', 'answer']) {
      assert.equal(typeof puzzle[field], 'string', tag + ' missing ' + field);
      assert.ok(puzzle[field].trim().length >= 5, tag + ' too-short ' + field);
    }
    assert.ok(Array.isArray(puzzle.hints) && puzzle.hints.length >= 3, tag + ' incomplete hints');
    assert.ok(puzzle.hints.every(hint => typeof hint === 'string' && hint.trim().length >= 5),
      tag + ' malformed hint');
    assert.ok(!seen.has(puzzle.title), tag + ' duplicate title');
    seen.add(puzzle.title);
  });

  assert.match(puzzles[6].question, /公園/, 'safe mystery replaces misleading fabricated medical guidance');
  assert.match(puzzles[6].answer, /枯れ枝/, 'riddle answer explains the observed danger');
  assert.match(puzzles[7].answer, /捜索/, 'record mystery resolves to a realistic rescue');
  assert.equal(puzzles[11].title, '停電と危機');
  assert.match(puzzles[11].question, /遠くにいる大勢の人/, 'the threatened people match the lighthouse answer');
  assert.equal(puzzles[12].title, '毎日のラブレター');
  assert.match(puzzles[13].answer, /下側の男が足を滑らせ/, 'rope direction matches the rescue mechanism');
  assert.match(puzzles[17].answer, /氷は溶けて水となり/, 'ice is not described as evaporating to a puddle');
  assert.match(puzzles[19].question, /買おうとし/, 'a purchase is not completed before payment');
  assert.match(puzzles[20].question, /音も一切聞こえない/, 'silent crossing video matches its answer');
  assert.match(puzzles[20].answer, /テレビ/, 'no unmentioned physical crossing required');
});


test('PWA cached assets stay inside the site and the release fingerprint is synchronized', () => {
  const { syncPwaReleases } = require('../scripts/sync-pwa-releases.cjs');
  const sw = read('sw.js');
  // Includes ./ (site root) and the separate ./index.html cache URL by design.
  const cacheURLs = [...sw.matchAll(/"(\.\/[^"]*)"/g)].map(match => match[1]).sort();
  assert.ok(cacheURLs.length >= 28, 'unexpected reduction of offline assets');

  for (const url of cacheURLs) {
    const relative = url.slice(2).split(/[?#]/, 1)[0] || 'index.html';
    const segments = relative.split('/');
    assert.ok(segments.length > 0 && segments.every(part => part && part !== '.' && part !== '..'),
      'unsafe offline asset path ' + relative);
    const file = path.resolve(root, relative);
    assert.ok(file.startsWith(root + path.sep), 'offline asset points outside the site');
    assert.ok(fs.existsSync(file), 'missing offline asset ' + relative);
  }
  const actual = sw.match(/const CACHE_NAME = "(asobi-pocket-[a-f0-9]{20})"/)?.[1];
  assert.ok(actual, 'missing named version for PWA deployment');
  assert.deepEqual(syncPwaReleases(path.resolve(root, '../..')), [],
    'cached asset bytes changed without an updated service worker cache name');
});
