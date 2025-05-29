// src/core/modules/mode-manager.js

import { setupFaceMesh, cleanup } from "../methods/faceMesh";
import { ImageManager } from "../methods/imageManager";
import { initImageUpload } from "../../ui";
import {
  changeMakeupColor as handleMakeupColorChange,
  setMakeupPattern as handleMakeupPatternChange,
} from "../methods/makeupHandle";

/**
 * کلاس مدیریت حالت‌های SDK
 */
export class ModeManager {
  /**
   * سازنده کلاس ModeManager
   * @param {Object} options - تنظیمات
   * @param {Object} elements - المنت‌های HTML
   * @param {Object} managers - مدیرهای مختلف
   */
  constructor(options, elements, managers) {
    this.options = options;
    this.videoElement = elements.videoElement;
    this.canvasElement = elements.canvasElement;

    this.featureManager = managers.featureManager;
    this.uiManager = managers.uiManager;
    this.productManager = managers.productManager; // اضافه کردن productManager

    if (managers.comparisonManager && elements.canvasElement) {
      this.imageManager = new ImageManager(
        elements.canvasElement,
        managers.featureManager,
        managers.comparisonManager
      );
    } else if (elements.canvasElement) {
      this.imageManager = new ImageManager(
        elements.canvasElement,
        managers.featureManager,
        null
      );
    }

    this.cameraStream = null;
    this.faceMeshInstance = null;
    this.onResultsCallback = null;
  }

  /**
   * تنظیم تابع فراخوانی شونده برای نتایج تشخیص چهره
   * @param {Function} callback - تابع فراخوانی شونده
   */
  setOnResultsCallback(callback) {
    this.onResultsCallback = callback;
  }

  /**
   * تغییر رنگ آرایش بر اساس حالت فعلی
   * @param {string} type - نوع آرایش (e.g., 'lips', 'eyeshadow')
   * @param {string} color - کد هگز رنگ
   * @param {string} [code=null] - کد نام رنگ (اختیاری)
   */
  changeMakeupColor(type, color, code = null) {
    if (!type || !color) {
      console.warn("نوع یا رنگ آرایش برای تغییر مشخص نشده است.");
      return false;
    }

    // ۱. به‌روزرسانی وضعیت رنگ در ماژول‌های آرایش (برای رندر دوربین)
    handleMakeupColorChange(type, color);

    // ۲. اگر در حالت تصویر هستیم، تصویر رو با رنگ جدید آپدیت می‌کنیم
    if (this.options.mode === "image" && this.imageManager) {
      this.imageManager.updateMakeup(
        type,
        color,
        this.imageManager.currentPattern,
        this.imageManager.currentTransparency
      );
    }

    // ۳. ذخیره رنگ فعلی در options برای استفاده بعدی
    this.options.currentMakeupType = type;
    this.options.currentColor = color;

    return true;
  }

  /**
   * تغییر pattern آرایش بر اساس حالت فعلی
   * @param {string} type - نوع آرایش
   * @param {string} pattern - کد pattern (lowercase)
   */
  changeMakeupPattern(type, pattern) {
    if (!type || !pattern) {
      console.warn("نوع یا pattern آرایش برای تغییر مشخص نشده است.");
      return false;
    }

    // ۱. به‌روزرسانی pattern در ماژول‌های آرایش
    handleMakeupPatternChange(type, pattern);

    // ۲. اگر در حالت تصویر هستیم، تصویر رو با pattern جدید آپدیت می‌کنیم
    if (this.options.mode === "image" && this.imageManager) {
      this.imageManager.updateMakeup(
        type,
        this.options.currentColor || this.imageManager.currentMakeupColor,
        pattern,
        this.imageManager.currentTransparency
      );
    }

    // ۳. ذخیره pattern فعلی در options
    this.options.currentPattern = pattern;

    return true;
  }

  /**
   * اعمال رنگ و pattern پیش‌فرض محصول
   * @param {string} makeupType - نوع آرایش
   */
  applyProductDefaults(makeupType) {
    if (!this.productManager || !this.productManager.hasValidProduct()) {
      return false;
    }

    const productType = this.productManager.getProductType();

    // بررسی اینکه نوع آرایش با نوع محصول مطابقت دارد
    if (productType !== makeupType) {
      return false;
    }

    // اعمال رنگ پیش‌فرض
    const defaultColor = this.productManager.getCurrentColorHex();
    if (defaultColor) {
      this.changeMakeupColor(makeupType, defaultColor);
    }

    // اعمال pattern پیش‌فرض
    const defaultPattern = this.productManager.getCurrentPattern();
    if (defaultPattern) {
      this.changeMakeupPattern(makeupType, defaultPattern);
    }

    return true;
  }

  /**
   * تغییر حالت SDK (دوربین/تصویر)
   * @param {string} newMode - حالت جدید
   * @returns {Promise<void>}
   */
  async switchMode(newMode) {
    if (newMode === this.options.mode) return;

    // cleanup حالت قبلی
    if (this.options.mode === "camera") {
      if (newMode === "image") {
        this._hideCamera();
      } else {
        this._cleanupCamera();
      }
    } else if (this.options.mode === "image") {
      if (this.imageManager) {
        this.imageManager.destroy();
      }

      if (newMode === "camera") {
        this.options.mode = newMode;
        await this.initCamera();
        return;
      }
    }

    this.options.mode = newMode;

    // راه‌اندازی حالت جدید
    if (newMode === "image") {
      await this.initImageMode();
    }
  }

  /**
   * مخفی کردن دوربین بدون توقف کامل
   * @private
   */
  _hideCamera() {
    if (this.videoElement) {
      this.videoElement.style.display = "none";
      this.videoElement.style.visibility = "hidden";
    }

    if (this.canvasElement) {
      const ctx = this.canvasElement.getContext("2d");
      ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    }
  }

  /**
   * پاکسازی کامل دوربین
   * @private
   */
  _cleanupCamera() {
    if (this.faceMeshInstance) {
      this.faceMeshInstance = null;
      cleanup();
    }

    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.cameraStream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }

  /**
   * راه‌اندازی حالت دوربین
   * @returns {Promise<void>}
   */
  async initCamera() {
    try {
      // نمایش المنت ویدیو
      if (this.videoElement) {
        this.videoElement.style = "";
        this.videoElement.style.transform = "scaleX(-1)";
        this.videoElement.style.display = "block";
      }

      // تنظیم مجدد استایل‌های canvas
      if (this.canvasElement) {
        this.canvasElement.style = "";
        this.canvasElement.style.transform = "scaleX(-1)";
        this.canvasElement.style.display = "block";
      }

      // راه‌اندازی ویدیو و face mesh
      await this._setupVideo();

      const faceMeshResult = await setupFaceMesh(
        this.videoElement,
        this.canvasElement,
        this.onResultsCallback || (() => {})
      );

      this.faceMeshInstance = faceMeshResult.faceMesh;
      this.cameraStream = faceMeshResult.stream;

      return true;
    } catch (error) {
      console.error("Error initializing camera:", error);
      this.uiManager.showErrorMessage(
        "خطا",
        "مشکلی در راه‌اندازی دوربین رخ داد"
      );
      return false;
    }
  }

  /**
   * راه‌اندازی حالت تصویر
   * @returns {Promise<void>}
   */
  async initImageMode() {
    try {
      const container = document.querySelector(".armo-sdk-container");

      // مخفی کردن کامل ویدیو
      if (this.videoElement) {
        this.videoElement.style.display = "none";
        this.videoElement.style.visibility = "hidden";
      }

      // تنظیم canvas برای نمایش سیاه
      if (this.canvasElement) {
        this.canvasElement.style.display = "block";
        this.canvasElement.style.visibility = "visible";
        this.canvasElement.style.position = "absolute";
        this.canvasElement.style.top = "0";
        this.canvasElement.style.left = "0";
        this.canvasElement.style.width = "100%";
        this.canvasElement.style.height = "100%";

        // پر کردن canvas با رنگ سیاه
        const ctx = this.canvasElement.getContext("2d");
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height);
      }

      // ایجاد یا بازیابی imageManager
      if (!this.imageManager) {
        const comparisonManager = this.options.comparisonManager || null;
        this.imageManager = new ImageManager(
          this.canvasElement,
          this.featureManager,
          comparisonManager
        );
      }

      // نمایش رابط کاربری آپلود
      const uploadManager = initImageUpload(container, async (imageData) => {
        this.uiManager.showLoading();

        try {
          const success = await this.imageManager.loadImage(imageData);

          if (success) {
            // اعمال تنظیمات فعلی آرایش روی عکس
            if (this.options.currentMakeupType && this.options.currentColor) {
              this.imageManager.updateMakeup(
                this.options.currentMakeupType,
                this.options.currentColor,
                this.options.currentPattern || this.imageManager.currentPattern,
                this.options.transparency === undefined
                  ? this.imageManager.currentTransparency
                  : this.options.transparency
              );
            }
          } else {
            this.uiManager.showErrorMessage(
              "خطا",
              "چهره‌ای در تصویر تشخیص داده نشد"
            );
          }
        } catch (error) {
          this.uiManager.showErrorMessage(
            "خطا",
            "مشکلی در پردازش تصویر رخ داد"
          );
        } finally {
          this.uiManager.hideLoading();
        }
      });

      // اضافه کردن callback برای زمانی که کاربر مدال را می‌بندد
      uploadManager.show(() => {
        this.switchMode("camera");
      });

      return true;
    } catch (error) {
      console.error("Error initializing image mode:", error);
      this.uiManager.showErrorMessage(
        "خطا",
        "مشکلی در راه‌اندازی حالت تصویر رخ داد"
      );
      return false;
    }
  }

  /**
   * راه‌اندازی ویدیو
   * @private
   */
  async _setupVideo() {
    try {
      if (this.videoElement) {
        this.videoElement.setAttribute("playsinline", "");
        this.videoElement.setAttribute("autoplay", "");
        this.videoElement.muted = true;
      }
    } catch (error) {
      console.error("Error setting up video:", error);
      throw error;
    }
  }

  /**
   * پاکسازی منابع
   */
  cleanup() {
    this._cleanupCamera();

    if (this.imageManager) {
      this.imageManager.destroy();
      this.imageManager = null;
    }
  }

  /**
   * دریافت حالت فعلی
   * @returns {string} حالت فعلی
   */
  getCurrentMode() {
    return this.options.mode;
  }
}

export default ModeManager;
