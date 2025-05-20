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
  }

  /**
   * تنظیم اطلاعات محصول
   * @param {Object} productInfo - اطلاعات محصول
   */
  setProductInfo(productInfo) {
    this.productInfo = productInfo;

    // تنظیم خودکار اولین رنگ و پترن به عنوان مقادیر پیش‌فرض
    if (productInfo?.colors?.length > 0) {
      this.currentColor = productInfo.colors[0];
    }

    if (productInfo?.patterns?.length > 0) {
      this.currentPattern = productInfo.patterns[0].code;
    }

    return this;
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
   * @param {string} colorCode - کد رنگ یا کد محصول رنگ
   * @returns {Object|null} آبجکت رنگ انتخاب شده یا null اگر رنگ یافت نشد
   */
  setCurrentColor(colorCode) {
    if (!this.productInfo?.colors) return null;

    // جستجو بر اساس کد یا هکس کد
    const color = this.productInfo.colors.find(
      (c) => c.name === colorCode || c.hexCode === colorCode
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
    return this.currentColor?.hexCode || null;
  }

  /**
   * تنظیم پترن فعلی
   * @param {string} patternCode - کد پترن
   * @returns {Object|null} آبجکت پترن انتخاب شده یا null اگر پترن یافت نشد
   */
  setCurrentPattern(patternCode) {
    if (!this.productInfo?.patterns) return null;

    const pattern = this.productInfo.patterns.find(
      (p) => p.code === patternCode
    );

    if (pattern) {
      this.currentPattern = pattern.code;
      return pattern;
    }

    return null;
  }

  /**
   * دریافت پترن فعلی
   * @returns {string|null} کد پترن فعلی یا null
   */
  getCurrentPattern() {
    return this.currentPattern;
  }

  /**
   * دریافت تصویر پترن فعلی
   * @returns {string|null} آدرس تصویر پترن فعلی یا null
   */
  getCurrentPatternImage() {
    if (!this.currentPattern || !this.productInfo?.patterns) return null;

    const pattern = this.productInfo.patterns.find(
      (p) => p.code === this.currentPattern
    );
    return pattern?.imageUrl || null;
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
        code: color.name,
        color: color.hexCode,
        url: color.imageUrl,
      })),
      patterns: this.getPatterns().map((pattern) => pattern.code),
    };
  }
}

export default ProductManager;
