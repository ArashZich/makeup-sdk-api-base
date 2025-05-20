function getUserIP() {
  // استفاده از سرویس خارجی برای دریافت IP کاربر
  return fetch("https://api.ipify.org?format=json")
    .then((response) => response.json())
    .then((data) => data.ip)
    .catch((error) => {
      console.error("Error fetching IP:", error);
      return "unknown"; // مقدار پیش‌فرض در صورت خطا
    });
}

export { getUserIP };
