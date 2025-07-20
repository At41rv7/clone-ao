import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase } from './database.js';
import { createUser, authenticateUser, generateToken, requireAuth } from './auth.js';
import { 
  createChat, 
  getUserChats, 
  getChatMessages, 
  processUserMessage, 
  deleteChat 
} from './chatController.js';
import { MODELS, sendChatMessage } from './chatService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Initialize database on startup
initializeDatabase();

// Auth routes
app.post('/api/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await createUser(username, password);
    const token = generateToken(user);
    
    res.json({ user, token });
  } catch (error) {
    if (error.message === 'Username already exists') {
      res.status(409).json({ error: error.message });
    } else {
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await authenticateUser(username, password);
    const token = generateToken(user);
    
    res.json({ user, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message });
  }
});

// Chat routes
app.get('/api/models', (req, res) => {
  res.json({ models: MODELS });
});

// Guest chat route
app.post('/api/guest/chat', async (req, res) => {
  try {
    const { message, model, history } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Prepare messages for API (include history for context)
    const apiMessages = [
      ...(history || []).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    const response = await sendChatMessage(apiMessages, model || MODELS[0]);
    res.json({ response });
  } catch (error) {
    console.error('Guest chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/chats', requireAuth, async (req, res) => {
  try {
    const { title } = req.body;
    const chat = await createChat(req.user.id, title);
    res.json(chat);
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

app.get('/api/chats', requireAuth, async (req, res) => {
  try {
    const chats = await getUserChats(req.user.id);
    res.json(chats);
  } catch (error) {
    console.error('Fetch chats error:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

app.get('/api/chats/:chatId/messages', requireAuth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const messages = await getChatMessages(parseInt(chatId), req.user.id);
    res.json(messages);
  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(403).json({ error: error.message });
  }
});

app.post('/api/chats/:chatId/messages', requireAuth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { message, model } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const aiMessage = await processUserMessage(
      parseInt(chatId), 
      req.user.id, 
      message, 
      model || MODELS[0]
    );
    
    res.json(aiMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/chats/:chatId', requireAuth, async (req, res) => {
  try {
    const { chatId } = req.params;
    await deleteChat(parseInt(chatId), req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(403).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});