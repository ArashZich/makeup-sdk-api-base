import { lerp, shadeColor, PERLIN_PERMUTATION } from "./utils";

export function createRainbowNoise2D() {
  const p = new Array(512);

  for (let i = 0; i < 256; i++) p[256 + i] = p[i] = PERLIN_PERMUTATION[i];

  function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  function grad(hash, x, y) {
    const h = hash & 15;
    const u = h < 8 ? x : y,
      v = h < 4 ? y : h == 12 || h == 14 ? x : 0;
    return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
  }

  return function (x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = fade(x);
    const v = fade(y);
    const A = p[X] + Y,
      B = p[X + 1] + Y;
    return lerp(
      v,
      lerp(u, grad(p[A], x, y), grad(p[B], x - 1, y)),
      lerp(u, grad(p[A + 1], x, y - 1), grad(p[B + 1], x - 1, y - 1))
    );
  };
}
export function drawRainbowLens(
  canvasCtx,
  centerX,
  centerY,
  radius,
  baseColor,
  lensOpacity
) {
  const noise2D = createRainbowNoise2D();
  const scale = 0.1;
  const detailScale = 0.5;
  const darkColor = shadeColor(baseColor, -30);
  const lightColor = shadeColor(baseColor, 30);

  for (let y = centerY - radius; y < centerY + radius; y++) {
    for (let x = centerX - radius; x < centerX + radius; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      if (dx * dx + dy * dy <= radius * radius) {
        const dist = Math.sqrt(dx * dx + dy * dy) / radius;

        let noiseValue = (noise2D(x * scale, y * scale) + 1) / 2;
        noiseValue +=
          ((noise2D(x * detailScale, y * detailScale) + 1) / 2) * 0.2;
        const colorValue = lerp(noiseValue, 0.2, 0.8);

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
          lensOpacity * (1 - dist * 0.5)
        })`;
        canvasCtx.fillRect(x, y, 1, 1);
      }
    }
  }

  addFineDetails(canvasCtx, centerX, centerY, radius);
}

function addFineDetails(canvasCtx, centerX, centerY, radius) {
  const detailCount = 200;
  canvasCtx.strokeStyle = `rgba(255, 255, 255, 0.1)`;
  canvasCtx.lineWidth = 0.5;

  for (let i = 0; i < detailCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const length = Math.random() * radius * 0.5 + radius * 0.3;
    const startRadius = Math.random() * radius * 0.2 + radius * 0.1;

    canvasCtx.beginPath();
    canvasCtx.moveTo(
      centerX + Math.cos(angle) * startRadius,
      centerY + Math.sin(angle) * startRadius
    );
    canvasCtx.lineTo(
      centerX + Math.cos(angle) * (startRadius + length),
      centerY + Math.sin(angle) * (startRadius + length)
    );
    canvasCtx.stroke();
  }
}
