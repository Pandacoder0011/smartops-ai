import { Server } from 'socket.io';
import { clerkClient } from '@clerk/express';
import User from '../models/User.js';
import AIChat from '../models/AIChat.js';
import { executeAgentChat } from '../services/aiAgentService.js';
import mongoose from 'mongoose';

let ioInstance = null;
const socketUserMap = new Map(); // socket.id -> User info object
const mockSocketChatSessions = []; // in-memory chat session logs when DB is offline

export const initSocket = (server) => {
  const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map(url => url.trim())
    : ['http://localhost:5173'];

  ioInstance = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? (allowedOrigins.includes('*') ? '*' : allowedOrigins)
        : '*',
      methods: ['GET', 'POST']
    }
  });

  // Clerk handshake authentication middleware
  ioInstance.use(async (socket, next) => {
    try {
      // Retrieve token from connection parameters: auth object or query params or authorization headers
      const token = socket.handshake.auth?.token || 
                    socket.handshake.query?.token ||
                    socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        console.warn(`⚠️ Socket connection handshake rejected: No token provided 🔑 [Socket ID: ${socket.id}]`);
        return next(new Error('Authentication failed: Token is required for secure telemetry 🚨'));
      }

      // Verify token with Clerk
      const decoded = await clerkClient.verifyToken(token);
      
      let user = null;
      if (mongoose.connection.readyState === 1 && decoded.sub) {
        try {
          user = await User.findOne({ clerkId: decoded.sub }).select('-password');
        } catch (dbErr) {
          console.error('⚠️ MongoDB Query Error during Socket auth:', dbErr.message);
        }
      }

      // Attach user profile with fallback for offline database or webhook delay
      socket.user = user || {
        _id: decoded.sub, // fallback ID
        clerkId: decoded.sub,
        name: 'Demo Admin',
        email: 'admin@smartops.ai',
        role: 'admin',
        company: 'SmartOps AI',
        workspaceId: 'workspace-12345'
      };

      next();
    } catch (error) {
      console.error(`🔴 Socket auth error during handshake [Socket ID: ${socket.id}]:`, error.message);
      return next(new Error(`Authentication failed: Invalid token credentials (${error.message}) 🚨`));
    }
  });

  ioInstance.on('connection', (socket) => {
    const userIdStr = socket.user._id.toString();
    console.log(`🟢 Socket client connected: ${socket.id} | User: ${socket.user.name} (ID: ${userIdStr})`);

    // Join user-specific room for scoped notifications/events
    socket.join(`user:${userIdStr}`);

    // Track active connection
    socketUserMap.set(socket.id, {
      _id: socket.user._id,
      name: socket.user.name,
      email: socket.user.email,
      role: socket.user.role,
      company: socket.user.company,
      avatar: socket.user.avatar || ''
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

        // Fetch or create user chat session (offline aware)
        let chatSession;
        if (mongoose.connection.readyState !== 1) {
          chatSession = mockSocketChatSessions.find(s => s.userId === userId.toString());
          if (!chatSession) {
            chatSession = { userId: userId.toString(), messages: [] };
            mockSocketChatSessions.push(chatSession);
          }
        } else {
          chatSession = await AIChat.findOne({ owner: userId, userId });
          if (!chatSession) {
            chatSession = await AIChat.create({ owner: userId, userId, messages: [] });
          }
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

        const finalAnswer = await executeAgentChat(prompt, contextHistory, onStreamChunk, userId);

        // Store back
        chatSession.messages.push({ role: 'user', content: prompt, timestamp: new Date() });
        chatSession.messages.push({ role: 'assistant', content: finalAnswer, timestamp: new Date() });
        
        if (mongoose.connection.readyState === 1) {
          await chatSession.save();
        }

        // Notify client stream completion
        socket.emit('ai-response-stream', { done: true });
        console.log(`✅ Streamed response completed for ${socket.user.name}`);
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

// 'new-sale' - Broadcast to owner's room
export const emitNewSale = (sale, ownerId) => {
  if (ioInstance && sale) {
    const userRoom = ownerId ? ownerId.toString() : (sale.owner ? sale.owner.toString() : null);
    if (userRoom) {
      console.log(`📣 Broadcasting event 'new-sale' to room user:${userRoom} for Sale ID: ${sale._id}`);
      ioInstance.to(`user:${userRoom}`).emit('new-sale', sale);
    } else {
      console.log(`📣 Broadcasting event 'new-sale' globally for Sale ID: ${sale._id}`);
      ioInstance.emit('new-sale', sale);
    }
  }
};

// 'low-stock-alert' - Push low stock notifications to owner's room
export const emitLowStockAlert = (product, ownerId) => {
  if (ioInstance && product) {
    const userRoom = ownerId ? ownerId.toString() : (product.owner ? product.owner.toString() : null);
    if (userRoom) {
      console.log(`📣 Broadcasting event 'low-stock-alert' to room user:${userRoom} for Product: ${product.name}`);
      ioInstance.to(`user:${userRoom}`).emit('low-stock-alert', product);
    } else {
      console.log(`📣 Broadcasting event 'low-stock-alert' globally for Product: ${product.name}`);
      ioInstance.emit('low-stock-alert', product);
    }
  }
};

// 'dashboard-update' - Live dashboard metrics (broadcast globally since metrics are global)
export const emitDashboardUpdate = (metric) => {
  if (ioInstance) {
    console.log(`📣 Broadcasting event 'dashboard-update' for Metric: ${metric.name}`);
    ioInstance.emit('dashboard-update', metric);
  }
};
