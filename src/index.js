// src/index.js

import Makeup from "./core/makeup";

// تابع برای بررسی آماده بودن DOM
function domReady(fn) {
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    setTimeout(fn, 1);
  } else {
    document.addEventListener("DOMContentLoaded", fn);
  }
}

// تابع اصلی برای راه‌اندازی SDK
function initializeSDK() {
  if (typeof window !== "undefined") {
    function showWelcomeMessage() {
      console.log(
        "%cWelcome to ARmo Virtual Makeup!",
        "color: #5E35B1; font-size: 24px; font-weight: bold; text-shadow: 2px 2px 4px rgba(94, 53, 177, 0.3); background: linear-gradient(45deg, #B39DDB, #5E35B1); padding: 10px; border-radius: 5px;"
      );
      console.log(
        "%cPowered by ARmo - https://armogroup.tech",
        "color: #B39DDB; font-size: 16px; font-style: italic; text-decoration: underline; margin-top: 5px;"
      );
      console.log(
        "%c⚡ Experience the Future of Virtual Makeup ⚡",
        "color: #5E35B1; font-size: 18px; font-weight: bold; border: 2px solid #5E35B1; padding: 5px; border-radius: 3px; margin-top: 10px;"
      );
    }
    showWelcomeMessage();

    // فقط در محیط تولید اجرا می‌شود
    if (process.env.NODE_ENV === "production") {
      // جلوگیری از راست کلیک
      document.addEventListener("contextmenu", (event) =>
        event.preventDefault()
      );

      // جلوگیری از استفاده از کلیدهای توسعه‌دهنده
      document.addEventListener("keydown", (event) => {
        if (
          event.key === "F12" ||
          (event.ctrlKey && event.shiftKey && event.key === "I") ||
          (event.ctrlKey && event.shiftKey && event.key === "C") ||
          (event.ctrlKey && event.shiftKey && event.key === "J") ||
          (event.ctrlKey && event.key === "U")
        ) {
          event.preventDefault();
        }
      });
    }

    window.Makeup = Makeup;

    // توکن را به صورت جهانی تنظیم می‌کنیم
    window.Makeup.setToken = function (token) {
      window.Makeup.token = token;
    };

    // تابع راه‌اندازی برای ایجاد نمونه Makeup
    window.initMakeup = function (options) {
      if (!window.Makeup.token) {
        console.error(
          "لطفاً قبل از راه‌اندازی، توکن را با استفاده از window.Makeup.setToken تنظیم کنید"
        );
        return;
      }
      return new Makeup(options);
    };
  }
}

// اجرای تابع راه‌اندازی پس از آماده شدن DOM
domReady(initializeSDK);

export { Makeup as default };
