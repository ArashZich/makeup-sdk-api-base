// src/makeup/blush.js
import { convertHexToRgbString } from "../utils";

let blushColor = "#FF6B6B";
let blushOpacity = 0.4;
let blushPattern = "normal";

export function changeBlushColor(color) {
  blushColor = color;
}

export function setBlushPattern(pattern) {
  blushPattern = pattern;
}

export function setBlushTransparency(opacity) {
  blushOpacity = Math.max(0, Math.min(1, opacity));
}

export function applyBlush(landmarks, canvasCtx) {
  const width = canvasCtx.canvas.width;
  const height = canvasCtx.canvas.height;

  // نقاط مرکزی برای گونه‌ها
  const leftCheekCenter = landmarks[117];
  const rightCheekCenter = landmarks[346];

  canvasCtx.save();
  canvasCtx.globalAlpha = blushOpacity;

  // رسم بلش برای گونه چپ با چرخش 45 درجه
  drawBlushOnCheek(
    canvasCtx,
    leftCheekCenter,
    width,
    height,
    true,
    -Math.PI / 4
  );
  // رسم بلش برای گونه راست با چرخش -45 درجه
  drawBlushOnCheek(
    canvasCtx,
    rightCheekCenter,
    width,
    height,
    false,
    Math.PI / 4
  );

  canvasCtx.restore();
}

function drawBlushOnCheek(canvasCtx, cheekCenter, width, height, isLeft) {
  const baseSize = Math.min(width, height);

  const offsetX = baseSize * 0.02;
  const offsetY = baseSize * 0.04;
  const centerX = isLeft
    ? cheekCenter.x * width + offsetX
    : cheekCenter.x * width - offsetX;
  const centerY = cheekCenter.y * height + offsetY;

  [1.2, 1, 0.8].forEach((scale) => {
    const radiusX = baseSize * 0.06 * scale;
    const radiusY = baseSize * 0.08 * scale;

    canvasCtx.beginPath();
    canvasCtx.ellipse(
      centerX,
      centerY,
      radiusX,
      radiusY,
      isLeft ? -Math.PI / 6 : Math.PI / 6,
      0,
      2 * Math.PI
    );

    const gradient = canvasCtx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      radiusY
    );

    gradient.addColorStop(
      0,
      `rgba(${convertHexToRgbString(blushColor)}, ${blushOpacity * 0.3})`
    );
    gradient.addColorStop(
      0.3,
      `rgba(${convertHexToRgbString(blushColor)}, ${blushOpacity * 0.2})`
    );
    gradient.addColorStop(1, "rgba(0,0,0,0)");

    canvasCtx.fillStyle = gradient;
    canvasCtx.fill();
  });
}
