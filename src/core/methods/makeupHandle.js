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

export {
  changeMakeupColor,
  setMakeupPattern,
  setMakeupTransparency,
  applyMakeup,
};
