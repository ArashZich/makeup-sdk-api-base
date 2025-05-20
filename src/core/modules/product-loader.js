// src/core/modules/product-loader.js

/**
 * کلاس بارگذاری و مدیریت اطلاعات محصول
 */
export class ProductLoader {
  /**
   * سازنده کلاس ProductLoader
   * @param {Object} managers - مدیرهای مختلف
   */
  constructor(managers) {
    this.apiHandler = managers.apiHandler;
    this.productManager = managers.productManager;
    this.featureManager = managers.featureManager;
    this.uiManager = managers.uiManager;
  }

  /**
   * بارگذاری اطلاعات محصول
   * @param {string} productUid - شناسه محصول
   * @returns {Promise<Object|null>} اطلاعات محصول یا null در صورت خطا
   */
  async loadProduct(productUid) {
    try {
      if (!productUid) {
        throw new Error("شناسه محصول نامعتبر است");
      }

      this.uiManager.showLoading();

      // دریافت اطلاعات محصول و توکن
      const result = await this.apiHandler.loadProductAndTokenInfo(productUid);

      if (!result.isValid) {
        this.uiManager.showErrorMessage(
          "خطا در اعتبارسنجی",
          "توکن نامعتبر است"
        );
        return null;
      }

      if (result.projectType !== "makeup") {
        this.uiManager.showErrorMessage(
          "خطا در نوع پروژه",
          "این توکن برای پروژه آرایش مجازی معتبر نیست"
        );
        return null;
      }

      // اگر اطلاعات محصول موجود است
      if (result.productInfo) {
        // تنظیم اطلاعات محصول در productManager
        this.productManager.setProductInfo(result.productInfo);

        // تنظیم اطلاعات محصول در featureManager
        this.featureManager.setProductInfo(result.productInfo);

        // بروزرسانی رابط کاربری
        this._updateUI(result.productInfo);

        return result.productInfo;
      } else {
        this.uiManager.showWarningMessage(
          "محصول یافت نشد",
          "اطلاعات محصول مورد نظر یافت نشد"
        );
        return null;
      }
    } catch (error) {
      console.error("خطا در بارگذاری محصول:", error);
      this.uiManager.showErrorMessage(
        "خطا",
        "مشکلی در بارگذاری اطلاعات محصول رخ داد"
      );
      return null;
    } finally {
      this.uiManager.hideLoading();
    }
  }

  /**
   * بروزرسانی رابط کاربری بر اساس اطلاعات محصول
   * @param {Object} productInfo - اطلاعات محصول
   * @private
   */
  _updateUI(productInfo) {
    // بروزرسانی ColorPicker
    if (productInfo.colors && productInfo.colors.length > 0) {
      const colors = productInfo.colors.map((color) => ({
        code: color.name,
        color: color.hexCode,
        url: color.imageUrl,
        feature: productInfo.type,
      }));

      this.uiManager.updateColorPicker(
        (color) => this._onColorSelect(color),
        colors,
        this.featureManager
      );
    }

    // TODO: بروزرسانی PatternPicker اگر پیاده‌سازی شده باشد
  }

  /**
   * عملیات انتخاب رنگ
   * @param {string} color - رنگ انتخاب شده
   * @private
   */
  _onColorSelect(color) {
    if (this.productManager) {
      const selectedColor = this.productManager.setCurrentColor(color);

      // TODO: فراخوانی تابع تغییر رنگ در کلاس Makeup
    }
  }

  /**
   * استخراج رنگ غالب از تصویر
   * @param {string} imageUrl - آدرس تصویر
   * @returns {Promise<string>} کد رنگ هگز استخراج شده
   */
  async extractDominantColor(imageUrl) {
    if (!imageUrl) {
      throw new Error("آدرس تصویر نامعتبر است");
    }

    try {
      // استفاده از تابع استخراج رنگ از utils
      const { extractDominantColor } = await import(
        "../../utils/colorExtractor"
      );
      return await extractDominantColor(imageUrl);
    } catch (error) {
      console.error("خطا در استخراج رنگ از تصویر:", error);
      throw error;
    }
  }

  /**
   * افزودن رنگ جدید از طریق URL تصویر
   * @param {string} imageUrl - آدرس تصویر
   * @param {string} code - کد رنگ
   * @param {string} feature - ویژگی مرتبط (اختیاری)
   * @returns {Promise<string>} کد رنگ استخراج شده
   */
  async addColorFromImage(imageUrl, code, feature = null) {
    if (!imageUrl) {
      throw new Error("آدرس تصویر نامعتبر است");
    }

    try {
      // استخراج رنگ از تصویر
      const extractedColor = await this.extractDominantColor(imageUrl);

      // ایجاد آبجکت رنگ جدید
      const newColor = {
        code: code || `C${Date.now()}`,
        color: extractedColor,
        url: imageUrl,
      };

      // اضافه کردن ویژگی اگر مشخص شده باشد
      if (feature) {
        newColor.feature = feature;
      }

      // اگر productManager موجود است، رنگ را به آن اضافه می‌کنیم
      if (this.productManager && this.productManager.hasValidProduct()) {
        // TODO: پیاده‌سازی متد addColor در ProductManager
      }

      return extractedColor;
    } catch (error) {
      console.error("خطا در استخراج رنگ از تصویر:", error);
      throw error;
    }
  }
}

export default ProductLoader;
