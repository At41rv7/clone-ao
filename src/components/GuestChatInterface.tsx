import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../types';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { MessageCircleIcon, SettingsIcon, UserIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface GuestChatInterfaceProps {
  onShowSettings: () => void;
}

export default function GuestChatInterface({ onShowSettings }: GuestChatInterfaceProps) {
  const { logout } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/models');
      if (response.ok) {
        const data = await response.json();
        setModels(data.models);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    }
  };

  const sendMessage = async (messageContent: string, model: string) => {
    setLoading(true);
    setError(null);

    // Add user message immediately
    const userMessage: Message = {
      id: Date.now(),
      chat_id: 0, // Guest mode doesn't use real chat IDs
      content: messageContent,
      role: 'user',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch('http://localhost:3001/api/guest/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: messageContent, 
          model,
          history: messages.slice(-10) // Send last 10 messages for context
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to send message';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const aiMessage: Message = {
        id: Date.now() + 1,
        chat_id: 0,
        content: data.response,
        role: 'assistant',
        model: model,
        created_at: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
      // Remove user message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <MessageCircleIcon className="w-4 h-4 text-gray-700" />
            </div>
            <span className="font-semibold text-gray-900">Guest Mode</span>
          </div>
          <button
            onClick={clearChat}
            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium text-gray-700"
          >
            Clear Chat
          </button>
        </div>

        {/* Info */}
        <div className="flex-1 p-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-yellow-800 mb-2">Guest Mode</h3>
            <p className="text-sm text-yellow-700">
              Your conversations are not saved. Create an account to save your chat history.
            </p>
          </div>
          
          <div className="text-sm text-gray-600">
            <p className="mb-2">Messages in this session: {messages.length}</p>
            <p>Available models: {models.length}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={onShowSettings}
            className="w-full flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
          >
            <SettingsIcon className="w-4 h-4" />
            <span className="text-sm">Settings</span>
          </button>
          
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
          >
            <UserIcon className="w-4 h-4" />
            <span className="text-sm">Sign In</span>
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md px-4">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6">
                  <MessageCircleIcon className="w-8 h-8 text-gray-700" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Welcome to Guest Mode
                </h2>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Start chatting with AI models without creating an account. Your conversations won't be saved, but you can explore all features.
                </p>
                <div className="text-sm text-gray-500">
                  <p>Available models: {models.length}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto p-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {loading && (
                <div className="flex gap-4 mb-6">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div className="max-w-3xl">
                    <div className="inline-block p-4 rounded-lg bg-white border border-gray-200">
                      <div className="flex items-center gap-2 text-gray-500">
                        <span>AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-200">
            <div className="max-w-4xl mx-auto">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}
        
        {/* Chat Input */}
        <ChatInput
          onSendMessage={sendMessage}
          loading={loading}
          models={models}
        />
      </div>
    </div>
  );
}