import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import ReactMarkdown from 'react-markdown';

const AdminContent = () => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  const sections = [
    { key: 'brand-voice', label: 'Brand Voice', description: 'Define your brand\'s tone, personality, and communication style.' },
    { key: 'messaging', label: 'Messaging', description: 'Key messages, taglines, and value propositions.' },
    { key: 'strategy-positioning', label: 'Strategy & Positioning', description: 'Brand strategy, market positioning, and target audience.' }
  ];

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await api.get('/content');
      setContent(response.data.data || []);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const getContent = (section) => {
    return content.find(c => c.section === section);
  };

  const initializeSection = async (section, title) => {
    try {
      await api.post('/content', {
        section,
        title,
        content: ''
      });
      fetchContent();
    } catch (error) {
      console.error('Error initializing section:', error);
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
      <h1 className="text-2xl font-bold mb-6">Content Management</h1>

      <div className="space-y-6">
        {sections.map(({ key, label, description }) => {
          const sectionContent = getContent(key);

          return (
            <div key={key} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold">{label}</h2>
                    <p className="text-sm text-gray-500 mt-1">{description}</p>
                  </div>
                  {sectionContent && (
                    <button
                      onClick={() => setEditingSection(editingSection === key ? null : key)}
                      className="btn btn-primary text-sm"
                    >
                      {editingSection === key ? 'Cancel' : 'Edit'}
                    </button>
                  )}
                </div>
              </div>

              {sectionContent ? (
                editingSection === key ? (
                  <ContentEditor
                    section={sectionContent}
                    onSave={() => {
                      fetchContent();
                      setEditingSection(null);
                    }}
                    onCancel={() => setEditingSection(null)}
                  />
                ) : (
                  <div className="p-6">
                    {sectionContent.content ? (
                      <div className="prose max-w-none">
                        <ReactMarkdown>{sectionContent.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No content yet. Click "Edit" to add content.</p>
                    )}
                  </div>
                )
              ) : (
                <div className="p-6 text-center">
                  <p className="text-gray-500 mb-4">This section hasn't been created yet.</p>
                  <button
                    onClick={() => initializeSection(key, label)}
                    className="btn btn-primary"
                  >
                    Create {label} Section
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Markdown Help */}
      <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Markdown Guide</h3>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium mb-2">Formatting</h4>
            <table className="w-full text-left">
              <tbody className="divide-y divide-gray-100">
                <tr><td className="py-1 font-mono text-gray-600"># Heading 1</td><td className="py-1 text-gray-500">Main heading</td></tr>
                <tr><td className="py-1 font-mono text-gray-600">## Heading 2</td><td className="py-1 text-gray-500">Sub heading</td></tr>
                <tr><td className="py-1 font-mono text-gray-600">**bold**</td><td className="py-1 text-gray-500">Bold text</td></tr>
                <tr><td className="py-1 font-mono text-gray-600">*italic*</td><td className="py-1 text-gray-500">Italic text</td></tr>
                <tr><td className="py-1 font-mono text-gray-600">[link](url)</td><td className="py-1 text-gray-500">Hyperlink</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <h4 className="font-medium mb-2">Lists & Blocks</h4>
            <table className="w-full text-left">
              <tbody className="divide-y divide-gray-100">
                <tr><td className="py-1 font-mono text-gray-600">- item</td><td className="py-1 text-gray-500">Bullet list</td></tr>
                <tr><td className="py-1 font-mono text-gray-600">1. item</td><td className="py-1 text-gray-500">Numbered list</td></tr>
                <tr><td className="py-1 font-mono text-gray-600">&gt; quote</td><td className="py-1 text-gray-500">Blockquote</td></tr>
                <tr><td className="py-1 font-mono text-gray-600">`code`</td><td className="py-1 text-gray-500">Inline code</td></tr>
                <tr><td className="py-1 font-mono text-gray-600">---</td><td className="py-1 text-gray-500">Horizontal rule</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContentEditor = ({ section, onSave, onCancel }) => {
  const [title, setTitle] = useState(section.title || '');
  const [content, setContent] = useState(section.content || '');
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/content/${section.section}`, { title, content });
      onSave();
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input"
        />
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-gray-700">Content (Markdown)</label>
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className="text-sm text-brand-600 hover:text-brand-700"
          >
            {previewMode ? 'Edit' : 'Preview'}
          </button>
        </div>

        {previewMode ? (
          <div className="prose max-w-none p-4 border border-gray-300 rounded-lg min-h-[300px] bg-gray-50">
            <ReactMarkdown>{content || '*No content to preview*'}</ReactMarkdown>
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="input font-mono text-sm"
            rows={12}
            placeholder="Write your content using Markdown..."
          />
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving} className="btn btn-primary">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default AdminContent;
