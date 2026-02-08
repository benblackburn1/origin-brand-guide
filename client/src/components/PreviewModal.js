import React, { useState, useEffect } from 'react';

const PreviewModal = ({ isOpen, onClose, asset, onDownload }) => {
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    const handleArrows = (e) => {
      if (e.key === 'ArrowLeft') {
        setCurrentPage(p => Math.max(0, p - 1));
      } else if (e.key === 'ArrowRight' && asset?.page_count > 1) {
        setCurrentPage(p => Math.min(asset.page_count - 1, p + 1));
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleArrows);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleArrows);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, asset]);

  useEffect(() => {
    setCurrentPage(0);
  }, [asset]);

  if (!isOpen || !asset) return null;

  const previewType = asset.preview_type || 'image';
  const isVideo = previewType === 'video' || asset.preview_url?.match(/\.(mp4|webm)$/i);
  const isGif = previewType === 'gif' || asset.preview_url?.match(/\.gif$/i);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-90"
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative w-full max-w-5xl max-h-[90vh] mx-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
        >
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Preview content */}
        <div className="bg-white rounded-lg overflow-hidden">
          {/* Preview area */}
          <div className="relative flex items-center justify-center bg-gray-100 min-h-[400px] max-h-[70vh]">
            {isVideo ? (
              <video
                src={asset.preview_url}
                controls
                autoPlay
                loop
                className="max-w-full max-h-[70vh] object-contain"
              />
            ) : (
              <img
                src={asset.preview_url || '/placeholder-image.png'}
                alt={asset.title}
                className="max-w-full max-h-[70vh] object-contain"
              />
            )}

            {/* Page navigation for multi-page documents */}
            {asset.page_count > 1 && (
              <>
                <button
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="absolute left-4 p-2 bg-black bg-opacity-50 text-white rounded-full disabled:opacity-30"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(asset.page_count - 1, p + 1))}
                  disabled={currentPage === asset.page_count - 1}
                  className="absolute right-4 p-2 bg-black bg-opacity-50 text-white rounded-full disabled:opacity-30"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  Page {currentPage + 1} of {asset.page_count}
                </div>
              </>
            )}
          </div>

          {/* Info and download section */}
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-2">{asset.title}</h3>
            {asset.description && (
              <p className="text-gray-600 mb-4">{asset.description}</p>
            )}

            {/* Download buttons */}
            {asset.files && asset.files.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-500 mr-2 self-center">Download:</span>
                {asset.files.map((file, index) => (
                  <button
                    key={index}
                    onClick={() => onDownload(asset._id, index, file.file_type)}
                    className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
                  >
                    {file.file_type}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
