import axios from 'axios';

const API_KEYS = [
  "sk-3uojvVgjgi1BMJXTRPy7J3e28HwrTat0jgncVNjcKwFdUi18",
  "sk-FRktfYnFfa7GCWAil3w46nDsdIQeFn16MqizBBx9dFyxYGeS",
  "sk-RQZgboXx1p8V31BtF1lyM1e8MoD9w0UvHlwHPjSZYI78a5zN",
];

const BASE_URL = "https://samuraiapi.in/v1/chat/completions";

const MODELS = [
  "sonar(clinesp)",
  "groq/moonshotai/kimi-k2-instruct",
  "sonar-reasoning-pro(clinesp)",
  "sonar-reasoning(clinesp)",
];

let currentKeyIndex = 0;
let failedKeys = new Set();

function getNextApiKey() {
  // Reset failed keys if all have failed
  if (failedKeys.size >= API_KEYS.length) {
    failedKeys.clear();
  }

  let attempts = 0;
  while (attempts < API_KEYS.length) {
    const key = API_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    
    if (!failedKeys.has(key)) {
      return key;
    }
    attempts++;
  }
  
  // If all keys have failed, return the first one and reset
  failedKeys.clear();
  return API_KEYS[0];
}

export async function sendChatMessage(messages, model = MODELS[0], retryCount = 0) {
  const maxRetries = API_KEYS.length;
  
  try {
    const apiKey = getNextApiKey();
    
    console.log(`Sending message with model: ${model}, attempt: ${retryCount + 1}`);
    
    const response = await axios.post(BASE_URL, {
      model: model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2048,
      stream: false
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    if (response.data && response.data.choices && response.data.choices[0]) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('Invalid response format from API');
    }
  } catch (error) {
    console.error('Chat API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      attempt: retryCount + 1
    });
    
    // Mark current key as failed if it's an auth error
    if (error.response?.status === 401 || error.response?.status === 403) {
      const currentKey = API_KEYS[currentKeyIndex === 0 ? API_KEYS.length - 1 : currentKeyIndex - 1];
      failedKeys.add(currentKey);
    }
    
    // Retry with next API key if available
    if (retryCount < maxRetries - 1) {
      console.log(`Retrying with next API key...`);
      return sendChatMessage(messages, model, retryCount + 1);
    }
    
    // If all retries failed, throw a user-friendly error
    throw new Error('Unable to get response from AI service. Please try again later.');
  }
}

export { MODELS };