// src/core/methods/featureManager.js

/**
 * کلاس مدیریت ویژگی‌ها و قابلیت‌های مجاز در SDK
 * کاملاً بر اساس اطلاعات دریافتی از API یکپارچه
 */
export class FeatureManager {
  /**
   * سازنده کلاس FeatureManager
   * @param {Object} tokenInfo - اطلاعات توکن دریافتی از API
   * @param {Object} productInfo - اطلاعات محصول دریافتی از API (اختیاری)
   */
  constructor(tokenInfo = null, productInfo = null) {
    this.tokenInfo = tokenInfo;
    this.productInfo = productInfo;
  }

  /**
   * بررسی دسترسی به یک ویژگی خاص
   * @param {string} feature - نام ویژگی
   * @returns {boolean} آیا دسترسی به این ویژگی مجاز است؟
   */
  isFeatureEnabled(feature) {
    // بررسی دسترسی از طریق اطلاعات توکن
    if (this.tokenInfo?.features) {
      return this.tokenInfo.features.includes(feature);
    }

    // اگر توکن وجود ندارد، دسترسی نداریم
    return false;
  }

  /**
   * دریافت پترن‌های مجاز برای یک ویژگی
   * @param {string} feature - نام ویژگی
   * @returns {Array} آرایه‌ای از پترن‌های مجاز
   */
  getAllowedPatterns(feature) {
    // اگر اطلاعات محصول موجود است و این محصول همان ویژگی درخواستی است
    if (
      this.productInfo?.type &&
      this.productInfo.type === feature &&
      this.productInfo.patterns
    ) {
      // برگرداندن کدهای پترن
      return this.productInfo.patterns.map((pattern) => pattern.code);
    }

    // در غیر این صورت، پترنی مجاز نیست
    return [];
  }

  /**
   * دریافت تمام ویژگی‌های مجاز
   * @returns {Array} آرایه‌ای از ویژگی‌های مجاز
   */
  getEnabledFeatures() {
    // اگر اطلاعات توکن موجود است از آن استفاده می‌کنیم
    if (this.tokenInfo?.features) {
      return this.tokenInfo.features;
    }

    // در غیر این صورت، آرایه خالی برمی‌گردانیم
    return [];
  }

  /**
   * دریافت قابلیت‌های رسانه‌ای مجاز
   * @returns {Object} آبجکت شامل قابلیت‌های رسانه‌ای مجاز
   */
  getMediaFeatures() {
    // اگر اطلاعات توکن موجود است از آن استفاده می‌کنیم
    if (this.tokenInfo?.mediaFeatures) {
      return this.tokenInfo.mediaFeatures;
    }

    // در غیر این صورت، آبجکت خالی برمی‌گردانیم
    return {
      allowedSources: [],
      allowedViews: [],
      comparisonModes: [],
    };
  }

  /**
   * بروزرسانی اطلاعات توکن و محصول
   * @param {Object} tokenInfo - اطلاعات توکن جدید
   * @param {Object} productInfo - اطلاعات محصول جدید (اختیاری)
   */
  updateInfo(tokenInfo, productInfo = null) {
    this.tokenInfo = tokenInfo;
    if (productInfo) {
      this.productInfo = productInfo;
    }
  }

  /**
   * تنظیم اطلاعات محصول
   * @param {Object} productInfo - اطلاعات محصول
   */
  setProductInfo(productInfo) {
    this.productInfo = productInfo;
  }

  /**
   * دریافت رنگ‌های مجاز برای محصول فعلی
   * @returns {Array} آرایه‌ای از رنگ‌های مجاز
   */
  getProductColors() {
    if (this.productInfo?.colors) {
      return this.productInfo.colors;
    }
    return [];
  }

  /**
   * دریافت نوع محصول فعلی
   * @returns {string|null} نوع محصول یا null اگر محصولی تنظیم نشده باشد
   */
  getCurrentProductType() {
    return this.productInfo?.type || null;
  }

  /**
   * بررسی اینکه آیا نوع محصول فعلی در لیست ویژگی‌های مجاز است
   * @returns {boolean} نتیجه بررسی
   */
  isCurrentProductTypeEnabled() {
    if (!this.productInfo?.type) return false;
    return this.isFeatureEnabled(this.productInfo.type);
  }

  /**
   * دریافت توضیحات محصول
   * @returns {string|null} توضیحات محصول یا null اگر محصولی تنظیم نشده باشد
   */
  getProductDescription() {
    return this.productInfo?.description || null;
  }

  /**
   * دریافت کد محصول
   * @returns {string|null} کد محصول یا null اگر محصولی تنظیم نشده باشد
   */
  getProductCode() {
    return this.productInfo?.code || null;
  }
}

export default FeatureManager;
