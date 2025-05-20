// src/react-loader.js

(function () {
  function loadScript(src, callback) {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = src;
    script.onload = function () {
      callback(null);
    };
    script.onerror = function (error) {
      console.error("خطا در بارگذاری اسکریپت:", error);
      callback(new Error("خطا در بارگذاری اسکریپت"));
    };
    document.head.appendChild(script);
  }

  function loadStylesheet(href, callback) {
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.onload = function () {
      callback(null);
    };
    link.onerror = function (error) {
      console.error("خطا در بارگذاری استایل‌شیت:", error);
      callback(new Error("خطا در بارگذاری استایل‌شیت"));
    };
    document.head.appendChild(link);
  }

  function initSDK() {
    if (window.Makeup && typeof window.Makeup === "function") {
      return;
    }

    var baseUrl = process.env.REACT_SDK_URL + process.env.VERSION + "/";

    loadStylesheet(baseUrl + "makeup.min.css", function (error) {
      if (error) {
        console.error("خطا در بارگذاری فایل CSS");
        showErrorMessage(
          "خطا در بارگذاری",
          "مشکلی در بارگذاری فایل‌های استایل رخ داده است. لطفاً صفحه را رفرش کرده و مجدداً تلاش کنید."
        );
        return;
      }

      loadScript(baseUrl + "makeup.min.js", function (error) {
        if (error) {
          console.error("خطا در بارگذاری فایل JavaScript");
          showErrorMessage(
            "خطا در بارگذاری",
            "مشکلی در بارگذاری فایل‌های اسکریپت رخ داده است. لطفاً صفحه را رفرش کرده و مجدداً تلاش کنید."
          );
          return;
        }

        setTimeout(() => {
          if (typeof window.Makeup === "function") {
            window.dispatchEvent(new Event("ARmoMakeupSDKLoaded"));
          } else {
            console.error(
              "SDK آرایش مجازی ARmo پس از بارگذاری اسکریپت یافت نشد"
            );
            showErrorMessage(
              "خطا در بارگذاری SDK",
              "مشکلی در بارگذاری SDK آرایش مجازی ARmo رخ داده است. لطفاً صفحه را رفرش کرده و مجدداً تلاش کنید."
            );
          }
        }, 100);
      });
    });
  }

  function checkEnvironmentVariables() {
    if (!process.env.REACT_SDK_URL) {
      console.error("متغیر محیطی REACT_SDK_URL تنظیم نشده است");
      showErrorMessage(
        "خطا در تنظیمات",
        "تنظیمات SDK به درستی انجام نشده است. لطفاً با پشتیبانی تماس بگیرید."
      );
      return false;
    }
    if (!process.env.VERSION) {
      console.error("متغیر محیطی VERSION تنظیم نشده است");
      showErrorMessage(
        "خطا در تنظیمات",
        "تنظیمات نسخه SDK به درستی انجام نشده است. لطفاً با پشتیبانی تماس بگیرید."
      );
      return false;
    }
    return true;
  }

  function onDOMReady(callback) {
    if (
      document.readyState === "complete" ||
      document.readyState === "interactive"
    ) {
      setTimeout(callback, 1);
    } else {
      document.addEventListener("DOMContentLoaded", callback);
    }
  }

  function showErrorMessage(title, message) {
    const errorElement = document.createElement("div");
    errorElement.className = "armo-sdk-error-message";

    const titleElement = document.createElement("h3");
    titleElement.textContent = title;
    errorElement.appendChild(titleElement);

    const messageElement = document.createElement("p");
    messageElement.textContent = message;
    errorElement.appendChild(messageElement);

    document.body.appendChild(errorElement);
  }

  onDOMReady(function () {
    if (checkEnvironmentVariables()) {
      initSDK();
    } else {
      console.error(
        "عدم موفقیت در راه‌اندازی SDK به دلیل عدم وجود متغیرهای محیطی"
      );
    }
  });
})();
