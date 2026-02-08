const puppeteer = require('puppeteer');
const { getBrandColors, getPrimaryLogoUrl } = require('./brandContext');
const { uploadToGCS, isGCSConfigured } = require('../config/storage');

/**
 * Generates a branded PDF document from structured content.
 * Returns a download URL (GCS) or base64 data.
 */
async function generatePDF(documentType, content) {
  const brandColors = await getBrandColors();
  const logoUrl = await getPrimaryLogoUrl();

  const html = buildHTML(documentType, content, brandColors, logoUrl);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 15000 });

    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });

    // Upload to GCS if configured
    if (isGCSConfigured()) {
      const fileName = `documents/${documentType}-${Date.now()}.pdf`;
      const uploaded = await uploadToGCS({
        buffer: pdfBuffer,
        originalname: fileName,
        mimetype: 'application/pdf',
        size: pdfBuffer.length
      }, 'documents');

      return {
        success: true,
        url: uploaded.publicUrl,
        fileName: uploaded.fileName,
        type: documentType,
        title: content.title
      };
    }

    // Fallback: return base64
    return {
      success: true,
      base64: pdfBuffer.toString('base64'),
      type: documentType,
      title: content.title
    };
  } finally {
    await browser.close();
  }
}

function buildHTML(type, content, colors, logoUrl) {
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; color: ${colors.text}; }
    .page { width: 8.5in; min-height: 11in; position: relative; overflow: hidden; }
  `;

  switch (type) {
    case 'flyer':
      return buildFlyer(content, colors, logoUrl, styles);
    case 'one-pager':
      return buildOnePager(content, colors, logoUrl, styles);
    case 'brochure':
      return buildBrochure(content, colors, logoUrl, styles);
    default:
      return buildOnePager(content, colors, logoUrl, styles);
  }
}

function buildFlyer(content, colors, logoUrl, styles) {
  const sectionsHTML = (content.sections || []).map(s => `
    <div style="margin-bottom: 24px;">
      <h3 style="font-size: 16px; font-weight: 700; color: ${colors.primary}; margin-bottom: 8px;">${s.heading}</h3>
      <p style="font-size: 13px; line-height: 1.6; color: ${colors.text};">${s.body}</p>
    </div>
  `).join('');

  return `<!DOCTYPE html><html><head><style>${styles}</style></head><body>
    <div class="page" style="padding: 0;">
      <!-- Header band -->
      <div style="background: ${colors.primary}; padding: 48px 56px 40px;">
        ${logoUrl ? `<img src="${logoUrl}" style="height: 32px; margin-bottom: 24px; filter: brightness(100);" />` : ''}
        <h1 style="font-size: 36px; font-weight: 900; color: ${colors.background}; line-height: 1.1; margin-bottom: 12px;">
          ${content.title}
        </h1>
        ${content.subtitle ? `<p style="font-size: 16px; color: ${colors.accent};">${content.subtitle}</p>` : ''}
      </div>

      <!-- Body -->
      <div style="padding: 40px 56px;">
        ${sectionsHTML}

        ${content.cta ? `
          <div style="margin-top: 32px; padding: 20px 24px; background: ${colors.primary}; display: inline-block;">
            <span style="font-size: 14px; font-weight: 700; color: ${colors.background}; text-transform: uppercase; letter-spacing: 2px;">
              ${content.cta}
            </span>
          </div>
        ` : ''}
      </div>

      <!-- Footer -->
      <div style="position: absolute; bottom: 0; left: 0; right: 0; background: ${colors.background}; padding: 24px 56px; border-top: 2px solid ${colors.accent};">
        ${content.contact_info ? `<p style="font-size: 11px; color: ${colors.text}; opacity: 0.7;">${content.contact_info}</p>` : ''}
      </div>
    </div>
  </body></html>`;
}

function buildOnePager(content, colors, logoUrl, styles) {
  const sectionsHTML = (content.sections || []).map((s, i) => `
    <div style="margin-bottom: 28px; ${i > 0 ? `padding-top: 28px; border-top: 1px solid ${colors.accent};` : ''}">
      <h3 style="font-size: 14px; font-weight: 700; color: ${colors.primary}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
        ${s.heading}
      </h3>
      <p style="font-size: 12px; line-height: 1.7; color: ${colors.text};">${s.body}</p>
    </div>
  `).join('');

  return `<!DOCTYPE html><html><head><style>${styles}</style></head><body>
    <div class="page" style="padding: 56px;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 3px solid ${colors.primary};">
        <div>
          <h1 style="font-size: 28px; font-weight: 900; color: ${colors.text}; margin-bottom: 6px;">${content.title}</h1>
          ${content.subtitle ? `<p style="font-size: 14px; color: ${colors.primary};">${content.subtitle}</p>` : ''}
        </div>
        ${logoUrl ? `<img src="${logoUrl}" style="height: 36px;" />` : ''}
      </div>

      <!-- Sections -->
      ${sectionsHTML}

      ${content.cta ? `
        <div style="margin-top: 20px; padding: 16px 24px; background: ${colors.primary}; text-align: center;">
          <span style="font-size: 13px; font-weight: 700; color: ${colors.background}; text-transform: uppercase; letter-spacing: 2px;">
            ${content.cta}
          </span>
        </div>
      ` : ''}

      <!-- Footer -->
      ${content.contact_info ? `
        <div style="position: absolute; bottom: 40px; left: 56px; right: 56px;">
          <p style="font-size: 10px; color: ${colors.text}; opacity: 0.5; text-align: center;">${content.contact_info}</p>
        </div>
      ` : ''}
    </div>
  </body></html>`;
}

function buildBrochure(content, colors, logoUrl, styles) {
  const sections = content.sections || [];
  const leftSections = sections.slice(0, Math.ceil(sections.length / 2));
  const rightSections = sections.slice(Math.ceil(sections.length / 2));

  const renderSections = (secs) => secs.map(s => `
    <div style="margin-bottom: 24px;">
      <h3 style="font-size: 13px; font-weight: 700; color: ${colors.primary}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
        ${s.heading}
      </h3>
      <p style="font-size: 11px; line-height: 1.65; color: ${colors.text};">${s.body}</p>
    </div>
  `).join('');

  return `<!DOCTYPE html><html><head><style>${styles}</style></head><body>
    <div class="page" style="padding: 0;">
      <!-- Title bar -->
      <div style="background: ${colors.primary}; padding: 36px 48px;">
        ${logoUrl ? `<img src="${logoUrl}" style="height: 28px; margin-bottom: 16px; filter: brightness(100);" />` : ''}
        <h1 style="font-size: 30px; font-weight: 900; color: ${colors.background}; margin-bottom: 8px;">${content.title}</h1>
        ${content.subtitle ? `<p style="font-size: 14px; color: ${colors.accent};">${content.subtitle}</p>` : ''}
      </div>

      <!-- Two-column body -->
      <div style="display: flex; padding: 36px 48px; gap: 36px;">
        <div style="flex: 1;">${renderSections(leftSections)}</div>
        <div style="flex: 1;">${renderSections(rightSections)}</div>
      </div>

      ${content.cta ? `
        <div style="margin: 0 48px; padding: 20px; background: ${colors.secondary}; text-align: center;">
          <span style="font-size: 13px; font-weight: 700; color: ${colors.background}; text-transform: uppercase; letter-spacing: 2px;">
            ${content.cta}
          </span>
        </div>
      ` : ''}

      <!-- Footer -->
      <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 20px 48px; background: ${colors.background};">
        ${content.contact_info ? `<p style="font-size: 10px; color: ${colors.text}; opacity: 0.5; text-align: center;">${content.contact_info}</p>` : ''}
      </div>
    </div>
  </body></html>`;
}

module.exports = { generatePDF };
