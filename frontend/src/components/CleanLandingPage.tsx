'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from 'framer-motion';
import {
  Shield,
  FileText,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Sprout,
  Heart,
  BookOpen,
  Home,
  Users,
  Search,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  FileCheck,
  Zap,
  Lock,
  ExternalLink,
} from 'lucide-react';

interface CleanLandingPageProps {
  onStartChat: (initialQuery?: string, category?: string) => void;
  onOpenDocuments?: () => void;
}

// ── SCHEMES MARQUEE DATA ─────────────────────────────────────────
const SCHEMES_MARQUEE = [
  '🌾 PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
  '🛠️ PM Vishwakarma Scheme (18 Traditional Trades)',
  '🏥 Ayushman Bharat (PM-JAY)',
  '💳 Kisan Credit Card (KCC Scheme)',
  '🛒 PM SVANidhi (Street Vendor\'s AtmaNirbhar Nidhi)',
  '🏠 Pradhan Mantri Awas Yojana (PMAY)',
  '👴 Atal Pension Yojana (APY)',
  '👧 Sukanya Samriddhi Yojana (SSY)',
  '🚀 PM Kaushal Vikas Yojana (PMKVY 4.0)',
  '🧪 Soil Health Card Scheme',
];

// ── CATEGORIES DATA ──────────────────────────────────────────────
const CATEGORIES = [
  {
    id: 'farmers',
    name: 'Agriculture',
    subtitle: 'PM-KISAN, KCC, Soil Health',
    icon: Sprout,
    gradient: 'from-emerald-600 to-teal-800',
    borderGlow: 'rgba(16, 185, 129, 0.4)',
    query: 'What are the criteria for PM-KISAN landholder eligibility and exclusion categories?',
  },
  {
    id: 'health',
    name: 'Health',
    subtitle: 'Ayushman Bharat, PM-JAY',
    icon: Heart,
    gradient: 'from-amber-600 to-orange-800',
    borderGlow: 'rgba(245, 165, 36, 0.4)',
    query: 'How much hospitalization coverage is provided under Ayushman Bharat PM-JAY?',
  },
  {
    id: 'education',
    name: 'Education',
    subtitle: 'NSP, Scholarships, PMKVY',
    icon: BookOpen,
    gradient: 'from-blue-700 to-indigo-900',
    borderGlow: 'rgba(59, 130, 246, 0.4)',
    query: 'What are the scholarship schemes and skill development programs available for students?',
  },
  {
    id: 'housing',
    name: 'Housing',
    subtitle: 'PMAY-Urban, PMAY-Gramin',
    icon: Home,
    gradient: 'from-purple-600 to-indigo-950',
    borderGlow: 'rgba(168, 85, 247, 0.4)',
    query: 'What is the financial assistance and interest subsidy provided under Pradhan Mantri Awas Yojana?',
  },
  {
    id: 'women',
    name: 'Women & Child',
    subtitle: 'PM Ujjwala 2.0, SSY',
    icon: Users,
    gradient: 'from-rose-600 to-pink-900',
    borderGlow: 'rgba(244, 63, 94, 0.4)',
    query: 'What benefits are offered under PM Ujjwala Yojana 2.0 and Sukanya Samriddhi Yojana?',
  },
];

// ── FAQS DATA ────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'How does Citizen AI ensure zero hallucinations?',
    a: 'Citizen AI uses a Hybrid RAG pipeline combining BGE semantic dense embeddings with BM25 token matching over official Ministry guidelines. Every single answer is strictly grounded in the retrieved text and cited with exact PDF names and page numbers.',
  },
  {
    q: 'Can I upload my own official circular or scheme PDF?',
    a: 'Yes! Navigate to the Upload Docs section in the app. Upload any official PDF and our pipeline automatically extracts, chunks, and indexes it into your local ChromaDB vector store. You can immediately ask questions about it.',
  },
  {
    q: 'Is my personal data or Aadhaar information stored?',
    a: 'No. Citizen AI has built-in Phase 8 security guardrails. All queries undergo automated PII masking: Aadhaar numbers (XXXX-XXXX-XXXX), PAN numbers, phone numbers, and emails are redacted before retrieval and LLM processing.',
  },
  {
    q: 'Which government schemes are supported out of the box?',
    a: 'Citizen AI includes full operational guidelines for PM-KISAN, PM Vishwakarma (18 trades), Ayushman Bharat (PM-JAY), Kisan Credit Card (KCC), PM SVANidhi, PMKVY 4.0, PMAY, Atal Pension Yojana, Sukanya Samriddhi Yojana, and DDU-GKY.',
  },
];

// ── 3D TILT CATEGORY CARD ─────────────────────────────────────────
function TiltCategoryCard({
  cat,
}: {
  cat: (typeof CATEGORIES)[0];
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(mouseY, [0, 1], [10, -10]), {
    stiffness: 250,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-10, 10]), {
    stiffness: 250,
    damping: 20,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  const Icon = cat.icon;

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className={`relative cursor-pointer rounded-3xl p-6 bg-gradient-to-br ${cat.gradient} text-white shadow-xl transition-shadow hover:shadow-2xl h-56 flex flex-col justify-between overflow-hidden group border border-white/10`}
    >
      {/* Dynamic Cursor Light Spot */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"
        style={{
          background: `radial-gradient(400px circle at calc(var(--x, 0.5) * 100%) calc(var(--y, 0.5) * 100%), ${cat.borderGlow}, transparent 70%)`,
        }}
      />

      {/* Subtle top glare */}
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />

      {/* Icon */}
      <div className="relative z-10 w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-6 h-6 text-white" />
      </div>

      {/* Text Info */}
      <div className="relative z-10 flex flex-col gap-1">
        <h3 className="font-heading font-bold text-xl tracking-tight leading-tight group-hover:translate-x-0.5 transition-transform">
          {cat.name}
        </h3>
        <p className="text-xs text-white/80 font-medium line-clamp-1">
          {cat.subtitle}
        </p>
      </div>

      {/* Arrow Indicator */}
      <div className="absolute bottom-5 right-5 w-8 h-8 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
        <ArrowRight className="w-4 h-4 text-white" />
      </div>
    </motion.div>
  );
}

// ── MAIN LANDING PAGE COMPONENT ──────────────────────────────────
export default function CleanLandingPage({ onStartChat, onOpenDocuments }: CleanLandingPageProps) {
  const [heroInput, setHeroInput] = useState('');
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [isScrolled, setIsScrolled] = useState(false);

  // Live typing simulation in the preview card
  const [mockTypingStep, setMockTypingStep] = useState(2); // 0: typing, 1: streaming, 2: complete

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 25);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroInput.trim()) {
      onStartChat(heroInput.trim());
    } else {
      onStartChat();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-saffron/30 selection:text-saffron-700 overflow-x-hidden">
      
      {/* ── 1. NAVBAR (Shrinks & Frosted Glass on Scroll) ───────────── */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-navy-900/85 backdrop-blur-xl border-b border-white/10 py-3.5 shadow-2xl'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          
          {/* Logo */}
          <div
            onClick={() => onStartChat()}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-saffron to-amber-300 flex items-center justify-center text-slate-950 shadow-lg shadow-saffron/20 group-hover:scale-105 transition-transform duration-300">
              <Shield className="w-5 h-5 fill-slate-950 stroke-slate-950" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
                <span>Citizen AI</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-saffron/20 text-saffron border border-saffron/30">
                  GOV.IN
                </span>
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How it works
            </a>
            <a href="#browse-by-category" className="hover:text-white transition-colors">
              Schemes
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              About
            </a>
          </nav>

          {/* Right Action */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onStartChat()}
              className="relative group px-5 py-2.5 rounded-xl bg-gradient-to-r from-saffron to-amber-400 text-slate-950 font-heading font-bold text-sm shadow-lg shadow-saffron/25 hover:shadow-saffron/40 hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center gap-1.5"
            >
              <span>Try it now</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

        </div>
      </motion.header>

      {/* ── 2. HERO SECTION WITH AMBIENT AURORA MESH ─────────────────── */}
      <section className="relative bg-navy-900 text-white pt-32 pb-24 lg:pt-40 lg:pb-32 overflow-hidden">
        
        {/* Ambient Gradient Orbs (Stripe Sovereign Depth) */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-saffron/15 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />
        <div className="absolute top-1/3 right-10 w-[550px] h-[550px] bg-teal-500/15 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute -bottom-20 left-1/3 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none" />

        {/* Micro-grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '36px 36px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* Left Column: Headlines & CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 flex flex-col items-start gap-6"
          >
            {/* Pill Badge */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.07] backdrop-blur-md border border-white/15 text-blue-200 text-xs font-semibold tracking-wide shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-saffron" />
              <span>Answers grounded strictly in official .gov.in documents</span>
            </motion.div>

            {/* Headline */}
            <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.12]">
              Find the scheme that <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-white via-slate-100 to-saffron bg-clip-text text-transparent">
                is meant for you.
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed font-normal">
              Ask in plain language. Get an authoritative, cited answer drawn from official guidelines, with the exact page and paragraph to prove it.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onStartChat()}
                className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-saffron to-amber-400 hover:from-amber-400 hover:to-saffron text-slate-950 font-heading font-bold text-sm shadow-xl shadow-saffron/25 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Try it now</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>

              <a
                href="#browse-by-category"
                className="px-6 py-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/15 font-semibold text-sm backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-slate-300" />
                <span>Browse 12 Guidelines</span>
              </a>
            </div>

            {/* Disclaimer */}
            <div className="flex items-center gap-2 pt-1 text-xs text-slate-400">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Not official government advice. Verify with official sources at india.gov.in.</span>
            </div>
          </motion.div>

          {/* Right Column: Live Interactive Mock Chat Demo Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 w-full"
          >
            <div className="relative rounded-3xl bg-white/95 backdrop-blur-2xl p-6 sm:p-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-white/40 flex flex-col gap-4 text-slate-900">
              
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-heading font-bold text-xs text-navy-900">PM-KISAN Eligibility Query</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Grounded: 5 Sources
                </span>
              </div>

              {/* User Question */}
              <div className="flex justify-end">
                <div className="bg-navy-900 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-xs font-medium max-w-[85%] leading-relaxed shadow-sm">
                  Am I eligible for PM Kisan if I own 3 acres of land?
                </div>
              </div>

              {/* Assistant Response with Typing Effect */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-saffron flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <div className="w-3.5 h-3.5 rounded bg-slate-950" />
                </div>

                <div className="flex-1 text-xs text-slate-800 leading-relaxed space-y-2.5">
                  <p>
                    Yes. Small and marginal farmers holding cultivable land in their names are eligible, provided they do not fall under exclusion categories (such as institutional landholders or income tax payers).
                  </p>

                  {/* Non-redirecting preview citation chips */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="px-2.5 py-1 rounded-md border border-emerald-400 bg-emerald-50 text-emerald-800 text-[11px] font-semibold">
                      PM-Kisan Guidelines, p. 4
                    </span>
                    <span className="px-2.5 py-1 rounded-md border border-emerald-400 bg-emerald-50 text-emerald-800 text-[11px] font-semibold">
                      PM-Kisan Guidelines, p. 5
                    </span>
                  </div>

                  {/* Feedback Buttons */}
                  <div className="flex items-center gap-2 pt-1 text-slate-400">
                    <div className="p-1 rounded hover:bg-slate-100 text-emerald-600 border border-slate-200">
                      <ThumbsUp className="w-3 h-3" />
                    </div>
                    <div className="p-1 rounded hover:bg-slate-100 text-slate-400 border border-slate-200">
                      <ThumbsDown className="w-3 h-3" />
                    </div>
                    <span className="text-[10px] text-slate-400 ml-auto">Verified Official Grounding</span>
                  </div>
                </div>
              </div>

              {/* Direct Input Field - Non-redirecting preview */}
              <div className="mt-1 pt-3 border-t border-slate-100">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={heroInput}
                    onChange={(e) => setHeroInput(e.target.value)}
                    placeholder="Ask about any scheme... (Click 'Try it now' to chat)"
                    className="w-full pl-4 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-navy-900 focus:bg-white transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => onStartChat()}
                    className="absolute right-2 p-1.5 rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-colors"
                    title="Start new chat"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          </motion.div>

        </div>

      </section>

      {/* ── 3. INFINITE MARQUEE OF SCHEMES ───────────────────────────── */}
      <div className="bg-navy-950 border-y border-white/10 py-4 overflow-hidden select-none">
        <div className="flex gap-8 whitespace-nowrap animate-marquee">
          {[...SCHEMES_MARQUEE, ...SCHEMES_MARQUEE].map((scheme, idx) => (
            <span
              key={idx}
              className="text-xs font-semibold text-slate-300 flex items-center gap-3 tracking-wide"
            >
              <span>{scheme}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-saffron/60 inline-block" />
            </span>
          ))}
        </div>
      </div>

      {/* ── 4. HOW IT WORKS (Sticky Scroll-Driven Sequence) ──────────── */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-24 border-b border-slate-200/60">
        
        <div className="flex flex-col items-center text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-200 mb-3">
            Grounded Verification Pipeline
          </span>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-navy-900 tracking-tight">
            How it works
          </h2>
          <p className="text-slate-600 text-sm max-w-xl mt-3">
            Every step is architected to eliminate hallucinations and preserve official evidentiary integrity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Step 1 */}
          <motion.div
            whileHover={{ y: -5 }}
            transition={{ duration: 0.2 }}
            className="rounded-3xl bg-white border border-slate-200/80 p-8 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 font-heading font-black text-sm flex items-center justify-center mb-6">
                01
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
                STEP 1
              </span>
              <h3 className="font-heading font-bold text-xl text-navy-900 mt-1 mb-2">
                Add documents
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Browse our curated library of 12 official government PDFs, or upload your own circulars for instant chunking and vector indexing.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-teal-700">
              <FileCheck className="w-4 h-4" />
              <span>PyMuPDF Sliding Window</span>
            </div>
          </motion.div>

          {/* Step 2 */}
          <motion.div
            whileHover={{ y: -5 }}
            transition={{ duration: 0.2 }}
            className="rounded-3xl bg-white border border-slate-200/80 p-8 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-saffron/15 border border-saffron/40 text-saffron-700 font-heading font-black text-sm flex items-center justify-center mb-6">
                02
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-saffron-600">
                STEP 2
              </span>
              <h3 className="font-heading font-bold text-xl text-navy-900 mt-1 mb-2">
                Ask a question
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Type naturally in plain English. The ReAct agent classifies intent, runs safe math evaluation, and queries the hybrid BM25 + dense vector store.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-saffron-700">
              <Zap className="w-4 h-4" />
              <span>Hybrid RRF Retrieval</span>
            </div>
          </motion.div>

          {/* Step 3 */}
          <motion.div
            whileHover={{ y: -5 }}
            transition={{ duration: 0.2 }}
            className="rounded-3xl bg-white border border-slate-200/80 p-8 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 font-heading font-black text-sm flex items-center justify-center mb-6">
                03
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                STEP 3
              </span>
              <h3 className="font-heading font-bold text-xl text-navy-900 mt-1 mb-2">
                Verify the source
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Click any citation chip to open the side panel inspector. Read the exact paragraph and page directly from the official PDF.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-blue-700">
              <CheckCircle2 className="w-4 h-4" />
              <span>Page-Level Evidence</span>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ── 5. BROWSE BY CATEGORY (3D Tilt Cards - Informational Only) ─────────────── */}
      <section id="browse-by-category" className="max-w-7xl mx-auto px-6 py-24">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-saffron-600 bg-saffron/10 px-3 py-1 rounded-full border border-saffron/30 mb-2 inline-block">
              Welfare Portfolios
            </span>
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-navy-900 tracking-tight">
              Browse by category
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Explore key welfare assistance sectors covered in official policy guidelines.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {CATEGORIES.map((cat) => (
            <TiltCategoryCard
              key={cat.id}
              cat={cat}
            />
          ))}
        </div>
      </section>

      {/* ── 6. FAQ ACCORDION WITH ANIMATE PRESENCE ─────────────────────── */}
      <section id="faq" className="max-w-4xl mx-auto px-6 py-20 border-t border-slate-200">
        
        <div className="text-center mb-12">
          <h2 className="font-heading font-extrabold text-3xl text-navy-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Everything you need to know about Citizen AI's architecture, reliability, and privacy.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div
                key={index}
                className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden transition-all"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-heading font-bold text-base text-navy-900 hover:text-saffron-600 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-saffron-600' : ''
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 7. FINAL ACTION BANNER ────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="rounded-3xl bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 p-10 sm:p-14 text-white text-center relative overflow-hidden shadow-2xl border border-white/10">
          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center gap-6">
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl tracking-tight">
              Ready to verify your scheme benefits?
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Ask anything about eligibility, loan subsidies, stipends, or exclusion categories. Fully cited in seconds.
            </p>
            <button
              onClick={() => onStartChat()}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-saffron to-amber-400 text-slate-950 font-heading font-bold text-sm shadow-xl shadow-saffron/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              Start Free Session
            </button>
          </div>
        </div>
      </section>

      {/* ── 8. FOOTER ─────────────────────────────────────────────────── */}
      <footer className="bg-navy-950 text-slate-400 border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-saffron flex items-center justify-center text-slate-950 font-black">
              CA
            </div>
            <div>
              <p className="font-heading font-bold text-white text-sm">Citizen AI</p>
              <p className="text-[11px] text-slate-500">Official Indian Government Scheme Assistant</p>
            </div>
          </div>

          <div className="text-center sm:text-right text-[11px] text-slate-500">
            <p>Not official government advice. Verify with official sources at india.gov.in.</p>
          </div>

        </div>
      </footer>

    </div>
  );
}
