// src/ui/imageUpload.js

import { ICONS } from "../utils";

export function createImageUploadUI(onImageSelect, onClose) {
  // ایجاد المان‌های DOM
  const uploadArea = document.createElement("div");
  uploadArea.className = "armo-sdk-upload-area active";

  const uploadContainer = document.createElement("div");
  uploadContainer.className = "armo-sdk-upload-container";

  // آیکون آپلود
  const iconContainer = document.createElement("div");
  iconContainer.className = "armo-sdk-upload-icon";

  const iconImage = document.createElement("img");
  iconImage.src = ICONS.image;
  iconImage.alt = "Upload";
  iconContainer.appendChild(iconImage);

  // متن راهنما
  const textContainer = document.createElement("div");
  textContainer.className = "armo-sdk-upload-text";
  textContainer.innerHTML =
    "عکس خود را اینجا رها کنید<span>یا با کلیک روی دکمه زیر انتخاب کنید</span>";

  // دکمه انتخاب فایل
  const uploadButton = document.createElement("button");
  uploadButton.className = "armo-sdk-upload-button";
  uploadButton.textContent = "انتخاب عکس";

  // input فایل
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.className = "armo-sdk-upload-input";
  fileInput.accept = "image/*";

  // دکمه بستن
  const closeButton = document.createElement("button");
  closeButton.className = "armo-sdk-close-upload";

  const closeIcon = document.createElement("img");
  closeIcon.src = ICONS.close;
  closeIcon.alt = "Close";
  closeButton.appendChild(closeIcon);

  // اضافه کردن المان‌ها به یکدیگر
  uploadContainer.appendChild(iconContainer);
  uploadContainer.appendChild(textContainer);
  uploadContainer.appendChild(uploadButton);
  uploadContainer.appendChild(fileInput);
  uploadArea.appendChild(uploadContainer);
  uploadArea.appendChild(closeButton);

  // تنظیم event listeners
  uploadButton.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageFile(file, onImageSelect);
    }
  });

  closeButton.addEventListener("click", () => {
    onClose();
    uploadArea.remove();
  });

  // Drag & Drop events
  uploadContainer.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadContainer.classList.add("drag-over");
  });

  uploadContainer.addEventListener("dragleave", () => {
    uploadContainer.classList.remove("drag-over");
  });

  uploadContainer.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadContainer.classList.remove("drag-over");

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleImageFile(file, onImageSelect);
    }
  });

  return uploadArea;
}

function handleImageFile(file, onImageSelect) {
  const reader = new FileReader();
  reader.onload = (e) => {
    onImageSelect(e.target.result);
  };
  reader.readAsDataURL(file);
}

export function initImageUpload(container, onImageSelect) {
  let uploadUI = null;

  function showUploadUI(onModalClose) {
    if (uploadUI) {
      uploadUI.remove();
    }
    uploadUI = createImageUploadUI(
      (imageData) => {
        onImageSelect(imageData);
        uploadUI.remove();
      },
      () => {
        // اجرای callback برگشت به حالت دوربین
        if (typeof onModalClose === "function") {
          onModalClose();
        }
        uploadUI.remove();
      }
    );
    container.appendChild(uploadUI);
  }

  return {
    show: showUploadUI,
  };
}
