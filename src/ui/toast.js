class Toast {
  constructor() {
    this.container = null;
  }

  initContainer() {
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.className = "armo-sdk-toast-container";
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  show(message, type = "info", duration = 3000) {
    const container = this.initContainer();
    const toast = document.createElement("div");
    toast.className = `armo-sdk-toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Force reflow
    toast.offsetHeight;

    // Show toast
    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    // Remove toast after duration
    setTimeout(() => {
      toast.classList.remove("show");

      // Remove toast after animation
      setTimeout(() => {
        if (toast.parentNode === container) {
          container.removeChild(toast);
        }

        // Remove container if empty
        if (container.children.length === 0) {
          document.body.removeChild(container);
          this.container = null;
        }
      }, 300);
    }, duration);
  }

  error(message, duration = 3000) {
    this.show(message, "error", duration);
  }

  warning(message, duration = 3000) {
    this.show(message, "warning", duration);
  }

  info(message, duration = 3000) {
    this.show(message, "info", duration);
  }

  cleanup() {
    if (this.container && this.container.parentNode) {
      const toasts = this.container.querySelectorAll(".armo-sdk-toast");
      toasts.forEach((toast) => toast.classList.remove("show"));

      setTimeout(() => {
        if (this.container && this.container.parentNode) {
          document.body.removeChild(this.container);
          this.container = null;
        }
      }, 300);
    }
  }
}

const toast = new Toast();
export default toast;
