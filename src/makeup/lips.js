// src/makeup/lips.js - کد بهینه‌شده برای ظاهر طبیعی‌تر رژ لب با حفظ کارایی

import { convertHexToRgba } from "../utils";

let lipstickColor = "#FF0000";
let transparency = 0.65; // کاهش شفافیت پیش‌فرض برای حالت طبیعی‌تر
let pattern = "normal";

// نقاط مرزی لب
const LIPS_OUTER = [
  61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84,
  181, 91, 146, 61,
];

// نقاط داخلی لب
const LIPS_INNER = [
  78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87,
  178, 88, 95, 78,
];

const UPPER_LIP_POINTS = [61, 185, 40, 39, 37, 0, 267, 269, 270];
const LOWER_LIP_POINTS = [291, 375, 321, 405, 314, 17, 84, 181, 91, 146];

// نقاط مشخص برای هایلایت
const UPPER_LIP_HIGHLIGHTS = [73, 11, 303];
const LOWER_LIP_HIGHLIGHTS = [180, 16, 404];

// تنظیمات ساده برای افکت‌های مختلف
const ENHANCEMENT_SETTINGS = {
  shadowOpacity: 0.12,
  highlightOpacity: 0.05,
  edgeBlending: 0.08,
};

function changeLipstickColor(color) {
  lipstickColor = color;
}

function setLipstickPattern(newPattern) {
  pattern = newPattern;
}

function setLipstickTransparency(newTransparency) {
  transparency = newTransparency;
}

function applyLipstick(landmarks, canvasCtx) {
  try {
    if (!landmarks || !canvasCtx || !lipstickColor) {
      return;
    }

    canvasCtx.save();

    // انتخاب افکت مناسب بر اساس الگو
    if (pattern === "normal") {
      applyNaturalLipstick(landmarks, canvasCtx);
    } else if (pattern === "matte") {
      applyMatteLipstick(landmarks, canvasCtx);
    } else if (pattern === "glossy") {
      applyGlossyLipstick(landmarks, canvasCtx);
    } else if (pattern === "glitter") {
      applyGlitterLipstick(landmarks, canvasCtx);
    }

    canvasCtx.restore();
  } catch (error) {
    console.error(`خطا در اعمال رژ لب: ${error.message}`);
  }
}

// افکت رژ لب طبیعی - بهینه‌شده و ساده‌تر
function applyNaturalLipstick(landmarks, canvasCtx) {
  // لایه پایه با کنترل شفافیت
  canvasCtx.fillStyle = convertHexToRgba(lipstickColor, transparency * 0.8);
  canvasCtx.globalAlpha = transparency * 0.8;
  drawLipPath(landmarks, canvasCtx);
  canvasCtx.fill("evenodd");

  // لایه محو کننده لبه‌ها برای ترکیب با پوست
  canvasCtx.globalCompositeOperation = "destination-out";
  canvasCtx.globalAlpha = ENHANCEMENT_SETTINGS.edgeBlending;
  applySimpleEdgeBlending(landmarks, canvasCtx);

  // اضافه کردن هایلایت ملایم برای حجم دادن به لب
  canvasCtx.globalCompositeOperation = "overlay";
  canvasCtx.globalAlpha = ENHANCEMENT_SETTINGS.highlightOpacity;
  applySimpleLipHighlight(landmarks, canvasCtx);
}

// افکت رژ لب مات - بهینه‌شده و ساده‌تر
function applyMatteLipstick(landmarks, canvasCtx) {
  // لایه پایه با شفافیت کمتر برای حالت مات
  canvasCtx.fillStyle = convertHexToRgba(lipstickColor, transparency * 0.7);
  canvasCtx.globalAlpha = transparency * 0.7;
  drawLipPath(landmarks, canvasCtx);
  canvasCtx.fill("evenodd");

  // لایه تیره‌کننده برای ایجاد حالت مات
  canvasCtx.globalCompositeOperation = "color-burn";
  canvasCtx.fillStyle = `rgba(40, 40, 40, 0.1)`;
  canvasCtx.globalAlpha = 0.15;
  drawLipPath(landmarks, canvasCtx);
  canvasCtx.fill("evenodd");

  // محو کردن لبه‌ها برای ترکیب بهتر با پوست
  canvasCtx.globalCompositeOperation = "destination-out";
  canvasCtx.globalAlpha = ENHANCEMENT_SETTINGS.edgeBlending * 1.5; // محو بیشتر برای حالت مات
  applySimpleEdgeBlending(landmarks, canvasCtx);
}

// افکت رژ لب براق - بهینه‌شده و ساده‌تر
function applyGlossyLipstick(landmarks, canvasCtx) {
  // لایه پایه رنگ
  canvasCtx.fillStyle = convertHexToRgba(lipstickColor, transparency * 0.6);
  canvasCtx.globalAlpha = transparency * 0.6;
  drawLipPath(landmarks, canvasCtx);
  canvasCtx.fill("evenodd");

  // افزودن درخشندگی
  canvasCtx.globalCompositeOperation = "overlay";
  canvasCtx.globalAlpha = transparency * 0.5;
  applySimpleGlossEffect(landmarks, canvasCtx);

  // هایلایت‌های مشخص
  canvasCtx.globalCompositeOperation = "lighter";
  canvasCtx.globalAlpha = transparency * 0.3;
  applySimpleHighlights(landmarks, canvasCtx);
}

// افکت رژ لب اکلیلی - بهینه‌شده و ساده‌تر
function applyGlitterLipstick(landmarks, canvasCtx) {
  // لایه پایه
  canvasCtx.fillStyle = convertHexToRgba(lipstickColor, transparency * 0.7);
  canvasCtx.globalAlpha = transparency * 0.7;
  drawLipPath(landmarks, canvasCtx);
  canvasCtx.fill("evenodd");

  // افزودن اکلیل ساده
  canvasCtx.globalCompositeOperation = "screen";
  canvasCtx.globalAlpha = transparency * 0.6;
  applySimpleGlitterEffect(landmarks, canvasCtx);
}

// ترسیم مسیر کامل لب - بهینه‌شده
function drawLipPath(landmarks, canvasCtx) {
  canvasCtx.beginPath();

  // مسیر خارجی
  if (landmarks[LIPS_OUTER[0]]) {
    moveTo(canvasCtx, landmarks[LIPS_OUTER[0]]);
    for (const index of LIPS_OUTER) {
      if (landmarks[index]) {
        lineTo(canvasCtx, landmarks[index]);
      }
    }
    canvasCtx.closePath();
  }

  // مسیر داخلی
  if (landmarks[LIPS_INNER[0]]) {
    moveTo(canvasCtx, landmarks[LIPS_INNER[0]]);
    for (const index of LIPS_INNER) {
      if (landmarks[index]) {
        lineTo(canvasCtx, landmarks[index]);
      }
    }
    canvasCtx.closePath();
  }
}

// محو کردن لبه‌های لب برای ترکیب طبیعی‌تر - ساده‌شده
function applySimpleEdgeBlending(landmarks, canvasCtx) {
  // محاسبه مرکز و شعاع لب
  const centerPoint = getLipCenter(landmarks, canvasCtx);
  if (!centerPoint) return;

  const radius = getLipRadius(landmarks, centerPoint, canvasCtx);

  // ایجاد گرادیان ساده برای محو لبه‌ها
  const gradient = canvasCtx.createRadialGradient(
    centerPoint.x,
    centerPoint.y,
    radius * 0.6,
    centerPoint.x,
    centerPoint.y,
    radius * 1.2
  );

  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(0.7, "rgba(0, 0, 0, 0.1)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.2)");

  canvasCtx.fillStyle = gradient;
  drawLipPath(landmarks, canvasCtx);
  canvasCtx.fill("evenodd");
}

// هایلایت ساده برای لب‌ها
function applySimpleLipHighlight(landmarks, canvasCtx) {
  const centerPoint = getLipCenter(landmarks, canvasCtx);
  if (!centerPoint) return;

  const radius = getLipRadius(landmarks, centerPoint, canvasCtx);

  // ایجاد گرادیان نورانی ساده
  const gradient = canvasCtx.createRadialGradient(
    centerPoint.x,
    centerPoint.y - radius * 0.2,
    0,
    centerPoint.x,
    centerPoint.y - radius * 0.2,
    radius * 0.8
  );

  gradient.addColorStop(0, "rgba(255, 255, 255, 0.3)");
  gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.1)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  canvasCtx.fillStyle = gradient;
  drawLipPath(landmarks, canvasCtx);
  canvasCtx.fill("evenodd");
}

// افکت براقی ساده
function applySimpleGlossEffect(landmarks, canvasCtx) {
  const upperLipCenter = getUpperLipCenter(landmarks, canvasCtx);
  const lowerLipCenter = getLowerLipCenter(landmarks, canvasCtx);

  if (!upperLipCenter || !lowerLipCenter) return;

  // براقیت لب بالا
  const upperGradient = canvasCtx.createLinearGradient(
    upperLipCenter.x,
    upperLipCenter.y - 10,
    upperLipCenter.x,
    upperLipCenter.y + 5
  );

  upperGradient.addColorStop(0, "rgba(255, 255, 255, 0.2)");
  upperGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.3)");
  upperGradient.addColorStop(1, "rgba(255, 255, 255, 0.1)");

  canvasCtx.fillStyle = upperGradient;
  drawPartialLipPath(landmarks, canvasCtx, UPPER_LIP_POINTS);

  // براقیت لب پایین
  const lowerGradient = canvasCtx.createLinearGradient(
    lowerLipCenter.x,
    lowerLipCenter.y - 5,
    lowerLipCenter.x,
    lowerLipCenter.y + 10
  );

  lowerGradient.addColorStop(0, "rgba(255, 255, 255, 0.1)");
  lowerGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.3)");
  lowerGradient.addColorStop(1, "rgba(255, 255, 255, 0.2)");

  canvasCtx.fillStyle = lowerGradient;
  drawPartialLipPath(landmarks, canvasCtx, LOWER_LIP_POINTS);
}

// هایلایت‌های نقطه‌ای ساده
function applySimpleHighlights(landmarks, canvasCtx) {
  // هایلایت‌های لب بالا
  if (landmarks[UPPER_LIP_HIGHLIGHTS[0]]) {
    const x1 = landmarks[UPPER_LIP_HIGHLIGHTS[0]].x * canvasCtx.canvas.width;
    const y1 = landmarks[UPPER_LIP_HIGHLIGHTS[0]].y * canvasCtx.canvas.height;

    const gradient1 = canvasCtx.createRadialGradient(x1, y1, 0, x1, y1, 3);
    gradient1.addColorStop(0, "rgba(255, 255, 255, 0.5)");
    gradient1.addColorStop(1, "rgba(255, 255, 255, 0)");

    canvasCtx.fillStyle = gradient1;
    canvasCtx.beginPath();
    canvasCtx.arc(x1, y1, 3, 0, Math.PI * 2);
    canvasCtx.fill();
  }

  // هایلایت‌های لب پایین
  if (landmarks[LOWER_LIP_HIGHLIGHTS[0]]) {
    const x2 = landmarks[LOWER_LIP_HIGHLIGHTS[0]].x * canvasCtx.canvas.width;
    const y2 = landmarks[LOWER_LIP_HIGHLIGHTS[0]].y * canvasCtx.canvas.height;

    const gradient2 = canvasCtx.createRadialGradient(x2, y2, 0, x2, y2, 3);
    gradient2.addColorStop(0, "rgba(255, 255, 255, 0.5)");
    gradient2.addColorStop(1, "rgba(255, 255, 255, 0)");

    canvasCtx.fillStyle = gradient2;
    canvasCtx.beginPath();
    canvasCtx.arc(x2, y2, 3, 0, Math.PI * 2);
    canvasCtx.fill();
  }
}

// افکت اکلیل ساده - اصلاح شده برای نمایش فقط روی لب
function applySimpleGlitterEffect(landmarks, canvasCtx) {
  const centerPoint = getLipCenter(landmarks, canvasCtx);
  if (!centerPoint) return;

  const radius = getLipRadius(landmarks, centerPoint, canvasCtx);
  const glitterCount = 30; // تعداد بیشتر چون بعضی‌ها فیلتر می‌شوند

  // ابتدا یک مسیر لب ایجاد می‌کنیم (بدون پر کردن) - فقط برای تست نقاط
  canvasCtx.save();

  // ایجاد مسیر لب
  canvasCtx.beginPath();
  if (landmarks[LIPS_OUTER[0]]) {
    moveTo(canvasCtx, landmarks[LIPS_OUTER[0]]);
    for (const index of LIPS_OUTER) {
      if (landmarks[index]) {
        lineTo(canvasCtx, landmarks[index]);
      }
    }
    canvasCtx.closePath();
  }

  // تلاش برای ایجاد اکلیل‌های تصادفی داخل لب
  for (let i = 0; i < glitterCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius * 0.9;

    const x = centerPoint.x + Math.cos(angle) * distance;
    const y = centerPoint.y + Math.sin(angle) * distance;

    // بررسی اینکه آیا نقطه داخل مسیر لب قرار دارد
    if (canvasCtx.isPointInPath(x, y)) {
      // اندازه متغیر
      const size = Math.random() * 2 + 1;

      // گرادیان ساده برای اکلیل
      const gradient = canvasCtx.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, "rgba(255, 255, 255, 0.8)");
      gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.4)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

      canvasCtx.fillStyle = gradient;
      canvasCtx.beginPath();
      canvasCtx.arc(x, y, size, 0, Math.PI * 2);
      canvasCtx.fill();
    }
  }

  // روش دوم: اکلیل‌ها در نقاط مشخص لب
  // برای اطمینان بیشتر، برخی نقاط مشخص روی لب هم اکلیلی می‌شوند
  const glitterPoints = [
    // نقاط کلیدی روی لب
    0, 267, 269, 13, 14, 17, 405, 61, 291, 375, 181,
  ];

  glitterPoints.forEach((pointIndex) => {
    if (landmarks[pointIndex]) {
      const x = landmarks[pointIndex].x * canvasCtx.canvas.width;
      const y = landmarks[pointIndex].y * canvasCtx.canvas.height;

      // اندازه متغیر برای این نقاط
      const size = Math.random() * 1.5 + 0.8;

      // گرادیان برای اکلیل‌های نقاط کلیدی
      const gradient = canvasCtx.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, "rgba(255, 255, 255, 0.7)");
      gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.35)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

      canvasCtx.fillStyle = gradient;
      canvasCtx.beginPath();
      canvasCtx.arc(x, y, size, 0, Math.PI * 2);
      canvasCtx.fill();
    }
  });

  canvasCtx.restore();
}

// ترسیم قسمتی از مسیر لب
function drawPartialLipPath(landmarks, canvasCtx, points) {
  if (!landmarks || !points) return;

  canvasCtx.beginPath();
  if (landmarks[points[0]]) {
    moveTo(canvasCtx, landmarks[points[0]]);
    points.forEach((index) => {
      if (landmarks[index]) {
        lineTo(canvasCtx, landmarks[index]);
      }
    });
    canvasCtx.closePath();
    canvasCtx.fill();
  }
}

// حرکت به نقطه مشخص
function moveTo(ctx, landmark) {
  ctx.moveTo(landmark.x * ctx.canvas.width, landmark.y * ctx.canvas.height);
}

// کشیدن خط به نقطه مشخص
function lineTo(ctx, landmark) {
  ctx.lineTo(landmark.x * ctx.canvas.width, landmark.y * ctx.canvas.height);
}

// محاسبه مرکز کلی لب
function getLipCenter(landmarks, canvasCtx) {
  if (!landmarks || !canvasCtx) return null;

  let sumX = 0,
    sumY = 0,
    count = 0;

  [...LIPS_OUTER, ...LIPS_INNER].forEach((index) => {
    if (landmarks[index]) {
      sumX += landmarks[index].x * canvasCtx.canvas.width;
      sumY += landmarks[index].y * canvasCtx.canvas.height;
      count++;
    }
  });

  if (count === 0) return null;

  return {
    x: sumX / count,
    y: sumY / count,
  };
}

// محاسبه مرکز لب بالا
function getUpperLipCenter(landmarks, canvasCtx) {
  if (!landmarks || !canvasCtx) return null;

  let sumX = 0,
    sumY = 0,
    count = 0;

  UPPER_LIP_POINTS.forEach((index) => {
    if (landmarks[index]) {
      sumX += landmarks[index].x * canvasCtx.canvas.width;
      sumY += landmarks[index].y * canvasCtx.canvas.height;
      count++;
    }
  });

  if (count === 0) return null;

  return {
    x: sumX / count,
    y: sumY / count,
  };
}

// محاسبه مرکز لب پایین
function getLowerLipCenter(landmarks, canvasCtx) {
  if (!landmarks || !canvasCtx) return null;

  let sumX = 0,
    sumY = 0,
    count = 0;

  LOWER_LIP_POINTS.forEach((index) => {
    if (landmarks[index]) {
      sumX += landmarks[index].x * canvasCtx.canvas.width;
      sumY += landmarks[index].y * canvasCtx.canvas.height;
      count++;
    }
  });

  if (count === 0) return null;

  return {
    x: sumX / count,
    y: sumY / count,
  };
}

// محاسبه شعاع لب
function getLipRadius(landmarks, center, canvasCtx) {
  if (!landmarks || !center || !canvasCtx) return 15; // مقدار پیش‌فرض

  let maxDist = 0;

  LIPS_OUTER.forEach((index) => {
    if (landmarks[index]) {
      const x = landmarks[index].x * canvasCtx.canvas.width;
      const y = landmarks[index].y * canvasCtx.canvas.height;
      const dist = Math.sqrt(
        Math.pow(x - center.x, 2) + Math.pow(y - center.y, 2)
      );
      maxDist = Math.max(maxDist, dist);
    }
  });

  return maxDist || 15; // برگرداندن حداکثر فاصله یا مقدار پیش‌فرض
}

export {
  changeLipstickColor,
  setLipstickPattern,
  setLipstickTransparency,
  applyLipstick,
};
