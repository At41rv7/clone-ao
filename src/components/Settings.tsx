import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  SettingsIcon, 
  UserIcon, 
  BotIcon, 
  PaletteIcon, 
  DatabaseIcon,
  LogOutIcon,
  ArrowLeftIcon,
  SaveIcon
} from 'lucide-react';

interface SettingsProps {
  onBack: () => void;
}

export default function Settings({ onBack }: SettingsProps) {
  const { user, isGuest, logout } = useAuth();
  const [selectedModel, setSelectedModel] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [autoSave, setAutoSave] = useState(true);
  const [messageLimit, setMessageLimit] = useState(50);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    fetchModels();
    loadSettings();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/models');
      if (response.ok) {
        const data = await response.json();
        setModels(data.models);
        if (data.models.length > 0 && !selectedModel) {
          setSelectedModel(data.models[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    }
  };

  const loadSettings = () => {
    const savedModel = localStorage.getItem('preferredModel');
    const savedAutoSave = localStorage.getItem('autoSave');
    const savedMessageLimit = localStorage.getItem('messageLimit');
    const savedTheme = localStorage.getItem('theme');

    if (savedModel) setSelectedModel(savedModel);
    if (savedAutoSave) setAutoSave(savedAutoSave === 'true');
    if (savedMessageLimit) setMessageLimit(parseInt(savedMessageLimit));
    if (savedTheme) setTheme(savedTheme);
  };

  const saveSettings = () => {
    localStorage.setItem('preferredModel', selectedModel);
    localStorage.setItem('autoSave', autoSave.toString());
    localStorage.setItem('messageLimit', messageLimit.toString());
    localStorage.setItem('theme', theme);
    
    // Show success message
    const button = document.getElementById('save-button');
    if (button) {
      button.textContent = 'Saved!';
      setTimeout(() => {
        button.textContent = 'Save Settings';
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <SettingsIcon className="w-6 h-6 text-gray-700" />
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Account Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <UserIcon className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-900">Account</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    {isGuest ? 'Guest User' : user?.username}
                  </p>
                  <p className="text-sm text-gray-600">
                    {isGuest ? 'Using guest mode - chats are not saved' : 'Registered user with chat history'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isGuest ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                  <span className="text-sm text-gray-600">
                    {isGuest ? 'Guest' : 'Authenticated'}
                  </span>
                </div>
              </div>
              
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
              >
                <LogOutIcon className="w-4 h-4" />
                {isGuest ? 'Exit Guest Mode' : 'Sign Out'}
              </button>
            </div>
          </div>

          {/* AI Model Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <BotIcon className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-900">AI Model</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                >
                  {models.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  This model will be used by default for new conversations
                </p>
              </div>
            </div>
          </div>

          {/* Chat Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <DatabaseIcon className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-900">Chat Settings</h2>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Auto-save conversations</p>
                  <p className="text-sm text-gray-600">
                    Automatically save your chat history {isGuest ? '(requires account)' : ''}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSave && !isGuest}
                    onChange={(e) => setAutoSave(e.target.checked)}
                    disabled={isGuest}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600 disabled:opacity-50"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message History Limit
                </label>
                <input
                  type="number"
                  min="10"
                  max="200"
                  value={messageLimit}
                  onChange={(e) => setMessageLimit(parseInt(e.target.value))}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Maximum number of messages to keep in context
                </p>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <PaletteIcon className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-900">Appearance</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Theme
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`px-4 py-2 rounded-lg border transition-all ${
                      theme === 'light'
                        ? 'border-gray-500 bg-gray-100 text-gray-900'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`px-4 py-2 rounded-lg border transition-all ${
                      theme === 'dark'
                        ? 'border-gray-500 bg-gray-100 text-gray-900'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    disabled
                  >
                    Dark (Coming Soon)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              id="save-button"
              onClick={saveSettings}
              className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
            >
              <SaveIcon className="w-4 h-4" />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}