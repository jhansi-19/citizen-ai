'use client';

import React, { useState } from 'react';
import { Search, Sparkles, User, Briefcase, IndianRupee, ArrowRight, CheckCircle2 } from 'lucide-react';
import { SchemeDetail } from '@/types';
import { MYSCHEME_CARDS } from '@/lib/mySchemeData';

interface SchemeFinderWizardProps {
  onSelectSchemeQuery: (query: string) => void;
}

export default function SchemeFinderWizard({ onSelectSchemeQuery }: SchemeFinderWizardProps) {
  const [profession, setProfession] = useState<'farmer' | 'artisan' | 'vendor' | 'student' | 'vulnerable'>('farmer');
  const [state, setState] = useState('All India');
  const [incomeRange, setIncomeRange] = useState('< 2.5 Lakh');

  const getMatchedSchemes = (): SchemeDetail[] => {
    switch (profession) {
      case 'farmer':
        return MYSCHEME_CARDS.filter((s) => s.category === 'farmers');
      case 'artisan':
        return MYSCHEME_CARDS.filter((s) => s.id === 'pm-vishwakarma' || s.id === 'pmkvy');
      case 'vendor':
        return MYSCHEME_CARDS.filter((s) => s.id === 'pm-svanidhi');
      case 'student':
        return MYSCHEME_CARDS.filter((s) => s.category === 'students' || s.id === 'pmkvy');
      case 'vulnerable':
        return MYSCHEME_CARDS.filter((s) => s.id === 'ayushman-bharat');
      default:
        return MYSCHEME_CARDS.slice(0, 3);
    }
  };

  const matched = getMatchedSchemes();

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      
      {/* Container with Royal Navy & Gold Civic Tech styling */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-[#0B132B] to-[#1C2541] border border-amber-500/20 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Wizard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-white/10 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
              <span>🎯 3-Step Scheme Eligibility Finder</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Find Government Schemes Based on Your Profile
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Select your profession and income to instantly discover matching Central Government welfare schemes.
            </p>
          </div>

          <div className="text-right hidden md:block">
            <span className="text-3xl font-black text-amber-400">{matched.length}</span>
            <span className="text-xs text-slate-400 block font-medium">Eligible Schemes Found</span>
          </div>
        </div>

        {/* Step 1 & 2 Selector Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          
          {/* Profession Card Selector */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              1. I am a:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'farmer', label: 'Farmer', icon: '🌾' },
                { id: 'artisan', label: 'Artisan', icon: '🛠️' },
                { id: 'vendor', label: 'Street Vendor', icon: '🛒' },
                { id: 'student', label: 'Student', icon: '🎓' },
                { id: 'vulnerable', label: 'BPL / Family', icon: '🏥' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProfession(p.id as any)}
                  className={`p-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                    profession === p.id
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-lg shadow-amber-500/25 border border-amber-400'
                      : 'bg-slate-800/80 text-slate-300 border border-white/5 hover:bg-slate-700'
                  }`}
                >
                  <span className="text-base">{p.icon}</span>
                  <span className="truncate">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Income Selector */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              2. Annual Family Income:
            </label>
            <div className="space-y-2">
              {['< 2.5 Lakh (BPL / Low Income)', '₹2.5L – ₹8.0 Lakh (EWS / Middle)', '> ₹8.0 Lakh (General)'].map((inc) => (
                <button
                  key={inc}
                  onClick={() => setIncomeRange(inc)}
                  className={`w-full p-2.5 rounded-2xl text-xs font-bold text-left transition-all flex items-center justify-between ${
                    incomeRange === inc
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                      : 'bg-slate-800/60 text-slate-400 border border-white/5 hover:bg-slate-800'
                  }`}
                >
                  <span>{inc}</span>
                  {incomeRange === inc && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Location / Domicile */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              3. Coverage Area:
            </label>
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-200">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                <span>All 28 States & 8 Union Territories</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Central Sector schemes indexed with 100% Direct Benefit Transfer (DBT) verification.
              </p>
            </div>
          </div>

        </div>

        {/* Results Showcase Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span>Matching Schemes for Your Profile ({matched.length})</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matched.map((scheme) => (
              <div
                key={scheme.id}
                className="p-5 rounded-2xl bg-slate-800/80 border border-white/10 hover:border-amber-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{scheme.icon}</span>
                      <div>
                        <h4 className="text-sm font-bold text-white">{scheme.title}</h4>
                        <span className="text-[10px] text-slate-400">{scheme.ministry}</span>
                      </div>
                    </div>
                  </div>

                  <div className="my-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <span className="text-xs font-bold text-amber-300">{scheme.headlineBenefit}</span>
                  </div>

                  <ul className="space-y-1 text-xs text-slate-300">
                    {scheme.keyBenefits.slice(0, 2).map((b, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-400 font-bold">•</span>
                        <span className="line-clamp-1">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <a
                    href={scheme.officialPortal}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-400 hover:text-white underline"
                  >
                    Official Portal
                  </a>

                  <button
                    onClick={() => onSelectSchemeQuery(scheme.sampleQuery)}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md hover:scale-105 transition-transform"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ask AI Eligibility</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
