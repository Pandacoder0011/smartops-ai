import AIChat from '../models/AIChat.js';
import DashboardMetric from '../models/DashboardMetric.js';
import { executeAgentChat } from '../services/aiAgentService.js';
import geminiAI from '../config/gemini.js';

// @desc    Intelligent Chat with Copilot (SSE Streaming)
// @route   POST /api/ai/chat
// @access  Private
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
    // 1. Fetch chat history or create a new session
    let chatSession = await AIChat.findOne({ userId });
    if (!chatSession) {
      chatSession = await AIChat.create({ userId, messages: [] });
    }

    // Keep history context to the last 10 messages to avoid token bloat
    const contextHistory = chatSession.messages.slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    let fullAssistantResponse = '';

    // 2. Trigger Chat Agent execution
    const onStreamChunk = (chunk) => {
      fullAssistantResponse += chunk;
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    };

    const finalAnswer = await executeAgentChat(prompt, contextHistory, onStreamChunk);

    // 3. Save conversation back to Mongoose
    chatSession.messages.push({ role: 'user', content: prompt, timestamp: new Date() });
    chatSession.messages.push({ role: 'assistant', content: finalAnswer, timestamp: new Date() });
    await chatSession.save();

    // End SSE connection cleanly
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('🔴 Chat endpoint failure:', error.message);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
};

// @desc    Generate business intelligence insights (Anomaly / Suggestions)
// @route   GET /api/ai/insights
// @access  Private
export const getInsights = async (req, res, next) => {
  try {
    const metrics = await DashboardMetric.find({});
    const prompt = `Inspect the following business metrics for anomalies, inventory deficiencies, and write a summary.
Data: ${JSON.stringify(metrics, null, 2)}
Output a JSON object with this shape:
{
  "anomalies": ["list of strings or empty"],
  "insights": ["list of strings"],
  "suggestions": ["list of action steps"]
}`;

    if (!geminiAI) {
      // Mock insights fallback
      return res.status(200).json({
        success: true,
        source: 'mock',
        data: {
          anomalies: ["Unusually high conversion rate spike noticed during mid-week operations (+11.72%)"],
          insights: ["System health and uptime are highly stable at 99.98%", "Total revenue has crossed $124,500"],
          suggestions: ["Place restock order for out-of-stock items", "Launch weekday promotion to capitalize on high conversions"]
        }
      });
    }

    const model = geminiAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    // Sanitize JSON markdown wrapping if present
    text = text.replace(/```json|```/gi, '').trim();
    const insightsJson = JSON.parse(text);

    res.status(200).json({ success: true, source: 'database', data: insightsJson });
  } catch (error) {
    next(error);
  }
};

// @desc    Predict sales trends / operational forecasts
// @route   GET /api/ai/predict
// @access  Private
export const getPrediction = async (req, res, next) => {
  try {
    const metrics = await DashboardMetric.find({});
    const prompt = `Analyze these KPI metrics and forecast weekly trends for the next 4 periods.
Data: ${JSON.stringify(metrics, null, 2)}
Output a JSON array containing forecast details:
[
  { "period": "Week 1", "predictedRevenue": 130000, "confidence": 92 },
  { "period": "Week 2", "predictedRevenue": 135000, "confidence": 88 }
]`;

    if (!geminiAI) {
      // Mock prediction fallback
      return res.status(200).json({
        success: true,
        source: 'mock',
        data: [
          { period: 'Week 1', predictedRevenue: 128000, confidence: 95 },
          { period: 'Week 2', predictedRevenue: 132500, confidence: 90 },
          { period: 'Week 3', predictedRevenue: 138000, confidence: 85 },
          { period: 'Week 4', predictedRevenue: 144500, confidence: 80 }
        ]
      });
    }

    const model = geminiAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    text = text.replace(/```json|```/gi, '').trim();
    const predictionJson = JSON.parse(text);

    res.status(200).json({ success: true, source: 'database', data: predictionJson });
  } catch (error) {
    next(error);
  }
};

// @desc    Retrieve chat history logs
// @route   GET /api/ai/history
// @access  Private
export const getHistory = async (req, res, next) => {
  const userId = req.user._id;

  try {
    const chatSession = await AIChat.findOne({ userId });
    
    res.status(200).json({
      success: true,
      count: chatSession?.messages?.length || 0,
      data: chatSession?.messages || []
    });
  } catch (error) {
    next(error);
  }
};
