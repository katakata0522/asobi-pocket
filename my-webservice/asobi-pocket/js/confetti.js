/**
 * あそびポケット (Asobi Pocket)
 * 上品な祝福パーティクルエンジン（画面端からふわりと舞う・結果文字を遮らない設計）
 */

class ConfettiEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animId = null;
    // あそびポケットの温かみあるカラーパレットに合わせた祝福色
    this.colors = ["#E54B36", "#D8EE52", "#E6B84C", "#2F855A", "#2B6CB0", "#F0C892"];
  }

  init() {
    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
      this.canvas.id = "confetti-canvas";
      this.canvas.setAttribute("aria-hidden", "true");
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

  burst(count = 48) {
    // 動きを減らす設定ではCanvasの演出も開始しない。
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    this.init();
    this.resize();

    const w = this.canvas.width;
    const h = this.canvas.height;
    // 過密になりすぎないよう上限を控えめに制御し、中央の結果テキストを邪魔しない
    const safeCount = Math.min(Math.max(18, Math.round(count * 0.65)), 64);

    for (let i = 0; i < safeCount; i++) {
      const fromLeft = i % 2 === 0;
      const edgeSpread = Math.random() * 0.16;
      const startX = fromLeft ? w * (0.02 + edgeSpread) : w * (0.98 - edgeSpread);
      const startY = h * (0.08 + Math.random() * 0.14);
      const inwardDir = fromLeft ? 1 : -1;
      const shape = Math.random() < 0.28 ? "dot" : "ribbon";

      this.particles.push({
        x: startX,
        y: startY,
        vx: inwardDir * (2.6 + Math.random() * 5.2),
        vy: -(3.2 + Math.random() * 5.8),
        size: shape === "dot" ? 3.2 + Math.random() * 2.4 : 6.5 + Math.random() * 4.5,
        shape,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        rotation: Math.random() * 360,
        rSpeed: (Math.random() - 0.5) * 9,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.08 + Math.random() * 0.08,
        opacity: 0.92,
        gravity: 0.16 + Math.random() * 0.06,
        friction: 0.985
      });
    }

    if (!this.animId) {
      this.loop();
    }
  }

  launch(count = 48) {
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
      p.wobble += p.wobbleSpeed;
      p.x += p.vx + Math.sin(p.wobble) * 0.7;
      p.y += p.vy;
      p.rotation += p.rSpeed;
      p.opacity -= 0.0085;

      if (p.opacity <= 0 || p.y > this.canvas.height + 24) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.globalAlpha = Math.max(0, p.opacity);
      this.ctx.fillStyle = p.color;

      if (p.shape === "dot") {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        const tilt = Math.cos(p.wobble);
        this.ctx.fillRect(-p.size / 2, -(p.size * 0.24 * Math.abs(tilt) + 0.8), p.size, p.size * 0.42 * Math.abs(tilt) + 1.4);
      }
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
