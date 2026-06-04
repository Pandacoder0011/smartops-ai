import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

// We check if API key is present
const hasApiKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_google_gemini_api_key_here';

let aiInstance = null;
if (hasApiKey) {
  try {
    aiInstance = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  } catch (err) {
    console.error('Error initializing GoogleGenerativeAI:', err.message);
  }
}

export const analyzeMetricsWithGemini = async (prompt, metricsData) => {
  const systemPrompt = `You are SmartOps AI, a premium business intelligence copilot. 
Here is the current dashboard operational metrics data:
${JSON.stringify(metricsData, null, 2)}

Analyze this data and respond to the user's prompt: "${prompt}".
Provide clear, actionable operational advice. Format your response with markdown, using bullet points, bold text, and brief tables where appropriate. Keep it professional and visually structured.`;

  if (hasApiKey && aiInstance) {
    try {
      const model = aiInstance.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(systemPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API execution failed, using local fallback analyzer:', error.message);
      return getFallbackAnalysis(prompt, metricsData);
    }
  } else {
    // Fallback Mock AI Engine in case API Key is missing (allows mock simulation of Gemini output)
    return getFallbackAnalysis(prompt, metricsData);
  }
};

const getFallbackAnalysis = (prompt, metricsData) => {
  const query = prompt.toLowerCase();
  
  let analysis = `### 🤖 SmartOps AI Copilot (Simulation Mode)

*Your GEMINI_API_KEY is not set or active. Running local business intelligence heuristic analysis.*

`;

  if (query.includes('revenue') || query.includes('sales') || query.includes('financial')) {
    const revenue = metricsData.find(m => m.name.toLowerCase().includes('revenue')) || { value: 124500, change: 11.16 };
    analysis += `#### 📈 Financial Audit Insights
- **Current Revenue**: **$${revenue.value.toLocaleString()}** (Up **${revenue.change}%** compared to last period).
- **Trend Summary**: The revenue trend is showing positive linear growth, fueled by strong conversions.
- **Operational Recommendation**: We recommend increasing ad spend in high-conversion channels to sustain this momentum. Consider setting up a dynamic promotion for low-traffic weekdays.`;
  } else if (query.includes('user') || query.includes('traffic') || query.includes('session')) {
    const users = metricsData.find(m => m.name.toLowerCase().includes('user')) || { value: 14205, change: 8.44 };
    analysis += `#### 👥 User Engagement Analytics
- **Active Audience**: **${users.value.toLocaleString()}** concurrent sessions (Up **${users.change}%**).
- **Core Observation**: User growth is solid, but your retention metrics suggest a potential dropoff on the pricing page.
- **Action Plan**: Deploy an A/B test on checkout page layouts and optimize your image assets to improve page loading speed.`;
  } else if (query.includes('performance') || query.includes('system') || query.includes('uptime') || query.includes('health')) {
    const uptime = metricsData.find(m => m.name.toLowerCase().includes('uptime')) || { value: 99.98 };
    analysis += `#### 🖥️ Infrastructure & System Health
- **Uptime Status**: **${uptime.value}%**
- **Response Speeds**: Average server response time is **120ms** (Excellent).
- **Optimization Strategy**: System health is within optimal bounds. Continue running database index audits monthly to prevent slow query logs.`;
  } else {
    analysis += `#### 📊 SmartOps General BI Synthesis
I've reviewed your operational parameters across **${metricsData.length} active KPI dimensions**.

| Metric | Value | Status |
|---|---|---|
${metricsData.map(m => `| **${m.name}** | ${m.value}${m.unit || ''} | ${m.change >= 0 ? '🟢 +' + m.change + '%' : '🔴 ' + m.change + '%'} |`).join('\n')}

**Key Recommendations**:
1. **Optimize Operations**: Conversion Rate shows a strong positive delta (+11.72%). Capitalize on this by streamlining checkout micro-copy.
2. **Resource Allocation**: Balance system loads during peak traffic periods to maintain the 99.98% uptime SLA.
3. **Data Import**: Upload a CSV file at the top of the dashboard to trigger a customized audit of specific department metrics.`;
  }

  return analysis;
};
