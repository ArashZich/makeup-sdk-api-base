// src/ui/patternPicker.js

export function initPatternPicker(
  onPatternSelect,
  patterns,
  containerId,
  currentPattern = null
) {
  const patternPicker = document.getElementById(containerId);
  if (!patternPicker) return;

  // پاک کردن محتوای قبلی
  patternPicker.innerHTML = "";

  // اگر pattern وجود نداره یا فقط یکی هست، مخفی کن
  if (!patterns || patterns.length <= 1) {
    patternPicker.style.display = "none";
    return;
  }

  // نمایش pattern picker
  patternPicker.style.display = "flex";
  patternPicker.classList.add("armo-sdk-pattern-picker");

  // ایجاد wrapper برای pattern ها
  const patternWrapper = document.createElement("div");
  patternWrapper.className = "armo-sdk-pattern-wrapper";
  patternPicker.appendChild(patternWrapper);

  // ایجاد دکمه‌های pattern
  patterns.forEach((pattern) => {
    const patternButton = createPatternButton(
      pattern,
      onPatternSelect,
      currentPattern
    );
    patternWrapper.appendChild(patternButton);
  });
}

/**
 * ایجاد دکمه pattern ساده و شیشه‌ای
 * @param {Object} pattern - اطلاعات pattern
 * @param {Function} onPatternSelect - تابع انتخاب pattern
 * @param {string} currentPattern - pattern فعلی (lowercase)
 * @returns {HTMLElement} دکمه pattern
 */
function createPatternButton(pattern, onPatternSelect, currentPattern) {
  const button = document.createElement("button");
  button.className = "armo-sdk-pattern-button";
  button.setAttribute("data-pattern", pattern.code.toLowerCase());
  button.title = pattern.name;

  // اگر این pattern فعلی باشه، active کن
  if (currentPattern && pattern.code.toLowerCase() === currentPattern) {
    button.classList.add("active");
  }

  // فقط متن pattern (بدون عکس)
  const text = document.createElement("span");
  text.className = "armo-sdk-pattern-text";
  text.textContent = pattern.name;
  button.appendChild(text);

  // Event listener
  button.addEventListener("click", () => {
    // حذف active از تمام دکمه‌ها
    removeActivePatternClass();

    // اضافه کردن active به دکمه انتخاب شده
    button.classList.add("active");

    // فراخوانی callback
    onPatternSelect(pattern.code.toLowerCase());
  });

  return button;
}

/**
 * حذف کلاس active از تمام دکمه‌های pattern
 */
function removeActivePatternClass() {
  const buttons = document.querySelectorAll(".armo-sdk-pattern-button");
  buttons.forEach((button) => button.classList.remove("active"));
}

/**
 * بروزرسانی pattern انتخاب شده
 * @param {string} patternCode - کد pattern (lowercase)
 */
export function updateSelectedPattern(patternCode) {
  removeActivePatternClass();

  const button = document.querySelector(
    `.armo-sdk-pattern-button[data-pattern="${patternCode}"]`
  );

  if (button) {
    button.classList.add("active");
  }
}
