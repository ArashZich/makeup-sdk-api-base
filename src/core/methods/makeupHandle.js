// src/core/methods/makeupHandle.js

import {
  // lips
  changeLipstickColor,
  setLipstickPattern,
  setLipstickTransparency,
  applyLipstick,

  // eyeshadow
  changeEyeshadowColor,
  setEyeshadowPattern,
  setEyeshadowTransparency,
  applyEyeshadow,

  // eyepencil
  changeEyepencilColor,
  setEyepencilThickness,
  setEyepencilStyle,
  applyEyepencil,

  // eyelashes
  changeEyelashesColor,
  setEyelashesThickness,
  setEyelashesStyle,
  applyEyelashes,

  // blush
  changeBlushColor,
  setBlushPattern,
  setBlushTransparency,
  applyBlush,

  // foundation
  changeFoundationColor,
  setFoundationPattern,
  setFoundationOpacity,
  applyFoundation,

  // brows
  changeBrowsColor,
  setBrowsOpacity,
  setBrowsStyle,
  applyBrows,

  // concealer
  changeConcealerColor,
  setConcealerOpacity,
  setConcealerPattern,
  applyConcealer,

  // eyeliner
  changeEyelinerColor,
  setEyelinerStyle,
  setEyelinerThickness,
  applyEyeliner,

  // lens
  changeLensColor,
  setLensPattern,
  setLensOpacity,
  applyLens,
} from "../../makeup";

/**
 * تغییر رنگ آرایش بر اساس نوع
 * @param {string} part - نوع آرایش
 * @param {string} color - کد رنگ هگز
 */
function changeMakeupColor(part, color) {
  if (part === "lips") {
    changeLipstickColor(color);
  } else if (part === "eyeshadow") {
    changeEyeshadowColor(color);
  } else if (part === "eyepencil") {
    changeEyepencilColor(color);
  } else if (part === "eyelashes") {
    changeEyelashesColor(color);
  } else if (part === "blush") {
    changeBlushColor(color);
  } else if (part === "foundation") {
    changeFoundationColor(color);
  } else if (part === "brows") {
    changeBrowsColor(color);
  } else if (part === "concealer") {
    changeConcealerColor(color);
  } else if (part === "eyeliner") {
    changeEyelinerColor(color);
  } else if (part === "lens") {
    changeLensColor(color);
  }
}

/**
 * تنظیم pattern آرایش بر اساس نوع
 * @param {string} part - نوع آرایش
 * @param {string} pattern - کد pattern (lowercase)
 */
function setMakeupPattern(part, pattern) {
  if (part === "lips") {
    setLipstickPattern(pattern);
  } else if (part === "eyeshadow") {
    setEyeshadowPattern(pattern);
  } else if (part === "eyepencil") {
    setEyepencilStyle(pattern);
  } else if (part === "eyelashes") {
    setEyelashesStyle(pattern);
  } else if (part === "blush") {
    setBlushPattern(pattern);
  } else if (part === "foundation") {
    setFoundationPattern(pattern);
  } else if (part === "brows") {
    setBrowsStyle(pattern);
  } else if (part === "concealer") {
    setConcealerPattern(pattern);
  } else if (part === "eyeliner") {
    setEyelinerStyle(pattern);
  } else if (part === "lens") {
    setLensPattern(pattern);
  }
}

/**
 * تنظیم شفافیت آرایش بر اساس نوع
 * @param {string} part - نوع آرایش
 * @param {number} transparency - مقدار شفافیت (0-1)
 */
function setMakeupTransparency(part, transparency) {
  if (part === "lips") {
    setLipstickTransparency(transparency);
  } else if (part === "eyeshadow") {
    setEyeshadowTransparency(transparency);
  } else if (part === "eyepencil") {
    setEyepencilThickness(transparency * 5);
  } else if (part === "eyelashes") {
    setEyelashesThickness(transparency * 2);
  } else if (part === "blush") {
    setBlushTransparency(transparency);
  } else if (part === "foundation") {
    setFoundationOpacity(transparency);
  } else if (part === "brows") {
    setBrowsOpacity(transparency);
  } else if (part === "concealer") {
    setConcealerOpacity(transparency);
  } else if (part === "eyeliner") {
    setEyelinerThickness(transparency * 3);
  } else if (part === "lens") {
    setLensOpacity(transparency);
  }
}

/**
 * اعمال آرایش بر اساس نوع
 * @param {Object} landmarks - نقاط مرجع صورت
 * @param {CanvasRenderingContext2D} canvasCtx - کانتکست canvas
 * @param {string} makeupType - نوع آرایش
 * @param {Object} featureManager - مدیر ویژگی‌ها
 */
function applyMakeup(landmarks, canvasCtx, makeupType, featureManager) {
  // اول چک کنیم که آیا این ویژگی مجاز است
  if (!featureManager.isFeatureEnabled(makeupType)) {
    return; // اگر مجاز نیست هیچ کاری انجام نده
  }

  if (makeupType === "lips") {
    applyLipstick(landmarks, canvasCtx);
  } else if (makeupType === "eyeshadow") {
    applyEyeshadow(landmarks, canvasCtx);
  } else if (makeupType === "eyepencil") {
    applyEyepencil(landmarks, canvasCtx);
  } else if (makeupType === "eyelashes") {
    applyEyelashes(landmarks, canvasCtx);
  } else if (makeupType === "blush") {
    applyBlush(landmarks, canvasCtx);
  } else if (makeupType === "foundation") {
    applyFoundation(landmarks, canvasCtx);
  } else if (makeupType === "brows") {
    applyBrows(landmarks, canvasCtx);
  } else if (makeupType === "concealer") {
    applyConcealer(landmarks, canvasCtx);
  } else if (makeupType === "eyeliner") {
    applyEyeliner(landmarks, canvasCtx);
  } else if (makeupType === "lens") {
    applyLens(landmarks, canvasCtx);
  }
}

/**
 * اعمال کامل تنظیمات آرایش (رنگ، pattern و شفافیت)
 * @param {string} makeupType - نوع آرایش
 * @param {string} color - کد رنگ هگز
 * @param {string} pattern - کد pattern
 * @param {number} transparency - مقدار شفافیت
 */
function applyCompleteConfiguration(makeupType, color, pattern, transparency) {
  if (color) {
    changeMakeupColor(makeupType, color);
  }

  if (pattern) {
    setMakeupPattern(makeupType, pattern);
  }

  if (transparency !== undefined && transparency !== null) {
    setMakeupTransparency(makeupType, transparency);
  }
}

/**
 * دریافت تنظیمات فعلی آرایش (برای debugging و monitoring)
 * @param {string} makeupType - نوع آرایش
 * @returns {Object} تنظیمات فعلی
 */
function getCurrentMakeupSettings(makeupType) {
  // این تابع می‌تواند برای debugging استفاده شود
  // فعلاً placeholder است و می‌تواند بعداً تکمیل شود
  return {
    type: makeupType,
    timestamp: Date.now(),
    // می‌توان مقادیر فعلی رنگ، pattern و شفافیت را از ماژول‌های مربوطه دریافت کرد
  };
}

/**
 * ری‌ست کردن تنظیمات آرایش به حالت پیش‌فرض
 * @param {string} makeupType - نوع آرایش
 */
function resetMakeupSettings(makeupType) {
  // تنظیم مقادیر پیش‌فرض
  const defaultSettings = {
    lips: { color: "#FF0000", pattern: "normal", transparency: 0.65 },
    eyeshadow: { color: "#8A2BE2", pattern: "normal", transparency: 0.5 },
    eyepencil: { color: "#000000", pattern: "normal", transparency: 0.8 },
    eyelashes: { color: "#000000", pattern: "long-lash", transparency: 0.8 },
    blush: { color: "#FF6B6B", pattern: "normal", transparency: 0.4 },
    foundation: { color: "#FFD5AA", pattern: "normal", transparency: 0.3 },
    brows: { color: "#4A2C2A", pattern: "normal", transparency: 0.5 },
    concealer: { color: "#f2cf97", pattern: "normal", transparency: 0.18 },
    eyeliner: { color: "#000000", pattern: "normal", transparency: 0.8 },
    lens: { color: "#1C1C1C", pattern: "rainbow", transparency: 0.8 },
  };

  const settings = defaultSettings[makeupType];
  if (settings) {
    applyCompleteConfiguration(
      makeupType,
      settings.color,
      settings.pattern,
      settings.transparency
    );
  }
}

export {
  changeMakeupColor,
  setMakeupPattern,
  setMakeupTransparency,
  applyMakeup,
  applyCompleteConfiguration,
  getCurrentMakeupSettings,
  resetMakeupSettings,
};
