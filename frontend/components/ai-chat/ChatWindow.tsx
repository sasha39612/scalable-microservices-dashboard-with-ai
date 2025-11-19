'use client';

import { useEffect, useRef } from 'react';
import { Message } from '@/app/ai-chat/page';

interface ChatWindowProps {
  messages: Message[];
  loading: boolean;
}

export default function ChatWindow({ messages, loading }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className='flex-1 overflow-y-auto p-4 space-y-4'>
      {messages.length === 0 ? (
        <div className='flex flex-col items-center justify-center h-full text-center'>
          <div className='mb-4'>
            <svg
              className='w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z'
              />
            </svg>
          </div>
          <h2 className='text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2'>
            {'Start a conversation'}
          </h2>
          <p className='text-gray-500 dark:text-gray-400 max-w-md'>
            {'Ask questions about your metrics, request insights, or get AI-powered analysis of your data.'}
          </p>
          <div className='mt-6 grid grid-cols-1 gap-2 text-sm text-left'>
            <div className='bg-gray-100 dark:bg-gray-700 p-3 rounded-lg'>
              💡 {'What are my top performing metrics this week?'}
            </div>
            <div className='bg-gray-100 dark:bg-gray-700 p-3 rounded-lg'>
              📊 {'Analyze user engagement trends'}
            </div>
            <div className='bg-gray-100 dark:bg-gray-700 p-3 rounded-lg'>
              🔍 {'Show me insights about recent anomalies'}
            </div>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'USER' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-4 ${
                  message.role === 'USER'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                }`}
              >
                <div className='flex items-start gap-2'>
                  {message.role === 'ASSISTANT' && (
                    <div className='flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold'>
                      AI
                    </div>
                  )}
                  <div className='flex-1'>
                    <p className='whitespace-pre-wrap break-words'>{message.content}</p>
                    <p
                      className={`text-xs mt-2 ${
                        message.role === 'USER'
                          ? 'text-blue-200'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className='flex justify-start'>
              <div className='max-w-[70%] rounded-lg p-4 bg-gray-200 dark:bg-gray-700'>
                <div className='flex items-center gap-2'>
                  <div className='flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold'>
                    AI
                  </div>
                  <div className='flex gap-1'>
                    <div className='w-2 h-2 bg-gray-500 rounded-full animate-bounce' style={{ animationDelay: '0ms' }}></div>
                    <div className='w-2 h-2 bg-gray-500 rounded-full animate-bounce' style={{ animationDelay: '150ms' }}></div>
                    <div className='w-2 h-2 bg-gray-500 rounded-full animate-bounce' style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}
