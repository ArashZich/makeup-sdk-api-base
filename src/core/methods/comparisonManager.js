export class ComparisonManager {
  constructor(container, canvas) {
    this.container = container;
    this.canvas = canvas;
    this.isActive = false;
    this.isDragging = false;
    this.dividerPosition = 0.5;
    this.startX = 0;
    this.currentX = 0;
    this.lastFrameTime = 0;
    this.animationFrameId = null;

    this.setup();
    this.setupEvents();
  }

  setup() {
    // ایجاد کانتینر مقایسه
    this.comparisonContainer = document.createElement("div");
    this.comparisonContainer.className = "armo-sdk-comparison-container";
    this.comparisonContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: hidden;
      z-index: 5;
    `;

    // ایجاد خط جداکننده
    this.divider = document.createElement("div");
    this.divider.className = "armo-sdk-comparison-divider";
    this.divider.style.cssText = `
      position: absolute;
      top: 40%;
      left: 50%;
      width: 4px;
      height: 719px;
      transform: translate(-50%, -50%);
      display: none;
      pointer-events: auto;
      cursor: ew-resize;
      z-index: 2;
      transition: left 0.05s cubic-bezier(0.4, 0, 0.2, 1);
      will-change: left;
      touch-action: none;
    `;

    // خط میانی با گرادینت
    this.dividerLine = document.createElement("div");
    this.dividerLine.className = "armo-sdk-divider-line";
    this.dividerLine.style.cssText = `
      position: absolute;
      width: 4px;
      height: 719px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, #FFFFFF 50%, rgba(255, 255, 255, 0) 100%);
      left: 50%;
      transform: translateX(-50%);
      will-change: transform;
    `;

    // ایجاد فلش‌های جدا از دایره با استفاده از تصاویر
    const leftArrow = document.createElement("img");
    leftArrow.src =
      "https://armogroup.storage.iran.liara.space/makeup-sdk/chevron-left.svg";
    leftArrow.style.cssText = `
     position: absolute;
     left: -24px;
     top: 30%;
     transform: translateY(-50%);
     width: 24px;
     height: 24px;
     max-width: 24px;
   `;

    const rightArrow = document.createElement("img");
    rightArrow.src =
      "https://armogroup.storage.iran.liara.space/makeup-sdk/chevron-right.svg";
    rightArrow.style.cssText = `
     position: absolute;
     right: -24px;
     top: 30%;
     transform: translateY(-50%);
     width: 24px;
     height: 24px;
     max-width: 24px;
   `;

    // اضافه کردن عناصر به ساختار
    this.divider.appendChild(this.dividerLine);
    this.divider.appendChild(leftArrow);
    this.divider.appendChild(rightArrow);
    this.comparisonContainer.appendChild(this.divider);
    this.container.appendChild(this.comparisonContainer);
  }

  setupEvents() {
    let rafPending = false;
    const minMovement = 1; // حداقل حرکت برای آپدیت (پیکسل)
    let lastX = 0;

    const handleStart = (e) => {
      if (!this.isActive) return;

      this.isDragging = true;
      this.divider.classList.add("dragging");

      if (e.type === "touchstart") {
        this.startX = e.touches[0].clientX;
        lastX = this.startX;
      } else {
        this.startX = e.clientX;
        lastX = this.startX;
      }

      e.preventDefault();
      // this.handle.style.transform = "translate(-50%, -50%) scale(1.1)";
    };

    const updatePosition = (clientX) => {
      if (Math.abs(clientX - lastX) < minMovement) return;

      lastX = clientX;
      const bounds = this.container.getBoundingClientRect();
      this.dividerPosition = (clientX - bounds.left) / bounds.width;
      this.dividerPosition = Math.max(0, Math.min(1, this.dividerPosition));

      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(() => {
          this.updateDividerPosition();
          rafPending = false;
        });
      }
    };

    const handleMove = (e) => {
      if (!this.isDragging) return;

      const clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
      updatePosition(clientX);

      e.preventDefault();
    };

    const handleEnd = () => {
      if (!this.isDragging) return;

      this.isDragging = false;
      this.divider.classList.remove("dragging");
      // حذف خط زیر که به handle اشاره می‌کرد
      // this.handle.style.transform = "translate(-50%, -50%)";

      const finalPosition = Math.round(this.dividerPosition * 100) / 100;
      if (finalPosition !== this.dividerPosition) {
        this.dividerPosition = finalPosition;
        this.updateDividerPosition();
      }
    };

    // Touch events with passive: false for better performance

    this.divider.addEventListener("touchstart", handleStart, {
      passive: false,
    });
    document.addEventListener("touchmove", handleMove, { passive: false });
    document.addEventListener("touchend", handleEnd);
    document.addEventListener("touchcancel", handleEnd);

    this.divider.addEventListener("mousedown", handleStart);
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleEnd);

    // Cleanup function
    this.cleanup = () => {
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleEnd);
      document.removeEventListener("touchcancel", handleEnd);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleEnd);
    };
  }

  updateDividerPosition() {
    const position = `${this.dividerPosition * 100}%`;

    if (this.divider) {
      // برای حرکت نرم‌تر از transform استفاده می‌کنیم
      this.divider.style.left = position;
    }
  }

  getClipRegion() {
    if (!this.isActive) return null;

    return {
      x: 0,
      y: 0,
      width: this.canvas.width * this.dividerPosition,
      height: this.canvas.height,
    };
  }

  enable() {
    this.isActive = true;
    this.divider.style.display = "flex";
    requestAnimationFrame(() => {
      this.divider.style.opacity = "1";
      this.updateDividerPosition();
    });
  }

  disable() {
    this.isActive = false;
    this.isDragging = false;
    this.divider.style.opacity = "0";
    setTimeout(() => {
      if (!this.isActive) {
        this.divider.style.display = "none";
      }
    }, 150);
  }

  cleanup() {
    if (typeof this.cleanup === "function") {
      this.cleanup();
    }
    if (this.comparisonContainer && this.comparisonContainer.parentElement) {
      this.comparisonContainer.parentElement.removeChild(
        this.comparisonContainer
      );
    }
  }
}
