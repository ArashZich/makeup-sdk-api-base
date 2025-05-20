// src/makeup/foundation.js
import { convertHexToRgbObject } from "../utils";

let foundationColor = "#FFD5AA";
let foundationOpacity = 0.3; // کاهش شفافیت برای اثر طبیعی‌تر
let foundationPattern = "normal";

export function changeFoundationColor(color) {
  foundationColor = color;
}

export function setFoundationPattern(pattern) {
  if (["normal"].includes(pattern)) {
    foundationPattern = pattern;
  } else {
    console.error("Invalid foundation pattern. Use 'normal'.");
  }
}

export function setFoundationOpacity(opacity) {
  foundationOpacity = Math.max(0, Math.min(0.5, opacity)); // محدود کردن حداکثر شفافیت به 0.5
}

export function applyFoundation(landmarks, canvasCtx) {
  const width = canvasCtx.canvas.width;
  const height = canvasCtx.canvas.height;

  canvasCtx.save();
  canvasCtx.globalAlpha = foundationOpacity;

  // ایجاد یک مسیر برای کل صورت
  canvasCtx.beginPath();
  createFacePath(landmarks, canvasCtx, width, height);

  // پر کردن مسیر با گرادیان کرم پودر برای اثر صاف‌کنندگی
  const gradient = createSmoothingGradient(canvasCtx, width, height);
  canvasCtx.fillStyle = gradient;
  canvasCtx.fill();

  // حذف ناحیه چشم‌ها و لب‌ها
  removeEyesAndLips(landmarks, canvasCtx, width, height);

  // اضافه کردن یک لایه نرم‌کننده
  applySofteningLayer(canvasCtx, width, height);

  canvasCtx.restore();
}

function createFacePath(landmarks, canvasCtx, width, height) {
  const faceContourPoints = [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379,
    378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127,
    162, 21, 54, 103, 67, 109, 102,
  ];

  const foreheadPoints = [21, 54, 103, 67, 109, 10, 338, 297, 332, 284, 389];
  const offsetY = height * 0.06; // کمی کاهش از 0.07 به 0.06

  // Start the path from the first forehead point
  canvasCtx.moveTo(
    landmarks[foreheadPoints[0]].x * width,
    landmarks[foreheadPoints[0]].y * height - offsetY
  );

  // Create the curve above the forehead
  for (let i = 1; i < foreheadPoints.length - 1; i++) {
    const prevPoint = landmarks[foreheadPoints[i - 1]];
    const currentPoint = landmarks[foreheadPoints[i]];
    const nextPoint = landmarks[foreheadPoints[i + 1]];

    const midX1 = (prevPoint.x + currentPoint.x) / 2;
    const midY1 = (prevPoint.y + currentPoint.y) / 2;
    const midX2 = (currentPoint.x + nextPoint.x) / 2;
    const midY2 = (currentPoint.y + nextPoint.y) / 2;

    canvasCtx.bezierCurveTo(
      midX1 * width,
      midY1 * height - offsetY,
      currentPoint.x * width,
      currentPoint.y * height - offsetY,
      midX2 * width,
      midY2 * height - offsetY
    );
  }

  // Smoothly connect the forehead to the face contour
  const lastForeheadPoint =
    landmarks[foreheadPoints[foreheadPoints.length - 1]];
  const firstContourPoint = landmarks[faceContourPoints[0]];
  canvasCtx.bezierCurveTo(
    lastForeheadPoint.x * width,
    lastForeheadPoint.y * height - offsetY / 2,
    lastForeheadPoint.x * width,
    lastForeheadPoint.y * height,
    firstContourPoint.x * width,
    firstContourPoint.y * height
  );

  // Continue the path with face contour points
  for (let i = 1; i < faceContourPoints.length; i++) {
    canvasCtx.lineTo(
      landmarks[faceContourPoints[i]].x * width,
      landmarks[faceContourPoints[i]].y * height
    );
  }

  // Close the path by connecting back to the starting point
  canvasCtx.bezierCurveTo(
    landmarks[foreheadPoints[0]].x * width,
    landmarks[foreheadPoints[0]].y * height,
    landmarks[foreheadPoints[0]].x * width,
    landmarks[foreheadPoints[0]].y * height - offsetY / 2,
    landmarks[foreheadPoints[0]].x * width,
    landmarks[foreheadPoints[0]].y * height - offsetY
  );
  canvasCtx.closePath();
}

function createSmoothingGradient(canvasCtx, width, height) {
  const gradient = canvasCtx.createRadialGradient(
    width / 2,
    height / 2,
    0,
    width / 2,
    height / 2,
    height / 2
  );

  const baseColor = convertHexToRgbObject(foundationColor);
  gradient.addColorStop(
    0,
    `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0.4)`
  );
  gradient.addColorStop(
    0.7,
    `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0.2)`
  );
  gradient.addColorStop(
    1,
    `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0)`
  );

  return gradient;
}

function removeEyesAndLips(landmarks, canvasCtx, width, height) {
  canvasCtx.globalCompositeOperation = "destination-out";

  // حذف چشم چپ
  drawPath(
    landmarks,
    canvasCtx,
    [
      362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381,
      382,
    ],
    width,
    height
  );

  // حذف چشم راست
  drawPath(
    landmarks,
    canvasCtx,
    [
      33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163,
      7,
    ],
    width,
    height
  );

  // حذف لب‌ها
  drawPath(
    landmarks,
    canvasCtx,
    [
      61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0,
      37, 39, 40, 185,
    ],
    width,
    height
  );

  canvasCtx.globalCompositeOperation = "source-over";
}

function drawPath(landmarks, canvasCtx, points, width, height) {
  canvasCtx.beginPath();
  points.forEach((point, index) => {
    const x = landmarks[point].x * width;
    const y = landmarks[point].y * height;
    if (index === 0) {
      canvasCtx.moveTo(x, y);
    } else {
      canvasCtx.lineTo(x, y);
    }
  });
  canvasCtx.closePath();
  canvasCtx.fill();
}

function applySofteningLayer(canvasCtx, width, height) {
  canvasCtx.globalCompositeOperation = "overlay";
  const softeningGradient = canvasCtx.createRadialGradient(
    width / 2,
    height / 2,
    0,
    width / 2,
    height / 2,
    height / 2
  );
  softeningGradient.addColorStop(0, "rgba(255, 255, 255, 0.1)");
  softeningGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.05)");
  softeningGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  canvasCtx.fillStyle = softeningGradient;
  canvasCtx.fillRect(0, 0, width, height);
  canvasCtx.globalCompositeOperation = "source-over";
}

// توابع removeEyesAndLips و drawPath بدون تغییر می‌مانند
