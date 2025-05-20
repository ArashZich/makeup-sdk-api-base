
# راهنمای داخلی ویژگی‌های SDK آرایش مجازی

## ویژگی‌های عمومی
این ویژگی‌ها برای همه کاربران قابل دسترس هستند:

| ویژگی | کد | الگوها | فایل | توضیحات |
|-------|-----|--------|------|----------|
| رژ لب | `lips` | normal, matte, glossy, glitter | `lips.js` | همه الگوها عمومی |
| سایه چشم | `eyeshadow` | normal | `eyeshadow.js` | - |
| رژگونه | `blush` | normal | `blush.js` | - |
| کانسیلر | `concealer` | normal | `concealer.js` | - |
| کرم پودر | `foundation` | normal | `foundation.js` | - |
| ابرو | `brows` | normal | `brows.js` | - |
| خط چشم | `eyeliner` | normal | `eyeliner.js` | - |
| مداد چشم | `eyepencil` | normal | `eyepencil.js` | - |
| مژه مصنوعی | `eyelashes` | long-lash | `eyelashes.js` | فقط الگوی long-lash عمومی است |

## ویژگی‌های خصوصی
این ویژگی‌ها فقط برای مشتریان خاص فعال می‌شوند:

| ویژگی | کد | الگو | فایل | توضیحات |
|-------|-----|------|------|----------|
| مژه مصنوعی | `eyelashes` | volume-boost | `eyelashes.js` | الگوی volume-boost فقط خصوصی |
| لنز چشم | `lens` | rainbow | `patterns-lens/rainbow.js` | لنز رنگین کمانی |
| لنز چشم | `lens` | crystal-colors | `patterns-lens/crystal-colors.js` | لنز کریستالی |
| لنز چشم | `lens` | dahab-platinum | `patterns-lens/dahab-platinum.js` | لنز پلاتینیوم |
| لنز چشم | `lens` | desio-attitude | `patterns-lens/desio-attitude.js` | لنز دزیو |
| لنز چشم | `lens` | freshlook-colorblends | `patterns-lens/freshlook-colorblends.js` | لنز فرش لوک |

## نمایش در کد

### تعریف ویژگی‌های پیش‌فرض در `src/core/featureManager.js`:
```javascript
export const defaultFeatures = [
  "lips",          // رژ لب
  "eyeshadow",     // سایه چشم
  "eyepencil",     // مداد چشم
  "eyelashes",     // مژه مصنوعی
  "blush",         // رژگونه
  "concealer",     // کانسیلر
  "foundation",    // کرم پودر
  "brows",         // ابرو
  "eyeliner",      // خط چشم
  // "lens"        // لنز چشم - غیرفعال برای عموم
];
```

### تعریف الگوهای پیش‌فرض در همان فایل:
```javascript
export const defaultPatterns = {
  // ویژگی‌های عمومی
  lips: ["normal", "matte", "glossy", "glitter"],
  eyeshadow: ["normal"],
  eyepencil: ["normal"],
  eyeliner: ["normal"],
  eyelashes: ["long-lash"], // "volume-boost" - غیرفعال برای عموم
  blush: ["normal"],
  concealer: ["normal"],
  foundation: ["normal"],
  brows: ["normal"],

  // ویژگی‌های خصوصی
  // lens: [
  //   "rainbow",
  //   "crystal-colors",
  //   "dahab-platinum",
  //   "desio-attitude",
  //   "freshlook-colorblends",
  // ],
};
```

## نحوه اضافه کردن ویژگی یا الگوی جدید
1. اضافه کردن کد ویژگی به `defaultFeatures` (اگر عمومی است)
2. اضافه کردن الگوهای ویژگی به `defaultPatterns`
3. اضافه کردن فایل اصلی ویژگی در پوشه `src/makeup/`
4. اضافه کردن export در `src/makeup/index.js`
5. اضافه کردن پیاده‌سازی در `src/core/makeupHandle.js`

## دسترسی به ویژگی‌ها
- ویژگی‌های عمومی: برای همه کاربران
- ویژگی‌های خصوصی: فقط با داشتن `features.allowedFeatures` در توکن

## نکات مهم
- لنزها و الگوی volume-boost مژه فقط برای مشتریان خاص فعال می‌شوند
- بقیه ویژگی‌ها و الگوها برای همه کاربران فعال هستند
- ویژگی‌ها و الگوهای خصوصی در کد کامنت شده‌اند و فقط با توکن مخصوص فعال می‌شوند
