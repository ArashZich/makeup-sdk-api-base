// src/core/modules/ui-manager.js

import { toast } from "../../ui";

/**
 * کلاس مدیریت رابط کاربری
 */
export class UiManager {
  /**
   * سازنده کلاس UiManager
   * @param {Object} elements - المنت‌های HTML مورد نیاز
   */
  constructor(elements = {}) {
    this.elements = elements;
    this.lightWarningElement = null;
    this.isLightWarningShown = false;
  }

  /**
   * تنظیم المنت‌های رابط کاربری
   * @param {Object} elements - المنت‌های HTML
   */
  setElements(elements) {
    this.elements = { ...this.elements, ...elements };
  }

  /**
   * نمایش حالت بارگذاری
   */
  showLoading() {
    if (this.elements.loadingElement) {
      this.elements.loadingElement.style.display = "flex";
    }
  }

  /**
   * مخفی کردن حالت بارگذاری
   */
  hideLoading() {
    if (this.elements.loadingElement) {
      this.elements.loadingElement.style.display = "none";
    }
  }

  /**
   * نمایش loading برای یک عمل خاص
   * @param {string} message - پیام loading
   */
  showLoadingWithMessage(message) {
    if (this.elements.loadingElement) {
      const loadingContent = this.elements.loadingElement.querySelector(
        ".armo-sdk-loading-content"
      );
      if (loadingContent) {
        const messageElement = loadingContent.querySelector("p");
        if (messageElement) {
          messageElement.textContent = message;
        }
      }
      this.elements.loadingElement.style.display = "flex";
    }
  }

  /**
   * نمایش پیام خطا
   * @param {string} title - عنوان خطا
   * @param {string} message - پیام خطا
   */
  showErrorMessage(title, message) {
    const errorElement = document.createElement("div");
    errorElement.className = "armo-sdk-error-message";

    const titleElement = document.createElement("h3");
    titleElement.textContent = title;
    errorElement.appendChild(titleElement);

    const messageElement = document.createElement("p");
    messageElement.textContent = message;
    errorElement.appendChild(messageElement);

    // حذف پیام‌های خطای قبلی
    this.removeErrorMessages();

    const container = document.querySelector(".armo-sdk-container");
    if (container) {
      container.appendChild(errorElement);
    } else {
      document.body.appendChild(errorElement);
    }

    // نمایش پیام به صورت toast نیز
    toast.error(message);
  }

  /**
   * حذف پیام‌های خطای موجود
   */
  removeErrorMessages() {
    const existingErrors = document.querySelectorAll(".armo-sdk-error-message");
    existingErrors.forEach((element) => element.remove());
  }

  /**
   * نمایش هشدار نور کم
   */
  showLightWarning() {
    if (!this.lightWarningElement) {
      this.lightWarningElement = document.createElement("div");
      this.lightWarningElement.className = "armo-sdk-warning-message";
      this.lightWarningElement.innerHTML = `
        <div class="armo-sdk-warning-content">
          <p>نور محیط کافی نیست. لطفاً در نور مناسب قرار بگیرید.</p>
        </div>
      `;

      const container = document.querySelector(".armo-sdk-container");
      if (container) {
        container.appendChild(this.lightWarningElement);
      }
    }
    this.isLightWarningShown = true;
  }

  /**
   * مخفی کردن هشدار نور کم
   */
  hideLightWarning() {
    if (this.lightWarningElement && this.lightWarningElement.parentElement) {
      this.lightWarningElement.remove();
      this.lightWarningElement = null;
    }
    this.isLightWarningShown = false;
  }

  /**
   * بروزرسانی انتخاب‌گر رنگ
   * @param {Function} onColorSelect - تابع فراخوانی شونده هنگام انتخاب رنگ
   * @param {Array} colors - آرایه رنگ‌ها
   * @param {Object} featureManager - مدیر ویژگی‌ها
   */
  updateColorPicker(onColorSelect, colors, featureManager) {
    const { initColorPicker } = require("../../ui/colorPicker");

    initColorPicker(
      onColorSelect,
      colors,
      "armo-sdk-color-picker",
      featureManager
    );
  }

  /**
   * نمایش پیام اطلاعات
   * @param {string} message - پیام
   * @param {number} duration - مدت زمان نمایش (میلی‌ثانیه)
   */
  showInfoMessage(message, duration = 3000) {
    toast.info(message, duration);
  }

  /**
   * نمایش پیام هشدار
   * @param {string} message - پیام
   * @param {number} duration - مدت زمان نمایش (میلی‌ثانیه)
   */
  showWarningMessage(message, duration = 3000) {
    toast.warning(message, duration);
  }

  /**
   * نمایش پیام موفقیت
   * @param {string} message - پیام
   * @param {number} duration - مدت زمان نمایش (میلی‌ثانیه)
   */
  showSuccessMessage(message, duration = 3000) {
    toast.success(message, duration);
  }

  /**
   * فعال/غیرفعال کردن یک دکمه کنترل
   * @param {string} controlName - نام کنترل
   * @param {boolean} isActive - وضعیت فعال/غیرفعال
   */
  setControlState(controlName, isActive) {
    const button = document.querySelector(`[data-control="${controlName}"]`);
    if (button) {
      if (isActive) {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }
    }
  }

  /**
   * غیرفعال کردن تمام دکمه‌های کنترل
   */
  deactivateAllControls() {
    const buttons = document.querySelectorAll(
      ".armo-sdk-camera-control-button"
    );
    buttons.forEach((button) => {
      button.classList.remove("active");
    });
  }

  /**
   * بررسی اینکه آیا یک کنترل فعال است
   * @param {string} controlName - نام کنترل
   * @returns {boolean} وضعیت فعال/غیرفعال
   */
  isControlActive(controlName) {
    const button = document.querySelector(`[data-control="${controlName}"]`);
    return button ? button.classList.contains("active") : false;
  }

  /**
   * نمایش پیام تایید
   * @param {string} title - عنوان
   * @param {string} message - پیام
   * @param {Function} onConfirm - تابع تایید
   * @param {Function} onCancel - تابع لغو (اختیاری)
   */
  showConfirmMessage(title, message, onConfirm, onCancel = null) {
    const confirmElement = document.createElement("div");
    confirmElement.className = "armo-sdk-confirm-message";

    confirmElement.innerHTML = `
      <div class="armo-sdk-message-title">${title}</div>
      <div class="armo-sdk-message-content">${message}</div>
      <div class="armo-sdk-message-buttons">
        <button class="armo-sdk-message-button confirm">تایید</button>
        <button class="armo-sdk-message-button cancel">لغو</button>
      </div>
    `;

    const container = document.querySelector(".armo-sdk-container");
    if (container) {
      container.appendChild(confirmElement);
    } else {
      document.body.appendChild(confirmElement);
    }

    // Event listeners
    const confirmBtn = confirmElement.querySelector(".confirm");
    const cancelBtn = confirmElement.querySelector(".cancel");

    confirmBtn.addEventListener("click", () => {
      confirmElement.remove();
      if (typeof onConfirm === "function") {
        onConfirm();
      }
    });

    cancelBtn.addEventListener("click", () => {
      confirmElement.remove();
      if (typeof onCancel === "function") {
        onCancel();
      }
    });
  }

  /**
   * نمایش نوتیفیکیشن کوتاه
   * @param {string} message - پیام
   * @param {string} type - نوع (success, error, warning, info)
   * @param {number} duration - مدت زمان نمایش
   */
  showNotification(message, type = "info", duration = 3000) {
    switch (type) {
      case "success":
        this.showSuccessMessage(message, duration);
        break;
      case "error":
        toast.error(message, duration);
        break;
      case "warning":
        this.showWarningMessage(message, duration);
        break;
      case "info":
      default:
        this.showInfoMessage(message, duration);
        break;
    }
  }

  /**
   * ایجاد progress bar
   * @param {string} containerId - ID کانتینر
   * @param {number} progress - درصد پیشرفت (0-100)
   */
  updateProgressBar(containerId, progress) {
    let progressContainer = document.getElementById(containerId);

    if (!progressContainer) {
      progressContainer = document.createElement("div");
      progressContainer.id = containerId;
      progressContainer.className = "armo-sdk-progress-container";
      progressContainer.innerHTML = `
        <div class="armo-sdk-progress-bar">
          <div class="armo-sdk-progress-fill"></div>
        </div>
        <div class="armo-sdk-progress-text">0%</div>
      `;

      const container = document.querySelector(".armo-sdk-container");
      if (container) {
        container.appendChild(progressContainer);
      }
    }

    const progressFill = progressContainer.querySelector(
      ".armo-sdk-progress-fill"
    );
    const progressText = progressContainer.querySelector(
      ".armo-sdk-progress-text"
    );

    if (progressFill) {
      progressFill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }

    if (progressText) {
      progressText.textContent = `${Math.round(progress)}%`;
    }

    // حذف progress bar اگر کار تمام شده
    if (progress >= 100) {
      setTimeout(() => {
        if (progressContainer && progressContainer.parentElement) {
          progressContainer.remove();
        }
      }, 1000);
    }
  }

  /**
   * پاکسازی رابط کاربری
   */
  cleanup() {
    this.removeErrorMessages();
    this.hideLightWarning();

    // حذف تمام پیام‌های confirm
    const confirmMessages = document.querySelectorAll(
      ".armo-sdk-confirm-message"
    );
    confirmMessages.forEach((element) => element.remove());

    // حذف progress bar ها
    const progressBars = document.querySelectorAll(
      ".armo-sdk-progress-container"
    );
    progressBars.forEach((element) => element.remove());

    toast.cleanup();
  }
}

export default UiManager;
