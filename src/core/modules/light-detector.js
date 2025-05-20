// src/core/modules/light-detector.js

/**
 * کلاس تشخیص و مدیریت شرایط نوری محیط
 */
export class LightDetector {
  /**
   * سازنده کلاس LightDetector
   * @param {HTMLVideoElement} videoElement - المنت ویدیو
   * @param {Function} onLowLight - تابع فراخوانی شونده در صورت تشخیص نور کم
   * @param {Function} onNormalLight - تابع فراخوانی شونده در صورت بازگشت به نور عادی
   */
  constructor(videoElement, onLowLight, onNormalLight) {
    this.videoElement = videoElement;
    this.onLowLight = onLowLight;
    this.onNormalLight = onNormalLight;

    this._isInitialized = false;
    this._darkFrameCount = 0;
    this._lastCheckTimestamp = 0;
    this._checkInterval = 500; // میلی‌ثانیه
    this._isLowLightDetected = false;
  }

  /**
   * راه‌اندازی اولیه تشخیص نور
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this._isInitialized) return;

    // تأخیر اولیه برای تنظیم دوربین
    await new Promise((resolve) => setTimeout(resolve, 1500));

    this._isInitialized = true;
    this._darkFrameCount = 0;
    this._lastCheckTimestamp = 0;
  }

  /**
   * بررسی شرایط نوری فریم جاری
   * @returns {Promise<void>}
   */
  async checkLightConditions() {
    if (!this._isInitialized || !this.videoElement) return;

    const now = performance.now();

    // بررسی فقط اگر زمان کافی از بررسی قبلی گذشته باشد
    if (now - this._lastCheckTimestamp >= this._checkInterval) {
      this._lastCheckTimestamp = now;
      await this._checkFrameBrightness();
    }
  }

  /**
   * بررسی روشنایی فریم جاری
   * @private
   */
  async _checkFrameBrightness() {
    try {
      const stream = this.videoElement?.srcObject;
      if (!stream) return;

      const track = stream.getVideoTracks()[0];
      if (!track) return;

      // استفاده از فریم جاری ویدیو
      const canvas = document.createElement("canvas");
      const settings = track.getSettings();
      canvas.width = settings.width || 640;
      canvas.height = settings.height || 480;

      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);

      // بررسی فقط بخش مرکزی تصویر
      const centerX = Math.floor(canvas.width / 2);
      const centerY = Math.floor(canvas.height / 2);
      const sampleSize = 100; // اندازه ناحیه نمونه‌برداری

      const imageData = context.getImageData(
        centerX - sampleSize / 2,
        centerY - sampleSize / 2,
        sampleSize,
        sampleSize
      );
      const data = imageData.data;

      // محاسبه میانگین روشنایی
      let brightness = 0;
      const samplingRate = 10; // نرخ نمونه‌برداری برای بهبود عملکرد

      for (let i = 0; i < data.length; i += 4 * samplingRate) {
        brightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
      }

      brightness = brightness / (data.length / (4 * samplingRate));
      const brightnessThreshold = 80; // آستانه روشنایی

      if (brightness < brightnessThreshold) {
        this._darkFrameCount++;

        // نمایش هشدار بعد از 3 فریم تاریک متوالی
        if (this._darkFrameCount >= 3 && !this._isLowLightDetected) {
          this._isLowLightDetected = true;

          if (typeof this.onLowLight === "function") {
            this.onLowLight();
          }
        }
      } else {
        this._darkFrameCount = 0;

        if (this._isLowLightDetected) {
          this._isLowLightDetected = false;

          if (typeof this.onNormalLight === "function") {
            this.onNormalLight();
          }
        }
      }
    } catch (error) {
      console.warn("خطا در بررسی روشنایی فریم:", error);
    }
  }

  /**
   * آیا نور محیط کم است؟
   * @returns {boolean} وضعیت نور کم
   */
  isLowLight() {
    return this._isLowLightDetected;
  }

  /**
   * پاکسازی منابع
   */
  cleanup() {
    this._isInitialized = false;
    this._darkFrameCount = 0;
    this._isLowLightDetected = false;
  }
}

export default LightDetector;
