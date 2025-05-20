// src/makeup/brows.js
import { BROWS_IMAGES } from "../utils";

let browsColor = "#4A2C2A";
let browsOpacity = 0.5;
let browsThickness = 0.8;
let browsStyle = "normal";

// نقاط ابرو
const RIGHT_BROW_POINTS = [336, 296, 334, 293, 300];
const LEFT_BROW_POINTS = [107, 66, 105, 63, 70];

// نقاط مرجع چشم‌ها
const LEFT_EYE_POINTS = [33, 133]; // گوشه داخلی و خارجی چشم چپ
const RIGHT_EYE_POINTS = [362, 263]; // گوشه داخلی و خارجی چشم راست

// تصاویر از قبل لود شده
const loadedImages = {
  left: null,
  right: null,
};

// لود کردن تصاویر
function loadImages() {
  return new Promise((resolve, reject) => {
    let loadedCount = 0;

    function onLoad() {
      if (this.width === 0 || this.height === 0) {
        reject(new Error("Image loaded with invalid dimensions"));
        return;
      }
      loadedCount++;
      if (loadedCount === 2) resolve();
    }

    loadedImages.left = new Image();
    loadedImages.right = new Image();

    loadedImages.left.crossOrigin = "anonymous";
    loadedImages.right.crossOrigin = "anonymous";

    loadedImages.left.onload = onLoad;
    loadedImages.right.onload = onLoad;
    loadedImages.left.onerror = () =>
      reject(new Error("Failed to load left brow image"));
    loadedImages.right.onerror = () =>
      reject(new Error("Failed to load right brow image"));

    loadedImages.left.src = BROWS_IMAGES.normal.left;
    loadedImages.right.src = BROWS_IMAGES.normal.right;
  });
}

// محاسبه فاصله بین چشم‌ها
function getEyeDistance(landmarks, width) {
  const leftEyeCenter = {
    x: (landmarks[LEFT_EYE_POINTS[0]].x + landmarks[LEFT_EYE_POINTS[1]].x) / 2,
    y: (landmarks[LEFT_EYE_POINTS[0]].y + landmarks[LEFT_EYE_POINTS[1]].y) / 2,
  };

  const rightEyeCenter = {
    x:
      (landmarks[RIGHT_EYE_POINTS[0]].x + landmarks[RIGHT_EYE_POINTS[1]].x) / 2,
    y:
      (landmarks[RIGHT_EYE_POINTS[0]].y + landmarks[RIGHT_EYE_POINTS[1]].y) / 2,
  };

  return Math.sqrt(
    Math.pow((rightEyeCenter.x - leftEyeCenter.x) * width, 2) +
      Math.pow((rightEyeCenter.y - leftEyeCenter.y) * width, 2)
  );
}

export function changeBrowsColor(color) {
  browsColor = color;
}

export function setBrowsOpacity(opacity) {
  browsOpacity = Math.max(0, Math.min(1, opacity));
}

export function setBrowsStyle(style) {
  browsStyle = style;
}

export function setBrowsThickness(thickness) {
  browsThickness = Math.max(0.1, Math.min(1, thickness));
}

export function applyBrows(landmarks, canvasCtx) {
  if (!landmarks || !canvasCtx) return;

  const width = canvasCtx.canvas.width;
  const height = canvasCtx.canvas.height;

  if (!width || !height) {
    console.warn("Invalid canvas dimensions");
    return;
  }

  if (!loadedImages.left || !loadedImages.right) {
    loadImages()
      .then(() => drawBrows(landmarks, canvasCtx, width, height))
      .catch((error) => console.error("Error loading brow images:", error));
  } else {
    drawBrows(landmarks, canvasCtx, width, height);
  }
}

function drawBrows(landmarks, canvasCtx, width, height) {
  canvasCtx.save();
  canvasCtx.globalAlpha = browsOpacity * browsThickness;

  [
    { points: RIGHT_BROW_POINTS, image: loadedImages.right },
    { points: LEFT_BROW_POINTS, image: loadedImages.left },
  ].forEach(({ points, image }) => {
    drawBrowImage(landmarks, canvasCtx, points, image, width, height);
  });

  canvasCtx.restore();
}

function drawBrowImage(landmarks, canvasCtx, points, image, width, height) {
  if (!image || !image.complete || image.naturalWidth === 0) return;

  try {
    // محاسبه فاصله بین چشم‌ها به عنوان مرجع
    const eyeDistance = getEyeDistance(landmarks, width);

    // تنظیم مقیاس ثابت نسبت به فاصله چشم‌ها
    const BASE_SCALE = 0.45;
    const scale = (eyeDistance * BASE_SCALE) / image.width;

    const startPoint = {
      x: landmarks[points[0]].x * width,
      y: landmarks[points[0]].y * height,
    };

    const endPoint = {
      x: landmarks[points[points.length - 1]].x * width,
      y: landmarks[points[points.length - 1]].y * height,
    };

    // محاسبه طول خط با حفظ نسبت
    const lineLength = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) +
        Math.pow(endPoint.y - startPoint.y, 2)
    );

    // محاسبه ارتفاع متناسب با فاصله چشم‌ها
    const browHeight = eyeDistance * 0.15;

    // ایجاد کنواس موقت با ابعاد محاسبه شده
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = Math.max(1, Math.ceil(lineLength));
    tempCanvas.height = Math.max(1, Math.ceil(browHeight));
    const tempCtx = tempCanvas.getContext("2d");

    // رسم تصویر در کنواس موقت
    tempCtx.drawImage(image, 0, 0, tempCanvas.width, tempCanvas.height);

    // اعمال رنگ
    tempCtx.globalCompositeOperation = "source-in";
    tempCtx.fillStyle = browsColor;
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    canvasCtx.save();

    // تنظیم موقعیت و چرخش برای هر ابرو
    if (points === LEFT_BROW_POINTS) {
      canvasCtx.translate(endPoint.x, endPoint.y);
      const angle =
        Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x) +
        Math.PI;
      canvasCtx.rotate(angle);
    } else {
      canvasCtx.translate(startPoint.x, startPoint.y);
      const angle = Math.atan2(
        endPoint.y - startPoint.y,
        endPoint.x - startPoint.x
      );
      canvasCtx.rotate(angle);
    }

    // رسم نهایی ابرو با مقیاس ثابت
    canvasCtx.drawImage(
      tempCanvas,
      0,
      -tempCanvas.height / 2,
      tempCanvas.width,
      tempCanvas.height
    );

    canvasCtx.restore();
  } catch (error) {
    console.error("Error drawing brow:", error);
  }
}
