/**
 * あそびばポケット (Asobi Pocket)
 * Web Audio API 効果音エンジン（極上プロ版・ピッチランダム化＆リッチシンセ対応）
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = true;
    try {
      this.isMuted = localStorage.getItem("asobi_sound_muted") !== "false";
    } catch (e) {
      this.isMuted = true;
    }
  }

  init() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && (this.ctx.state === "suspended" || this.ctx.state === "interrupted")) {
        this.ctx.resume().catch(() => {});
      }
    } catch (e) {}
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem("asobi_sound_muted", this.isMuted);
    } catch (e) {}
    return this.isMuted;
  }

  vibrate(pattern = 50) {
    if ("vibrate" in navigator && !this.isMuted) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  }

  playClick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      // わずかなピッチ揺らぎで連打しても心地よい
      const pitchOffset = (Math.random() - 0.5) * 60;
      const baseFreq = 800 + pitchOffset;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + 0.05);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {}
  }

  playSelect() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.06); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.12); // G5

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  playTick(pitch = 900) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = "sine";
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.7, now + 0.03);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.03);
    } catch (e) {}
  }

  playBombTick(isUrgent = false) {
    if (this.isMuted) return;
    const freq = isUrgent ? 1200 : 880;
    this.playTick(freq);
    this.vibrate(isUrgent ? 35 : 15);
  }

  playExplosion() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      this.vibrate([100, 50, 200, 50, 400]);

      const bufferSize = Math.floor(this.ctx.sampleRate * 1.5);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      const now = this.ctx.currentTime;
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(40, now + 1.2);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 1.5);
    } catch (e) {}
  }

  playFanfare() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      this.vibrate([80, 40, 120]);

      const notes = [
        { f: 523.25, t: 0.0, d: 0.12 }, // C5
        { f: 659.25, t: 0.12, d: 0.12 }, // E5
        { f: 783.99, t: 0.24, d: 0.12 }, // G5
        { f: 1046.50, t: 0.36, d: 0.5 } // C6
      ];

      notes.forEach(n => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = this.ctx.currentTime + n.t;

        osc.type = "triangle";
        osc.frequency.setValueAtTime(n.f, start);

        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + n.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + n.d);
      });
    } catch (e) {}
  }

  playCorrect() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      this.vibrate(50);
      const now = this.ctx.currentTime;
      [659.25, 880].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.12;

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.2);
      });
    } catch (e) {}
  }

  playPop() {
    this.playClick();
  }

  playWrong() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      this.hapticWarning();
      const now = this.ctx.currentTime;
      [330, 220].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.12;
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.2);
      });
    } catch (e) {}
  }

  hapticLight() {
    this.vibrate(12);
  }

  hapticMedium() {
    this.vibrate(28);
  }

  hapticSuccess() {
    this.vibrate([30, 40, 60]);
  }

  hapticWarning() {
    this.vibrate([60, 40, 60]);
  }

  hapticExplosion() {
    this.vibrate([100, 50, 200, 50, 400]);
  }

  hapticHeartbeat() {
    this.vibrate([40, 100, 40]);
  }

  playDrumRoll(durationSec = 2.0) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const totalHits = Math.floor(durationSec * 16); // 16分音符感覚の細かい連打
      const hitInterval = durationSec / totalHits;

      for (let i = 0; i < totalHits; i++) {
        const hitTime = now + i * hitInterval;
        const progress = i / totalHits;
        const volume = 0.08 + progress * 0.22; // 徐々に盛り上がる

        // ノイズバッファでスネアの質感を再現
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.04);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let j = 0; j < bufferSize; j++) {
          data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufferSize * 0.4));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.setValueAtTime(1000 + progress * 800, hitTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, hitTime);
        gain.gain.exponentialRampToValueAtTime(0.01, hitTime + 0.04);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(hitTime);
        noise.stop(hitTime + 0.04);
      }

      // ドラムロール中の微小振動
      if ("vibrate" in navigator && !this.isMuted) {
        const vibes = [];
        for (let i = 0; i < 8; i++) {
          vibes.push(20, 40);
        }
        navigator.vibrate(vibes);
      }
    } catch (e) {}
  }

  playJajan() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      this.hapticSuccess();
      const now = this.ctx.currentTime;

      // 和音（ド・ミ・ソ・ド）
      [523.25, 659.25, 783.99, 1046.50].forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.6);
      });

      // シンバルのような高域ノイズ
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.5);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.setValueAtTime(4000, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 0.5);
    } catch (e) {}
  }

  playHeartbeat() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      this.hapticHeartbeat();
      const now = this.ctx.currentTime;

      // ドクン（低音2発）
      [0, 0.14].forEach((delay, idx) => {
        const t = now + delay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(85 - idx * 15, t);
        osc.frequency.exponentialRampToValueAtTime(35, t + 0.12);

        gain.gain.setValueAtTime(0.4 - idx * 0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.12);
      });
    } catch (e) {}
  }

  playCountBeep(isFinal = false) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const freq = isFinal ? 1200 : 600;
      const duration = isFinal ? 0.35 : 0.08;

      if (isFinal) {
        this.hapticSuccess();
      } else {
        this.hapticLight();
      }

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {}
  }

  playClap() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      this.hapticLight();
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.08);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1200, now);
      filter.Q.setValueAtTime(2.0, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 0.08);
    } catch (e) {}
  }
}

const Sound = new SoundEngine();
