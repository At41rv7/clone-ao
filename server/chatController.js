import pool from './database.js';
import { sendChatMessage } from './chatService.js';

export async function createChat(userId, title = 'New Chat') {
  try {
    const result = await pool.query(
      'INSERT INTO chats (user_id, title) VALUES ($1, $2) RETURNING *',
      [userId, title]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Create chat error:', error);
    throw error;
  }
}

export async function getUserChats(userId) {
  try {
    const result = await pool.query(`
      SELECT c.*, 
             COUNT(m.id) as message_count,
             MAX(m.created_at) as last_message_at
      FROM chats c
      LEFT JOIN messages m ON c.id = m.chat_id
      WHERE c.user_id = $1
      GROUP BY c.id, c.user_id, c.title, c.created_at, c.updated_at
      ORDER BY c.updated_at DESC
    `, [userId]);
    return result.rows;
  } catch (error) {
    console.error('Get user chats error:', error);
    throw error;
  }
}

export async function getChatMessages(chatId, userId) {
  try {
    // Verify chat belongs to user
    const chatResult = await pool.query(
      'SELECT id FROM chats WHERE id = $1 AND user_id = $2',
      [chatId, userId]
    );

    if (chatResult.rows.length === 0) {
      throw new Error('Chat not found or access denied');
    }

    const result = await pool.query(
      'SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at ASC',
      [chatId]
    );
    return result.rows;
  } catch (error) {
    console.error('Get chat messages error:', error);
    throw error;
  }
}

export async function addMessage(chatId, userId, content, role, model = null) {
  try {
    // Verify chat belongs to user
    const chatResult = await pool.query(
      'SELECT id FROM chats WHERE id = $1 AND user_id = $2',
      [chatId, userId]
    );

    if (chatResult.rows.length === 0) {
      throw new Error('Chat not found or access denied');
    }

    const result = await pool.query(
      'INSERT INTO messages (chat_id, content, role, model) VALUES ($1, $2, $3, $4) RETURNING *',
      [chatId, content, role, model]
    );

    // Update chat timestamp
    await pool.query(
      'UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [chatId]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Add message error:', error);
    throw error;
  }
}

export async function processUserMessage(chatId, userId, userMessage, model) {
  try {
    // Add user message
    const userMsg = await addMessage(chatId, userId, userMessage, 'user');

    // Get chat history for context (limit to last 20 messages for performance)
    const messages = await pool.query(
      'SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at DESC LIMIT 20',
      [chatId]
    );
    
    // Prepare messages for API (reverse to get chronological order)
    const apiMessages = messages.rows.reverse().map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Get AI response
    const aiResponse = await sendChatMessage(apiMessages, model);

    // Add AI response
    const aiMessage = await addMessage(chatId, userId, aiResponse, 'assistant', model);

    return aiMessage;
  } catch (error) {
    console.error('Process user message error:', error);
    throw error;
  }
}

export async function deleteChat(chatId, userId) {
  try {
    const result = await pool.query(
      'DELETE FROM chats WHERE id = $1 AND user_id = $2 RETURNING *',
      [chatId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Chat not found or access denied');
    }

    return result.rows[0];
  } catch (error) {
    console.error('Delete chat error:', error);
    throw error;
  }
}

export async function updateChatTitle(chatId, userId, title) {
  try {
    const result = await pool.query(
      'UPDATE chats SET title = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING *',
      [title, chatId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Chat not found or access denied');
    }

    return result.rows[0];
  } catch (error) {
    console.error('Update chat title error:', error);
    throw error;
  }
}