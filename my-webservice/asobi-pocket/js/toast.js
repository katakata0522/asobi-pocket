/**
 * あそびポケット (Asobi Pocket)
 * トースト通知システム (ゼロ依存・モダンUI)
 */

class ToastManager {
  constructor() {
    this.container = null;
  }

  init() {
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.id = "toast-container";
      this.container.setAttribute("role", "status");
      this.container.setAttribute("aria-live", "polite");
      this.container.setAttribute("aria-atomic", "false");
      this.container.style.position = "fixed";
      this.container.style.bottom = "80px";
      this.container.style.left = "50%";
      this.container.style.transform = "translateX(-50%)";
      this.container.style.zIndex = "9998";
      this.container.style.display = "flex";
      this.container.style.flexDirection = "column";
      this.container.style.gap = "8px";
      this.container.style.pointerEvents = "none";
      document.body.appendChild(this.container);
    }
  }

  show(message, type = "info", duration = 2800) {
    this.init();

    const toast = document.createElement("div");
    toast.className = `toast-bubble toast-${type}`;
    toast.textContent = message;

    this.container.appendChild(toast);

    // アニメーション用
    requestAnimationFrame(() => {
      toast.classList.add("toast-show");
    });

    setTimeout(() => {
      toast.classList.remove("toast-show");
      toast.classList.add("toast-hide");
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }

  success(msg) { this.show(msg, "success"); }
  info(msg) { this.show(msg, "info"); }
  warning(msg) { this.show(msg, "warning"); }
}

const Toast = new ToastManager();
