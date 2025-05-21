// src/core/modules/api-handler.js

import { getUserIP } from "../../utils/getUserIP";

/**
 * کلاس مدیریت ارتباط با API
 */
export class ApiHandler {
  /**
   * سازنده کلاس ApiHandler
   * @param {string} token - توکن SDK
   */
  constructor(token) {
    this.token = token;
    this._lastAnalyticsCall = {
      makeupType: null,
      color: null,
      colorCode: null,
      timestamp: 0,
    };
  }

  /**
   * بارگذاری اطلاعات محصول و توکن از API
   * @param {string} productUid - شناسه محصول (اختیاری)
   * @returns {Promise<Object>} نتیجه اعتبارسنجی و اطلاعات محصول
   */
  async loadProductAndTokenInfo(productUid = null) {
    try {
      // دریافت IP کاربر
      const userIP = await getUserIP().catch(() => "unknown");

      // آدرس API از متغیرهای محیطی
      const apiUrl =
        process.env.PRODUCT_INFO_URL ||
        "http://localhost:4000/api/v1/sdk/product-info";

      // ساخت بدنه درخواست
      const requestBody = productUid ? { productUid } : {};

      // ارسال درخواست به سرور
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-sdk-token": this.token,
          "x-real-user-ip": userIP,
        },
        body: JSON.stringify(requestBody),
      });

      // بررسی پاسخ
      const data = await response.json();

      // بررسی وضعیت پاسخ
      if (!response.ok) {
        return {
          isValid: false,
          message: data.message || "خطا در دریافت اطلاعات محصول و توکن",
        };
      }

      // تبدیل اطلاعات productInfo به فرمت مناسب SDK
      if (data.productInfo) {
        data.productInfo = this._mapProductInfoToSDKFormat(data.productInfo);
      }

      return {
        isValid: data.tokenInfo?.isValid || false,
        isPremium: data.tokenInfo?.isPremium || false,
        projectType: data.tokenInfo?.projectType || null,
        tokenInfo: data.tokenInfo || {},
        productInfo: data.productInfo || null,
        mediaFeatures: data.tokenInfo?.mediaFeatures || {
          allowedSources: [],
          allowedViews: [],
          comparisonModes: [],
        },
        message: data.message || null,
      };
    } catch (error) {
      console.error("خطا در ارتباط با API:", error);
      return {
        isValid: false,
        message:
          "خطا در ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.",
      };
    }
  }

  /**
   * تبدیل ساختار productInfo به ساختار سازگار با SDK
   * @param {Object} productInfo - اطلاعات محصول دریافتی از سرور
   * @returns {Object} اطلاعات محصول با ساختار سازگار با SDK
   * @private
   */
  _mapProductInfoToSDKFormat(productInfo) {
    // تبدیل رنگ‌های محصول به فرمت مورد نیاز SDK
    // API response: { "code": "گل رز طبیعی", "color": "#D1919F", "feature": "lips" }
    // SDK expects: { code: "نمایش نام رنگ", color: "مقدار هگز", url?: "...", feature: "lips" }
    const colors = productInfo.colors.map((apiColor) => ({
      code: apiColor.name, // نام نمایشی رنگ از API
      color: apiColor.hexCode, // مقدار هگز رنگ از API
      url: apiColor.imageUrl, // اگر imageUrl در پاسخ API برای رنگ‌ها وجود دارد
      feature: apiColor.feature || productInfo.type, // ویژگی مرتبط
    }));

    console.log(colors, "LOPPPPP");

    // تبدیل پترن‌های محصول به فرمت مورد نیاز SDK
    // API response: { "name": "براق", "code": "GLOSSY", "imageUrl": "..." }
    // SDK expects: { name: "براق", code: "GLOSSY", imageUrl: "..." }
    const patterns = productInfo.patterns.map((apiPattern) => ({
      name: apiPattern.name,
      code: apiPattern.code,
      imageUrl: apiPattern.imageUrl,
    }));

    return {
      id: productInfo.id,
      uid: productInfo.uid,
      name: productInfo.name,
      description: productInfo.description,
      type: productInfo.type,
      code: productInfo.code, // کد خود محصول
      thumbnail: productInfo.thumbnail,
      colors,
      patterns,
    };
  }

  /**
   * ارسال داده‌های تحلیلی به سرور
   * @param {string} makeupType - نوع آرایش
   * @param {string} color - رنگ
   * @param {string} colorCode - کد رنگ
   * @returns {Promise<void>}
   */
  async sendAnalytics(makeupType, color, colorCode) {
    try {
      // بررسی اعتبار پارامترها
      if (!this.token || !makeupType || !color) {
        return;
      }

      // جلوگیری از ارسال درخواست‌های تکراری در بازه زمانی کوتاه
      const now = Date.now();
      if (
        this._lastAnalyticsCall.makeupType === makeupType &&
        this._lastAnalyticsCall.color === color &&
        this._lastAnalyticsCall.colorCode === colorCode &&
        now - this._lastAnalyticsCall.timestamp < 2000
      ) {
        return;
      }

      // آدرس API از متغیرهای محیطی
      const apiUrl =
        process.env.ANALYTICS_MAKEUP_URL ||
        "https://api.example.com/api/v1/sdk/analytics";

      // ارسال درخواست به سرور
      const response = await fetch(apiUrl, {
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
      console.warn("خطا در ارسال داده‌های تحلیلی:", error);
    }
  }
}

export default ApiHandler;
