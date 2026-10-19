'use client';

import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  FileCheck,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import { ActiveTab } from './Navbar';

interface HeroSectionProps {
  onSearch: (query: string) => void;
  onSelectTab: (tab: ActiveTab) => void;
  onSelectCategory: (cat: string) => void;
}

export default function HeroSection({ onSearch, onSelectTab, onSelectCategory }: HeroSectionProps) {
  const [heroInput, setHeroInput] = useState('');

  const featuredSectors = [
    {
      id: 'farmers',
      title: 'Farmers & Agriculture',
      icon: '🌾',
      desc: 'PM-KISAN ₹6,000/yr, KCC 4% Subsidized Loan, PM Fasal Bima',
      gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
      borderColor: 'hover:border-amber-500/50',
      badge: '320 Chunks Indexed',
      badgeColor: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
      query: 'What are the complete eligibility guidelines and benefits for PM-KISAN and Kisan Credit Card?',
    },
    {
      id: 'employment',
      title: 'Artisans & MSME',
      icon: '🛠️',
      desc: '18 PM Vishwakarma Trades, ₹15,000 Toolkit, PM SVANidhi Micro-Credit',
      gradient: 'from-orange-500/20 via-amber-500/10 to-transparent',
      borderColor: 'hover:border-orange-500/50',
      badge: '18 Trades Covered',
      badgeColor: 'text-orange-300 bg-orange-500/10 border-orange-500/20',
      query: 'What are the 18 traditional trades covered under PM Vishwakarma and how to get toolkit incentive?',
    },
    {
      id: 'health',
      title: 'Healthcare (PM-JAY)',
      icon: '🏥',
      desc: '₹5 Lakh Cashless Hospitalization, 100% Pre-Existing Diseases from Day 1',
      gradient: 'from-green-500/20 via-emerald-500/10 to-transparent',
      borderColor: 'hover:border-green-500/50',
      badge: '12 Cr Families',
      badgeColor: 'text-green-300 bg-green-500/10 border-green-500/20',
      query: 'How much health insurance coverage is given under Ayushman Bharat PM-JAY and which hospitals are empaneled?',
    },
    {
      id: 'students',
      title: 'Students & Skills',
      icon: '🎓',
      desc: 'AICTE Pragati ₹50,000/yr Scholarship, PMKVY 4.0 Free AI & Tech Training',
      gradient: 'from-blue-500/20 via-indigo-500/10 to-transparent',
      borderColor: 'hover:border-blue-500/50',
      badge: '100% Free Training',
      badgeColor: 'text-blue-300 bg-blue-500/10 border-blue-500/20',
      query: 'What are the eligibility criteria for AICTE Pragati Scholarship for girl students?',
    },
  ];

  const quickPills = [
    { label: '🌾 PM-KISAN ₹6,000 Status', q: 'How is the ₹6000 annual benefit disbursed under PM-KISAN?' },
    { label: '🛠️ 18 Vishwakarma Trades', q: 'What are the 18 traditional trades covered under PM Vishwakarma?' },
    { label: '🏥 Ayushman Bharat ₹5L Cover', q: 'What treatments are covered under Ayushman Bharat PM-JAY?' },
    { label: '🧮 6000 / 12 Monthly Math', q: 'If a farmer gets 6000 per year, calculate 6000 / 12 for monthly' },
    { label: '🛒 PM SVANidhi 7% Subsidy', q: 'What are the loan tranches and 7% interest subsidy under PM SVANidhi?' },
  ];

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroInput.trim()) {
      onSearch(heroInput.trim());
    }
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 pt-4 pb-8">
      
      {/* 🇮🇳 Top Ashoka Tricolor Sovereign Badge */}
      <div className="flex items-center justify-center mb-6">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-white/15 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-white shadow-sm"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-green-600 shadow-sm"></span>
          </div>
          <span className="text-xs font-extrabold text-slate-200 tracking-wider uppercase">
            Official Indian Welfare Intelligence Engine
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
            2026 Sovereign RAG
          </span>
        </div>
      </div>

      {/* Main Hero Header */}
      <div className="text-center max-w-4xl mx-auto mb-8">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
          Direct, Verified Welfare for{' '}
          <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-green-400 bg-clip-text text-transparent">
            Every Indian Citizen.
          </span>
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Grounding official Central Government schemes with <strong className="text-white font-semibold">exact PDF page citations</strong>, safe arithmetic calculators, and real-time welfare assistance.
        </p>
      </div>

      {/* 🔍 Grand Search Input Bar (Perplexity + MyScheme Style) */}
      <div className="max-w-3xl mx-auto mb-8">
        <form
          onSubmit={handleHeroSubmit}
          className="relative flex items-center p-2 rounded-3xl glass-card border border-white/20 bg-slate-900/90 shadow-2xl shadow-orange-500/10 focus-within:border-orange-500/60 focus-within:ring-4 focus-within:ring-orange-500/20 transition-all duration-300"
        >
          <div className="p-3 text-orange-400 pl-4">
            <Search className="w-6 h-6" />
          </div>

          <input
            type="text"
            value={heroInput}
            onChange={(e) => setHeroInput(e.target.value)}
            placeholder="Search any scheme, check eligibility, calculate loans (e.g. PM-KISAN, 18 Vishwakarma trades)..."
            className="flex-1 bg-transparent py-3 px-2 text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!heroInput.trim()}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white text-sm font-bold flex items-center gap-2 hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-orange-500/30 transition-all hover:scale-105"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </form>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center justify-center gap-2 flex-wrap mt-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Popular:</span>
          {quickPills.map((pill, i) => (
            <button
              key={i}
              onClick={() => onSearch(pill.q)}
              className="px-3 py-1 rounded-xl glass-card hover:bg-white/10 text-xs font-medium text-slate-300 border border-white/10 transition-all hover:scale-[1.02] hover:text-white"
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* 🏛️ 4 Core Pillar Visual Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
        {featuredSectors.map((sector) => (
          <div
            key={sector.id}
            onClick={() => onSearch(sector.query)}
            className={`group cursor-pointer rounded-3xl glass-card border border-white/10 ${sector.borderColor} p-5 bg-gradient-to-b ${sector.gradient} transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="text-3xl">{sector.icon}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${sector.badgeColor}`}>
                  {sector.badge}
                </span>
              </div>

              <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors">
                {sector.title}
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                {sector.desc}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-orange-400 group-hover:translate-x-1 transition-transform">
              <span>Ask Citizen AI</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
