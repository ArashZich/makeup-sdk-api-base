// src/ui/toast.js

class Toast {
  constructor() {
    this.container = null;
    this.toasts = new Map(); // برای tracking toast ها
    this.maxToasts = 5; // حداکثر تعداد toast های همزمان
  }

  initContainer() {
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.className = "armo-sdk-toast-container";
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  show(message, type = "info", duration = 3000, options = {}) {
    const container = this.initContainer();

    // محدود کردن تعداد toast ها
    if (this.toasts.size >= this.maxToasts) {
      // حذف قدیمی ترین toast
      const oldestToast = this.toasts.keys().next().value;
      this.removeToast(oldestToast);
    }

    const toast = document.createElement("div");
    const toastId = Date.now() + Math.random();
    toast.className = `armo-sdk-toast ${type}`;
    toast.setAttribute("data-toast-id", toastId);

    // اضافه کردن آیکون اگر مشخص شده
    if (options.icon) {
      const iconElement = document.createElement("div");
      iconElement.className = "armo-sdk-toast-icon";
      iconElement.innerHTML = options.icon;
      toast.appendChild(iconElement);
    }

    // اضافه کردن پیام
    const messageElement = document.createElement("div");
    messageElement.className = "armo-sdk-toast-message";
    messageElement.textContent = message;
    toast.appendChild(messageElement);

    // اضافه کردن دکمه بستن اگر مشخص شده
    if (options.closable !== false) {
      const closeButton = document.createElement("button");
      closeButton.className = "armo-sdk-toast-close";
      closeButton.innerHTML = "×";
      closeButton.onclick = () => this.removeToast(toast);
      toast.appendChild(closeButton);
    }

    // اضافه کردن action button اگر مشخص شده
    if (options.action) {
      const actionButton = document.createElement("button");
      actionButton.className = "armo-sdk-toast-action";
      actionButton.textContent = options.action.text;
      actionButton.onclick = () => {
        if (typeof options.action.callback === "function") {
          options.action.callback();
        }
        this.removeToast(toast);
      };
      toast.appendChild(actionButton);
    }

    container.appendChild(toast);
    this.toasts.set(toast, { id: toastId, type, duration });

    // Force reflow
    toast.offsetHeight;

    // Show toast
    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    // Auto remove toast after duration (اگر duration مثبت باشد)
    if (duration > 0) {
      const timeoutId = setTimeout(() => {
        this.removeToast(toast);
      }, duration);

      // ذخیره timeout برای امکان لغو
      this.toasts.get(toast).timeoutId = timeoutId;
    }

    // اضافه کردن event listener برای hover (متوقف کردن auto-hide)
    if (options.pauseOnHover !== false) {
      this.setupHoverEvents(toast);
    }

    return toast;
  }

  setupHoverEvents(toast) {
    const toastData = this.toasts.get(toast);
    if (!toastData) return;

    toast.addEventListener("mouseenter", () => {
      // متوقف کردن timeout
      if (toastData.timeoutId) {
        clearTimeout(toastData.timeoutId);
        toastData.timeoutId = null;
      }
      toast.classList.add("paused");
    });

    toast.addEventListener("mouseleave", () => {
      // شروع مجدد timeout
      if (toastData.duration > 0) {
        toastData.timeoutId = setTimeout(() => {
          this.removeToast(toast);
        }, 1000); // زمان کمتر برای ادامه
      }
      toast.classList.remove("paused");
    });
  }

  removeToast(toast) {
    if (!toast || !toast.parentNode) return;

    // حذف از Map
    const toastData = this.toasts.get(toast);
    if (toastData && toastData.timeoutId) {
      clearTimeout(toastData.timeoutId);
    }
    this.toasts.delete(toast);

    // انیمیشن خروج
    toast.classList.remove("show");
    toast.classList.add("hiding");

    // Remove toast after animation
    setTimeout(() => {
      if (toast.parentNode === this.container) {
        this.container.removeChild(toast);
      }

      // Remove container if empty
      if (this.container && this.container.children.length === 0) {
        document.body.removeChild(this.container);
        this.container = null;
      }
    }, 300);
  }

  error(message, duration = 4000, options = {}) {
    return this.show(message, "error", duration, {
      icon: "⚠️",
      ...options,
    });
  }

  warning(message, duration = 3500, options = {}) {
    return this.show(message, "warning", duration, {
      icon: "⚠️",
      ...options,
    });
  }

  info(message, duration = 3000, options = {}) {
    return this.show(message, "info", duration, {
      icon: "ℹ️",
      ...options,
    });
  }

  success(message, duration = 3000, options = {}) {
    return this.show(message, "success", duration, {
      icon: "✅",
      ...options,
    });
  }

  // Toast های sticky (بدون auto-hide)
  sticky(message, type = "info", options = {}) {
    return this.show(message, type, 0, {
      closable: true,
      ...options,
    });
  }

  // Toast با action button
  withAction(
    message,
    actionText,
    actionCallback,
    type = "info",
    duration = 5000
  ) {
    return this.show(message, type, duration, {
      action: {
        text: actionText,
        callback: actionCallback,
      },
      closable: true,
    });
  }

  // حذف همه toast ها
  clearAll() {
    const toasts = Array.from(this.toasts.keys());
    toasts.forEach((toast) => this.removeToast(toast));
  }

  // حذف toast های یک نوع خاص
  clearByType(type) {
    const toasts = Array.from(this.toasts.keys());
    toasts.forEach((toast) => {
      const toastData = this.toasts.get(toast);
      if (toastData && toastData.type === type) {
        this.removeToast(toast);
      }
    });
  }

  // تنظیم حداکثر تعداد toast ها
  setMaxToasts(max) {
    this.maxToasts = Math.max(1, max);
  }

  // دریافت تعداد toast های فعال
  getActiveCount() {
    return this.toasts.size;
  }

  // بررسی وجود toast با پیام مشخص (جلوگیری از duplicate)
  hasMessage(message) {
    for (let toast of this.toasts.keys()) {
      const messageElement = toast.querySelector(".armo-sdk-toast-message");
      if (messageElement && messageElement.textContent === message) {
        return true;
      }
    }
    return false;
  }

  // نمایش toast فقط اگر duplicate نباشد
  showUnique(message, type = "info", duration = 3000, options = {}) {
    if (!this.hasMessage(message)) {
      return this.show(message, type, duration, options);
    }
    return null;
  }

  // تنظیم موقعیت container
  setPosition(position = "top-right") {
    if (!this.container) return;

    // حذف کلاس‌های موقعیت قبلی
    this.container.classList.remove(
      "top-right",
      "top-left",
      "bottom-right",
      "bottom-left",
      "top-center",
      "bottom-center"
    );

    // اضافه کردن موقعیت جدید
    this.container.classList.add(position);
  }

  cleanup() {
    // حذف تمام timeout ها
    this.toasts.forEach((toastData) => {
      if (toastData.timeoutId) {
        clearTimeout(toastData.timeoutId);
      }
    });

    if (this.container && this.container.parentNode) {
      const toasts = this.container.querySelectorAll(".armo-sdk-toast");
      toasts.forEach((toast) => toast.classList.remove("show"));

      setTimeout(() => {
        if (this.container && this.container.parentNode) {
          document.body.removeChild(this.container);
          this.container = null;
          this.toasts.clear();
        }
      }, 300);
    }
  }
}

const toast = new Toast();
export default toast;
