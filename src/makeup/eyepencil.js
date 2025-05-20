// src/makeup/eyepencil.js

let eyepencilColor = "#000000";
let eyepencilThickness = 1.5;
let eyepencilStyle = "normal";
let eyepencilOpacity = 0.8;

export function changeEyepencilColor(color) {
  eyepencilColor = color;
}

export function setEyepencilThickness(thickness) {
  eyepencilThickness = thickness;
}

export function setEyepencilStyle(style) {
  eyepencilStyle = style;
}

export function setEyepencilOpacity(opacity) {
  eyepencilOpacity = opacity;
}

export function applyEyepencil(landmarks, canvasCtx) {
  const width = canvasCtx.canvas.width;
  const height = canvasCtx.canvas.height;

  // نقاط مربوط به مداد چشم
  const leftEyePoints = [
    33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7,
    33,
  ];
  const rightEyePoints = [
    362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381,
    382, 362,
  ];

  canvasCtx.strokeStyle = eyepencilColor;
  canvasCtx.lineWidth = eyepencilThickness;
  canvasCtx.lineCap = "round";
  canvasCtx.lineJoin = "round";
  canvasCtx.globalAlpha = eyepencilOpacity;

  drawEyepencil(landmarks, canvasCtx, leftEyePoints, width, height);
  drawEyepencil(landmarks, canvasCtx, rightEyePoints, width, height);

  canvasCtx.globalAlpha = 1;
}

function drawEyepencil(landmarks, canvasCtx, eyePoints, width, height) {
  canvasCtx.beginPath();
  eyePoints.forEach((point, index) => {
    const x = landmarks[point].x * width;
    const y = landmarks[point].y * height;
    if (index === 0) {
      canvasCtx.moveTo(x, y);
    } else {
      canvasCtx.lineTo(x, y);
    }
  });

  canvasCtx.stroke();
}
