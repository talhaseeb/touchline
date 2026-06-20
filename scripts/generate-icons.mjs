// Simple script to generate placeholder SVG icons as PNG using canvas
// Run with: node scripts/generate-icons.mjs
import { createCanvas } from "canvas";
import { writeFileSync } from "fs";

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#16a34a";
  const r = size * 0.15;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, r);
  ctx.fill();

  // Simple football icon
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = size * 0.04;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.35, 0, Math.PI * 2);
  ctx.stroke();

  // T letter
  ctx.fillStyle = "white";
  ctx.font = `bold ${size * 0.45}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("T", size / 2, size / 2);

  return canvas.toBuffer("image/png");
}

// Only runs if canvas npm package is available
try {
  writeFileSync("public/icons/icon-192.png", generateIcon(192));
  writeFileSync("public/icons/icon-512.png", generateIcon(512));
  console.log("Icons generated");
} catch (e) {
  console.log("Skipping icon generation (canvas not installed):", e.message);
}
