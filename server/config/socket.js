import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AIChat from '../models/AIChat.js';
import { executeAgentChat } from '../services/aiAgentService.js';

let ioInstance = null;
const socketUserMap = new Map(); // socket.id -> User info object

export const initSocket = (server) => {
  ioInstance = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // JWT handshake authentication middleware
  ioInstance.use(async (socket, next) => {
    try {
      // Retrive token from connection parameters: auth object or query params or authorization headers
      const token = socket.handshake.auth?.token || 
                    socket.handshake.query?.token ||
                    socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        console.warn(`⚠️ Socket connection handshake rejected: No token provided 🔑 [Socket ID: ${socket.id}]`);
        return next(new Error('Authentication failed: Token is required for secure telemetry 🚨'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smartops_jwt_secret_dev_key');
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        console.warn(`⚠️ Socket connection handshake rejected: User not found [Socket ID: ${socket.id}]`);
        return next(new Error('Authentication failed: Authorized user profile not found 🚨'));
      }

      socket.user = user;
      next();
    } catch (error) {
      console.error(`🔴 Socket auth error during handshake [Socket ID: ${socket.id}]:`, error.message);
      return next(new Error(`Authentication failed: Invalid token credentials (${error.message}) 🚨`));
    }
  });

  ioInstance.on('connection', (socket) => {
    console.log(`🟢 Socket client connected: ${socket.id} | User: ${socket.user.name} (${socket.user.email})`);

    // Track active connection
    socketUserMap.set(socket.id, {
      _id: socket.user._id,
      name: socket.user.name,
      email: socket.user.email,
      role: socket.user.role,
      company: socket.user.company,
      avatar: socket.user.avatar
    });

    // Broadcast updated list of online users
    broadcastOnlineUsers();

    // AI message handler for direct socket chat streaming
    socket.on('ai-chat-message', async (data) => {
      const { prompt } = data;
      if (!prompt) {
        socket.emit('ai-response-stream', { error: 'Please supply a query prompt 📝' });
        return;
      }

      console.log(`✉️ Received AI chat request via Socket from ${socket.user.name}: "${prompt}"`);

      try {
        const userId = socket.user._id;

        // Fetch or create user chat session
        let chatSession = await AIChat.findOne({ userId });
        if (!chatSession) {
          chatSession = await AIChat.create({ userId, messages: [] });
        }

        // Limit context history to last 10 messages
        const contextHistory = chatSession.messages.slice(-10).map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        let fullAssistantResponse = '';

        // Chunk stream callback
        const onStreamChunk = (chunk) => {
          fullAssistantResponse += chunk;
          socket.emit('ai-response-stream', { chunk });
        };

        const finalAnswer = await executeAgentChat(prompt, contextHistory, onStreamChunk);

        // Store back to DB
        chatSession.messages.push({ role: 'user', content: prompt, timestamp: new Date() });
        chatSession.messages.push({ role: 'assistant', content: finalAnswer, timestamp: new Date() });
        await chatSession.save();

        // Notify client stream completion
        socket.emit('ai-response-stream', { done: true });
        console.log(`✅ Streamed response completed and saved to database for ${socket.user.name}`);
      } catch (error) {
        console.error('🔴 Socket AI message streaming failure:', error.message);
        socket.emit('ai-response-stream', { error: `Gemini processing error: ${error.message}` });
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔴 Socket client disconnected: ${socket.id} | User: ${socket.user.name}`);
      
      // Clean registry
      socketUserMap.delete(socket.id);
      
      // Broadcast updated list
      broadcastOnlineUsers();
    });
  });

  return ioInstance;
};

export const getIO = () => {
  return ioInstance;
};

// ==========================================
// Helper functions for real-time events
// ==========================================

const broadcastOnlineUsers = () => {
  if (!ioInstance) return;

  // Compute unique online users
  const uniqueUsers = [];
  const seenIds = new Set();

  for (const user of socketUserMap.values()) {
    const idStr = user._id.toString();
    if (!seenIds.has(idStr)) {
      seenIds.add(idStr);
      uniqueUsers.push(user);
    }
  }

  console.log(`👥 Online users count: ${uniqueUsers.length}`);
  ioInstance.emit('user-online', uniqueUsers);
};

// 'new-sale' - Broadcast when sale is made
export const emitNewSale = (sale) => {
  if (ioInstance) {
    console.log(`📣 Broadcasting event 'new-sale' for Sale ID: ${sale._id}`);
    ioInstance.emit('new-sale', sale);
  }
};

// 'low-stock-alert' - Push low stock notifications
export const emitLowStockAlert = (product) => {
  if (ioInstance) {
    console.log(`📣 Broadcasting event 'low-stock-alert' for Product: ${product.name} (Stock: ${product.stock})`);
    ioInstance.emit('low-stock-alert', product);
  }
};

// 'dashboard-update' - Live dashboard metrics
export const emitDashboardUpdate = (metric) => {
  if (ioInstance) {
    console.log(`📣 Broadcasting event 'dashboard-update' for Metric: ${metric.name}`);
    ioInstance.emit('dashboard-update', metric);
  }
};
