const { Storage } = require('@google-cloud/storage');
const path = require('path');

let storage;

// Initialize Google Cloud Storage
const initializeStorage = () => {
  if (storage) return storage;

  const config = {
    projectId: process.env.GCS_PROJECT_ID
  };

  // Use service account key file if provided
  if (process.env.GCS_KEY_FILE) {
    config.keyFilename = path.resolve(process.env.GCS_KEY_FILE);
  } else if (process.env.GCS_CREDENTIALS) {
    // Use credentials JSON directly from environment variable
    try {
      config.credentials = JSON.parse(process.env.GCS_CREDENTIALS);
    } catch (e) {
      console.error('Failed to parse GCS_CREDENTIALS:', e.message);
    }
  }

  storage = new Storage(config);
  return storage;
};

// Get the storage bucket
const getBucket = () => {
  const storageInstance = initializeStorage();
  const bucketName = process.env.GCS_BUCKET_NAME;

  if (!bucketName) {
    throw new Error('GCS_BUCKET_NAME environment variable is not set');
  }

  return storageInstance.bucket(bucketName);
};

// Upload file to GCS
const uploadToGCS = async (file, folder = 'assets') => {
  const bucket = getBucket();
  const timestamp = Date.now();
  const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${folder}/${timestamp}-${sanitizedName}`;

  const blob = bucket.file(fileName);

  const blobStream = blob.createWriteStream({
    resumable: false,
    metadata: {
      contentType: file.mimetype
    }
  });

  return new Promise((resolve, reject) => {
    blobStream.on('error', (err) => {
      reject(err);
    });

    blobStream.on('finish', async () => {
      // With uniform bucket-level access, we don't need to make individual files public
      // The bucket's IAM policy controls access instead
      try {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        resolve({
          fileName,
          publicUrl,
          bucket: bucket.name,
          size: file.size,
          mimetype: file.mimetype
        });
      } catch (err) {
        reject(err);
      }
    });

    blobStream.end(file.buffer);
  });
};

// Generate signed URL for secure downloads
const generateSignedUrl = async (fileName, expirationMinutes = 60) => {
  const bucket = getBucket();
  const file = bucket.file(fileName);

  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + expirationMinutes * 60 * 1000
  });

  return url;
};

// Delete file from GCS
const deleteFromGCS = async (fileName) => {
  const bucket = getBucket();
  await bucket.file(fileName).delete();
};

// Check if GCS is configured
const isGCSConfigured = () => {
  return !!(process.env.GCS_PROJECT_ID && process.env.GCS_BUCKET_NAME);
};

module.exports = {
  initializeStorage,
  getBucket,
  uploadToGCS,
  generateSignedUrl,
  deleteFromGCS,
  isGCSConfigured
};
