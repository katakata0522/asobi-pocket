'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const errors = [];
const notes = [];

function fail(message) {
  errors.push(message);
}

function note(message) {
  notes.push(message);
}

function read(relativePath) {
  const absolute = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolute)) {
    fail(`missing required file: ${relativePath}`);
    return '';
  }
  return fs.readFileSync(absolute, 'utf8');
}

const index = read('my-webservice/asobi-pocket/index.html');
const gamesSource = read('my-webservice/asobi-pocket/data/games.js');
const appSource = read('my-webservice/asobi-pocket/js/app.js');
const toolsSource = read('my-webservice/asobi-pocket/js/tools.js');
const contractSource = read('my-webservice/asobi-pocket/js/quality/data-contract.js');
const toolFixSource = read('my-webservice/asobi-pocket/js/quality/tool-fixes.js');
const uxSource = read('my-webservice/asobi-pocket/js/quality/product-ux.js');
const toastSource = read('my-webservice/asobi-pocket/js/toast.js');
const qualityCss = read('my-webservice/asobi-pocket/quality-ui.css');
const privacySource = read('my-webservice/asobi-pocket/privacy.html');
const manifestSource = read('my-webservice/asobi-pocket/manifest.json');

// Stubbed audio can hide missing methods that stop the real game before rendering.
try {
  const audioContext = vm.createContext({});
  vm.runInContext(read('my-webservice/asobi-pocket/js/audio.js'), audioContext);
  const sound = vm.runInContext('Sound', audioContext);
  for (const source of [toolsSource, toolFixSource]) {
    for (const match of source.matchAll(/\bSound\.(\w+)\s*\(/g)) {
      if (typeof sound[match[1]] !== 'function') fail(`missing game audio method: Sound.${match[1]}`);
    }
  }
  sound.playWrong();
  if (sound.ctx !== null) fail('muted game feedback must not initialize audio');
} catch (error) {
  fail(`game audio contract failed: ${error.message}`);
}

for (const [name, source] of [
  ['games.js', gamesSource],
  ['app.js', appSource],
  ['tools.js', toolsSource],
  ['data-contract.js', contractSource],
  ['tool-fixes.js', toolFixSource],
  ['product-ux.js', uxSource],
  ['toast.js', toastSource]
]) {
  if (!source) continue;
  try {
    new vm.Script(source, { filename: name });
  } catch (error) {
    fail(`${name}: JavaScript syntax error -> ${error.message}`);
  }
}

if (index) {
  const rouletteId = index.indexOf('id="modal-roulette"');
  const rouletteStart = rouletteId >= 0 ? index.lastIndexOf('<div', rouletteId) : -1;
  const scoreboardStart = index.indexOf('id="btn-toggle-scoreboard"');
  if (rouletteStart < 0 || scoreboardStart < 0 || scoreboardStart <= rouletteStart) {
    fail('cannot locate roulette modal and scoreboard boundary in index.html');
  } else {
    const modalFragment = index.slice(rouletteStart, scoreboardStart);
    const openDivs = (modalFragment.match(/<div\b/g) || []).length;
    const closeDivs = (modalFragment.match(/<\/div>/g) || []).length;
    if (openDivs !== closeDivs) {
      fail(`roulette modal div balance is broken before scoreboard: open=${openDivs}, close=${closeDivs}`);
    } else {
      note('roulette modal closes before global utilities');
    }
  }

  const requiredScripts = [
    'js/quality/data-contract.js',
    'js/quality/tool-fixes.js',
    'js/app.js',
    'js/quality/product-ux.js'
  ];
  for (const script of requiredScripts) {
    if (!index.includes(`src="${script}"`)) fail(`index.html does not load ${script}`);
  }

  const contractPos = index.indexOf('js/quality/data-contract.js');
  const toolFixPos = index.indexOf('js/quality/tool-fixes.js');
  const appPos = index.indexOf('js/app.js');
  const uxPos = index.indexOf('js/quality/product-ux.js');
  if (!(contractPos >= 0 && toolFixPos > contractPos && appPos > toolFixPos && uxPos > appPos)) {
    fail('quality scripts are not loaded in the required order: data contract -> tool fixes -> app -> product UX');
  }
}

if (gamesSource && contractSource) {
  try {
    const noop = () => {};
    const documentMock = {
      readyState: 'loading',
      addEventListener: noop,
      querySelector: () => null,
      querySelectorAll: () => []
    };
    const windowMock = {
      location: { href: 'https://katakatalab.com/asobi-pocket/', hash: '' },
      open: () => null
    };
    const context = vm.createContext({
      console,
      encodeURIComponent,
      URL,
      setTimeout,
      clearTimeout,
      window: windowMock,
      document: documentMock,
      navigator: {},
      location: { hash: '' }
    });
    vm.runInContext(gamesSource, context, { filename: 'games.js' });
    vm.runInContext(contractSource, context, { filename: 'data-contract.js' });
    const normalized = vm.runInContext(`GAMES_DATA.map(game => ({
      id: game.id,
      title: game.title,
      toolType: game.toolType,
      minPlayers: game.minPlayers,
      maxPlayers: game.maxPlayers,
      duration: game.duration,
      genre: game.genre,
      isVoice: game.isVoice,
      durationMin: game.durationMin,
      recommendScore: game.recommendScore,
      hasTool: game.hasTool,
      searchIndex: game._searchIndex
    }))`, context);

    if (normalized.length < 31) fail(`Published game routes must be retained; found ${normalized.length}`);

    const ids = normalized.map(game => game.id);
    const titles = normalized.map(game => game.title);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    const duplicateTitles = titles.filter((title, index) => titles.indexOf(title) !== index);
    if (duplicateIds.length) fail(`duplicate game ids: ${[...new Set(duplicateIds)].join(', ')}`);
    if (duplicateTitles.length) fail(`duplicate game titles: ${[...new Set(duplicateTitles)].join(', ')}`);

    const allowedGenres = new Set(['talk', 'mystery', 'laugh', 'speed', 'quiz']);
    for (const game of normalized) {
      if (!game.id) fail('game without id after normalization');
      if (!String(game.title || '').trim()) fail(`${game.id}: missing title`);
      if (!String(game.toolType || '').trim()) fail(`${game.id}: missing toolType`);
      if (!Number.isInteger(Number(game.minPlayers)) || Number(game.minPlayers) < 1) {
        fail(`${game.id}: invalid minPlayers ${game.minPlayers}`);
      }
      if (!Number.isInteger(Number(game.maxPlayers)) || Number(game.maxPlayers) < Number(game.minPlayers)) {
        fail(`${game.id}: invalid maxPlayers ${game.maxPlayers}`);
      }
      if (!allowedGenres.has(game.genre)) fail(`${game.id}: invalid normalized genre ${game.genre}`);
      if (typeof game.isVoice !== 'boolean') fail(`${game.id}: isVoice is not boolean`);
      if (!Number.isFinite(game.durationMin)) fail(`${game.id}: durationMin is not finite`);
      if (!Number.isFinite(game.recommendScore)) fail(`${game.id}: recommendScore is not finite`);
      if (typeof game.hasTool !== 'boolean') fail(`${game.id}: hasTool is not boolean`);
      if (typeof game.searchIndex !== 'string' || !game.searchIndex.includes(String(game.id).toLowerCase())) {
        fail(`${game.id}: _searchIndex is missing or incomplete`);
      }

      const secondsOnly = String(game.duration || '').normalize('NFKC').match(/^\s*(\d+(?:\.\d+)?)\s*秒\s*$/);
      if (secondsOnly) {
        const expectedMinutes = Number(secondsOnly[1]) / 60;
        if (Math.abs(game.durationMin - expectedMinutes) > 1e-9) {
          fail(`${game.id}: ${game.duration} must normalize to ${expectedMinutes} minutes, got ${game.durationMin}`);
        }
      }
    }

    const dispatchMatches = [...appSource.matchAll(/case\s+"([^"]+)":\s*currentToolCleanup\s*=\s*GameTools\.(\w+)\(/g)];
    const tableMatches = [...appSource.matchAll(/"([^"\n]+)": \(m, g\) => GameTools\.(\w+)\(m, g\)/g)];
    const dispatchMap = new Map([...dispatchMatches, ...tableMatches].map(match => [match[1], match[2]]));
    const dataToolTypes = new Set(normalized.filter(game => game.hasTool).map(game => game.toolType));

    for (const game of normalized.filter(game => game.hasTool)) {
      const method = dispatchMap.get(game.toolType);
      if (!method) {
        fail(`${game.id}: toolType ${game.toolType} has no app.js dispatch case`);
        continue;
      }
      const legacyDefinition = new RegExp(`\\b${method}\\s*\\(`).test(toolsSource);
      const qualityDefinition = toolFixSource.includes(`GameTools.${method} =`) || contractSource.includes(`GameTools.${method} =`);
      if (!legacyDefinition && !qualityDefinition) {
        fail(`${game.id}: dispatch points to missing GameTools.${method}`);
      }
    }

    for (const toolType of dispatchMap.keys()) {
      if (toolType === 'gesture-game' && dataToolTypes.has('gesture')) continue;
      if (!dataToolTypes.has(toolType)) fail(`app.js has stale/unowned tool dispatch case: ${toolType}`);
    }
    note(`all ${dataToolTypes.size} tool types map from game data to app dispatch and a renderer implementation`);

    const fingerRoulette = normalized.find(game => game.id === 'finger-roulette');
    if (!fingerRoulette || !(fingerRoulette.durationMin > 0 && fingerRoulette.durationMin < 1)) {
      fail('finger-roulette: 10秒 must remain a sub-minute game for quick-sort/recommendation');
    }

    const presetAudit = vm.runInContext(`GAMES_DATA
      .filter(game => Array.isArray(game.presets) && game.presets.length > 0)
      .map(game => ({
        id: game.id,
        toolType: game.toolType,
        count: game.presets.length,
        presets: game.presets.map(p => typeof p === 'string' ? { kind: 'string', text: p } : ({
          kind: 'object',
          text: p.text,
          scene: p.scene,
          q: p.q,
          category: p.category,
          citizen: p.citizen,
          wolf: p.wolf,
          word: p.word,
          hint: p.hint,
          a: p.a,
          b: p.b,
          title: p.title,
          question: p.question,
          answer: p.answer,
          hints: p.hints
        }))
      }))`, context);

    const expectedPresetTools = new Set([
      'ito', 'asa-sore', 'wordwolf', 'bomb-timer', 'katakana-ban', 'two-choices',
      'sea-turtle', 'talk-gacha', 'ng-word', 'batsu-roulette', 'gesture', 'yamanote',
      'rhythm-box', 'magical-banana', 'twenty-questions', 'good-bad-news', 'word-chain', 'two-truths'
    ]);
    const actualPresetTools = new Set(presetAudit.map(game => game.toolType));
    for (const toolType of expectedPresetTools) {
      if (!actualPresetTools.has(toolType)) fail(`preset audit lost expected tool: ${toolType}`);
    }
    for (const toolType of actualPresetTools) {
      if (!expectedPresetTools.has(toolType)) fail(`new preset-bearing tool requires explicit schema review: ${toolType}`);
    }

    const allowedScenes = new Set(['friends', 'family', 'party', 'work']);
    for (const game of presetAudit) {
      for (const [index, preset] of game.presets.entries()) {
        const label = `${game.id} preset #${index + 1}`;
        if (preset.kind === 'string') {
          if (!String(preset.text || '').trim()) fail(`${label}: empty string preset`);
          continue;
        }

        if (preset.scene && !allowedScenes.has(preset.scene)) {
          fail(`${label}: unsupported TPO scene ${preset.scene}`);
        }

        const appRenderable = [preset.citizen, preset.word, preset.a, preset.q, preset.title]
          .some(value => typeof value === 'string' && value.trim());
        if (!appRenderable) fail(`${label}: detail preset tab cannot render this schema`);

        if (game.toolType === 'wordwolf') {
          if (!String(preset.citizen || '').trim() || !String(preset.wolf || '').trim()) {
            fail(`${label}: Word Wolf requires citizen/wolf pair`);
          } else if (preset.citizen === preset.wolf) {
            fail(`${label}: Word Wolf pair must contain two different words`);
          }
        }

        if (game.toolType === 'two-choices') {
          if (!String(preset.a || '').trim() || !String(preset.b || '').trim()) {
            fail(`${label}: two-choices requires non-empty A/B values`);
          }
        }

        if (game.toolType === 'katakana-ban') {
          if (!String(preset.word || '').trim() || !String(preset.hint || '').trim()) {
            fail(`${label}: katakana-ban requires word/hint values`);
          }
          if (/[ァ-ヶー]/.test(String(preset.hint || ''))) {
            fail(`${label}: katakana-ban hint itself contains katakana -> ${preset.hint}`);
          }
        }

        if (game.toolType === 'sea-turtle') {
          if (!String(preset.title || '').trim() || !String(preset.question || '').trim() || !String(preset.answer || '').trim()) {
            fail(`${label}: sea-turtle requires title/question/answer`);
          }
          if (!Array.isArray(preset.hints)) fail(`${label}: sea-turtle hints must be an array`);
        }
      }
    }

    const batsuPresetAudit = presetAudit.find(game => game.toolType === 'batsu-roulette');
    if (!batsuPresetAudit || batsuPresetAudit.count !== 40) {
      fail(`batsu-roulette runtime preset list must contain exactly 40 safe missions; found ${batsuPresetAudit?.count ?? 0}`);
    }

    note(`audited all ${presetAudit.length} preset-bearing games against renderer/detail-tab schemas`);

    if (manifestSource) {
      try {
        const manifest = JSON.parse(manifestSource);
        if (manifest.name !== 'あそびポケット - 多人数パーティーゲーム＆暇つぶし図鑑') {
          fail(`manifest app name is out of sync: ${manifest.name}`);
        }
        if (manifest.short_name !== 'あそびポケット') fail(`manifest short_name is out of sync: ${manifest.short_name}`);
        for (const shortcut of Array.isArray(manifest.shortcuts) ? manifest.shortcuts : []) {
          const match = String(shortcut.url || '').match(/#game\/([^?#]+)/);
          if (!match) {
            fail(`manifest shortcut has no game hash: ${shortcut.name || '(unnamed)'}`);
            continue;
          }
          if (!ids.includes(match[1])) fail(`manifest shortcut points to unknown game id: ${match[1]}`);
        }
        note('manifest shortcuts reference valid game IDs');
      } catch (error) {
        fail(`manifest.json is invalid JSON: ${error.message}`);
      }
    }

    const publicContracts = vm.runInContext(`(() => {
      const batsu = GAMES_DATA.find(game => game.id === 'batsu-roulette');
      const twenty = GAMES_DATA.find(game => game.id === 'twenty-questions');
      const finger = GAMES_DATA.find(game => game.id === 'finger-roulette');
      const talk = GAMES_DATA.find(game => game.id === 'talk-gacha');
      return {
        batsuBadge: batsu && batsu.badge,
        batsuOverview: batsu && batsu.overview,
        batsuRuleText: batsu && JSON.stringify(batsu.rules || []),
        batsuPresetText: batsu && JSON.stringify(batsu.presets || []),
        twentyOverview: twenty && twenty.overview,
        twentyRuleText: twenty && JSON.stringify(twenty.rules || []),
        fingerOverview: finger && finger.overview,
        fingerRuleText: finger && JSON.stringify(finger.rules || []),
        fingerTipText: finger && JSON.stringify(finger.tips || []),
        talkBadge: talk && talk.badge,
        talkOverview: talk && talk.overview,
        talkRuleText: talk && JSON.stringify(talk.rules || [])
      };
    })()`, context);

    if (publicContracts.batsuBadge !== 'パスOK') fail('batsu-roulette must advertise the safe pass-first contract');
    for (const unsafeSignal of ['言い訳なし', '最新の写真', '店員さんへの注文', '恥ずかしい失敗談']) {
      if (`${publicContracts.batsuOverview} ${publicContracts.batsuRuleText} ${publicContracts.batsuPresetText}`.includes(unsafeSignal)) {
        fail(`batsu-roulette public/runtime contract still contains unsafe/coercive signal: ${unsafeSignal}`);
      }
    }

    const twentyCopy = `${publicContracts.twentyOverview} ${publicContracts.twentyRuleText}`;
    if (!twentyCopy.includes('回答履歴')) {
      fail('twenty-questions must describe the answer-history feature accurately');
    }
    if (!twentyCopy.includes('質問文そのものは保存されない')) {
      fail('twenty-questions must disclose that question text itself is not stored');
    }
    if (twentyCopy.includes('お題ジェネレーター') || twentyCopy.includes('質問・回答ログ')) {
      fail('twenty-questions public copy still promises an unimplemented generator/question-text log');
    }

    const fingerCopy = `${publicContracts.fingerOverview} ${publicContracts.fingerRuleText} ${publicContracts.fingerTipText}`;
    if (!fingerCopy.includes('1人または2人') || !fingerCopy.includes('PC')) {
      fail('finger-roulette public copy must match its one-or-two selection and PC support');
    }
    if (fingerCopy.includes('グループチーム分け') || fingerCopy.includes('0秒')) {
      fail('finger-roulette public copy still promises unsupported/instant behavior');
    }

    const talkCopy = `${publicContracts.talkBadge} ${publicContracts.talkOverview} ${publicContracts.talkRuleText}`;
    for (const category of ['ライト', 'もしも', '本音', '恋愛', 'ディープ']) {
      if (!talkCopy.includes(category)) fail(`talk-gacha public copy is missing implemented category: ${category}`);
    }
    if (talkCopy.includes('絶対に盛り上がる') || talkCopy.includes('会話ネタ無尽蔵')) {
      fail('talk-gacha public copy still uses unsupported absolute/unbounded claims');
    }

    const normalizedTweet = vm.runInContext(`__normalizeAsobiShareUrl('https://twitter.com/intent/tweet?text=' + encodeURIComponent('#朝までそれ正解 #あそびばポケット'))`, context);
    if (!decodeURIComponent(String(normalizedTweet)).includes('#あそびポケット')) {
      fail('Twitter share compatibility does not normalize the old public brand');
    }
    if (decodeURIComponent(String(normalizedTweet)).includes('#あそびばポケット')) {
      fail('Twitter share compatibility still exposes the old public brand');
    }

    const affiliateReady = vm.runInContext(`typeof AFFILIATE_CONFIG === 'object'
      && typeof AFFILIATE_CONFIG.getAmazonUrl === 'function'
      && typeof AFFILIATE_CONFIG.getRakutenUrl === 'function'`, context);
    if (!affiliateReady) fail('AFFILIATE_CONFIG fallback is not available before app initialization');
    note(`normalized ${normalized.length} game records for filtering/search/sort`);
    note('duration units remain comparable in minutes, including seconds-only games');
    note('public copy for penalty roulette, Twenty Questions, Finger Roulette, and Talk Gacha matches implemented capabilities');
    note('public share URLs normalize the legacy Asobi Pocket brand');
  } catch (error) {
    fail(`game data contract execution failed: ${error.stack || error.message}`);
  }
}

for (const toolName of ['renderWordWolf', 'renderFingerRoulette', 'renderDuelReflex', 'renderDuelMash', 'renderYamanote', 'renderGesture']) {
  if (!toolFixSource.includes(`GameTools.${toolName} =`)) {
    fail(`missing quality override for ${toolName}`);
  }
}

for (const signal of ['state.citizenWord', 'return clearTimer', 'return cleanup', 'pointerdown']) {
  if (!toolFixSource.includes(signal)) fail(`tool-fixes.js is missing lifecycle/judging signal: ${signal}`);
}

for (const signal of [
  'normalizePresetContracts',
  'KATAKANA_HINTS',
  'splitPair',
  'game.toolType === "wordwolf"',
  'game.toolType === "two-choices"',
  'game.toolType === "katakana-ban"',
  'game.id === "finger-roulette"',
  'game.id === "talk-gacha"',
  'game.id === "twenty-questions"',
  'wrapTextPresetTool("renderAsaSore")',
  'wrapTextPresetTool("renderBombTimer")',
  'wrapTextPresetTool("renderNgWord")',
  'GameTools.renderTalkGacha =',
  'SAFE_BATSU_MISSIONS',
  'GameTools.renderBatsuRoulette =',
  'btn-batsu-pass',
  'BRAND_OLD = "あそびばポケット"',
  '⭐ 編集部おすすめ順',
  'ito 自作お題60選',
  '朝までそれ正解 自作お題50選',
  '__normalizeAsobiShareUrl',
  'syncDynamicPublicCopy',
  'topicManagerButton.textContent !== "⚙️ お題を追加・管理する"',
  'historyTitle.textContent !== "回答履歴:"'
]) {
  if (!contractSource.includes(signal)) fail(`data-contract.js is missing compatibility/public-copy signal: ${signal}`);
}

for (const signal of [
  'rally.markPlayed = ()',
  'AsobiPlayLifecycle',
  'recommendationScore',
  'setupScoreboard',
  'setupContextAwareRoulette',
  'setupModalAccessibility',
  'quality-utility-hidden'
]) {
  if (!uxSource.includes(signal)) fail(`product-ux.js is missing expected product-quality behavior: ${signal}`);
}

for (const signal of ['--bg-card: var(--card-bg)', '#view-home .controls-wrapper', '#view-home .stamp-rally-section', '#pane-tool > .official-product-box', 'prefers-reduced-motion']) {
  if (!qualityCss.includes(signal)) fail(`quality-ui.css is missing expected hierarchy/accessibility/token rule: ${signal}`);
}

for (const signal of ['setAttribute("role", "status")', 'setAttribute("aria-live", "polite")']) {
  if (!toastSource.includes(signal)) fail(`toast.js is missing accessibility signal: ${signal}`);
}

for (const signal of ['LocalStorage', 'Cache Storage', 'スコアボード', '最近遊んだゲーム', '追加したお題', '除外したお題']) {
  if (!privacySource.includes(signal)) fail(`privacy.html is missing storage disclosure signal: ${signal}`);
}

if (errors.length > 0) {
  console.error('Asobi Pocket quality validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Asobi Pocket quality validation passed.');
for (const message of notes) console.log(`- ${message}`);
