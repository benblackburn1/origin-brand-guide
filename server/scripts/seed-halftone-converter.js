#!/usr/bin/env node

/**
 * Seed Script: Halftone Vector Converter Tool
 *
 * Converts uploaded images into vector halftone patterns with black dots on transparent background.
 * Exports to SVG, PDF, and EPS formats.
 *
 * Run: node server/scripts/seed-halftone-converter.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const BrandTool = require('../models/BrandTool');

// ---------------------------------------------------------------------------
// HTML
// ---------------------------------------------------------------------------
const html_code = `
<div id="halftone-app">
  <!-- Left: Preview Area -->
  <div class="ht-preview-col">
    <div class="ht-canvas-wrap" id="ht-canvas-wrap">
      <!-- Drop zone shown when no image -->
      <div class="ht-dropzone" id="ht-dropzone">
        <div class="ht-dropzone-content">
          <svg class="ht-upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <p class="ht-dropzone-title">Drop image here</p>
          <p class="ht-dropzone-hint">or click to browse</p>
          <input type="file" id="ht-file-input" accept="image/*" class="ht-file-hidden">
        </div>
      </div>
      <!-- Preview canvas (hidden until image loaded) -->
      <canvas id="ht-source-canvas" class="ht-hidden"></canvas>
      <div id="ht-preview-svg" class="ht-preview-svg ht-hidden"></div>
    </div>

    <!-- Export bar -->
    <div class="ht-export-bar" id="ht-export-bar">
      <button id="ht-reset-btn" class="ht-btn ht-btn-secondary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="ht-btn-icon">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
        </svg>
        New Image
      </button>
      <div class="ht-export-group">
        <select id="ht-export-format" class="ht-select">
          <option value="svg">SVG</option>
          <option value="pdf">PDF</option>
          <option value="eps">EPS</option>
        </select>
        <button id="ht-download-btn" class="ht-btn ht-btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="ht-btn-icon">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download
        </button>
      </div>
    </div>
  </div>

  <!-- Right: Controls -->
  <div class="ht-controls-col">
    <h2 class="ht-title">Halftone Vector Converter</h2>
    <p class="ht-subtitle">Convert images to vector halftone patterns</p>

    <!-- Dot Settings -->
    <fieldset class="ht-fieldset">
      <legend>Dot Settings</legend>

      <div class="ht-field">
        <label for="ht-dot-size">Dot Spacing</label>
        <div class="ht-range-row">
          <input type="range" id="ht-dot-size" min="3" max="30" value="8" class="ht-range">
          <span id="ht-dot-size-val" class="ht-range-val">8px</span>
        </div>
        <p class="ht-hint">Distance between dot centers</p>
      </div>

      <div class="ht-field">
        <label for="ht-dot-scale">Max Dot Size</label>
        <div class="ht-range-row">
          <input type="range" id="ht-dot-scale" min="50" max="150" value="100" class="ht-range">
          <span id="ht-dot-scale-val" class="ht-range-val">100%</span>
        </div>
        <p class="ht-hint">Maximum dot radius as percentage of spacing</p>
      </div>

      <div class="ht-field">
        <label for="ht-min-dot">Minimum Dot Size</label>
        <div class="ht-range-row">
          <input type="range" id="ht-min-dot" min="0" max="50" value="5" class="ht-range">
          <span id="ht-min-dot-val" class="ht-range-val">5%</span>
        </div>
        <p class="ht-hint">Dots smaller than this are removed (cleaner highlights)</p>
      </div>
    </fieldset>

    <!-- Grid Angle -->
    <fieldset class="ht-fieldset">
      <legend>Grid Angle</legend>
      <div class="ht-field">
        <div class="ht-range-row">
          <input type="range" id="ht-angle" min="0" max="90" value="45" class="ht-range">
          <span id="ht-angle-val" class="ht-range-val">45°</span>
        </div>
        <p class="ht-hint">Rotation angle of the dot grid</p>
      </div>
      <div class="ht-angle-presets">
        <button class="ht-preset-btn" data-angle="0">0°</button>
        <button class="ht-preset-btn active" data-angle="45">45°</button>
        <button class="ht-preset-btn" data-angle="30">30°</button>
        <button class="ht-preset-btn" data-angle="15">15°</button>
      </div>
    </fieldset>

    <!-- Contrast & Brightness -->
    <fieldset class="ht-fieldset">
      <legend>Image Adjustments</legend>

      <div class="ht-field">
        <label for="ht-contrast">Contrast</label>
        <div class="ht-range-row">
          <input type="range" id="ht-contrast" min="-100" max="100" value="0" class="ht-range">
          <span id="ht-contrast-val" class="ht-range-val">0</span>
        </div>
      </div>

      <div class="ht-field">
        <label for="ht-brightness">Brightness</label>
        <div class="ht-range-row">
          <input type="range" id="ht-brightness" min="-100" max="100" value="0" class="ht-range">
          <span id="ht-brightness-val" class="ht-range-val">0</span>
        </div>
      </div>

      <div class="ht-field">
        <label>
          <input type="checkbox" id="ht-invert"> Invert (white dots on black)
        </label>
        <p class="ht-hint">Swap light and dark areas</p>
      </div>
    </fieldset>

    <!-- Shape Options -->
    <fieldset class="ht-fieldset">
      <legend>Dot Shape</legend>
      <div class="ht-shape-grid">
        <button class="ht-shape-btn active" data-shape="circle" title="Circle">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/></svg>
        </button>
        <button class="ht-shape-btn" data-shape="square" title="Square">
          <svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" fill="currentColor"/></svg>
        </button>
        <button class="ht-shape-btn" data-shape="diamond" title="Diamond">
          <svg viewBox="0 0 24 24"><polygon points="12,2 22,12 12,22 2,12" fill="currentColor"/></svg>
        </button>
        <button class="ht-shape-btn" data-shape="line" title="Lines">
          <svg viewBox="0 0 24 24"><rect x="10" y="2" width="4" height="20" fill="currentColor"/></svg>
        </button>
      </div>
    </fieldset>

    <!-- Output Size -->
    <fieldset class="ht-fieldset">
      <legend>Output Size</legend>
      <div class="ht-size-row">
        <div class="ht-field ht-field-inline">
          <label for="ht-out-width">Width</label>
          <input type="number" id="ht-out-width" class="ht-input" value="800" min="100" max="4000">
        </div>
        <span class="ht-size-x">×</span>
        <div class="ht-field ht-field-inline">
          <label for="ht-out-height">Height</label>
          <input type="number" id="ht-out-height" class="ht-input" value="800" min="100" max="4000">
        </div>
        <button id="ht-lock-ratio" class="ht-lock-btn active" title="Lock aspect ratio">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </button>
      </div>
      <p class="ht-hint">Final export dimensions in pixels</p>
    </fieldset>

    <!-- Info -->
    <div class="ht-info" id="ht-info">
      <p><strong>Dot Count:</strong> <span id="ht-dot-count">0</span></p>
      <p><strong>Source:</strong> <span id="ht-source-dims">-</span></p>
    </div>
  </div>
</div>
`;

// ---------------------------------------------------------------------------
// CSS
// ---------------------------------------------------------------------------
const css_code = `
/* Reset & Base */
*, *::before, *::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #0f172a;
  color: #e2e8f0;
  min-height: 100vh;
}

#halftone-app {
  display: flex;
  min-height: 100vh;
}

/* Preview Column */
.ht-preview-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #1e293b;
  padding: 24px;
  min-width: 0;
}

.ht-canvas-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: repeating-conic-gradient(#374151 0% 25%, #1f2937 0% 50%) 50% / 20px 20px;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  min-height: 400px;
}

/* Dropzone */
.ht-dropzone {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 3px dashed #475569;
  border-radius: 12px;
  transition: all 0.2s;
  background: rgba(15, 23, 42, 0.8);
}

.ht-dropzone:hover,
.ht-dropzone.dragover {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

.ht-dropzone-content {
  text-align: center;
  padding: 40px;
}

.ht-upload-icon {
  width: 64px;
  height: 64px;
  color: #64748b;
  margin-bottom: 16px;
}

.ht-dropzone:hover .ht-upload-icon {
  color: #3b82f6;
}

.ht-dropzone-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px;
  color: #e2e8f0;
}

.ht-dropzone-hint {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.ht-file-hidden {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

/* Source canvas (hidden, used for processing) */
#ht-source-canvas {
  display: none;
}

/* Preview SVG */
.ht-preview-svg {
  max-width: 100%;
  max-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ht-preview-svg svg {
  max-width: 100%;
  max-height: 100%;
  filter: drop-shadow(0 4px 20px rgba(0,0,0,0.3));
}

.ht-hidden {
  display: none !important;
}

/* Export Bar */
.ht-export-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #334155;
  opacity: 0.5;
  pointer-events: none;
  transition: opacity 0.2s;
}

.ht-export-bar.active {
  opacity: 1;
  pointer-events: auto;
}

.ht-export-group {
  display: flex;
  gap: 12px;
}

/* Controls Column */
.ht-controls-col {
  width: 360px;
  flex-shrink: 0;
  background: #0f172a;
  padding: 32px 24px;
  overflow-y: auto;
  max-height: 100vh;
  border-left: 1px solid #1e293b;
}

.ht-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 4px;
  color: #fff;
}

.ht-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 24px;
}

/* Fieldset */
.ht-fieldset {
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 16px;
  margin: 0 0 20px;
  background: #1e293b;
}

.ht-fieldset legend {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  padding: 0 8px;
}

/* Fields */
.ht-field {
  margin-bottom: 16px;
}

.ht-field:last-child {
  margin-bottom: 0;
}

.ht-field > label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #cbd5e1;
  margin-bottom: 6px;
}

.ht-field-inline {
  display: inline-block;
}

.ht-field-inline > label {
  font-size: 11px;
  color: #64748b;
  margin-bottom: 4px;
}

/* Range Input */
.ht-range-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ht-range {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  background: #334155;
  border-radius: 3px;
  outline: none;
}

.ht-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.1s;
}

.ht-range::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.ht-range::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: #3b82f6;
  border: none;
  border-radius: 50%;
  cursor: pointer;
}

.ht-range-val {
  min-width: 48px;
  text-align: right;
  font-size: 13px;
  font-weight: 500;
  color: #3b82f6;
  font-variant-numeric: tabular-nums;
}

/* Hint Text */
.ht-hint {
  font-size: 11px;
  color: #64748b;
  margin: 6px 0 0;
  line-height: 1.4;
}

/* Buttons */
.ht-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.ht-btn-icon {
  width: 18px;
  height: 18px;
}

.ht-btn-primary {
  background: #3b82f6;
  color: #fff;
}

.ht-btn-primary:hover {
  background: #2563eb;
}

.ht-btn-secondary {
  background: #334155;
  color: #e2e8f0;
}

.ht-btn-secondary:hover {
  background: #475569;
}

/* Select */
.ht-select {
  padding: 10px 36px 10px 14px;
  font-size: 14px;
  font-weight: 500;
  background: #334155 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M2 4l4 4 4-4'/%3E%3C/svg%3E") no-repeat right 12px center;
  color: #e2e8f0;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}

.ht-select:hover {
  background-color: #475569;
}

/* Input */
.ht-input {
  width: 80px;
  padding: 8px 10px;
  font-size: 14px;
  background: #0f172a;
  color: #e2e8f0;
  border: 1px solid #334155;
  border-radius: 6px;
  text-align: center;
}

.ht-input:focus {
  outline: none;
  border-color: #3b82f6;
}

/* Checkbox */
.ht-field input[type="checkbox"] {
  width: 18px;
  height: 18px;
  margin-right: 8px;
  vertical-align: middle;
  accent-color: #3b82f6;
}

/* Angle Presets */
.ht-angle-presets {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.ht-preset-btn {
  flex: 1;
  padding: 8px;
  font-size: 12px;
  font-weight: 600;
  background: #0f172a;
  color: #94a3b8;
  border: 1px solid #334155;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.ht-preset-btn:hover {
  border-color: #3b82f6;
  color: #e2e8f0;
}

.ht-preset-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
}

/* Shape Grid */
.ht-shape-grid {
  display: flex;
  gap: 8px;
}

.ht-shape-btn {
  width: 48px;
  height: 48px;
  padding: 10px;
  background: #0f172a;
  color: #64748b;
  border: 2px solid #334155;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.ht-shape-btn svg {
  width: 100%;
  height: 100%;
}

.ht-shape-btn:hover {
  border-color: #3b82f6;
  color: #94a3b8;
}

.ht-shape-btn.active {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

/* Size Row */
.ht-size-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.ht-size-x {
  font-size: 16px;
  color: #64748b;
  padding-bottom: 8px;
}

.ht-lock-btn {
  width: 40px;
  height: 40px;
  padding: 8px;
  background: #0f172a;
  color: #64748b;
  border: 1px solid #334155;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.ht-lock-btn svg {
  width: 100%;
  height: 100%;
}

.ht-lock-btn:hover {
  border-color: #3b82f6;
}

.ht-lock-btn.active {
  background: rgba(59, 130, 246, 0.1);
  border-color: #3b82f6;
  color: #3b82f6;
}

/* Info */
.ht-info {
  background: #1e293b;
  border-radius: 8px;
  padding: 16px;
  font-size: 13px;
}

.ht-info p {
  margin: 0 0 8px;
  color: #94a3b8;
}

.ht-info p:last-child {
  margin-bottom: 0;
}

.ht-info strong {
  color: #cbd5e1;
}

.ht-info span {
  color: #e2e8f0;
}

/* Responsive */
@media (max-width: 900px) {
  #halftone-app {
    flex-direction: column;
  }

  .ht-controls-col {
    width: 100%;
    max-height: none;
    border-left: none;
    border-top: 1px solid #1e293b;
  }

  .ht-canvas-wrap {
    min-height: 300px;
  }
}

/* Loading overlay */
.ht-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.9);
  z-index: 10;
}

.ht-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #334155;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: ht-spin 0.8s linear infinite;
}

@keyframes ht-spin {
  to { transform: rotate(360deg); }
}
`;

// ---------------------------------------------------------------------------
// JavaScript
// ---------------------------------------------------------------------------
const js_code = `
(function() {
  'use strict';

  // State
  let sourceImage = null;
  let sourceCanvas = null;
  let sourceCtx = null;
  let currentSvg = null;
  let aspectRatio = 1;
  let lockRatio = true;
  let debounceTimer = null;

  // DOM Elements
  const app = document.getElementById('halftone-app');
  const dropzone = document.getElementById('ht-dropzone');
  const fileInput = document.getElementById('ht-file-input');
  const canvasWrap = document.getElementById('ht-canvas-wrap');
  const previewSvg = document.getElementById('ht-preview-svg');
  const exportBar = document.getElementById('ht-export-bar');

  // Controls
  const dotSizeInput = document.getElementById('ht-dot-size');
  const dotSizeVal = document.getElementById('ht-dot-size-val');
  const dotScaleInput = document.getElementById('ht-dot-scale');
  const dotScaleVal = document.getElementById('ht-dot-scale-val');
  const minDotInput = document.getElementById('ht-min-dot');
  const minDotVal = document.getElementById('ht-min-dot-val');
  const angleInput = document.getElementById('ht-angle');
  const angleVal = document.getElementById('ht-angle-val');
  const contrastInput = document.getElementById('ht-contrast');
  const contrastVal = document.getElementById('ht-contrast-val');
  const brightnessInput = document.getElementById('ht-brightness');
  const brightnessVal = document.getElementById('ht-brightness-val');
  const invertCheckbox = document.getElementById('ht-invert');
  const outWidthInput = document.getElementById('ht-out-width');
  const outHeightInput = document.getElementById('ht-out-height');
  const lockRatioBtn = document.getElementById('ht-lock-ratio');
  const exportFormatSelect = document.getElementById('ht-export-format');
  const downloadBtn = document.getElementById('ht-download-btn');
  const resetBtn = document.getElementById('ht-reset-btn');
  const dotCountEl = document.getElementById('ht-dot-count');
  const sourceDimsEl = document.getElementById('ht-source-dims');

  // Shape and angle buttons
  const shapeButtons = document.querySelectorAll('.ht-shape-btn');
  const anglePresets = document.querySelectorAll('.ht-preset-btn');

  let currentShape = 'circle';

  // Initialize hidden canvas
  sourceCanvas = document.getElementById('ht-source-canvas');
  sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });

  // -------------------------------------------------------------------------
  // File Handling
  // -------------------------------------------------------------------------
  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        sourceImage = img;
        aspectRatio = img.width / img.height;

        // Set output dimensions based on image
        const maxDim = 1200;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            w = maxDim;
            h = Math.round(maxDim / aspectRatio);
          } else {
            h = maxDim;
            w = Math.round(maxDim * aspectRatio);
          }
        }
        outWidthInput.value = w;
        outHeightInput.value = h;

        sourceDimsEl.textContent = img.width + ' × ' + img.height + ' px';

        // Draw to canvas
        sourceCanvas.width = img.width;
        sourceCanvas.height = img.height;
        sourceCtx.drawImage(img, 0, 0);

        // Show preview, hide dropzone
        dropzone.classList.add('ht-hidden');
        previewSvg.classList.remove('ht-hidden');
        exportBar.classList.add('active');

        // Generate halftone
        generateHalftone();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Dropzone events
  dropzone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  // -------------------------------------------------------------------------
  // Halftone Generation
  // -------------------------------------------------------------------------
  function getSettings() {
    return {
      dotSpacing: parseInt(dotSizeInput.value),
      dotScale: parseInt(dotScaleInput.value) / 100,
      minDot: parseInt(minDotInput.value) / 100,
      angle: parseInt(angleInput.value),
      contrast: parseInt(contrastInput.value),
      brightness: parseInt(brightnessInput.value),
      invert: invertCheckbox.checked,
      shape: currentShape,
      outWidth: parseInt(outWidthInput.value),
      outHeight: parseInt(outHeightInput.value)
    };
  }

  function generateHalftone() {
    if (!sourceImage) return;

    const settings = getSettings();
    const { dotSpacing, dotScale, minDot, angle, contrast, brightness, invert, shape, outWidth, outHeight } = settings;

    // Create temporary canvas at output size
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = outWidth;
    tempCanvas.height = outHeight;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

    // Draw scaled image
    tempCtx.drawImage(sourceImage, 0, 0, outWidth, outHeight);

    // Get image data
    const imageData = tempCtx.getImageData(0, 0, outWidth, outHeight);
    const data = imageData.data;

    // Apply contrast and brightness
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Brightness
      r += brightness * 2.55;
      g += brightness * 2.55;
      b += brightness * 2.55;

      // Contrast
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      r = factor * (r - 128) + 128;
      g = factor * (g - 128) + 128;
      b = factor * (b - 128) + 128;

      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }

    // Calculate dots
    const dots = [];
    const angleRad = (angle * Math.PI) / 180;
    const cosA = Math.cos(angleRad);
    const sinA = Math.sin(angleRad);

    // Calculate grid bounds with rotation
    const diagonal = Math.sqrt(outWidth * outWidth + outHeight * outHeight);
    const gridStartX = -diagonal;
    const gridStartY = -diagonal;
    const gridEndX = diagonal * 2;
    const gridEndY = diagonal * 2;

    const maxRadius = (dotSpacing / 2) * dotScale;
    const minRadius = maxRadius * minDot;

    for (let gy = gridStartY; gy < gridEndY; gy += dotSpacing) {
      for (let gx = gridStartX; gx < gridEndX; gx += dotSpacing) {
        // Rotate grid point
        const cx = outWidth / 2;
        const cy = outHeight / 2;
        const px = (gx - cx) * cosA - (gy - cy) * sinA + cx;
        const py = (gx - cx) * sinA + (gy - cy) * cosA + cy;

        // Check bounds
        if (px < -maxRadius || px > outWidth + maxRadius || py < -maxRadius || py > outHeight + maxRadius) {
          continue;
        }

        // Sample brightness at this point (or skip if outside image)
        const sampleX = Math.floor(px);
        const sampleY = Math.floor(py);

        if (sampleX < 0 || sampleX >= outWidth || sampleY < 0 || sampleY >= outHeight) {
          continue;
        }

        const idx = (sampleY * outWidth + sampleX) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const alpha = data[idx + 3];

        // Skip fully transparent pixels
        if (alpha < 10) continue;

        // Calculate luminance (perceived brightness)
        let luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        if (invert) {
          luminance = 1 - luminance;
        }

        // Darker = larger dot (1 - luminance)
        const dotSize = (1 - luminance) * maxRadius;

        // Skip dots below minimum size
        if (dotSize < minRadius) continue;

        dots.push({ x: px, y: py, r: dotSize });
      }
    }

    // Generate SVG
    currentSvg = generateSVG(dots, outWidth, outHeight, shape);

    // Update preview
    previewSvg.innerHTML = currentSvg;

    // Update dot count
    dotCountEl.textContent = dots.length.toLocaleString();
  }

  function generateSVG(dots, width, height, shape) {
    let shapesStr = '';

    dots.forEach(dot => {
      switch (shape) {
        case 'circle':
          shapesStr += '<circle cx="' + dot.x.toFixed(2) + '" cy="' + dot.y.toFixed(2) + '" r="' + dot.r.toFixed(2) + '"/>';
          break;
        case 'square':
          const size = dot.r * 2;
          shapesStr += '<rect x="' + (dot.x - dot.r).toFixed(2) + '" y="' + (dot.y - dot.r).toFixed(2) + '" width="' + size.toFixed(2) + '" height="' + size.toFixed(2) + '"/>';
          break;
        case 'diamond':
          const d = dot.r;
          shapesStr += '<polygon points="' + dot.x.toFixed(2) + ',' + (dot.y - d).toFixed(2) + ' ' + (dot.x + d).toFixed(2) + ',' + dot.y.toFixed(2) + ' ' + dot.x.toFixed(2) + ',' + (dot.y + d).toFixed(2) + ' ' + (dot.x - d).toFixed(2) + ',' + dot.y.toFixed(2) + '"/>';
          break;
        case 'line':
          const halfW = dot.r * 0.3;
          const halfH = dot.r;
          shapesStr += '<rect x="' + (dot.x - halfW).toFixed(2) + '" y="' + (dot.y - halfH).toFixed(2) + '" width="' + (halfW * 2).toFixed(2) + '" height="' + (halfH * 2).toFixed(2) + '"/>';
          break;
      }
    });

    return '<?xml version="1.0" encoding="UTF-8"?>\\n' +
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + width + ' ' + height + '" width="' + width + '" height="' + height + '">\\n' +
      '  <g fill="#000000">\\n    ' + shapesStr + '\\n  </g>\\n</svg>';
  }

  // -------------------------------------------------------------------------
  // Export Functions
  // -------------------------------------------------------------------------
  function downloadSVG() {
    if (!currentSvg) return;

    const blob = new Blob([currentSvg], { type: 'image/svg+xml' });
    downloadBlob(blob, 'halftone.svg');
  }

  function downloadPDF() {
    if (!currentSvg) return;

    // Load jsPDF dynamically
    if (typeof jspdf === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => generatePDF();
      document.head.appendChild(script);
    } else {
      generatePDF();
    }
  }

  function generatePDF() {
    const settings = getSettings();
    const { outWidth, outHeight } = settings;

    // Convert pixels to points (72 dpi)
    const pxToMm = 0.264583;
    const widthMm = outWidth * pxToMm;
    const heightMm = outHeight * pxToMm;

    const orientation = widthMm > heightMm ? 'landscape' : 'portrait';
    const { jsPDF } = jspdf;
    const doc = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: [widthMm, heightMm]
    });

    // Parse SVG and draw shapes
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(currentSvg, 'image/svg+xml');
    const shapes = svgDoc.querySelectorAll('circle, rect, polygon');

    doc.setFillColor(0, 0, 0);

    shapes.forEach(shape => {
      if (shape.tagName === 'circle') {
        const cx = parseFloat(shape.getAttribute('cx')) * pxToMm;
        const cy = parseFloat(shape.getAttribute('cy')) * pxToMm;
        const r = parseFloat(shape.getAttribute('r')) * pxToMm;
        doc.circle(cx, cy, r, 'F');
      } else if (shape.tagName === 'rect') {
        const x = parseFloat(shape.getAttribute('x')) * pxToMm;
        const y = parseFloat(shape.getAttribute('y')) * pxToMm;
        const w = parseFloat(shape.getAttribute('width')) * pxToMm;
        const h = parseFloat(shape.getAttribute('height')) * pxToMm;
        doc.rect(x, y, w, h, 'F');
      } else if (shape.tagName === 'polygon') {
        const points = shape.getAttribute('points').split(' ').map(p => {
          const [x, y] = p.split(',').map(v => parseFloat(v) * pxToMm);
          return [x, y];
        });
        if (points.length > 0) {
          doc.setFillColor(0, 0, 0);
          // Move to first point and draw polygon
          const path = points.map((p, i) => (i === 0 ? 'M' : 'L') + p[0] + ',' + p[1]).join(' ') + ' Z';
          // Use triangle for diamond (4 points)
          if (points.length === 4) {
            doc.triangle(points[0][0], points[0][1], points[1][0], points[1][1], points[2][0], points[2][1], 'F');
            doc.triangle(points[0][0], points[0][1], points[2][0], points[2][1], points[3][0], points[3][1], 'F');
          }
        }
      }
    });

    doc.save('halftone.pdf');
  }

  function downloadEPS() {
    if (!currentSvg) return;

    const settings = getSettings();
    const { outWidth, outHeight } = settings;

    // Parse SVG
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(currentSvg, 'image/svg+xml');
    const shapes = svgDoc.querySelectorAll('circle, rect, polygon');

    // Build EPS content
    let eps = '%!PS-Adobe-3.0 EPSF-3.0\\n';
    eps += '%%BoundingBox: 0 0 ' + outWidth + ' ' + outHeight + '\\n';
    eps += '%%HiResBoundingBox: 0 0 ' + outWidth + '.0 ' + outHeight + '.0\\n';
    eps += '%%Title: Halftone Vector\\n';
    eps += '%%Creator: Halftone Vector Converter\\n';
    eps += '%%Pages: 1\\n';
    eps += '%%EndComments\\n\\n';
    eps += '%%BeginProlog\\n';
    eps += '/circle { 3 copy pop 0 360 arc closepath fill } def\\n';
    eps += '%%EndProlog\\n\\n';
    eps += '%%Page: 1 1\\n';
    eps += '0 setgray\\n\\n';

    shapes.forEach(shape => {
      if (shape.tagName === 'circle') {
        const cx = parseFloat(shape.getAttribute('cx'));
        const cy = outHeight - parseFloat(shape.getAttribute('cy')); // Flip Y
        const r = parseFloat(shape.getAttribute('r'));
        eps += cx.toFixed(3) + ' ' + cy.toFixed(3) + ' ' + r.toFixed(3) + ' circle\\n';
      } else if (shape.tagName === 'rect') {
        const x = parseFloat(shape.getAttribute('x'));
        const y = outHeight - parseFloat(shape.getAttribute('y')); // Flip Y
        const w = parseFloat(shape.getAttribute('width'));
        const h = parseFloat(shape.getAttribute('height'));
        eps += 'newpath\\n';
        eps += x.toFixed(3) + ' ' + (y - h).toFixed(3) + ' moveto\\n';
        eps += w.toFixed(3) + ' 0 rlineto\\n';
        eps += '0 ' + h.toFixed(3) + ' rlineto\\n';
        eps += '-' + w.toFixed(3) + ' 0 rlineto\\n';
        eps += 'closepath fill\\n';
      } else if (shape.tagName === 'polygon') {
        const points = shape.getAttribute('points').split(' ').map(p => {
          const [x, y] = p.split(',').map(parseFloat);
          return [x, outHeight - y]; // Flip Y
        });
        if (points.length > 0) {
          eps += 'newpath\\n';
          points.forEach((p, i) => {
            if (i === 0) {
              eps += p[0].toFixed(3) + ' ' + p[1].toFixed(3) + ' moveto\\n';
            } else {
              eps += p[0].toFixed(3) + ' ' + p[1].toFixed(3) + ' lineto\\n';
            }
          });
          eps += 'closepath fill\\n';
        }
      }
    });

    eps += '\\nshowpage\\n';
    eps += '%%EOF\\n';

    const blob = new Blob([eps], { type: 'application/postscript' });
    downloadBlob(blob, 'halftone.eps');
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // -------------------------------------------------------------------------
  // Event Listeners
  // -------------------------------------------------------------------------
  function debounceGenerate() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(generateHalftone, 100);
  }

  // Slider updates
  dotSizeInput.addEventListener('input', () => {
    dotSizeVal.textContent = dotSizeInput.value + 'px';
    debounceGenerate();
  });

  dotScaleInput.addEventListener('input', () => {
    dotScaleVal.textContent = dotScaleInput.value + '%';
    debounceGenerate();
  });

  minDotInput.addEventListener('input', () => {
    minDotVal.textContent = minDotInput.value + '%';
    debounceGenerate();
  });

  angleInput.addEventListener('input', () => {
    angleVal.textContent = angleInput.value + '°';
    // Update active preset button
    anglePresets.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.angle === angleInput.value);
    });
    debounceGenerate();
  });

  contrastInput.addEventListener('input', () => {
    contrastVal.textContent = contrastInput.value;
    debounceGenerate();
  });

  brightnessInput.addEventListener('input', () => {
    brightnessVal.textContent = brightnessInput.value;
    debounceGenerate();
  });

  invertCheckbox.addEventListener('change', debounceGenerate);

  // Angle presets
  anglePresets.forEach(btn => {
    btn.addEventListener('click', () => {
      anglePresets.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      angleInput.value = btn.dataset.angle;
      angleVal.textContent = btn.dataset.angle + '°';
      debounceGenerate();
    });
  });

  // Shape buttons
  shapeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      shapeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentShape = btn.dataset.shape;
      debounceGenerate();
    });
  });

  // Output size
  outWidthInput.addEventListener('change', () => {
    if (lockRatio && sourceImage) {
      outHeightInput.value = Math.round(parseInt(outWidthInput.value) / aspectRatio);
    }
    debounceGenerate();
  });

  outHeightInput.addEventListener('change', () => {
    if (lockRatio && sourceImage) {
      outWidthInput.value = Math.round(parseInt(outHeightInput.value) * aspectRatio);
    }
    debounceGenerate();
  });

  lockRatioBtn.addEventListener('click', () => {
    lockRatio = !lockRatio;
    lockRatioBtn.classList.toggle('active', lockRatio);
  });

  // Download
  downloadBtn.addEventListener('click', () => {
    const format = exportFormatSelect.value;
    switch (format) {
      case 'svg':
        downloadSVG();
        break;
      case 'pdf':
        downloadPDF();
        break;
      case 'eps':
        downloadEPS();
        break;
    }
  });

  // Reset
  resetBtn.addEventListener('click', () => {
    sourceImage = null;
    currentSvg = null;
    previewSvg.innerHTML = '';
    previewSvg.classList.add('ht-hidden');
    dropzone.classList.remove('ht-hidden');
    exportBar.classList.remove('active');
    dotCountEl.textContent = '0';
    sourceDimsEl.textContent = '-';
    fileInput.value = '';
  });

  // Prevent default drag behavior on window
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => e.preventDefault());

})();
`;

// ---------------------------------------------------------------------------
// Seed Runner
// ---------------------------------------------------------------------------
async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const slug = 'halftone-vector-converter';

    const existing = await BrandTool.findOne({ slug });
    if (existing) {
      console.log('Tool "halftone-vector-converter" already exists. Updating...');
      existing.html_code = html_code;
      existing.css_code = css_code;
      existing.js_code = js_code;
      existing.title = 'Halftone Vector Converter';
      existing.description = 'Convert images into vector halftone patterns with customizable dot settings. Export as SVG, PDF, or EPS with black dots on a transparent background - perfect for screen printing, laser cutting, and graphic design.';
      await existing.save();
      console.log('Tool updated successfully!');
    } else {
      const maxOrder = await BrandTool.findOne().sort({ order_index: -1 }).select('order_index');
      const tool = await BrandTool.create({
        title: 'Halftone Vector Converter',
        description: 'Convert images into vector halftone patterns with customizable dot settings. Export as SVG, PDF, or EPS with black dots on a transparent background - perfect for screen printing, laser cutting, and graphic design.',
        slug,
        html_code,
        css_code,
        js_code,
        is_active: true,
        order_index: (maxOrder?.order_index || 0) + 1
      });
      console.log('Tool created successfully! ID:', tool._id);
    }

    await mongoose.disconnect();
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

seed();
