import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../utils/api';
import PreviewModal from '../components/PreviewModal';
import ReactMarkdown from 'react-markdown';

const Guidelines = () => {
  const location = useLocation();
  const [assets, setAssets] = useState({});
  const [colors, setColors] = useState([]);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Handle hash navigation
    if (location.hash && !loading) {
      setTimeout(() => {
        const element = document.querySelector(location.hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location.hash, loading]);

  const fetchData = async () => {
    try {
      const [assetsRes, colorsRes, contentRes] = await Promise.all([
        api.get('/assets/grouped'),
        api.get('/colors'),
        api.get('/content')
      ]);

      setAssets(assetsRes.data.data || {});
      setColors(colorsRes.data.data || []);
      setContent(contentRes.data.data || []);
    } catch (error) {
      console.error('Error fetching guidelines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (assetId, fileIndex, fileType) => {
    try {
      const downloadUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/assets/${assetId}/download/${fileIndex}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = '';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#802A02] border-t-transparent"></div>
      </div>
    );
  }

  const logoCategories = [
    { key: 'logo-primary', label: 'Primary Logo', anchor: 'wordmark' },
    { key: 'logo-secondary', label: 'Secondary Logo', anchor: 'logo-secondary' },
    { key: 'logomark', label: 'Logomark / Favicon', anchor: 'favicon' }
  ];

  const typographyCategories = [
    { key: 'typography-hierarchy', label: 'Type Hierarchy' },
    { key: 'font-primary', label: 'Primary Font' },
    { key: 'font-secondary', label: 'Secondary Font' },
    { key: 'font-tertiary', label: 'Tertiary Font' }
  ];

  return (
    <div className="bg-white">
      {/* Page Header */}
      <div className="bg-[#F0EEE0]">
        <div className="max-w-7xl mx-auto px-8 lg:px-12 py-16">
          <p className="text-xs uppercase tracking-widest text-[#802A02] mb-4">Brand Assets</p>
          <h1 className="text-4xl md:text-5xl font-bold text-[#2B3901]">Brand Guidelines</h1>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-[#F0EEE0] sticky top-12 z-20">
        <div className="max-w-7xl mx-auto px-8 lg:px-12">
          <nav className="flex flex-wrap gap-6 py-4">
            <a href="#logos" className="text-xs uppercase tracking-widest font-semibold text-[#802A02] hover:text-[#131313] transition-colors">Logos</a>
            <a href="#colors" className="text-xs uppercase tracking-widest font-semibold text-[#802A02] hover:text-[#131313] transition-colors">Colors</a>
            <a href="#typography" className="text-xs uppercase tracking-widest font-semibold text-[#802A02] hover:text-[#131313] transition-colors">Typography</a>
            <a href="#art-direction" className="text-xs uppercase tracking-widest font-semibold text-[#802A02] hover:text-[#131313] transition-colors">Art Direction</a>
            <a href="#brand-imagery" className="text-xs uppercase tracking-widest font-semibold text-[#802A02] hover:text-[#131313] transition-colors">Imagery</a>
            <a href="#brand-voice" className="text-xs uppercase tracking-widest font-semibold text-[#802A02] hover:text-[#131313] transition-colors">Brand Voice</a>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 lg:px-12">
        {/* Logos Section */}
        <section id="logos" className="py-20 border-b border-[#F0EEE0]">
          <p className="text-xs uppercase tracking-widest text-[#802A02] mb-3">Brand Assets</p>
          <h2 className="text-3xl font-bold text-[#2B3901] mb-10">Logos</h2>

          {logoCategories.map(({ key, label, anchor }) => {
            const categoryAssets = assets.logos?.[key] || [];
            if (categoryAssets.length === 0) return null;

            return (
              <div key={key} id={anchor} className="mb-12 scroll-mt-32">
                <h3 className="text-lg font-semibold text-[#131313] mb-6">{label}</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {categoryAssets.map((asset) => (
                    <AssetCard
                      key={asset._id}
                      asset={asset}
                      onPreview={() => setSelectedAsset(asset)}
                      onDownload={handleDownload}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {!assets.logos && (
            <p className="text-[#131313] opacity-50">No logo assets available yet.</p>
          )}
        </section>

        {/* Colors Section */}
        <section id="colors" className="py-20 border-b border-[#F0EEE0] scroll-mt-32">
          <p className="text-xs uppercase tracking-widest text-[#802A02] mb-3">Brand Assets</p>
          <h2 className="text-3xl font-bold text-[#2B3901] mb-10">Color Palettes</h2>

          {colors.length > 0 ? (
            <div className="space-y-10">
              {colors.map((palette) => (
                <div key={palette._id} className="bg-[#F0EEE0] p-8">
                  <h3 className="text-lg font-semibold text-[#131313] mb-2 capitalize">{palette.title || palette.category} Colors</h3>
                  {palette.description && (
                    <p className="text-sm text-[#131313] opacity-60 mb-6">{palette.description}</p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {palette.colors.map((color) => (
                      <ColorSwatch
                        key={color._id}
                        color={color}
                        onCopy={copyToClipboard}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#131313] opacity-50">No color palettes available yet.</p>
          )}
        </section>

        {/* Typography Section */}
        <section id="typography" className="py-20 border-b border-[#F0EEE0] scroll-mt-32">
          <p className="text-xs uppercase tracking-widest text-[#802A02] mb-3">Brand Assets</p>
          <h2 className="text-3xl font-bold text-[#2B3901] mb-10">Typography</h2>

          {typographyCategories.map(({ key, label }) => {
            const categoryAssets = assets.typography?.[key] || [];
            if (categoryAssets.length === 0) return null;

            return (
              <div key={key} className="mb-12">
                <h3 className="text-lg font-semibold text-[#131313] mb-6">{label}</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {categoryAssets.map((asset) => (
                    <AssetCard
                      key={asset._id}
                      asset={asset}
                      onPreview={() => setSelectedAsset(asset)}
                      onDownload={handleDownload}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {!assets.typography && (
            <p className="text-[#131313] opacity-50">No typography assets available yet.</p>
          )}
        </section>

        {/* Art Direction Section */}
        <section id="art-direction" className="py-20 border-b border-[#F0EEE0] scroll-mt-32">
          <p className="text-xs uppercase tracking-widest text-[#802A02] mb-3">Brand Assets</p>
          <h2 className="text-3xl font-bold text-[#2B3901] mb-10">Art Direction</h2>
          <div className="bg-[#2B3901] p-8 md:p-12">
            <p className="text-[#F0EEE0] leading-relaxed mb-8">
              Photography and visual direction should feel warm, natural, and authentic.
              Favor earthy tones, natural lighting, and compositions that convey approachability and expertise.
              Avoid over-processed or overly stylized imagery.
            </p>
            {(assets.imagery?.imagery || []).length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(assets.imagery?.imagery || []).map((asset) => (
                  <AssetCard
                    key={asset._id}
                    asset={asset}
                    onPreview={() => setSelectedAsset(asset)}
                    onDownload={handleDownload}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Brand Imagery Section */}
        <section id="brand-imagery" className="py-20 border-b border-[#F0EEE0] scroll-mt-32">
          <p className="text-xs uppercase tracking-widest text-[#802A02] mb-3">Brand Assets</p>
          <h2 className="text-3xl font-bold text-[#2B3901] mb-10">Brand Imagery</h2>
          <div className="bg-[#F0EEE0] p-8 md:p-12">
            <p className="text-[#131313] leading-relaxed mb-8">
              Brand imagery should align with the art direction. Use images that reflect collaboration,
              focus, and craftsmanship. Maintain consistency with the brand color palette when
              selecting or editing photography.
            </p>
            {((assets.imagery?.icons || []).length > 0 || (assets.imagery?.patterns || []).length > 0) && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...(assets.imagery?.icons || []), ...(assets.imagery?.patterns || [])].map((asset) => (
                  <AssetCard
                    key={asset._id}
                    asset={asset}
                    onPreview={() => setSelectedAsset(asset)}
                    onDownload={handleDownload}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Content Sections (Brand Voice, Messaging, Strategy) */}
        {content.map((section) => (
          <section
            key={section._id}
            id={section.section}
            className="py-20 border-b border-[#F0EEE0] scroll-mt-32"
          >
            <p className="text-xs uppercase tracking-widest text-[#802A02] mb-3">Guidelines</p>
            <h2 className="text-3xl font-bold text-[#2B3901] mb-10">{section.title}</h2>
            <div className="bg-[#F0EEE0] p-8 md:p-12">
              <div className="prose max-w-none text-[#131313]">
                <ReactMarkdown>{section.content || 'Content coming soon.'}</ReactMarkdown>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Preview Modal */}
      <PreviewModal
        isOpen={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
        asset={selectedAsset}
        onDownload={handleDownload}
      />
    </div>
  );
};

// Asset Card Component
const AssetCard = ({ asset, onPreview, onDownload }) => {
  const [selectedType, setSelectedType] = useState(
    asset.files?.[0]?.file_type || ''
  );

  const handleDownload = () => {
    const fileIndex = asset.files.findIndex(f => f.file_type === selectedType);
    if (fileIndex !== -1) {
      onDownload(asset._id, fileIndex, selectedType);
    }
  };

  return (
    <div className="bg-white border border-[#F0EEE0] overflow-hidden hover:border-[#EEC8B3] transition-all duration-300">
      {/* Preview Image */}
      <div
        className="aspect-square bg-[#F0EEE0] flex items-center justify-center cursor-pointer hover:bg-[#EEC8B3] hover:bg-opacity-30 transition-colors p-6"
        onClick={onPreview}
      >
        {asset.preview_url ? (
          <img
            src={asset.preview_url}
            alt={asset.title}
            className="w-full h-full object-contain"
          />
        ) : (
          <svg className="h-16 w-16 text-[#802A02] opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
      </div>

      {/* Info */}
      <div className="p-5">
        <h4 className="font-semibold text-base mb-1 text-[#131313]">{asset.title}</h4>
        {asset.description && (
          <p className="text-xs text-[#131313] opacity-50 mb-4 line-clamp-2">{asset.description}</p>
        )}

        {/* Download Controls */}
        {asset.files && asset.files.length > 0 && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5 mb-3">
              {asset.files.map((file) => (
                <button
                  key={file._id}
                  onClick={() => setSelectedType(file.file_type)}
                  className={`text-xs px-2.5 py-1 font-medium uppercase tracking-wide transition-colors duration-200 ${
                    selectedType === file.file_type
                      ? 'bg-[#802A02] text-white'
                      : 'bg-[#F0EEE0] text-[#131313] hover:bg-[#EEC8B3]'
                  }`}
                >
                  {file.file_type}
                </button>
              ))}
            </div>
            <button
              onClick={handleDownload}
              className="w-full px-4 py-2 bg-[#131313] text-white hover:bg-[#802A02] transition-colors text-xs font-semibold uppercase tracking-widest"
            >
              Download {selectedType}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Color Swatch Component
const ColorSwatch = ({ color, onCopy }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (value) => {
    onCopy(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const rgbString = color.rgb
    ? `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`
    : null;

  const cmykString = color.cmyk
    ? `C${color.cmyk.c} M${color.cmyk.m} Y${color.cmyk.y} K${color.cmyk.k}`
    : null;

  return (
    <div className="space-y-2">
      <div
        className="w-full aspect-square rounded-sm cursor-pointer transition-transform hover:scale-105"
        style={{ backgroundColor: color.hex, border: color.hex?.toLowerCase() === '#f0eee0' ? '1px solid #ddd' : 'none' }}
        onClick={() => handleCopy(color.hex)}
        title="Click to copy HEX"
      >
        {copied && (
          <div className="w-full h-full flex items-center justify-center bg-black bg-opacity-50 rounded-sm text-white text-xs font-medium">
            Copied!
          </div>
        )}
      </div>
      <div className="text-sm">
        <p className="font-semibold text-[#131313]">{color.name}</p>
        <button
          onClick={() => handleCopy(color.hex)}
          className="text-[#131313] opacity-60 hover:opacity-100 text-xs"
        >
          {color.hex}
        </button>
        {rgbString && (
          <button
            onClick={() => handleCopy(rgbString)}
            className="block text-[#131313] opacity-50 hover:opacity-100 text-xs"
          >
            {rgbString}
          </button>
        )}
        {cmykString && (
          <p className="text-[#131313] opacity-50 text-xs">{cmykString}</p>
        )}
        {color.pantone && (
          <p className="text-[#131313] opacity-50 text-xs">Pantone: {color.pantone}</p>
        )}
      </div>
    </div>
  );
};

export default Guidelines;
