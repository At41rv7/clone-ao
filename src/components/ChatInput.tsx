import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, Settings2Icon } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string, model: string) => void;
  loading: boolean;
  models: string[];
}

export default function ChatInput({ onSendMessage, loading, models }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [showModelSelect, setShowModelSelect] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      setSelectedModel(models[0]);
    }
  }, [models, selectedModel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !loading && selectedModel) {
      onSendMessage(message.trim(), selectedModel);
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  return (
    <div className="border-t border-gray-200 bg-white">
      <div className="max-w-4xl mx-auto p-4">
        {showModelSelect && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Settings2Icon className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">AI Model</span>
            </div>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
            >
              {models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-gray-500">
              Different models may provide varying response styles and capabilities.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
              rows={1}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowModelSelect(!showModelSelect)}
              className={`absolute right-3 top-3 p-1 transition-colors ${
                showModelSelect 
                  ? 'text-gray-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Model Settings"
            >
              <Settings2Icon className="w-4 h-4" />
            </button>
          </div>
          
          <button
            type="submit"
            disabled={!message.trim() || loading || !selectedModel}
            className="p-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0 shadow-sm"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <SendIcon className="w-4 h-4" />
            )}
          </button>
        </form>

        {selectedModel && (
          <div className="mt-2 text-xs text-gray-500">
            Using: <span className="font-medium">{selectedModel}</span>
          </div>
        )}
      </div>
    </div>
  );
}