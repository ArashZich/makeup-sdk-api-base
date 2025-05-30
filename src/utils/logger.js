// src/utils/logger.js

/**
 * Logger utility که فقط در development mode اجرا می‌شود
 */
class Logger {
  constructor() {
    // تشخیص محیط
    this.isDevelopment =
      process.env.NODE_ENV === "development" ||
      process.env.NODE_ENV !== "production" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.includes("dev") ||
      window.location.hostname.includes("test");

    // پیشوند برای تمام log ها
    this.prefix = "[ARMO-SDK]";

    // رنگ‌بندی برای انواع مختلف log
    this.colors = {
      log: "#1976d2", // آبی
      info: "#0288d1", // آبی روشن
      warn: "#f57f17", // زرد
      error: "#d32f2f", // قرمز
      debug: "#7b1fa2", // بنفش
      success: "#388e3c", // سبز
      trace: "#455a64", // خاکستری
    };
  }

  /**
   * بررسی اینکه آیا logging فعال است
   */
  isEnabled() {
    return this.isDevelopment;
  }

  /**
   * فرمت کردن پیام
   */
  _formatMessage(level, message, ...args) {
    const timestamp = new Date().toLocaleTimeString();
    const color = this.colors[level] || this.colors.log;

    return [
      `%c${this.prefix} [${timestamp}] ${level.toUpperCase()}:`,
      `color: ${color}; font-weight: bold;`,
      message,
      ...args,
    ];
  }

  /**
   * Log معمولی
   */
  log(message, ...args) {
    if (!this.isEnabled()) return;
    console.log(...this._formatMessage("log", message, ...args));
  }

  /**
   * اطلاعات
   */
  info(message, ...args) {
    if (!this.isEnabled()) return;
    console.info(...this._formatMessage("info", message, ...args));
  }

  /**
   * هشدار
   */
  warn(message, ...args) {
    if (!this.isEnabled()) return;
    console.warn(...this._formatMessage("warn", message, ...args));
  }

  /**
   * خطا
   */
  error(message, ...args) {
    if (!this.isEnabled()) return;
    console.error(...this._formatMessage("error", message, ...args));
  }

  /**
   * Debug - جزئیات بیشتر
   */
  debug(message, ...args) {
    if (!this.isEnabled()) return;
    console.debug(...this._formatMessage("debug", message, ...args));
  }

  /**
   * موفقیت
   */
  success(message, ...args) {
    if (!this.isEnabled()) return;
    console.log(...this._formatMessage("success", "✅ " + message, ...args));
  }

  /**
   * Trace - برای tracking جریان کد
   */
  trace(message, ...args) {
    if (!this.isEnabled()) return;
    console.trace(...this._formatMessage("trace", message, ...args));
  }

  /**
   * گروه‌بندی log ها
   */
  group(label, collapsed = false) {
    if (!this.isEnabled()) return;

    if (collapsed) {
      console.groupCollapsed(
        `%c${this.prefix} ${label}`,
        `color: ${this.colors.info}; font-weight: bold;`
      );
    } else {
      console.group(
        `%c${this.prefix} ${label}`,
        `color: ${this.colors.info}; font-weight: bold;`
      );
    }
  }

  /**
   * پایان گروه
   */
  groupEnd() {
    if (!this.isEnabled()) return;
    console.groupEnd();
  }

  /**
   * جدول - برای نمایش آرایه‌ها و آبجکت‌ها
   */
  table(data, columns) {
    if (!this.isEnabled()) return;
    this.info("Table Data:");
    console.table(data, columns);
  }

  /**
   * زمان‌سنجی شروع
   */
  time(label) {
    if (!this.isEnabled()) return;
    console.time(`${this.prefix} ${label}`);
  }

  /**
   * زمان‌سنجی پایان
   */
  timeEnd(label) {
    if (!this.isEnabled()) return;
    console.timeEnd(`${this.prefix} ${label}`);
  }

  /**
   * پاک کردن console
   */
  clear() {
    if (!this.isEnabled()) return;
    console.clear();
    this.info("Console cleared");
  }

  /**
   * Log شرطی - فقط اگر شرط true باشد
   */
  assert(condition, message, ...args) {
    if (!this.isEnabled()) return;
    console.assert(
      condition,
      ...this._formatMessage("error", message, ...args)
    );
  }

  /**
   * Log طولانی با جزئیات
   */
  verbose(category, data) {
    if (!this.isEnabled()) return;

    this.group(`Verbose: ${category}`, true);

    if (typeof data === "object") {
      Object.entries(data).forEach(([key, value]) => {
        this.debug(`${key}:`, value);
      });
    } else {
      this.debug("Data:", data);
    }

    this.groupEnd();
  }

  /**
   * Performance logging
   */
  performance(label, fn) {
    if (!this.isEnabled()) {
      return typeof fn === "function" ? fn() : undefined;
    }

    this.time(label);
    const result = typeof fn === "function" ? fn() : undefined;
    this.timeEnd(label);

    return result;
  }

  /**
   * Log آرایه یا آبجکت با فرمت زیبا
   */
  pretty(label, data) {
    if (!this.isEnabled()) return;

    this.group(label);
    console.log(JSON.stringify(data, null, 2));
    this.groupEnd();
  }

  /**
   * تنظیم سطح logging (برای آینده)
   */
  setLevel(level) {
    // می‌تواند برای کنترل سطح log ها استفاده شود
    this.level = level;
  }

  /**
   * فعال/غیرفعال کردن logger دستی
   */
  enable() {
    this.isDevelopment = true;
  }

  disable() {
    this.isDevelopment = false;
  }
}

// ایجاد instance واحد
const logger = new Logger();

// Export کردن methods مختلف
export const log = logger.log.bind(logger);
export const info = logger.info.bind(logger);
export const warn = logger.warn.bind(logger);
export const error = logger.error.bind(logger);
export const debug = logger.debug.bind(logger);
export const success = logger.success.bind(logger);
export const trace = logger.trace.bind(logger);
export const group = logger.group.bind(logger);
export const groupEnd = logger.groupEnd.bind(logger);
export const table = logger.table.bind(logger);
export const time = logger.time.bind(logger);
export const timeEnd = logger.timeEnd.bind(logger);
export const clear = logger.clear.bind(logger);
export const assert = logger.assert.bind(logger);
export const verbose = logger.verbose.bind(logger);
export const performance = logger.performance.bind(logger);
export const pretty = logger.pretty.bind(logger);

// Export کردن logger class
export default logger;

// استفاده آسان:
// import logger, { log, info, warn, error, debug, success } from './utils/logger';
//
// log('این پیام فقط در development نمایش داده می‌شود');
// info('اطلاعات مفید');
// warn('هشدار');
// error('خطا رخ داد');
// debug('جزئیات debug');
// success('عملیات موفق');
//
// group('Media Features');
// info('allowedSources:', mediaFeatures.allowedSources);
// info('comparisonModes:', mediaFeatures.comparisonModes);
// groupEnd();
//
// performance('Button Creation', () => {
//   // کد ایجاد دکمه‌ها
// });
//
// pretty('API Response', responseData);
// table(colorsArray, ['code', 'color', 'feature']);
