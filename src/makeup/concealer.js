// src/makeup/concealer.js

import {
  convertHexToRgbString,
  getPlatformSpecificSettings,
  isSafariBrowser,
} from "../utils";

let concealerColor = "#f2cf97";
let concealerOpacity = isSafariBrowser ? 0.12 : 0.18;
let concealerPattern = "normal";
let platformSettings = getPlatformSpecificSettings();

export function changeConcealerColor(color) {
  concealerColor = color;
}

export function setConcealerOpacity(opacity) {
  concealerOpacity = Math.max(0, Math.min(0.5, opacity));
}

export function setConcealerPattern(pattern) {
  if (["normal"].includes(pattern)) {
    concealerPattern = pattern;
  }
}

export function applyConcealer(landmarks, canvasCtx) {
  const width = canvasCtx.canvas.width;
  const height = canvasCtx.canvas.height;

  // نقاط چشم راست و چپ (بدون تغییر)
  const rightEyeLids = {
    // upper: [
    //   156, 46, 53, 52, 65, 55, 193, 189, 244, 243, 133, 173, 157, 158, 159, 160,
    //   161, 246, 33, 130, 226, 35, 143,
    // ],
    lower: [
      143, 35, 226, 25, 110, 24, 23, 22, 26, 112, 243, 244, 245, 128, 121, 120,
      119, 118, 117, 111,
    ],
  };

  const leftEyeLids = {
    // upper: [
    //   383, 276, 283, 282, 295, 285, 417, 351, 465, 464, 463, 362, 398, 384, 385,
    //   386, 387, 388, 466, 263, 359, 446, 265, 372,
    // ],
    lower: [
      372, 265, 446, 359, 255, 339, 254, 253, 252, 256, 341, 464, 465, 351, 412,
      357, 350, 349, 348, 347, 346, 340,
    ],
  };

  canvasCtx.save();

  // تنظیم کیفیت رندرینگ
  canvasCtx.imageSmoothingEnabled = true;
  canvasCtx.imageSmoothingQuality = "high";

  // اعمال فیلتر blur مناسب پلتفرم
  canvasCtx.filter = `blur(${platformSettings.blur})`;
  canvasCtx.globalCompositeOperation = platformSettings.blendMode;

  // رندر لایه‌های کانسیلر
  // drawConcealerLayer(
  //   landmarks,
  //   canvasCtx,
  //   leftEyeLids.upper,
  //   width,
  //   height,
  //   true
  // );
  drawConcealerLayer(
    landmarks,
    canvasCtx,
    leftEyeLids.lower,
    width,
    height
    // false
  );
  // drawConcealerLayer(
  //   landmarks,
  //   canvasCtx,
  //   rightEyeLids.upper,
  //   width,
  //   height,
  //   true
  // );
  drawConcealerLayer(
    landmarks,
    canvasCtx,
    rightEyeLids.lower,
    width,
    height
    // false
  );

  canvasCtx.restore();
}

function drawConcealerLayer(
  landmarks,
  canvasCtx,
  points,
  width,
  height
  // isUpper
) {
  const centerPoint = getCenterPoint(landmarks, points, width, height);
  const baseRadius = getMaxRadius(landmarks, points, width, height);

  drawSmoothPath(landmarks, canvasCtx, points, width, height);

  if (isSafariBrowser) {
    // تنظیمات مخصوص Safari
    const baseGradient = canvasCtx.createRadialGradient(
      centerPoint.x,
      centerPoint.y,
      baseRadius * 0.1,
      centerPoint.x,
      centerPoint.y,
      baseRadius * 3.2
    );

    const adjustedOpacity = Math.min(concealerOpacity * 0.7, 0.2);

    baseGradient.addColorStop(
      0,
      `rgba(${convertHexToRgbString(concealerColor)}, ${adjustedOpacity})`
    );
    baseGradient.addColorStop(
      0.1,
      `rgba(${convertHexToRgbString(concealerColor)}, ${
        adjustedOpacity * 0.95
      })`
    );
    baseGradient.addColorStop(
      0.2,
      `rgba(${convertHexToRgbString(concealerColor)}, ${adjustedOpacity * 0.9})`
    );
    baseGradient.addColorStop(
      0.3,
      `rgba(${convertHexToRgbString(concealerColor)}, ${adjustedOpacity * 0.8})`
    );
    baseGradient.addColorStop(
      0.4,
      `rgba(${convertHexToRgbString(concealerColor)}, ${adjustedOpacity * 0.6})`
    );
    baseGradient.addColorStop(
      0.5,
      `rgba(${convertHexToRgbString(concealerColor)}, ${adjustedOpacity * 0.4})`
    );
    baseGradient.addColorStop(
      0.7,
      `rgba(${convertHexToRgbString(concealerColor)}, ${adjustedOpacity * 0.2})`
    );
    baseGradient.addColorStop(
      0.8,
      `rgba(${convertHexToRgbString(concealerColor)}, ${adjustedOpacity * 0.1})`
    );
    baseGradient.addColorStop(
      0.9,
      `rgba(${convertHexToRgbString(concealerColor)}, ${
        adjustedOpacity * 0.05
      })`
    );
    baseGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    canvasCtx.globalCompositeOperation = "multiply";
    canvasCtx.fillStyle = baseGradient;
    canvasCtx.fill();

    // canvasCtx.globalCompositeOperation = "overlay"; // تغییر دادیم
    // canvasCtx.globalAlpha = 0.12; // تغییر دادیم
    // canvasCtx.fill();

    // لایه محو کننده اضافی
    let extraEdgeGradient = canvasCtx.createRadialGradient(
      centerPoint.x,
      centerPoint.y,
      baseRadius * 0.3,
      centerPoint.x,
      centerPoint.y,
      baseRadius * 2.8
    );

    // تغییرات در لایه محو کننده
    if (false) {
      // میتونید این رو true کنید و نتیجه رو تست کنید
      extraEdgeGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      extraEdgeGradient.addColorStop(0.4, "rgba(0, 0, 0, 0.01)");
      extraEdgeGradient.addColorStop(0.6, "rgba(0, 0, 0, 0.02)");
      extraEdgeGradient.addColorStop(0.8, "rgba(0, 0, 0, 0.03)");
      extraEdgeGradient.addColorStop(1, "rgba(0, 0, 0, 0.05)");

      canvasCtx.globalCompositeOperation = "destination-out";
      canvasCtx.fillStyle = extraEdgeGradient;
      canvasCtx.globalAlpha = 0.8;
      canvasCtx.fill();
    } else {
      extraEdgeGradient = canvasCtx.createRadialGradient(
        centerPoint.x,
        centerPoint.y,
        baseRadius * 0.1,
        centerPoint.x,
        centerPoint.y,
        baseRadius * 3.5
      );
      extraEdgeGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      extraEdgeGradient.addColorStop(0.5, "rgba(0, 0, 0, 0.02)");
      extraEdgeGradient.addColorStop(1, "rgba(0, 0, 0, 0.1)");
    }

    canvasCtx.globalCompositeOperation = "destination-out"; // یا "soft-light"
    canvasCtx.fillStyle = extraEdgeGradient;
    canvasCtx.globalAlpha = 0.8;
    canvasCtx.fill();
  } else {
    // تنظیمات برای سایر مرورگرها
    const baseGradient = canvasCtx.createRadialGradient(
      centerPoint.x,
      centerPoint.y,
      0,
      centerPoint.x,
      centerPoint.y,
      baseRadius * 1.8
    );

    const adjustedOpacity = Math.min(concealerOpacity * 1.2, 0.35);

    baseGradient.addColorStop(
      0,
      `rgba(${convertHexToRgbString(concealerColor)}, ${adjustedOpacity})`
    );
    baseGradient.addColorStop(
      0.3,
      `rgba(${convertHexToRgbString(concealerColor)}, ${adjustedOpacity * 0.8})`
    );
    baseGradient.addColorStop(
      0.6,
      `rgba(${convertHexToRgbString(concealerColor)}, ${adjustedOpacity * 0.5})`
    );
    baseGradient.addColorStop(
      0.8,
      `rgba(${convertHexToRgbString(concealerColor)}, ${adjustedOpacity * 0.2})`
    );
    baseGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    canvasCtx.globalCompositeOperation = "soft-light"; // تغییر دادیم
    canvasCtx.fillStyle = baseGradient;
    canvasCtx.fill();

    canvasCtx.filter = `blur(${Math.max(8, baseRadius * 0.1)}px)`;
    canvasCtx.globalCompositeOperation = "soft-light";
    canvasCtx.globalAlpha = 0.3;
    canvasCtx.fill();
    canvasCtx.filter = "none";
  }

  // لایه محوکننده نهایی برای همه مرورگرها
  canvasCtx.globalCompositeOperation = "destination-out";
  const edgeGradient = canvasCtx.createRadialGradient(
    centerPoint.x,
    centerPoint.y,
    baseRadius * 0.4,
    centerPoint.x,
    centerPoint.y,
    baseRadius * 2.2
  );

  if (isSafariBrowser) {
    edgeGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    edgeGradient.addColorStop(0.2, "rgba(0, 0, 0, 0.01)");
    edgeGradient.addColorStop(0.4, "rgba(0, 0, 0, 0.02)");
    edgeGradient.addColorStop(0.6, "rgba(0, 0, 0, 0.03)");
    edgeGradient.addColorStop(0.8, "rgba(0, 0, 0, 0.04)");
    edgeGradient.addColorStop(0.9, "rgba(0, 0, 0, 0.05)");
    edgeGradient.addColorStop(1, "rgba(0, 0, 0, 0.1)"); // تغییر دادیم
    canvasCtx.globalAlpha = 0.6; // تغییر دادیم
  } else {
    edgeGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    edgeGradient.addColorStop(0.3, "rgba(0, 0, 0, 0.05)");
    edgeGradient.addColorStop(0.5, "rgba(0, 0, 0, 0.1)");
    edgeGradient.addColorStop(0.7, "rgba(0, 0, 0, 0.25)"); // تغییر دادیم
    edgeGradient.addColorStop(1, "rgba(0, 0, 0, 0.4)");
    canvasCtx.globalAlpha = 0.8;
  }

  canvasCtx.fillStyle = edgeGradient;
  canvasCtx.fill();

  canvasCtx.filter = "none";
  canvasCtx.globalCompositeOperation = "source-over";
  canvasCtx.globalAlpha = 1;
}

function drawSmoothPath(landmarks, canvasCtx, points, width, height) {
  canvasCtx.beginPath();
  const pathPoints = points.map((point) => ({
    x: landmarks[point].x * width,
    y: landmarks[point].y * height,
  }));

  const centerPoint = {
    x: pathPoints.reduce((sum, p) => sum + p.x, 0) / pathPoints.length,
    y: pathPoints.reduce((sum, p) => sum + p.y, 0) / pathPoints.length,
  };

  canvasCtx.moveTo(pathPoints[0].x, pathPoints[0].y);

  for (let i = 1; i < pathPoints.length - 2; i++) {
    const xc = (pathPoints[i].x + pathPoints[i + 1].x) / 2;
    const yc = (pathPoints[i].y + pathPoints[i + 1].y) / 2;

    const distanceFromCenter = Math.sqrt(
      Math.pow(centerPoint.x - pathPoints[i].x, 2) +
        Math.pow(centerPoint.y - pathPoints[i].y, 2)
    );

    const tension = Math.min(0.15, distanceFromCenter / (width * 0.12));

    const cp1x = pathPoints[i].x + (xc - pathPoints[i - 1].x) * tension;
    const cp1y = pathPoints[i].y + (yc - pathPoints[i - 1].y) * tension;

    canvasCtx.quadraticCurveTo(cp1x, cp1y, xc, yc);
  }

  const last = pathPoints.length - 1;
  canvasCtx.quadraticCurveTo(
    pathPoints[last - 1].x,
    pathPoints[last - 1].y,
    pathPoints[last].x,
    pathPoints[last].y
  );
}

// توابع کمکی بدون تغییر
function getCenterPoint(landmarks, points, width, height) {
  let sumX = 0,
    sumY = 0;
  points.forEach((point) => {
    sumX += landmarks[point].x * width;
    sumY += landmarks[point].y * height;
  });
  return {
    x: sumX / points.length,
    y: sumY / points.length,
  };
}

function getMaxRadius(landmarks, points, width, height) {
  const center = getCenterPoint(landmarks, points, width, height);
  let maxDist = 0;
  points.forEach((point) => {
    const x = landmarks[point].x * width;
    const y = landmarks[point].y * height;
    const dist = Math.sqrt(
      Math.pow(x - center.x, 2) + Math.pow(y - center.y, 2)
    );
    maxDist = Math.max(maxDist, dist);
  });
  return maxDist;
}

export default {
  changeConcealerColor,
  setConcealerOpacity,
  setConcealerPattern,
  applyConcealer,
};
