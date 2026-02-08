require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const BrandTool = require('../models/BrandTool');

const htmlCode = `
<div id="app">
  <!-- Live Preview -->
  <div class="preview-panel">
    <div class="preview-label">PREVIEW</div>
    <div class="preview-wrapper" id="previewWrapper">
      <div class="canvas-container" id="canvasContainer">
        <!-- Video background element (hidden by default) -->
        <video id="bgVideo" muted loop playsinline style="display:none;position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;"></video>
        <!-- Layout 1: Horizontal Split -->
        <div class="layout layout-hsplit active" id="layout-hsplit">
          <div class="layout-top" id="hsplit-top">
            <div class="headline-text" id="hsplit-headline">Your Headline Here</div>
          </div>
          <div class="layout-bottom" id="hsplit-bottom"></div>
        </div>
        <!-- Layout 2: Full Bleed -->
        <div class="layout layout-fullbleed" id="layout-fullbleed">
          <div class="fullbleed-bg" id="fullbleed-bg"></div>
          <div class="fullbleed-overlay">
            <div class="headline-text" id="fullbleed-headline">Your Headline Here</div>
          </div>
        </div>
        <!-- Layout 3: Text Centered -->
        <div class="layout layout-centered" id="layout-centered">
          <div class="centered-content">
            <div class="headline-text" id="centered-headline">Your Headline Here</div>
            <div class="cta-btn" id="centered-cta">Learn More</div>
          </div>
        </div>
        <!-- Layout 4: Left/Right Split -->
        <div class="layout layout-lrsplit" id="layout-lrsplit">
          <div class="lr-image" id="lrsplit-image"></div>
          <div class="lr-text">
            <div class="headline-text" id="lrsplit-headline">Your Headline Here</div>
            <div class="cta-btn" id="lrsplit-cta">Learn More</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Controls Panel -->
  <div class="controls-panel">
    <h2 class="controls-title">Content Creator</h2>

    <!-- Post Copy -->
    <div class="control-section post-copy-section">
      <div class="section-header" id="postCopyHeader">
        <label class="control-label" style="margin-bottom:0">Post Copy</label>
        <button class="collapse-btn" id="postCopyCollapse" type="button">
          <svg class="collapse-icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
        </button>
      </div>
      <div id="postCopyContent">
        <div class="form-group">
          <label class="mini-label">Platform</label>
          <select id="platformSelect" class="control-select">
            <option value="">None (manual dimensions)</option>
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
            <option value="twitter">Twitter / X</option>
            <option value="facebook">Facebook</option>
          </select>
        </div>
        <div class="form-group">
          <label class="mini-label">Post Caption</label>
          <textarea id="postCaption" class="control-textarea" rows="5" placeholder="Write your post caption here..."></textarea>
          <div class="char-count"><span id="captionCharCount">0</span> / <span id="captionCharLimit">2200</span></div>
        </div>
        <div class="form-group">
          <label class="mini-label">Hashtags</label>
          <input type="text" id="postHashtags" class="control-input" placeholder="#brand #marketing #content">
        </div>
        <div class="copy-buttons">
          <button type="button" class="copy-btn" id="copyCaptionBtn">
            <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path d="M8 2a1 1 0 00 0 2h2a1 1 0 100-2H8z"/><path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5z"/></svg>
            Copy Caption
          </button>
          <button type="button" class="copy-btn secondary" id="copyHashtagsBtn">
            <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path d="M8 2a1 1 0 00 0 2h2a1 1 0 100-2H8z"/><path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5z"/></svg>
            Copy Hashtags
          </button>
        </div>
      </div>
    </div>

    <!-- Dimensions -->
    <div class="control-section">
      <label class="control-label">Dimensions</label>
      <select id="dimensionPreset" class="control-select">
        <option value="1080x1080">Instagram Post (1080x1080)</option>
        <option value="1080x1920">Instagram Story (1080x1920)</option>
        <option value="1200x630">Facebook Post (1200x630)</option>
        <option value="820x312">Facebook Cover (820x312)</option>
        <option value="1200x675">Twitter/X Post (1200x675)</option>
        <option value="1200x627">LinkedIn Post (1200x627)</option>
        <option value="1000x1500">Pinterest Pin (1000x1500)</option>
        <option value="1280x720">YouTube Thumbnail (1280x720)</option>
        <option value="custom">Custom Dimensions</option>
      </select>
      <div id="customDims" class="custom-dims hidden">
        <input type="number" id="customW" class="control-input dim-input" placeholder="Width" value="1080" min="100" max="4096">
        <span class="dim-x">x</span>
        <input type="number" id="customH" class="control-input dim-input" placeholder="Height" value="1080" min="100" max="4096">
        <span class="dim-unit">px</span>
      </div>
    </div>

    <!-- Layout -->
    <div class="control-section">
      <label class="control-label">Layout</label>
      <div class="layout-options">
        <button class="layout-btn active" data-layout="hsplit" title="Horizontal Split">
          <svg viewBox="0 0 40 40"><rect x="2" y="2" width="36" height="17" rx="2" fill="#802A02" opacity="0.3"/><rect x="2" y="21" width="36" height="17" rx="2" fill="#802A02"/></svg>
        </button>
        <button class="layout-btn" data-layout="fullbleed" title="Full Bleed Photo">
          <svg viewBox="0 0 40 40"><rect x="2" y="2" width="36" height="36" rx="2" fill="#802A02"/><rect x="4" y="26" width="32" height="10" rx="1" fill="#802A02" opacity="0.3"/></svg>
        </button>
        <button class="layout-btn" data-layout="centered" title="Text Centered">
          <svg viewBox="0 0 40 40"><rect x="2" y="2" width="36" height="36" rx="2" fill="#802A02" opacity="0.2"/><rect x="8" y="14" width="24" height="4" rx="1" fill="#802A02"/><rect x="12" y="22" width="16" height="4" rx="1" fill="#802A02" opacity="0.5"/></svg>
        </button>
        <button class="layout-btn" data-layout="lrsplit" title="Left/Right Split">
          <svg viewBox="0 0 40 40"><rect x="2" y="2" width="17" height="36" rx="2" fill="#802A02"/><rect x="21" y="2" width="17" height="36" rx="2" fill="#802A02" opacity="0.2"/><rect x="23" y="14" width="13" height="3" rx="1" fill="#802A02"/><rect x="25" y="21" width="9" height="3" rx="1" fill="#802A02" opacity="0.5"/></svg>
        </button>
      </div>
    </div>

    <!-- Background -->
    <div class="control-section">
      <label class="control-label">Background</label>
      <div class="bg-type-tabs">
        <button class="bg-tab active" data-bgtype="color">Color</button>
        <button class="bg-tab" data-bgtype="image">Image</button>
        <button class="bg-tab" data-bgtype="video">Video</button>
      </div>
      <div id="bgColorControls" class="bg-controls">
        <div class="color-presets">
          <button class="color-preset active" data-color="#802A02" style="background:#802A02" title="Red Clay"></button>
          <button class="color-preset" data-color="#2B3901" style="background:#2B3901" title="Forest Green"></button>
          <button class="color-preset" data-color="#F0EEE0" style="background:#F0EEE0;border:1px solid #ccc" title="Off-white"></button>
          <button class="color-preset" data-color="#EEC8B3" style="background:#EEC8B3" title="Desert Mauve"></button>
          <button class="color-preset" data-color="#131313" style="background:#131313" title="Black"></button>
        </div>
        <input type="color" id="bgColor" class="control-color" value="#802A02">
      </div>
      <div id="bgImageControls" class="bg-controls hidden">
        <input type="file" id="bgImageInput" accept="image/*,image/gif" class="control-file">
        <select id="bgFit" class="control-select mt-sm">
          <option value="cover">Cover (fill)</option>
          <option value="contain">Contain (fit)</option>
        </select>
      </div>
      <div id="bgVideoControls" class="bg-controls hidden">
        <input type="file" id="bgVideoInput" accept="video/mp4,video/webm,video/quicktime" class="control-file">
        <p class="hint-text">MP4, WebM, or MOV. Plays muted and looped.</p>
      </div>
    </div>

    <!-- Headline -->
    <div class="control-section">
      <label class="control-label">Headline</label>
      <input type="text" id="headlineText" class="control-input" value="Your Headline Here" placeholder="Enter headline...">
      <div class="inline-controls">
        <div class="inline-control">
          <span class="mini-label">Size</span>
          <input type="range" id="fontSize" min="12" max="120" value="48">
          <span id="fontSizeVal" class="range-val">48px</span>
        </div>
      </div>
      <div class="inline-controls">
        <div class="inline-control">
          <span class="mini-label">Color</span>
          <div class="color-presets small">
            <button class="color-preset text-preset" data-textcolor="#FFFFFF" style="background:#FFFFFF;border:1px solid #ccc" title="White"></button>
            <button class="color-preset text-preset active" data-textcolor="#F0EEE0" style="background:#F0EEE0;border:1px solid #ccc" title="Off-white"></button>
            <button class="color-preset text-preset" data-textcolor="#131313" style="background:#131313" title="Black"></button>
            <button class="color-preset text-preset" data-textcolor="#802A02" style="background:#802A02" title="Red Clay"></button>
            <button class="color-preset text-preset" data-textcolor="#2B3901" style="background:#2B3901" title="Forest Green"></button>
          </div>
          <input type="color" id="textColor" class="control-color small" value="#F0EEE0">
        </div>
      </div>
      <div class="align-btns">
        <button class="align-btn" data-align="left" title="Left">
          <svg viewBox="0 0 20 20" width="16" height="16"><line x1="2" y1="4" x2="16" y2="4" stroke="currentColor" stroke-width="2"/><line x1="2" y1="10" x2="12" y2="10" stroke="currentColor" stroke-width="2"/><line x1="2" y1="16" x2="14" y2="16" stroke="currentColor" stroke-width="2"/></svg>
        </button>
        <button class="align-btn active" data-align="center" title="Center">
          <svg viewBox="0 0 20 20" width="16" height="16"><line x1="2" y1="4" x2="18" y2="4" stroke="currentColor" stroke-width="2"/><line x1="4" y1="10" x2="16" y2="10" stroke="currentColor" stroke-width="2"/><line x1="3" y1="16" x2="17" y2="16" stroke="currentColor" stroke-width="2"/></svg>
        </button>
        <button class="align-btn" data-align="right" title="Right">
          <svg viewBox="0 0 20 20" width="16" height="16"><line x1="4" y1="4" x2="18" y2="4" stroke="currentColor" stroke-width="2"/><line x1="8" y1="10" x2="18" y2="10" stroke="currentColor" stroke-width="2"/><line x1="6" y1="16" x2="18" y2="16" stroke="currentColor" stroke-width="2"/></svg>
        </button>
      </div>
    </div>

    <!-- Animation -->
    <div class="control-section">
      <div class="control-label-row">
        <label class="control-label">Animation</label>
        <label class="toggle">
          <input type="checkbox" id="animToggle">
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div id="animControls" style="opacity:0.4;pointer-events:none;">
        <select id="animType" class="control-select">
          <option value="typewriter">Typewriter</option>
          <option value="fadeIn">Fade In</option>
          <option value="slideUp">Slide Up</option>
          <option value="scaleIn">Scale In</option>
        </select>
        <div class="inline-controls">
          <div class="inline-control" style="flex:1;">
            <span class="mini-label">Speed</span>
            <input type="range" id="animSpeed" min="0.5" max="3" step="0.25" value="1">
            <span id="animSpeedVal" class="range-val">1x</span>
          </div>
        </div>
        <div class="inline-controls" style="margin-top:0.4rem;">
          <div class="inline-control">
            <span class="mini-label">Duration (seconds)</span>
            <input type="range" id="animDuration" min="1" max="6" step="0.5" value="2">
            <span id="animDurationVal" class="range-val">2s</span>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA Button -->
    <div class="control-section">
      <div class="control-label-row">
        <label class="control-label">CTA Button</label>
        <label class="toggle">
          <input type="checkbox" id="ctaToggle" checked>
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div id="ctaControls">
        <input type="text" id="ctaText" class="control-input" value="Learn More" placeholder="Button text...">
        <div class="inline-controls">
          <div class="inline-control">
            <span class="mini-label">Button</span>
            <input type="color" id="ctaBgColor" class="control-color small" value="#F0EEE0">
          </div>
          <div class="inline-control">
            <span class="mini-label">Text</span>
            <input type="color" id="ctaTextColor" class="control-color small" value="#802A02">
          </div>
        </div>
      </div>
    </div>

    <!-- Export -->
    <div class="control-section export-section">
      <label class="control-label">Export Static</label>
      <div class="export-btns">
        <button class="export-btn" id="exportPng">Download PNG</button>
        <button class="export-btn" id="exportJpg">Download JPG</button>
        <button class="export-btn secondary" id="exportHtml">Download HTML5</button>
      </div>
      <div id="animExportSection" class="hidden" style="margin-top:0.75rem;">
        <label class="control-label">Export Animated</label>
        <div class="export-btns">
          <button class="export-btn anim-export" id="exportWebm">Download WebM Video</button>
          <button class="export-btn anim-export" id="exportGif">Download GIF</button>
        </div>
        <div id="exportProgress" class="export-progress hidden">
          <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
          <span class="progress-text" id="progressText">Rendering...</span>
        </div>
      </div>
    </div>
  </div>
</div>
`;

const cssCode = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f0; color: #131313; }

#app {
  display: grid;
  grid-template-columns: 1fr 340px;
  height: 100vh;
  overflow: hidden;
}

/* Preview Panel */
.preview-panel {
  background: #e8e6d8;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  overflow: auto;
}
.preview-label {
  position: absolute;
  top: 1rem;
  left: 1rem;
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #802A02;
  font-weight: 600;
}
.preview-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
.canvas-container {
  background: #802A02;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0,0,0,0.15);
  transition: width 0.3s, height 0.3s;
}

/* Layouts */
.layout { display: none; width: 100%; height: 100%; position: absolute; top: 0; left: 0; }
.layout.active { display: flex; }

/* Horizontal Split */
.layout-hsplit { flex-direction: column; }
.layout-hsplit .layout-top {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8%;
  background: inherit;
}
.layout-hsplit .layout-bottom {
  flex: 1;
  background-size: cover;
  background-position: center;
  background-color: rgba(0,0,0,0.1);
}

/* Full Bleed */
.layout-fullbleed { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
.fullbleed-bg {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background-size: cover; background-position: center;
}
.fullbleed-overlay {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 8%;
  background: linear-gradient(transparent, rgba(0,0,0,0.6));
  display: flex; align-items: flex-end;
}

/* Centered */
.layout-centered {
  align-items: center; justify-content: center;
  flex-direction: column; padding: 8%; gap: 1.5rem;
}
.centered-content {
  text-align: center; display: flex;
  flex-direction: column; align-items: center; gap: 1.5rem;
}

/* Left/Right Split */
.layout-lrsplit { flex-direction: row; }
.lr-image {
  flex: 1; background-size: cover;
  background-position: center; background-color: rgba(0,0,0,0.1);
}
.lr-text {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 8%; gap: 1.5rem;
}

/* Headline */
.headline-text {
  font-weight: 800; font-size: 48px; line-height: 1.1;
  color: #F0EEE0; text-align: center;
  word-wrap: break-word; max-width: 100%;
  transition: opacity 0.05s, transform 0.05s;
}

/* CTA */
.cta-btn {
  display: inline-block; padding: 0.7em 2em;
  background: #F0EEE0; color: #802A02;
  font-weight: 700; font-size: 14px;
  text-transform: uppercase; letter-spacing: 2px;
  cursor: default; white-space: nowrap;
}
.cta-btn.hidden { display: none; }

/* Controls Panel */
.controls-panel {
  background: #fff;
  border-left: 1px solid #e0ddd0;
  padding: 1.5rem;
  overflow-y: auto;
  height: 100vh;
}
.controls-title {
  font-size: 16px; font-weight: 800; color: #2B3901;
  text-transform: uppercase; letter-spacing: 2px;
  margin-bottom: 1.5rem; padding-bottom: 1rem;
  border-bottom: 2px solid #F0EEE0;
}

.control-section {
  margin-bottom: 1.25rem; padding-bottom: 1.25rem;
  border-bottom: 1px solid #F0EEE0;
}
.control-label {
  display: block; font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 1.5px;
  color: #802A02; margin-bottom: 0.5rem;
}
.control-label-row {
  display: flex; align-items: center;
  justify-content: space-between; margin-bottom: 0.5rem;
}

.control-select {
  width: 100%; padding: 0.5rem 0.75rem;
  border: 1px solid #e0ddd0; background: #fff;
  font-size: 13px; color: #131313; cursor: pointer;
  appearance: none; -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23802A02' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 0.75rem center;
}
.control-input {
  width: 100%; padding: 0.5rem 0.75rem;
  border: 1px solid #e0ddd0; font-size: 13px;
  color: #131313; background: #fff;
}
.control-input:focus, .control-select:focus { outline: none; border-color: #802A02; }
.control-color { width: 100%; height: 32px; border: 1px solid #e0ddd0; cursor: pointer; padding: 2px; background: #fff; }
.control-color.small { width: 40px; height: 28px; }
.control-file { width: 100%; font-size: 12px; color: #666; }
.hint-text { font-size: 10px; color: #999; margin-top: 0.35rem; }

.custom-dims { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem; }
.custom-dims.hidden { display: none; }
.dim-input { width: 80px !important; text-align: center; }
.dim-x { color: #999; font-size: 12px; }
.dim-unit { color: #999; font-size: 11px; }

/* Layout Buttons */
.layout-options { display: flex; gap: 0.5rem; }
.layout-btn {
  width: 52px; height: 52px; border: 2px solid #e0ddd0;
  background: #fff; cursor: pointer; padding: 4px; transition: all 0.2s;
}
.layout-btn:hover { border-color: #EEC8B3; }
.layout-btn.active { border-color: #802A02; background: #FFF8F5; }

/* Background Controls */
.bg-type-tabs { display: flex; gap: 0; margin-bottom: 0.75rem; }
.bg-tab {
  flex: 1; padding: 0.4rem; font-size: 11px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 1px;
  border: 1px solid #e0ddd0; background: #f9f9f5;
  color: #999; cursor: pointer; transition: all 0.2s;
}
.bg-tab + .bg-tab { border-left: none; }
.bg-tab.active { background: #802A02; color: #fff; border-color: #802A02; }
.bg-controls.hidden { display: none; }
.mt-sm { margin-top: 0.5rem; }

/* Color Presets */
.color-presets { display: flex; gap: 0.4rem; margin-bottom: 0.5rem; }
.color-presets.small { margin-bottom: 0.25rem; }
.color-preset {
  width: 28px; height: 28px; border: 2px solid transparent;
  cursor: pointer; transition: all 0.15s;
}
.color-preset:hover { transform: scale(1.1); }
.color-preset.active { border-color: #802A02; box-shadow: 0 0 0 2px #EEC8B3; }

/* Inline Controls */
.inline-controls { display: flex; gap: 1rem; margin-top: 0.5rem; align-items: center; }
.inline-control { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
.mini-label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 1px; width: 100%; }
.range-val { font-size: 11px; color: #802A02; font-weight: 600; min-width: 36px; }
input[type="range"] {
  -webkit-appearance: none; appearance: none;
  height: 4px; background: #e0ddd0; outline: none; flex: 1;
}
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none;
  width: 14px; height: 14px; background: #802A02;
  border-radius: 50%; cursor: pointer;
}

/* Align */
.align-btns { display: flex; gap: 0.25rem; margin-top: 0.5rem; }
.align-btn {
  padding: 0.4rem 0.6rem; border: 1px solid #e0ddd0;
  background: #fff; cursor: pointer; color: #999; transition: all 0.15s;
}
.align-btn:hover { color: #131313; }
.align-btn.active { background: #802A02; color: #fff; border-color: #802A02; }

/* Toggle */
.toggle { position: relative; width: 40px; height: 22px; }
.toggle input { opacity: 0; width: 0; height: 0; }
.toggle-slider {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: #ccc; transition: 0.3s; border-radius: 22px; cursor: pointer;
}
.toggle-slider:before {
  content: ''; position: absolute; height: 16px; width: 16px;
  left: 3px; bottom: 3px; background: #fff; transition: 0.3s; border-radius: 50%;
}
.toggle input:checked + .toggle-slider { background: #802A02; }
.toggle input:checked + .toggle-slider:before { transform: translateX(18px); }

/* Export */
.export-section { border-bottom: none; }
.export-btns { display: flex; flex-direction: column; gap: 0.5rem; }
.export-btn {
  width: 100%; padding: 0.65rem; font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 2px; border: none;
  background: #131313; color: #fff; cursor: pointer; transition: background 0.2s;
}
.export-btn:hover { background: #802A02; }
.export-btn:disabled { background: #999; cursor: wait; }
.export-btn.secondary { background: #fff; color: #131313; border: 1px solid #e0ddd0; }
.export-btn.secondary:hover { background: #F0EEE0; }
.export-btn.anim-export { background: #2B3901; }
.export-btn.anim-export:hover { background: #802A02; }
.hidden { display: none; }

/* Progress Bar */
.export-progress { margin-top: 0.5rem; }
.progress-bar {
  width: 100%; height: 6px; background: #e0ddd0; overflow: hidden;
}
.progress-fill {
  height: 100%; background: #802A02; width: 0%;
  transition: width 0.1s;
}
.progress-text { font-size: 10px; color: #999; margin-top: 0.25rem; display: block; }

/* Post Copy Section */
.post-copy-section { border-bottom: 2px solid #802A02; padding-bottom: 1rem; }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
.collapse-btn { background: none; border: none; cursor: pointer; padding: 2px; color: #802A02; display: flex; align-items: center; }
.collapse-btn .collapse-icon { width: 16px; height: 16px; transition: transform 0.2s; }
.collapse-btn.collapsed .collapse-icon { transform: rotate(-90deg); }
#postCopyContent { transition: max-height 0.3s ease, opacity 0.2s ease; overflow: hidden; }
#postCopyContent.collapsed { max-height: 0 !important; opacity: 0; margin: 0; }
.form-group { margin-bottom: 0.75rem; }
.mini-label { display: block; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #802A02; margin-bottom: 0.3rem; }
.control-textarea {
  width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #e0ddd0; border-radius: 0;
  font-size: 13px; color: #131313; background: #fff; resize: vertical;
  font-family: inherit; min-height: 80px; line-height: 1.5;
}
.control-textarea:focus { outline: none; border-color: #802A02; }
.char-count { text-align: right; font-size: 10px; color: #999; margin-top: 0.25rem; }
.char-count.over-limit { color: #EE5A24; font-weight: 600; }
.copy-buttons { display: flex; gap: 0.5rem; }
.copy-btn {
  flex: 1; display: flex; align-items: center; justify-content: center;
  gap: 0.4rem; padding: 0.5rem; font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 1px; border: none;
  background: #802A02; color: #fff; cursor: pointer; transition: all 0.2s;
}
.copy-btn:hover { background: #6B2302; }
.copy-btn.secondary { background: #fff; color: #802A02; border: 1px solid #e0ddd0; }
.copy-btn.secondary:hover { background: #F0EEE0; }
.copy-btn.copied { background: #2B3901 !important; color: #fff !important; border-color: #2B3901 !important; }
.copy-btn svg { width: 14px; height: 14px; flex-shrink: 0; }

/* Responsive */
@media (max-width: 768px) {
  #app { grid-template-columns: 1fr; grid-template-rows: 50vh 1fr; height: auto; }
  .preview-panel { min-height: 50vh; }
  .controls-panel { height: auto; }
}
`;

const jsCode = `
(function() {
  // Platform presets
  var PLATFORM_DIMS = {
    instagram: '1080x1080',
    linkedin: '1200x627',
    twitter: '1200x675',
    facebook: '1200x630'
  };
  var PLATFORM_CHAR_LIMITS = {
    instagram: 2200,
    linkedin: 3000,
    twitter: 280,
    facebook: 63206
  };

  // State
  const state = {
    width: 1080,
    height: 1080,
    layout: 'hsplit',
    bgType: 'color',
    bgColor: '#802A02',
    bgImage: null,
    bgImageSrc: null,
    bgFit: 'cover',
    bgVideo: null,
    bgVideoSrc: null,
    headline: 'Your Headline Here',
    fontSize: 48,
    textColor: '#F0EEE0',
    textAlign: 'center',
    animEnabled: false,
    animType: 'typewriter',
    animSpeed: 1,
    animDuration: 2,
    animProgress: 0,
    ctaEnabled: true,
    ctaText: 'Learn More',
    ctaBgColor: '#F0EEE0',
    ctaTextColor: '#802A02',
    platform: '',
    postCaption: '',
    postHashtags: ''
  };

  let animFrameId = null;
  let animStartTime = null;
  let isExporting = false;

  // Elements
  const container = document.getElementById('canvasContainer');
  const previewWrapper = document.getElementById('previewWrapper');
  const bgVideoEl = document.getElementById('bgVideo');

  // Resize preview to fit
  function resizePreview() {
    const wrapperRect = previewWrapper.getBoundingClientRect();
    const maxW = wrapperRect.width - 40;
    const maxH = wrapperRect.height - 40;
    const aspect = state.width / state.height;
    let w, h;
    if (maxW / maxH > aspect) {
      h = Math.min(maxH, 600);
      w = h * aspect;
    } else {
      w = Math.min(maxW, 800);
      h = w / aspect;
    }
    container.style.width = w + 'px';
    container.style.height = h + 'px';
  }

  // Apply animation to DOM headline elements
  function applyDOMAnimation(progress) {
    document.querySelectorAll('.headline-text').forEach(function(el) {
      if (!state.animEnabled) {
        el.textContent = state.headline;
        el.style.opacity = '1';
        el.style.transform = 'none';
        return;
      }
      switch (state.animType) {
        case 'typewriter':
          var charCount = Math.floor(progress * state.headline.length);
          el.textContent = state.headline.substring(0, charCount);
          el.style.opacity = '1';
          el.style.transform = 'none';
          break;
        case 'fadeIn':
          el.textContent = state.headline;
          el.style.opacity = String(Math.min(1, progress));
          el.style.transform = 'none';
          break;
        case 'slideUp':
          el.textContent = state.headline;
          el.style.opacity = String(Math.min(1, progress * 1.5));
          var offset = (1 - Math.min(1, progress)) * 40;
          el.style.transform = 'translateY(' + offset + 'px)';
          break;
        case 'scaleIn':
          el.textContent = state.headline;
          el.style.opacity = String(Math.min(1, progress * 1.5));
          var scale = 0.3 + 0.7 * Math.min(1, progress);
          el.style.transform = 'scale(' + scale + ')';
          break;
      }
    });
  }

  // Animation loop for live preview
  function animationLoop(timestamp) {
    if (!state.animEnabled) return;
    if (!animStartTime) animStartTime = timestamp;
    var elapsed = (timestamp - animStartTime) / 1000;
    var cycleDuration = state.animDuration / state.animSpeed;
    var totalCycle = cycleDuration + 1; // 1 second pause between loops
    var cycleTime = elapsed % totalCycle;
    if (cycleTime <= cycleDuration) {
      state.animProgress = Math.min(1, cycleTime / cycleDuration);
    } else {
      state.animProgress = 1;
    }
    applyDOMAnimation(state.animProgress);
    animFrameId = requestAnimationFrame(animationLoop);
  }

  function startAnimation() {
    stopAnimation();
    if (state.animEnabled) {
      animStartTime = null;
      animFrameId = requestAnimationFrame(animationLoop);
    }
  }

  function stopAnimation() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    animStartTime = null;
    state.animProgress = 0;
  }

  // Update all layouts
  function updatePreview() {
    resizePreview();

    document.querySelectorAll('.layout').forEach(function(l) { l.classList.remove('active'); });
    var activeLayout = document.getElementById('layout-' + state.layout);
    if (activeLayout) activeLayout.classList.add('active');

    container.style.backgroundColor = state.bgColor;

    // Show/hide video
    if (state.bgType === 'video' && state.bgVideoSrc) {
      bgVideoEl.style.display = 'block';
      bgVideoEl.style.zIndex = '0';
    } else {
      bgVideoEl.style.display = 'none';
    }

    // Update headlines (static content - animation loop handles animated display)
    document.querySelectorAll('.headline-text').forEach(function(el) {
      el.style.fontSize = state.fontSize * (container.offsetWidth / state.width) + 'px';
      el.style.color = state.textColor;
      el.style.textAlign = state.textAlign;
      if (!state.animEnabled) {
        el.textContent = state.headline;
        el.style.opacity = '1';
        el.style.transform = 'none';
      }
    });

    // Update CTA buttons
    document.querySelectorAll('.cta-btn').forEach(function(el) {
      el.textContent = state.ctaText;
      el.style.background = state.ctaBgColor;
      el.style.color = state.ctaTextColor;
      el.style.fontSize = (14 * container.offsetWidth / state.width) + 'px';
      el.style.letterSpacing = (2 * container.offsetWidth / state.width) + 'px';
      el.style.padding = (0.7 * container.offsetWidth / state.width) + 'em ' + (2 * container.offsetWidth / state.width) + 'em';
      if (state.ctaEnabled) { el.classList.remove('hidden'); }
      else { el.classList.add('hidden'); }
    });

    // Background image/video for areas
    var bgStyle = state.bgImageSrc ? 'url(' + state.bgImageSrc + ')' : 'none';
    var hasBgMedia = (state.bgType === 'image' && state.bgImageSrc) || (state.bgType === 'video' && state.bgVideoSrc);

    var hsplitBottom = document.getElementById('hsplit-bottom');
    hsplitBottom.style.backgroundImage = (state.bgType === 'image' && state.bgImageSrc) ? bgStyle : 'none';
    hsplitBottom.style.backgroundSize = state.bgFit;
    hsplitBottom.style.backgroundColor = hasBgMedia ? 'transparent' : 'rgba(0,0,0,0.15)';

    var fullbleedBg = document.getElementById('fullbleed-bg');
    fullbleedBg.style.backgroundImage = (state.bgType === 'image' && state.bgImageSrc) ? bgStyle : 'none';
    fullbleedBg.style.backgroundSize = state.bgFit;
    fullbleedBg.style.backgroundColor = state.bgColor;

    var lrsplitImage = document.getElementById('lrsplit-image');
    lrsplitImage.style.backgroundImage = (state.bgType === 'image' && state.bgImageSrc) ? bgStyle : 'none';
    lrsplitImage.style.backgroundSize = state.bgFit;
    lrsplitImage.style.backgroundColor = hasBgMedia ? 'transparent' : 'rgba(0,0,0,0.15)';
  }

  // --- Post Copy Controls ---
  var platformSelect = document.getElementById('platformSelect');
  var postCaptionEl = document.getElementById('postCaption');
  var captionCharCountEl = document.getElementById('captionCharCount');
  var captionCharLimitEl = document.getElementById('captionCharLimit');

  function updateCharCount() {
    var count = postCaptionEl.value.length;
    var limit = parseInt(captionCharLimitEl.textContent);
    captionCharCountEl.textContent = count;
    captionCharCountEl.parentElement.classList.toggle('over-limit', count > limit);
  }

  platformSelect.addEventListener('change', function() {
    state.platform = this.value;
    if (this.value && PLATFORM_DIMS[this.value]) {
      dimPreset.value = PLATFORM_DIMS[this.value];
      var parts = PLATFORM_DIMS[this.value].split('x').map(Number);
      state.width = parts[0]; state.height = parts[1];
      customDims.classList.add('hidden');
      captionCharLimitEl.textContent = PLATFORM_CHAR_LIMITS[this.value] || 2200;
    } else {
      captionCharLimitEl.textContent = '2200';
    }
    updateCharCount();
    updatePreview();
  });

  postCaptionEl.addEventListener('input', function() {
    state.postCaption = this.value;
    updateCharCount();
  });

  document.getElementById('postHashtags').addEventListener('input', function() {
    state.postHashtags = this.value;
  });

  function flashCopyBtn(btn, originalHTML) {
    btn.classList.add('copied');
    btn.textContent = 'Copied!';
    setTimeout(function() {
      btn.classList.remove('copied');
      btn.innerHTML = originalHTML;
    }, 1500);
  }

  document.getElementById('copyCaptionBtn').addEventListener('click', function() {
    var text = postCaptionEl.value;
    if (!text) return;
    var btn = this;
    var html = btn.innerHTML;
    navigator.clipboard.writeText(text).then(function() { flashCopyBtn(btn, html); });
  });

  document.getElementById('copyHashtagsBtn').addEventListener('click', function() {
    var text = document.getElementById('postHashtags').value;
    if (!text) return;
    var btn = this;
    var html = btn.innerHTML;
    navigator.clipboard.writeText(text).then(function() { flashCopyBtn(btn, html); });
  });

  document.getElementById('postCopyCollapse').addEventListener('click', function() {
    var content = document.getElementById('postCopyContent');
    content.classList.toggle('collapsed');
    this.classList.toggle('collapsed');
  });

  // --- Dimension Controls ---
  var dimPreset = document.getElementById('dimensionPreset');
  var customDims = document.getElementById('customDims');
  var customW = document.getElementById('customW');
  var customH = document.getElementById('customH');

  dimPreset.addEventListener('change', function() {
    if (this.value === 'custom') {
      customDims.classList.remove('hidden');
      state.width = parseInt(customW.value) || 1080;
      state.height = parseInt(customH.value) || 1080;
    } else {
      customDims.classList.add('hidden');
      var parts = this.value.split('x').map(Number);
      state.width = parts[0]; state.height = parts[1];
    }
    updatePreview();
  });
  customW.addEventListener('input', function() { state.width = parseInt(this.value) || 100; updatePreview(); });
  customH.addEventListener('input', function() { state.height = parseInt(this.value) || 100; updatePreview(); });

  // --- Layout Controls ---
  document.querySelectorAll('.layout-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.layout-btn').forEach(function(b) { b.classList.remove('active'); });
      this.classList.add('active');
      state.layout = this.dataset.layout;
      updatePreview();
    });
  });

  // --- Background Controls ---
  document.querySelectorAll('.bg-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.bg-tab').forEach(function(t) { t.classList.remove('active'); });
      this.classList.add('active');
      state.bgType = this.dataset.bgtype;
      document.getElementById('bgColorControls').classList.toggle('hidden', state.bgType !== 'color');
      document.getElementById('bgImageControls').classList.toggle('hidden', state.bgType !== 'image');
      document.getElementById('bgVideoControls').classList.toggle('hidden', state.bgType !== 'video');
      // Stop video if switching away
      if (state.bgType !== 'video') { bgVideoEl.pause(); bgVideoEl.style.display = 'none'; }
      else if (state.bgVideoSrc) { bgVideoEl.play(); }
      updatePreview();
    });
  });

  // Background color presets
  document.querySelectorAll('.color-preset:not(.text-preset)').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.color-preset:not(.text-preset)').forEach(function(b) { b.classList.remove('active'); });
      this.classList.add('active');
      state.bgColor = this.dataset.color;
      document.getElementById('bgColor').value = state.bgColor;
      updatePreview();
    });
  });
  document.getElementById('bgColor').addEventListener('input', function() {
    state.bgColor = this.value;
    document.querySelectorAll('.color-preset:not(.text-preset)').forEach(function(b) { b.classList.remove('active'); });
    updatePreview();
  });

  // Background image
  document.getElementById('bgImageInput').addEventListener('change', function(e) {
    var file = e.target.files[0];
    if (file) {
      var reader = new FileReader();
      reader.onload = function(ev) {
        state.bgImageSrc = ev.target.result;
        var img = new Image();
        img.onload = function() { state.bgImage = img; updatePreview(); };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
  document.getElementById('bgFit').addEventListener('change', function() { state.bgFit = this.value; updatePreview(); });

  // Background video
  document.getElementById('bgVideoInput').addEventListener('change', function(e) {
    var file = e.target.files[0];
    if (file) {
      var url = URL.createObjectURL(file);
      state.bgVideoSrc = url;
      bgVideoEl.src = url;
      bgVideoEl.load();
      bgVideoEl.play();
      bgVideoEl.style.display = 'block';
      updatePreview();
    }
  });

  // --- Headline Controls ---
  document.getElementById('headlineText').addEventListener('input', function() { state.headline = this.value; updatePreview(); });
  document.getElementById('fontSize').addEventListener('input', function() {
    state.fontSize = parseInt(this.value);
    document.getElementById('fontSizeVal').textContent = this.value + 'px';
    updatePreview();
  });
  document.querySelectorAll('.text-preset').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.text-preset').forEach(function(b) { b.classList.remove('active'); });
      this.classList.add('active');
      state.textColor = this.dataset.textcolor;
      document.getElementById('textColor').value = state.textColor;
      updatePreview();
    });
  });
  document.getElementById('textColor').addEventListener('input', function() {
    state.textColor = this.value;
    document.querySelectorAll('.text-preset').forEach(function(b) { b.classList.remove('active'); });
    updatePreview();
  });
  document.querySelectorAll('.align-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.align-btn').forEach(function(b) { b.classList.remove('active'); });
      this.classList.add('active');
      state.textAlign = this.dataset.align;
      updatePreview();
    });
  });

  // --- Animation Controls ---
  document.getElementById('animToggle').addEventListener('change', function() {
    state.animEnabled = this.checked;
    var ctrl = document.getElementById('animControls');
    ctrl.style.opacity = this.checked ? '1' : '0.4';
    ctrl.style.pointerEvents = this.checked ? 'auto' : 'none';
    document.getElementById('animExportSection').classList.toggle('hidden', !this.checked);
    if (this.checked) { startAnimation(); }
    else { stopAnimation(); applyDOMAnimation(1); }
  });
  document.getElementById('animType').addEventListener('change', function() {
    state.animType = this.value;
    if (state.animEnabled) startAnimation();
  });
  document.getElementById('animSpeed').addEventListener('input', function() {
    state.animSpeed = parseFloat(this.value);
    document.getElementById('animSpeedVal').textContent = this.value + 'x';
  });
  document.getElementById('animDuration').addEventListener('input', function() {
    state.animDuration = parseFloat(this.value);
    document.getElementById('animDurationVal').textContent = this.value + 's';
  });

  // --- CTA Controls ---
  document.getElementById('ctaToggle').addEventListener('change', function() {
    state.ctaEnabled = this.checked;
    document.getElementById('ctaControls').style.opacity = this.checked ? '1' : '0.4';
    document.getElementById('ctaControls').style.pointerEvents = this.checked ? 'auto' : 'none';
    updatePreview();
  });
  document.getElementById('ctaText').addEventListener('input', function() { state.ctaText = this.value; updatePreview(); });
  document.getElementById('ctaBgColor').addEventListener('input', function() { state.ctaBgColor = this.value; updatePreview(); });
  document.getElementById('ctaTextColor').addEventListener('input', function() { state.ctaTextColor = this.value; updatePreview(); });

  // ========== CANVAS RENDERING ==========

  function renderToCanvas(progress) {
    if (progress === undefined) progress = 1;
    var canvas = document.createElement('canvas');
    canvas.width = state.width;
    canvas.height = state.height;
    var ctx = canvas.getContext('2d');
    var w = state.width;
    var h = state.height;

    // Background color
    ctx.fillStyle = state.bgColor;
    ctx.fillRect(0, 0, w, h);

    // Draw background media (video frame or image)
    function drawBgMedia(x, y, areaW, areaH) {
      var source = null;
      if (state.bgType === 'video' && bgVideoEl && bgVideoEl.readyState >= 2) {
        source = bgVideoEl;
      } else if (state.bgType === 'image' && state.bgImage) {
        source = state.bgImage;
      }
      if (!source) return;
      var sw = source.videoWidth || source.naturalWidth;
      var sh = source.videoHeight || source.naturalHeight;
      if (!sw || !sh) return;
      var sx = 0, sy = 0;
      var dx = x, dy = y, dw = areaW, dh = areaH;
      if (state.bgFit === 'cover') {
        var imgAspect = sw / sh;
        var areaAspect = areaW / areaH;
        if (imgAspect > areaAspect) {
          var newSw = sh * areaAspect;
          sx = (sw - newSw) / 2; sw = newSw;
        } else {
          var newSh = sw / areaAspect;
          sy = (sh - newSh) / 2; sh = newSh;
        }
      } else {
        var imgAspect2 = sw / sh;
        var areaAspect2 = areaW / areaH;
        if (imgAspect2 > areaAspect2) {
          dh = areaW / imgAspect2; dy = y + (areaH - dh) / 2; dw = areaW;
        } else {
          dw = areaH * imgAspect2; dx = x + (areaW - dw) / 2; dh = areaH;
        }
      }
      ctx.drawImage(source, sx, sy, sw, sh, dx, dy, dw, dh);
    }

    // Draw headline with animation progress
    function drawHeadline(x, y, maxW, align) {
      var text = state.headline;
      var alpha = 1;
      var offsetY = 0;
      var fontScale = 1;
      if (state.animEnabled && progress < 1) {
        switch (state.animType) {
          case 'typewriter':
            var charCount = Math.floor(progress * text.length);
            text = text.substring(0, charCount);
            break;
          case 'fadeIn':
            alpha = Math.min(1, progress);
            break;
          case 'slideUp':
            alpha = Math.min(1, progress * 1.5);
            offsetY = (1 - Math.min(1, progress)) * state.fontSize * 1.5;
            break;
          case 'scaleIn':
            alpha = Math.min(1, progress * 1.5);
            fontScale = 0.3 + 0.7 * Math.min(1, progress);
            break;
        }
      }

      var actualFontSize = state.fontSize * fontScale;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = state.textColor;
      ctx.font = '800 ' + actualFontSize + 'px Inter, sans-serif';
      ctx.textAlign = align || state.textAlign;
      ctx.textBaseline = 'middle';

      var words = text.split(' ');
      var lines = [];
      var currentLine = '';
      for (var i = 0; i < words.length; i++) {
        var testLine = currentLine ? currentLine + ' ' + words[i] : words[i];
        if (ctx.measureText(testLine).width > maxW && currentLine) {
          lines.push(currentLine); currentLine = words[i];
        } else { currentLine = testLine; }
      }
      if (currentLine) lines.push(currentLine);

      var lineH = actualFontSize * 1.15;
      var totalH = lines.length * lineH;
      var startY = y - totalH / 2 + lineH / 2 + offsetY;
      var textX = x;
      if (ctx.textAlign === 'left') textX = x - maxW / 2;
      if (ctx.textAlign === 'right') textX = x + maxW / 2;
      for (var j = 0; j < lines.length; j++) {
        ctx.fillText(lines[j], textX, startY);
        startY += lineH;
      }
      ctx.restore();
      return startY - offsetY;
    }

    // Draw CTA
    function drawCTA(cx, cy) {
      if (!state.ctaEnabled) return;
      ctx.font = '700 ' + Math.round(14 * (w / 1080)) + 'px Inter, sans-serif';
      var textW = ctx.measureText(state.ctaText.toUpperCase()).width;
      var padX = 40 * (w / 1080);
      var padY = 16 * (w / 1080);
      var btnW = textW + padX * 2;
      var btnH = 14 * (w / 1080) + padY * 2;
      ctx.fillStyle = state.ctaBgColor;
      ctx.fillRect(cx - btnW / 2, cy - btnH / 2, btnW, btnH);
      ctx.fillStyle = state.ctaTextColor;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(state.ctaText.toUpperCase(), cx, cy);
    }

    // Render by layout
    var hasBgMedia = (state.bgType === 'image' && state.bgImage) || (state.bgType === 'video' && bgVideoEl && bgVideoEl.readyState >= 2);
    if (state.layout === 'hsplit') {
      ctx.fillStyle = state.bgColor; ctx.fillRect(0, 0, w, h / 2);
      drawHeadline(w / 2, h / 4, w * 0.84);
      if (hasBgMedia) { drawBgMedia(0, h / 2, w, h / 2); }
      else { ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(0, h / 2, w, h / 2); }
      if (state.ctaEnabled) drawCTA(w / 2, h * 0.38);
    } else if (state.layout === 'fullbleed') {
      if (hasBgMedia) { drawBgMedia(0, 0, w, h); }
      var grad = ctx.createLinearGradient(0, h * 0.5, 0, h);
      grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(1, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = grad; ctx.fillRect(0, h * 0.5, w, h * 0.5);
      drawHeadline(w / 2, h * 0.78, w * 0.84);
      if (state.ctaEnabled) drawCTA(w / 2, h * 0.88);
    } else if (state.layout === 'centered') {
      var bottomY = drawHeadline(w / 2, h * 0.42, w * 0.84);
      drawCTA(w / 2, bottomY + state.fontSize * 0.8);
    } else if (state.layout === 'lrsplit') {
      if (hasBgMedia) { drawBgMedia(0, 0, w / 2, h); }
      else { ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(0, 0, w / 2, h); }
      ctx.fillStyle = state.bgColor; ctx.fillRect(w / 2, 0, w / 2, h);
      var bottomY2 = drawHeadline(w * 0.75, h * 0.4, w * 0.38);
      drawCTA(w * 0.75, bottomY2 + state.fontSize * 0.8);
    }

    return canvas;
  }

  // ========== STATIC EXPORTS ==========

  document.getElementById('exportPng').addEventListener('click', function() {
    var canvas = renderToCanvas(state.animEnabled ? state.animProgress : 1);
    var link = document.createElement('a');
    link.download = 'content-' + state.width + 'x' + state.height + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });

  document.getElementById('exportJpg').addEventListener('click', function() {
    var canvas = renderToCanvas(state.animEnabled ? state.animProgress : 1);
    var link = document.createElement('a');
    link.download = 'content-' + state.width + 'x' + state.height + '.jpg';
    link.href = canvas.toDataURL('image/jpeg', 0.92);
    link.click();
  });

  document.getElementById('exportHtml').addEventListener('click', function() {
    var bgStyle = (state.bgType === 'image' && state.bgImageSrc)
      ? 'background-image:url(' + state.bgImageSrc + ');background-size:' + state.bgFit + ';background-position:center;'
      : '';
    var ctaHtml = state.ctaEnabled
      ? '<a href="#" style="display:inline-block;padding:12px 32px;background:' + state.ctaBgColor + ';color:' + state.ctaTextColor + ';font-weight:700;font-size:14px;text-transform:uppercase;letter-spacing:2px;text-decoration:none;font-family:Inter,sans-serif;">' + state.ctaText + '</a>'
      : '';
    var animCSS = '';
    var animClass = '';
    if (state.animEnabled) {
      var dur = state.animDuration / state.animSpeed;
      switch (state.animType) {
        case 'typewriter':
          animCSS = '@keyframes typing{from{width:0}to{width:100%}}@keyframes blink{50%{border-color:transparent}}.headline{overflow:hidden;white-space:nowrap;border-right:3px solid;animation:typing ' + dur + 's steps(' + state.headline.length + ') infinite,blink 0.7s step-end infinite;}';
          break;
        case 'fadeIn':
          animCSS = '@keyframes fadeIn{from{opacity:0}to{opacity:1}}.headline{animation:fadeIn ' + dur + 's ease-out infinite;}';
          break;
        case 'slideUp':
          animCSS = '@keyframes slideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}.headline{animation:slideUp ' + dur + 's ease-out infinite;}';
          break;
        case 'scaleIn':
          animCSS = '@keyframes scaleIn{from{opacity:0;transform:scale(0.3)}to{opacity:1;transform:scale(1)}}.headline{animation:scaleIn ' + dur + 's ease-out infinite;}';
          break;
      }
    }
    var html = '<!DOCTYPE html>\\n<html>\\n<head>\\n<meta charset="UTF-8">\\n<meta name="viewport" content="width=device-width,initial-scale=1.0">\\n<meta name="ad.size" content="width=' + state.width + ',height=' + state.height + '">\\n<style>\\n*{margin:0;padding:0;box-sizing:border-box;}\\nbody{width:' + state.width + 'px;height:' + state.height + 'px;overflow:hidden;font-family:Inter,-apple-system,sans-serif;}\\n.container{width:100%;height:100%;background:' + state.bgColor + ';' + bgStyle + 'display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8%;}\\n.headline{font-weight:800;font-size:' + state.fontSize + 'px;line-height:1.1;color:' + state.textColor + ';text-align:' + state.textAlign + ';margin-bottom:24px;}\\n' + animCSS + '\\n</style>\\n</head>\\n<body>\\n<div class="container">\\n<div class="headline">' + state.headline + '</div>\\n' + ctaHtml + '\\n</div>\\n</body>\\n</html>';
    var blob = new Blob([html], { type: 'text/html' });
    var link = document.createElement('a');
    link.download = 'ad-' + state.width + 'x' + state.height + '.html';
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  });

  // ========== ANIMATED EXPORTS ==========

  function showProgress(pct, text) {
    var section = document.getElementById('exportProgress');
    section.classList.remove('hidden');
    document.getElementById('progressFill').style.width = pct + '%';
    document.getElementById('progressText').textContent = text || 'Rendering...';
  }
  function hideProgress() {
    document.getElementById('exportProgress').classList.add('hidden');
  }
  function disableExportBtns() {
    document.querySelectorAll('.anim-export').forEach(function(b) { b.disabled = true; });
  }
  function enableExportBtns() {
    document.querySelectorAll('.anim-export').forEach(function(b) { b.disabled = false; });
  }

  // WebM Export via MediaRecorder
  document.getElementById('exportWebm').addEventListener('click', function() {
    if (isExporting) return;
    isExporting = true;
    disableExportBtns();
    showProgress(0, 'Recording WebM...');

    var canvas = document.createElement('canvas');
    canvas.width = state.width;
    canvas.height = state.height;
    var ctx = canvas.getContext('2d');
    var stream = canvas.captureStream(30);
    var recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
    var chunks = [];
    recorder.ondataavailable = function(e) { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = function() {
      var blob = new Blob(chunks, { type: 'video/webm' });
      var link = document.createElement('a');
      link.download = 'content-' + state.width + 'x' + state.height + '.webm';
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
      hideProgress();
      enableExportBtns();
      isExporting = false;
    };

    recorder.start();
    var fps = 30;
    var cycleDuration = state.animDuration / state.animSpeed;
    var totalFrames = Math.ceil(fps * (cycleDuration + 0.5));
    var frame = 0;

    function renderFrame() {
      if (frame >= totalFrames) {
        recorder.stop();
        return;
      }
      var progress = Math.min(1, (frame / fps) / cycleDuration);
      var rendered = renderToCanvas(progress);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(rendered, 0, 0);
      frame++;
      showProgress(Math.round(frame / totalFrames * 100), 'Recording WebM... ' + Math.round(frame / totalFrames * 100) + '%');
      requestAnimationFrame(renderFrame);
    }
    renderFrame();
  });

  // GIF Export via gif.js
  document.getElementById('exportGif').addEventListener('click', function() {
    if (isExporting) return;
    isExporting = true;
    disableExportBtns();
    showProgress(0, 'Loading GIF encoder...');

    // Load gif.js from CDN if not already loaded
    function loadGifJs(cb) {
      if (window.GIF) { cb(); return; }
      var script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js';
      script.onload = cb;
      script.onerror = function() {
        showProgress(0, 'Failed to load GIF library');
        enableExportBtns();
        isExporting = false;
      };
      document.head.appendChild(script);
    }

    loadGifJs(function() {
      showProgress(5, 'Generating GIF frames...');
      var gif = new GIF({
        workers: 2,
        quality: 10,
        width: state.width,
        height: state.height,
        workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js'
      });

      var fps = 15;
      var cycleDuration = state.animDuration / state.animSpeed;
      var totalFrames = Math.ceil(fps * (cycleDuration + 0.5));
      var delay = Math.round(1000 / fps);

      for (var i = 0; i < totalFrames; i++) {
        var progress = Math.min(1, (i / fps) / cycleDuration);
        var frameCanvas = renderToCanvas(progress);
        gif.addFrame(frameCanvas, { delay: delay, copy: true });
        showProgress(5 + Math.round(i / totalFrames * 50), 'Generating frames... ' + (i + 1) + '/' + totalFrames);
      }

      gif.on('progress', function(p) {
        showProgress(55 + Math.round(p * 45), 'Encoding GIF... ' + Math.round(p * 100) + '%');
      });

      gif.on('finished', function(blob) {
        var link = document.createElement('a');
        link.download = 'content-' + state.width + 'x' + state.height + '.gif';
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
        hideProgress();
        enableExportBtns();
        isExporting = false;
      });

      gif.render();
    });
  });

  // Apply pre-fill params from AI assistant
  (function applyToolParams() {
    var p = window.__TOOL_PARAMS__;
    if (!p || Object.keys(p).length === 0) return;

    if (p.headline) {
      state.headline = p.headline;
      var headlineInput = document.getElementById('headlineText');
      if (headlineInput) headlineInput.value = p.headline;
    }
    if (p.width && p.height) {
      state.width = parseInt(p.width);
      state.height = parseInt(p.height);
      var dimVal = p.width + 'x' + p.height;
      var dimSelect = document.getElementById('dimensionPreset');
      if (dimSelect) {
        var found = false;
        for (var i = 0; i < dimSelect.options.length; i++) {
          if (dimSelect.options[i].value === dimVal) { dimSelect.value = dimVal; found = true; break; }
        }
        if (!found) {
          dimSelect.value = 'custom';
          document.getElementById('customDims').classList.remove('hidden');
          document.getElementById('customW').value = p.width;
          document.getElementById('customH').value = p.height;
        }
      }
    }
    if (p.ctaText) {
      state.ctaEnabled = true;
      state.ctaText = p.ctaText;
      var ctaInput = document.getElementById('ctaText');
      if (ctaInput) ctaInput.value = p.ctaText;
      var ctaToggle = document.getElementById('ctaToggle');
      if (ctaToggle) ctaToggle.checked = true;
      var ctaControls = document.getElementById('ctaControls');
      if (ctaControls) { ctaControls.style.opacity = '1'; ctaControls.style.pointerEvents = 'auto'; }
    }
    if (p.bgColor) {
      state.bgColor = p.bgColor;
      var bgInput = document.getElementById('bgColor');
      if (bgInput) bgInput.value = p.bgColor;
    }
    if (p.textColor) {
      state.textColor = p.textColor;
      var tcInput = document.getElementById('textColor');
      if (tcInput) tcInput.value = p.textColor;
    }
    if (p.fontSize) {
      state.fontSize = parseInt(p.fontSize);
      var fsInput = document.getElementById('fontSize');
      if (fsInput) { fsInput.value = p.fontSize; }
      var fsVal = document.getElementById('fontSizeVal');
      if (fsVal) fsVal.textContent = p.fontSize + 'px';
    }
    if (p.textAlign) {
      state.textAlign = p.textAlign;
      document.querySelectorAll('.align-btn').forEach(function(b) {
        b.classList.toggle('active', b.dataset.align === p.textAlign);
      });
    }
    // Post Copy params
    if (p.platform) {
      state.platform = p.platform;
      platformSelect.value = p.platform;
      if (PLATFORM_DIMS[p.platform]) {
        dimPreset.value = PLATFORM_DIMS[p.platform];
        var parts = PLATFORM_DIMS[p.platform].split('x').map(Number);
        state.width = parts[0]; state.height = parts[1];
        customDims.classList.add('hidden');
        captionCharLimitEl.textContent = PLATFORM_CHAR_LIMITS[p.platform] || 2200;
      }
    }
    if (p.post_text) {
      state.postCaption = p.post_text;
      postCaptionEl.value = p.post_text;
      updateCharCount();
    }
    if (p.hashtags) {
      var tags = p.hashtags.split(',').map(function(t) { return t.trim(); }).filter(Boolean);
      var formatted = tags.map(function(t) { return t.charAt(0) === '#' ? t : '#' + t; }).join(' ');
      state.postHashtags = formatted;
      document.getElementById('postHashtags').value = formatted;
    }
  })();

  // Init
  window.addEventListener('resize', resizePreview);
  updatePreview();
})();
`;

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await BrandTool.findOne({ slug: 'static-content-creator' });
    if (existing) {
      console.log('Tool "static-content-creator" already exists. Updating...');
      existing.html_code = htmlCode;
      existing.css_code = cssCode;
      existing.js_code = jsCode;
      existing.title = 'Static Content Creator';
      existing.description = 'Create on-brand static and animated content for social media and ads. Supports typewriter, fade, slide, and scale animations with WebM and GIF export.';
      await existing.save();
      console.log('Tool updated successfully!');
    } else {
      const maxOrder = await BrandTool.findOne().sort({ order_index: -1 }).select('order_index');
      const tool = await BrandTool.create({
        title: 'Static Content Creator',
        description: 'Create on-brand static and animated content for social media and ads. Supports typewriter, fade, slide, and scale animations with WebM and GIF export.',
        slug: 'static-content-creator',
        html_code: htmlCode,
        css_code: cssCode,
        js_code: jsCode,
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
