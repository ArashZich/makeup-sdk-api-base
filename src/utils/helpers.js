// utils.js

/**
 * تشخیص دستگاه موبایل
 * @returns {boolean} آیا دستگاه موبایل است یا خیر
 */
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * تبدیل رنگ هگز به آبجکت RGB
 * @param {string} hex - کد رنگ هگز
 * @returns {Object|null} آبجکت حاوی مقادیر RGB یا null در صورت نامعتبر بودن ورودی
 */
function convertHexToRgbObject(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * تبدیل رنگ هگز به رشته RGB
 * @param {string} hex - کد رنگ هگز
 * @returns {string} رشته RGB
 */
function convertHexToRgbString(hex) {
  const { r, g, b } = convertHexToRgbObject(hex);
  return `${r}, ${g}, ${b}`;
}

/**
 * تبدیل رنگ هگز به رشته RGBA
 * @param {string} hex - کد رنگ هگز
 * @param {number} alpha - مقدار آلفا (شفافیت)
 * @returns {string} رشته RGBA
 */
function convertHexToRgba(hex, alpha) {
  const { r, g, b } = convertHexToRgbObject(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * تغییر شدت رنگ
 * @param {string} color - کد رنگ هگز
 * @param {number} percent - درصد تغییر (مثبت برای روشن‌تر، منفی برای تیره‌تر)
 * @returns {string} کد رنگ هگز جدید
 */
function adjustColorShade(color, percent) {
  const num = parseInt(color.slice(1), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return `#${(
    (1 << 24) |
    ((R < 255 ? (R < 1 ? 0 : R) : 255) << 16) |
    ((G < 255 ? (G < 1 ? 0 : G) : 255) << 8) |
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  )
    .toString(16)
    .slice(1)}`;
}

/**
 * درون‌یابی خطی
 * @param {number} t - مقدار درون‌یابی (بین 0 و 1)
 * @param {number} a - مقدار شروع
 * @param {number} b - مقدار پایان
 * @returns {number} مقدار درون‌یابی شده
 */
function lerp(t, a, b) {
  return a + t * (b - a);
}

/**
 * ایجاد تابع نویز دو بعدی
 * @returns {Function} تابع نویز دو بعدی
 */
function createNoise2D() {
  const p = new Array(512);
  const permutation = [
    151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140,
    36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120,
    234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
    88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71,
    134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133,
    230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161,
    1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130,
    116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250,
    124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227,
    47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44,
    154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98,
    108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34,
    242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14,
    239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121,
    50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243,
    141, 128, 195, 78, 66, 215, 61, 156, 180,
  ];

  for (let i = 0; i < 256; i++) p[256 + i] = p[i] = permutation[i];

  function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  function grad(hash, x, y) {
    const h = hash & 15;
    const u = h < 8 ? x : y,
      v = h < 4 ? y : h == 12 || h == 14 ? x : 0;
    return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
  }

  return function (x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = fade(x);
    const v = fade(y);
    const A = p[X] + Y,
      B = p[X + 1] + Y;
    return lerp(
      v,
      lerp(u, grad(p[A], x, y), grad(p[B], x - 1, y)),
      lerp(u, grad(p[A + 1], x, y - 1), grad(p[B + 1], x - 1, y - 1))
    );
  };
}

// utils.js

// توابع قبلی...

/**
 * تنظیمات اختصاصی رندرینگ برای پلتفرم‌های مختلف
 * @returns {Object} تنظیمات مخصوص پلتفرم شامل blur، tension، opacity و blendMode
 */
function getPlatformSpecificSettings() {
  // شناسایی نوع دستگاه و مرورگر از طریق User Agent
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua); // iOS دستگاه‌های
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua); // مرورگر Safari
  const isAndroid = /android/i.test(ua); // دستگاه‌های Android
  const isChrome = /chrome/i.test(ua); // مرورگر Chrome
  const isFirefox = /firefox/i.test(ua); // مرورگر Firefox

  // تنظیمات پایه برای همه پلتفرم‌ها
  const baseSettings = {
    blur: "3px", // میزان محوی پایه
    tension: 0.25, // میزان کشش منحنی‌ها
    opacity: 0.75, // شفافیت کلی
    smoothing: true, // فعال‌سازی نرم‌سازی
    blendMode: "soft-light", // حالت ترکیب پیش‌فرض
  };

  // تنظیمات مخصوص iOS و Safari
  // به دلیل عملکرد بهتر موتور رندرینگ، نیاز به blur کمتری دارند
  if (isIOS || isSafari) {
    return {
      ...baseSettings,
      blur: "0px", // بدون محوی اضافه
      tension: 0.2, // کشش کمتر منحنی‌ها
      opacity: 0.8, // شفافیت بیشتر
    };
  }

  // تنظیمات مخصوص Android
  // نیاز به blur بیشتر برای پنهان کردن لبه‌های تیز
  else if (isAndroid) {
    return {
      ...baseSettings,
      blur: "5px", // محوی بیشتر
      tension: 0.3, // کشش بیشتر منحنی‌ها
      opacity: 0.7, // شفافیت کمتر
      blendMode: "overlay", // حالت ترکیب متفاوت
    };
  }

  // تنظیمات مخصوص Chrome
  else if (isChrome) {
    return {
      ...baseSettings,
      blur: "4.2px", // محوی متوسط
      tension: 0.28, // کشش متوسط
      opacity: 0.72, // شفافیت متوسط
    };
  }

  // تنظیمات مخصوص Firefox
  else if (isFirefox) {
    return {
      ...baseSettings,
      blur: "4px", // محوی کمی کمتر از Chrome
      tension: 0.26, // کشش کمی کمتر
      opacity: 0.73, // شفافیت مشابه
    };
  }

  // برای سایر مرورگرها از تنظیمات پایه استفاده می‌شود
  return baseSettings;
}

// تشخصیص ios
function isSafariBrowser() {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

// صادر کردن توابع
export {
  isMobileDevice,
  convertHexToRgbObject,
  convertHexToRgbString,
  convertHexToRgba,
  adjustColorShade,
  lerp,
  createNoise2D,
  getPlatformSpecificSettings,
  isSafariBrowser,
};
