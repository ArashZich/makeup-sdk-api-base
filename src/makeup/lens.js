// src/eyewear/lens.js

import { convertHexToRgba } from "../utils";
import { drawRainbowLens } from "./patterns-lens/rainbow";
import { drawCrystalColorsLens } from "./patterns-lens/crystal-colors";
import { drawDahabPlatinumLens } from "./patterns-lens/dahab-platinum";
import { drawDesioAttitudeLens } from "./patterns-lens/desio-attitude";
import { drawFreshlookColorBlendsLens } from "./patterns-lens/freshlook-colorblends";

let lensColor = "#1C1C1C";
let lensOpacity = 0.8;
let lensPattern = "rainbow";

const LEFT_IRIS_LANDMARKS = [474, 475, 476, 477];
const RIGHT_IRIS_LANDMARKS = [469, 470, 471, 472];

export function changeLensColor(color) {
  lensColor = color;
}

export function setLensPattern(pattern) {
  if (
    [
      "rainbow",
      "crystal-colors",
      "dahab-platinum",
      "desio-attitude",
      "freshlook-colorblends",
    ].includes(pattern)
  ) {
    lensPattern = pattern;
  } else {
    console.error(
      "Invalid lens pattern. Use 'rainbow', 'crystal-colors', 'dahab-platinum', 'desio-attitude' or 'freshlook-colorblends'."
    );
  }
}

export function setLensOpacity(opacity) {
  lensOpacity = Math.max(0, Math.min(1, opacity));
}

export function applyLens(landmarks, canvasCtx) {
  const width = canvasCtx.canvas.width;
  const height = canvasCtx.canvas.height;

  drawLens(landmarks, canvasCtx, LEFT_IRIS_LANDMARKS, width, height);
  drawLens(landmarks, canvasCtx, RIGHT_IRIS_LANDMARKS, width, height);
}

function drawLens(landmarks, canvasCtx, irisLandmarks, width, height) {
  const [centerX, centerY, radius] = calculateIrisCircle(
    landmarks,
    irisLandmarks,
    width,
    height
  );

  canvasCtx.save();
  canvasCtx.beginPath();
  canvasCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  canvasCtx.clip();

  const baseColor = convertHexToRgba(lensColor, lensOpacity);

  switch (lensPattern) {
    case "rainbow":
      drawRainbowLens(
        canvasCtx,
        centerX,
        centerY,
        radius,
        lensColor,
        lensOpacity
      );
      break;
    case "crystal-colors":
      drawCrystalColorsLens(
        canvasCtx,
        centerX,
        centerY,
        radius,
        lensColor,
        lensOpacity
      );
      break;
    case "dahab-platinum":
      drawDahabPlatinumLens(
        canvasCtx,
        centerX,
        centerY,
        radius,
        lensColor,
        lensOpacity
      );
      break;
    case "desio-attitude":
      drawDesioAttitudeLens(
        canvasCtx,
        centerX,
        centerY,
        radius,
        lensColor,
        lensOpacity
      );
      break;
    case "freshlook-colorblends":
      drawFreshlookColorBlendsLens(
        canvasCtx,
        centerX,
        centerY,
        radius,
        baseColor,
        lensOpacity
      );
      break;
    default:
      // Natural pattern (solid color)
      canvasCtx.fillStyle = baseColor;
      canvasCtx.fillRect(
        centerX - radius,
        centerY - radius,
        radius * 2,
        radius * 2
      );
  }

  drawEnhancedPupil(canvasCtx, centerX, centerY, radius);
  addLightReflection(canvasCtx, centerX, centerY, radius);
  drawLensEdge(canvasCtx, centerX, centerY, radius);

  canvasCtx.restore();
}

function drawEnhancedPupil(canvasCtx, centerX, centerY, radius) {
  const pupilRadius = radius * 0.35;
  const gradient = canvasCtx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    pupilRadius
  );
  gradient.addColorStop(0, "rgba(0, 0, 0, 0.9)");
  gradient.addColorStop(0.7, "rgba(20, 20, 20, 0.9)");
  gradient.addColorStop(1, "rgba(50, 50, 50, 0.9)");

  canvasCtx.beginPath();
  canvasCtx.arc(centerX, centerY, pupilRadius, 0, Math.PI * 2);
  canvasCtx.fillStyle = gradient;
  canvasCtx.fill();

  // Add pupil texture
  const scale = 0.2;
  for (let y = centerY - pupilRadius; y < centerY + pupilRadius; y++) {
    for (let x = centerX - pupilRadius; x < centerX + pupilRadius; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      if (dx * dx + dy * dy <= pupilRadius * pupilRadius) {
        const noiseValue = Math.random();
        canvasCtx.fillStyle = `rgba(0, 0, 0, ${noiseValue * 0.3})`;
        canvasCtx.fillRect(x, y, 1, 1);
      }
    }
  }
}

function addLightReflection(canvasCtx, centerX, centerY, radius) {
  const reflectionRadius = radius * 0.2;
  const gradient = canvasCtx.createRadialGradient(
    centerX - reflectionRadius,
    centerY - reflectionRadius,
    0,
    centerX - reflectionRadius,
    centerY - reflectionRadius,
    reflectionRadius
  );
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.8)");
  gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.5)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  canvasCtx.fillStyle = gradient;
  canvasCtx.beginPath();
  canvasCtx.arc(
    centerX - reflectionRadius,
    centerY - reflectionRadius,
    reflectionRadius,
    0,
    Math.PI * 2
  );
  canvasCtx.fill();

  // Add secondary reflection
  const secondaryRadius = radius * 0.1;
  const secondaryGradient = canvasCtx.createRadialGradient(
    centerX + reflectionRadius,
    centerY + reflectionRadius,
    0,
    centerX + reflectionRadius,
    centerY + reflectionRadius,
    secondaryRadius
  );
  secondaryGradient.addColorStop(0, "rgba(255, 255, 255, 0.6)");
  secondaryGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  canvasCtx.fillStyle = secondaryGradient;
  canvasCtx.beginPath();
  canvasCtx.arc(
    centerX + reflectionRadius,
    centerY + reflectionRadius,
    secondaryRadius,
    0,
    Math.PI * 2
  );
  canvasCtx.fill();
}

function drawLensEdge(canvasCtx, centerX, centerY, radius) {
  const edgeWidth = radius * 0.02;
  const gradient = canvasCtx.createRadialGradient(
    centerX,
    centerY,
    radius - edgeWidth,
    centerX,
    centerY,
    radius
  );
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.2)");
  gradient.addColorStop(0.5, "rgba(200, 200, 200, 0.3)");
  gradient.addColorStop(1, "rgba(150, 150, 150, 0.4)");

  canvasCtx.beginPath();
  canvasCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  canvasCtx.lineWidth = edgeWidth;
  canvasCtx.strokeStyle = gradient;
  canvasCtx.stroke();
}

function calculateIrisCircle(landmarks, irisLandmarks, width, height) {
  let sumX = 0,
    sumY = 0;
  for (const index of irisLandmarks) {
    sumX += landmarks[index].x * width;
    sumY += landmarks[index].y * height;
  }
  const centerX = sumX / irisLandmarks.length;
  const centerY = sumY / irisLandmarks.length;

  let maxDistance = 0;
  for (const index of irisLandmarks) {
    const dx = landmarks[index].x * width - centerX;
    const dy = landmarks[index].y * height - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > maxDistance) {
      maxDistance = distance;
    }
  }

  return [centerX, centerY, maxDistance];
}
