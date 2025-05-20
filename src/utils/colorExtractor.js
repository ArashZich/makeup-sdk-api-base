// src/utils/colorExtractor.js
import ColorThief from "colorthief";

/**
 * تبدیل مقادیر RGB به فرمت هگز
 * @param {number} r - مقدار قرمز (0-255)
 * @param {number} g - مقدار سبز (0-255)
 * @param {number} b - مقدار آبی (0-255)
 * @returns {string} کد رنگ هگز
 */
export function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * استخراج رنگ غالب پررنگ از تصویر
 * @param {string} imageUrl - آدرس تصویر
 * @returns {Promise<string>} کد رنگ هگز استخراج شده
 */
export function extractDominantColor(imageUrl) {
  return new Promise((resolve, reject) => {
    try {
      console.log("شروع استخراج رنگ پررنگ از:", imageUrl);

      // ایجاد تصویر جدید
      const img = new Image();
      img.crossOrigin = "Anonymous";

      // اضافه کردن مهلت زمانی برای بارگذاری تصویر
      const loadTimeout = setTimeout(() => {
        console.warn("مهلت بارگذاری تصویر تمام شد، استفاده از رنگ پیش‌فرض");
        resolve("#808080");
      }, 10000);

      img.onload = function () {
        clearTimeout(loadTimeout);

        try {
          console.log(
            "تصویر با موفقیت لود شد. ابعاد:",
            img.width,
            "x",
            img.height
          );

          // بررسی ابعاد تصویر
          if (img.width <= 1 || img.height <= 1) {
            console.warn("تصویر خیلی کوچک است، استفاده از رنگ پیش‌فرض");
            resolve("#808080");
            return;
          }

          // ایجاد کنوس موقت
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d", { willReadFrequently: true });

          // تنظیم اندازه کنوس
          canvas.width = img.width;
          canvas.height = img.height;

          // کشیدن تصویر روی کنوس
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // افزایش کنتراست تصویر قبل از استخراج رنگ
          enhanceContrast(ctx, canvas.width, canvas.height);

          // روش 1: استفاده از ColorThief با تصویر بهبود یافته
          try {
            // به ColorThief یک کنوس جدید داده می‌شود با تصویر بهبود یافته
            const enhancedCanvas = document.createElement("canvas");
            const enhancedCtx = enhancedCanvas.getContext("2d");
            enhancedCanvas.width = img.width;
            enhancedCanvas.height = img.height;

            // کپی از تصویر بهبود یافته
            enhancedCtx.drawImage(canvas, 0, 0);

            const colorThief = new ColorThief();
            const colorImage = new Image();
            colorImage.src = enhancedCanvas.toDataURL();

            colorImage.onload = function () {
              try {
                const dominantColor = colorThief.getColor(colorImage);
                console.log(
                  "ColorThief رنگ غالب پررنگ را پیدا کرد:",
                  dominantColor
                );

                // افزایش اشباع رنگ
                const saturatedColor = increaseSaturation(
                  dominantColor[0],
                  dominantColor[1],
                  dominantColor[2],
                  1.3
                );

                const hexColor = rgbToHex(
                  saturatedColor[0],
                  saturatedColor[1],
                  saturatedColor[2]
                );
                console.log("رنگ نهایی بهبود یافته:", hexColor);
                resolve(hexColor);
              } catch (error) {
                console.warn("خطا در ColorThief بهبود یافته:", error);
                fallbackColorExtraction();
              }
            };

            colorImage.onerror = fallbackColorExtraction;
            return;
          } catch (colorThiefError) {
            console.warn(
              "ColorThief با خطا مواجه شد، استفاده از روش جایگزین:",
              colorThiefError
            );
            fallbackColorExtraction();
          }

          // روش جایگزین استخراج رنگ
          function fallbackColorExtraction() {
            // گرفتن داده‌های تصویر
            const imageData = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height
            );
            const data = imageData.data;

            console.log("استفاده از روش جایگزین برای استخراج رنگ پررنگ");

            // بافرهای رنگ با وزن‌دهی بهتر
            const rgbColors = [];
            const colorWeights = {}; // برای نگهداری وزن هر رنگ

            // آستانه‌ها
            const whiteThreshold = 225;
            const blackThreshold = 40;
            const saturationMin = 0.15; // افزایش حداقل اشباع

            // نمونه‌برداری
            const step = Math.max(1, Math.floor(data.length / 4 / 1000));

            for (let i = 0; i < data.length; i += 4 * step) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const a = data[i + 3];

              // فیلتر کردن پیکسل‌های نامناسب
              if (a < 200) continue; // فقط پیکسل‌های کاملاً مات
              if (
                r > whiteThreshold &&
                g > whiteThreshold &&
                b > whiteThreshold
              )
                continue;
              if (
                r < blackThreshold &&
                g < blackThreshold &&
                b < blackThreshold
              )
                continue;

              // محاسبه مقادیر HSV برای تحلیل بهتر رنگ
              const hsv = rgbToHsv(r, g, b);

              // نادیده گرفتن رنگ‌های کم اشباع
              if (hsv.s < saturationMin) continue;

              // محاسبه شدت رنگ (ترکیبی از اشباع و روشنایی)
              const colorIntensity = calculateColorIntensity(r, g, b);

              // کلید رنگ برای گروه‌بندی
              // دقت کمتر برای گرد کردن (به 15 به جای 10) برای گروه‌های بزرگتر
              const bucketR = Math.round(r / 15) * 15;
              const bucketG = Math.round(g / 15) * 15;
              const bucketB = Math.round(b / 15) * 15;
              const colorKey = `${bucketR},${bucketG},${bucketB}`;

              // افزودن رنگ به مجموعه با وزن مناسب
              if (!colorWeights[colorKey]) {
                colorWeights[colorKey] = {
                  color: [r, g, b],
                  weight: 0,
                  count: 0,
                  totalR: 0,
                  totalG: 0,
                  totalB: 0,
                };
              }

              // وزن بیشتر به رنگ‌های پررنگ‌تر
              const weight = colorIntensity * 10;
              colorWeights[colorKey].weight += weight;
              colorWeights[colorKey].count++;
              colorWeights[colorKey].totalR += r;
              colorWeights[colorKey].totalG += g;
              colorWeights[colorKey].totalB += b;

              // اضافه کردن به آرایه اصلی برای تحلیل سنتی
              rgbColors.push([r, g, b]);
            }

            // پیدا کردن رنگ با بیشترین وزن
            let maxWeight = 0;
            let vividColor = null;

            for (const key in colorWeights) {
              const colorData = colorWeights[key];
              if (colorData.weight > maxWeight) {
                maxWeight = colorData.weight;
                // میانگین رنگ در این گروه
                vividColor = [
                  Math.round(colorData.totalR / colorData.count),
                  Math.round(colorData.totalG / colorData.count),
                  Math.round(colorData.totalB / colorData.count),
                ];
              }
            }

            if (vividColor) {
              // افزایش اشباع رنگ نهایی
              const saturatedColor = increaseSaturation(
                vividColor[0],
                vividColor[1],
                vividColor[2],
                1.2
              );
              const hexColor = rgbToHex(
                saturatedColor[0],
                saturatedColor[1],
                saturatedColor[2]
              );
              console.log("رنگ پررنگ یافت شده:", hexColor);
              resolve(hexColor);
            } else if (rgbColors.length > 0) {
              // روش سنتی k-means اگر روش وزن‌دهی شکست خورد
              const colorBuckets = {};

              rgbColors.forEach((color) => {
                const bucketR = Math.round(color[0] / 10) * 10;
                const bucketG = Math.round(color[1] / 10) * 10;
                const bucketB = Math.round(color[2] / 10) * 10;
                const bucket = `${bucketR},${bucketG},${bucketB}`;

                if (!colorBuckets[bucket]) {
                  colorBuckets[bucket] = { count: 0, r: 0, g: 0, b: 0 };
                }

                colorBuckets[bucket].count++;
                colorBuckets[bucket].r += color[0];
                colorBuckets[bucket].g += color[1];
                colorBuckets[bucket].b += color[2];
              });

              let maxCount = 0;
              let dominantColor = null;

              for (const bucket in colorBuckets) {
                const bucketData = colorBuckets[bucket];
                if (bucketData.count > maxCount) {
                  maxCount = bucketData.count;
                  dominantColor = {
                    r: Math.round(bucketData.r / bucketData.count),
                    g: Math.round(bucketData.g / bucketData.count),
                    b: Math.round(bucketData.b / bucketData.count),
                  };
                }
              }

              if (dominantColor) {
                // تقویت اشباع رنگ غالب
                const enhancedColor = increaseSaturation(
                  dominantColor.r,
                  dominantColor.g,
                  dominantColor.b,
                  1.2
                );
                const hexColor = rgbToHex(
                  enhancedColor[0],
                  enhancedColor[1],
                  enhancedColor[2]
                );
                console.log("رنگ غالب تقویت شده:", hexColor);
                resolve(hexColor);
              } else {
                console.warn("رنگ غالب یافت نشد، استفاده از رنگ پیش‌فرض");
                resolve("#808080");
              }
            } else {
              console.warn("هیچ رنگ مناسبی یافت نشد، استفاده از رنگ پیش‌فرض");
              resolve("#808080");
            }
          }
        } catch (err) {
          console.error("خطا در پردازش تصویر:", err);
          resolve("#808080");
        }
      };

      img.onerror = function (err) {
        clearTimeout(loadTimeout);
        console.error("خطا در بارگذاری تصویر:", err);
        resolve("#808080");
      };

      // شروع بارگذاری تصویر
      img.src = imageUrl;
    } catch (error) {
      console.error("خطای غیرمنتظره:", error);
      resolve("#808080");
    }
  });
}

/**
 * افزایش کنتراست تصویر
 * @param {CanvasRenderingContext2D} ctx - کانتکست کنوس
 * @param {number} width - عرض تصویر
 * @param {number} height - ارتفاع تصویر
 */
function enhanceContrast(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // یافتن مقادیر حداقل و حداکثر
  let min = 255,
    max = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const value = (r + g + b) / 3;

    if (value < min) min = value;
    if (value > max) max = value;
  }

  // محاسبه ضریب کنتراست
  const contrast = (255 / (max - min)) * 1.2; // 20% افزایش کنتراست

  // اعمال کنتراست جدید
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, (data[i] - min) * contrast + min));
    data[i + 1] = Math.min(
      255,
      Math.max(0, (data[i + 1] - min) * contrast + min)
    );
    data[i + 2] = Math.min(
      255,
      Math.max(0, (data[i + 2] - min) * contrast + min)
    );
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * محاسبه شدت رنگ (ترکیبی از اشباع و روشنایی)
 * @param {number} r - مقدار قرمز
 * @param {number} g - مقدار سبز
 * @param {number} b - مقدار آبی
 * @returns {number} شدت رنگ (0-1)
 */
function calculateColorIntensity(r, g, b) {
  const hsv = rgbToHsv(r, g, b);

  // فرمول ویژه برای محاسبه "پررنگی" - ترکیبی از اشباع و روشنایی
  // رنگ‌های با اشباع بالا و روشنایی متوسط، پررنگ‌ترین هستند
  return hsv.s * (1 - Math.abs(hsv.v - 0.5) * 1.5);
}

/**
 * تبدیل RGB به HSV
 * @param {number} r - مقدار قرمز (0-255)
 * @param {number} g - مقدار سبز (0-255)
 * @param {number} b - مقدار آبی (0-255)
 * @returns {Object} مقادیر HSV
 */
function rgbToHsv(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  const s = max === 0 ? 0 : diff / max;
  const v = max;

  if (max !== min) {
    if (max === r) {
      h = (g - b) / diff + (g < b ? 6 : 0);
    } else if (max === g) {
      h = (b - r) / diff + 2;
    } else {
      h = (r - g) / diff + 4;
    }
    h /= 6;
  }

  return { h, s, v };
}

/**
 * افزایش اشباع یک رنگ
 * @param {number} r - مقدار قرمز (0-255)
 * @param {number} g - مقدار سبز (0-255)
 * @param {number} b - مقدار آبی (0-255)
 * @param {number} factor - ضریب افزایش (1.0 = بدون تغییر)
 * @returns {Array} آرایه RGB با اشباع افزایش یافته
 */
function increaseSaturation(r, g, b, factor) {
  // تبدیل به HSV
  const hsv = rgbToHsv(r, g, b);

  // افزایش اشباع
  hsv.s = Math.min(1, hsv.s * factor);

  // افزایش روشنایی اندکی برای رنگ‌های تیره
  if (hsv.v < 0.3) {
    hsv.v = Math.min(1, hsv.v * 1.2);
  }

  // تبدیل مجدد به RGB
  return hsvToRgb(hsv.h, hsv.s, hsv.v);
}

/**
 * تبدیل HSV به RGB
 * @param {number} h - رنگ (0-1)
 * @param {number} s - اشباع (0-1)
 * @param {number} v - روشنایی (0-1)
 * @returns {Array} آرایه RGB
 */
function hsvToRgb(h, s, v) {
  let r, g, b;

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * پردازش آرایه رنگ‌ها و استخراج رنگ‌ها از URL‌های تصاویر
 * @param {Array} colorsArray - آرایه‌ای از آبجکت‌های رنگ
 * @returns {Promise<Array>} آرایه پردازش شده رنگ‌ها
 */
export async function processColorsArray(colorsArray) {
  if (!Array.isArray(colorsArray)) {
    return [];
  }

  console.log("شروع پردازش آرایه رنگ‌ها:", colorsArray);
  const processedColors = [];

  // پردازش هر آیتم در آرایه
  for (let i = 0; i < colorsArray.length; i++) {
    const colorItem = { ...colorsArray[i] };
    console.log(`پردازش آیتم ${i + 1}/${colorsArray.length}:`, colorItem);

    // اگر url وجود دارد اما color وجود ندارد
    if (colorItem.url && (!colorItem.color || colorItem.color === "")) {
      console.log(
        `آیتم ${colorItem.code} دارای url بدون رنگ است، استخراج رنگ...`
      );
      try {
        // استخراج رنگ از تصویر
        colorItem.color = await extractDominantColor(colorItem.url);
        console.log(
          `رنگ استخراج شده برای ${colorItem.code}: ${colorItem.color}`
        );
      } catch (error) {
        console.error(`خطا در استخراج رنگ برای ${colorItem.code}:`, error);
        colorItem.color = "#808080"; // رنگ پیش‌فرض خاکستری
      }
    } else {
      console.log(`آیتم ${colorItem.code} نیازی به استخراج رنگ ندارد.`);
    }

    processedColors.push(colorItem);
  }

  console.log("تمام آیتم‌ها پردازش شدند:", processedColors);
  return processedColors;
}
