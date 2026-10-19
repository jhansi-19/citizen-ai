'use client';

import React from 'react';
import { ArrowRight, Layers, ExternalLink } from 'lucide-react';
import { CATEGORY_TILES, BENEFICIARY_TYPES } from '@/lib/mySchemeData';

interface CategoryVisualExplorerProps {
  onSelectCategory: (category: string) => void;
  onSelectQuery: (query: string) => void;
}

export default function CategoryVisualExplorer({
  onSelectCategory,
  onSelectQuery,
}: CategoryVisualExplorerProps) {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      
      {/* 1. Category Visual Photo Grid (myScheme Style) */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Explore Schemes by Category</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                12 Central Schemes
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Browse official government welfare initiatives categorized by national development sectors.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CATEGORY_TILES.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="group cursor-pointer relative h-64 rounded-3xl overflow-hidden border border-white/10 hover:border-amber-500/50 shadow-xl transition-all duration-300 hover:-translate-y-1.5"
            >
              {/* Background Image with Dark Vignette Overlay */}
              <img
                src={cat.image}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080C14] via-[#080C14]/75 to-transparent"></div>

              {/* Foreground Content */}
              <div className="absolute inset-0 p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-2xl bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-xl shadow-lg">
                    {cat.icon}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase bg-amber-500/30 text-amber-300 border border-amber-500/40 backdrop-blur-md">
                    {cat.count} Schemes
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors leading-tight">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                  
                  <div className="mt-3 flex items-center gap-1 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
                    <span>Explore Schemes</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Schemes by Beneficiary Quick Chips (myScheme Style) */}
      <div className="rounded-3xl glass-panel border border-white/10 p-6">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span>Schemes by Targeted Beneficiary:</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {BENEFICIARY_TYPES.map((b) => (
            <div
              key={b.id}
              onClick={() => onSelectQuery(`What government welfare schemes are available for ${b.label}?`)}
              className="cursor-pointer p-3.5 rounded-2xl bg-slate-900/80 hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/30 transition-all text-center group"
            >
              <span className="text-2xl block mb-1.5">{b.icon}</span>
              <span className="text-xs font-bold text-white group-hover:text-amber-300 block">{b.label}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{b.count} Citizens</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
