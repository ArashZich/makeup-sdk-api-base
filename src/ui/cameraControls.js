// src/ui/cameraControls.js
import { ICONS } from "../utils";
import { log, warn, fatal } from "../utils/logger";

export function initCameraControls(mediaFeatures = {}) {
  log("initCameraControls called with:", mediaFeatures);

  // بررسی اینکه آیا قبلاً کنترل‌ها اضافه شده‌اند
  const existingControls = document.querySelector(".armo-sdk-camera-controls");
  if (existingControls) {
    log("Camera controls already exist, removing...");
    existingControls.remove();
  }

  const container = document.createElement("div");
  container.className = "armo-sdk-camera-controls";

  const {
    allowedViews = [],
    comparisonModes = [],
    allowedSources = [],
  } = mediaFeatures;

  log("Extracted features:", {
    allowedViews,
    comparisonModes,
    allowedSources,
  });

  const buttons = [];

  // Add compare button if comparison mode is allowed
  if (comparisonModes.includes("before-after")) {
    log("Adding compare button");
    buttons.push({ name: "compare", icon: ICONS.compare });
  }

  // Add settings button if multi-view is allowed
  if (allowedViews.includes("multi")) {
    log("Adding settings button");
    buttons.push({ name: "settings", icon: ICONS.settings });
  }

  // Add image button if image source is allowed
  if (allowedSources.includes("image")) {
    log("Adding image button");
    buttons.push({ name: "image", icon: ICONS.image });
  }

  log("Total buttons to create:", buttons.length, buttons);

  // اگر هیچ دکمه‌ای نیست، container رو اضافه نکن
  if (buttons.length === 0) {
    warn("No buttons to create based on media features");
    return;
  }

  // Create and append all control buttons
  buttons.forEach((button) => {
    log(`Creating button: ${button.name}`);
    const buttonElement = createControlButton(button.name, button.icon);
    container.appendChild(buttonElement);
  });

  // Get container element
  const sdkContainer = document.querySelector(".armo-sdk-container");
  if (!sdkContainer) {
    fatal("SDK container not found!");
    return;
  }

  log("Adding camera controls to container");
  // Add controls container
  sdkContainer.appendChild(container);

  log("Camera controls added successfully");
}

function createControlButton(name, iconSrc) {
  log(`Creating control button: ${name} with icon: ${iconSrc}`);

  const button = document.createElement("button");
  button.className = "armo-sdk-camera-control-button";
  button.setAttribute("data-control", name);
  button.setAttribute("data-tooltip", getTooltipText(name));

  const icon = document.createElement("img");
  icon.src = iconSrc;
  icon.alt = name;
  icon.onerror = () => {
    fatal(`Failed to load icon for ${name}: ${iconSrc}`);
  };

  button.appendChild(icon);
  button.addEventListener("click", () => handleControlClick(name, button));

  return button;
}

function getTooltipText(name) {
  const tooltips = {
    compare: "مقایسه قبل/بعد",
    image: "آپلود تصویر",
    settings: "تنظیمات",
    camera: "دوربین",
  };
  return tooltips[name] || name;
}

function handleControlClick(name, button) {
  log(
    `Control clicked: ${name}, current state: ${button.classList.contains(
      "active"
    )}`
  );

  // اگر دکمه قبلاً فعال بوده
  if (button.classList.contains("active")) {
    // غیرفعال کردن دکمه
    button.classList.remove("active");
    log(`Deactivated ${name}`);
  } else {
    // غیرفعال کردن همه دکمه‌ها
    document
      .querySelectorAll(".armo-sdk-camera-control-button")
      .forEach((btn) => btn.classList.remove("active"));

    // فعال کردن دکمه جدید
    button.classList.add("active");
    log(`Activated ${name}`);
  }

  // ارسال event با وضعیت جدید دکمه
  const event = new CustomEvent("armoControlClick", {
    detail: {
      control: name,
      active: button.classList.contains("active"),
    },
  });

  log("Dispatching armoControlClick event:", event.detail);
  document.dispatchEvent(event);
}

export default initCameraControls;
