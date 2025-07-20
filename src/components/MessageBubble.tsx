import React from 'react';
import { UserIcon, BotIcon } from 'lucide-react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-6`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-gray-700' : 'bg-white border border-gray-200'
      }`}>
        {isUser ? (
          <UserIcon className="w-4 h-4 text-white" />
        ) : (
          <BotIcon className="w-4 h-4 text-gray-600" />
        )}
      </div>
      
      <div className={`max-w-3xl ${isUser ? 'text-right' : 'text-left'}`}>
        <div className={`inline-block p-4 rounded-lg ${
          isUser 
            ? 'bg-gray-700 text-white' 
            : 'bg-white border border-gray-200 shadow-sm'
        }`}>
          <div className="whitespace-pre-wrap leading-relaxed text-sm">
            {message.content}
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
          <span>
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          {message.model && !isUser && (
            <>
              <span>•</span>
              <span className="font-medium">{message.model}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}