'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  ThumbsUp,
  ThumbsDown,
  Calculator,
  Globe,
  FileSearch,
  ShieldCheck,
  Mic,
  MicOff,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Message, Citation } from '@/types';
import { askQuestion, submitFeedback } from '@/lib/api';
import CitationCard from './CitationCard';

interface ChatInterfaceProps {
  initialQuery?: string;
  onClearInitialQuery?: () => void;
}

const SAMPLE_PROMPTS = [
  {
    title: '🌾 PM-KISAN Benefit',
    query: 'What is the annual financial assistance under PM-KISAN and how is it disbursed?',
    category: 'farmers',
  },
  {
    title: '🛠️ 18 Vishwakarma Trades',
    query: 'What are the 18 traditional trades covered under PM Vishwakarma?',
    category: 'employment',
  },
  {
    title: '🧮 Loan Interest Math',
    query: 'If a farmer gets 6000 per year, calculate 6000 / 12 for monthly',
    category: 'farmers',
  },
  {
    title: '🏥 Ayushman Bharat PM-JAY',
    query: 'How much health insurance coverage is given under Ayushman Bharat PM-JAY?',
    category: 'health',
  },
  {
    title: '🌐 Live Scheme Updates',
    query: 'Latest news updates on PM Vishwakarma scheme today',
    category: 'employment',
  },
];

export default function ChatInterface({ initialQuery, onClearInitialQuery }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content:
        'Namaste! 🙏 I am **Citizen AI**, your official citation-grounded assistant for Indian Government schemes and welfare policies.\n\nAsk me anything about **eligibility, cash grants, training stipends, interest subventions, or live announcements** across **PM-KISAN, PM Vishwakarma, Ayushman Bharat (PM-JAY), Kisan Credit Card (KCC), PM SVANidhi, and PMKVY 4.0**.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Handle external query triggers (from Scheme Discovery Cards or Calculator)
  useEffect(() => {
    if (initialQuery && initialQuery.trim() !== '') {
      handleSend(initialQuery);
      if (onClearInitialQuery) onClearInitialQuery();
    }
  }, [initialQuery]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await askQuestion(textToSend);
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        content: res.answer,
        intent: res.intent,
        tool_used: res.tool_used,
        citations: res.citations,
        confidence: res.confidence,
        latency_sec: res.latency_sec,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        content: `⚠️ **Connection Note:** Could not reach backend server (${err.message || 'Check if FastAPI is running on localhost:8000'}).`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = (msg: Message, type: 'thumbs_up' | 'thumbs_down') => {
    submitFeedback(msg.content, msg.content, type);
    alert(type === 'thumbs_up' ? '🙏 Thank you for your positive feedback!' : '📝 Feedback recorded to improve scheme answers.');
  };

  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice recognition is supported on Google Chrome & Microsoft Edge browsers.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const renderToolBadge = (tool?: string, intent?: string, latency?: number) => {
    if (!tool) return null;

    let icon = <FileSearch className="w-3 h-3 text-orange-400" />;
    let label = 'Hybrid RAG';
    let color = 'bg-orange-500/10 text-orange-300 border-orange-500/20';

    if (tool === 'calculator' || intent === 'calculation') {
      icon = <Calculator className="w-3 h-3 text-amber-400" />;
      label = 'Safe Math AST';
      color = 'bg-amber-500/10 text-amber-300 border-amber-500/20';
    } else if (tool === 'duckduckgo_search' || intent === 'web_search') {
      icon = <Globe className="w-3 h-3 text-blue-400" />;
      label = 'Live Web Search';
      color = 'bg-blue-500/10 text-blue-300 border-blue-500/20';
    } else if (tool === 'guardrail_security' || intent === 'blocked_security') {
      icon = <ShieldCheck className="w-3 h-3 text-red-400" />;
      label = 'Security Guardrail';
      color = 'bg-red-500/10 text-red-300 border-red-500/20';
    }

    return (
      <div className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${color} shadow-sm`}>
        {icon}
        <span>{label}</span>
        {latency !== undefined && <span className="text-slate-400">({latency.toFixed(2)}s)</span>}
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col h-[calc(100vh-140px)] min-h-[550px] p-2 sm:p-4">
      
      {/* Messages Scroll Container */}
      <div className="flex-1 overflow-y-auto space-y-4 px-3 sm:px-5 py-4 rounded-3xl glass-panel border border-white/5 shadow-2xl">
        {messages.map((msg) => {
          const isAssistant = msg.sender === 'assistant';

          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
            >
              {isAssistant && (
                <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-green-600 p-[1.5px] shrink-0 shadow-md">
                  <div className="w-full h-full bg-[#0E1524] rounded-[14px] flex items-center justify-center">
                    <Bot className="w-4 h-4 text-orange-400" />
                  </div>
                </div>
              )}

              <div
                className={`max-w-[88%] sm:max-w-[82%] rounded-3xl p-4 sm:p-5 transition-all ${
                  isAssistant
                    ? 'glass-card border border-white/10 text-slate-100 shadow-xl'
                    : 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-600/25 ml-auto'
                }`}
              >
                {/* Assistant Metadata / Tool Pill */}
                {isAssistant && (
                  <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-white/5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black tracking-wide text-orange-400">Citizen AI</span>
                      {renderToolBadge(msg.tool_used, msg.intent, msg.latency_sec)}
                    </div>
                    <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                  </div>
                )}

                {/* Content */}
                <div className="markdown-body text-sm leading-relaxed">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>

                {/* Citations */}
                {isAssistant && msg.citations && msg.citations.length > 0 && (
                  <CitationCard citations={msg.citations} />
                )}

                {/* Action Toolbar for Assistant Messages */}
                {isAssistant && msg.id !== 'welcome' && (
                  <div className="mt-3.5 pt-2 flex items-center justify-between border-t border-white/5 text-xs text-slate-400">
                    <button
                      onClick={() => handleCopy(msg.content, msg.id)}
                      className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
                      title="Copy answer"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-green-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleFeedback(msg, 'thumbs_up')}
                        className="p-1.5 rounded-lg hover:bg-white/10 hover:text-green-400 transition-colors"
                        title="Helpful verified answer"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleFeedback(msg, 'thumbs_down')}
                        className="p-1.5 rounded-lg hover:bg-white/10 hover:text-red-400 transition-colors"
                        title="Report issue"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {!isAssistant && (
                <div className="w-8 h-8 rounded-2xl bg-orange-600/90 text-white flex items-center justify-center shrink-0 shadow-md">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Typing Loading Indicator */}
        {loading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-orange-500 to-green-600 p-[1.5px] shrink-0">
              <div className="w-full h-full bg-[#0E1524] rounded-[14px] flex items-center justify-center">
                <Bot className="w-4 h-4 text-orange-400" />
              </div>
            </div>
            <div className="p-4 rounded-3xl glass-card border border-orange-500/20 text-slate-300 text-xs flex items-center space-x-3 shadow-lg">
              <div className="flex space-x-1.5">
                <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></span>
              </div>
              <span className="font-medium text-slate-300">Grounding response with verified scheme citations...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      {messages.length <= 3 && (
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {SAMPLE_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt.query)}
              className="shrink-0 px-3.5 py-1.5 rounded-2xl glass-card hover:bg-white/10 text-xs text-slate-300 border border-white/10 transition-all hover:scale-[1.02] flex items-center space-x-1.5 shadow-sm"
            >
              <span>{prompt.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Bar */}
      <div className="mt-3 relative">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center rounded-3xl glass-card border border-white/15 bg-slate-900/90 shadow-2xl focus-within:border-orange-500/50 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all"
        >
          {/* Voice Input Button */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            className={`p-3.5 ml-1 rounded-2xl transition-colors ${
              isListening ? 'text-red-400 animate-pulse bg-red-500/10' : 'text-slate-400 hover:text-orange-400'
            }`}
            title="Voice input (Indian English / Hindi)"
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about PM-KISAN, 18 PM Vishwakarma trades, calculate subsidies, or live news..."
            disabled={loading}
            className="flex-1 bg-transparent py-4 px-2 text-sm text-white placeholder-slate-400 focus:outline-none disabled:opacity-50"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-3 mr-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-medium hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-orange-500/30 hover:scale-105"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-[11px] text-slate-500 mt-2">
          Grounded in 12 official government policy PDFs with strict citation enforcement.
        </p>
      </div>

    </div>
  );
}
