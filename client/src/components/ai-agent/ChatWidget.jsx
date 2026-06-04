import React, { useState, useRef, useEffect } from 'react';
import { aiService } from '../../services/api';
import { Bot, CornerDownLeft, Send, Sparkles, User } from 'lucide-react';

const ChatWidget = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { 
      sender: 'ai', 
      text: "Hello! I am your SmartOps BI digital copilot. Ask me anything about your current dashboard metrics, or ask for general operations advice.", 
      timestamp: new Date() 
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const quickPrompts = [
    "Perform financial audit",
    "Analyze current active user count",
    "Assess system health status",
  ];

  const handleSend = async (textToSend) => {
    const promptText = textToSend || query;
    if (!promptText.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { sender: 'user', text: promptText, timestamp: new Date() }]);
    if (!textToSend) setQuery('');
    setLoading(true);

    try {
      const result = await aiService.queryCopilot(promptText);
      if (result.success) {
        setMessages(prev => [...prev, { 
          sender: 'ai', 
          text: result.data.response, 
          timestamp: new Date(result.data.timestamp) 
        }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: "Sorry, I encountered an issue accessing the Gemini engine. Please check your server network and credentials.", 
        timestamp: new Date() 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl glass-card flex flex-col h-[500px]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-zinc-950/20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center border border-violet-500/20">
            <Bot className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              SmartOps Copilot <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            </h4>
            <p className="text-[10px] text-zinc-400">Powered by Gemini AI</p>
          </div>
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, index) => {
          const isAi = msg.sender === 'ai';
          return (
            <div key={index} className={`flex items-start gap-3 ${!isAi ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                isAi 
                  ? 'bg-violet-600/10 border-violet-500/20 text-violet-400' 
                  : 'bg-zinc-850 border-white/10 text-zinc-300'
              }`}>
                {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className={`p-4 rounded-xl max-w-[85%] text-xs leading-relaxed ${
                isAi 
                  ? 'bg-zinc-900/50 border border-white/5 text-zinc-200' 
                  : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium'
              }`}>
                {/* Basic line breaks parsing for markdown list and headings */}
                {msg.text.split('\n').map((line, i) => (
                  <p key={i} className={line.startsWith('#') ? 'font-bold text-sm my-1 text-white' : 'my-0.5'}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/5 text-xs text-zinc-400 flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              <span>Copilot is auditing data...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick suggestions */}
      {messages.length === 1 && (
        <div className="px-6 py-2 flex flex-wrap gap-2">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="text-[10px] px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-violet-500/30 text-zinc-300 hover:text-white transition-all"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input panel */}
      <div className="p-4 border-t border-white/5 bg-zinc-950/20">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center relative"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            placeholder="Ask Copilot to analyze stats, generate code, or recommend plans..."
            className="w-full pl-4 pr-12 py-3 rounded-lg glass-input text-xs"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 p-2 rounded-md bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 text-white disabled:text-zinc-500 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWidget;
