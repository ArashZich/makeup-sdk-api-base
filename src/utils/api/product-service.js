/**
 * سرویس API یکپارچه برای دریافت اطلاعات محصول و توکن
 */

import { getUserIP } from "../getUserIP";

/**
 * دریافت اطلاعات محصول و توکن از سرور با یک درخواست API
 * @param {string} token - توکن SDK
 * @param {string} productUid - شناسه منحصر به فرد محصول
 * @returns {Promise<Object>} اطلاعات توکن و محصول در یک آبجکت واحد
 */
export async function getProductAndTokenInfo(token, productUid) {
  try {
    // دریافت IP کاربر (در صورت وجود تابع در کد فعلی)
    const userIP = await getUserIP().catch(() => "unknown");

    // آدرس API از متغیرهای محیطی
    const apiUrl =
      process.env.PRODUCT_INFO_URL ||
      "https://api.example.com/api/v1/sdk/product-info";

    // ارسال درخواست به سرور
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sdk-token": token,
        "x-real-user-ip": userIP,
      },
      body: JSON.stringify({ productUid }),
    });

    // بررسی پاسخ
    const data = await response.json();

    // بررسی وضعیت پاسخ
    if (!response.ok) {
      throw new Error(data.message || "خطا در دریافت اطلاعات محصول و توکن");
    }

    return {
      tokenInfo: data.tokenInfo,
      productInfo: data.productInfo,
    };
  } catch (error) {
    console.error("Error in product-service:", error);
    throw error;
  }
}

/**
 * تبدیل ساختار productInfo به ساختار سازگار با SDK فعلی
 * @param {Object} productInfo - اطلاعات محصول دریافتی از سرور
 * @returns {Object} اطلاعات محصول با ساختار سازگار با SDK
 */
export function mapProductInfoToSDKFormat(productInfo) {
  // تبدیل رنگ‌های محصول به فرمت مورد نیاز SDK
  const colors = productInfo.colors.map((color) => ({
    code: color.name,
    color: color.hexCode,
    url: color.imageUrl,
    feature: productInfo.type, // نوع محصول به عنوان ویژگی
  }));

  // تبدیل پترن‌های محصول به فرمت مورد نیاز SDK
  const patterns = productInfo.patterns.map((pattern) => ({
    name: pattern.name,
    code: pattern.code,
    imageUrl: pattern.imageUrl,
  }));

  return {
    id: productInfo.id,
    uid: productInfo.uid,
    name: productInfo.name,
    description: productInfo.description,
    type: productInfo.type,
    code: productInfo.code,
    thumbnail: productInfo.thumbnail,
    colors,
    patterns,
  };
}
