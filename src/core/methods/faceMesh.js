// src/core/methods/faceMesh.js

import { Camera } from "@mediapipe/camera_utils";
import { FaceMesh } from "@mediapipe/face_mesh";
import { ICONS } from "../../utils";

let noFaceElement = null;

function createNoFaceElement(container) {
  if (!noFaceElement) {
    noFaceElement = document.createElement("img");
    noFaceElement.src = ICONS.face;
    noFaceElement.className = "armo-sdk-no-face";
    container.appendChild(noFaceElement);
  }
  return noFaceElement;
}

export async function setupFaceMesh(
  videoElement,
  canvasElement,
  onResultsCallback
) {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("دسترسی به دوربین در این مرورگر پشتیبانی نمی‌شود");
    }

    const stream = await navigator.mediaDevices
      .getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      })
      .catch((error) => {
        if (error.name === "NotAllowedError") {
          throw new Error("لطفاً مجوز دسترسی به دوربین را صادر کنید");
        } else if (
          error.name === "NotReadableError" ||
          error.name === "AbortError"
        ) {
          throw new Error(
            "دوربین توسط برنامه دیگری در حال استفاده است. لطفاً سایر برنامه‌های استفاده کننده از دوربین را ببندید"
          );
        } else if (error.name === "NotFoundError") {
          throw new Error("هیچ دوربینی در دستگاه شما یافت نشد");
        } else {
          throw new Error(
            `خطا در دسترسی به دوربین: ${error.name} - ${error.message}`
          );
        }
      });

    videoElement.srcObject = stream;
    await new Promise((resolve, reject) => {
      videoElement.onloadedmetadata = () => {
        videoElement
          .play()
          .then(resolve)
          .catch((error) => {
            reject(new Error(`خطا در پخش ویدیو: ${error.message}`));
          });
      };
      videoElement.onerror = () => reject(new Error("خطا در بارگذاری ویدیو"));
    });

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

    // Initialize noFaceElement
    const container = videoElement.parentElement;
    createNoFaceElement(container);

    faceMesh.onResults((results) => {
      const ctx = canvasElement.getContext("2d");
      ctx.save();
      ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

      ctx.drawImage(
        results.image,
        0,
        0,
        canvasElement.width,
        canvasElement.height
      );

      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];
        onResultsCallback(landmarks);
        if (noFaceElement) {
          noFaceElement.style.display = "none";
        }
      } else {
        console.warn("هیچ چهره‌ای در تصویر شناسایی نشد");
        if (noFaceElement) {
          noFaceElement.style.display = "block";
        }
      }
      ctx.restore();
    });

    const camera = new Camera(videoElement, {
      onFrame: async () => {
        try {
          await faceMesh.send({ image: videoElement });
        } catch (error) {
          console.error(`خطا در پردازش فریم: ${error.message}`);
        }
      },
      width: 1280,
      height: 720,
    });

    await camera.start().catch((error) => {
      throw new Error(`خطا در راه‌اندازی دوربین: ${error.message}`);
    });

    return {
      faceMesh,
      stream,
      camera,
    };
  } catch (error) {
    console.error(`خطا در راه‌اندازی دوربین: ${error.message}`);
    throw error;
  }
}

export function cleanup() {
  if (noFaceElement && noFaceElement.parentElement) {
    noFaceElement.parentElement.removeChild(noFaceElement);
    noFaceElement = null;
  }
}
