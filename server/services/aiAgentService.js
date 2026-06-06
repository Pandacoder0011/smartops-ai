import geminiAI from '../config/gemini.js';
import { aiToolsDeclarations, executeTool } from './aiTools.js';

const SYSTEM_INSTRUCTION = `You are SmartOps AI Co-Pilot, a premium, intelligent business intelligence dashboard assistant.
You have direct, secure access to the company's enterprise database containing the following collections:
1. Product: fields include name, sku, category, price, cost, stock, minStock, supplier, status
2. Sale: fields include products (product refs, quantity, priceAtSale), customer, totalAmount, paymentMethod, status, employee, profit, region, date
3. Customer: fields include name, email, phone, address, totalPurchases, loyaltyPoints, segment, joinDate
4. Employee: fields include userId, department, position, salary, performance, attendance, tasks
5. Transaction: fields include type (income/expense), category, amount, description, date, paymentMethod
6. Notification: fields include userId, type, message, read, priority

Guidelines:
- When queried about metrics, stock levels, sales, or customer data, you MUST call queryDatabase or generateReport to retrieve the factual, current statistics before drawing conclusions.
- When generating reports, use markdown tables, bullet points, and clean formatting for a premium presentation.
- If the user asks you to log notifications or send updates, invoke sendNotification.
- Be concise, professional, and focus on delivering actionable insights.
- If the database returns empty arrays or errors, note that the collections might be empty, and offer to create a template record using createRecord.`;

// ==========================================
// Process Natural Language Copilot Queries
// ==========================================
export const executeAgentChat = async (userPrompt, chatHistory, onStreamChunk) => {
  if (!geminiAI) {
    // Return mock response if key is missing
    const mockMsg = getMockResponse(userPrompt);
    for (let i = 0; i < mockMsg.length; i += 20) {
      const chunk = mockMsg.slice(i, i + 20);
      onStreamChunk(chunk);
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    return mockMsg;
  }

  try {
    const model = geminiAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ functionDeclarations: aiToolsDeclarations }]
    });

    // Format historical messages to Gemini API format
    // role: 'user' or 'model'
    const formattedHistory = chatHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Start a chat session
    const chat = model.startChat({
      history: formattedHistory
    });

    console.log(`🧠 [AI Agent] Submitting prompt to Gemini: "${userPrompt}"`);
    let response = await chat.sendMessage(userPrompt);
    let functionCalls = response.response.functionCalls;

    // Agent Loop: recursively execute function calls until model returns text
    while (functionCalls && functionCalls.length > 0) {
      const functionResponses = [];
      
      for (const call of functionCalls) {
        const toolResult = await executeTool(call);
        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: { result: toolResult }
          }
        });
      }

      console.log(`🧠 [AI Agent] Feeding tool results back to Gemini...`);
      // Send the tool outputs back
      response = await chat.sendMessage(functionResponses);
      functionCalls = response.response.functionCalls;
    }

    // Stream the final text response
    const finalResponseText = response.response.text();
    const chunkLength = 15;
    for (let i = 0; i < finalResponseText.length; i += chunkLength) {
      const chunk = finalResponseText.slice(i, i + chunkLength);
      onStreamChunk(chunk);
      // Small simulated delay for clean streaming feel
      await new Promise(resolve => setTimeout(resolve, 15));
    }

    return finalResponseText;
  } catch (error) {
    console.error('🔴 [AI Agent Error] Generation failed:', error.message);
    const errMsg = `⚠️ Sorry, I encountered an issue processing your query with the Gemini engine: ${error.message}`;
    onStreamChunk(errMsg);
    return errMsg;
  }
};

// Fallback Mock agent content in case credentials are not ready
const getMockResponse = (prompt) => {
  const query = prompt.toLowerCase();
  if (query.includes('revenue') || query.includes('sales')) {
    return `### 📊 Financial Insights (Simulation Mode)

I queried your sales ledger database using **\`generateReport\`** and compiled this summary:

- **Total Operational Revenue**: **$148,500**
- **Net Operating Profit**: **$68,400** (Avg margin **46.06%**)
- **Top Region**: **North America** ($64,000 revenue)

**Growth Analysis**:
Sales are showing positive week-over-week trends. I recommend launching a regional promotion in **Latin America** to boost the lower-performing sectors.`;
  }
  
  if (query.includes('stock') || query.includes('inventory') || query.includes('product')) {
    return `### 📦 Inventory Audit (Simulation Mode)

I queried the **\`Product\`** database catalog for stock levels and detected the following low-stock alerts:

| Product SKU | Product Name | Stock | Status | Min Threshold |
|---|---|---|---|---|
| **ASN-202** | Analytics Sensor Node | **3** | active | 10 |
| **SGM-500** | Secure Gateway Module | **0** | out-of-stock | 5 |

**Recommendations**:
1. **Restock**: Place an inventory purchase order for **Secure Gateway Module** (SGM-500) immediately.
2. **Alerts**: I have created a system notification alerting the logistics manager.`;
  }

  if (query.includes('customer')) {
    return `### 👥 Top Customers Leaderboard (Simulation Mode)

Here is a list of your top customer segments sorted by lifetime purchases:

1. **VIP Customers** (42 active profiles): Total Revenue contribution: **$85,000**
2. **Regular Customers** (180 active profiles): Total Revenue contribution: **$52,000**

Bruce Wayne is currently your highest-scoring VIP customer with **600 loyalty points**.`;
  }

  return `### 🤖 SmartOps Co-Pilot (Simulation Mode)

Hello! I have scanned your operational records. How can I assist you with business analytics today?

**Quick Prompts**:
- *"What was last month's revenue?"*
- *"Show me top 5 customers"*
- *"Which products are running low on stock?"*`;
};
