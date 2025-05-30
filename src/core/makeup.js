// src/core/makeup.js

import "core-js/stable";
import "regenerator-runtime/runtime";

// Core methods
import {
  cleanup,
  createDOMElements,
  ComparisonManager,
  FeatureManager,
  RenderManager,
  ProductManager,
} from "./methods";

// Updated module imports
import { ApiHandler } from "./modules/api-handler";
import { LightDetector } from "./modules/light-detector";
import { UiManager } from "./modules/ui-manager";
import { ModeManager } from "./modules/mode-manager";
import { ProductLoader } from "./modules/product-loader";

// UI components
import { initColorPicker, initCameraControls, initPatternPicker } from "../ui";

// Styles
import "../ui/styles/index.css";

/**
 * Main Makeup class for virtual makeup SDK
 */
class Makeup {
  static version = "v3";

  static STATUS = {
    INITIALIZING: "initializing",
    LOADING: "loading",
    READY: "ready",
    ERROR: "error",
    PAUSED: "paused",
    CLEANUP: "cleanup",
  };

  /**
   * Constructor for Makeup class
   * @param {Object} options - Configuration options
   */
  constructor(options) {
    // Run cleanup before starting
    cleanup();

    // Initial settings
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

    // Initial state
    this.status = Makeup.STATUS.INITIALIZING;
    this.currentMakeupType = null;

    // Check token
    if (!window.Makeup.token) {
      console.error(
        "Token must be set globally before using the Makeup class."
      );
      throw new Error("Token is not set.");
    }

    this.token = window.Makeup.token;

    // Start initialization
    this._initialize();
  }

  /**
   * Initialize the SDK
   * @private
   */
  async _initialize() {
    try {
      // Create DOM elements
      const elements = createDOMElements(this.options, false);
      this.videoElement = elements.videoElement;
      this.canvasElement = elements.canvasElement;
      this.loadingElement = elements.loadingElement;

      // Show loading state
      this.status = Makeup.STATUS.LOADING;

      // Create managers
      this.uiManager = new UiManager({ loadingElement: this.loadingElement });
      this.uiManager.showLoading();

      this.apiHandler = new ApiHandler(this.token);

      // Get token and product info
      let validationResult;

      if (this.options.productUid) {
        validationResult = await this.apiHandler.loadProductAndTokenInfo(
          this.options.productUid
        );
      } else {
        validationResult = await this.apiHandler.loadProductAndTokenInfo();
      }

      // Check validation result
      if (!validationResult.isValid) {
        throw new Error(validationResult.message || "Invalid token.");
      }

      // Store important info
      this.isPremium = validationResult.isPremium;
      this.tokenInfo = validationResult.tokenInfo;
      this.mediaFeatures = validationResult.mediaFeatures;

      // Create managers with the validated data
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

      // اضافه کردن productManager به ModeManager
      this.modeManager = new ModeManager(
        this.options,
        { videoElement: this.videoElement, canvasElement: this.canvasElement },
        {
          featureManager: this.featureManager,
          uiManager: this.uiManager,
          productManager: this.productManager,
          comparisonManager: this.comparisonManager,
        }
      );

      this.productLoader = new ProductLoader({
        apiHandler: this.apiHandler,
        productManager: this.productManager,
        featureManager: this.featureManager,
        uiManager: this.uiManager,
      });

      // Set current makeup type
      this._setupMakeupType(validationResult.productInfo);

      // Set callback for faceMesh
      this.modeManager.setOnResultsCallback(this._onResults.bind(this));

      // Initialize UI
      this._initializeUI();

      // اعمال مقادیر پیش‌فرض محصول
      this._applyProductDefaults();

      // Initialize appropriate mode
      await this._initializeMode();

      // Set final state
      this.status = Makeup.STATUS.READY;
      this.uiManager.hideLoading();

      // Call callback
      if (typeof this.options.onReady === "function") {
        this.options.onReady();
      }
    } catch (error) {
      this.status = Makeup.STATUS.ERROR;
      console.error(`Initialization error: ${error.message}`);

      if (this.uiManager) {
        this.uiManager.showErrorMessage("Initialization Error", error.message);
      }

      if (typeof this.options.onError === "function") {
        this.options.onError(error);
      }
    }
  }

  /**
   * Set makeup type
   * @param {Object} productInfo - Product information
   * @private
   */
  _setupMakeupType(productInfo) {
    if (productInfo) {
      // Set makeup type based on product type
      this.currentMakeupType = this.productManager.getProductType();
    } else if (this.options.face) {
      // Set makeup type from options
      if (this.featureManager.isFeatureEnabled(this.options.face)) {
        this.currentMakeupType = this.options.face;
      } else {
        // Use first allowed type
        const enabledFeatures = this.featureManager.getEnabledFeatures();
        this.currentMakeupType = enabledFeatures[0] || null;
      }
    } else {
      // Use first allowed type
      const enabledFeatures = this.featureManager.getEnabledFeatures();
      this.currentMakeupType = enabledFeatures[0] || null;
    }
  }

  /**
   * اعمال مقادیر پیش‌فرض محصول
   * @private
   */
  _applyProductDefaults() {
    if (this.currentMakeupType && this.modeManager) {
      // اعمال رنگ و pattern پیش‌فرض
      this.modeManager.applyProductDefaults(this.currentMakeupType);
    }
  }

  /**
   * Initialize appropriate mode
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
   * Initialize UI
   * @private
   */
  _initializeUI() {
    // اضافه کردن DOM elements برای pattern picker
    this._createPatternPickerElement();

    // Initialize color picker
    if (this.options.showColorPicker) {
      let colors = [];

      if (this.productManager && this.productManager.hasValidProduct()) {
        colors = this.productManager.getColors().map((color) => ({
          code: color.code,
          color: color.color,
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

    // Initialize pattern picker
    this._initializePatternPicker();

    // Initialize camera controls
    initCameraControls(this.mediaFeatures);

    // ✅ اضافه کردن Event listener برای camera controls
    this._setupControlEventListeners();
  }

  /**
   * تنظیم event listener های کنترل دوربین
   * @private
   */
  _setupControlEventListeners() {
    // Bind کردن handler برای استفاده در cleanup
    this._boundControlHandler = (event) => {
      this._handleControlClick(event.detail.control, event.detail.active);
    };

    // Event listener برای دکمه‌های کنترل دوربین
    document.addEventListener("armoControlClick", this._boundControlHandler);
  }

  /**
   * مدیریت کلیک روی دکمه‌های کنترل
   * @param {string} control - نوع کنترل (compare, image, settings)
   * @param {boolean} isActive - وضعیت فعال/غیرفعال
   * @private
   */
  async _handleControlClick(control, isActive) {
    try {
      if (control === "compare") {
        // مدیریت دکمه before/after comparison
        await this._handleCompareControl(isActive);
      } else if (control === "image") {
        // مدیریت دکمه image upload
        await this._handleImageControl(isActive);
      } else if (control === "settings") {
        // مدیریت دکمه settings (در آینده)
        await this._handleSettingsControl(isActive);
      }
    } catch (error) {
      console.error(`Error handling control ${control}:`, error);
      this.uiManager.showErrorMessage(
        "خطا در کنترل",
        `مشکلی در ${control} رخ داده است`
      );
    }
  }

  /**
   * مدیریت دکمه comparison (before/after)
   * @param {boolean} isActive - وضعیت فعال/غیرفعال
   * @private
   */
  async _handleCompareControl(isActive) {
    if (!this.comparisonManager) {
      this.uiManager.showErrorMessage("خطا", "قابلیت مقایسه در دسترس نیست");
      return;
    }

    if (isActive) {
      // فعال کردن حالت مقایسه
      this.comparisonManager.enable();
      this.uiManager.showInfoMessage(
        "حالت مقایسه فعال شد. خط را حرکت دهید",
        3000
      );
    } else {
      // غیرفعال کردن حالت مقایسه
      this.comparisonManager.disable();
      this.uiManager.showInfoMessage("حالت مقایسه غیرفعال شد", 2000);
    }
  }

  /**
   * مدیریت دکمه image upload
   * @param {boolean} isActive - وضعیت فعال/غیرفعال
   * @private
   */
  async _handleImageControl(isActive) {
    if (isActive) {
      // تغییر به حالت image
      const success = await this.switchMode("image");
      if (!success) {
        this.uiManager.showErrorMessage(
          "خطا",
          "مشکلی در تغییر به حالت تصویر رخ داد"
        );
        // غیرفعال کردن دکمه در صورت خطا
        this._deactivateControlButton("image");
      }
    } else {
      // برگشت به حالت camera
      const success = await this.switchMode("camera");
      if (!success) {
        this.uiManager.showErrorMessage(
          "خطا",
          "مشکلی در برگشت به حالت دوربین رخ داد"
        );
      }
    }
  }

  /**
   * مدیریت دکمه settings (برای آینده)
   * @param {boolean} isActive - وضعیت فعال/غیرفعال
   * @private
   */
  async _handleSettingsControl(isActive) {
    if (isActive) {
      // فعلاً فقط پیام نمایش می‌دهیم
      this.uiManager.showInfoMessage(
        "تنظیمات در نسخه‌های آینده اضافه خواهد شد",
        3000
      );
      // غیرفعال کردن دکمه چون هنوز پیاده‌سازی نشده
      this._deactivateControlButton("settings");
    }
  }

  /**
   * غیرفعال کردن دستی یک دکمه کنترل
   * @param {string} controlName - نام کنترل
   * @private
   */
  _deactivateControlButton(controlName) {
    const button = document.querySelector(`[data-control="${controlName}"]`);
    if (button) {
      button.classList.remove("active");
    }
  }

  /**
   * ایجاد element برای pattern picker
   * @private
   */
  _createPatternPickerElement() {
    const container = document.querySelector(".armo-sdk-container");
    if (!container) return;

    // بررسی اینکه آیا element قبلاً وجود دارد
    let patternPicker = document.getElementById("armo-sdk-pattern-picker");

    if (!patternPicker) {
      patternPicker = document.createElement("div");
      patternPicker.id = "armo-sdk-pattern-picker";
      patternPicker.className = "armo-sdk-pattern-picker";
      container.appendChild(patternPicker);
    }
  }

  /**
   * Initialize pattern picker
   * @private
   */
  _initializePatternPicker() {
    if (!this.productManager || !this.productManager.hasValidProduct()) {
      return;
    }

    const patterns = this.productManager.getPatterns();
    const currentPattern = this.productManager.getCurrentPattern();

    if (patterns.length > 1) {
      initPatternPicker(
        (pattern) => this.changeMakeupPattern(this.currentMakeupType, pattern),
        patterns,
        "armo-sdk-pattern-picker",
        currentPattern
      );
    }
  }

  /**
   * Process face detection results
   * @param {Object} landmarks - Face landmarks
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
      console.error(`Error processing results: ${error.message}`);
      this.uiManager.showErrorMessage(
        "Image Processing Error",
        "An error occurred while processing the image."
      );
    }
  }

  // --- Public methods ---

  /**
   * Change makeup type
   * @param {string} type - Makeup type
   * @returns {boolean} Success status
   */
  changeMakeupType(type) {
    if (!this.featureManager.isFeatureEnabled(type)) {
      this.uiManager.showErrorMessage(
        "Limited Access",
        `Feature ${type} is not enabled for this user`
      );
      return false;
    }

    this.currentMakeupType = type;

    // Set default pattern
    const allowedPatterns = this.featureManager.getAllowedPatterns(type);
    if (allowedPatterns.length > 0) {
      this.setMakeupPattern(type, allowedPatterns[0]);
    }

    return true;
  }

  /**
   * Change makeup color
   * @param {string} type - Makeup type
   * @param {string} color - Color
   * @param {string} code - Color code (optional)
   * @returns {boolean} Success status
   */
  changeMakeupColor(type, color, code = null) {
    const result = this.modeManager.changeMakeupColor(
      type || this.currentMakeupType,
      color,
      code
    );

    // بروزرسانی ProductManager اگر رنگ از محصول فعلی باشد
    if (result && this.productManager) {
      this.productManager.setCurrentColor(color);
    }

    return result;
  }

  /**
   * Set makeup pattern
   * @param {string} type - Makeup type
   * @param {string} pattern - Pattern
   * @returns {boolean} Success status
   */
  setMakeupPattern(type, pattern) {
    const result = this.modeManager.changeMakeupPattern(
      type || this.currentMakeupType,
      pattern
    );

    // بروزرسانی ProductManager
    if (result && this.productManager) {
      this.productManager.setCurrentPattern(pattern);
    }

    return result;
  }

  /**
   * تغییر pattern آرایش (alias برای setMakeupPattern)
   * @param {string} type - Makeup type
   * @param {string} pattern - Pattern
   * @returns {boolean} Success status
   */
  changeMakeupPattern(type, pattern) {
    return this.setMakeupPattern(type, pattern);
  }

  /**
   * Set makeup transparency
   * @param {string} type - Makeup type
   * @param {number} transparency - Transparency (0-1)
   * @returns {boolean} Success status
   */
  setMakeupTransparency(type, transparency) {
    // این متد باید در ModeManager پیاده‌سازی بشه
    // فعلاً placeholder
    this.options.transparency = transparency;
    return true;
  }

  /**
   * Load product by UID
   * @param {string} productUid - Product UID
   * @returns {Promise<Object|null>} Product info or null if error
   */
  async loadProduct(productUid) {
    const productInfo = await this.productLoader.loadProduct(productUid);

    if (productInfo) {
      // بروزرسانی UI بعد از لود محصول جدید
      this._setupMakeupType(productInfo);
      this._initializeUI();
      this._applyProductDefaults();
    }

    return productInfo;
  }

  /**
   * Switch SDK mode (camera/image)
   * @param {string} newMode - New mode
   * @returns {Promise<boolean>} Result of mode change
   */
  async switchMode(newMode) {
    return await this.modeManager.switchMode(newMode);
  }

  /**
   * Get current SDK status
   * @returns {string} Current status
   */
  getStatus() {
    return this.status;
  }

  /**
   * Get SDK technical info
   * @returns {Object} Technical info
   */
  getTechnicalInfo() {
    return {
      version: Makeup.version,
      status: this.status,
      currentMakeupType: this.currentMakeupType,
      currentColor: this.productManager?.getCurrentColorHex(),
      currentPattern: this.productManager?.getCurrentPattern(),
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
   * Get allowed features
   * @returns {Array} Array of allowed features
   */
  getAvailableFeatures() {
    return this.featureManager?.getEnabledFeatures() || [];
  }

  /**
   * Get allowed patterns for a feature
   * @param {string} feature - Feature name
   * @returns {Array} Array of allowed patterns
   */
  getAvailablePatterns(feature) {
    return this.featureManager?.getAllowedPatterns(feature) || [];
  }

  /**
   * Check if feature is enabled
   * @param {string} feature - Feature name
   * @returns {boolean} Check result
   */
  isFeatureEnabled(feature) {
    return this.featureManager?.isFeatureEnabled(feature) || false;
  }

  /**
   * پاکسازی event listener ها
   * @private
   */
  _cleanupEventListeners() {
    // حذف event listener های مربوط به controls
    if (this._boundControlHandler) {
      document.removeEventListener(
        "armoControlClick",
        this._boundControlHandler
      );
    }
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.status = Makeup.STATUS.CLEANUP;

    // پاکسازی event listeners
    this._cleanupEventListeners();

    if (this.modeManager) this.modeManager.cleanup();
    if (this.lightDetector) this.lightDetector.cleanup();
    if (this.uiManager) this.uiManager.cleanup();

    cleanup();
  }
}

export default Makeup;
