import { lerp, shadeColor, PERLIN_PERMUTATION } from "./utils";

/**
 * ایجاد نویز پرلین دو بعدی
 * @returns {function} تابع تولید نویز پرلین دو بعدی
 */
function createDesioNoise2D() {
  const p = new Array(512);

  for (let i = 0; i < 256; i++) {
    p[256 + i] = p[i] = PERLIN_PERMUTATION[i];
  }

  return function (x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = fade(x);
    const v = fade(y);
    const A = p[X] + Y;
    const B = p[X + 1] + Y;
    return lerp(
      v,
      lerp(u, grad(p[A], x, y), grad(p[B], x - 1, y)),
      lerp(u, grad(p[A + 1], x, y - 1), grad(p[B + 1], x - 1, y - 1))
    );
  };

  function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  function grad(hash, x, y) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
}

/**
 * رسم لنز Desio Attitude
 * @param {CanvasRenderingContext2D} canvasCtx - کانتکس بوم
 * @param {number} centerX - مختصات X مرکز لنز
 * @param {number} centerY - مختصات Y مرکز لنز
 * @param {number} radius - شعاع لنز
 * @param {string} baseColor - رنگ پایه لنز
 * @param {number} lensOpacity - مقدار شفافیت لنز
 */
export function drawDesioAttitudeLens(
  canvasCtx,
  centerX,
  centerY,
  radius,
  baseColor,
  lensOpacity
) {
  const noise2D = createDesioNoise2D();
  const scale = 0.05;
  const detailScale = 0.2;
  const darkColor = shadeColor(baseColor, -30);
  const lightColor = shadeColor(baseColor, 30);

  // رسم الگوی Desio با استفاده از نویز و جزئیات شعاعی
  for (let y = centerY - radius; y < centerY + radius; y++) {
    for (let x = centerX - radius; x < centerX + radius; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      if (dx * dx + dy * dy <= radius * radius) {
        const dist = Math.sqrt(dx * dx + dy * dy) / radius;
        const angle = Math.atan2(dy, dx);

        let noiseValue = (noise2D(x * scale, y * scale) + 1) / 2;
        noiseValue +=
          ((noise2D(x * detailScale, y * detailScale) + 1) / 2) * 0.3;

        // افزودن جزئیات شعاعی و زاویه‌ای
        noiseValue += Math.sin(angle * 8) * 0.15;
        noiseValue += Math.cos(dist * Math.PI * 3) * 0.1;

        const colorValue = lerp(noiseValue, 0.3, 0.7);

        const r = lerp(
          colorValue,
          parseInt(darkColor.slice(1, 3), 16),
          parseInt(lightColor.slice(1, 3), 16)
        );
        const g = lerp(
          colorValue,
          parseInt(darkColor.slice(3, 5), 16),
          parseInt(lightColor.slice(3, 5), 16)
        );
        const b = lerp(
          colorValue,
          parseInt(darkColor.slice(5, 7), 16),
          parseInt(lightColor.slice(5, 7), 16)
        );

        canvasCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${
          lensOpacity * (1 - dist * 0.25)
        })`;
        canvasCtx.fillRect(x, y, 1, 1);
      }
    }
  }

  addDesioDetails(canvasCtx, centerX, centerY, radius);
}

/**
 * افزودن جزئیات Desio به لنز
 * @param {CanvasRenderingContext2D} canvasCtx - کانتکس بوم
 * @param {number} centerX - مختصات X مرکز لنز
 * @param {number} centerY - مختصات Y مرکز لنز
 * @param {number} radius - شعاع لنز
 */
function addDesioDetails(canvasCtx, centerX, centerY, radius) {
  const detailCount = 16;
  const angleStep = (Math.PI * 2) / detailCount;

  canvasCtx.strokeStyle = `rgba(255, 255, 255, 0.3)`;
  canvasCtx.lineWidth = 0.5;

  for (let i = 0; i < detailCount; i++) {
    const angle = i * angleStep;
    const startRadius = radius * 0.25;
    const endRadius = radius * 0.85;

    canvasCtx.beginPath();
    canvasCtx.moveTo(
      centerX + Math.cos(angle) * startRadius,
      centerY + Math.sin(angle) * startRadius
    );
    canvasCtx.lineTo(
      centerX + Math.cos(angle) * endRadius,
      centerY + Math.sin(angle) * endRadius
    );
    canvasCtx.stroke();

    // افزودن جزئیات کوچک‌تر
    const subDetailCount = 4;
    for (let j = 0; j < subDetailCount; j++) {
      const subAngle = angle + (Math.random() - 0.5) * angleStep * 0.5;
      const subStartRadius =
        startRadius + Math.random() * (endRadius - startRadius);
      const subEndRadius =
        subStartRadius + Math.random() * (endRadius - subStartRadius);

      canvasCtx.beginPath();
      canvasCtx.moveTo(
        centerX + Math.cos(subAngle) * subStartRadius,
        centerY + Math.sin(subAngle) * subStartRadius
      );
      canvasCtx.lineTo(
        centerX + Math.cos(subAngle) * subEndRadius,
        centerY + Math.sin(subAngle) * subEndRadius
      );
      canvasCtx.stroke();
    }
  }
}
