// src/core/makeup.js

import "core-js/stable";
import "regenerator-runtime/runtime";

// ماژول‌های اصلی از methods
import {
  cleanup,
  createDOMElements,
  ComparisonManager,
  FeatureManager,
  RenderManager,
  ProductManager,
} from "./methods";

// ماژول‌های جدید از modules
import { ApiHandler } from "./modules/api-handler";
import { LightDetector } from "./modules/light-detector";
import { UiManager } from "./modules/ui-manager";
import { ModeManager } from "./modules/mode-manager";
import { ProductLoader } from "./modules/product-loader";

// رابط کاربری
import { initColorPicker, initCameraControls } from "../ui";

// استایل‌ها
import "../ui/styles/index.css";

/**
 * کلاس اصلی Makeup برای مدیریت SDK آرایش مجازی
 */
class Makeup {
  static version = "v2";

  static STATUS = {
    INITIALIZING: "initializing",
    LOADING: "loading",
    READY: "ready",
    ERROR: "error",
    PAUSED: "paused",
    CLEANUP: "cleanup",
  };

  /**
   * سازنده کلاس Makeup
   * @param {Object} options - گزینه‌های پیکربندی
   */
  constructor(options) {
    // قبل از شروع، cleanup را فراخوانی می‌کنیم
    cleanup();

    // تنظیمات اولیه
    this.options = {
      showColorPicker: true,
      colors: [],
      pattern: null,
      face: null,
      transparency: 0.5,
      mode: "camera",
      productUid: null,
      onReady: () => {},
      onError: () => {},
      ...options,
    };

    // وضعیت اولیه
    this.status = Makeup.STATUS.INITIALIZING;
    this.currentMakeupType = null;

    // بررسی توکن
    if (!window.Makeup.token) {
      console.error(
        "توکن باید قبل از استفاده از کلاس Makeup به صورت جهانی تنظیم شود."
      );
      throw new Error("توکن تنظیم نشده است.");
    }

    this.token = window.Makeup.token;

    // شروع راه‌اندازی
    this._initialize();
  }

  /**
   * راه‌اندازی SDK
   * @private
   */
  async _initialize() {
    try {
      // ایجاد المنت‌های DOM
      const elements = createDOMElements(this.options, false);
      this.videoElement = elements.videoElement;
      this.canvasElement = elements.canvasElement;
      this.loadingElement = elements.loadingElement;

      // نمایش حالت بارگذاری
      this.status = Makeup.STATUS.LOADING;

      // ایجاد مدیرهای مختلف
      this.uiManager = new UiManager({ loadingElement: this.loadingElement });
      this.uiManager.showLoading();

      this.apiHandler = new ApiHandler(this.token);

      // دریافت اطلاعات توکن و محصول
      let validationResult;

      if (this.options.productUid) {
        validationResult = await this.apiHandler.loadProductAndTokenInfo(
          this.options.productUid
        );
      } else {
        validationResult = await this.apiHandler.validateToken();
      }

      // بررسی نتیجه اعتبارسنجی
      if (!validationResult.isValid) {
        throw new Error(validationResult.message || "توکن نامعتبر است.");
      }

      // ذخیره اطلاعات مهم
      this.isPremium = validationResult.isPremium;
      this.tokenInfo = validationResult.tokenInfo;
      this.mediaFeatures = validationResult.mediaFeatures;

      // ایجاد مدیرها
      this.featureManager = new FeatureManager(validationResult.tokenInfo);
      this.productManager = new ProductManager(validationResult.productInfo);

      if (validationResult.productInfo) {
        this.featureManager.setProductInfo(validationResult.productInfo);
      }

      this.comparisonManager = new ComparisonManager(
        document.querySelector(".armo-sdk-container"),
        this.canvasElement
      );

      this.renderManager = new RenderManager(
        this.videoElement,
        this.canvasElement,
        this.featureManager,
        this.comparisonManager
      );

      this.lightDetector = new LightDetector(
        this.videoElement,
        () => this.uiManager.showLightWarning(),
        () => this.uiManager.hideLightWarning()
      );

      this.modeManager = new ModeManager(
        this.options,
        { videoElement: this.videoElement, canvasElement: this.canvasElement },
        { featureManager: this.featureManager, uiManager: this.uiManager }
      );

      this.productLoader = new ProductLoader({
        apiHandler: this.apiHandler,
        productManager: this.productManager,
        featureManager: this.featureManager,
        uiManager: this.uiManager,
      });

      // تنظیم نوع آرایش فعلی
      this._setupMakeupType(validationResult.productInfo);

      // تنظیم callback برای faceMesh
      this.modeManager.setOnResultsCallback(this._onResults.bind(this));

      // راه‌اندازی رابط کاربری
      this._initializeUI();

      // راه‌اندازی حالت مناسب
      await this._initializeMode();

      // تنظیم وضعیت نهایی
      this.status = Makeup.STATUS.READY;
      this.uiManager.hideLoading();

      // فراخوانی callback
      if (typeof this.options.onReady === "function") {
        this.options.onReady();
      }
    } catch (error) {
      this.status = Makeup.STATUS.ERROR;
      console.error(`خطا در راه‌اندازی: ${error.message}`);

      if (this.uiManager) {
        this.uiManager.showErrorMessage("خطا در راه‌اندازی", error.message);
      }

      if (typeof this.options.onError === "function") {
        this.options.onError(error);
      }
    }
  }

  /**
   * تنظیم نوع آرایش
   * @param {Object} productInfo - اطلاعات محصول
   * @private
   */
  _setupMakeupType(productInfo) {
    if (productInfo) {
      // تنظیم نوع آرایش بر اساس نوع محصول
      this.currentMakeupType = this.productManager.getProductType();
    } else if (this.options.face) {
      // تنظیم نوع آرایش از گزینه‌ها
      if (this.featureManager.isFeatureEnabled(this.options.face)) {
        this.currentMakeupType = this.options.face;
      } else {
        // استفاده از اولین نوع مجاز
        const enabledFeatures = this.featureManager.getEnabledFeatures();
        this.currentMakeupType = enabledFeatures[0] || null;
      }
    } else {
      // استفاده از اولین نوع مجاز
      const enabledFeatures = this.featureManager.getEnabledFeatures();
      this.currentMakeupType = enabledFeatures[0] || null;
    }
  }

  /**
   * راه‌اندازی حالت مناسب
   * @private
   */
  async _initializeMode() {
    if (this.options.mode === "camera") {
      await this.modeManager.initCamera();
      await this.lightDetector.initialize();
    } else if (this.options.mode === "image") {
      await this.modeManager.initImageMode();
    }
  }

  /**
   * راه‌اندازی رابط کاربری
   * @private
   */
  _initializeUI() {
    // راه‌اندازی رابط انتخاب رنگ
    if (this.options.showColorPicker) {
      let colors = [];

      if (this.productManager && this.productManager.hasValidProduct()) {
        colors = this.productManager.getColors().map((color) => ({
          code: color.name,
          color: color.hexCode,
          url: color.imageUrl,
          feature: this.productManager.getProductType(),
        }));
      } else if (this.options.colors.length > 0) {
        colors = this.options.colors;
      }

      if (colors.length > 0) {
        initColorPicker(
          (color) => this.changeMakeupColor(this.currentMakeupType, color),
          colors,
          "armo-sdk-color-picker",
          this.featureManager
        );
      }
    }

    // راه‌اندازی کنترل‌های دوربین
    initCameraControls(this.mediaFeatures);
  }

  /**
   * پردازش نتایج تشخیص چهره
   * @param {Object} landmarks - نقاط مرزی چهره
   * @private
   */
  _onResults(landmarks) {
    try {
      if (landmarks) {
        const success = this.renderManager.render(
          landmarks,
          this.currentMakeupType
        );

        if (success) {
          this.uiManager.hideLoading();
          this.lightDetector.checkLightConditions();
        }
      }
    } catch (error) {
      console.error(`خطا در پردازش نتایج: ${error.message}`);
      this.uiManager.showErrorMessage(
        "خطا در پردازش تصویر",
        "مشکلی در پردازش تصویر رخ داده است."
      );
    }
  }

  // --- متدهای عمومی ---

  /**
   * تغییر نوع آرایش
   * @param {string} type - نوع آرایش
   * @returns {boolean} موفقیت یا عدم موفقیت عملیات
   */
  changeMakeupType(type) {
    if (!this.featureManager.isFeatureEnabled(type)) {
      this.uiManager.showErrorMessage(
        "دسترسی محدود",
        `ویژگی ${type} برای این کاربر فعال نیست`
      );
      return false;
    }

    this.currentMakeupType = type;

    // تنظیم الگوی پیش‌فرض
    const allowedPatterns = this.featureManager.getAllowedPatterns(type);
    if (allowedPatterns.length > 0) {
      this.setMakeupPattern(type, allowedPatterns[0]);
    }

    return true;
  }

  /**
   * تغییر رنگ آرایش
   * @param {string} type - نوع آرایش
   * @param {string} color - رنگ
   * @param {string} code - کد رنگ (اختیاری)
   * @returns {boolean} موفقیت یا عدم موفقیت عملیات
   */
  changeMakeupColor(type, color, code = null) {
    return this.modeManager.changeMakeupColor(
      type || this.currentMakeupType,
      color,
      code
    );
  }

  /**
   * تنظیم الگوی آرایش
   * @param {string} type - نوع آرایش
   * @param {string} pattern - الگو
   * @returns {boolean} موفقیت یا عدم موفقیت عملیات
   */
  setMakeupPattern(type, pattern) {
    return this.modeManager.setMakeupPattern(
      type || this.currentMakeupType,
      pattern
    );
  }

  /**
   * تنظیم شفافیت آرایش
   * @param {string} type - نوع آرایش
   * @param {number} transparency - شفافیت (0-1)
   * @returns {boolean} موفقیت یا عدم موفقیت عملیات
   */
  setMakeupTransparency(type, transparency) {
    return this.modeManager.setMakeupTransparency(
      type || this.currentMakeupType,
      transparency
    );
  }

  /**
   * بارگذاری محصول با شناسه
   * @param {string} productUid - شناسه محصول
   * @returns {Promise<Object|null>} اطلاعات محصول یا null در صورت خطا
   */
  async loadProduct(productUid) {
    return await this.productLoader.loadProduct(productUid);
  }

  /**
   * تغییر حالت SDK (دوربین/تصویر)
   * @param {string} newMode - حالت جدید
   * @returns {Promise<boolean>} نتیجه تغییر حالت
   */
  async switchMode(newMode) {
    return await this.modeManager.switchMode(newMode);
  }

  /**
   * دریافت وضعیت فعلی SDK
   * @returns {string} وضعیت فعلی
   */
  getStatus() {
    return this.status;
  }

  /**
   * دریافت اطلاعات فنی SDK
   * @returns {Object} اطلاعات فنی
   */
  getTechnicalInfo() {
    return {
      version: Makeup.version,
      status: this.status,
      currentMakeupType: this.currentMakeupType,
      isPremium: this.isPremium,
      enabledFeatures: this.featureManager?.getEnabledFeatures() || [],
      resolution: this.videoElement
        ? {
            width: this.videoElement.videoWidth,
            height: this.videoElement.videoHeight,
          }
        : null,
      browser: {
        userAgent: navigator.userAgent,
        isMobile:
          typeof navigator !== "undefined" &&
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
          ),
      },
    };
  }

  /**
   * دریافت ویژگی‌های مجاز
   * @returns {Array} آرایه‌ای از ویژگی‌های مجاز
   */
  getAvailableFeatures() {
    return this.featureManager?.getEnabledFeatures() || [];
  }

  /**
   * دریافت الگوهای مجاز برای یک ویژگی
   * @param {string} feature - نام ویژگی
   * @returns {Array} آرایه‌ای از الگوهای مجاز
   */
  getAvailablePatterns(feature) {
    return this.featureManager?.getAllowedPatterns(feature) || [];
  }

  /**
   * بررسی دسترسی به ویژگی
   * @param {string} feature - نام ویژگی
   * @returns {boolean} نتیجه بررسی
   */
  isFeatureEnabled(feature) {
    return this.featureManager?.isFeatureEnabled(feature) || false;
  }

  /**
   * پاکسازی منابع
   */
  cleanup() {
    this.status = Makeup.STATUS.CLEANUP;

    if (this.modeManager) this.modeManager.cleanup();
    if (this.lightDetector) this.lightDetector.cleanup();
    if (this.uiManager) this.uiManager.cleanup();

    cleanup();
  }
}

export default Makeup;
