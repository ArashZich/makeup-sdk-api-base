// src/core/methods/imageManager.js

import { FaceMesh } from "@mediapipe/face_mesh";
import {
  changeMakeupColor,
  setMakeupPattern,
  setMakeupTransparency,
  applyMakeup,
} from "./makeupHandle";

export class ImageManager {
  constructor(canvasElement, featureManager, comparisonManager) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext("2d");
    this.featureManager = featureManager;
    this.comparisonManager = comparisonManager;
    this.currentImage = null;
    this.imageLandmarks = null;
    this.isProcessing = false;
    this.currentMakeupType = null;
    this.currentMakeupColor = null;
    this.currentPattern = "normal";
    this.currentTransparency = 0.8;
    this.animationFrameId = null;

    // اضافه کردن observer برای تغییرات divider
    if (this.comparisonManager) {
      this.startRenderLoop();
    }
  }

  startRenderLoop() {
    const render = () => {
      if (this.currentImage && this.imageLandmarks) {
        this._applyCurrentMakeup();
      }
      this.animationFrameId = requestAnimationFrame(render);
    };
    render();
  }

  stopRenderLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  async loadImage(imageSource) {
    try {
      this.isProcessing = true;
      await this._loadImageToCanvas(imageSource);
      const landmarks = await this._detectFaceLandmarks();

      if (landmarks) {
        this.imageLandmarks = landmarks;
        this._applyCurrentMakeup();
        return true;
      } else {
        console.warn("No face detected in the image");
        return false;
      }
    } catch (error) {
      console.error("Error processing image:", error);
      return false;
    } finally {
      this.isProcessing = false;
    }
  }

  async _loadImageToCanvas(imageSource) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        this.currentImage = img;

        // گرفتن ابعاد container
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // محاسبه نسبت ابعاد
        const imgRatio = img.width / img.height;
        const containerRatio = containerWidth / containerHeight;

        let width, height;

        // تنظیم ابعاد برای پر کردن container
        if (containerRatio > imgRatio) {
          // عرض container بیشتر است
          height = containerHeight;
          width = height * imgRatio;
        } else {
          // ارتفاع container بیشتر است
          width = containerWidth;
          height = width / imgRatio;
        }

        // تنظیم اندازه canvas
        this.canvas.width = containerWidth;
        this.canvas.height = containerHeight;

        // پاک کردن canvas
        this.ctx.clearRect(0, 0, containerWidth, containerHeight);

        // محاسبه مختصات برای قرار دادن تصویر در مرکز
        const x = (containerWidth - width) / 2;
        const y = (containerHeight - height) / 2;

        // رسم تصویر با کیفیت بالا
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = "high";
        this.ctx.drawImage(img, x, y, width, height);

        resolve();
      };

      img.onerror = () => reject(new Error("خطا در بارگذاری تصویر"));
      img.src = imageSource;
    });
  }
  async _detectFaceLandmarks() {
    if (!this.currentImage) return null;

    const faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`;
      },
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    return new Promise((resolve) => {
      faceMesh.onResults((results) => {
        if (
          results.multiFaceLandmarks &&
          results.multiFaceLandmarks.length > 0
        ) {
          resolve(results.multiFaceLandmarks[0]);
        } else {
          resolve(null);
        }
      });

      // تبدیل canvas به تصویر برای تشخیص چهره
      const imageData = this.canvas.toDataURL("image/jpeg");
      const tempImg = new Image();
      tempImg.onload = () => {
        faceMesh.send({ image: tempImg });
      };
      tempImg.src = imageData;
    });
  }

  _applyCurrentMakeup() {
    if (!this.currentImage || !this.imageLandmarks) return;

    const container = this.canvas.parentElement;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // محاسبه ابعاد تصویر
    const imgRatio = this.currentImage.width / this.currentImage.height;
    const containerRatio = containerWidth / containerHeight;

    let width, height;
    if (containerRatio > imgRatio) {
      height = containerHeight;
      width = height * imgRatio;
    } else {
      width = containerWidth;
      height = width / imgRatio;
    }

    // محاسبه مختصات مرکز
    const x = (containerWidth - width) / 2;
    const y = (containerHeight - height) / 2;

    // پاک کردن canvas
    this.ctx.clearRect(0, 0, containerWidth, containerHeight);

    // رسم تصویر اصلی
    this.ctx.save();
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = "high";
    this.ctx.drawImage(this.currentImage, x, y, width, height);
    this.ctx.restore();

    if (this.comparisonManager?.isActive) {
      const clipRegion = this.comparisonManager.getClipRegion();
      if (clipRegion) {
        // ذخیره وضعیت کنونی
        this.ctx.save();

        // تنظیم ناحیه برش
        this.ctx.beginPath();
        this.ctx.rect(
          clipRegion.x,
          clipRegion.y,
          clipRegion.width,
          clipRegion.height
        );
        this.ctx.clip();

        // اعمال آرایش فقط در ناحیه برش
        if (this.currentMakeupType && this.currentMakeupColor) {
          changeMakeupColor(this.currentMakeupType, this.currentMakeupColor);
          setMakeupPattern(this.currentMakeupType, this.currentPattern);
          setMakeupTransparency(
            this.currentMakeupType,
            this.currentTransparency
          );
          applyMakeup(
            this.imageLandmarks,
            this.ctx,
            this.currentMakeupType,
            this.featureManager
          );
        }

        // بازگرداندن وضعیت
        this.ctx.restore();
      }
    } else if (this.currentMakeupType && this.currentMakeupColor) {
      // اعمال آرایش روی کل تصویر
      changeMakeupColor(this.currentMakeupType, this.currentMakeupColor);
      setMakeupPattern(this.currentMakeupType, this.currentPattern);
      setMakeupTransparency(this.currentMakeupType, this.currentTransparency);
      applyMakeup(
        this.imageLandmarks,
        this.ctx,
        this.currentMakeupType,
        this.featureManager
      );
    }
  }

  resetImage() {
    if (this.currentImage) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(
        this.currentImage,
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );
      this.currentMakeupType = null;
      this.currentMakeupColor = null;
    }
  }

  getImageDataUrl() {
    return this.canvas.toDataURL("image/jpeg", 0.9);
  }

  updateMakeup(type, color, pattern, transparency) {
    if (this.isProcessing) return;

    this.currentMakeupType = type;
    this.currentMakeupColor = color;
    this.currentPattern = pattern || this.currentPattern;
    this.currentTransparency = transparency || this.currentTransparency;

    // Trigger a new render
    this._applyCurrentMakeup();
  }

  destroy() {
    this.stopRenderLoop();
    this.currentImage = null;
    this.imageLandmarks = null;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

export default ImageManager;
