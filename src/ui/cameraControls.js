// src/ui/cameraControls.js
import { ICONS } from "../utils";

export function initCameraControls(mediaFeatures = {}) {
  const container = document.createElement("div");
  container.className = "armo-sdk-camera-controls";

  const {
    allowedViews = [],
    comparisonModes = [],
    allowedSources = [],
  } = mediaFeatures;

  const buttons = [];

  // Add compare button if comparison mode is allowed
  if (comparisonModes.includes("before-after")) {
    buttons.push({ name: "compare", icon: ICONS.compare });
  }

  // Add settings button if multi-view is allowed
  if (allowedViews.includes("multi")) {
    buttons.push({ name: "settings", icon: ICONS.settings });
  }

  // // Add camera button if camera source is allowed
  // if (allowedSources.includes("camera")) {
  //   buttons.push({ name: "camera", icon: ICONS.camera });
  // }

  // Add image button if image source is allowed
  if (allowedSources.includes("image")) {
    buttons.push({ name: "image", icon: ICONS.image });
  }
  // Create and append all control buttons
  buttons.forEach((button) => {
    const buttonElement = createControlButton(button.name, button.icon);
    container.appendChild(buttonElement);
  });

  // Get container element
  const sdkContainer = document.querySelector(".armo-sdk-container");
  if (!sdkContainer) return;

  // Add controls container
  sdkContainer.appendChild(container);
}

function createControlButton(name, iconSrc) {
  const button = document.createElement("button");
  button.className = "armo-sdk-camera-control-button";
  button.setAttribute("data-control", name);

  const icon = document.createElement("img");
  icon.src = iconSrc;
  icon.alt = name;

  button.appendChild(icon);
  button.addEventListener("click", () => handleControlClick(name, button));

  return button;
}

function handleControlClick(name, button) {
  // اگر دکمه قبلاً فعال بوده
  if (button.classList.contains("active")) {
    // غیرفعال کردن دکمه
    button.classList.remove("active");
  } else {
    // غیرفعال کردن همه دکمه‌ها
    document
      .querySelectorAll(".armo-sdk-camera-control-button")
      .forEach((btn) => btn.classList.remove("active"));

    // فعال کردن دکمه جدید
    button.classList.add("active");
  }

  // ارسال event با وضعیت جدید دکمه
  const event = new CustomEvent("armoControlClick", {
    detail: {
      control: name,
      active: button.classList.contains("active"),
    },
  });
  document.dispatchEvent(event);
}

export default initCameraControls;
