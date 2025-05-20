import { convertHexToRgbObject } from "../utils";

let eyeshadowColor = "#8A2BE2";
let eyeshadowTransparency = 0.5;
let eyeshadowPattern = "normal";

function changeEyeshadowColor(color) {
  eyeshadowColor = color;
}

function setEyeshadowPattern(newPattern) {
  eyeshadowPattern = newPattern;
}

function setEyeshadowTransparency(newTransparency) {
  eyeshadowTransparency = newTransparency;
}

function applyEyeshadow(landmarks, canvasCtx) {
  if (!eyeshadowColor) return;

  const width = canvasCtx.canvas.width;
  const height = canvasCtx.canvas.height - 2;

  const leftEyePoints = [
    243, 133, 173, 157, 158, 159, 160, 161, 246, 33, 130, 226, 247, 30, 29, 27,
    28, 56, 190, 243,
  ];
  const rightEyePoints = [
    463, 398, 384, 385, 386, 387, 388, 466, 263, 359, 446, 467, 260, 259, 257,
    258, 286, 414, 463,
  ];

  canvasCtx.save();
  canvasCtx.globalAlpha = eyeshadowTransparency;

  applyEyeshadowToEye(landmarks, canvasCtx, leftEyePoints, width, height);
  applyEyeshadowToEye(landmarks, canvasCtx, rightEyePoints, width, height);

  canvasCtx.restore();
}

function applyEyeshadowToEye(landmarks, canvasCtx, eyePoints, width, height) {
  // Convert color to RGB at the beginning
  const rgb = convertHexToRgbObject(eyeshadowColor);

  // محاسبه نقطه مرکزی چشم
  const centerX =
    (eyePoints.reduce((sum, index) => sum + landmarks[index].x, 0) /
      eyePoints.length) *
    width;
  const centerY =
    (eyePoints.reduce((sum, index) => sum + landmarks[index].y, 0) /
      eyePoints.length) *
    height;

  // محاسبه شعاع مؤثر برای گرادیان
  const radius = getEffectiveRadius(
    landmarks,
    eyePoints,
    width,
    height,
    centerX,
    centerY
  );

  // رسم با نقاط کنترل نرم‌تر
  canvasCtx.beginPath();
  eyePoints.forEach((index, i) => {
    const point = landmarks[index];
    const x = point.x * width;
    const y = point.y * height - 6;

    if (i === 0) {
      canvasCtx.moveTo(x, y);
    } else {
      canvasCtx.lineTo(x, y);
    }
  });
  canvasCtx.closePath();

  // گرادیان اصلی با محو شدگی بیشتر
  const gradient = canvasCtx.createRadialGradient(
    centerX,
    centerY - radius * 0.1,
    0,
    centerX,
    centerY,
    radius * 1.5
  );

  // توقف‌های گرادیان با فواصل نزدیک‌تر برای محو شدگی نرم‌تر
  gradient.addColorStop(
    0,
    `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${eyeshadowTransparency})`
  );
  gradient.addColorStop(
    0.3,
    `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${eyeshadowTransparency * 0.8})`
  );
  gradient.addColorStop(
    0.5,
    `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${eyeshadowTransparency * 0.6})`
  );
  gradient.addColorStop(
    0.7,
    `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${eyeshadowTransparency * 0.3})`
  );
  gradient.addColorStop(
    0.9,
    `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${eyeshadowTransparency * 0.1})`
  );
  gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

  // اعمال گرادیان اصلی
  canvasCtx.globalCompositeOperation = "soft-light";
  canvasCtx.fillStyle = gradient;
  canvasCtx.fill();

  // اضافه کردن لایه blur برای نرم‌تر کردن لبه‌ها
  // canvasCtx.globalCompositeOperation = "source-over";
  // canvasCtx.filter = "blur(8px)";
  // canvasCtx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${
  //   eyeshadowTransparency * 0.1
  // })`;
  canvasCtx.fill();

  // ریست کردن فیلترها
  canvasCtx.filter = "none";
}
// تابع کمکی برای محاسبه شعاع مؤثر
function getEffectiveRadius(
  landmarks,
  points,
  width,
  height,
  centerX,
  centerY
) {
  let maxDist = 0;
  points.forEach((index) => {
    const x = landmarks[index].x * width;
    const y = landmarks[index].y * height;
    const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
    maxDist = Math.max(maxDist, dist);
  });
  return maxDist * 1.2; // شعاع کمی بزرگتر برای اطمینان از پوشش کامل
}

export {
  changeEyeshadowColor,
  setEyeshadowPattern,
  setEyeshadowTransparency,
  applyEyeshadow,
};
