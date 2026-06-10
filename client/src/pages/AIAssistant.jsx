import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  User,
  Send,
  Sparkles,
  RefreshCw,
  Mic,
  MicOff,
  Copy,
  Check,
  FileText,
  Paperclip,
  Trash2,
  TrendingUp,
  AlertTriangle,
  Award,
  Download,
  Plus,
  Maximize2,
  Table as TableIcon,
  BarChart2,
  Code2,
  FileDown,
  Terminal,
  CornerDownLeft,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { aiService } from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005';
const sanitizedApiUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

const AIAssistant = () => {
  // --- State Variables ---
  const [sessions, setSessions] = useState([
    { id: 'session_default', title: 'Operational Assistant', active: true }
  ]);
  const [activeSessionId, setActiveSessionId] = useState('session_default');
  
  // Custom message threads per session to allow true ChatGPT experience
  const [sessionMessages, setSessionMessages] = useState({
    session_default: [
      {
        id: 'welcome',
        role: 'assistant',
        content: "Hello! I am your SmartOps BI digital copilot. Ask me anything about your current dashboard metrics, or request database changes (like restocks or new customers). \n\n*Try asking me:*\n- **'Which products are running low on stock?'**\n- **'What was last month's revenue?'**\n- **'Suggest promotions based on current sales'**",
        timestamp: new Date()
      }
    ]
  });

  const [query, setQuery] = useState('');
  const [streamingResponse, setStreamingResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [lastUserPrompt, setLastUserPrompt] = useState('');
  
  // File attachments state
  const [attachedFile, setAttachedFile] = useState(null); // { name, size, type, content }
  const fileInputRef = useRef(null);

  // Voice Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Clipboard copies trackers
  const [copiedMessageId, setCopiedMessageId] = useState(null);

  // Right-side AI Insights panels
  const [insights, setInsights] = useState({ anomalies: [], insights: [], suggestions: [] });
  const [predictions, setPredictions] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(true);

  // Scrolling anchor
  const chatBottomRef = useRef(null);

  // --- Speech Recognition Setup ---
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery(prev => (prev ? prev + ' ' + transcript : transcript));
        toast.success('Voice dictation captured 🎙️');
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onerror = (e) => {
        console.error('Speech recognition error:', e);
        setIsListening(false);
        toast.error('Voice input failed or permission denied 🚫');
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast.error('Speech Recognition is not supported by your browser 🚨');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
      toast('Listening... Speak your query 🎙️', { icon: '🎤' });
    }
  };

  // --- Fetch Right Sidebar Insights & Predictions ---
  const fetchInsightsAndPredictions = async () => {
    setInsightsLoading(true);
    try {
      const [insRes, predRes] = await Promise.all([
        aiService.getInsights(),
        aiService.getPredictions()
      ]);
      if (insRes.success) {
        setInsights(insRes.data);
      }
      if (predRes.success) {
        setPredictions(predRes.data);
      }
    } catch (e) {
      console.error('AI telemetry insights loading error:', e);
    } finally {
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'SmartOps AI - AI Intelligence Workspace';
    fetchInsightsAndPredictions();
  }, []);

  // --- Fetch Chat history from database as initial load ---
  useEffect(() => {
    const loadDatabaseHistory = async () => {
      try {
        const res = await aiService.getHistory();
        if (res.success && res.data.length > 0) {
          // Sync database history into the default session thread
          const formattedHistory = res.data.map((msg, index) => ({
            id: `db_${index}_${msg.timestamp}`,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp)
          }));
          
          setSessionMessages(prev => ({
            ...prev,
            session_default: [
              prev.session_default[0], // Keep welcome card
              ...formattedHistory
            ]
          }));

          // Add some default sessions based on historical activity
          setSessions([
            { id: 'session_default', title: 'Main Copilot Chat', active: true },
            { id: 'session_inventory', title: 'Inventory Inquiries', active: false },
            { id: 'session_forecast', title: 'Financial Forecasts', active: false }
          ]);
        }
      } catch (e) {
        console.error('Failed to load database chat history', e);
      }
    };
    loadDatabaseHistory();
  }, []);

  // --- Scroll to bottom ---
  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessionMessages, streamingResponse, isStreaming]);

  // --- File attachment Handlers ---
  const handleFileAttach = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024 * 5) {
        toast.error('File size limit exceeded (Max: 5MB)');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachedFile({
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB',
          type: file.type,
          content: event.target.result // base64 or text contents
        });
        toast.success(`Attached file: ${file.name} 📎`);
      };

      if (file.type.startsWith('text/') || file.name.endsWith('.csv') || file.name.endsWith('.json')) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file); // Images/Binary base64
      }
    }
  };

  // --- Chat Stream dispatcher ---
  const handleSend = async (customPrompt) => {
    const promptText = customPrompt || query;
    if (!promptText.trim() && !attachedFile) return;

    // Append context of attachment if present
    let finalPrompt = promptText;
    if (attachedFile) {
      finalPrompt = `[Attached File: ${attachedFile.name} (${attachedFile.size})]\nContent Preview:\n${attachedFile.content.slice(0, 1500)}\n\nUser Question:\n${promptText}`;
    }

    const currentMessages = sessionMessages[activeSessionId] || [];
    const userMessageId = `user_${Date.now()}`;
    const assistantMessageId = `ai_${Date.now()}`;

    // 1. Append User Message
    const newUserMessage = {
      id: userMessageId,
      role: 'user',
      content: promptText,
      timestamp: new Date(),
      attachment: attachedFile ? { name: attachedFile.name, size: attachedFile.size } : null
    };

    setSessionMessages(prev => ({
      ...prev,
      [activeSessionId]: [...currentMessages, newUserMessage]
    }));

    if (!customPrompt) setQuery('');
    setAttachedFile(null); // Clear attachment box
    setLastUserPrompt(promptText);
    setIsStreaming(true);
    setStreamingResponse('');

    // 2. Fetch connection with stream
    try {
      const response = await fetch(`${sanitizedApiUrl}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ prompt: finalPrompt })
      });

      if (!response.ok) {
        throw new Error('Server connection failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedText = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (value) {
          const chunkString = decoder.decode(value);
          const lines = chunkString.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataText = line.substring(6).trim();
              if (dataText === '[DONE]') {
                done = true;
                break;
              }

              try {
                const parsed = JSON.parse(dataText);
                if (parsed.chunk) {
                  accumulatedText += parsed.chunk;
                  setStreamingResponse(accumulatedText);
                } else if (parsed.error) {
                  toast.error(`AI Engine error: ${parsed.error}`);
                  accumulatedText += `\n\n[Error: ${parsed.error}]`;
                  setStreamingResponse(accumulatedText);
                }
              } catch (e) {
                // Ignore chunk parsing boundary mismatches
              }
            }
          }
        }
      }

      // 3. Save Final Assistant response into messages thread
      setSessionMessages(prev => ({
        ...prev,
        [activeSessionId]: [
          ...prev[activeSessionId],
          {
            id: assistantMessageId,
            role: 'assistant',
            content: accumulatedText,
            timestamp: new Date()
          }
        ]
      }));

      // Update session title if it was default
      const sessionIndex = sessions.findIndex(s => s.id === activeSessionId);
      if (sessionIndex !== -1 && sessions[sessionIndex].title.startsWith('New Chat') || sessions[sessionIndex].title === 'Operational Assistant') {
        const updatedSessions = [...sessions];
        updatedSessions[sessionIndex].title = promptText.length > 25 ? promptText.slice(0, 22) + '...' : promptText;
        setSessions(updatedSessions);
      }

    } catch (error) {
      console.error(error);
      setSessionMessages(prev => ({
        ...prev,
        [activeSessionId]: [
          ...prev[activeSessionId],
          {
            id: assistantMessageId,
            role: 'assistant',
            content: 'I failed to communicate with the Gemini AI stream engine. Please check system configurations, API credentials and server terminal status 🛡️',
            timestamp: new Date()
          }
        ]
      }));
    } finally {
      setIsStreaming(false);
      setStreamingResponse('');
    }
  };

  const handleRegenerate = () => {
    if (!lastUserPrompt) {
      toast.error('No prompt to regenerate');
      return;
    }
    // Delete last AI response
    const currentList = sessionMessages[activeSessionId] || [];
    if (currentList.length > 0 && currentList[currentList.length - 1].role === 'assistant') {
      setSessionMessages(prev => ({
        ...prev,
        [activeSessionId]: prev[activeSessionId].slice(0, -1)
      }));
    }
    handleSend(lastUserPrompt);
  };

  // --- Session Navigation ---
  const handleSessionChange = (id) => {
    setActiveSessionId(id);
    setSessions(prev => prev.map(s => ({ ...s, active: s.id === id })));
  };

  const createNewSession = () => {
    const newId = `session_${Date.now()}`;
    const newSessions = sessions.map(s => ({ ...s, active: false }));
    setSessions([
      ...newSessions,
      { id: newId, title: `New Chat ${sessions.length}`, active: true }
    ]);
    setActiveSessionId(newId);
    setSessionMessages(prev => ({
      ...prev,
      [newId]: [
        {
          id: `welcome_${Date.now()}`,
          role: 'assistant',
          content: "Workspace context refreshed. Ask me operational queries or request charts/actions.",
          timestamp: new Date()
        }
      ]
    }));
    toast.success('New session created 🤖');
  };

  const deleteSession = (id, e) => {
    e.stopPropagation();
    if (sessions.length === 1) {
      toast.error('Cannot delete the last remaining chat session');
      return;
    }
    const filteredSessions = sessions.filter(s => s.id !== id);
    if (activeSessionId === id) {
      filteredSessions[0].active = true;
      setActiveSessionId(filteredSessions[0].id);
    }
    setSessions(filteredSessions);
    // Cleanup messages
    const updatedMessages = { ...sessionMessages };
    delete updatedMessages[id];
    setSessionMessages(updatedMessages);
    toast.success('Chat history cleared 🗑️');
  };

  // --- Clipboard Copy ---
  const handleCopyMessage = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    toast.success('Message content copied! 📋');
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // --- Export to PDF (Print style report layout) ---
  const handleExportPDF = () => {
    const printContent = document.getElementById('chat-history-log');
    if (!printContent) {
      toast.error('No logs content found to export');
      return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>SmartOps AI - Assistant Conversation Logs Report</title>
          <style>
            body { font-family: system-ui, sans-serif; background: #fff; color: #111; padding: 40px; line-height: 1.5; }
            h1 { font-size: 24px; color: #5b21b6; border-bottom: 2px solid #5b21b6; padding-bottom: 10px; margin-bottom: 20px; }
            .meta { font-size: 11px; color: #555; margin-bottom: 30px; }
            .msg { margin-bottom: 20px; padding: 15px; border-radius: 8px; border: 1px solid #ddd; }
            .user { background: #f3f4f6; }
            .ai { background: #faf5ff; border-left: 4px solid #8b5cf6; }
            .role { font-weight: bold; font-size: 12px; margin-bottom: 5px; text-transform: uppercase; color: #555; }
            .content { font-size: 13px; white-space: pre-wrap; }
            table { border-collapse: collapse; width: 100%; margin: 15px 0; font-size: 12px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f3f4f6; }
            .chart-placeholder { padding: 20px; border: 1px dashed #bbb; margin: 10px 0; background: #fafafa; font-size: 11px; text-align: center; }
          </style>
        </head>
        <body>
          <h1>SmartOps AI - Assistant Conversations Ledger</h1>
          <div class="meta">Exported on: ${new Date().toLocaleString()} | Session ID: ${activeSessionId}</div>
          <div>
            ${currentMessagesForPrint(sessionMessages[activeSessionId] || [])}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    toast.success('Document PDF export generated 🖨️');
  };

  const currentMessagesForPrint = (messages) => {
    return messages
      .map(msg => `
        <div class="msg ${msg.role === 'user' ? 'user' : 'ai'}">
          <div class="role">${msg.role === 'user' ? 'Client Request' : 'SmartOps Copilot'} - ${new Date(msg.timestamp).toLocaleTimeString()}</div>
          <div class="content">${msg.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </div>
      `)
      .join('');
  };

  // --- Dynamic Structured Content Parser ---
  // Returns block objects to render appropriately
  const parseMessageContent = (content) => {
    if (!content) return [];
    
    const blocks = [];
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add preceding text block
      const textSegment = content.substring(lastIndex, match.index);
      if (textSegment.trim()) {
        blocks.push({ type: 'markdown', content: textSegment });
      }

      const language = match[1]?.toLowerCase() || 'text';
      const codeValue = match[2];

      // If JSON code block, check if it fits chart scheme or table scheme
      if (language === 'json') {
        try {
          const parsed = JSON.parse(codeValue.trim());
          if (parsed.chartType && Array.isArray(parsed.data)) {
            blocks.push({
              type: 'chart',
              chartType: parsed.chartType,
              data: parsed.data,
              title: parsed.title || 'Dynamic Generated Visualization',
              keys: parsed.keys || ['value']
            });
          } else if (parsed.tableHeaders && Array.isArray(parsed.tableRows)) {
            blocks.push({
              type: 'table',
              headers: parsed.tableHeaders,
              rows: parsed.tableRows
            });
          } else {
            blocks.push({ type: 'code', language, content: codeValue });
          }
        } catch (e) {
          // Fallback to normal code display
          blocks.push({ type: 'code', language, content: codeValue });
        }
      } else {
        blocks.push({ type: 'code', language, content: codeValue });
      }

      lastIndex = codeBlockRegex.lastIndex;
    }

    // Add trailing text block
    const remainingText = content.substring(lastIndex);
    if (remainingText.trim()) {
      blocks.push({ type: 'markdown', content: remainingText });
    }

    return blocks;
  };

  // Custom renderer components for parsed blocks
  const renderCodeBlock = (block, idx, msgId) => {
    const blockId = `${msgId}_code_${idx}`;
    return (
      <div key={blockId} className="my-3 border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950 font-mono text-[11px] shadow-lg">
        <div className="px-4 py-1.5 bg-zinc-900 border-b border-zinc-850 flex items-center justify-between text-zinc-400">
          <span className="text-[10px] uppercase font-semibold text-zinc-500 flex items-center gap-1">
            <Terminal className="w-3.5 h-3.5 text-violet-400" /> {block.language || 'code'}
          </span>
          <button
            onClick={() => handleCopyMessage(blockId, block.content)}
            className="hover:text-white flex items-center gap-1"
          >
            {copiedMessageId === blockId ? (
              <Check className="w-3 h-3 text-emerald-400 animate-pulse" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            <span>Copy</span>
          </button>
        </div>
        <pre className="p-4 overflow-x-auto text-zinc-300 leading-relaxed font-mono select-text">
          <code>{block.content}</code>
        </pre>
      </div>
    );
  };

  const renderTableBlock = (block, idx, msgId) => {
    return (
      <div key={`${msgId}_tbl_${idx}`} className="my-3 border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950/40 shadow-xl overflow-x-auto">
        <div className="px-4 py-2 bg-zinc-900/40 border-b border-zinc-800 text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1.5">
          <TableIcon className="w-3.5 h-3.5 text-indigo-400" /> Dynamic Query Results Table
        </div>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-zinc-850 bg-zinc-900/20 text-zinc-400">
              {block.headers.map((h, i) => (
                <th key={i} className="p-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-850">
            {block.rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-zinc-800/10 text-zinc-300">
                {block.headers.map((h, colIdx) => (
                  <td key={colIdx} className="p-3">{row[h] !== undefined ? String(row[h]) : ''}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderChartBlock = (block, idx, msgId) => {
    const chartColors = ['#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];
    
    return (
      <div key={`${msgId}_crt_${idx}`} className="my-4 p-4 border border-zinc-800 rounded-xl bg-zinc-950/50 shadow-xl space-y-3">
        <div className="flex items-center justify-between text-xs border-b border-zinc-850 pb-2">
          <span className="font-bold text-white flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-violet-400" /> {block.title}
          </span>
          <span className="px-2 py-0.5 bg-violet-650/15 text-violet-450 border border-violet-500/10 rounded-full text-[9px] uppercase font-bold">
            Interactive {block.chartType}
          </span>
        </div>
        
        <div className="w-full h-52">
          <ResponsiveContainer width="100%" height="100%">
            {block.chartType === 'bar' ? (
              <BarChart data={block.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" stroke="#71717a" fontSize={10} />
                <YAxis stroke="#71717a" fontSize={10} />
                <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                {block.keys.map((key, i) => (
                  <Bar key={key} dataKey={key} fill={chartColors[i % chartColors.length]} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            ) : block.chartType === 'area' ? (
              <AreaChart data={block.data}>
                <defs>
                  <linearGradient id={`grad_${idx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" stroke="#71717a" fontSize={10} />
                <YAxis stroke="#71717a" fontSize={10} />
                <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
                <Area type="monotone" dataKey={block.keys[0]} stroke="#8b5cf6" fillOpacity={1} fill={`url(#grad_${idx})`} />
              </AreaChart>
            ) : block.chartType === 'line' ? (
              <LineChart data={block.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" stroke="#71717a" fontSize={10} />
                <YAxis stroke="#71717a" fontSize={10} />
                <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
                <Line type="monotone" dataKey={block.keys[0]} stroke="#10b981" strokeWidth={2} activeDot={{ r: 6 }} />
              </LineChart>
            ) : (
              // Pie Chart
              <PieChart>
                <Pie
                  data={block.data}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {block.data.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={chartColors[i % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderMarkdownText = (textBlock, idx, msgId) => {
    // Basic Markdown Parser that splits by line and translates bullet points and headers
    const lines = textBlock.content.split('\n');
    return (
      <div key={`${msgId}_md_${idx}`} className="space-y-1.5 text-zinc-300 leading-relaxed font-sans text-xs">
        {lines.map((line, lIdx) => {
          // Header 3
          if (line.startsWith('### ')) {
            return <h4 key={lIdx} className="text-white font-bold text-sm mt-3 mb-1">{line.substring(4)}</h4>;
          }
          // Header 2
          if (line.startsWith('## ')) {
            return <h3 key={lIdx} className="text-white font-extrabold text-sm mt-4 mb-2 border-b border-zinc-800 pb-1">{line.substring(3)}</h3>;
          }
          // Bullet point
          if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
            const cleanLine = line.trim().substring(2);
            return (
              <li key={lIdx} className="list-disc ml-5 pl-1 my-0.5 text-zinc-300">
                {parseBoldSubstrings(cleanLine)}
              </li>
            );
          }
          
          return <p key={lIdx} className="my-1">{parseBoldSubstrings(line)}</p>;
        })}
      </div>
    );
  };

  const parseBoldSubstrings = (text) => {
    if (!text.includes('**')) return text;
    
    const parts = text.split('**');
    return parts.map((part, i) => {
      // odd indices are bold
      if (i % 2 === 1) {
        return <strong key={i} className="text-white font-bold">{part}</strong>;
      }
      return part;
    });
  };

  const renderMessageContent = (message) => {
    const blocks = parseMessageContent(message.content);
    return blocks.map((block, idx) => {
      if (block.type === 'chart') return renderChartBlock(block, idx, message.id);
      if (block.type === 'table') return renderTableBlock(block, idx, message.id);
      if (block.type === 'code') return renderCodeBlock(block, idx, message.id);
      return renderMarkdownText(block, idx, message.id);
    });
  };

  return (
    <div className="h-[calc(100vh-100px)] text-zinc-200 flex flex-col md:flex-row gap-4 select-none">
      
      {/* ==========================================
          1. LEFT SIDEBAR: CHAT HISTORY LIST
          ========================================== */}
      <div className="w-full md:w-64 bg-zinc-950/45 border border-zinc-800/80 rounded-2xl flex flex-col shrink-0 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-zinc-850 bg-zinc-900/10 flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-violet-400">Conversations</span>
          <button
            onClick={createNewSession}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-650 hover:bg-violet-650 text-white rounded-lg text-xs font-semibold shadow transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> New Chat
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-none">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => handleSessionChange(session.id)}
              className={`group px-3 py-2.5 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-all ${
                session.active
                  ? 'bg-violet-650/15 border border-violet-500/20 text-white'
                  : 'hover:bg-zinc-850/40 border border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText className={`w-3.5 h-3.5 shrink-0 ${session.active ? 'text-violet-400' : 'text-zinc-500'}`} />
                <span className="text-xs truncate font-medium">{session.title}</span>
              </div>
              <button
                onClick={(e) => deleteSession(session.id, e)}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-500 hover:text-rose-455 transition rounded"
                title="Clear thread"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        
        {/* Connection telemetry indicator */}
        <div className="p-4 border-t border-zinc-850 bg-zinc-900/10 text-[9px] text-zinc-500 flex items-center justify-between">
          <span>Telemetry: Connected</span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>

      {/* ==========================================
          2. CENTER PANEL: CHAT PLAYGROUND
          ========================================== */}
      <div className="flex-1 bg-zinc-950/45 border border-zinc-800/80 rounded-2xl flex flex-col overflow-hidden relative">
        {/* Header toolbar */}
        <div className="px-6 py-4 border-b border-zinc-850 bg-zinc-900/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center">
              <Bot className="w-4.5 h-4.5 text-violet-400 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                SmartOps Copilot <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              </h4>
              <p className="text-[10px] text-zinc-500">Autonomous business analytics engine</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="p-2 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs font-semibold hover:bg-zinc-900 cursor-pointer transition flex items-center gap-1.5"
              title="Export conversation logs"
            >
              <FileDown className="w-4 h-4 text-emerald-400" /> <span className="hidden sm:inline">Export Report</span>
            </button>
          </div>
        </div>

        {/* Message logs area */}
        <div id="chat-history-log" className="flex-1 overflow-y-auto p-6 space-y-6">
          {(sessionMessages[activeSessionId] || []).map((message) => {
            const isUser = message.role === 'user';
            
            return (
              <div key={message.id} className={`flex items-start gap-3.5 ${isUser ? 'flex-row-reverse' : ''}`}>
                {/* Profile Avatar indicator */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                  isUser
                    ? 'bg-zinc-850 border-zinc-700/60 text-zinc-300'
                    : 'bg-violet-650/10 border-violet-500/20 text-violet-455 shadow-inner'
                }`}>
                  {isUser ? <User className="w-4.5 h-4.5" /> : <Bot className="w-4.5 h-4.5" />}
                </div>

                {/* Message Bubble content */}
                <div className="max-w-[85%] space-y-2 relative group/msg">
                  <div className={`p-4 rounded-2xl ${
                    isUser
                      ? 'bg-gradient-to-r from-violet-650 to-indigo-650 text-white font-medium border border-transparent shadow-lg shadow-violet-950/10'
                      : 'glass-card text-zinc-300 leading-relaxed border border-zinc-800/60'
                  }`}>
                    {/* Rendered Attachment box if present */}
                    {message.attachment && (
                      <div className="mb-2 p-2 bg-zinc-950/40 border border-white/5 rounded-lg flex items-center justify-between text-[10px] text-zinc-400">
                        <span className="flex items-center gap-1.5 font-mono truncate">
                          <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                          {message.attachment.name}
                        </span>
                        <span className="text-zinc-600 font-mono">{message.attachment.size}</span>
                      </div>
                    )}
                    
                    {/* Parse content */}
                    {renderMessageContent(message)}
                  </div>
                  
                  {/* Message bubble hover parameters */}
                  <div className={`absolute -bottom-5 flex items-center gap-2 opacity-0 group-hover/msg:opacity-100 transition-opacity text-[10px] text-zinc-550 ${
                    isUser ? 'right-2' : 'left-2'
                  }`}>
                    <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                    {!isUser && (
                      <button
                        onClick={() => handleCopyMessage(message.id, message.content)}
                        className="hover:text-white flex items-center gap-0.5"
                      >
                        {copiedMessageId === message.id ? <Check className="w-2.5 h-2.5 text-emerald-450" /> : <Copy className="w-2.5 h-2.5" />}
                        Copy
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Assistant active response streaming bubble */}
          {isStreaming && streamingResponse && (
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-violet-650/10 border border-violet-500/20 text-violet-455 flex items-center justify-center shrink-0 shadow-inner">
                <Bot className="w-4.5 h-4.5 animate-pulse" />
              </div>
              
              <div className="max-w-[85%] space-y-2">
                <div className="p-4 rounded-2xl glass-card text-zinc-300 leading-relaxed border border-zinc-800/60">
                  {renderMessageContent({ id: 'streaming_active', content: streamingResponse })}
                  <span className="inline-block w-1.5 h-3.5 bg-violet-400 ml-1 animate-pulse" />
                </div>
              </div>
            </div>
          )}

          {/* Loader when streaming is active but has no text chunk yet */}
          {isStreaming && !streamingResponse && (
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-violet-650/10 border border-violet-500/20 text-violet-455 flex items-center justify-center shrink-0">
                <Bot className="w-4.5 h-4.5 animate-bounce" />
              </div>
              <div className="p-4 rounded-2xl glass-card text-xs text-zinc-500 flex items-center space-x-2 border border-zinc-800/60 bg-zinc-900/10">
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                <span>Copilot is inspecting database registries...</span>
              </div>
            </div>
          )}
          
          <div ref={chatBottomRef} />
        </div>

        {/* Suggested prompts footer bar */}
        {!isStreaming && (
          <div className="px-6 py-2 bg-zinc-950/20 flex flex-wrap items-center gap-2 border-t border-zinc-900/80">
            <span className="text-[10px] text-zinc-550 mr-1 flex items-center gap-1 font-semibold uppercase">
              <Sparkles className="w-3 h-3 text-cyan-400" /> Actions:
            </span>
            <button
              onClick={() => handleSend('Generate financial summary report')}
              className="text-[10px] px-3 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/60 hover:border-violet-500/30 text-zinc-350 hover:text-white transition-all cursor-pointer font-medium"
            >
              Generate Report
            </button>
            <button
              onClick={() => handleSend('Analyze sales and margins')}
              className="text-[10px] px-3 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/60 hover:border-violet-500/30 text-zinc-350 hover:text-white transition-all cursor-pointer font-medium"
            >
              Analyze Sales
            </button>
            <button
              onClick={() => handleSend('Predict next weeks sales trends forecasts')}
              className="text-[10px] px-3 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/60 hover:border-violet-500/30 text-zinc-350 hover:text-white transition-all cursor-pointer font-medium"
            >
              Predict Trends
            </button>
            {lastUserPrompt && (
              <button
                onClick={handleRegenerate}
                className="text-[10px] px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 transition-all cursor-pointer ml-auto flex items-center gap-1"
                title="Regenerate last response"
              >
                <RefreshCw className="w-3 h-3" /> Regenerate
              </button>
            )}
          </div>
        )}

        {/* Input box */}
        <div className="p-4 border-t border-zinc-850 bg-zinc-900/10">
          {/* File attachment preview status */}
          {attachedFile && (
            <div className="mb-2 p-2 bg-violet-950/20 border border-violet-850 rounded-lg flex items-center justify-between text-xs text-violet-300">
              <span className="flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                <strong>{attachedFile.name}</strong> ({attachedFile.size})
              </span>
              <button
                onClick={() => setAttachedFile(null)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center relative"
          >
            {/* Attachment trigger */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileAttach}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute left-3 p-2 text-zinc-500 hover:text-white transition-colors"
              title="Attach data CSV or images"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Dictation voice input */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`absolute left-10 p-2 transition-colors ${
                isListening ? 'text-rose-500 animate-pulse' : 'text-zinc-500 hover:text-white'
              }`}
              title={isListening ? 'Dictation active' : 'Voice search dictation'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isStreaming}
              placeholder="Query warehouse audits, forecast revenues, or dictate instructions..."
              className="w-full pl-20 pr-12 py-3.5 rounded-xl glass-input text-xs"
            />
            
            <button
              type="submit"
              disabled={isStreaming || (!query.trim() && !attachedFile)}
              className="absolute right-2 p-2 rounded-lg bg-violet-650 hover:bg-violet-600 disabled:bg-zinc-900 text-white disabled:text-zinc-650 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* ==========================================
          3. RIGHT PANEL: AI TELETEMETRY INSIGHTS
          ========================================== */}
      <div className="w-full md:w-80 bg-zinc-950/45 border border-zinc-800/80 rounded-2xl p-4 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-100px)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-violet-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> AI Insights Panel
          </span>
          <button
            onClick={fetchInsightsAndPredictions}
            disabled={insightsLoading}
            className="p-1 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded"
            title="Refresh AI insights"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${insightsLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {insightsLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-zinc-500 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-violet-500" />
            <span className="text-[10px] uppercase font-semibold">Running telemetry audit...</span>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Anomalies alert list */}
            {insights.anomalies && insights.anomalies.length > 0 && (
              <div className="space-y-2">
                <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Anomalies Detected
                </span>
                <div className="space-y-1.5">
                  {insights.anomalies.map((anom, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/15 text-[11px] text-rose-350 leading-normal"
                    >
                      {anom}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* General Insights */}
            <div className="space-y-2">
              <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-violet-400" /> Analytical Summaries
              </span>
              <div className="space-y-1.5">
                {insights.insights?.map((ins, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-850 text-[11px] text-zinc-350 leading-relaxed"
                  >
                    {ins}
                  </div>
                ))}
              </div>
            </div>

            {/* Predictions & Weekly Forecasts */}
            {predictions && predictions.length > 0 && (
              <div className="space-y-2">
                <span className="text-[9px] uppercase font-bold text-cyan-400 tracking-wider flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-cyan-400" /> Weekly Revenue Forecasts
                </span>
                <div className="p-3 bg-zinc-900 border border-zinc-850 rounded-xl space-y-2">
                  {predictions.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[10px] border-b border-zinc-850/50 pb-1.5 last:border-0 last:pb-0">
                      <span className="font-semibold text-zinc-400">{p.period}</span>
                      <div className="text-right">
                        <span className="text-white font-bold">${p.predictedRevenue?.toLocaleString()}</span>
                        <span className="text-[9px] text-zinc-550 block">Conf: {p.confidence}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations Action Suggestions */}
            <div className="space-y-2">
              <span className="text-[9px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-450" /> Recommended Action Steps
              </span>
              <div className="space-y-1.5">
                {insights.suggestions?.map((sug, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15 text-[11px] text-emerald-350 leading-relaxed cursor-pointer hover:bg-emerald-500/10 transition"
                    onClick={() => handleSend(`Discuss suggestion: "${sug}"`)}
                  >
                    💡 {sug}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
};

export default AIAssistant;
