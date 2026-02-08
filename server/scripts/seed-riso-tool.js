require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const BrandTool = require('../models/BrandTool');

const htmlCode = `
<div class="riso-root">
  <div class="app">

    <!-- Controls -->
    <section class="panel">

      <div class="panel-title">Starter Images</div>
      <div class="preset-grid">
        <button class="preset-btn active" data-src="img1" type="button">Image 1</button>
        <button class="preset-btn" data-src="img2" type="button">Image 2</button>
        <button class="preset-btn" data-src="img3" type="button">Image 3</button>
        <button class="preset-btn" data-src="img4" type="button">Image 4</button>
      </div>

      <div class="control-group">
        <div class="panel-title">Upload</div>
        <label class="file-drop">
          <input type="file" id="fileInput" accept="image/*" />
          <strong>Click to upload your own image</strong>
        </label>
      </div>

      <div class="control-group">
        <div class="panel-title">Overlay Color</div>
        <select id="overlayPreset" class="select">
          <option value="redclay" selected>Red Clay</option>
          <option value="forest">Forest Green</option>
        </select>
        <div class="status">Blend mode: screen</div>
      </div>

      <div class="control-group">
        <div class="panel-title">Download Size</div>

        <div class="control-row">
          <label for="dlWidth">Width (px)</label>
          <input class="num-input" type="number" id="dlWidth" min="64" step="1" placeholder="auto" />
        </div>

        <div class="control-row">
          <label for="dlHeight">Height (px)</label>
          <input class="num-input" type="number" id="dlHeight" min="64" step="1" placeholder="auto" />
        </div>

        <div class="status" id="dlHint">Leave blank to download at the render size. If set, export will center-crop to fit.</div>
      </div>

      <details class="drawer">
        <summary>
          <span>Dither Settings</span>
          <span>&#9662;</span>
        </summary>

        <div class="drawer-inner">
          <div class="control-row">
            <label for="maxWidth">Max width</label>
            <div class="value" id="maxWidthLabel">900px</div>
          </div>
          <input type="range" id="maxWidth" min="400" max="1400" step="50" value="900" />

          <div class="control-row">
            <label for="ditherStrength">Dither</label>
            <div class="value" id="ditherLabel">0.35</div>
          </div>
          <input type="range" id="ditherStrength" min="0" max="0.9" step="0.05" value="0.35" />

          <div class="control-row">
            <label for="brightness">Brightness</label>
            <div class="value" id="brightnessLabel">+0.00</div>
          </div>
          <input type="range" id="brightness" min="-0.35" max="0.35" step="0.01" value="0" />

          <div class="control-row">
            <label for="contrast">Contrast</label>
            <div class="value" id="contrastLabel">+0.10</div>
          </div>
          <input type="range" id="contrast" min="-0.4" max="0.8" step="0.01" value="0.1" />
        </div>
      </details>

      <button id="downloadBtn" class="download-btn" disabled>Download PNG</button>
      <div class="status" id="status">Loading starter image...</div>
    </section>

    <!-- Preview -->
    <section class="canvas-panel">
      <div class="canvas-frame">
        <canvas id="outputCanvas"></canvas>
      </div>
    </section>

  </div>
</div>

<canvas id="sourceCanvas"></canvas>
`;

const cssCode = `
:root{
  --panel:#1b1b1b;
  --border:#2a2a2a;
  --text:#f5f5f5;
  --muted:#bbbbbb;
  --accent:#f0433a;
  --paper:#F0EEE0;
}

body{ background:transparent; }

.riso-root{
  width:100vw;
  height:100vh;
  display:flex;
  font-family:system-ui,-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;
  color:var(--text);
}

.app{
  flex:1;
  display:grid;
  grid-template-columns:360px 1fr;
  gap:18px;
  min-height:0;
}

@media (max-width:900px){
  .app{ grid-template-columns:1fr; }
}

.panel{
  background:var(--panel);
  border-radius:14px;
  border:1px solid var(--border);
  padding:14px;
  display:flex;
  flex-direction:column;
  gap:12px;
  overflow-y:auto;
  min-height:0;
}

.panel-title{
  font-size:.8rem;
  text-transform:uppercase;
  letter-spacing:.14em;
  color:var(--muted);
}

.file-drop{
  border-radius:10px;
  border:1px dashed #3a3a3a;
  padding:14px;
  text-align:center;
  cursor:pointer;
  color:var(--muted);
  transition:border-color .15s ease, background .15s ease;
}
.file-drop:hover{ border-color:var(--accent); background:#202020; }
.file-drop input{ display:none; }
.file-drop strong{ color:#fff; }

.control-group{
  border-top:1px solid #252525;
  padding-top:10px;
  display:flex;
  flex-direction:column;
  gap:10px;
}

.preset-grid{
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:8px;
}

.preset-btn{
  padding:10px;
  border-radius:10px;
  border:1px solid #333;
  background:#141414;
  color:#f5f5f5;
  font-size:.8rem;
  cursor:pointer;
  transition:background .15s ease, border-color .15s ease;
}
.preset-btn:hover{ background:#202020; }
.preset-btn.active{ border-color:var(--accent); background:#262626; }

.control-row{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:10px;
  font-size:.85rem;
}
.control-row label{ flex:1; }

input[type="range"]{ width:100%; }

.value{
  min-width:70px;
  text-align:right;
  font-size:.8rem;
  color:#e0e0e0;
  font-variant-numeric:tabular-nums;
}

.select, .num-input{
  width:100%;
  background:#141414;
  border:1px solid #333;
  color:#f5f5f5;
  border-radius:10px;
  padding:8px 10px;
  font-size:.85rem;
  outline:none;
}
.select:focus, .num-input:focus{ border-color:#555; }

.num-input{
  width:120px;
  text-align:right;
}

details.drawer summary{
  cursor:pointer;
  list-style:none;
  border:1px solid #2b2b2b;
  border-radius:10px;
  padding:8px 10px;
  background:#171717;
  font-weight:600;
  display:flex;
  justify-content:space-between;
  align-items:center;
}
details.drawer summary::-webkit-details-marker{ display:none; }

.drawer-inner{
  padding-top:10px;
  display:flex;
  flex-direction:column;
  gap:14px;
}

.download-btn{
  background:var(--paper);
  color:#000;
  border-radius:999px;
  padding:10px;
  font-weight:600;
  border:1px solid #d8d4c6;
  cursor:pointer;
  transition:transform .08s ease, box-shadow .15s ease, opacity .15s ease;
}
.download-btn:hover{
  transform:translateY(-1px);
  box-shadow:0 8px 20px rgba(0,0,0,.35);
}
.download-btn:active{
  transform:translateY(0);
  box-shadow:0 4px 14px rgba(0,0,0,.25);
}
.download-btn:disabled{
  opacity:.45;
  cursor:default;
  transform:none;
  box-shadow:none;
}

.status{
  font-size:.75rem;
  color:var(--muted);
  line-height:1.35;
}

.canvas-panel{
  display:flex;
  min-height:0;
}

.canvas-frame{
  flex:1;
  background:radial-gradient(circle at top, #222 0, #050505 60%);
  border-radius:14px;
  padding:10px;
  display:flex;
  align-items:center;
  justify-content:center;
  min-height:0;
}

canvas{
  width:100%;
  height:100%;
  object-fit:contain;
  background:var(--paper);
  border-radius:10px;
}

#sourceCanvas{ display:none; }
`;

const jsCode = `
(function() {
  var IMAGE_PRESETS = {
    img1: "https://cdn.prod.website-files.com/6595cfe22fcb759035f7ff6c/69441c95f64f89581e1cbc15_saksham-kapoor-vBKuAMpKZA4-unsplash4.png",
    img2: "https://cdn.prod.website-files.com/6595cfe22fcb759035f7ff6c/69441ccd50e47cc53061bcb4_francois-olwage-X_RxDiKDSuU-unsplash.jpg",
    img3: "https://cdn.prod.website-files.com/6595cfe22fcb759035f7ff6c/69441cea605222f3c98c8320_surface-aqdPtCtq3dY-unsplash.jpg",
    img4: "https://cdn.prod.website-files.com/6595cfe22fcb759035f7ff6c/69441ceb06e3937b6c080a81_surface-u0AWrCvfwl0-unsplash.jpg"
  };

  var outputCanvas = document.getElementById("outputCanvas");
  var sourceCanvas = document.getElementById("sourceCanvas");
  var ctx = outputCanvas.getContext("2d");
  var sctx = sourceCanvas.getContext("2d");

  var presetButtons = document.querySelectorAll(".preset-btn");
  var fileInput = document.getElementById("fileInput");
  var overlayPreset = document.getElementById("overlayPreset");
  var downloadBtn = document.getElementById("downloadBtn");
  var statusEl = document.getElementById("status");

  var maxWidthEl = document.getElementById("maxWidth");
  var ditherEl = document.getElementById("ditherStrength");
  var brightnessEl = document.getElementById("brightness");
  var contrastEl = document.getElementById("contrast");

  var maxWidthLabel = document.getElementById("maxWidthLabel");
  var ditherLabel = document.getElementById("ditherLabel");
  var brightnessLabel = document.getElementById("brightnessLabel");
  var contrastLabel = document.getElementById("contrastLabel");

  var dlWidthInput = document.getElementById("dlWidth");
  var dlHeightInput = document.getElementById("dlHeight");
  var dlHint = document.getElementById("dlHint");

  var PAPER = "#F0EEE0";
  var OVERLAYS = { redclay: "#802A02", forest: "#2B3901" };

  var img = null;

  var bayer = [
    0,8,2,10,
    12,4,14,6,
    3,11,1,9,
    15,7,13,5
  ].map(function(v) { return v / 16; });

  function clamp(v) { return Math.max(0, Math.min(1, v)); }
  function lum(r, g, b) { return (0.299*r + 0.587*g + 0.114*b) / 255; }

  function setStatus(msg) { statusEl.textContent = msg; }

  function updateLabels() {
    maxWidthLabel.textContent = maxWidthEl.value + "px";
    ditherLabel.textContent = (+ditherEl.value).toFixed(2);

    var b = +brightnessEl.value;
    var c = +contrastEl.value;
    brightnessLabel.textContent = (b >= 0 ? "+" : "") + b.toFixed(2);
    contrastLabel.textContent = (c >= 0 ? "+" : "") + c.toFixed(2);

    var dw = parseInt(dlWidthInput.value, 10);
    var dh = parseInt(dlHeightInput.value, 10);
    if ((dw && !dh) || (!dw && dh)) {
      dlHint.textContent = "Tip: set both Width and Height for an exact export size (center-cropped).";
    } else if (dw && dh) {
      dlHint.textContent = "Export will be " + dw + " x " + dh + "px (center-cropped to fit).";
    } else {
      dlHint.textContent = "Leave blank to download at the render size. If set, export will center-crop to fit.";
    }
  }

  function loadImage(src, opts) {
    opts = opts || {};
    setStatus("Loading image...");
    var i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = function() {
      img = i;
      render();
      downloadBtn.disabled = false;
      setStatus("Ready.");
    };
    i.onerror = function() {
      setStatus("Could not load that image. Trying without CORS...");
      // Retry without crossOrigin for stubborn CDNs - won't allow canvas export but will show preview
      var retry = new Image();
      retry.onload = function() {
        img = retry;
        render();
        downloadBtn.disabled = false;
        setStatus("Ready (upload your own image for full export support).");
      };
      retry.onerror = function() {
        setStatus("Could not load that image.");
      };
      retry.src = src;
    };
    i.src = src;

    if (opts.markPresetActiveKey) {
      presetButtons.forEach(function(b) { b.classList.remove("active"); });
      var btn = Array.from(presetButtons).find(function(b) { return b.dataset.src === opts.markPresetActiveKey; });
      if (btn) btn.classList.add("active");
    }
  }

  presetButtons.forEach(function(btn) {
    btn.addEventListener("click", function() {
      var key = btn.dataset.src;
      loadImage(IMAGE_PRESETS[key], { markPresetActiveKey: key });
    });
  });

  fileInput.addEventListener("change", function(e) {
    var f = e.target.files[0];
    if (!f) return;
    setStatus("Loading image...");
    var i = new Image();
    i.onload = function() {
      img = i;
      render();
      downloadBtn.disabled = false;
      setStatus("Ready.");
    };
    i.onerror = function() { setStatus("Could not load that image."); };
    i.src = URL.createObjectURL(f);
    presetButtons.forEach(function(b) { b.classList.remove("active"); });
  });

  [maxWidthEl, ditherEl, brightnessEl, contrastEl, overlayPreset].forEach(function(el) {
    el.addEventListener("input", function() { updateLabels(); if (img) render(); });
  });

  [dlWidthInput, dlHeightInput].forEach(function(el) {
    el.addEventListener("input", function() { updateLabels(); });
  });

  function render() {
    if (!img) return;

    var targetW = Math.min(+maxWidthEl.value, img.width);
    var targetH = Math.round(targetW / (img.width / img.height));

    sourceCanvas.width = outputCanvas.width = targetW;
    sourceCanvas.height = outputCanvas.height = targetH;

    sctx.clearRect(0, 0, targetW, targetH);
    try {
      sctx.drawImage(img, 0, 0, targetW, targetH);
      var src = sctx.getImageData(0, 0, targetW, targetH).data;
    } catch (e) {
      setStatus("Canvas tainted by cross-origin image. Upload your own image to use this tool.");
      return;
    }

    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, targetW, targetH);

    var out = ctx.getImageData(0, 0, targetW, targetH);
    var o = out.data;

    var dStr = +ditherEl.value;
    var bVal = +brightnessEl.value;
    var cVal = +contrastEl.value;

    for (var y = 0; y < targetH; y++) {
      for (var x = 0; x < targetW; x++) {
        var p = (y * targetW + x) * 4;

        var v = lum(src[p], src[p+1], src[p+2]);
        v = clamp(v + bVal);
        v = clamp((v - 0.5) * (1 + cVal) + 0.5);
        v = clamp(v + (bayer[(y & 3) * 4 + (x & 3)] - 0.5) * dStr);

        var ink = v < 0.55;
        if (ink) {
          o[p] = o[p+1] = o[p+2] = 0;
          o[p+3] = 255;
        } else {
          o[p+3] = 0;
        }
      }
    }

    ctx.putImageData(out, 0, 0);

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = OVERLAYS[overlayPreset.value];
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.restore();
  }

  function drawCover(srcCanvas, destCtx, destW, destH) {
    var sw = srcCanvas.width;
    var sh = srcCanvas.height;

    var scale = Math.max(destW / sw, destH / sh);
    var dw = sw * scale;
    var dh = sh * scale;

    var dx = (destW - dw) / 2;
    var dy = (destH - dh) / 2;

    destCtx.imageSmoothingEnabled = true;
    destCtx.imageSmoothingQuality = "high";
    destCtx.drawImage(srcCanvas, dx, dy, dw, dh);
  }

  downloadBtn.addEventListener("click", function() {
    if (!outputCanvas.width || !outputCanvas.height) return;

    var dw = parseInt(dlWidthInput.value, 10);
    var dh = parseInt(dlHeightInput.value, 10);

    if (!dw || !dh) {
      try {
        var a = document.createElement("a");
        a.download = "risograph.png";
        a.href = outputCanvas.toDataURL("image/png");
        a.click();
      } catch (e) {
        setStatus("Export failed - canvas tainted. Upload your own image to download.");
      }
      return;
    }

    try {
      var exportCanvas = document.createElement("canvas");
      exportCanvas.width = dw;
      exportCanvas.height = dh;

      var ectx = exportCanvas.getContext("2d");
      ectx.fillStyle = PAPER;
      ectx.fillRect(0, 0, dw, dh);

      drawCover(outputCanvas, ectx, dw, dh);

      var a = document.createElement("a");
      a.download = "risograph_" + dw + "x" + dh + ".png";
      a.href = exportCanvas.toDataURL("image/png");
      a.click();
    } catch (e) {
      setStatus("Export failed - canvas tainted. Upload your own image to download.");
    }
  });

  updateLabels();
  loadImage(IMAGE_PRESETS.img1, { markPresetActiveKey: "img1" });
})();
`;

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const slug = 'risograph-print-maker';
    const existing = await BrandTool.findOne({ slug });
    if (existing) {
      console.log('Tool "' + slug + '" already exists. Updating...');
      existing.html_code = htmlCode;
      existing.css_code = cssCode;
      existing.js_code = jsCode;
      existing.title = 'Risograph Print Maker';
      existing.description = 'Create risograph-style dithered prints with brand color overlays. Upload an image or use presets.';
      await existing.save();
      console.log('Tool updated successfully!');
    } else {
      const maxOrder = await BrandTool.findOne().sort({ order_index: -1 }).select('order_index');
      const tool = await BrandTool.create({
        title: 'Risograph Print Maker',
        description: 'Create risograph-style dithered prints with brand color overlays. Upload an image or use presets.',
        slug,
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
