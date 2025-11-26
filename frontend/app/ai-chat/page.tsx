'use client';

import { useState } from 'react';
import ChatWindow from '@/components/ai-chat/ChatWindow';
import ChatInput from '@/components/ai-chat/ChatInput';
import { useChatMessage } from '@/hooks/useAI';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  timestamp: Date;
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const { chat, loading } = useChatMessage();

  const handleSendMessage = async (message: string) => {
    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: 'USER',
      content: message,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await chat({
        messages: [
          {
            role: 'USER',
            content: message,
            timestamp: new Date().toISOString(),
          }
        ],
        userId: undefined,
        context: {
          conversationId: conversationId || undefined,
        },
        options: {
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 1000,
        },
      });

      if (response) {
        if (response.conversationId) {
          setConversationId(response.conversationId);
        }

        const assistantMessage: Message = {
          id: `${Date.now()}-assistant`,
          role: response.role,
          content: response.message,
          timestamp: new Date(response.timestamp),
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch {
      // Handle error silently or use proper error handling
      const errorMessage: Message = {
        id: `${Date.now()}-error`,
        role: 'ASSISTANT',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setConversationId(null);
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(null);
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-full max-h-[calc(100vh-200px)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Assistant</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Chat with AI to get insights about your data and system
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleNewChat}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            New Chat
          </button>
          <button
            onClick={handleClearChat}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Clear Chat
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <ChatWindow messages={messages} loading={loading} />
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <ChatInput 
            onSendMessage={handleSendMessage} 
            disabled={loading}
          />
        </div>
      </div>

      {conversationId && (
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Conversation ID: {conversationId}
          {messages.length > 0 && (
            <span className="ml-4">Messages: {messages.length}</span>
          )}
        </div>
      )}
    </div>
    </ProtectedRoute>
  );
}
