import { analyzeMetricsWithGemini } from '../services/geminiService.js';
import DashboardMetric from '../models/DashboardMetric.js';

// @desc    Ask SmartOps AI Copilot a question
// @route   POST /api/ai/query
// @access  Public
export const queryAICopilot = async (req, res, next) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ success: false, message: 'Please provide a prompt/query for the AI' });
  }

  try {
    // Retrieve latest metrics to supply as context
    const metrics = await DashboardMetric.find({});
    
    // Process prompt with Gemini service
    const analysis = await analyzeMetricsWithGemini(prompt, metrics);
    
    res.status(200).json({
      success: true,
      data: {
        query: prompt,
        response: analysis,
        timestamp: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};
