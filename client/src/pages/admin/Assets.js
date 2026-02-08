import React, { useState, useEffect, useCallback } from 'react';
import api, { uploadFile } from '../../utils/api';
import Modal from '../../components/Modal';

const Assets = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState('logos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);

  const sections = [
    { key: 'logos', label: 'Logos' },
    { key: 'typography', label: 'Typography' },
    { key: 'imagery', label: 'Imagery' },
    { key: 'other', label: 'Other' }
  ];

  const categories = {
    logos: [
      { value: 'logo-primary', label: 'Primary Logo' },
      { value: 'logo-secondary', label: 'Secondary Logo' },
      { value: 'logomark', label: 'Logomark' }
    ],
    typography: [
      { value: 'typography-hierarchy', label: 'Type Hierarchy' },
      { value: 'font-primary', label: 'Primary Font' },
      { value: 'font-secondary', label: 'Secondary Font' },
      { value: 'font-tertiary', label: 'Tertiary Font' }
    ],
    imagery: [
      { value: 'imagery', label: 'Imagery' },
      { value: 'icons', label: 'Icons' },
      { value: 'patterns', label: 'Patterns' }
    ],
    other: [
      { value: 'other', label: 'Other' }
    ]
  };

  const fetchAssets = useCallback(async () => {
    try {
      const response = await api.get(`/assets?section=${selectedSection}`);
      setAssets(response.data.data || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedSection]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleDownload = async (assetId, fileIndex, fileType) => {
    try {
      // The server now streams the file directly, so we just need to navigate to the endpoint
      const downloadUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/assets/${assetId}/download/${fileIndex}`;

      // Create a hidden link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = ''; // Let browser determine filename from response headers
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file');
    }
  };

  const handleDelete = async (assetId) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;

    try {
      await api.delete(`/assets/${assetId}`);
      fetchAssets();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete asset');
    }
  };

  const openEditModal = (asset) => {
    setEditingAsset(asset);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingAsset(null);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Brand Assets</h1>
        <button onClick={openCreateModal} className="btn btn-primary">
          Add Asset
        </button>
      </div>

      {/* Section Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
        {sections.map((section) => (
          <button
            key={section.key}
            onClick={() => setSelectedSection(section.key)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedSection === section.key
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Assets Grid */}
      {assets.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {assets.map((asset) => (
            <div key={asset._id} className="bg-white border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
              {/* Preview */}
              <div className="aspect-square bg-gray-50 flex items-center justify-center p-6 border-b border-gray-200">
                {asset.preview_url ? (
                  <img
                    src={asset.preview_url}
                    alt={asset.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <svg className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>

              {/* Info */}
              <div className="p-5">
                <h3 className="font-semibold text-base mb-1 text-gray-900">{asset.title}</h3>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-4">{asset.category.replace(/-/g, ' ')}</p>

                {/* File types with download */}
                {asset.files && asset.files.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-600 mb-2">Available Formats</p>
                    <div className="flex flex-wrap gap-1.5">
                      {asset.files.map((file, i) => (
                        <button
                          key={i}
                          onClick={() => handleDownload(asset._id, i, file.file_type)}
                          className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 hover:bg-gray-900 hover:text-white transition-colors duration-200 font-medium uppercase tracking-wide"
                          title={`Download ${file.file_type}`}
                        >
                          {file.file_type}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => openEditModal(asset)}
                    className="flex-1 px-3 py-1.5 text-xs border border-gray-300 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(asset._id)}
                    className="px-3 py-1.5 text-xs text-red-600 border border-red-200 hover:bg-red-50 transition-colors font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No assets</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding a new asset.</p>
          <button onClick={openCreateModal} className="mt-4 btn btn-primary">
            Add Asset
          </button>
        </div>
      )}

      {/* Asset Modal */}
      <AssetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAsset(null);
        }}
        asset={editingAsset}
        section={selectedSection}
        categories={categories[selectedSection]}
        onSave={fetchAssets}
      />
    </div>
  );
};

// Asset Create/Edit Modal
const AssetModal = ({ isOpen, onClose, asset, section, categories, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: categories[0]?.value || '',
    tags: ''
  });
  const [files, setFiles] = useState([]);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (asset) {
      setFormData({
        title: asset.title || '',
        description: asset.description || '',
        category: asset.category || categories[0]?.value || '',
        tags: asset.tags?.join(', ') || ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: categories[0]?.value || '',
        tags: ''
      });
    }
    setFiles([]);
    setPreview(null);
    setError('');
  }, [asset, isOpen, categories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUploading(true);

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('section', section);
      data.append('tags', formData.tags);

      files.forEach(file => data.append('files', file));
      if (preview) data.append('preview', preview);

      if (asset) {
        await uploadFile(`/assets/${asset._id}`, data);
      } else {
        await uploadFile('/assets', data);
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save asset');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={asset ? 'Edit Asset' : 'Add New Asset'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="input"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="input"
            required
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            className="input"
            placeholder="e.g., primary, dark, horizontal"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Asset Files (PNG, SVG, JPG, EPS, PDF, OTF, TTF, WOFF)
          </label>
          <input
            type="file"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files))}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
            accept=".png,.jpg,.jpeg,.svg,.eps,.pdf,.otf,.ttf,.woff,.gif,.mp4,.webm"
          />
          {files.length > 0 && (
            <p className="mt-1 text-sm text-gray-500">{files.length} file(s) selected</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Preview Image</label>
          <input
            type="file"
            onChange={(e) => setPreview(e.target.files[0])}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
            accept="image/*,video/*"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={uploading} className="btn btn-primary">
            {uploading ? 'Saving...' : asset ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default Assets;
