const multer = require('multer');
const path = require('path');

// Allowed file types
const ALLOWED_MIMETYPES = {
  // Images
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
  'image/jpg': 'JPG',
  'image/svg+xml': 'SVG',
  'image/gif': 'GIF',
  'image/webp': 'WEBP',
  // Documents
  'application/pdf': 'PDF',
  'application/postscript': 'EPS',
  'application/eps': 'EPS',
  'application/x-eps': 'EPS',
  'image/eps': 'EPS',
  'image/x-eps': 'EPS',
  'application/illustrator': 'EPS',
  // Fonts
  'font/otf': 'OTF',
  'font/ttf': 'TTF',
  'font/woff': 'WOFF',
  'font/woff2': 'WOFF2',
  'application/x-font-otf': 'OTF',
  'application/x-font-ttf': 'TTF',
  'application/font-woff': 'WOFF',
  'application/font-woff2': 'WOFF2',
  'application/vnd.ms-opentype': 'OTF',
  // Videos
  'video/mp4': 'MP4',
  'video/webm': 'WEBM',
  // Presentations
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'application/vnd.apple.keynote': 'KEY'
};

// File extensions mapping
const ALLOWED_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp',
  '.pdf', '.eps', '.ai',
  '.otf', '.ttf', '.woff', '.woff2',
  '.mp4', '.webm',
  '.pptx', '.key'
];

// Multer configuration for memory storage (for GCS upload)
const memoryStorage = multer.memoryStorage();

// Multer configuration for disk storage (fallback)
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const fileName = file.originalname.toLowerCase();
  const ext = path.extname(fileName);

  // Filter out system/hidden files
  if (fileName.startsWith('.') ||
      fileName.startsWith('__') ||
      fileName === 'thumbs.db' ||
      fileName === 'desktop.ini' ||
      fileName.includes('.ds_store')) {
    console.log(`Skipping system file: ${file.originalname}`);
    return cb(null, false); // Silently skip without error
  }

  // Check extension
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error(`File type ${ext} is not allowed`), false);
  }

  // Check mimetype (allow application/octet-stream for some font types)
  const mimetype = file.mimetype;

  // If extension is allowed, be lenient with mimetype
  // Some systems report different mimetypes for the same file type (especially EPS, AI, fonts)
  if (ALLOWED_MIMETYPES[mimetype] ||
      mimetype === 'application/octet-stream' ||
      mimetype === 'application/octetstream' ||
      mimetype === '') {
    cb(null, true);
  } else {
    // If mimetype is not recognized but extension is valid, allow it
    console.warn(`Warning: Unknown mimetype ${mimetype} for file ${file.originalname}, but extension ${ext} is allowed`);
    cb(null, true);
  }
};

// Create multer upload instances
const uploadToMemory = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
    files: 10 // Max 10 files at once
  }
});

const uploadToDisk = multer({
  storage: diskStorage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024,
    files: 10
  }
});

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 100MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 10 files.'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

// Get file type from extension or mimetype
const getFileType = (file) => {
  const ext = path.extname(file.originalname).toLowerCase().slice(1).toUpperCase();
  return ALLOWED_MIMETYPES[file.mimetype] || ext;
};

module.exports = {
  uploadToMemory,
  uploadToDisk,
  handleUploadError,
  getFileType,
  ALLOWED_MIMETYPES,
  ALLOWED_EXTENSIONS
};
