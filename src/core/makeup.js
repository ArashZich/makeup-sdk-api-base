// src/makeup.js

import "core-js/stable";
import "regenerator-runtime/runtime";
import {
  // faceMesh
  setupFaceMesh,
  cleanup,
  // domSetup
  createDOMElements,
  // comparisonManager
  ComparisonManager,
  // makeupHandle
  changeMakeupColor,
  setMakeupPattern,
  setMakeupTransparency,
  //featureManager
  FeatureManager,
  defaultFeatures,
  defaultPatterns,
  // renderManager
  RenderManager,
  // imageManager
  ImageManager,
} from "./methods";
import {
  initColorPicker,
  initCameraControls,
  toast,
  initImageUpload,
} from "../ui";
import { isMobileDevice, getUserIP, processColorsArray } from "../utils";

import "../ui/styles/index.css";

class Makeup {
  static version = "v2";
  static defaultFeatures = defaultFeatures;
  static defaultPatterns = defaultPatterns;

  static STATUS = {
    INITIALIZING: "initializing",
    LOADING: "loading",
    READY: "ready",
    ERROR: "error",
    PAUSED: "paused",
    CLEANUP: "cleanup",
  };

  static MAKEUP_TYPES = {
    LIPS: "lips",
    EYESHADOW: "eyeshadow",
    EYEPENCIL: "eyepencil",
    EYELASHES: "eyelashes",
    BLUSH: "blush",
    FOUNDATION: "foundation",
    BROWS: "brows",
    CONCEALER: "concealer",
    EYELINER: "eyeliner",
    LENS: "lens",
  };

  // اضافه کردن متغیرهای جدید
  _lastAnalyticsCall = {
    makeupType: null,
    color: null,
    colorCode: null,
    timestamp: 0,
  };

  constructor(options) {
    // قبل از شروع، cleanup رو صدا میزنیم
    cleanup();

    // تنظیمات اولیه
    this.options = {
      showColorPicker: true, // مقدار پیش‌فرض
      colors: [],
      pattern: "normal",
      face: "lips",
      transparency: null,
      mode: "camera",
      onReady: () => {}, // callback پیش‌فرض خالی
      onError: () => {}, // callback پیش‌فرض خالی
      ...options, // گزینه‌های ارسال شده با مقادیر پیش‌فرض merge می‌شوند
    };

    // مقداردهی imageManager
    this.imageManager = null;

    this.status = Makeup.STATUS.INITIALIZING;
    this.isLightWarningShown = false;
    this.lightWarningElement = null;
    this._isLightCheckInitialized = false;
    this._darkFrameCount = 0;
    this._lastCheckTimestamp = 0;
    this._checkInterval = 500;

    // متغیرهای دوربین
    this.faceMeshInstance = null;
    this.cameraStream = null;

    // بررسی توکن
    if (!window.Makeup.token) {
      console.error(
        "توکن باید قبل از استفاده از کلاس Makeup به صورت جهانی تنظیم شود."
      );
      this.showErrorMessage(
        "خطا در تنظیم توکن",
        "لطفاً توکن را تنظیم کرده و دوباره تلاش کنید."
      );
      throw new Error("توکن تنظیم نشده است.");
    }

    this.token = window.Makeup.token;
    this.mediaFeatures = null;

    // before after
    this.comparisonManager = null;

    // پردازش رنگ‌ها و اعتبارسنجی توکن
    this._initialSetup()
      .then(() => {
        // اعتبارسنجی توکن و شروع
        this.validateToken(this.token)
          .then(
            ({
              isValid,
              isPremium,
              projectType,
              features = null,
              mediaFeatures = null,
            }) => {
              if (!isValid) {
                throw new Error("توکن نامعتبر است.");
              }
              if (projectType !== "makeup") {
                throw new Error("نوع پروژه نادرست است.");
              }
              this.isPremium = isPremium;
              this.featureManager = new FeatureManager(features);
              this.mediaFeatures = mediaFeatures;

              // تنظیم نوع آرایش اولیه
              this.currentMakeupType = this.options.face || "lips";

              // اگر نوع آرایش انتخابی مجاز نیست، از اولین نوع مجاز استفاده می‌کنیم
              if (
                !this.featureManager.isFeatureEnabled(this.currentMakeupType)
              ) {
                const enabledFeatures =
                  this.featureManager.getEnabledFeatures();
                this.currentMakeupType = enabledFeatures[0] || "lips";
              }

              // تنظیم پترن اولیه بر اساس پترن‌های مجاز
              const allowedPatterns = this.featureManager.getAllowedPatterns(
                this.currentMakeupType
              );
              if (allowedPatterns && allowedPatterns.length > 0) {
                this.options.pattern = allowedPatterns[0]; // استفاده از اولین پترن مجاز
              }

              this.init();
            }
          )
          .catch((error) => {
            this.status = Makeup.STATUS.ERROR;
            console.error(error.message);
            this.showErrorMessage(
              "خطا",
              "خطایی در دسترسی به توکن یا تنظیم پروژه رخ داده است."
            );

            if (typeof this.options.onError === "function") {
              this.options.onError(error);
            }
          });
      })
      .catch((error) => {
        this.status = Makeup.STATUS.ERROR;
        console.error(`خطا در راه‌اندازی: ${error.message}`);
        this.showErrorMessage("خطا در راه‌اندازی", error.message);

        if (typeof this.options.onError === "function") {
          this.options.onError(error);
        }
      });
  }

  // این متد را به کلاس Makeup اضافه کنید:
  async _initialSetup() {
    // پردازش رنگ‌های ورودی
    if (this.options.colors && Array.isArray(this.options.colors)) {
      // پردازش رنگ‌ها با استفاده از تابع processColorsArray
      this.options.colors = await processColorsArray(this.options.colors);
    }
  }

  /**
   * استخراج رنگ غالب از تصویر
   * @param {string} imageUrl - آدرس تصویر
   * @returns {Promise<string>} کد رنگ هگز استخراج شده
   */
  async extractDominantColor(imageUrl) {
    if (!imageUrl) {
      throw new Error("آدرس تصویر نامعتبر است");
    }

    try {
      // استفاده از تابع استخراج رنگ از utils
      const { extractDominantColor } = await import("../utils");
      return await extractDominantColor(imageUrl);
    } catch (error) {
      console.error("خطا در استخراج رنگ از تصویر:", error);
      throw error;
    }
  }

  /**
   * افزودن رنگ جدید از طریق URL تصویر
   * @param {string} imageUrl - آدرس تصویر
   * @param {string} code - کد رنگ
   * @param {string} feature - ویژگی مرتبط (اختیاری)
   * @returns {Promise<string>} کد رنگ استخراج شده
   */
  async addColorFromImage(imageUrl, code, feature = null) {
    if (!imageUrl) {
      throw new Error("آدرس تصویر نامعتبر است");
    }

    try {
      // استخراج رنگ از تصویر
      const extractedColor = await this.extractDominantColor(imageUrl);

      // ایجاد آبجکت رنگ جدید
      const newColor = {
        code: code || `C${this.options.colors.length + 1}`,
        color: extractedColor,
        url: imageUrl,
      };

      // اضافه کردن ویژگی اگر مشخص شده باشد
      if (feature) {
        newColor.feature = feature;
      }

      // اضافه کردن به آرایه رنگ‌ها
      this.options.colors.push(newColor);

      // بروز کردن color picker
      if (this.options.showColorPicker) {
        const { initColorPicker } = await import("../ui/colorPicker");
        initColorPicker(
          (color) => this.changeMakeupColor(this.currentMakeupType, color),
          this.options.colors,
          "armo-sdk-color-picker",
          this.featureManager
        );
      }

      return extractedColor;
    } catch (error) {
      console.error("خطا در استخراج رنگ از تصویر:", error);
      throw error;
    }
  }

  async switchMode(newMode) {
    if (newMode === this.options.mode) return;

    // cleanup حالت قبلی
    if (this.options.mode === "camera") {
      // در حالت تصویر، دوربین را کاملاً متوقف نمی‌کنیم بلکه فقط مخفی می‌کنیم
      if (newMode === "image") {
        // مخفی کردن کامل ویدیو و خالی کردن canvas
        if (this.videoElement) {
          this.videoElement.style.display = "none";
          this.videoElement.style.visibility = "hidden";
        }
        if (this.canvasElement) {
          // پاک کردن canvas برای نمایش صفحه سیاه
          const ctx = this.canvasElement.getContext("2d");
          ctx.clearRect(
            0,
            0,
            this.canvasElement.width,
            this.canvasElement.height
          );
          ctx.fillStyle = "#000000";
          ctx.fillRect(
            0,
            0,
            this.canvasElement.width,
            this.canvasElement.height
          );
        }
      } else {
        // اگر به حالت دیگری غیر از image می‌رویم، عملیات cleanup کامل را انجام می‌دهیم
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
        this.imageManager = new ImageManager(
          this.canvasElement,
          this.featureManager,
          this.comparisonManager
        );
      }

      // Show upload UI
      const uploadManager = initImageUpload(container, async (imageData) => {
        this.showLoading();

        try {
          const success = await this.imageManager.loadImage(imageData);

          if (success) {
            // اعمال تنظیمات فعلی آرایش روی عکس
            if (this.currentMakeupType) {
              this.imageManager.updateMakeup(
                this.currentMakeupType,
                this.options.colors[0]?.color,
                this.options.pattern,
                this.options.transparency
              );
            }

            if (typeof this.options.onReady === "function") {
              this.options.onReady();
            }
          } else {
            this.showErrorMessage("خطا", "چهره‌ای در تصویر تشخیص داده نشد");
          }
        } catch (error) {
          this.showErrorMessage("خطا", "مشکلی در پردازش تصویر رخ داد");
        } finally {
          this.hideLoading();
        }
      });

      // اضافه کردن یک callback برای زمانی که کاربر مدال را می‌بندد
      uploadManager.show(
        // این callback وقتی کاربر مدال را می‌بندد فراخوانی می‌شود
        () => {
          // برگرداندن به حالت دوربین
          this.switchMode("camera");
        }
      );
    } catch (error) {
      console.error("Error initializing image mode:", error);
      this.showErrorMessage("خطا", "مشکلی در راه‌اندازی حالت تصویر رخ داد");
    }
  }
  async initCamera() {
    try {
      // Show video element
      if (this.videoElement) {
        this.videoElement.style = ""; // پاک کردن همه استایل‌ها
        this.videoElement.style.transform = "scaleX(-1)"; // فقط حفظ mirror
        this.videoElement.style.display = "block";
      }

      // Reset canvas styles
      if (this.canvasElement) {
        this.canvasElement.style = ""; // پاک کردن همه استایل‌ها
        this.canvasElement.style.transform = "scaleX(-1)"; // فقط حفظ mirror
        this.canvasElement.style.display = "block";
      }

      // Setup video and face mesh
      await this.setupVideo();
      const faceMeshResult = await setupFaceMesh(
        this.videoElement,
        this.canvasElement,
        this.onResults.bind(this)
      );

      this.faceMeshInstance = faceMeshResult.faceMesh;
      this.cameraStream = faceMeshResult.stream;

      await this.checkLightConditions();

      if (typeof this.options.onReady === "function") {
        this.options.onReady();
      }
    } catch (error) {
      console.error("Error initializing camera:", error);
      this.showErrorMessage("خطا", "مشکلی در راه‌اندازی دوربین رخ داد");
    }
  }

  async validateToken(token) {
    try {
      const userIP = await getUserIP();
      const response = await fetch(process.env.VALIDATE_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Real-User-IP": userIP, // ارسال IP واقعی کاربر
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!data.isValid) {
        this.showErrorMessage(
          "خطا در اعتبارسنجی",
          "توکن نامعتبر یا منقضی شده است."
        );
        return { isValid: false };
      }

      if (data.projectType !== "makeup") {
        this.showErrorMessage(
          "خطا در نوع پروژه",
          "این توکن برای پروژه آرایش مجازی معتبر نیست."
        );
        return {
          isValid: true,
          isPremium: data.isPremium,
          projectType: data.projectType,
        };
      }

      //TODO This is True
      return {
        isValid: true,
        isPremium: data.isPremium,
        projectType: data.projectType,
        features: data.features || {},
        mediaFeatures: data.mediaFeatures || {
          allowedSources: [],
          allowedViews: [],
          comparisonModes: [],
        },
      };

      //TODO This is for Test
      // return {
      //   isValid: true,
      //   isPremium: data.isPremium,
      //   projectType: data.projectType,
      //   features: data.features || {},
      //   mediaFeatures: data.mediaFeatures || {
      //     allowedSources: ["camera", "image"],
      //     allowedViews: ["single", "multi", "split"],
      //     comparisonModes: ["before-after", "split"],
      //   },
      // };
    } catch (error) {
      console.error("خطا در اعتبارسنجی توکن:", error);
      this.showErrorMessage(
        "خطا در ارتباط با سرور",
        "لطفاً اتصال اینترنت خود را بررسی کنید."
      );
      return { isValid: false };
    }
  }

  async _sendAnalytics(makeupType, color, colorCode) {
    try {
      // check token
      if (!this.token) {
        console.warn("No token found for analytics");
        return;
      }

      // چک کردن اعتبار پارامترها
      if (!makeupType || !color) return;

      // جلوگیری از ارسال درخواست‌های تکراری در بازه زمانی کوتاه (مثلاً 2 ثانیه)
      const now = Date.now();
      if (
        this._lastAnalyticsCall.makeupType === makeupType &&
        this._lastAnalyticsCall.color === color &&
        this._lastAnalyticsCall.colorCode === colorCode &&
        now - this._lastAnalyticsCall.timestamp < 2000
      ) {
        return;
      }

      // ارسال درخواست
      const response = await fetch(process.env.ANALYTICS_MAKEUP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: this.token,
          makeupType,
          color,
          colorCode,
        }),
      });

      // بروزرسانی آخرین درخواست
      this._lastAnalyticsCall = {
        makeupType,
        color,
        colorCode,
        timestamp: now,
      };
    } catch (error) {
      console.warn("Error sending analytics:", error);
    }
  }

  async init() {
    try {
      this.status = Makeup.STATUS.LOADING;
      this.setupDOMElements();
      this.showLoading();

      if (this.options.mode === "camera") {
        await this.setupVideo();
        const faceMeshResult = await setupFaceMesh(
          this.videoElement,
          this.canvasElement,
          this.onResults.bind(this)
        );

        this.faceMeshInstance = faceMeshResult.faceMesh;
        this.cameraStream = faceMeshResult.stream;

        this.initializeMakeup();
        this.setupEventListeners();

        // Initialize camera controls
        initCameraControls(this.mediaFeatures);

        this.status = Makeup.STATUS.READY;
        await this.checkLightConditions();
      } else if (this.options.mode === "image") {
        await this.initImageMode();
      }

      // فراخوانی callback در صورت موفقیت
      if (typeof this.options.onReady === "function") {
        this.options.onReady();
      }
    } catch (error) {
      this.status = Makeup.STATUS.ERROR;
      console.error(`خطا در راه‌اندازی: ${error.message}`);
      this.showErrorMessage("خطا در راه‌اندازی", error.message);

      if (typeof this.options.onError === "function") {
        this.options.onError(error);
      }
    }
  }

  async checkLightConditions() {
    try {
      if (this.status !== Makeup.STATUS.READY) return;

      // اگر اولین بار است
      if (!this._isLightCheckInitialized) {
        // تاخیر اولیه برای تنظیم دوربین
        await new Promise((resolve) => setTimeout(resolve, 1500));
        this._isLightCheckInitialized = true;
        this._darkFrameCount = 0;
        this._lastCheckTimestamp = 0;
      }

      const now = performance.now();
      // فقط اگر زمان کافی از چک قبلی گذشته باشد
      if (now - this._lastCheckTimestamp >= this._checkInterval) {
        this._lastCheckTimestamp = now;
        await this._checkFrameBrightness();
      }
    } catch (error) {
      console.warn("خطا در بررسی نور محیط:", error);
    }
  }

  async _checkFrameBrightness() {
    try {
      const stream = this.videoElement?.srcObject;
      if (!stream) return;

      const track = stream.getVideoTracks()[0];
      if (!track) return;

      // استفاده از فریم جاری ویدیو
      const canvas = document.createElement("canvas");
      const settings = track.getSettings();
      canvas.width = settings.width;
      canvas.height = settings.height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(this.videoElement, 0, 0);

      // بررسی فقط بخش مرکزی تصویر
      const centerX = Math.floor(canvas.width / 2);
      const centerY = Math.floor(canvas.height / 2);
      const sampleSize = 100;

      const imageData = context.getImageData(
        centerX - sampleSize / 2,
        centerY - sampleSize / 2,
        sampleSize,
        sampleSize
      );
      const data = imageData.data;

      let brightness = 0;
      const samplingRate = 10;
      for (let i = 0; i < data.length; i += 4 * samplingRate) {
        brightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
      }
      brightness = brightness / (data.length / (4 * samplingRate));

      const brightnessThreshold = 80;

      if (brightness < brightnessThreshold) {
        this._darkFrameCount++;
        // نمایش هشدار بعد از 3 فریم تاریک متوالی
        if (this._darkFrameCount >= 3 && !this.isLightWarningShown) {
          this.showLightWarning();
        }
      } else {
        this._darkFrameCount = 0;
        if (this.isLightWarningShown) {
          this.hideLightWarning();
        }
      }
    } catch (error) {
      console.warn("خطا در بررسی فریم:", error);
    }
  }

  showLightWarning() {
    if (!this.lightWarningElement) {
      this.lightWarningElement = document.createElement("div");
      this.lightWarningElement.className = "armo-sdk-warning-message";
      this.lightWarningElement.innerHTML = `
        <div class="armo-sdk-warning-content">
          <p>نور محیط کافی نیست. لطفاً در نور مناسب قرار بگیرید و صفحه را رفرش کنید.</p>
        </div>
      `;

      const container = document.querySelector(".armo-sdk-container");
      if (container) {
        container.appendChild(this.lightWarningElement);
      }
    }
    this.isLightWarningShown = true;
  }

  hideLightWarning() {
    if (this.lightWarningElement && this.lightWarningElement.parentElement) {
      this.lightWarningElement.remove();
      this.lightWarningElement = null;
    }
    this.isLightWarningShown = false;
  }

  setupDOMElements() {
    try {
      const elements = createDOMElements(this.options, this.isPremium);
      this.videoElement = elements.videoElement;
      this.canvasElement = elements.canvasElement;
      this.loadingElement = elements.loadingElement;
    } catch (error) {
      console.error("خطا در راه‌اندازی المان‌های صفحه:", error);
      this.showErrorMessage(
        "خطا در راه‌اندازی",
        "مشکلی در تنظیم المان‌های رابط کاربری رخ داده است."
      );
    }
  }

  async setupVideo() {
    try {
      this.videoElement.setAttribute("playsinline", "");
      this.videoElement.setAttribute("autoplay", "");
      this.videoElement.muted = true;
    } catch (error) {
      if (typeof this.options.onError === "function") {
        this.options.onError(error);
      }
      throw error;
    }
  }

  initializeMakeup() {
    try {
      // Color picker initialization
      this.initializeColorPicker();

      // Initialize managers
      this.initializeManagers();

      // Initialize patterns and transparency
      this.initializePatternsAndTransparency();

      // Setup event listeners for controls
      this.setupControlEvents();
    } catch (error) {
      console.error("Error in initializeMakeup:", error);
      throw error;
    }
  }

  // Initialize color picker and set initial color
  initializeColorPicker() {
    if (this.options.showColorPicker) {
      // Initialize color picker component
      initColorPicker(
        (color) => this.changeMakeupColor(this.currentMakeupType, color),
        this.options.colors,
        "armo-sdk-color-picker",
        this.featureManager
      );

      // Set initial color if available
      if (this.options.colors.length > 0) {
        const enabledFeatures = this.featureManager.getEnabledFeatures();
        const firstValidColor = this.options.colors.find(
          (color) => !color.feature || enabledFeatures.includes(color.feature)
        );

        if (firstValidColor) {
          this.changeMakeupColor(this.currentMakeupType, firstValidColor.color);
        }
      }
    }
  }

  // Initialize managers for comparison and rendering
  initializeManagers() {
    // اول comparison manager رو بساز
    this.comparisonManager = new ComparisonManager(
      document.querySelector(".armo-sdk-container"),
      this.canvasElement
    );

    // بعد render manager رو با comparison manager بساز
    this.renderManager = new RenderManager(
      this.videoElement,
      this.canvasElement,
      this.featureManager,
      this.comparisonManager
    );

    // در حالت عکس، imageManager رو بساز
    if (this.options.mode === "image") {
      this.imageManager = new ImageManager(
        this.canvasElement,
        this.featureManager
      );
    }
  }

  // Initialize patterns and transparency settings
  initializePatternsAndTransparency() {
    // Get allowed patterns for current makeup type
    const allowedPatterns = this.featureManager.getAllowedPatterns(
      this.currentMakeupType
    );

    // Set initial pattern if available
    if (allowedPatterns && allowedPatterns.length > 0) {
      this.setMakeupPattern(this.currentMakeupType, allowedPatterns[0]);
    }

    // Set initial transparency
    const transparency =
      this.options.transparency !== null ? this.options.transparency : 0.5;

    this.setMakeupTransparency(this.currentMakeupType, transparency);
  }

  setupControlEvents() {
    // Event listener for control buttons
    document.addEventListener("armoControlClick", async (event) => {
      const { control, active } = event.detail;

      switch (control) {
        case "compare":
          if (active) {
            // فعال کردن حالت مقایسه
            this.comparisonManager.enable();
          } else {
            // غیرفعال کردن حالت مقایسه
            this.comparisonManager.disable();
          }
          break;

        // حذف کیس camera چون دیگر دکمه‌ای برای آن نداریم

        case "image":
          if (active) {
            await this.switchMode("image");
          }
          break;

        case "settings":
          if (active) {
            toast.info("پنل تنظیمات به زودی اضافه خواهد شد");
            // اینجا می‌تونید کد مربوط به نمایش پنل تنظیمات رو اضافه کنید
          } else {
            // بستن پنل تنظیمات
          }
          break;

        default:
          console.warn(`Control type "${control}" not handled`);
      }
    });

    // Keyboard shortcuts (اختیاری)
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        // غیرفعال کردن همه حالت‌های فعال
        document
          .querySelectorAll(".armo-sdk-camera-control-button")
          .forEach((btn) => {
            btn.classList.remove("active");
            const control = btn.getAttribute("data-control");
            const event = new CustomEvent("armoControlClick", {
              detail: { control, active: false },
            });
            document.dispatchEvent(event);
          });
      }
    });
  }

  toggleComparison() {
    if (!this.comparisonManager) return;

    if (this.comparisonManager.isActive) {
      this.comparisonManager.disable();
    } else {
      this.comparisonManager.enable();
    }
  }

  changeMakeupColor(type, color) {
    changeMakeupColor(type || this.currentMakeupType, color);
  }

  onResults(landmarks) {
    try {
      if (landmarks) {
        const success = this.renderManager.render(
          landmarks,
          this.currentMakeupType
        );
        if (success) {
          this.hideLoading();
        }
      }
    } catch (error) {
      console.error(`خطا در پردازش نتایج: ${error.message}`);
      this.showErrorMessage(
        "خطا در پردازش تصویر",
        "مشکلی در پردازش تصویر دوربین رخ داده است. لطفاً صفحه را رفرش کرده و مجدداً تلاش کنید."
      );
    }
  }

  // Helper method for skin smoothing
  applySkinSmoothing(canvasCtx, videoWidth, videoHeight, isSafari) {
    // Soft light layer
    canvasCtx.globalCompositeOperation = "soft-light";
    let gradient = canvasCtx.createRadialGradient(
      videoWidth / 2,
      videoHeight / 2,
      videoHeight * 0.2,
      videoWidth / 2,
      videoHeight / 2,
      videoHeight * 0.7
    );

    if (isSafari) {
      gradient.addColorStop(0, "rgba(255, 255, 255, 0.15)");
      gradient.addColorStop(0.5, "rgba(255, 253, 250, 0.1)");
      gradient.addColorStop(1, "rgba(255, 253, 250, 0)");
    } else {
      gradient.addColorStop(0, "rgba(255, 255, 255, 0.25)");
      gradient.addColorStop(0.5, "rgba(255, 253, 250, 0.15)");
      gradient.addColorStop(1, "rgba(255, 253, 250, 0)");
    }

    canvasCtx.fillStyle = gradient;
    canvasCtx.fillRect(0, 0, videoWidth, videoHeight);

    // Color adjustment layer
    canvasCtx.globalCompositeOperation = "color";
    canvasCtx.fillStyle = isSafari
      ? "rgba(255, 243, 235, 0.03)"
      : "rgba(255, 248, 242, 0.04)";
    canvasCtx.fillRect(0, 0, videoWidth, videoHeight);

    // Reset composite operation
    canvasCtx.globalCompositeOperation = "source-over";
  }

  setupEventListeners() {
    document.body.addEventListener(
      "touchstart",
      this.playVideoOnTouch.bind(this)
    );
  }

  playVideoOnTouch() {
    this.videoElement.play().catch((e) => {
      console.error(`خطا در پخش ویدیو با لمس: ${e.message}`);
      this.showErrorMessage(
        "خطا در پخش ویدیو",
        "مشکلی در پخش ویدیو رخ داده است. لطفاً مجوزهای دوربین را بررسی کرده و مجدداً تلاش کنید."
      );
    });
  }

  showErrorMessage(title, message) {
    const errorElement = document.createElement("div");
    errorElement.className = "armo-sdk-error-message";

    const titleElement = document.createElement("h3");
    titleElement.textContent = title;
    errorElement.appendChild(titleElement);

    const messageElement = document.createElement("p");
    messageElement.textContent = message;
    errorElement.appendChild(messageElement);

    const container =
      document.getElementById("armo-makeup-view") || document.body;
    container.innerHTML = "";
    container.appendChild(errorElement);
  }

  showLoading() {
    if (this.loadingElement) {
      this.loadingElement.style.display = "flex";
    }
  }

  hideLoading() {
    if (this.loadingElement) {
      this.loadingElement.style.display = "none";
    }
  }

  changeMakeupType(type) {
    if (!this.featureManager.isFeatureEnabled(type)) {
      toast.error(`ویژگی ${type} برای این کاربر فعال نیست`);
      console.warn(`ویژگی ${type} برای این کاربر فعال نیست`);
      return;
    }

    if (Object.values(Makeup.MAKEUP_TYPES).includes(type)) {
      this.currentMakeupType = type;
      // تنظیم الگوی پیش‌فرض برای نوع جدید
      const defaultPattern = this.featureManager.getAllowedPatterns(type)[0];
      if (defaultPattern) {
        this.setMakeupPattern(type, defaultPattern);
      }
    } else {
      console.error(
        `نوع آرایش نامعتبر است. از یکی از این موارد استفاده کنید: ${Object.values(
          Makeup.MAKEUP_TYPES
        ).join(", ")}`
      );
    }
  }

  changeMakeupColor(type, color, code = null) {
    if (!this.currentMakeupType) {
      console.warn("نوع آرایش مشخص نشده است");
      return;
    }

    if (this.options.mode === "camera") {
      changeMakeupColor(type || this.currentMakeupType, color);
    } else if (this.options.mode === "image" && this.imageManager) {
      this.imageManager.updateMakeup(
        type || this.currentMakeupType,
        color,
        this.options.pattern,
        this.options.transparency
      );
    }

    // اگر code ارسال شده، مستقیماً از آن استفاده می‌کنیم
    if (code) {
      this._sendAnalytics(type || this.currentMakeupType, color, code);
      return;
    }

    // اگر code ارسال نشده و options.colors موجود است
    if (this.options.colors && Array.isArray(this.options.colors)) {
      const normalizedInputColor = color.replace("#", "").toLowerCase();
      const colorItem = this.options.colors.find(
        (item) =>
          item.color.replace("#", "").toLowerCase() === normalizedInputColor
      );

      if (colorItem?.code) {
        this._sendAnalytics(
          type || this.currentMakeupType,
          color,
          colorItem.code
        );
      }
    }
  }

  setMakeupPattern(type, pattern) {
    const allowedPatterns = this.featureManager.getAllowedPatterns(type);
    if (!allowedPatterns.includes(pattern)) {
      toast.error(`الگوی ${pattern} برای ${type} مجاز نیست`);
      return;
    }

    this.options.pattern = pattern;

    if (this.options.mode === "camera") {
      setMakeupPattern(type, pattern);
    } else if (this.options.mode === "image" && this.imageManager) {
      this.imageManager.updateMakeup(
        type || this.currentMakeupType,
        color,
        pattern,
        this.options.transparency
      );
    }
  }

  setMakeupTransparency(type, transparency) {
    if (transparency >= 0 && transparency <= 1) {
      this.options.transparency = transparency;

      if (this.options.mode === "camera") {
        setMakeupTransparency(type, transparency);
      } else if (this.options.mode === "image" && this.imageManager) {
        this.imageManager.updateMakeup(
          type || this.currentMakeupType,
          this.options.colors[0]?.color, // استفاده از اولین رنگ موجود
          this.options.pattern,
          transparency
        );
      }
    } else {
      console.error("شفافیت باید بین 0 و 1 باشد");
    }
  }

  getStatus() {
    return this.status;
  }

  getTechnicalInfo() {
    return {
      version: Makeup.version,
      status: this.status,
      currentMakeupType: this.currentMakeupType,
      isPremium: this.isPremium,
      enabledFeatures: this.featureManager.getEnabledFeatures(),
      resolution: this.videoElement
        ? {
            width: this.videoElement.videoWidth,
            height: this.videoElement.videoHeight,
          }
        : null,
      browser: {
        userAgent: navigator.userAgent,
        isMobile: isMobileDevice(),
      },
    };
  }

  getAvailableFeatures() {
    return this.featureManager.getEnabledFeatures();
  }

  getAvailablePatterns(feature) {
    return this.featureManager.getAllowedPatterns(feature);
  }

  isFeatureEnabled(feature) {
    return this.featureManager.isFeatureEnabled(feature);
  }
}

export default Makeup;
