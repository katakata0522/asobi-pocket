/**
 * あそびばポケット (Asobi Pocket)
 * 紙吹雪パーティクルエンジン (ゼロ依存・超軽量)
 */

class ConfettiEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animId = null;
    this.colors = ["#FF5A5F", "#48BB78", "#4299E1", "#ECC94B", "#9F7AEA", "#ED64A6", "#38B2AC"];
  }

  init() {
    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
      this.canvas.id = "confetti-canvas";
      this.canvas.style.position = "fixed";
      this.canvas.style.top = "0";
      this.canvas.style.left = "0";
      this.canvas.style.width = "100vw";
      this.canvas.style.height = "100vh";
      this.canvas.style.pointerEvents = "none";
      this.canvas.style.zIndex = "9999";
      document.body.appendChild(this.canvas);
      this.ctx = this.canvas.getContext("2d");
      this.resize();
      window.addEventListener("resize", () => this.resize());
    }
  }

  resize() {
    if (this.canvas) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  }

  burst(count = 80) {
    // 動きを減らす設定ではCanvasの演出も開始しない。
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.init();
    this.resize();

    const w = this.canvas.width;
    const h = this.canvas.height;

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: w * (0.3 + Math.random() * 0.4),
        y: h * 0.4,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.8) * 18,
        size: Math.random() * 8 + 6,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        rotation: Math.random() * 360,
        rSpeed: (Math.random() - 0.5) * 12,
        opacity: 1,
        gravity: 0.35,
        friction: 0.98
      });
    }

    if (!this.animId) {
      this.loop();
    }
  }

  launch(count = 80) {
    this.burst(count);
  }

  loop() {
    if (this.particles.length === 0) {
      if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.animId = null;
      return;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.vx *= p.friction;
      p.vy *= p.friction;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rSpeed;
      p.opacity -= 0.008;

      if (p.opacity <= 0 || p.y > this.canvas.height) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.globalAlpha = Math.max(0, p.opacity);
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      this.ctx.restore();
    }

    this.animId = requestAnimationFrame(() => this.loop());
  }

  clear() {
    this.particles = [];
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

const Confetti = new ConfettiEngine();
