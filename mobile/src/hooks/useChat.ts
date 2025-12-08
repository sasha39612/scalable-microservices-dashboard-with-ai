import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage, ChatSession, ChatState, SendMessageRequest } from '../types/chat';

const CHAT_STORAGE_KEY = '@chat_data';
const API_BASE_URL = 'http://localhost:3000'; // Adjust based on your API gateway URL

export const useChat = () => {
  const [state, setState] = useState<ChatState>({
    messages: [],
    sessions: [],
    currentSessionId: null,
    isLoading: false,
    error: null,
  });

  // Load chat data from AsyncStorage
  const loadChatData = useCallback(async () => {
    try {
      const storedData = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setState(prev => ({
          ...prev,
          sessions: parsedData.sessions || [],
          currentSessionId: parsedData.currentSessionId || null,
        }));
      }
    } catch {
      // Silently handle AsyncStorage errors
      // In production, you might want to log to a crash reporting service
    }
  }, []);

  // Save chat data to AsyncStorage
  const saveChatData = useCallback(async (sessions: ChatSession[], currentSessionId: string | null) => {
    try {
      const dataToSave = {
        sessions,
        currentSessionId,
        lastUpdated: new Date().toISOString(),
      };
      await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch {
      // Silently handle AsyncStorage errors
      // In production, you might want to log to a crash reporting service
    }
  }, []);

  // Create a new chat session
  const createSession = useCallback(() => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setState(prev => {
      const newSessions = [...prev.sessions, newSession];
      saveChatData(newSessions, newSession.id);
      return {
        ...prev,
        sessions: newSessions,
        currentSessionId: newSession.id,
        messages: [],
      };
    });

    return newSession.id;
  }, [saveChatData]);

  // Load messages for a specific session
  const loadSessionMessages = useCallback(async (sessionId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // In a real app, this would fetch from your API
      // For now, we'll simulate with empty messages
      setState(prev => ({
        ...prev,
        currentSessionId: sessionId,
        messages: [], // Would load from API/storage
        isLoading: false,
      }));
    } catch {
      setState(prev => ({
        ...prev,
        error: 'Failed to load session messages',
        isLoading: false,
      }));
    }
  }, []);

  // Send a message to AI
  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim()) return;

    const currentSessionId = state.currentSessionId || createSession();
    
    // Create user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: messageText.trim(),
      sender: 'user',
      timestamp: new Date(),
      status: 'sent',
    };

    // Add user message immediately
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      // Send to AI service
      const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication headers if needed
        },
        body: JSON.stringify({
          message: messageText,
          sessionId: currentSessionId,
        } as SendMessageRequest),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Create AI response message
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: data.response || 'Sorry, I encountered an error processing your request.',
        sender: 'ai',
        timestamp: new Date(),
        status: 'sent',
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, aiMessage],
        isLoading: false,
      }));

      // Update session with last message
      setState(prev => {
        const updatedSessions = prev.sessions.map(session =>
          session.id === currentSessionId
            ? {
                ...session,
                lastMessage: aiMessage,
                updatedAt: new Date(),
                title: prev.messages.length === 0 ? messageText.slice(0, 30) + '...' : session.title,
              }
            : session
        );
        saveChatData(updatedSessions, currentSessionId);
        return {
          ...prev,
          sessions: updatedSessions,
        };
      });

    } catch {
      // Handle API errors gracefully
      setState(prev => ({
        ...prev,
        error: 'Failed to send message. Please try again.',
        isLoading: false,
      }));
    }
  }, [state.currentSessionId, createSession, saveChatData]);

  // Clear current chat
  const clearCurrentChat = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
    }));
  }, []);

  // Delete a session
  const deleteSession = useCallback((sessionId: string) => {
    setState(prev => {
      const filteredSessions = prev.sessions.filter(s => s.id !== sessionId);
      const newCurrentSessionId = prev.currentSessionId === sessionId 
        ? (filteredSessions.length > 0 ? filteredSessions[0].id : null)
        : prev.currentSessionId;
      
      saveChatData(filteredSessions, newCurrentSessionId);
      
      return {
        ...prev,
        sessions: filteredSessions,
        currentSessionId: newCurrentSessionId,
        messages: newCurrentSessionId === prev.currentSessionId ? prev.messages : [],
      };
    });
  }, [saveChatData]);

  // Initialize chat data on mount
  useEffect(() => {
    loadChatData();
  }, [loadChatData]);

  return {
    ...state,
    sendMessage,
    createSession,
    loadSessionMessages,
    clearCurrentChat,
    deleteSession,
  };
};