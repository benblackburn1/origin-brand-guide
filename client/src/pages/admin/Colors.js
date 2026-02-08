import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import Modal from '../../components/Modal';

const AdminColors = () => {
  const [palettes, setPalettes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPalette, setEditingPalette] = useState(null);
  const [editingColor, setEditingColor] = useState(null);
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);

  const categories = [
    { key: 'primary', label: 'Primary Colors' },
    { key: 'secondary', label: 'Secondary Colors' },
    { key: 'tertiary', label: 'Tertiary Colors' }
  ];

  useEffect(() => {
    fetchPalettes();
  }, []);

  const fetchPalettes = async () => {
    try {
      const response = await api.get('/colors');
      setPalettes(response.data.data || []);
    } catch (error) {
      console.error('Error fetching palettes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPalette = (category) => {
    return palettes.find(p => p.category === category);
  };

  const initializePalette = async (category) => {
    try {
      await api.post('/colors', {
        category,
        title: `${category.charAt(0).toUpperCase() + category.slice(1)} Colors`,
        colors: []
      });
      fetchPalettes();
    } catch (error) {
      console.error('Error initializing palette:', error);
    }
  };

  const handleDeleteColor = async (category, colorId) => {
    if (!window.confirm('Delete this color?')) return;

    try {
      await api.delete(`/colors/${category}/color/${colorId}`);
      fetchPalettes();
    } catch (error) {
      console.error('Delete failed:', error);
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
      <h1 className="text-2xl font-bold mb-6">Color Palettes</h1>

      <div className="space-y-8">
        {categories.map(({ key, label }) => {
          const palette = getPalette(key);

          return (
            <div key={key} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">{label}</h2>
                {palette && (
                  <button
                    onClick={() => {
                      setEditingPalette(palette);
                      setEditingColor(null);
                      setIsColorModalOpen(true);
                    }}
                    className="btn btn-primary text-sm"
                  >
                    Add Color
                  </button>
                )}
              </div>

              {palette ? (
                palette.colors && palette.colors.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {palette.colors.map((color) => (
                      <div key={color._id} className="group">
                        <div
                          className="aspect-square rounded-lg shadow-sm mb-2 cursor-pointer relative"
                          style={{ backgroundColor: color.hex }}
                        >
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <button
                              onClick={() => {
                                setEditingPalette(palette);
                                setEditingColor(color);
                                setIsColorModalOpen(true);
                              }}
                              className="p-1.5 bg-white rounded-full mr-1"
                            >
                              <svg className="h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteColor(key, color._id)}
                              className="p-1.5 bg-white rounded-full"
                            >
                              <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="text-sm">
                          <p className="font-medium truncate">{color.name}</p>
                          <p className="text-gray-500 text-xs">{color.hex}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No colors added yet. Click "Add Color" to get started.</p>
                )
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">This palette hasn't been initialized yet.</p>
                  <button
                    onClick={() => initializePalette(key)}
                    className="btn btn-primary"
                  >
                    Initialize {label}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ColorModal
        isOpen={isColorModalOpen}
        onClose={() => {
          setIsColorModalOpen(false);
          setEditingPalette(null);
          setEditingColor(null);
        }}
        palette={editingPalette}
        color={editingColor}
        onSave={fetchPalettes}
      />
    </div>
  );
};

const ColorModal = ({ isOpen, onClose, palette, color, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    hex: '#000000',
    rgb: { r: 0, g: 0, b: 0 },
    cmyk: { c: 0, m: 0, y: 0, k: 0 },
    pantone: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (color) {
      setFormData({
        name: color.name || '',
        hex: color.hex || '#000000',
        rgb: color.rgb || { r: 0, g: 0, b: 0 },
        cmyk: color.cmyk || { c: 0, m: 0, y: 0, k: 0 },
        pantone: color.pantone || ''
      });
    } else {
      setFormData({
        name: '',
        hex: '#000000',
        rgb: { r: 0, g: 0, b: 0 },
        cmyk: { c: 0, m: 0, y: 0, k: 0 },
        pantone: ''
      });
    }
    setError('');
  }, [color, isOpen]);

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const handleHexChange = (hex) => {
    const rgb = hexToRgb(hex);
    setFormData({ ...formData, hex, rgb });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (color) {
        await api.put(`/colors/${palette.category}/color/${color._id}`, formData);
      } else {
        await api.post(`/colors/${palette.category}/color`, formData);
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save color');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={color ? 'Edit Color' : 'Add Color'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

        <div className="flex gap-4">
          <div
            className="w-24 h-24 rounded-lg shadow-inner flex-shrink-0"
            style={{ backgroundColor: formData.hex }}
          />

          <div className="flex-1 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="e.g., Brand Blue"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">HEX *</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.hex}
                  onChange={(e) => handleHexChange(e.target.value)}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.hex}
                  onChange={(e) => handleHexChange(e.target.value)}
                  className="input flex-1"
                  pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">R</label>
            <input
              type="number"
              value={formData.rgb.r}
              onChange={(e) => setFormData({ ...formData, rgb: { ...formData.rgb, r: parseInt(e.target.value) || 0 } })}
              className="input text-sm"
              min="0"
              max="255"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">G</label>
            <input
              type="number"
              value={formData.rgb.g}
              onChange={(e) => setFormData({ ...formData, rgb: { ...formData.rgb, g: parseInt(e.target.value) || 0 } })}
              className="input text-sm"
              min="0"
              max="255"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">B</label>
            <input
              type="number"
              value={formData.rgb.b}
              onChange={(e) => setFormData({ ...formData, rgb: { ...formData.rgb, b: parseInt(e.target.value) || 0 } })}
              className="input text-sm"
              min="0"
              max="255"
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">C</label>
            <input
              type="number"
              value={formData.cmyk.c}
              onChange={(e) => setFormData({ ...formData, cmyk: { ...formData.cmyk, c: parseInt(e.target.value) || 0 } })}
              className="input text-sm"
              min="0"
              max="100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">M</label>
            <input
              type="number"
              value={formData.cmyk.m}
              onChange={(e) => setFormData({ ...formData, cmyk: { ...formData.cmyk, m: parseInt(e.target.value) || 0 } })}
              className="input text-sm"
              min="0"
              max="100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Y</label>
            <input
              type="number"
              value={formData.cmyk.y}
              onChange={(e) => setFormData({ ...formData, cmyk: { ...formData.cmyk, y: parseInt(e.target.value) || 0 } })}
              className="input text-sm"
              min="0"
              max="100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">K</label>
            <input
              type="number"
              value={formData.cmyk.k}
              onChange={(e) => setFormData({ ...formData, cmyk: { ...formData.cmyk, k: parseInt(e.target.value) || 0 } })}
              className="input text-sm"
              min="0"
              max="100"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pantone</label>
          <input
            type="text"
            value={formData.pantone}
            onChange={(e) => setFormData({ ...formData, pantone: e.target.value })}
            className="input"
            placeholder="e.g., PMS 286 C"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? 'Saving...' : color ? 'Update Color' : 'Add Color'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AdminColors;
