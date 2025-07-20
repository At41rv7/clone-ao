// API configuration and utilities
const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = isDevelopment ? 'http://localhost:3001' : '';

// Mock data for production/demo mode
const MOCK_MODELS = [
  "GPT-4 Turbo",
  "Claude 3.5 Sonnet", 
  "Gemini Pro",
  "Llama 2 70B"
];

const MOCK_RESPONSES = [
  "I'm a demo AI assistant. In the full version, I would connect to real AI models to provide intelligent responses to your questions.",
  "This is a demonstration of the chat interface. The actual application would integrate with various AI models to provide helpful responses.",
  "Hello! I'm running in demo mode. In production, this would be connected to powerful AI models that can help with a wide variety of tasks.",
  "This chat application showcases a modern interface for AI conversations. In the live version, you'd get real AI-powered responses.",
  "I'm a placeholder response for the demo. The real application would provide intelligent, contextual responses using advanced AI models."
];

export const apiConfig = {
  baseUrl: API_BASE_URL,
  isDevelopment,
  timeout: 30000
};

export async function fetchModels(): Promise<string[]> {
  if (!isDevelopment) {
    return MOCK_MODELS;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/models`);
    if (response.ok) {
      const data = await response.json();
      return data.models;
    }
  } catch (error) {
    console.warn('Failed to fetch models, using mock data:', error);
  }
  return MOCK_MODELS;
}

export async function sendGuestMessage(message: string, model: string, history: any[] = []): Promise<string> {
  if (!isDevelopment) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Return a random mock response
    const randomIndex = Math.floor(Math.random() * MOCK_RESPONSES.length);
    return MOCK_RESPONSES[randomIndex];
  }

  const response = await fetch(`${API_BASE_URL}/api/guest/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, model, history }),
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
  return data.response;
}

export async function authenticatedFetch(url: string, token: string, options: RequestInit = {}) {
  if (!isDevelopment) {
    throw new Error('Authentication features are only available in development mode');
  }

  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  return fetch(fullUrl, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}