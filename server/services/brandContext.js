const ColorPalette = require('../models/ColorPalette');
const Content = require('../models/Content');
const BrandAsset = require('../models/BrandAsset');
const BrandTool = require('../models/BrandTool');

/**
 * Assembles brand context from the database for use in Claude's system prompt.
 * Returns a structured text block that Claude can reference when answering
 * brand questions or creating deliverables.
 */
async function assembleBrandContext() {
  const [palettes, contentSections, assets, tools] = await Promise.all([
    ColorPalette.find().sort({ category: 1 }),
    Content.find({ is_active: true }).sort({ order_index: 1 }),
    BrandAsset.find({ is_active: true }).select('title category section files preview_url').sort({ section: 1, order_index: 1 }),
    BrandTool.find({ is_active: true }).select('title slug description').sort({ order_index: 1 })
  ]);

  let context = '# Brand Guidelines Context\n\n';

  // Colors
  context += '## Brand Colors\n';
  if (palettes.length > 0) {
    for (const palette of palettes) {
      context += `\n### ${palette.title || palette.category} Colors\n`;
      if (palette.description) context += `${palette.description}\n`;
      for (const color of palette.colors) {
        let line = `- **${color.name}**: ${color.hex}`;
        if (color.rgb) line += ` | RGB(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`;
        if (color.cmyk) line += ` | CMYK(${color.cmyk.c}, ${color.cmyk.m}, ${color.cmyk.y}, ${color.cmyk.k})`;
        if (color.pantone) line += ` | Pantone: ${color.pantone}`;
        context += line + '\n';
      }
    }
  } else {
    context += '- Red Clay: #802A02\n- Black: #131313\n- Forest Green: #2B3901\n- Off-white: #F0EEE0\n- Desert Mauve: #EEC8B3\n';
  }

  // Content sections (brand voice, messaging, strategy)
  for (const section of contentSections) {
    context += `\n## ${section.title}\n`;
    context += (section.content || 'Not yet defined.') + '\n';
  }

  // Assets summary
  context += '\n## Available Brand Assets\n';
  const grouped = {};
  for (const asset of assets) {
    if (!grouped[asset.section]) grouped[asset.section] = [];
    const fileTypes = asset.files.map(f => f.file_type).join(', ');
    grouped[asset.section].push(`${asset.title} (${fileTypes || 'no files'})`);
  }
  for (const [section, items] of Object.entries(grouped)) {
    context += `\n### ${section.charAt(0).toUpperCase() + section.slice(1)}\n`;
    for (const item of items) {
      context += `- ${item}\n`;
    }
  }

  // Tools
  if (tools.length > 0) {
    context += '\n## Available Brand Tools\n';
    for (const tool of tools) {
      context += `- **${tool.title}** (slug: ${tool.slug}): ${tool.description || 'Interactive brand tool'}\n`;
    }
  }

  return context;
}

/**
 * Returns structured brand data (colors as objects) for use in
 * slide/PDF generation where exact color values are needed.
 */
async function getBrandColors() {
  const palettes = await ColorPalette.find().sort({ category: 1 });

  if (palettes.length === 0) {
    return {
      primary: '#802A02',
      secondary: '#2B3901',
      background: '#F0EEE0',
      text: '#131313',
      accent: '#EEC8B3'
    };
  }

  const allColors = palettes.flatMap(p => p.colors);
  return {
    primary: allColors[0]?.hex || '#802A02',
    secondary: allColors[2]?.hex || '#2B3901',
    background: allColors[3]?.hex || '#F0EEE0',
    text: allColors[1]?.hex || '#131313',
    accent: allColors[4]?.hex || '#EEC8B3',
    all: allColors
  };
}

/**
 * Returns the primary logo URL for use in slides/PDFs.
 */
async function getPrimaryLogoUrl() {
  const logo = await BrandAsset.findOne({
    category: 'logo-primary',
    is_active: true
  }).select('preview_url files');

  if (!logo) return null;

  // Prefer preview URL, fall back to first file URL
  return logo.preview_url || logo.files?.[0]?.file_url || null;
}

module.exports = { assembleBrandContext, getBrandColors, getPrimaryLogoUrl };
