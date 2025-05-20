// src/core/methods/renderManager.js
import { applyMakeup } from "./makeupHandle"; // اضافه کردن این خط

export class RenderManager {
  constructor(videoElement, canvasElement, featureManager, comparisonManager) {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    this.featureManager = featureManager;
    this.comparisonManager = comparisonManager;
  }

  // تشخیص مرورگر و تنظیمات فیلتر
  getBrowserSettings() {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isChrome = /chrome/i.test(navigator.userAgent);
    const isFirefox = /firefox/i.test(navigator.userAgent);

    let filter;
    if (isSafari) {
      filter = "brightness(1.02) contrast(1.02)";
    } else if (isChrome) {
      filter = "brightness(1.04) contrast(1.04)";
    } else if (isFirefox) {
      filter = "brightness(1.03) contrast(1.03)";
    } else {
      filter = "brightness(1.03) contrast(1.03)";
    }

    return { filter, isSafari };
  }

  // اعمال نرم‌کنندگی پوست
  applySkinSmoothing(canvasCtx, videoWidth, videoHeight, isSafari) {
    // فقط کانتراست و شفافیت رو تنظیم می‌کنیم، بدون اضافه کردن سایه
    canvasCtx.globalCompositeOperation = "source-over";

    if (isSafari) {
      canvasCtx.filter = "contrast(1.02) brightness(1.02)";
    } else {
      canvasCtx.filter = "contrast(1.04) brightness(1.04)";
    }
  }

  // رندر در حالت عادی (بدون مقایسه)
  renderNormalMode(
    canvasCtx,
    landmarks,
    makeupType,
    filter,
    isSafari,
    videoWidth,
    videoHeight
  ) {
    // Apply base filter
    canvasCtx.filter = filter;

    // Draw original video frame
    canvasCtx.drawImage(this.videoElement, 0, 0, videoWidth, videoHeight);

    // Apply skin smoothing
    this.applySkinSmoothing(canvasCtx, videoWidth, videoHeight, isSafari);

    // Apply makeup
    applyMakeup(landmarks, canvasCtx, makeupType, this.featureManager);
  }

  // در RenderManager
  renderComparisonMode(
    canvasCtx,
    landmarks,
    makeupType,
    filter,
    isSafari,
    videoWidth,
    videoHeight
  ) {
    // تصویر اصلی بدون هیچ فیلتری
    canvasCtx.filter = "none";
    canvasCtx.globalCompositeOperation = "source-over";
    canvasCtx.drawImage(this.videoElement, 0, 0, videoWidth, videoHeight);

    // فقط در ناحیه سمت چپ خط divider آرایش اعمال می‌شود
    if (this.comparisonManager) {
      const clipRegion = this.comparisonManager.getClipRegion();
      if (clipRegion) {
        canvasCtx.save();

        // کلیپ ناحیه سمت چپ
        canvasCtx.beginPath();
        canvasCtx.rect(
          clipRegion.x,
          clipRegion.y,
          clipRegion.width,
          clipRegion.height
        );
        canvasCtx.clip();

        // اعمال فیلترهای پایه و آرایش
        this.applySkinSmoothing(canvasCtx, videoWidth, videoHeight, isSafari);
        applyMakeup(landmarks, canvasCtx, makeupType, this.featureManager);

        canvasCtx.restore();
      }
    }
  }

  // متد اصلی رندر
  render(landmarks, makeupType) {
    try {
      const { videoWidth, videoHeight } = this.videoElement;
      this.canvasElement.width = videoWidth;
      this.canvasElement.height = videoHeight;
      const canvasCtx = this.canvasElement.getContext("2d");

      // Save initial state
      canvasCtx.save();

      // Clear canvas
      canvasCtx.clearRect(0, 0, videoWidth, videoHeight);

      if (landmarks) {
        // Get browser settings
        const { filter, isSafari } = this.getBrowserSettings();

        // حالت عادی یا مقایسه
        if (!this.comparisonManager?.isActive) {
          this.renderNormalMode(
            canvasCtx,
            landmarks,
            makeupType,
            filter,
            isSafari,
            videoWidth,
            videoHeight
          );
        } else {
          this.renderComparisonMode(
            canvasCtx,
            landmarks,
            makeupType,
            filter,
            isSafari,
            videoWidth,
            videoHeight
          );
        }
      }

      // Restore canvas state
      canvasCtx.restore();

      return true;
    } catch (error) {
      console.error(`Error in render: ${error.message}`);
      return false;
    }
  }
}

export default RenderManager;
