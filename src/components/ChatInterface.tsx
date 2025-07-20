import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Chat, Message } from '../types';
import Sidebar from './Sidebar';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { MessageCircleIcon, SettingsIcon } from 'lucide-react';
import Settings from './Settings';

export default function ChatInterface() {
  const { user, token } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  if (showSettings) {
    return <Settings onBack={() => setShowSettings(false)} />;
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchChats();
    fetchModels();
  }, []);

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const fullUrl = url.startsWith('http') ? url : `http://localhost:3001${url}`;
    return fetch(fullUrl, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  };

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

  const fetchChats = async () => {
    try {
      const response = await fetchWithAuth('/api/chats');
      if (response.ok) {
        const data = await response.json();
        setChats(data);
      }
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    }
  };

  const fetchMessages = async (chatId: number) => {
    try {
      const response = await fetchWithAuth(`/api/chats/${chatId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const createNewChat = async () => {
    try {
      const response = await fetchWithAuth('/api/chats', {
        method: 'POST',
        body: JSON.stringify({ title: 'New Chat' }),
      });
      if (response.ok) {
        const newChat = await response.json();
        setChats([newChat, ...chats]);
        setCurrentChat(newChat);
        setMessages([]);
        setError(null);
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
      setError('Failed to create new chat');
    }
  };

  const selectChat = (chatId: number) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setCurrentChat(chat);
      fetchMessages(chatId);
      setError(null);
    }
  };

  const deleteChat = async (chatId: number) => {
    try {
      const response = await fetchWithAuth(`/api/chats/${chatId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setChats(chats.filter(c => c.id !== chatId));
        if (currentChat?.id === chatId) {
          setCurrentChat(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
      setError('Failed to delete chat');
    }
  };

  const sendMessage = async (messageContent: string, model: string) => {
    let chatToUse = currentChat;

    // Create new chat if none exists
    if (!chatToUse) {
      try {
        const response = await fetchWithAuth('/api/chats', {
          method: 'POST',
          body: JSON.stringify({ title: 'New Chat' }),
        });
        if (response.ok) {
          chatToUse = await response.json();
          setCurrentChat(chatToUse);
          setChats([chatToUse, ...chats]);
        } else {
          throw new Error('Failed to create chat');
        }
      } catch (error) {
        console.error('Failed to create chat:', error);
        setError('Failed to create new chat');
        return;
      }
    }

    setLoading(true);
    setError(null);

    // Add user message immediately
    const userMessage: Message = {
      id: Date.now(),
      chat_id: chatToUse.id,
      content: messageContent,
      role: 'user',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetchWithAuth(`/api/chats/${chatToUse.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message: messageContent, model }),
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

      const aiMessage = await response.json();
      setMessages(prev => [...prev, aiMessage]);
      
      // Update chat list
      await fetchChats();
    } catch (error) {
      console.error('Failed to send message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
      // Remove user message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-white">
      <Sidebar
        chats={chats}
        currentChatId={currentChat?.id || null}
        onSelectChat={selectChat}
        onNewChat={createNewChat}
        onDeleteChat={deleteChat}
        onShowSettings={() => setShowSettings(true)}
      />
      
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
                  Welcome to AI Chat
                </h2>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Start a conversation by typing a message below. You can choose from multiple AI models to get different perspectives and responses.
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