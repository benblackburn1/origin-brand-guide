import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [templatesRes, tagsRes] = await Promise.all([
        api.get('/templates'),
        api.get('/templates/tags')
      ]);

      setTemplates(templatesRes.data.data || []);
      setTags(tagsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (template) => {
    try {
      if (template.external_link) {
        window.open(template.external_link, '_blank');
        return;
      }

      const response = await api.get(`/templates/${template._id}/download`);
      const { url } = response.data.data;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const filteredTemplates = templates.filter(template => {
    if (selectedTag && !template.tags.includes(selectedTag)) return false;
    if (selectedType && template.template_type !== selectedType) return false;
    return true;
  });

  const templateTypes = [
    { value: '', label: 'All Types' },
    { value: 'figma', label: 'Figma' },
    { value: 'google-slides', label: 'Google Slides' },
    { value: 'keynote', label: 'Keynote' },
    { value: 'pdf', label: 'PDF' },
    { value: 'powerpoint', label: 'PowerPoint' },
    { value: 'other', label: 'Other' }
  ];

  const getTypeIcon = (type) => {
    const icons = {
      figma: 'F',
      'google-slides': 'G',
      keynote: 'K',
      pdf: 'PDF',
      powerpoint: 'P',
      other: '...'
    };
    return icons[type] || '?';
  };

  const getTypeColor = (type) => {
    const colors = {
      figma: 'bg-purple-500',
      'google-slides': 'bg-yellow-500',
      keynote: 'bg-blue-500',
      pdf: 'bg-red-500',
      powerpoint: 'bg-orange-500',
      other: 'bg-gray-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Brand Templates</h1>

      {/* Filters */}
      <div className="mb-8 flex flex-wrap gap-4">
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        >
          {templateTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        >
          <option value="">All Tags</option>
          {tags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>

        {(selectedTag || selectedType) && (
          <button
            onClick={() => {
              setSelectedTag('');
              setSelectedType('');
            }}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredTemplates.map((template) => (
            <div key={template._id} className="bg-white border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
              {/* Preview */}
              <div
                className="aspect-video bg-gray-100 relative cursor-pointer"
                onClick={() => setPreviewTemplate(template)}
              >
                {template.preview_url ? (
                  template.preview_type === 'video' ? (
                    <video
                      src={template.preview_url}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      onMouseOver={(e) => e.target.play()}
                      onMouseOut={(e) => e.target.pause()}
                    />
                  ) : (
                    <img
                      src={template.preview_url}
                      alt={template.title}
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                )}

                {/* Type Badge */}
                <div className={`absolute top-3 left-3 ${getTypeColor(template.template_type)} text-white text-xs font-bold px-2 py-1 rounded`}>
                  {getTypeIcon(template.template_type)}
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold mb-1">{template.title}</h3>
                {template.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>
                )}

                {/* Tags */}
                {template.tags && template.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {template.tags.map((tag) => (
                      <span
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded cursor-pointer hover:bg-gray-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewTemplate(template)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => handleDownload(template)}
                    className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
                  >
                    {template.external_link ? 'Open' : 'Download'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No templates found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {selectedTag || selectedType
              ? 'Try adjusting your filters.'
              : 'Templates will appear here once added.'}
          </p>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
};

// Template Preview Modal
const TemplatePreviewModal = ({ template, onClose, onDownload }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-90" onClick={onClose} />

      <div className="relative w-full max-w-4xl max-h-[90vh] mx-4">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300"
        >
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="bg-white rounded-lg overflow-hidden">
          {/* Preview */}
          <div className="bg-gray-100 flex items-center justify-center min-h-[400px] max-h-[60vh]">
            {template.preview_url ? (
              template.preview_type === 'video' ? (
                <video
                  src={template.preview_url}
                  controls
                  autoPlay
                  loop
                  className="max-w-full max-h-[60vh]"
                />
              ) : (
                <img
                  src={template.preview_url}
                  alt={template.title}
                  className="max-w-full max-h-[60vh] object-contain"
                />
              )
            ) : (
              <div className="text-center p-8">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-2 text-gray-500">No preview available</p>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-2">{template.title}</h2>
            {template.description && (
              <p className="text-gray-600 mb-4">{template.description}</p>
            )}

            {template.tags && template.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {template.tags.map((tag) => (
                  <span key={tag} className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <button
              onClick={() => onDownload(template)}
              className="w-full sm:w-auto px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
            >
              {template.external_link ? 'Open Template' : 'Download Template'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Templates;
