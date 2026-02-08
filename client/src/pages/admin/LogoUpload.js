import React, { useState } from 'react';
import api from '../../utils/api';

export default function LogoUpload() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [logoTitle, setLogoTitle] = useState('');
  const [logoCategory, setLogoCategory] = useState('logo-primary');
  const [description, setDescription] = useState('');

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    // Filter out system/hidden files
    const validFiles = selectedFiles.filter(file => {
      const fileName = file.name.toLowerCase();
      // Exclude macOS system files, Windows system files, and other hidden files
      return !fileName.startsWith('.') &&
             !fileName.startsWith('__') &&
             fileName !== 'thumbs.db' &&
             fileName !== 'desktop.ini';
    });

    if (validFiles.length === 0 && selectedFiles.length > 0) {
      setError('No valid files found. System files were filtered out.');
      setFiles([]);
      return;
    }

    setFiles(validFiles);
    setError(null);
    setResult(null);

    // Auto-suggest title based on first filename (remove extension and underscores)
    if (validFiles.length > 0 && !logoTitle) {
      const firstFile = validFiles[0].name;
      const baseName = firstFile.split('.')[0]
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .trim();
      setLogoTitle(baseName);
    }
  };

  const handleFolderSelect = (e) => {
    // When user selects a folder using webkitdirectory
    handleFileChange(e);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select logo files to upload');
      return;
    }

    if (!logoTitle.trim()) {
      setError('Please enter a logo title');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);
    setProgress(0);

    try {
      const formData = new FormData();

      files.forEach(file => {
        formData.append('logoFiles', file);
      });

      formData.append('title', logoTitle.trim());
      formData.append('category', logoCategory);
      if (description.trim()) {
        formData.append('description', description.trim());
      }

      const response = await api.post('/assets/bulk-logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        },
      });

      if (response.data.success) {
        setResult(response.data);
        setFiles([]);
        setLogoTitle('');
        setDescription('');
        // Reset file input
        document.getElementById('file-upload').value = '';
        document.getElementById('folder-upload').value = '';
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload logo files');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileExtension = (filename) => {
    return filename.split('.').pop().toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Bulk Logo Upload</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="max-w-3xl">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Upload Logo Files
          </h2>

          <p className="text-gray-600 mb-6">
            Upload all variations of a logo at once (PNG, SVG, EPS, PDF, JPG, etc.). Users will be able to download their preferred file format.
          </p>

          {/* Logo Title */}
          <div className="mb-6">
            <label htmlFor="logo-title" className="block text-sm font-medium text-gray-700 mb-2">
              Logo Title *
            </label>
            <input
              type="text"
              id="logo-title"
              value={logoTitle}
              onChange={(e) => setLogoTitle(e.target.value)}
              placeholder="e.g., CARAVAN Green"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={uploading}
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be the display name for the logo
            </p>
          </div>

          {/* Logo Category */}
          <div className="mb-6">
            <label htmlFor="logo-category" className="block text-sm font-medium text-gray-700 mb-2">
              Logo Category
            </label>
            <select
              id="logo-category"
              value={logoCategory}
              onChange={(e) => setLogoCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={uploading}
            >
              <option value="logo-primary">Primary Logo</option>
              <option value="logo-secondary">Secondary Logo</option>
              <option value="logomark">Logomark</option>
            </select>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for this logo variant..."
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={uploading}
            />
          </div>

          {/* File Upload Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Individual Files */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
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
              <label
                htmlFor="file-upload"
                className="cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
              >
                <span className="text-sm">Select Individual Files</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  accept=".png,.jpg,.jpeg,.svg,.eps,.pdf,.gif"
                  multiple
                  className="sr-only"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">
                Choose multiple files at once
              </p>
            </div>

            {/* Folder Upload */}
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center bg-blue-50">
              <svg
                className="mx-auto h-12 w-12 text-blue-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
              <label
                htmlFor="folder-upload"
                className="cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 px-3 py-2 inline-block"
              >
                <span className="text-sm">Select Entire Folder</span>
                <input
                  id="folder-upload"
                  name="folder-upload"
                  type="file"
                  webkitdirectory="true"
                  directory="true"
                  multiple
                  className="sr-only"
                  onChange={handleFolderSelect}
                  disabled={uploading}
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">
                Recommended: Upload all logo files at once
              </p>
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Selected Files ({files.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white px-3 py-2 rounded border border-gray-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {getFileExtension(file.name)}
                      </span>
                      <span className="text-sm text-gray-700 truncate max-w-xs">
                        {file.name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {uploading && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Uploading logo files...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
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

          {/* Success Message */}
          {result && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
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
                    Logo uploaded successfully!
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    {result.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="mt-6">
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || !logoTitle.trim() || uploading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                files.length === 0 || !logoTitle.trim() || uploading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {uploading ? 'Uploading...' : 'Upload Logo Files'}
            </button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">How it works</h3>
        <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
          <li>Choose a folder containing all logo file variations (or select individual files)</li>
          <li>Enter a descriptive title for this logo variant</li>
          <li>All files will be uploaded and grouped together</li>
          <li>Users can download their preferred file format from the Assets page</li>
        </ol>
        <p className="text-xs text-blue-600 mt-3">
          💡 Supported formats: PNG, JPG, SVG, EPS, PDF, GIF
        </p>
      </div>
    </div>
  );
}
