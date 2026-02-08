import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const Settings = () => {
  const [config, setConfig] = useState({
    homepage_hero_image_id: null,
    homepage_hero_image_url: null,
    description: ''
  });
  const [imageryOptions, setImageryOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [configRes, imageryRes] = await Promise.all([
        api.get('/brand-config'),
        api.get('/brand-config/imagery-options')
      ]);

      if (configRes?.data?.success && configRes.data.data) {
        setConfig({
          homepage_hero_image_id: configRes.data.data.homepage_hero_image_id?._id || configRes.data.data.homepage_hero_image_id || null,
          homepage_hero_image_url: configRes.data.data.homepage_hero_image_url || null,
          description: configRes.data.data.description || ''
        });
      }

      if (imageryRes?.data?.success) {
        setImageryOptions(imageryRes.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (assetId) => {
    const selectedAsset = imageryOptions.find(a => a._id === assetId);
    setConfig({
      ...config,
      homepage_hero_image_id: assetId || null,
      homepage_hero_image_url: selectedAsset?.preview_url || selectedAsset?.files?.[0]?.file_url || null
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await api.put('/brand-config', {
        homepage_hero_image_id: config.homepage_hero_image_id,
        description: config.description
      });

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings.' });
    } finally {
      setSaving(false);
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
        <h1 className="text-2xl font-bold">Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-8">
        {/* Homepage Hero Background */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Homepage Hero Background</h2>
          <p className="text-sm text-gray-600 mb-6">
            Select a brand imagery asset to use as the homepage hero background. If no image is selected, the default red clay color with texture pattern will be used.
          </p>

          {/* Current Selection */}
          {config.homepage_hero_image_url && (
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Current Selection</p>
              <div className="relative inline-block">
                <img
                  src={config.homepage_hero_image_url}
                  alt="Current hero background"
                  className="w-64 h-36 object-cover rounded-lg border border-gray-200"
                />
                <button
                  onClick={() => handleImageSelect(null)}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors"
                  title="Remove selection"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Image Options Grid */}
          <p className="text-sm font-medium text-gray-700 mb-3">Available Imagery</p>
          {imageryOptions.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {imageryOptions.map((asset) => {
                const imageUrl = asset.preview_url || asset.files?.[0]?.file_url;
                const isSelected = config.homepage_hero_image_id === asset._id;

                return (
                  <button
                    key={asset._id}
                    onClick={() => handleImageSelect(asset._id)}
                    className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected
                        ? 'border-[#802A02] ring-2 ring-[#802A02] ring-opacity-50'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={asset.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 bg-[#802A02] bg-opacity-20 flex items-center justify-center">
                        <div className="bg-[#802A02] rounded-full p-1">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-white text-xs truncate">{asset.title}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-2 text-sm text-gray-600">No imagery assets available.</p>
              <p className="text-xs text-gray-500 mt-1">
                Upload imagery assets in the Assets section first.
              </p>
            </div>
          )}
        </div>

        {/* Brand Description */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Brand Description</h2>
          <p className="text-sm text-gray-600 mb-4">
            This description appears in the "Who We Are" section on the homepage.
          </p>
          <textarea
            value={config.description}
            onChange={(e) => setConfig({ ...config, description: e.target.value })}
            className="input"
            rows={4}
            placeholder="Enter your brand description..."
            maxLength={2000}
          />
          <p className="text-xs text-gray-500 mt-2">
            {config.description.length}/2000 characters
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
