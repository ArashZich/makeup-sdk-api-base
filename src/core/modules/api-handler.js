// src/core/modules/api-handler.js

import { getUserIP } from "../../utils/getUserIP";
import {
  getProductAndTokenInfo,
  mapProductInfoToSDKFormat,
} from "../../utils/api/product-service";

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
   * @param {string} productUid - شناسه محصول
   * @returns {Promise<Object>} نتیجه اعتبارسنجی و اطلاعات محصول
   */
  async loadProductAndTokenInfo(productUid) {
    try {
      // فراخوانی API یکپارچه
      const result = await getProductAndTokenInfo(this.token, productUid);

      // تبدیل ساختار productInfo به فرمت سازگار با SDK
      const mappedProductInfo = result.productInfo
        ? mapProductInfoToSDKFormat(result.productInfo)
        : null;

      return {
        isValid: result.tokenInfo.isValid,
        isPremium: result.tokenInfo.isPremium,
        projectType: result.tokenInfo.projectType,
        tokenInfo: result.tokenInfo,
        productInfo: mappedProductInfo,
        mediaFeatures: result.tokenInfo.mediaFeatures,
      };
    } catch (error) {
      console.error("خطا در بارگذاری اطلاعات محصول:", error);
      throw error;
    }
  }

  /**
   * اعتبارسنجی توکن SDK
   * @returns {Promise<Object>} نتیجه اعتبارسنجی
   */
  async validateToken() {
    try {
      const userIP = await getUserIP();
      const response = await fetch(process.env.VALIDATE_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Real-User-IP": userIP,
        },
        body: JSON.stringify({ token: this.token }),
      });

      const data = await response.json();

      if (!data.isValid) {
        return {
          isValid: false,
          message: "توکن نامعتبر یا منقضی شده است.",
        };
      }

      if (data.projectType !== "makeup") {
        return {
          isValid: true,
          isPremium: data.isPremium,
          projectType: data.projectType,
          message: "این توکن برای پروژه آرایش مجازی معتبر نیست.",
        };
      }

      return {
        isValid: true,
        isPremium: data.isPremium,
        projectType: data.projectType,
        tokenInfo: data.features || {},
        mediaFeatures: data.mediaFeatures || {
          allowedSources: [],
          allowedViews: [],
          comparisonModes: [],
        },
      };
    } catch (error) {
      console.error("خطا در اعتبارسنجی توکن:", error);
      return {
        isValid: false,
        message:
          "خطا در ارتباط با سرور، لطفاً اتصال اینترنت خود را بررسی کنید.",
      };
    }
  }

  /**
   * ارسال داده‌های تحلیلی به سرور
   * @param {string} makeupType - نوع آرایش
   * @param {string} color - رنگ
   * @param {string} colorCode - کد رنگ
   */
  async sendAnalytics(makeupType, color, colorCode) {
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
}

export default ApiHandler;
