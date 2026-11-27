const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const APP_ROOT = path.resolve(__dirname, '../my-webservice/asobi-pocket');

test('SoundEngine caches noise AudioBuffers across drumroll hits and repeated claps', () => {
  let createBufferCalls = 0;
  let sourceStarts = 0;

  class FakeAudioContext {
    constructor() {
      this.sampleRate = 48000;
      this.currentTime = 0;
      this.state = 'running';
      this.destination = {};
    }
    createBuffer(channels, length, sampleRate) {
      createBufferCalls += 1;
      const data = new Float32Array(length);
      return { channels, length, sampleRate, getChannelData: () => data };
    }
    createBufferSource() {
      return {
        buffer: null,
        connect() {},
        start() { sourceStarts += 1; },
        stop() {},
      };
    }
    createBiquadFilter() {
      return {
        type: '',
        frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
        Q: { setValueAtTime() {} },
        connect() {},
      };
    }
    createGain() {
      return {
        gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
        connect() {},
      };
    }
  }

  const sandbox = {
    window: { AudioContext: FakeAudioContext },
    navigator: {},
    localStorage: {
      getItem: (k) => (k === 'asobi_sound_muted' ? 'false' : null),
      setItem() {},
    },
    Math,
  };
  const code = fs.readFileSync(path.join(APP_ROOT, 'js/audio.js'), 'utf8') + '\nthis.__Sound = Sound;';
  vm.runInNewContext(code, sandbox);

  const Sound = sandbox.__Sound;
  assert.equal(Sound.isMuted, false);

  Sound.playDrumRoll(2.0);
  assert.equal(createBufferCalls, 1, '32-hit drumroll should reuse 1 cached snare buffer');
  assert.equal(sourceStarts, 32);

  Sound.playDrumRoll(1.0);
  assert.equal(createBufferCalls, 1, 'second drumroll should hit the cached snare buffer');

  Sound.playClap();
  Sound.playClap();
  Sound.playClap();
  assert.equal(createBufferCalls, 2, 'repeated claps should allocate only 1 cached clap buffer');
});

test('ConfettiEngine enforces maxParticles cap under rapid bursts and respects reduced motion', () => {
  const createdCanvas = {
    style: {},
    width: 0,
    height: 0,
    setAttribute() {},
    getContext: () => ({
      clearRect() {},
      save() {},
      translate() {},
      rotate() {},
      beginPath() {},
      arc() {},
      fill() {},
      fillRect() {},
      restore() {},
    }),
  };

  let reducedMotion = false;
  let rafCallbacks = 0;
  const sandbox = {
    window: {
      innerWidth: 390,
      innerHeight: 844,
      matchMedia: () => ({ matches: reducedMotion }),
      addEventListener() {},
    },
    document: {
      createElement: () => createdCanvas,
      body: { appendChild() {} },
    },
    requestAnimationFrame: () => {
      rafCallbacks += 1;
      return rafCallbacks;
    },
    cancelAnimationFrame() {},
    Math,
  };
  const code = fs.readFileSync(path.join(APP_ROOT, 'js/confetti.js'), 'utf8') + '\nthis.__Confetti = Confetti;';
  vm.runInNewContext(code, sandbox);

  const Confetti = sandbox.__Confetti;
  for (let i = 0; i < 6; i++) {
    Confetti.burst(80);
  }
  assert.ok(Confetti.particles.length <= Confetti.maxParticles, 'particles should be capped');
  assert.equal(Confetti.particles.length, Confetti.maxParticles);

  Confetti.clear();
  assert.equal(Confetti.particles.length, 0);

  reducedMotion = true;
  Confetti.burst(80);
  assert.equal(Confetti.particles.length, 0, 'reduced motion should suppress confetti bursts');
});
