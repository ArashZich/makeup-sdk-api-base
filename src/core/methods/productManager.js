// src/core/methods/productManager.js

/**
 * کلاس مدیریت محصولات آرایشی
 */
export class ProductManager {
  /**
   * سازنده کلاس ProductManager
   * @param {Object} productInfo - اطلاعات محصول دریافتی از API
   */
  constructor(productInfo = null) {
    this.productInfo = productInfo;
    this.currentColor = null;
    this.currentPattern = null;

    // اگر productInfo از همان ابتدا پاس داده شده، تنظیمات اولیه انجام بده
    if (productInfo) {
      this._setDefaults();
    }
  }

  /**
   * تنظیم اطلاعات محصول
   * @param {Object} productInfo - اطلاعات محصول
   */
  setProductInfo(productInfo) {
    this.productInfo = productInfo;
    this._setDefaults();
    return this;
  }

  /**
   * تنظیم مقادیر پیش‌فرض بر اساس اطلاعات محصول
   * @private
   */
  _setDefaults() {
    // تنظیم خودکار اولین رنگ به عنوان مقدار پیش‌فرض
    if (this.productInfo?.colors?.length > 0) {
      this.currentColor = this.productInfo.colors[0];
    }

    // تنظیم خودکار اولین پترن به عنوان مقدار پیش‌فرض (lowercase)
    if (this.productInfo?.patterns?.length > 0) {
      this.currentPattern = this.productInfo.patterns[0].code.toLowerCase();
    }
  }

  /**
   * دریافت نوع محصول
   * @returns {string|null} نوع محصول
   */
  getProductType() {
    return this.productInfo?.type || null;
  }

  /**
   * دریافت لیست رنگ‌های محصول
   * @returns {Array} آرایه‌ای از رنگ‌های محصول
   */
  getColors() {
    return this.productInfo?.colors || [];
  }

  /**
   * دریافت لیست پترن‌های محصول
   * @returns {Array} آرایه‌ای از پترن‌های محصول
   */
  getPatterns() {
    return this.productInfo?.patterns || [];
  }

  /**
   * تنظیم رنگ فعلی
   * @param {string} colorCode - کد رنگ یا هکس کد
   * @returns {Object|null} آبجکت رنگ انتخاب شده یا null اگر رنگ یافت نشد
   */
  setCurrentColor(colorCode) {
    if (!this.productInfo?.colors) return null;

    // جستجو بر اساس کد یا هکس کد
    const color = this.productInfo.colors.find(
      (c) => c.code === colorCode || c.color === colorCode
    );

    if (color) {
      this.currentColor = color;
      return color;
    }

    return null;
  }

  /**
   * دریافت رنگ فعلی
   * @returns {Object|null} آبجکت رنگ فعلی یا null
   */
  getCurrentColor() {
    return this.currentColor;
  }

  /**
   * دریافت کد هگزادسیمال رنگ فعلی
   * @returns {string|null} کد هگزادسیمال رنگ فعلی یا null
   */
  getCurrentColorHex() {
    return this.currentColor?.color || null;
  }

  /**
   * تنظیم پترن فعلی
   * @param {string} patternCode - کد پترن (خودکار lowercase می‌شود)
   * @returns {Object|null} آبجکت پترن انتخاب شده یا null اگر پترن یافت نشد
   */
  setCurrentPattern(patternCode) {
    if (!this.productInfo?.patterns) return null;

    // تبدیل به lowercase برای جستجو
    const lowerPatternCode = patternCode.toLowerCase();

    const pattern = this.productInfo.patterns.find(
      (p) => p.code.toLowerCase() === lowerPatternCode
    );

    if (pattern) {
      this.currentPattern = pattern.code.toLowerCase();
      return pattern;
    }

    return null;
  }

  /**
   * دریافت پترن فعلی
   * @returns {string|null} کد پترن فعلی (lowercase) یا null
   */
  getCurrentPattern() {
    return this.currentPattern;
  }

  /**
   * دریافت اطلاعات کامل پترن فعلی
   * @returns {Object|null} آبجکت پترن فعلی یا null
   */
  getCurrentPatternInfo() {
    if (!this.currentPattern || !this.productInfo?.patterns) return null;

    return this.productInfo.patterns.find(
      (p) => p.code.toLowerCase() === this.currentPattern
    );
  }

  /**
   * دریافت تصویر پترن فعلی
   * @returns {string|null} آدرس تصویر پترن فعلی یا null
   */
  getCurrentPatternImage() {
    const patternInfo = this.getCurrentPatternInfo();
    return patternInfo?.imageUrl || null;
  }

  /**
   * بررسی اینکه آیا محصول دارای پترن‌های متعدد است
   * @returns {boolean} true اگر بیش از یک پترن وجود دارد
   */
  hasMultiplePatterns() {
    return this.productInfo?.patterns?.length > 1;
  }

  /**
   * بررسی اینکه آیا محصول فعلی دارای اطلاعات معتبر است
   * @returns {boolean} نتیجه بررسی
   */
  hasValidProduct() {
    return !!this.productInfo && !!this.productInfo.type;
  }

  /**
   * دریافت اطلاعات کامل محصول
   * @returns {Object|null} اطلاعات کامل محصول یا null
   */
  getProductInfo() {
    return this.productInfo;
  }

  /**
   * تبدیل اطلاعات محصول به فرمت مناسب برای SDK
   * @returns {Object} اطلاعات محصول با فرمت مناسب برای SDK
   */
  getProductInfoForSDK() {
    if (!this.productInfo) return null;

    return {
      type: this.productInfo.type,
      color: this.getCurrentColorHex(),
      pattern: this.getCurrentPattern(),
      colors: this.getColors().map((color) => ({
        code: color.code,
        color: color.color,
        url: color.imageUrl,
      })),
      patterns: this.getPatterns().map((pattern) => ({
        name: pattern.name,
        code: pattern.code.toLowerCase(),
        imageUrl: pattern.imageUrl,
      })),
    };
  }
}

export default ProductManager;
