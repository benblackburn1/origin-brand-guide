import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../utils/api';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(null);

  const togglePanel = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const openPanel = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const res = await api.get('/chat/conversations');
      setConversations(res.data.data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }, []);

  const loadConversation = useCallback(async (conversationId) => {
    try {
      const res = await api.get(`/chat/conversations/${conversationId}`);
      setActiveConversation(res.data.data);
      setMessages(res.data.data.messages || []);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  }, []);

  const newConversation = useCallback(() => {
    setActiveConversation(null);
    setMessages([]);
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return;

    // Optimistically add user message
    const userMessage = { role: 'user', content: text.trim(), created_at: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await api.post('/chat', {
        conversationId: activeConversation?._id,
        message: text.trim()
      });

      const { conversationId, message: assistantMessage } = res.data;

      // Update active conversation ID (important for new conversations)
      if (!activeConversation) {
        setActiveConversation({ _id: conversationId });
      }

      // Add assistant message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: assistantMessage.content,
        tool_calls: assistantMessage.tool_calls || [],
        created_at: new Date()
      }]);

      // Refresh conversations list
      loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        created_at: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  }, [loading, activeConversation, loadConversations]);

  const deleteConversation = useCallback(async (conversationId) => {
    try {
      await api.delete(`/chat/conversations/${conversationId}`);
      setConversations(prev => prev.filter(c => c._id !== conversationId));
      if (activeConversation?._id === conversationId) {
        newConversation();
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  }, [activeConversation, newConversation]);

  const checkGoogleConnection = useCallback(async () => {
    try {
      const res = await api.get('/auth/google/status');
      setGoogleConnected(res.data.connected);
    } catch (error) {
      setGoogleConnected(false);
    }
  }, []);

  const connectGoogle = useCallback(async () => {
    try {
      const res = await api.get('/auth/google');
      if (res.data.authUrl) {
        window.location.href = res.data.authUrl;
      }
    } catch (error) {
      console.error('Error connecting Google:', error);
    }
  }, []);

  const value = {
    isOpen,
    togglePanel,
    openPanel,
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
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
