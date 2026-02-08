import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';

const Creator = () => {
  const [tools, setTools] = useState([]);
  const [selectedTool, setSelectedTool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const iframeRef = useRef(null);

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    try {
      const response = await api.get('/tools');
      const toolsList = response.data.data || [];
      setTools(toolsList);

      // Check URL for pre-selected tool
      const toolSlug = searchParams.get('tool');
      if (toolSlug) {
        const tool = toolsList.find(t => t.slug === toolSlug);
        if (tool) {
          fetchToolDetails(tool.slug);
        }
      }
    } catch (error) {
      console.error('Error fetching tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchToolDetails = async (slug) => {
    try {
      const response = await api.get(`/tools/slug/${slug}`);
      setSelectedTool(response.data.data);
      setSearchParams({ tool: slug });
    } catch (error) {
      console.error('Error fetching tool details:', error);
    }
  };

  const handleToolSelect = (slug) => {
    if (slug) {
      fetchToolDetails(slug);
    } else {
      setSelectedTool(null);
      setSearchParams({});
    }
  };

  // Render tool iframe when selected
  useEffect(() => {
    if (selectedTool && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        // Get the base API URL for brand assets
        const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${selectedTool.title}</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                ${selectedTool.css_code || ''}
              </style>
            </head>
            <body>
              ${selectedTool.html_code || '<div style="padding: 20px;">No content available</div>'}
              <script>
                // Expose Brand Hub API to the tool
                window.BrandHub = {
                  apiBaseUrl: '${apiBaseUrl}',
                  async getBrandAssets() {
                    try {
                      const res = await fetch('${apiBaseUrl}/assets/grouped');
                      const data = await res.json();
                      return data.data;
                    } catch (e) {
                      console.error('Failed to fetch brand assets:', e);
                      return {};
                    }
                  },
                  async getBrandImagery() {
                    try {
                      const res = await fetch('${apiBaseUrl}/assets?section=imagery');
                      const data = await res.json();
                      return data.data;
                    } catch (e) {
                      console.error('Failed to fetch brand imagery:', e);
                      return [];
                    }
                  },
                  async getBrandColors() {
                    try {
                      const res = await fetch('${apiBaseUrl}/colors');
                      const data = await res.json();
                      return data.data;
                    } catch (e) {
                      console.error('Failed to fetch brand colors:', e);
                      return [];
                    }
                  },
                  async getForTools() {
                    try {
                      const res = await fetch('${apiBaseUrl}/assets/for-tools');
                      const data = await res.json();
                      return data.data;
                    } catch (e) {
                      console.error('Failed to fetch assets for tools:', e);
                      return {};
                    }
                  }
                };
              </script>
              <script>
                ${selectedTool.js_code || ''}
              </script>
            </body>
          </html>
        `);
        doc.close();
      }
    }
  }, [selectedTool]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#802A02] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 110px)' }}>
      {/* Tool Selector Header */}
      <div className="bg-white border-b border-[#F0EEE0] py-4 px-6 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-[#131313]">Creator</h1>

            {/* Tool Dropdown */}
            <div className="relative">
              <select
                value={selectedTool?.slug || ''}
                onChange={(e) => handleToolSelect(e.target.value)}
                className="appearance-none bg-white border border-[#EEC8B3] rounded px-4 py-2 pr-10 text-sm font-medium text-[#131313] focus:outline-none focus:ring-2 focus:ring-[#802A02] focus:border-transparent min-w-[200px]"
                style={{
                  background: 'rgba(19, 19, 19, 0.05)',
                }}
              >
                <option value="">Select a tool...</option>
                {tools.map((tool) => (
                  <option key={tool._id} value={tool.slug}>
                    {tool.title}
                  </option>
                ))}
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#802A02] pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {selectedTool && (
            <p className="text-sm text-[#131313] opacity-60 hidden md:block max-w-md truncate">
              {selectedTool.description}
            </p>
          )}
        </div>
      </div>

      {/* Tool Content Area */}
      <div className="flex-1 min-h-0 bg-[#F0EEE0]">
        {selectedTool ? (
          <iframe
            ref={iframeRef}
            title={selectedTool.title}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-downloads"
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <svg className="mx-auto h-16 w-16 text-[#802A02] opacity-40 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h2 className="text-xl font-semibold text-[#131313] mb-2">Select a Tool</h2>
              <p className="text-[#131313] opacity-60 max-w-sm mx-auto">
                Choose a brand tool from the dropdown above to get started creating on-brand content.
              </p>

              {/* Tool Cards Grid */}
              {tools.length > 0 && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto px-4">
                  {tools.map((tool) => (
                    <button
                      key={tool._id}
                      onClick={() => handleToolSelect(tool.slug)}
                      className="bg-white p-4 rounded-lg border border-transparent hover:border-[#802A02] transition-all duration-300 text-left group"
                    >
                      {/* Preview */}
                      <div className="aspect-video bg-[#131313] rounded mb-3 overflow-hidden">
                        {tool.preview_url ? (
                          <img
                            src={tool.preview_url}
                            alt={tool.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="h-8 w-8 text-[#EEC8B3] opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm text-[#131313] group-hover:text-[#802A02] transition-colors">
                        {tool.title}
                      </h3>
                      {tool.description && (
                        <p className="text-xs text-[#131313] opacity-50 mt-1 line-clamp-2">
                          {tool.description}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Creator;
