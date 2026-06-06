import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const isPlaceholderKey = !apiKey || apiKey === 'your_google_gemini_api_key_here' || apiKey === 'your_gemini_api_key_here';

let geminiAI = null;

if (isPlaceholderKey) {
  console.warn('⚠️  Gemini API Key is not configured or is a placeholder. SmartOps AI will operate in simulation mode. 🤖');
} else {
  try {
    console.log('🔌 Initializing Google Gemini AI client... 🧠');
    geminiAI = new GoogleGenerativeAI(apiKey);
    console.log('🟢 Gemini AI Client initialized successfully! 🚀');
  } catch (error) {
    console.error(`🔴 Error initializing Gemini AI Client: ${error.message} 🚨`);
  }
}

export default geminiAI;
