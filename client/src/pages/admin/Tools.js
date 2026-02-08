import React, { useState, useEffect } from 'react';
import api, { uploadFile } from '../../utils/api';
import Modal from '../../components/Modal';

const AdminTools = () => {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState(null);

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    try {
      const response = await api.get('/tools');
      setTools(response.data.data || []);
    } catch (error) {
      console.error('Error fetching tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tool?')) return;

    try {
      await api.delete(`/tools/${id}`);
      fetchTools();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleToggleActive = async (tool) => {
    try {
      const formData = new FormData();
      formData.append('is_active', !tool.is_active);
      await uploadFile(`/tools/${tool._id}`, formData);
      fetchTools();
    } catch (error) {
      console.error('Toggle failed:', error);
    }
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
        <h1 className="text-2xl font-bold">Brand Tools</h1>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          Create Tool
        </button>
      </div>

      {tools.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tools.map((tool) => (
            <div key={tool._id} className="bg-white border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="aspect-video bg-gradient-to-br from-brand-500 to-brand-700 relative">
                {tool.preview_url ? (
                  <img src={tool.preview_url} alt={tool.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="h-16 w-16 text-white opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                )}
                {!tool.is_active && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">Inactive</span>
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-semibold mb-1">{tool.title}</h3>
                <p className="text-sm text-gray-500 mb-2">/tools/{tool.slug}</p>
                {tool.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{tool.description}</p>
                )}

                <div className="flex gap-2">
                  <a
                    href={`/tools/${tool.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-3 py-2 text-sm text-center border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Preview
                  </a>
                  <button
                    onClick={() => {
                      setEditingTool(tool);
                      setIsModalOpen(true);
                    }}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleActive(tool)}
                    className={`px-3 py-2 text-sm rounded-lg ${
                      tool.is_active
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {tool.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleDelete(tool._id)}
                    className="px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tools created</h3>
          <p className="mt-1 text-sm text-gray-500">Create interactive brand tools with custom code.</p>
        </div>
      )}

      <ToolModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTool(null);
        }}
        tool={editingTool}
        onSave={fetchTools}
      />
    </div>
  );
};

const ToolModal = ({ isOpen, onClose, tool, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    slug: '',
    html_code: '',
    css_code: '',
    js_code: ''
  });
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('html');

  // Default example tool code
  const exampleHtml = `<div class="image-overlay-tool">
  <div class="preview-area">
    <div class="preview-container">
      <img id="previewImage" src="" alt="Preview" style="display:none;">
      <div id="overlayText" class="overlay-text">Your Text Here</div>
      <div class="placeholder" id="placeholder">
        <p>Upload an image to get started</p>
      </div>
    </div>
  </div>

  <div class="controls">
    <div class="control-group">
      <label>Upload Image</label>
      <input type="file" id="imageInput" accept="image/*">
    </div>

    <div class="control-group">
      <label>Overlay Text</label>
      <input type="text" id="textInput" value="Your Text Here" placeholder="Enter text">
    </div>

    <div class="control-group">
      <label>Text Color</label>
      <input type="color" id="colorInput" value="#ffffff">
    </div>

    <div class="control-group">
      <label>Font Size</label>
      <input type="range" id="sizeInput" min="12" max="72" value="32">
      <span id="sizeValue">32px</span>
    </div>

    <button id="downloadBtn" class="download-btn" disabled>Download Image</button>
  </div>
</div>`;

  const exampleCss = `.image-overlay-tool {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.preview-area {
  background: #f3f4f6;
  border-radius: 12px;
  padding: 1rem;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-container {
  position: relative;
  display: inline-block;
  max-width: 100%;
}

.preview-container img {
  max-width: 100%;
  display: block;
  border-radius: 8px;
}

.overlay-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  white-space: nowrap;
  pointer-events: none;
}

.placeholder {
  text-align: center;
  color: #9ca3af;
  padding: 4rem;
}

.controls {
  background: #f9fafb;
  border-radius: 12px;
  padding: 1.5rem;
}

.control-group {
  margin-bottom: 1.25rem;
}

.control-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.control-group input[type="text"],
.control-group input[type="file"] {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

.control-group input[type="range"] {
  width: calc(100% - 50px);
}

.control-group input[type="color"] {
  width: 100%;
  height: 40px;
  border: none;
  cursor: pointer;
}

#sizeValue {
  display: inline-block;
  width: 45px;
  text-align: right;
  font-size: 0.875rem;
  color: #6b7280;
}

.download-btn {
  width: 100%;
  padding: 0.75rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.download-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.download-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .image-overlay-tool {
    grid-template-columns: 1fr;
  }
}`;

  const exampleJs = `const imageInput = document.getElementById('imageInput');
const previewImage = document.getElementById('previewImage');
const overlayText = document.getElementById('overlayText');
const placeholder = document.getElementById('placeholder');
const textInput = document.getElementById('textInput');
const colorInput = document.getElementById('colorInput');
const sizeInput = document.getElementById('sizeInput');
const sizeValue = document.getElementById('sizeValue');
const downloadBtn = document.getElementById('downloadBtn');

// Handle image upload
imageInput.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      previewImage.src = event.target.result;
      previewImage.style.display = 'block';
      placeholder.style.display = 'none';
      downloadBtn.disabled = false;
    };
    reader.readAsDataURL(file);
  }
});

// Handle text input
textInput.addEventListener('input', function(e) {
  overlayText.textContent = e.target.value || 'Your Text Here';
});

// Handle color change
colorInput.addEventListener('input', function(e) {
  overlayText.style.color = e.target.value;
});

// Handle size change
sizeInput.addEventListener('input', function(e) {
  overlayText.style.fontSize = e.target.value + 'px';
  sizeValue.textContent = e.target.value + 'px';
});

// Initial styles
overlayText.style.color = colorInput.value;
overlayText.style.fontSize = sizeInput.value + 'px';

// Download functionality
downloadBtn.addEventListener('click', function() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = previewImage;

  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  // Draw image
  ctx.drawImage(img, 0, 0);

  // Draw text
  const fontSize = parseInt(sizeInput.value) * (img.naturalWidth / img.offsetWidth);
  ctx.font = 'bold ' + fontSize + 'px sans-serif';
  ctx.fillStyle = colorInput.value;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Add shadow
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  ctx.fillText(textInput.value || 'Your Text Here', canvas.width/2, canvas.height/2);

  // Download
  const link = document.createElement('a');
  link.download = 'brand-overlay.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});`;

  useEffect(() => {
    if (tool) {
      // Fetch full tool data with code
      api.get(`/tools/${tool._id}`).then(res => {
        const t = res.data.data;
        setFormData({
          title: t.title || '',
          description: t.description || '',
          slug: t.slug || '',
          html_code: t.html_code || '',
          css_code: t.css_code || '',
          js_code: t.js_code || ''
        });
      });
    } else {
      setFormData({
        title: '',
        description: '',
        slug: '',
        html_code: '',
        css_code: '',
        js_code: ''
      });
    }
    setPreview(null);
    setError('');
    setActiveTab('html');
  }, [tool, isOpen]);

  const loadExample = () => {
    setFormData({
      ...formData,
      title: formData.title || 'Image Overlay Generator',
      description: formData.description || 'Add custom text overlays to your images',
      html_code: exampleHtml,
      css_code: exampleCss,
      js_code: exampleJs
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (preview) data.append('preview', preview);

      if (tool) {
        await uploadFile(`/tools/${tool._id}`, data);
      } else {
        await uploadFile('/tools', data);
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save tool');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={tool ? 'Edit Tool' : 'Create Tool'} size="full">
      <form onSubmit={handleSubmit}>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

        <div className="grid md:grid-cols-2 gap-4 mb-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL path)</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
              className="input"
              placeholder="auto-generated-from-title"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input"
            rows={2}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Preview Image</label>
          <input
            type="file"
            onChange={(e) => setPreview(e.target.files[0])}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700"
            accept="image/*"
          />
        </div>

        {/* Code Editor */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Custom Code</label>
            {!tool && (
              <button
                type="button"
                onClick={loadExample}
                className="text-sm text-brand-600 hover:text-brand-700"
              >
                Load Example (Image Overlay Generator)
              </button>
            )}
          </div>

          <div className="border border-gray-300 rounded-lg overflow-hidden">
            {/* Tabs */}
            <div className="flex bg-gray-100 border-b border-gray-300">
              {['html', 'css', 'js'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === tab
                      ? 'bg-white text-brand-600 border-b-2 border-brand-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Code Area */}
            <textarea
              value={formData[`${activeTab}_code`]}
              onChange={(e) => setFormData({ ...formData, [`${activeTab}_code`]: e.target.value })}
              className="w-full h-64 p-4 font-mono text-sm bg-gray-900 text-gray-100 focus:outline-none resize-y"
              placeholder={`Enter ${activeTab.toUpperCase()} code here...`}
              spellCheck="false"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? 'Saving...' : tool ? 'Update Tool' : 'Create Tool'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AdminTools;
