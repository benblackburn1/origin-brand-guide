const express = require('express');
const router = express.Router();
const BrandTool = require('../models/BrandTool');

// @route   GET /tools/:slug
// @desc    Serve tool as isolated HTML page
// @access  Public
router.get('/:slug', async (req, res) => {
  try {
    const tool = await BrandTool.findOne({
      slug: req.params.slug,
      is_active: true
    });

    if (!tool) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Tool Not Found</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: #f5f5f5;
            }
            .message {
              text-align: center;
              padding: 2rem;
            }
            h1 { color: #333; }
            a { color: #0066cc; }
          </style>
        </head>
        <body>
          <div class="message">
            <h1>Tool Not Found</h1>
            <p>The requested tool does not exist or is not available.</p>
            <a href="/">Return to Brand Hub</a>
          </div>
        </body>
        </html>
      `);
    }

    // Generate isolated HTML page with the tool's code
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(tool.title)} - Brand Tool</title>
  <style>
    /* Reset and base styles */
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.5;
      color: #333;
      background: #fff;
    }

    /* Tool header */
    .tool-header {
      background: #1a1a2e;
      color: white;
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .tool-header h1 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 500;
    }
    .tool-header a {
      color: rgba(255,255,255,0.8);
      text-decoration: none;
      font-size: 0.875rem;
    }
    .tool-header a:hover {
      color: white;
    }

    /* Tool container */
    .tool-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Custom CSS from admin */
    ${tool.css_code}
  </style>
</head>
<body>
  <div class="tool-header">
    <h1>${escapeHtml(tool.title)}</h1>
    <a href="/">← Back to Brand Hub</a>
  </div>

  <div class="tool-container">
    ${tool.html_code}
  </div>

  <script>
    // Wrap in IIFE for isolation
    (function() {
      'use strict';

      // Custom JavaScript from admin
      ${tool.js_code}
    })();
  </script>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Serve tool page error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Error</title></head>
      <body>
        <h1>Error loading tool</h1>
        <p>An error occurred while loading this tool.</p>
        <a href="/">Return to Brand Hub</a>
      </body>
      </html>
    `);
  }
});

// Helper function to escape HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

module.exports = router;
