import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';

const ChatPanel = () => {
  const {
    isOpen,
    closePanel,
    conversations,
    activeConversation,
    messages,
    loading,
    googleConnected,
    loadConversations,
    loadConversation,
    newConversation,
    sendMessage,
    deleteConversation,
    checkGoogleConnection,
    connectGoogle
  } = useChat();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && user) {
      loadConversations();
      checkGoogleConnection();
    }
  }, [isOpen, user, loadConversations, checkGoogleConnection]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-40 transition-opacity"
          onClick={closePanel}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-[420px] max-w-[90vw] bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0EEE0] flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-1.5 hover:bg-[#F0EEE0] rounded-lg transition-colors"
              title="Conversation history"
            >
              <svg className="w-4 h-4 text-[#802A02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <h2 className="text-sm font-semibold text-[#131313]">Brand Assistant</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={newConversation}
              className="p-1.5 hover:bg-[#F0EEE0] rounded-lg transition-colors"
              title="New conversation"
            >
              <svg className="w-4 h-4 text-[#802A02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={closePanel}
              className="p-1.5 hover:bg-[#F0EEE0] rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 text-[#131313]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Google Connection Banner */}
        {googleConnected === false && (
          <div className="px-4 py-2.5 bg-[#F0EEE0] border-b border-[#EEC8B3] flex items-center justify-between flex-shrink-0">
            <span className="text-xs text-[#131313]">Connect Google for Slides & Docs</span>
            <button
              onClick={connectGoogle}
              className="text-xs font-semibold text-[#802A02] hover:text-[#131313] transition-colors"
            >
              Connect
            </button>
          </div>
        )}

        {/* History Sidebar */}
        {showHistory && (
          <div className="border-b border-[#F0EEE0] max-h-60 overflow-y-auto flex-shrink-0">
            <div className="p-2">
              {conversations.length === 0 ? (
                <p className="text-xs text-[#131313] opacity-40 text-center py-4">No conversations yet</p>
              ) : (
                conversations.map(conv => (
                  <div
                    key={conv._id}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer group transition-colors ${
                      activeConversation?._id === conv._id ? 'bg-[#F0EEE0]' : 'hover:bg-[#F0EEE0] hover:bg-opacity-50'
                    }`}
                  >
                    <div
                      className="flex-1 min-w-0"
                      onClick={() => {
                        loadConversation(conv._id);
                        setShowHistory(false);
                      }}
                    >
                      <p className="text-xs font-medium text-[#131313] truncate">{conv.title}</p>
                      <p className="text-[10px] text-[#131313] opacity-40">{conv.messageCount} messages</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv._id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-[#F0EEE0] rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-[#802A02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-[#131313] mb-1">Brand Assistant</p>
              <p className="text-xs text-[#131313] opacity-50 max-w-[250px] mx-auto">
                Ask about brand guidelines, create presentations, social posts, or branded documents.
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <MessageBubble key={idx} message={msg} />
          ))}

          {loading && (
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-[#802A02] rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-[#F0EEE0]">C</span>
              </div>
              <div className="bg-[#F0EEE0] rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-[#802A02] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-[#802A02] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-[#802A02] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-[#F0EEE0] flex-shrink-0">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your brand..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-[#F0EEE0] px-4 py-2.5 text-sm text-[#131313] placeholder-[#131313] placeholder-opacity-30 focus:outline-none focus:border-[#802A02] transition-colors"
              style={{ maxHeight: '120px' }}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-3 py-2.5 bg-[#802A02] text-white rounded-xl hover:bg-[#6B2302] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

// Individual message bubble component
const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      {isUser ? (
        <div className="w-6 h-6 bg-[#131313] rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-white">U</span>
        </div>
      ) : (
        <div className="w-6 h-6 bg-[#802A02] rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-[#F0EEE0]">C</span>
        </div>
      )}

      <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Text content */}
        <div
          className={`rounded-2xl px-4 py-2.5 ${
            isUser
              ? 'bg-[#131313] text-white rounded-tr-sm'
              : 'bg-[#F0EEE0] text-[#131313] rounded-tl-sm'
          }`}
        >
          <div className="text-sm leading-relaxed prose prose-sm max-w-none">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className={`underline ${isUser ? 'text-[#EEC8B3]' : 'text-[#802A02]'}`}>
                    {children}
                  </a>
                ),
                ul: ({ children }) => <ul className="list-disc pl-4 mb-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-1">{children}</ol>,
                li: ({ children }) => <li className="mb-0.5">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                code: ({ children }) => (
                  <code className={`px-1 py-0.5 rounded text-xs ${isUser ? 'bg-white bg-opacity-10' : 'bg-[#131313] bg-opacity-5'}`}>
                    {children}
                  </code>
                )
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Tool result cards */}
        {message.tool_calls && message.tool_calls.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.tool_calls.map((tc, idx) => (
              <ToolResultCard key={idx} toolCall={tc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Tool result cards for presentations, PDFs, social content, etc.
const ToolResultCard = ({ toolCall }) => {
  const { tool, result } = toolCall;

  if (result?.error === 'google_not_connected') {
    return (
      <div className="border border-[#EEC8B3] rounded-xl p-3 bg-[#F0EEE0]">
        <p className="text-xs text-[#131313] mb-2">Google account not connected.</p>
        <button
          onClick={() => window.location.href = '/api/auth/google'}
          className="text-xs font-semibold text-[#802A02] hover:text-[#131313]"
        >
          Connect Google Account →
        </button>
      </div>
    );
  }

  if (result?.error) {
    return (
      <div className="border border-red-200 rounded-xl p-3 bg-red-50">
        <p className="text-xs text-red-600">{result.error}</p>
      </div>
    );
  }

  switch (tool) {
    case 'create_presentation':
      return (
        <div className="border border-[#F0EEE0] rounded-xl p-3 bg-white">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-[#802A02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            <span className="text-xs font-semibold text-[#131313]">{result.title || 'Presentation'}</span>
          </div>
          <p className="text-[10px] text-[#131313] opacity-50 mb-2">{result.slideCount} slides created</p>
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#802A02] text-white text-xs font-semibold rounded-lg hover:bg-[#6B2302] transition-colors"
          >
            Open in Google Slides
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      );

    case 'create_pdf_document':
      return (
        <div className="border border-[#F0EEE0] rounded-xl p-3 bg-white">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-[#802A02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-semibold text-[#131313]">{result.title || 'Document'}</span>
          </div>
          <p className="text-[10px] text-[#131313] opacity-50 mb-2 capitalize">{result.type} document</p>
          {result.url && (
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#131313] text-white text-xs font-semibold rounded-lg hover:bg-[#802A02] transition-colors"
            >
              Download PDF
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </a>
          )}
        </div>
      );

    case 'create_social_content':
      return (
        <div className="border border-[#F0EEE0] rounded-xl p-3 bg-white">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-[#802A02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <span className="text-xs font-semibold text-[#131313] capitalize">{result.platform} Post</span>
          </div>
          {result.post_text && (
            <div className="mb-2 p-2 bg-[#F0EEE0] bg-opacity-50 rounded-lg">
              <p className="text-xs text-[#131313] leading-relaxed" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {result.post_text}
              </p>
            </div>
          )}
          {result.headline && (
            <p className="text-xs text-[#131313] mb-1">
              <span className="text-[10px] opacity-50">Visual: </span>
              <span className="font-medium">{result.headline}</span>
            </p>
          )}
          {result.hashtags && result.hashtags.length > 0 && (
            <p className="text-[10px] text-[#802A02] mb-2">{result.hashtags.map(h => `#${h}`).join(' ')}</p>
          )}
          {result.tool_link && (
            <Link
              to={result.tool_link}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#802A02] text-white text-xs font-semibold rounded-lg hover:bg-[#6B2302] transition-colors mt-1"
            >
              Open in Content Creator →
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          )}
        </div>
      );

    case 'reference_tool':
      return (
        <div className="border border-[#F0EEE0] rounded-xl p-3 bg-white">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-[#802A02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs font-semibold text-[#131313]">{result.title}</span>
          </div>
          {result.reason && <p className="text-[10px] text-[#131313] opacity-50 mb-2">{result.reason}</p>}
          <a
            href={result.link}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#802A02] hover:text-[#131313] transition-colors"
          >
            Open Tool →
          </a>
        </div>
      );

    default:
      return null;
  }
};

export default ChatPanel;
