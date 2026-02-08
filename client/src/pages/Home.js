import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const Home = () => {
  const [brandConfig, setBrandConfig] = useState(null);
  const [colors, setColors] = useState([]);
  const [tools, setTools] = useState([]);
  const [assets, setAssets] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [configRes, colorsRes, toolsRes, assetsRes] = await Promise.all([
          api.get('/brand-config').catch(() => null),
          api.get('/colors').catch(() => ({ data: { data: [] } })),
          api.get('/tools').catch(() => ({ data: { data: [] } })),
          api.get('/assets/grouped').catch(() => ({ data: { data: {} } }))
        ]);

        if (configRes?.data?.success) {
          setBrandConfig(configRes.data.data);
        }
        setColors(colorsRes?.data?.data || []);
        setTools(toolsRes?.data?.data || []);
        setAssets(assetsRes?.data?.data || {});
      } catch (err) {
        // Data not available, use defaults
      }
    };
    fetchData();
  }, []);

  // Flatten all colors from all palettes for the mini-grid
  const allColors = colors.flatMap(palette => palette.colors || []);

  // Fallback colors if none in DB
  const fallbackColors = [
    { name: 'Red Clay', hex: '#802A02' },
    { name: 'Black', hex: '#131313' },
    { name: 'Forest Green', hex: '#2B3901' },
    { name: 'Off-white', hex: '#F0EEE0' },
    { name: 'Desert Mauve', hex: '#EEC8B3' },
  ];

  const displayColors = allColors.length > 0 ? allColors : fallbackColors;

  // Get imagery assets for Art Direction and Brand Imagery panels
  const artDirectionAssets = assets.imagery?.imagery || [];
  const brandImageryAssets = assets.imagery?.icons || assets.imagery?.patterns || [];
  const firstArtDirectionImage = artDirectionAssets[0]?.preview_url || artDirectionAssets[0]?.files?.[0]?.file_url;
  const firstBrandImageryImage = brandImageryAssets[0]?.preview_url || brandImageryAssets[0]?.files?.[0]?.file_url;

  // Dynamic hero background from brand config
  const heroBackgroundImage = brandConfig?.homepage_hero_image_url;

  return (
    <div className="bg-white">
      {/* Hero Section - Full width with brand image overlay, extends under fixed nav */}
      <div
        className="relative overflow-hidden -mt-[110px] pt-[110px]"
        style={{
          backgroundColor: heroBackgroundImage ? 'transparent' : '#802A02',
          ...(heroBackgroundImage && {
            backgroundImage: `url(${heroBackgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          })
        }}
      >
        {/* Dark overlay when image is present for text readability */}
        {heroBackgroundImage && (
          <div className="absolute inset-0 bg-[#802A02] bg-opacity-60" />
        )}
        {/* Textured overlay - only show if no image */}
        {!heroBackgroundImage && (
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(240,238,224,0.3) 1px, transparent 0)',
            backgroundSize: '4px 4px'
          }} />
        )}
        <div className="relative max-w-7xl mx-auto px-8 lg:px-12 py-28 md:py-36">
          <p className="text-xs uppercase tracking-widest text-[#EEC8B3] mb-6">Version 1.1</p>
          <h1 className="text-5xl md:text-7xl font-bold text-[#F0EEE0] mb-8 leading-tight">
            Your Brand Guide
          </h1>
        </div>
      </div>

      {/* Who We Are */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-8 lg:px-12 py-20">
          <p className="text-xs uppercase tracking-widest text-[#802A02] mb-4">Who We Are</p>
          <div className="max-w-xl">
            <p className="text-lg text-[#131313] leading-relaxed">
              {brandConfig?.description || 'Hands-on AI training for the work ahead. AI just made a leap that most people missed. It can do real work now — not just answer questions. We\'ll show you what\'s possible and help you build systems for your job.'}
            </p>
          </div>
        </div>
      </div>

      {/* Brand Assets Section */}
      <div className="bg-white border-t border-[#F0EEE0]">
        <div className="max-w-7xl mx-auto px-8 lg:px-12 py-20">
          <p className="text-xs uppercase tracking-widest text-[#802A02] mb-10">Brand Assets</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Wordmark */}
            <Link to="/guidelines#wordmark" className="block group">
              <div className="bg-[#F0EEE0] p-4 pb-0">
                <p className="text-[10px] uppercase tracking-widest text-[#802A02] mb-4">Wordmark</p>
                <div className="flex items-center justify-center py-16">
                  <span className="text-5xl md:text-6xl font-black text-[#2B3901] tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>
                    CARAVAN
                  </span>
                </div>
              </div>
            </Link>

            {/* Favicon + Colors grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Favicon */}
              <Link to="/guidelines#favicon" className="block group">
                <div className="bg-[#F0EEE0] p-4 h-full">
                  <p className="text-[10px] uppercase tracking-widest text-[#802A02] mb-4">Favicon</p>
                  <div className="flex items-center justify-center py-8">
                    <div className="w-20 h-20 bg-[#EEC8B3] rounded-2xl flex items-center justify-center">
                      <span className="text-4xl font-bold text-[#802A02]">C</span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Colors mini grid - copyable */}
              <div className="bg-[#802A02] p-4 h-full">
                <p className="text-[10px] uppercase tracking-widest text-[#EEC8B3] mb-3">Colors</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {displayColors.slice(0, 6).map((color, idx) => (
                    <CopyableColorSwatch key={color.hex || idx} color={color} mini />
                  ))}
                  {displayColors.length < 6 && Array.from({ length: 6 - displayColors.length }).map((_, i) => (
                    <div key={`empty-${i}`} className="hidden md:block" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Art Direction + Brand Imagery */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Link to="/guidelines#art-direction" className="block group">
              <div className="bg-[#2B3901] p-4 aspect-[4/3] flex flex-col overflow-hidden relative">
                <p className="text-[10px] uppercase tracking-widest text-[#F0EEE0] mb-4 relative z-10">Art Direction</p>
                <div className="flex-1 flex items-center justify-center">
                  {firstArtDirectionImage ? (
                    <img
                      src={firstArtDirectionImage}
                      alt="Art Direction"
                      className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-75 transition-opacity"
                    />
                  ) : (
                    <svg className="w-16 h-16 text-[#F0EEE0] opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </div>
              </div>
            </Link>
            <Link to="/guidelines#brand-imagery" className="block group">
              <div className="bg-[#2B3901] p-4 aspect-[4/3] flex flex-col overflow-hidden relative" style={{ opacity: 0.85 }}>
                <p className="text-[10px] uppercase tracking-widest text-[#F0EEE0] mb-4 relative z-10">Brand Imagery</p>
                <div className="flex-1 flex items-center justify-center">
                  {firstBrandImageryImage ? (
                    <img
                      src={firstBrandImageryImage}
                      alt="Brand Imagery"
                      className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-75 transition-opacity"
                    />
                  ) : (
                    <svg className="w-16 h-16 text-[#F0EEE0] opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Application Section */}
      <div className="bg-white border-t border-[#F0EEE0]">
        <div className="max-w-7xl mx-auto px-8 lg:px-12 py-20">
          <p className="text-xs uppercase tracking-widest text-[#802A02] mb-10">Application</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Digital */}
            <Link to="/templates" className="block group">
              <div className="bg-[#131313] p-4 aspect-[4/3] flex flex-col">
                <p className="text-[10px] uppercase tracking-widest text-[#EEC8B3] mb-4">Digital</p>
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-32 h-24 bg-[#2B3901] rounded-lg flex items-center justify-center border border-[#EEC8B3] border-opacity-20">
                    <span className="text-xs font-bold text-[#F0EEE0] tracking-wider">CARAVAN</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Print + Presentations */}
            <div className="grid grid-rows-2 gap-4">
              <Link to="/templates" className="block group">
                <div className="bg-[#802A02] p-4 flex flex-col">
                  <p className="text-[10px] uppercase tracking-widest text-[#EEC8B3] mb-3">Print</p>
                  <div className="flex items-center justify-center py-6">
                    <div className="w-16 h-20 bg-[#F0EEE0] rounded-sm flex items-center justify-center shadow-lg">
                      <span className="text-[8px] font-black text-[#802A02] tracking-wider">CARAVAN</span>
                    </div>
                  </div>
                </div>
              </Link>
              <Link to="/templates" className="block group">
                <div className="bg-[#2B3901] p-4 flex flex-col">
                  <p className="text-[10px] uppercase tracking-widest text-[#EEC8B3] mb-3">Presentations</p>
                  <div className="flex items-center justify-center py-6">
                    <div className="w-24 h-14 bg-[#F0EEE0] rounded-sm flex items-center justify-center shadow-lg">
                      <span className="text-[8px] font-black text-[#2B3901] tracking-wider">CARAVAN</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Creator Tools Section */}
      <div className="bg-[#F0EEE0]">
        <div className="max-w-7xl mx-auto px-8 lg:px-12 py-20">
          <p className="text-xs uppercase tracking-widest text-[#802A02] mb-10">Creator</p>
          {tools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tools.map((tool) => (
                <Link
                  key={tool._id}
                  to={`/creator?tool=${tool.slug}`}
                  className="block group"
                >
                  <div className="bg-white border border-transparent hover:border-[#802A02] transition-all duration-300 overflow-hidden">
                    {/* Preview */}
                    <div className="aspect-video bg-[#131313] flex items-center justify-center overflow-hidden">
                      {tool.preview_url ? (
                        <img
                          src={tool.preview_url}
                          alt={tool.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="text-center">
                          <svg className="h-10 w-10 text-[#EEC8B3] opacity-40 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <p className="text-xs text-[#EEC8B3] opacity-40">{tool.title}</p>
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="p-5">
                      <h3 className="font-semibold text-sm text-[#131313] group-hover:text-[#802A02] transition-colors">{tool.title}</h3>
                      {tool.description && (
                        <p className="text-xs text-[#131313] opacity-50 mt-1 line-clamp-2">{tool.description}</p>
                      )}
                      <span className="inline-block mt-3 text-[10px] uppercase tracking-widest text-[#802A02] font-semibold group-hover:translate-x-1 transition-transform">
                        Launch Tool →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-[#131313] opacity-50">No brand tools available yet.</p>
          )}
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="bg-white border-t border-[#F0EEE0]">
        <div className="max-w-7xl mx-auto px-8 lg:px-12 py-20">
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              to="/guidelines"
              className="border border-[#F0EEE0] p-8 hover:border-[#802A02] transition-all duration-300 group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-[#F0EEE0] rounded-lg flex items-center justify-center group-hover:bg-[#EEC8B3] transition-colors">
                  <svg className="h-5 w-5 text-[#802A02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-[#2B3901] group-hover:text-[#802A02] transition-colors">Brand Assets</h2>
              </div>
              <p className="text-sm text-[#131313] opacity-60">Logos, colors, typography, and guidelines.</p>
              <span className="inline-block mt-4 text-xs uppercase tracking-widest text-[#802A02] font-semibold group-hover:translate-x-1 transition-transform">
                Explore →
              </span>
            </Link>
            <Link
              to="/templates"
              className="border border-[#F0EEE0] p-8 hover:border-[#802A02] transition-all duration-300 group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-[#F0EEE0] rounded-lg flex items-center justify-center group-hover:bg-[#EEC8B3] transition-colors">
                  <svg className="h-5 w-5 text-[#802A02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-[#2B3901] group-hover:text-[#802A02] transition-colors">Brand Application</h2>
              </div>
              <p className="text-sm text-[#131313] opacity-60">Templates, social media assets, and more.</p>
              <span className="inline-block mt-4 text-xs uppercase tracking-widest text-[#802A02] font-semibold group-hover:translate-x-1 transition-transform">
                Explore →
              </span>
            </Link>
            <Link
              to="/creator"
              className="border border-[#F0EEE0] p-8 hover:border-[#802A02] transition-all duration-300 group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-[#F0EEE0] rounded-lg flex items-center justify-center group-hover:bg-[#EEC8B3] transition-colors">
                  <svg className="h-5 w-5 text-[#802A02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-[#2B3901] group-hover:text-[#802A02] transition-colors">Creator</h2>
              </div>
              <p className="text-sm text-[#131313] opacity-60">Interactive tools for on-brand content.</p>
              <span className="inline-block mt-4 text-xs uppercase tracking-widest text-[#802A02] font-semibold group-hover:translate-x-1 transition-transform">
                Explore →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mini copyable color swatch for the homepage grid
const CopyableColorSwatch = ({ color, mini }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(color.hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  if (mini) {
    return (
      <div
        className="cursor-pointer"
        onClick={handleCopy}
        title={`Click to copy ${color.hex}`}
      >
        <div
          className="aspect-square rounded-sm transition-transform hover:scale-110"
          style={{
            backgroundColor: color.hex,
            border: color.hex?.toLowerCase() === '#802a02' ? '1px solid rgba(238,200,179,0.3)' : 'none'
          }}
        >
          {copied && (
            <div className="w-full h-full flex items-center justify-center bg-black bg-opacity-60 rounded-sm">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
        <p className="text-[7px] text-[#EEC8B3] mt-1">{color.name}</p>
      </div>
    );
  }

  return null;
};

export default Home;
