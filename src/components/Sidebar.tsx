import React, { useState } from 'react';
import { PlusIcon, MessageCircleIcon, TrashIcon, UserIcon, LogOutIcon, SettingsIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Chat } from '../types';

interface SidebarProps {
  chats: Chat[];
  currentChatId: number | null;
  onSelectChat: (chatId: number) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: number) => void;
  onShowSettings: () => void;
}

export default function Sidebar({
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onShowSettings,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const [hoveredChat, setHoveredChat] = useState<number | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const truncateTitle = (title: string, maxLength: number = 25) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all shadow-sm"
        >
          <PlusIcon className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">New Chat</span>
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {chats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageCircleIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No chats yet</p>
              <p className="text-xs text-gray-400 mt-1">Start a new conversation</p>
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                className={`group relative flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all ${
                  currentChatId === chat.id
                    ? 'bg-white border border-gray-200 shadow-sm'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => onSelectChat(chat.id)}
                onMouseEnter={() => setHoveredChat(chat.id)}
                onMouseLeave={() => setHoveredChat(null)}
              >
                <MessageCircleIcon className="w-4 h-4 text-gray-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {truncateTitle(chat.title)}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <span>{formatDate(chat.updated_at)}</span>
                    {chat.message_count > 0 && (
                      <>
                        <span>•</span>
                        <span>{chat.message_count} messages</span>
                      </>
                    )}
                  </div>
                </div>
                {hoveredChat === chat.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete chat"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="mb-3">
          <button
            onClick={onShowSettings}
            className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
          >
            <SettingsIcon className="w-4 h-4" />
            <span className="text-sm">Settings</span>
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
              <UserIcon className="w-4 h-4 text-gray-600" />
            </div>
            <span className="text-sm font-medium text-gray-900 truncate">
              {user?.username}
            </span>
          </div>
          <button
            onClick={logout}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Logout"
          >
            <LogOutIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}