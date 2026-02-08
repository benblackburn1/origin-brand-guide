import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import api from '../utils/api';

const ToolViewer = () => {
  const { slug } = useParams();
  const location = useLocation();
  const [tool, setTool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    fetchTool();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const fetchTool = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/tools/slug/${slug}`);
      setTool(response.data.data);
    } catch (err) {
      console.error('Error fetching tool:', err);
      setError(err.response?.data?.message || 'Failed to load tool');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tool && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        // Parse params safely in React, inject as JSON to avoid string injection issues
        const toolParams = Object.fromEntries(new URLSearchParams(location.search));
        const paramsJSON = JSON.stringify(toolParams);

        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${tool.title}</title>
              <style>
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                }
                ${tool.css_code || ''}
              </style>
            </head>
            <body>
              ${tool.html_code || '<div style="padding: 20px;">No content available</div>'}
              <script>
                window.__TOOL_PARAMS__ = ${paramsJSON};
              </script>
              <script>
                ${tool.js_code || ''}
              </script>
            </body>
          </html>
        `);
        doc.close();
      }
    }
  }, [tool, location.search]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Tool Not Found</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link to="/tools" className="btn btn-primary">
            Back to Tools
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 48px)' }}>
      {/* Header */}
      <div className="bg-white border-b border-[#F0EEE0] py-3 px-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/tools"
              className="text-[#802A02] hover:text-[#131313] transition-colors"
              title="Back to Tools"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-sm font-semibold text-[#131313]">{tool?.title}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Tool Content */}
      <div className="flex-1 min-h-0">
        <iframe
          ref={iframeRef}
          title={tool?.title}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-downloads"
        />
      </div>
    </div>
  );
};

export default ToolViewer;
