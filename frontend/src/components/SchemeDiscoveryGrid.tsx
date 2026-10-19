'use client';

import React, { useState } from 'react';
import { ExternalLink, Sparkles, CheckCircle2, ArrowRight, Shield } from 'lucide-react';
import { OFFICIAL_SCHEMES_DATA } from '@/lib/schemesData';
import { SchemeDetail } from '@/types';

interface SchemeDiscoveryGridProps {
  onSelectQuery: (query: string) => void;
  selectedCategory: string;
  onFilterChange: (category: string) => void;
}

export default function SchemeDiscoveryGrid({
  onSelectQuery,
  selectedCategory,
  onFilterChange
}: SchemeDiscoveryGridProps) {
  const [activeScheme, setActiveScheme] = useState<SchemeDetail | null>(null);

  const filteredSchemes = selectedCategory === 'all'
    ? OFFICIAL_SCHEMES_DATA
    : OFFICIAL_SCHEMES_DATA.filter((s) => s.category === selectedCategory);

  const categories = [
    { id: 'all', label: 'All Schemes', icon: '🏛️' },
    { id: 'farmers', label: 'Farmers & Agri', icon: '🌾' },
    { id: 'employment', label: 'Artisans & MSME', icon: '🛠️' },
    { id: 'health', label: 'Healthcare (PM-JAY)', icon: '🏥' },
    { id: 'students', label: 'Students & Education', icon: '🎓' },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      
      {/* Category Pills Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Explore Official Welfare Schemes</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
              Verified 2026 Guidelines
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Official government initiatives indexed in ChromaDB vector store with page-level citations.
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 rounded-2xl bg-slate-900/80 border border-white/10 max-w-full">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onFilterChange(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Scheme Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {filteredSchemes.map((scheme) => (
          <div
            key={scheme.id}
            className="group relative rounded-3xl glass-card border border-white/10 hover:border-orange-500/40 p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-orange-500/10"
          >
            {/* Top Row: Icon & Category Badge */}
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-2xl shadow-inner">
                  {scheme.icon}
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-gradient-to-r ${scheme.badgeColor}`}>
                  {scheme.badge}
                </span>
              </div>

              {/* Title & Ministry */}
              <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors">
                {scheme.title}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                {scheme.ministry}
              </p>

              {/* Highlight Benefit */}
              <div className="my-3.5 p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block">Key Benefit</span>
                <span className="text-xs font-bold text-white leading-snug block mt-0.5">
                  {scheme.headlineBenefit}
                </span>
              </div>

              {/* Bullet points */}
              <ul className="space-y-1.5 text-xs text-slate-300">
                {scheme.keyBenefits.slice(0, 2).map((b, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bottom Actions */}
            <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between gap-2">
              <a
                href={scheme.officialPortal}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                title="Official Portal"
              >
                <span>Portal</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>

              <button
                onClick={() => onSelectQuery(scheme.sampleQuery)}
                className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all hover:scale-[1.03]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask AI</span>
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
