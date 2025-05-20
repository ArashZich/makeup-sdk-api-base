// src/makeup/eyelashes.js
import { EYELASH_IMAGES } from "../utils";

let eyelashesColor = "#000000";
let eyelashesThickness = 0.8;
let eyelashesStyle = "long-lash";

const LEFT_EYE_POINTS = [173, 157, 158, 159, 160, 161, 246, 33];
const RIGHT_EYE_POINTS = [398, 384, 385, 386, 387, 388, 466, 263];

const loadedImages = {
  left: null,
  right: null,
};

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
      reject(new Error("Failed to load left eyelash image"));
    loadedImages.right.onerror = () =>
      reject(new Error("Failed to load right eyelash image"));

    // انتخاب تصاویر بر اساس استایل انتخاب شده
    loadedImages.left.src = EYELASH_IMAGES[eyelashesStyle].left;
    loadedImages.right.src = EYELASH_IMAGES[eyelashesStyle].right;
  });
}

export function changeEyelashesColor(color) {
  eyelashesColor = color;
}

export function setEyelashesThickness(thickness) {
  eyelashesThickness = Math.max(0.1, Math.min(1, thickness));
}

export function setEyelashesStyle(style) {
  if (EYELASH_IMAGES[style]) {
    eyelashesStyle = style;
    // بارگذاری مجدد تصاویر با استایل جدید
    loadedImages.left = null;
    loadedImages.right = null;
  }
}

export function applyEyelashes(landmarks, canvasCtx) {
  if (!landmarks || !canvasCtx) return;

  const width = canvasCtx.canvas.width;
  const height = canvasCtx.canvas.height;

  if (!width || !height) {
    console.warn("Invalid canvas dimensions");
    return;
  }

  if (!loadedImages.left || !loadedImages.right) {
    loadImages()
      .then(() => drawEyelashes(landmarks, canvasCtx, width, height))
      .catch((error) => console.error("Error loading eyelash images:", error));
  } else {
    drawEyelashes(landmarks, canvasCtx, width, height);
  }
}

function drawEyelashes(landmarks, canvasCtx, width, height) {
  canvasCtx.save();
  canvasCtx.globalAlpha = eyelashesThickness;

  [
    { points: LEFT_EYE_POINTS, image: loadedImages.left },
    { points: RIGHT_EYE_POINTS, image: loadedImages.right },
  ].forEach(({ points, image }) => {
    drawEyelashImage(landmarks, canvasCtx, points, image, width, height);
  });

  canvasCtx.restore();
}

function drawEyelashImage(landmarks, canvasCtx, points, image, width, height) {
  if (!image || !image.complete || image.naturalWidth === 0) return;

  try {
    const startPoint = {
      x: landmarks[points[0]].x * width,
      y: landmarks[points[0]].y * height - 2,
    };

    const endPointXOffset = points === LEFT_EYE_POINTS ? -25 : 25;
    const endPoint = {
      x: landmarks[points[points.length - 1]].x * width + endPointXOffset,
      y: landmarks[points[points.length - 1]].y * height - 7,
    };

    const lineLength = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) +
        Math.pow(endPoint.y - startPoint.y, 2)
    );

    if (lineLength <= 0) return;

    const angle = Math.atan2(
      endPoint.y - startPoint.y,
      endPoint.x - startPoint.x
    );

    // ایجاد و تنظیم کنواس موقت
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = Math.max(1, Math.ceil(lineLength));
    tempCanvas.height = Math.max(1, Math.ceil(image.height));
    const tempCtx = tempCanvas.getContext("2d");

    // رسم و رنگ‌آمیزی تصویر
    tempCtx.drawImage(image, 0, 0, tempCanvas.width, tempCanvas.height);

    tempCtx.globalCompositeOperation = "source-in";
    tempCtx.fillStyle = eyelashesColor;
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // تنظیمات ترانسفورم و رسم نهایی
    canvasCtx.save();
    canvasCtx.translate(startPoint.x, startPoint.y);
    canvasCtx.rotate(angle);

    if (points === LEFT_EYE_POINTS) {
      canvasCtx.scale(-1, -1);
    }

    canvasCtx.drawImage(
      tempCanvas,
      points === LEFT_EYE_POINTS ? -tempCanvas.width : 0,
      -tempCanvas.height / 2 - 5,
      tempCanvas.width,
      tempCanvas.height
    );

    canvasCtx.restore();
  } catch (error) {
    console.error("Error drawing eyelash:", error);
  }
}
