import React from 'react';
import ChatWidget from '../components/ai-agent/ChatWidget';
import { motion } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';

const AIAssistant = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 text-zinc-100 max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col justify-between"
    >
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          AI Copilot Terminal <Sparkles className="w-5 h-5 text-violet-400" />
        </h2>
        <p className="text-sm text-zinc-400">Ask natural language business questions or request operational actions.</p>
      </div>

      <div className="flex-1 min-h-0">
        <ChatWidget isFullScreen={true} />
      </div>
    </motion.div>
  );
};

export default AIAssistant;
