const sharp = require('sharp');
const path = require('path');

// Generate preview image from uploaded file
const generatePreview = async (buffer, options = {}) => {
  const {
    width = 800,
    height = 600,
    fit = 'inside',
    format = 'png',
    quality = 80,
    paddingLeft = 0,
    paddingRight = 0,
    paddingTop = 0,
    paddingBottom = 0
  } = options;

  try {
    // If padding is specified, use extend to add padding
    let pipeline = sharp(buffer);

    if (paddingLeft || paddingRight || paddingTop || paddingBottom) {
      // First resize the image
      pipeline = pipeline.resize(width, height, {
        fit,
        withoutEnlargement: true,
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      });

      // Then add padding
      pipeline = pipeline.extend({
        top: paddingTop,
        bottom: paddingBottom,
        left: paddingLeft,
        right: paddingRight,
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      });
    } else {
      // Just resize without padding
      pipeline = pipeline.resize(width, height, {
        fit,
        withoutEnlargement: true
      });
    }

    // Convert to specified format
    if (format === 'jpeg' || format === 'jpg') {
      pipeline = pipeline.jpeg({ quality });
    } else if (format === 'webp') {
      pipeline = pipeline.webp({ quality });
    } else {
      pipeline = pipeline.png({ compressionLevel: 9 });
    }

    return await pipeline.toBuffer();
  } catch (error) {
    console.error('Error generating preview:', error);
    throw error;
  }
};

// Generate thumbnail
const generateThumbnail = async (buffer, size = 200) => {
  try {
    return await sharp(buffer)
      .resize(size, size, {
        fit: 'cover',
        position: 'centre'
      })
      .png({ compressionLevel: 9 })
      .toBuffer();
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw error;
  }
};

// Check if file is an image that can be processed
const isProcessableImage = (mimetype) => {
  const processableTypes = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/gif'
  ];
  return processableTypes.includes(mimetype);
};

// Get image metadata
const getImageMetadata = async (buffer) => {
  try {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      hasAlpha: metadata.hasAlpha,
      pages: metadata.pages // For multi-page formats
    };
  } catch (error) {
    console.error('Error getting image metadata:', error);
    return null;
  }
};

module.exports = {
  generatePreview,
  generateThumbnail,
  isProcessableImage,
  getImageMetadata
};
