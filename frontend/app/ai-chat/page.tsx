'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import ChatWindow from '@/components/ai-chat/ChatWindow';
import ChatInput from '@/components/ai-chat/ChatInput';

// GraphQL Mutation for sending chat messages
const SEND_CHAT_MESSAGE = gql`
  mutation SendChatMessage($input: ChatRequestInput!) {
    chat(input: $input) {
      message
      role
      conversationId
      tokensUsed
      model
      timestamp
    }
  }
`;

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ChatResponse {
  chat: {
    message: string;
    role: 'user' | 'assistant' | 'system';
    conversationId?: string;
    tokensUsed?: number;
    model?: string;
    timestamp: string;
  };
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const [sendMessage, { loading }] = useMutation<ChatResponse>(SEND_CHAT_MESSAGE, {
    onCompleted: (data) => {
      const response = data.chat;
      const assistantMessage: Message = {
        id: `${Date.now()}-assistant`,
        role: response.role,
        content: response.message,
        timestamp: new Date(response.timestamp),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      
      if (response.conversationId) {
        setConversationId(response.conversationId);
      }
    },
    onError: (error) => {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `${Date.now()}-error`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Add user message to chat
    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Send message to API
    try {
      await sendMessage({
        variables: {
          input: {
            message: content,
            conversationId,
            context: {},
          },
        },
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setConversationId(null);
  };

  return (
    <div className="container mx-auto h-[calc(100vh-120px)] flex flex-col">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg flex flex-col h-full">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">AI Assistant</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ask me anything about your data and metrics
            </p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Clear Chat
            </button>
          )}
        </div>

        {/* Chat Window */}
        <ChatWindow messages={messages} loading={loading} />

        {/* Chat Input */}
        <ChatInput onSendMessage={handleSendMessage} disabled={loading} />
      </div>
    </div>
  );
}
