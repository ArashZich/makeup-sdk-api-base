// src/makeup/eyeliner.js

import { EYELINER_IMAGES } from "../utils";

let eyelinerColor = "#000000";
let eyelinerThickness = 0.8;
let eyelinerStyle = "normal"; // می‌تواند "normal" یا "lashed" باشد

// نقاط خط چشم
const LEFT_EYE_POINTS = [133, 173, 157, 158, 159, 160, 161, 246, 33];
const RIGHT_EYE_POINTS = [463, 398, 384, 385, 386, 387, 388, 466, 263];

// تصاویر از قبل لود شده - کلیدها با استایل است
const loadedImages = {
  normal: {
    left: null,
    right: null,
  },
  lashed: {
    left: null,
    right: null,
  },
};

// لود کردن تصاویر برای استایل انتخابی
function loadImages(style = eyelinerStyle) {
  return new Promise((resolve, reject) => {
    // اگر تصاویر قبلاً لود شده‌اند
    if (loadedImages[style]?.left && loadedImages[style]?.right) {
      resolve();
      return;
    }

    // اطمینان از وجود استایل انتخابی در EYELINER_IMAGES
    if (!EYELINER_IMAGES[style]) {
      console.warn(`Style "${style}" not found, using normal style`);
      style = "normal";
    }

    // اگر کلید استایل وجود ندارد، آن را ایجاد کنید
    if (!loadedImages[style]) {
      loadedImages[style] = {
        left: null,
        right: null,
      };
    }

    let loadedCount = 0;

    function onLoad() {
      // چک کردن ابعاد تصویر
      if (this.width === 0 || this.height === 0) {
        reject(new Error("Image loaded with invalid dimensions"));
        return;
      }

      loadedCount++;
      if (loadedCount === 2) resolve();
    }

    // ایجاد و بارگذاری تصاویر
    loadedImages[style].left = new Image();
    loadedImages[style].right = new Image();

    loadedImages[style].left.crossOrigin = "anonymous";
    loadedImages[style].right.crossOrigin = "anonymous";

    loadedImages[style].left.onload = onLoad;
    loadedImages[style].right.onload = onLoad;

    loadedImages[style].left.onerror = () =>
      reject(
        new Error(`Failed to load left eyeliner image for style: ${style}`)
      );
    loadedImages[style].right.onerror = () =>
      reject(
        new Error(`Failed to load right eyeliner image for style: ${style}`)
      );

    // تنظیم آدرس تصاویر بر اساس استایل
    loadedImages[style].left.src = EYELINER_IMAGES[style].left;
    loadedImages[style].right.src = EYELINER_IMAGES[style].right;
  });
}

export function changeEyelinerColor(color) {
  eyelinerColor = color;
}

export function setEyelinerThickness(thickness) {
  eyelinerThickness = Math.max(0.1, Math.min(1, thickness));
}

export function setEyelinerStyle(style) {
  if (EYELINER_IMAGES[style]) {
    eyelinerStyle = style;

    // پیش‌بارگذاری تصاویر برای استایل جدید
    loadImages(style).catch((error) =>
      console.error(
        `Error preloading eyeliner images for style ${style}:`,
        error
      )
    );
  } else {
    console.warn(
      `Eyeliner style "${style}" is not available, using "normal" instead`
    );
    eyelinerStyle = "normal";
  }
}

export function applyEyeliner(landmarks, canvasCtx) {
  if (!landmarks || !canvasCtx) return;

  const width = canvasCtx.canvas.width;
  const height = canvasCtx.canvas.height;

  if (!width || !height) {
    console.warn("Invalid canvas dimensions");
    return;
  }

  // بررسی وجود تصاویر برای استایل فعلی
  const currentStyle = EYELINER_IMAGES[eyelinerStyle]
    ? eyelinerStyle
    : "normal";

  if (!loadedImages[currentStyle]?.left || !loadedImages[currentStyle]?.right) {
    loadImages(currentStyle)
      .then(() =>
        drawEyeliner(landmarks, canvasCtx, width, height, currentStyle)
      )
      .catch((error) =>
        console.error(
          `Error loading eyeliner images for style ${currentStyle}:`,
          error
        )
      );
  } else {
    drawEyeliner(landmarks, canvasCtx, width, height, currentStyle);
  }
}

function drawEyeliner(
  landmarks,
  canvasCtx,
  width,
  height,
  style = eyelinerStyle
) {
  canvasCtx.save();
  canvasCtx.globalAlpha = eyelinerThickness;

  // رسم خط چشم چپ و راست با استایل مناسب
  [
    { points: LEFT_EYE_POINTS, image: loadedImages[style].left },
    { points: RIGHT_EYE_POINTS, image: loadedImages[style].right },
  ].forEach(({ points, image }) => {
    drawEyelinerImage(
      landmarks,
      canvasCtx,
      points,
      image,
      width,
      height,
      style
    );
  });

  canvasCtx.restore();
}

function drawEyelinerImage(
  landmarks,
  canvasCtx,
  points,
  image,
  width,
  height,
  style
) {
  if (!image || !image.complete || image.naturalWidth === 0) return;

  try {
    // تنظیمات متفاوت برای استایل‌های مختلف
    let offsetX, offsetY;

    // تنظیم آفست بر اساس استایل
    if (style === "lashed") {
      // برای استایل lashed، خط چشم باید بالاتر قرار بگیرد تا مژه‌ها دیده شوند
      offsetX = points === LEFT_EYE_POINTS ? -12 : 12;
      offsetY = -18; // بالاتر از حالت عادی
    } else {
      // برای استایل normal
      offsetX = points === LEFT_EYE_POINTS ? -10 : 10;
      offsetY = -15;
    }

    const startPoint = {
      x: landmarks[points[0]].x * width + offsetX,
      y: landmarks[points[0]].y * height + offsetY,
    };

    const endPoint = {
      x:
        landmarks[points[points.length - 1]].x * width +
        (points === LEFT_EYE_POINTS ? -20 : 20),
      y: landmarks[points[points.length - 1]].y * height - 5,
    };

    // محاسبه طول واقعی بین نقاط
    const lineLength = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) +
        Math.pow(endPoint.y - startPoint.y, 2)
    );

    if (lineLength <= 0) return;

    const angle = Math.atan2(
      endPoint.y - startPoint.y,
      endPoint.x - startPoint.x
    );

    // ایجاد کنواس موقت با اندازه اصلی تصویر
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = image.width;
    tempCanvas.height = image.height;
    const tempCtx = tempCanvas.getContext("2d");

    // رسم تصویر با اندازه اصلی
    tempCtx.drawImage(image, 0, 0);

    // اعمال رنگ
    tempCtx.globalCompositeOperation = "source-in";
    tempCtx.fillStyle = eyelinerColor;
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    canvasCtx.save();
    canvasCtx.translate(startPoint.x, startPoint.y);
    canvasCtx.rotate(angle);

    // معکوس کردن برای چشم چپ
    if (points === LEFT_EYE_POINTS) {
      canvasCtx.scale(-1, -1);
    }

    // تنظیم مقیاس متفاوت برای استایل‌های مختلف
    let heightScale;
    if (style === "lashed") {
      // مقیاس بزرگتر برای استایل lashed به دلیل وجود مژه‌ها
      heightScale = height * 0.04;
    } else {
      heightScale = height * 0.03;
    }

    // محاسبه مقیاس برای حالت contain
    const scale = Math.min(
      lineLength / image.width,
      heightScale / image.height
    );

    canvasCtx.drawImage(
      tempCanvas,
      points === LEFT_EYE_POINTS ? -image.width * scale : 0,
      -(image.height * scale) / 2,
      image.width * scale,
      image.height * scale
    );

    canvasCtx.restore();
  } catch (error) {
    console.error(`Error drawing ${style} eyeliner:`, error);
  }
}
