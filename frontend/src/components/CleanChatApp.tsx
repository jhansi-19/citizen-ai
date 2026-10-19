'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  motion,
  AnimatePresence,
} from 'framer-motion';
import {
  Shield,
  Plus,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  Send,
  Loader2,
  X,
  Upload,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Sparkles,
  Command,
  Search,
  CheckCircle2,
  FileSearch,
  Minimize2,
  Maximize2,
  PanelLeftClose,
  PanelLeftOpen,
  Paperclip,
  AlertCircle,
  RefreshCw,
  Library,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { askQuestion, submitFeedback, fetchDocuments, uploadAttachment, pollAttachmentStatus, deleteAttachment, AttachmentInfo, AttachmentStatus } from '@/lib/api';
import DocumentUploadPanel from './DocumentUploadPanel';

interface Citation {
  doc_name: string;
  page: number;
  category?: string;
  score?: number;
  url?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp?: string;
  helpful?: boolean | null;
  tool_used?: string;
  latency_sec?: number;
  attachments?: { doc_id: string; filename: string; file_size: number; page_count?: number | null }[];
  offer_library_search?: boolean;
}

interface AttachmentChip {
  doc_id: string;
  filename: string;
  file_size: number;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  progress: number;
  page_count: number | null;
  error: string | null;
}

interface CleanChatAppProps {
  initialQuery?: string;
  initialCategory?: string;
  onBackToHome?: () => void;
}

const DEFAULT_DOCUMENTS = [
  { name: 'PM-Kisan Guidelines', file: 'PM_KISAN_Operational_Guidelines.pdf', color: 'border-emerald-500' },
  { name: 'Ayushman Bharat FAQ', file: 'Ayushman_Bharat_PMJAY_Guidelines.pdf', color: 'border-saffron' },
  { name: 'National Scholarship Rules', file: 'National_Scholarship_Portal_Guidelines.pdf', color: 'border-blue-500' },
  { name: 'PM Vishwakarma Scheme', file: 'PM_VISHWAKARMA_Scheme_Guidelines.pdf', color: 'border-purple-500' },
  { name: 'Atal Pension Yojana', file: 'Atal_Pension_Yojana_APY_Scheme_Details.pdf', color: 'border-teal-500' },
];

const RECENT_CHATS = [
  { id: '1', title: 'PM Kisan eligibility', query: 'What are the criteria for PM-KISAN landholder eligibility and exclusion categories?' },
  { id: '2', title: 'Scholarship after 12th', query: 'What scholarship schemes are available for students after 12th?' },
  { id: '3', title: 'Ayushman Bharat coverage', query: 'How much health insurance coverage is given under Ayushman Bharat PM-JAY?' },
  { id: '4', title: 'PM Vishwakarma trades', query: 'What are the 18 traditional trades covered under PM Vishwakarma?' },
];

export default function CleanChatApp({ initialQuery, initialCategory, onBackToHome }: CleanChatAppProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content:
        'Namaste! 🙏 I am **Citizen AI**, your official citation-grounded assistant for Indian Government schemes and welfare policies.\n\nAsk me anything about **eligibility, subsidies, financial grants, training stipends, or exclusion categories** across **PM-KISAN, PM Vishwakarma, Ayushman Bharat (PM-JAY), PMAY, Atal Pension Yojana, Kisan Credit Card**, and more.\n\nEvery answer is strictly grounded in official Ministry guidelines with exact page citations.',
      timestamp: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [retrievalStage, setRetrievalStage] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeChatTitle, setActiveChatTitle] = useState('New chat');
  const [activeRecentId, setActiveRecentId] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // ── Attachment state ──
  const [attachments, setAttachments] = useState<AttachmentChip[]>([]);
  const [searchScope, setSearchScope] = useState<'library' | 'attached'>('library');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [conversationId] = useState(() => `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

  // Active source inspector on right side
  const [selectedSource, setSelectedSource] = useState<{
    doc_name: string;
    page: number;
    passage?: string;
  }>({
    doc_name: 'Official Policy Guidelines',
    page: 1,
    passage:
      'Verified passages and excerpts from official Ministry circulars will appear here when you ask a question or click any citation chip in the chat.',
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [docList, setDocList] = useState<any[]>(DEFAULT_DOCUMENTS);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadDocuments = async () => {
    try {
      const docs = await fetchDocuments();
      if (docs && docs.length > 0) {
        const colorPalette = [
          'border-emerald-500',
          'border-saffron',
          'border-blue-500',
          'border-purple-500',
          'border-teal-500',
          'border-rose-500',
          'border-amber-400',
        ];
        const formatted = docs.map((d: any, idx: number) => ({
          name: d.name.replace(/\.pdf$/i, '').replace(/_/g, ' '),
          file: d.name,
          category: d.category || 'general',
          color: colorPalette[idx % colorPalette.length],
        }));
        setDocList(formatted);
      }
    } catch (e) {
      console.warn('Could not load dynamic documents:', e);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Command palette shortcut (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsCommandOpen(false);
        setIsUploadModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Attachment Handlers ──

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleAttachFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      // Validate
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        alert('Only PDF files are supported.');
        continue;
      }
      if (file.size > 20 * 1024 * 1024) {
        alert(`${file.name} is too large (max 20 MB).`);
        continue;
      }
      if (attachments.length >= 3) {
        alert('Maximum 3 attachments per conversation.');
        break;
      }

      // Create chip placeholder
      const tempId = `temp_${Date.now()}`;
      const newChip: AttachmentChip = {
        doc_id: tempId,
        filename: file.name,
        file_size: file.size,
        status: 'uploading',
        progress: 0,
        page_count: null,
        error: null,
      };
      setAttachments(prev => [...prev, newChip]);
      setSearchScope('attached');

      try {
        // Upload
        const result = await uploadAttachment(file, conversationId);
        const docId = result.doc_id;

        // Replace temp chip with real doc_id
        setAttachments(prev =>
          prev.map(a => a.doc_id === tempId
            ? { ...a, doc_id: docId, status: 'processing', progress: 0.2 }
            : a
          )
        );

        // Poll for status
        const pollInterval = setInterval(async () => {
          try {
            const status = await pollAttachmentStatus(docId);
            setAttachments(prev =>
              prev.map(a => a.doc_id === docId
                ? {
                    ...a,
                    status: status.status as AttachmentChip['status'],
                    progress: status.progress,
                    page_count: status.page_count,
                    error: status.error,
                  }
                : a
              )
            );
            if (status.status === 'ready' || status.status === 'failed') {
              clearInterval(pollInterval);
            }
          } catch {
            clearInterval(pollInterval);
          }
        }, 1000);

      } catch (err: any) {
        setAttachments(prev =>
          prev.map(a => a.doc_id === tempId
            ? { ...a, status: 'failed', error: err.message || 'Upload failed' }
            : a
          )
        );
      }
    }
  }, [attachments.length, conversationId]);

  const handleRemoveAttachment = useCallback(async (docId: string) => {
    setAttachments(prev => prev.filter(a => a.doc_id !== docId));
    // If no attachments left, switch back to library scope
    setAttachments(prev => {
      const remaining = prev.filter(a => a.doc_id !== docId);
      if (remaining.length === 0) setSearchScope('library');
      return remaining;
    });
    try {
      if (!docId.startsWith('temp_')) await deleteAttachment(docId);
    } catch { /* best effort */ }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleAttachFiles(e.dataTransfer.files);
    }
  }, [handleAttachFiles]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleAttachFiles(e.target.files);
      e.target.value = ''; // reset input
    }
  }, [handleAttachFiles]);

  const allAttachmentsReady = attachments.length === 0 || attachments.every(a => a.status === 'ready');
  const activeDocIds = attachments.filter(a => a.status === 'ready').map(a => a.doc_id);

  const handleSend = async (queryText?: string, overrideScope?: 'library' | 'attached') => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || loading) return;

    const shortTitle = textToSend.length > 28 ? textToSend.slice(0, 28) + '...' : textToSend;
    setActiveChatTitle(shortTitle);

    const currentScope = overrideScope || searchScope;
    const currentDocIds = currentScope === 'attached' && activeDocIds.length > 0 ? activeDocIds : undefined;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: currentDocIds ? attachments.filter(a => a.status === 'ready').map(a => ({
        doc_id: a.doc_id,
        filename: a.filename,
        file_size: a.file_size,
        page_count: a.page_count,
      })) : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setRetrievalStage(
      currentScope === 'attached'
        ? 'Searching attached document(s)...'
        : 'Searching guidelines with BGE-small & BM25...'
    );

    // Simulate animated retrieval stage progression
    setTimeout(() => {
      setRetrievalStage('Reciprocal Rank Fusion (RRF) reranking...');
    }, 700);

    setTimeout(() => {
      setRetrievalStage('Synthesizing grounded citations...');
    }, 1400);

    try {
      const res = await askQuestion(textToSend, undefined, conversationId, currentDocIds, currentScope);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        content: res.answer,
        citations: res.citations && res.citations.length > 0 ? res.citations : undefined,
        tool_used: res.tool_used,
        latency_sec: res.latency_sec,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        offer_library_search: (res as any).offer_library_search || false,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (res.citations && res.citations.length > 0) {
        const topCitation = res.citations[0];
        setSelectedSource({
          doc_name: topCitation.doc_name.replace(/\.pdf$/i, '').replace(/_/g, ' '),
          page: topCitation.page,
          passage: res.answer.slice(0, 240) + '...',
        });
      }
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        content: `⚠️ Could not reach backend server: ${err.message || 'Please verify that the FastAPI backend is running on localhost:8000'}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setRetrievalStage('');
    }
  };

  const handleSearchAllDocs = (query: string) => {
    handleSend(query, 'library');
  };

  const handleNewChat = () => {
    setActiveChatTitle('New chat');
    setActiveRecentId('');
    setAttachments([]);
    setSearchScope('library');
    setMessages([
      {
        id: 'new-welcome',
        sender: 'assistant',
        content:
          'Namaste! 🙏 How can I assist you today? Ask about eligibility, interest subsidies, stipends, or exclusions for any central or state welfare scheme.',
        timestamp: 'Just now',
      },
    ]);
    inputRef.current?.focus();
  };

  const handleSelectRecent = (chat: { id: string; title: string; query: string }) => {
    setActiveRecentId(chat.id);
    setActiveChatTitle(chat.title);
    handleSend(chat.query);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedbackClick = (msgId: string, helpful: boolean) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, helpful } : m))
    );
  };

  const handleCitationClick = (citation: Citation, answerContent?: string) => {
    const cleanName = citation.doc_name.replace(/\.pdf$/i, '').replace(/_/g, ' ');
    setSelectedSource({
      doc_name: cleanName,
      page: citation.page,
      passage: answerContent ? answerContent.slice(0, 240) + '...' : undefined,
    });
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-slate-50 font-sans text-slate-900">
      
      {/* ── COLUMN 1: LEFT DARK NAVY SIDEBAR (#0A1128) ─────────────── */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="bg-navy-900 text-white flex flex-col justify-between p-4 shrink-0 border-r border-slate-800 select-none overflow-hidden z-20"
          >
            <div className="flex flex-col gap-5 overflow-hidden">
              
              {/* Logo & Close / Home */}
              <div className="flex items-center justify-between">
                <div
                  onClick={onBackToHome}
                  className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-saffron to-amber-300 flex items-center justify-center text-slate-950 font-bold shadow-md">
                    <Shield className="w-4 h-4 fill-slate-950 stroke-slate-950" />
                  </div>
                  <span className="font-heading font-extrabold text-lg text-white tracking-tight">Citizen AI</span>
                </div>

                <div className="flex items-center gap-1">
                  {onBackToHome && (
                    <button
                      onClick={onBackToHome}
                      className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800 transition-colors flex items-center gap-1"
                      title="Back to Landing Page"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Home</span>
                    </button>
                  )}

                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Collapse sidebar"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* + New Chat Button with Magnetic Hover Effect */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNewChat}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-saffron to-amber-400 hover:from-amber-400 hover:to-saffron text-slate-950 font-heading font-bold text-sm shadow-md shadow-saffron/20 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>New chat</span>
              </motion.button>

              {/* Quick Search trigger (Ctrl+K) */}
              <button
                onClick={() => setIsCommandOpen(true)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 text-xs text-slate-400 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5" />
                  <span>Search commands...</span>
                </span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-700">
                  ⌘K
                </kbd>
              </button>

              {/* RECENT Section */}
              <div className="flex flex-col gap-1.5 mt-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                  RECENT
                </span>

                <div className="flex flex-col gap-1 max-h-44 overflow-y-auto pr-1">
                  {RECENT_CHATS.map((chat) => {
                    const isActive = activeRecentId === chat.id;
                    return (
                      <button
                        key={chat.id}
                        onClick={() => handleSelectRecent(chat)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all truncate ${
                          isActive
                            ? 'bg-[#182348] text-white shadow-sm font-semibold border-l-2 border-saffron'
                            : 'text-slate-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {chat.title}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DOCUMENT LIBRARY Section */}
              <div className="flex flex-col gap-1.5 mt-1">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    DOCUMENT LIBRARY
                  </span>
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="text-[10px] text-saffron hover:underline font-bold"
                  >
                    + Upload
                  </button>
                </div>

                <div className="flex flex-col gap-1 max-h-44 overflow-y-auto pr-1">
                  {docList.map((doc, idx) => (
                    <div
                      key={idx}
                      onClick={() =>
                        setSelectedSource({
                          doc_name: doc.name,
                          page: 1,
                          passage: `Official government policy guideline: ${doc.name}. Grounded verification active. You can ask questions about this scheme in the chat!`,
                        })
                      }
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-2.5 cursor-pointer text-slate-300 hover:text-white hover:bg-white/5 border-l-2 ${doc.color}`}
                    >
                      <span className="truncate">{doc.name}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Sidebar Footer Disclaimer */}
            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 leading-snug">
              Not official government advice. Verify with official sources.
            </div>

          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── COLUMN 2: CENTER CLEAN CHAT AREA (#F8FAFC) ─────────────── */}
      <main
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex-1 bg-[#F8FAFC] flex flex-col min-w-0 h-full relative transition-colors ${
          isDragOver ? 'ring-4 ring-saffron ring-inset bg-amber-50/20' : ''
        }`}
      >
        {/* Drag-over dropzone overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-navy-900/40 backdrop-blur-xs z-50 flex flex-col items-center justify-center pointer-events-none text-white">
            <div className="bg-white text-navy-900 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-saffron animate-bounce">
              <Upload className="w-6 h-6 text-saffron" />
              <span className="font-heading font-bold text-sm">Drop PDF here to attach to chat</span>
            </div>
          </div>
        )}

        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200/90 px-6 py-3.5 flex items-center justify-between shrink-0 shadow-xs z-10">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 rounded-lg text-slate-600 hover:text-navy-900 hover:bg-slate-100 transition-colors"
                title="Expand sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}

            <h1 className="font-heading font-bold text-base text-navy-900 tracking-tight truncate">
              {activeChatTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            {attachments.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 font-semibold border border-amber-200 shadow-xs">
                <Paperclip className="w-3.5 h-3.5 text-amber-600" />
                <span>{attachments.length} Attached {attachments.length === 1 ? 'Doc' : 'Docs'}</span>
              </span>
            )}

            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Official Citations Active
            </span>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Upload PDF</span>
            </button>
          </div>
        </header>

        {/* Messages List Container */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';

              if (isUser) {
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col items-end gap-1.5"
                  >
                    {/* User Message Attachment Chips */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 justify-end">
                        {msg.attachments.map((att, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setSelectedSource({
                                doc_name: att.filename.replace(/\.pdf$/i, '').replace(/_/g, ' '),
                                page: 1,
                                passage: `Attached PDF Document: ${att.filename} (${formatFileSize(att.file_size)})${att.page_count ? ` · ${att.page_count} pages` : ''}`,
                              });
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-navy-800 text-white text-xs cursor-pointer border border-navy-700 hover:border-saffron transition-colors shadow-xs"
                            title="Click to view file in inspector"
                          >
                            <FileText className="w-3.5 h-3.5 text-saffron" />
                            <span className="font-semibold truncate max-w-[180px]">{att.filename}</span>
                            <span className="text-slate-300 text-[10px]">· {formatFileSize(att.file_size)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="bg-navy-900 text-white px-5 py-3 rounded-2xl rounded-tr-sm text-sm font-medium max-w-[80%] leading-relaxed shadow-sm">
                      {msg.content}
                    </div>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-start gap-3 max-w-[90%]"
                >
                  {/* Yellow/Saffron Avatar */}
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-saffron to-amber-300 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                    <div className="w-3.5 h-3.5 rounded bg-slate-950" />
                  </div>

                  {/* Message Card */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3.5 flex-1">
                    
                    {/* Markdown Content */}
                    <div className="markdown-light">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>

                    {/* Spring Citation Chips */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                        {msg.citations.map((c, i) => {
                          const cleanDoc = c.doc_name.replace(/\.pdf$/i, '').replace(/_/g, ' ');
                          return (
                            <motion.button
                              key={i}
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => handleCitationClick(c, msg.content)}
                              className="px-2.5 py-1 rounded-md border border-emerald-400 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                              title="Click to view verified source excerpt"
                            >
                              <span>{cleanDoc}, p. {c.page}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    )}

                    {/* Fallback button when scoped search found nothing */}
                    {msg.offer_library_search && (
                      <div className="pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            const msgIdx = messages.findIndex(m => m.id === msg.id);
                            const prevUser = msgIdx > 0 ? messages.slice(0, msgIdx).reverse().find(m => m.sender === 'user') : null;
                            if (prevUser) {
                              handleSearchAllDocs(prevUser.content);
                            }
                          }}
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all hover:scale-102 cursor-pointer"
                        >
                          <Search className="w-3.5 h-3.5 text-saffron" />
                          <span>Search all documents instead</span>
                        </button>
                      </div>
                    )}

                    {/* Actions Bar: Helpful, Not helpful, Copy */}
                    <div className="flex items-center gap-2 pt-1 text-slate-500 text-xs">
                      <button
                        onClick={() => handleFeedbackClick(msg.id, true)}
                        className={`px-3 py-1 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
                          msg.helpful === true
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Helpful</span>
                      </button>

                      <button
                        onClick={() => handleFeedbackClick(msg.id, false)}
                        className={`px-3 py-1 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
                          msg.helpful === false
                            ? 'bg-red-50 border-red-300 text-red-600'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        <span>Not helpful</span>
                      </button>

                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors flex items-center gap-1.5"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      {msg.latency_sec !== undefined && (
                        <span className="text-[10px] text-slate-400 ml-auto">
                          Grounded in {msg.latency_sec.toFixed(2)}s
                        </span>
                      )}
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Animated Retrieval Progression Pill */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-saffron flex items-center justify-center shrink-0">
                <div className="w-3.5 h-3.5 rounded bg-slate-950 animate-pulse" />
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3.5 shadow-sm flex items-center gap-3 text-xs text-slate-600">
                <Loader2 className="w-4 h-4 animate-spin text-saffron" />
                <span className="font-medium">{retrievalStage || 'Retrieving official circulars...'}</span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Area: Chips & Input Bar */}
        <div className="p-4 sm:p-6 bg-white border-t border-slate-200/90 shrink-0 flex flex-col gap-3 shadow-lg">
          {/* Attachment Chips inside Composer (above input) */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              {attachments.map((att) => (
                <div
                  key={att.doc_id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs text-xs text-slate-700 max-w-[280px]"
                >
                  <FileText className="w-4 h-4 text-saffron shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold truncate text-slate-800 text-[11px]" title={att.filename}>
                      {att.filename}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatFileSize(att.file_size)}
                      {att.page_count ? ` · ${att.page_count} pgs` : ''}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  <div className="shrink-0 flex items-center ml-auto pl-1">
                    {att.status === 'uploading' && (
                      <span title="Uploading...">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                      </span>
                    )}
                    {att.status === 'processing' && (
                      <div className="flex items-center gap-1 text-[10px] text-saffron font-bold" title={`Processing (${Math.round(att.progress * 100)}%)`}>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-saffron" />
                        <span>{Math.round(att.progress * 100)}%</span>
                      </div>
                    )}
                    {att.status === 'ready' && (
                      <span title="Ready for questions">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </span>
                    )}
                    {att.status === 'failed' && (
                      <span title={att.error || 'Failed to process'}>
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.doc_id)}
                      className="ml-1 p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                      title="Remove attachment"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Hidden file input for paperclip */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".pdf"
            multiple
            className="hidden"
          />

          {/* Clean Input Form with Paperclip */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-2xl p-1.5 focus-within:border-navy-900 focus-within:bg-white transition-all shadow-inner"
          >
            {/* Paperclip Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl text-slate-500 hover:text-navy-900 hover:bg-slate-200/70 transition-colors shrink-0"
              title="Attach PDF file (up to 3 files, max 20MB each)"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                searchScope === 'attached'
                  ? 'Ask anything about the attached PDF...'
                  : 'Ask about any government scheme or welfare guideline...'
              }
              disabled={loading}
              className="flex-1 px-3 py-2 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading || !allAttachmentsReady}
              className={`px-5 py-2.5 rounded-xl font-heading font-bold text-xs transition-all flex items-center gap-1.5 ${
                input.trim() && !loading && allAttachmentsReady
                  ? 'bg-navy-900 hover:bg-slate-800 text-white shadow-md cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {!allAttachmentsReady ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Send</span>
                  <Send className="w-3 h-3" />
                </>
              )}
            </button>
          </form>

        </div>

      </main>

      {/* ── COLUMN 3: RIGHT DOCUMENT SOURCE INSPECTOR ─────────────── */}
      <aside className="w-80 lg:w-96 bg-white border-l border-slate-200 flex flex-col p-6 shrink-0 h-full overflow-y-auto z-10 shadow-sm">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-heading font-bold text-sm text-navy-900 leading-tight">
              {selectedSource.doc_name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Page {selectedSource.page} of 38
            </p>
          </div>

          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Source
          </span>
        </div>

        {/* Paper Simulation Box */}
        <div className="mt-5 flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col gap-3.5 shadow-inner">
          
          {/* Skeleton Paragraph Top */}
          <div className="space-y-2">
            <div className="h-2.5 bg-slate-200 rounded-full w-3/4" />
            <div className="h-2.5 bg-slate-200 rounded-full w-full" />
            <div className="h-2.5 bg-slate-200 rounded-full w-5/6" />
          </div>

          {/* Amber Highlighted Callout Box with Subtle Pulse */}
          <motion.div
            key={selectedSource.doc_name + selectedSource.page}
            initial={{ scale: 0.98, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-amber-100/90 border border-amber-300 text-slate-900 p-4 rounded-xl text-xs leading-relaxed font-medium shadow-sm"
          >
            {selectedSource.passage ||
              'Small and marginal farmer families with cultivable landholding are eligible for benefits under the scheme.'}
          </motion.div>

          {/* Skeleton Paragraph Bottom */}
          <div className="space-y-2 pt-1">
            <div className="h-2.5 bg-slate-200 rounded-full w-full" />
            <div className="h-2.5 bg-slate-200 rounded-full w-11/12" />
            <div className="h-2.5 bg-slate-200 rounded-full w-2/3" />
          </div>

          <div className="space-y-2 pt-2">
            <div className="h-2.5 bg-slate-200 rounded-full w-4/5" />
            <div className="h-2.5 bg-slate-200 rounded-full w-full" />
          </div>

        </div>

        {/* Bottom Verification Note */}
        <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Directly verified against official Government PDF.</span>
        </div>

      </aside>

      {/* ── COMMAND PALETTE MODAL (Ctrl/Cmd + K) ─────────────────────── */}
      <AnimatePresence>
        {isCommandOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-start justify-center pt-24 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-navy-900 border border-slate-700 text-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center px-4 py-3 border-b border-slate-800">
                <Search className="w-4 h-4 text-slate-400 mr-3" />
                <input
                  type="text"
                  placeholder="Type a scheme command or query..."
                  className="bg-transparent text-sm text-white placeholder:text-slate-400 focus:outline-none w-full"
                  autoFocus
                />
                <kbd className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400">ESC</kbd>
              </div>

              <div className="p-2 text-xs space-y-1">
                <button
                  onClick={() => {
                    setIsCommandOpen(false);
                    handleSend('What are the criteria for PM-KISAN landholder eligibility and exclusion categories?');
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 flex items-center justify-between text-slate-200"
                >
                  <span>🌾 Check PM-KISAN Eligibility</span>
                  <span className="text-[10px] text-slate-400">Ask AI</span>
                </button>

                <button
                  onClick={() => {
                    setIsCommandOpen(false);
                    handleSend('What are the 18 traditional trades covered under PM Vishwakarma?');
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 flex items-center justify-between text-slate-200"
                >
                  <span>🛠️ List PM Vishwakarma 18 Trades</span>
                  <span className="text-[10px] text-slate-400">Ask AI</span>
                </button>

                <button
                  onClick={() => {
                    setIsCommandOpen(false);
                    setIsUploadModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 flex items-center justify-between text-slate-200"
                >
                  <span>☁️ Upload & Index New Scheme PDF</span>
                  <span className="text-[10px] text-saffron">Action</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── UPLOAD DOCUMENT MODAL ──────────────────────────────────── */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-navy-900 text-white w-full max-w-2xl rounded-3xl p-6 shadow-2xl border border-slate-700 relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <h2 className="font-heading font-bold text-xl text-white mb-1">Upload Scheme PDF</h2>
              <p className="text-xs text-slate-400 mb-6">
                Upload any official scheme circular to index it into ChromaDB with multi-page citation grounding.
              </p>

              <DocumentUploadPanel
                onGoToChat={(q) => {
                  setIsUploadModalOpen(false);
                  loadDocuments();
                  if (q) handleSend(q);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
