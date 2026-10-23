'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const base = path.resolve(__dirname, '../my-webservice/asobi-pocket');
const read = pathName => fs.readFileSync(path.join(base, pathName), 'utf8');
const ACTIONS = Object.freeze({
  'ito': '#btn-start-ito',
  'asa-sore': '#btn-shuffle-both',
  'word-wolf': '#btn-start-wolf',
  'duel-reflex': '#btn-duel-start',
  'duel-mash': '#btn-mash-start',
  'duel-color': '#btn-color-start',
  'bomb-timer': '#btn-start-bomb',
  'katakana-ban': '#btn-kata-pass',
  'finger-roulette': null, // Multi-pointer game uses the canvas rather than a button.
  'two-choices': '#btn-next-choice',
  'sea-turtle': '#btn-toggle-answer',
  'ten-seconds': '#btn-sw-start',
  'talk-gacha': '#btn-spin-gacha',
  'ng-word': '#btn-p1-said',
  'indian-poker': '#btn-p2-bet',
  'one-night-werewolf': '#btn-start-ww',
  'yomibito': '#btn-submit-kami',
  'batsu-roulette': '#btn-batsu-pass',
  'rhythm-box': '#btn-next-yamanote-topic',
  'yamanote-game': '#btn-toggle-rhythm',
  'stand-up-game': '#btn-next-parent',
  'ping-pong-pang': '#btn-pingpong-next',
  'takenoko-nyokki': '#btn-takenoko-next',
  'high-and-low-guess': '#btn-highlow-submit',
  'magical-banana': '#btn-next-banana-word',
  'twenty-questions': '#btn-log-yes',
  'good-and-bad-news': '#btn-next-turn',
  'counting-game-30': '[data-add]',
  'word-chain-limit': '#btn-next-rule',
  'two-truths-one-lie': '#btn-suggest-prompt',
  'doremi-song': '#btn-next-doremi',
  'silent-gesture': '#btn-gesture-start'
});

class Element {
  constructor(key, attrs, owner) {
    this.key = key;
    this.owner = owner;
    this.attrs = attrs;
    this.dataset = {};
    for (const [name, value] of Object.entries(attrs)) {
      if (name.startsWith('data-')) {
        const key = name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        this.dataset[key] = value;
      }
    }
    this.listeners = new Map();
    this.onclick = null;
    this.value = attrs.value || '';
    this.textContent = '';
    this.innerHTML = '';
    this.className = attrs.class || '';
    this.style = {};
    this.disabled = Object.prototype.hasOwnProperty.call(attrs, 'disabled');
    this.classList = {
      add() {}, remove() {}, contains() { return false; }, toggle() { return false; }
    };
    this.width = 320;
    this.height = 480;
    this.clientWidth = 320;
    this.clientHeight = 480;
  }

  addEventListener(event, listener) { this.listeners.set(event, listener); }
  removeEventListener() {}
  setAttribute() {}
  getAttribute(name) { return this.attrs[name] ?? null; }
  appendChild() {}
  append() {}
  querySelector(selector) { return this.owner?.querySelector(selector) ?? null; }
  querySelectorAll(selector) { return this.owner?.querySelectorAll(selector) ?? []; }
  getBoundingClientRect() { return { left: 0, top: 0, width: 320, height: 480 }; }
  getContext() {
    const canvas = { measureText: () => ({ width: 14 }) };
    return new Proxy(canvas, { get(object, property) {
      return object[property] || (() => {});
    } });
  }
  click(eventType = 'click') {
    const listener = this.listeners.get(eventType) || (eventType === 'click' && this.onclick);
    if (!listener) throw new Error('No registered ' + eventType + ' action: ' + this.key);
    listener({
      type: eventType, target: this, currentTarget: this,
      detail: 1, clientX: 75, clientY: 130,
      preventDefault() {}, stopPropagation() {}
    });
  }
}

class FakeMount {
  constructor() {
    this.markup = '';
    this.nodes = new Map();
  }
  set innerHTML(value) { this.markup = String(value); this.nodes.clear(); }
  get innerHTML() { return this.markup; }
  tags() {
    const found = [];
    for (const match of this.markup.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)) {
      const attrs = {};
      for (const part of match[2].matchAll(/([\w:-]+)(?:\s*=\s*"([^"]*)")?/g)) {
        attrs[part[1]] = part[2] ?? '';
      }
      found.push({ tag: match[1], attrs });
    }
    return found;
  }
  matches(selector) {
    const id = selector.match(/^#([\w-]+)$/);
    if (id) return this.tags().filter(tag => tag.attrs.id === id[1]);
    const cls = selector.match(/^\.([\w-]+)$/);
    if (cls) return this.tags().filter(tag => tag.attrs.class?.split(/\s+/).includes(cls[1]));
    const attribute = selector.match(/^\[data-([\w-]+)\]$/);
    if (attribute) return this.tags().filter(tag => Object.hasOwn(tag.attrs, 'data-' + attribute[1]));
    if (/^#[\w-]+\s+\.[\w-]+$/.test(selector)) {
      const className = selector.split('.').at(-1);
      return this.tags().filter(tag => tag.attrs.class?.split(/\s+/).includes(className));
    }
    return [];
  }
  instance(tag, index) {
    const attrs = tag.attrs;
    const data = Object.entries(attrs).filter(([key]) => key.startsWith('data-'))
      .map(([key, value]) => key + '=' + value).join(',');
    const key = (attrs.id ? '#' + attrs.id : (attrs.class || tag.tag) + ':' + data) + ':' + index;
    if (!this.nodes.has(key)) this.nodes.set(key, new Element(key, attrs, this));
    return this.nodes.get(key);
  }
  querySelector(selector) {
    const matches = this.matches(selector);
    return matches.length ? this.instance(matches[0], 0) : null;
  }
  querySelectorAll(selector) {
    return this.matches(selector).map((tag, index) => this.instance(tag, index));
  }
}

function createGameRuntime() {
  let nextTimerId = 1;
  const timers = new Map();
  const noOp = () => {};
  const sound = new Proxy({}, { get: () => noOp });
  const location = { href: 'https://example.test/asobi-pocket/', hash: '', pathname: '/asobi-pocket/' };
  const window = {
    location, innerWidth: 420, innerHeight: 780, devicePixelRatio: 1,
    StampRally: { markPlayed: noOp },
    addEventListener: noOp, removeEventListener: noOp
  };
  window.SafeTimer = {
    setInterval(callback) { const id = ++nextTimerId; timers.set(id, callback); return id; },
    clearInterval(id) { timers.delete(id); },
    setTimeout(callback) { const id = ++nextTimerId; timers.set(id, callback); return id; },
    clearTimeout(id) { timers.delete(id); }
  };
  const document = {
    readyState: 'loading', addEventListener: noOp, querySelector: () => null,
    querySelectorAll: () => [], createElement: name => new Element(name, {}, null),
    body: { classList: { add: noOp, remove: noOp }, appendChild: noOp }
  };
  const context = {
    window, document, location, navigator: {},
    console, URL, Toast: sound, Confetti: sound,
    requestAnimationFrame: () => 1, cancelAnimationFrame: noOp,
    setInterval: window.SafeTimer.setInterval, clearInterval: window.SafeTimer.clearInterval,
    setTimeout: window.SafeTimer.setTimeout, clearTimeout: window.SafeTimer.clearTimeout,
    performance: { now: () => 100 },
    Audio: function Audio() { return { play: () => Promise.resolve(), pause: noOp }; }
  };
  vm.createContext(context);
  for (const file of [
    'js/audio.js', 'data/games.js', 'js/tools.js', 'js/quality/data-contract.js',
    'js/quality/tool-fixes.js'
  ]) {
    vm.runInContext(read(file), context, { timeout: 2500, filename: file });
  }
  return {
    catalog: vm.runInContext('GAMES_DATA', context),
    tools: vm.runInContext('GameTools', context),
    sound: vm.runInContext('Sound', context),
    timers
  };
}

test('game audio calls resolve to real engine methods even when muted', () => {
  const { sound } = createGameRuntime();
  for (const file of ['js/tools.js', 'js/quality/tool-fixes.js']) {
    for (const match of read(file).matchAll(/\bSound\.(\w+)\s*\(/g)) {
      assert.equal(typeof sound[match[1]], 'function', file + ': missing Sound.' + match[1]);
    }
  }
  sound.playWrong();
  assert.equal(sound.ctx, null, 'muted feedback must not initialize audio');
});

const DISPATCH = Object.freeze({
  ito: 'renderIto', 'asa-sore': 'renderAsaSore', wordwolf: 'renderWordWolf',
  'duel-reflex': 'renderDuelReflex', 'duel-mash': 'renderDuelMash',
  'duel-color': 'renderDuelColor', 'bomb-timer': 'renderBombTimer',
  'katakana-ban': 'renderKatakanaBan', 'finger-roulette': 'renderFingerRoulette',
  'two-choices': 'renderTwoChoices', 'sea-turtle': 'renderSeaTurtle',
  'ten-seconds': 'renderTenSeconds', 'talk-gacha': 'renderTalkGacha',
  'ng-word': 'renderNgWord', 'indian-poker': 'renderIndianPoker',
  'one-night-werewolf': 'renderOneNightWerewolf', yomibito: 'renderYomibito',
  'batsu-roulette': 'renderBatsuRoulette', 'rhythm-box': 'renderRhythmBox',
  yamanote: 'renderYamanote', 'stand-up': 'renderStandUp',
  'ping-pong': 'renderPingPong', takenoko: 'renderTakenoko',
  'high-low': 'renderHighLow', 'magical-banana': 'renderMagicalBanana',
  'twenty-questions': 'renderTwentyQuestions', 'good-bad-news': 'renderGoodBadNews',
  'count-30': 'renderCount30', 'word-chain': 'renderWordChain',
  'two-truths': 'renderTwoTruths', doremi: 'renderDoremi', gesture: 'renderGesture'
});

const GAME_DATA = createGameRuntime().catalog;
test('catalog covers exactly 32 uniquely-addressable game records', () => {
  assert.equal(GAME_DATA.length, 32);
  assert.equal(new Set(GAME_DATA.map(game => game.id)).size, 32);
  assert.deepEqual(Array.from(GAME_DATA, game => game.id).sort(), Object.keys(ACTIONS).sort());
});

for (const game of GAME_DATA) {
  test('game ' + game.id + ': first actual user action does not throw in the final renderer', () => {
    const { catalog, tools, timers } = createGameRuntime();
    const live = catalog.find(record => record.id === game.id);
    const rendererName = DISPATCH[live.toolType];
    assert.equal(typeof tools[rendererName], 'function', game.id + ': no registered implementation');
    const mount = new FakeMount();
    const cleanup = tools[rendererName](mount, live);
    assert.ok(mount.innerHTML.length > 50, game.id + ': cannot render initial UI');
    try {
      const selector = ACTIONS[game.id];
      if (selector === null) {
        const canvasArea = mount.querySelector('#touch-area');
        assert.ok(canvasArea, 'finger selection surface missing');
        // Simulate two virtual fingers; a browser will perform actual events.
        const tap = (x) => canvasArea.listeners.get('click')({
          target: { closest: () => null }, detail: 1,
          clientX: x, clientY: 140, preventDefault() {}
        });
        tap(55); tap(245);
        assert.ok(timers.size > 0, 'finger picker did not schedule a selection');
      } else {
        const element = mount.querySelector(selector);
        assert.ok(element, game.id + ': first action missing: ' + selector);
        if (game.id === 'yomibito') mount.querySelector('#input-kami').value = 'あさおきて';
        if (game.id === 'high-and-low-guess') mount.querySelector('#input-highlow-guess').value = '50';
        element.click();
      }
      assert.ok(mount.innerHTML.length > 40, game.id + ': UI disappeared after first action');
      assert.ok(!mount.innerHTML.includes('[object Object]'), game.id + ': preset coercion leaked into UI');
    } finally {
      if (typeof cleanup === 'function') cleanup();
    }
  });
}
