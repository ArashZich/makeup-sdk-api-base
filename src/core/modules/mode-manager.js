// src/core/modules/mode-manager.js

import { setupFaceMesh, cleanup } from "../methods/faceMesh";
import { ImageManager } from "../methods/imageManager";
import { initImageUpload } from "../../ui";
// این خط رو اضافه کنید
import { changeMakeupColor as handleMakeupColorChange } from "../methods/makeupHandle";

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
    // اگر RenderManager یا ImageManager هم در managers پاس داده می‌شن، اونها رو هم اینجا نگه دارید
    // مثال: this.renderManager = managers.renderManager;
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
    // this.imageManager = null; // این خط رو بررسی کنید، شاید باید از managers بیاد یا اینجا new بشه
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
    // این تابع، متغیرهای گلوبال رنگ در هر ماژول آرایش (مثلا lipstickColor در lips.js) رو آپدیت می‌کنه
    handleMakeupColorChange(type, color);

    // ۲. اگر در حالت تصویر هستیم، تصویر رو با رنگ جدید آپدیت می‌کنیم
    if (this.options.mode === "image" && this.imageManager) {
      // فرض می‌کنیم ImageManager متدهای لازم برای دریافت پترن و شفافیت فعلی خودش رو داره
      // یا اینکه این مقادیر از یک جای مرکزی دیگه خونده میشن
      this.imageManager.updateMakeup(
        type,
        color,
        this.imageManager.currentPattern, // یا مقدار پیش‌فرض/فعلی پترن
        this.imageManager.currentTransparency // یا مقدار پیش‌فرض/فعلی شفافیت
      );
    }
    // در حالت دوربین، حلقه رندر خودکار تغییرات رو اعمال می‌کنه
    // چون از متغیرهای گلوبال آپدیت شده توسط handleMakeupColorChange استفاده می‌کنه

    // برای اطمینان، می‌تونید یک event هم emit کنید اگر سایر بخش‌ها نیاز به اطلاع از تغییر رنگ دارن
    // document.dispatchEvent(new CustomEvent('makeupColorChanged', { detail: { type, color, code } }));
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
      // در حالت تصویر، دوربین را کاملاً متوقف نمی‌کنیم بلکه فقط مخفی می‌کنیم
      if (newMode === "image") {
        this._hideCamera();
      } else {
        // اگر به حالت دیگری غیر از image می‌رویم، عملیات cleanup کامل را انجام می‌دهیم
        this._cleanupCamera();
      }
    } else if (this.options.mode === "image") {
      if (this.imageManager) {
        this.imageManager.destroy();
      }

      // اگر در حالت image بودیم و مدال بسته شد، به حالت دوربین برگردیم
      if (newMode === "camera") {
        this.options.mode = newMode;
        await this.initCamera();
        return; // بعد از فراخوانی initCamera نیازی به اجرای کد بعدی نیست
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
      // پاک کردن canvas برای نمایش صفحه سیاه
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
        this.videoElement.style = ""; // پاک کردن همه استایل‌ها
        this.videoElement.style.transform = "scaleX(-1)"; // فقط حفظ mirror
        this.videoElement.style.display = "block";
      }

      // تنظیم مجدد استایل‌های canvas
      if (this.canvasElement) {
        this.canvasElement.style = ""; // پاک کردن همه استایل‌ها
        this.canvasElement.style.transform = "scaleX(-1)"; // فقط حفظ mirror
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
        // پاس دادن comparisonManager اگر وجود دارد
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
            // در صورت موفقیت، اعمال تنظیمات فعلی آرایش روی عکس
            if (this.options.currentMakeupType && this.options.currentColor) {
              // اطمینان از وجود هر دو
              this.imageManager.updateMakeup(
                this.options.currentMakeupType,
                this.options.currentColor,
                this.options.currentPattern || this.imageManager.currentPattern, // استفاده از پترن imageManager اگر آپشن موجود نیست
                this.options.transparency === undefined
                  ? this.imageManager.currentTransparency
                  : this.options.transparency // استفاده از شفافیت imageManager اگر آپشن موجود نیست
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
        // برگرداندن به حالت دوربین
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
