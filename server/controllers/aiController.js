import AIChat from '../models/AIChat.js';
import DashboardMetric from '../models/DashboardMetric.js';
import { executeAgentChat } from '../services/aiAgentService.js';
import geminiAI from '../config/gemini.js';
import mongoose from 'mongoose';

// In-memory fallback chat logs when MongoDB is offline
const mockChatSessions = [];

/**
 * Intelligent Chat with Copilot using SSE Streaming.
 * Connects request context prompts to Gemini API or simulated custom mock buffers.
 * 
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next function.
 * @returns {Promise<void>}
 */
export const chat = async (req, res, next) => {
  const { prompt } = req.body;
  const userId = req.user._id;

  if (!prompt) {
    return res.status(400).json({ success: false, message: 'Please provide a prompt' });
  }

  // Set up Server-Sent Events (SSE) headers for real-time text streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    // 1. Check database connection state
    if (mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(userId)) {
      let chatSession = mockChatSessions.find(s => s.userId === userId.toString());
      if (!chatSession) {
        chatSession = { userId: userId.toString(), messages: [] };
        mockChatSessions.push(chatSession);
      }

      // Keep history context to the last 10 messages
      const contextHistory = chatSession.messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      let fullAssistantResponse = '';
      const onStreamChunk = (chunk) => {
        fullAssistantResponse += chunk;
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      };

      const finalAnswer = await executeAgentChat(prompt, contextHistory, onStreamChunk, userId);

      // Save messages in memory
      chatSession.messages.push({ role: 'user', content: prompt, timestamp: new Date() });
      chatSession.messages.push({ role: 'assistant', content: finalAnswer, timestamp: new Date() });

      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // MongoDB path
    let chatSession = await AIChat.findOne({ owner: userId, userId });
    if (!chatSession) {
      chatSession = await AIChat.create({ owner: userId, userId, messages: [] });
    }

    const contextHistory = chatSession.messages.slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    let fullAssistantResponse = '';
    const onStreamChunk = (chunk) => {
      fullAssistantResponse += chunk;
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    };

    const finalAnswer = await executeAgentChat(prompt, contextHistory, onStreamChunk, userId);

    chatSession.messages.push({ role: 'user', content: prompt, timestamp: new Date() });
    chatSession.messages.push({ role: 'assistant', content: finalAnswer, timestamp: new Date() });
    await chatSession.save();

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('🔴 Chat endpoint failure:', error.message);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
};

/**
 * Generates business intelligence summaries (Anomaly logs, pattern insights, suggestions) using Gemini or mock lists.
 * 
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next function.
 * @returns {Promise<void>}
 */
export const getInsights = async (req, res, next) => {
  const mockData = {
    anomalies: ["Unusually high conversion rate spike noticed during mid-week operations (+11.72%)"],
    insights: ["System health and uptime are highly stable at 99.98%", "Total revenue has crossed $124,500"],
    suggestions: ["Place restock order for out-of-stock items", "Launch weekday promotion to capitalize on high conversions"]
  };

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({ success: true, source: 'mock', data: mockData });
    }

    const metrics = await DashboardMetric.find({});
    
    if (!metrics || metrics.length === 0 || !geminiAI) {
      return res.status(200).json({ success: true, source: 'mock', data: mockData });
    }

    const prompt = `Inspect the following business metrics for anomalies, inventory deficiencies, and write a summary.
Data: ${JSON.stringify(metrics, null, 2)}
Output a JSON object with this shape:
{
  "anomalies": ["list of strings or empty"],
  "insights": ["list of strings"],
  "suggestions": ["list of action steps"]
}`;

    const model = geminiAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    text = text.replace(/```json|```/gi, '').trim();
    const insightsJson = JSON.parse(text);

    return res.status(200).json({ success: true, source: 'database', data: insightsJson });
  } catch (error) {
    console.warn('⚠️ AI Insights generation failed, falling back to mock data:', error.message);
    return res.status(200).json({ success: true, source: 'mock', data: mockData });
  }
};

/**
 * Generates predictive sales trend forecasts for weekly metrics.
 * 
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next function.
 * @returns {Promise<void>}
 */
export const getPrediction = async (req, res, next) => {
  const mockData = [
    { period: 'Week 1', predictedRevenue: 128000, confidence: 95 },
    { period: 'Week 2', predictedRevenue: 132500, confidence: 90 },
    { period: 'Week 3', predictedRevenue: 138000, confidence: 85 },
    { period: 'Week 4', predictedRevenue: 144500, confidence: 80 }
  ];

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({ success: true, source: 'mock', data: mockData });
    }

    const metrics = await DashboardMetric.find({});
    
    if (!metrics || metrics.length === 0 || !geminiAI) {
      return res.status(200).json({ success: true, source: 'mock', data: mockData });
    }

    const prompt = `Analyze these KPI metrics and forecast weekly trends for the next 4 periods.
Data: ${JSON.stringify(metrics, null, 2)}
Output a JSON array containing forecast details:
[
  { "period": "Week 1", "predictedRevenue": 130000, "confidence": 92 },
  { "period": "Week 2", "predictedRevenue": 135000, "confidence": 88 }
]`;

    const model = geminiAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    text = text.replace(/```json|```/gi, '').trim();
    const predictionJson = JSON.parse(text);

    return res.status(200).json({ success: true, source: 'database', data: predictionJson });
  } catch (error) {
    console.warn('⚠️ AI Prediction generation failed, falling back to mock data:', error.message);
    return res.status(200).json({ success: true, source: 'mock', data: mockData });
  }
};

/**
 * Retrieves chat history logs database document session array for the authenticated user.
 * 
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next function.
 * @returns {Promise<void>}
 */
export const getHistory = async (req, res, next) => {
  const userId = req.user._id;

  try {
    if (mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(userId)) {
      const chatSession = mockChatSessions.find(s => s.userId === userId.toString());
      return res.status(200).json({
        success: true,
        count: chatSession?.messages?.length || 0,
        data: chatSession?.messages || []
      });
    }

    const chatSession = await AIChat.findOne({ owner: userId, userId });
    return res.status(200).json({
      success: true,
      count: chatSession?.messages?.length || 0,
      data: chatSession?.messages || []
    });
  } catch (error) {
    console.warn('⚠️ AI History retrieval failed, falling back to mock data:', error.message);
    const chatSession = mockChatSessions.find(s => s.userId === userId.toString());
    return res.status(200).json({
      success: true,
      count: chatSession?.messages?.length || 0,
      data: chatSession?.messages || []
    });
  }
};
