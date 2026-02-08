import React, { useState } from 'react';
import api from '../../utils/api';

export default function BrandGuidelines() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [uploadMode, setUploadMode] = useState('images'); // 'images' or 'pdf'

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    if (uploadMode === 'images') {
      const validFiles = selectedFiles.filter(file =>
        file.type.startsWith('image/')
      );

      if (validFiles.length !== selectedFiles.length) {
        setError('Some files were not images and were skipped');
      } else {
        setError(null);
      }

      setFiles(validFiles);
      setResult(null);
    } else {
      const pdfFile = selectedFiles[0];
      if (pdfFile && pdfFile.type === 'application/pdf') {
        setFiles([pdfFile]);
        setError(null);
        setResult(null);
      } else {
        setError('Please select a PDF file');
        setFiles([]);
      }
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);
    setProgress(0);

    try {
      const formData = new FormData();

      if (uploadMode === 'images') {
        files.forEach(file => {
          formData.append('images', file);
        });
      } else {
        formData.append('pdf', files[0]);
      }

      const endpoint = uploadMode === 'images'
        ? '/brand-guidelines/upload-images'
        : '/brand-guidelines/upload';

      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        },
      });

      if (response.data.success) {
        setResult(response.data.data);
        setFiles([]);
        // Reset file input
        document.getElementById('file-upload').value = '';
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Failed to process brand guidelines');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Brand Guidelines Upload</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="max-w-3xl">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            AI-Powered Guidelines Extraction
          </h2>

          <p className="text-gray-600 mb-6">
            Upload your brand guidelines and Claude AI will automatically extract and populate:
          </p>

          <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
            <li>Brand colors (HEX, RGB, CMYK, Pantone)</li>
            <li>Typography and fonts</li>
            <li>Brand voice, messaging, and tone</li>
            <li>Brand applications and templates</li>
          </ul>

          {/* Upload Mode Toggle */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Method
            </label>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setUploadMode('images');
                  setFiles([]);
                  setError(null);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  uploadMode === 'images'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Screenshots (Recommended)
              </button>
              <button
                onClick={() => {
                  setUploadMode('pdf');
                  setFiles([]);
                  setError(null);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  uploadMode === 'pdf'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                PDF
              </button>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="space-y-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <span>
                    {uploadMode === 'images'
                      ? 'Upload screenshots'
                      : 'Upload a PDF file'}
                  </span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    accept={uploadMode === 'images' ? 'image/*' : '.pdf'}
                    multiple={uploadMode === 'images'}
                    className="sr-only"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                {uploadMode === 'images'
                  ? 'PNG, JPG, GIF, WebP up to 50MB total (max 20 images)'
                  : 'PDF up to 50MB'}
              </p>
            </div>

            {files.length > 0 && (
              <div className="mt-4 text-sm text-gray-700">
                {uploadMode === 'images' ? (
                  <>
                    <p className="font-medium mb-2">
                      {files.length} image{files.length !== 1 ? 's' : ''} selected:
                    </p>
                    <ul className="text-left max-h-32 overflow-y-auto">
                      {files.map((file, index) => (
                        <li key={index} className="truncate">
                          {index + 1}. {file.name}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p>
                    Selected: <span className="font-medium">{files[0].name}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {uploading && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Processing with Claude AI...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This may take a minute or two depending on the file size...
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-green-800">
                    Brand guidelines processed successfully!
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p className="font-medium">Extracted and saved:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>{result.saved.colors} colors</li>
                      <li>{result.saved.fonts} font families</li>
                      {result.saved.brandVoice && <li>Brand voice and messaging</li>}
                      {result.saved.applications > 0 && (
                        <li>{result.saved.applications} brand applications</li>
                      )}
                    </ul>
                    <p className="mt-3 text-xs">
                      Check the Colors, Guidelines, and Templates sections to see the imported data.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || uploading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                files.length === 0 || uploading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {uploading ? 'Processing...' : 'Process Brand Guidelines'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">How it works</h3>
        <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
          <li>Upload screenshots of your brand guidelines pages (or a PDF)</li>
          <li>Claude AI analyzes the images and extracts brand information</li>
          <li>Colors, fonts, and content are automatically saved to your database</li>
          <li>Review and edit the imported data in their respective sections</li>
        </ol>
        <p className="text-xs text-blue-600 mt-3">
          💡 Tip: Screenshots work better for capturing visual elements like color swatches and typography
        </p>
      </div>
    </div>
  );
}
