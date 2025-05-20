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
   * پاکسازی رابط کاربری
   */
  cleanup() {
    this.removeErrorMessages();
    this.hideLightWarning();
    toast.cleanup();
  }
}

export default UiManager;
