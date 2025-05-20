// src/core/methods/domSetup.js

import { ICONS } from "../../utils";

export function createDOMElements(options, isPremium) {
  // ایجاد container اصلی
  const container = document.createElement("div");
  container.className = "armo-sdk-wrapper";

  // ایجاد container داخلی
  const innerContainer = document.createElement("div");
  innerContainer.className = "armo-sdk-container";

  // ایجاد ویدیو المنت
  const videoElement = document.createElement("video");
  videoElement.className = "armo-sdk-input-video";
  videoElement.setAttribute("playsinline", "");

  // ایجاد کنواس المنت
  const canvasElement = document.createElement("canvas");
  canvasElement.id = "armo-sdk-output-canvas";
  canvasElement.className = "armo-sdk-canvas";

  // چک کردن وجود loading سفارشی
  const customLoading = document.getElementById("armo-sdk-custom-loading");

  // ایجاد loading element
  const loadingElement = document.createElement("div");
  loadingElement.id = "armo-sdk-loading";
  loadingElement.className = "armo-sdk-loading";

  if (customLoading) {
    const clonedLoading = customLoading.cloneNode(true);
    clonedLoading.style.display = "block";
    loadingElement.appendChild(clonedLoading);
  } else {
    loadingElement.innerHTML = `
      <div class="armo-sdk-loading-content">
        <img src="https://armogroup.storage.iran.liara.space/armo-logo/logo.svg" alt="ARmo Logo">
        <p>در حال بارگذاری...</p>
      </div>
    `;
  }

  // افزودن المنت‌های اصلی به inner container
  innerContainer.appendChild(videoElement);
  innerContainer.appendChild(canvasElement);
  innerContainer.appendChild(loadingElement);

  // ایجاد بخش کنترل‌ها
  const controls = document.createElement("div");
  controls.className = "armo-sdk-controls";

  if (options.showColorPicker) {
    const colorPicker = document.createElement("div");
    colorPicker.id = "armo-sdk-color-picker";
    colorPicker.className = "armo-sdk-color-picker";
    controls.appendChild(colorPicker);
  } else {
    const existingControls = document.getElementById(
      "armo-sdk-custom-controls"
    );
    if (existingControls) {
      const clonedControls = existingControls.cloneNode(true);
      existingControls.remove();
      controls.appendChild(clonedControls);
      clonedControls.style.display = "block";
    }
  }

  innerContainer.appendChild(controls);

  // اضافه کردن Powered by برای نسخه غیر پریمیوم
  if (!isPremium) {
    const infoContainer = document.createElement("div");
    const shadowRoot = infoContainer.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      .armo-sdk-info-button {
        position: absolute;
        bottom: 20px;
        left: 20px;
        width: 40px;
        height: 40px;
        border-radius: 20px;
        background: rgba(0, 0, 0, 0.5);
        padding: 8px;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        z-index: 100000000000;
        cursor: pointer;
      }
      
      .armo-sdk-info-button:hover {
        transform: scale(1.05);
      }
      
      .armo-sdk-info-button img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      
      .armo-sdk-powered-by {
        position: absolute;
        bottom: 20px;
        left: 20px;
        background: rgba(0, 0, 0, 0.5);
        color: white;
        padding: 10px 16px;
        border-radius: 20px;
        font-size: 12px;
        z-index: 100000000000;
        transition: all 0.3s ease;
        cursor: pointer;
        display: none;
        opacity: 0;
        transform: translateX(-20px);
      }
      
      .armo-sdk-powered-by.show {
        display: block;
        opacity: 1;
        transform: translateX(0);
        animation: slideIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
      }
      
      @keyframes slideIn {
        0% {
          opacity: 0;
          transform: translateX(-20px);
        }
        100% {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      @keyframes slideOut {
        0% {
          opacity: 1;
          transform: translateX(0);
        }
        100% {
          opacity: 0;
          transform: translateX(-20px);
        }
      }
    `;

    shadowRoot.appendChild(style);

    const infoButton = document.createElement("button");
    infoButton.className = "armo-sdk-info-button";
    const infoIcon = document.createElement("img");
    infoIcon.src = ICONS.info;
    infoIcon.alt = "info";
    infoButton.appendChild(infoIcon);

    const poweredBy = document.createElement("div");
    poweredBy.className = "armo-sdk-powered-by";
    poweredBy.textContent = "Powered by ARmo";

    setupInfoButtonEvents(infoButton, poweredBy);

    shadowRoot.appendChild(infoButton);
    shadowRoot.appendChild(poweredBy);
    innerContainer.appendChild(infoContainer);
  }

  container.appendChild(innerContainer);

  const makeupView = document.getElementById("armo-makeup-view");
  if (makeupView) {
    makeupView.appendChild(container);
  } else {
    document.body.appendChild(container);
  }

  return {
    videoElement,
    canvasElement,
    loadingElement,
  };
}

function setupInfoButtonEvents(infoButton, poweredBy) {
  let isShowingInfo = false;

  infoButton.addEventListener("click", (e) => {
    e.stopPropagation();
    isShowingInfo = !isShowingInfo;
    infoButton.style.display = isShowingInfo ? "none" : "flex";

    if (isShowingInfo) {
      poweredBy.classList.add("show");
    } else {
      // استفاده از انیمیشن نرم‌تر برای حالت خروج
      poweredBy.style.animation =
        "slideOut 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards";
      setTimeout(() => {
        poweredBy.classList.remove("show");
        poweredBy.style.animation = "";
      }, 500); // مدت زمان انیمیشن به 0.5 ثانیه افزایش پیدا کرد
    }
  });

  poweredBy.addEventListener("click", (e) => {
    e.stopPropagation();
    isShowingInfo = false;
    infoButton.style.display = "flex";
    // استفاده از انیمیشن نرم‌تر برای حالت خروج
    poweredBy.style.animation =
      "slideOut 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards";
    setTimeout(() => {
      poweredBy.classList.remove("show");
      poweredBy.style.animation = "";
    }, 500); // مدت زمان انیمیشن به 0.5 ثانیه افزایش پیدا کرد
  });
}
