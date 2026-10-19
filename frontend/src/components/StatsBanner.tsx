'use client';

import React from 'react';
import { Database, ShieldCheck, Zap, Layers } from 'lucide-react';

export default function StatsBanner() {
  const stats = [
    {
      label: 'Verified Corpus',
      value: '348 Chunks',
      sub: '12 Official PDFs',
      icon: Database,
      color: 'text-orange-400',
      border: 'border-orange-500/20',
      bg: 'bg-orange-500/5',
    },
    {
      label: 'Intent Classification',
      value: '<1.0 ms',
      sub: 'Scikit-Learn CPU Router',
      icon: Zap,
      color: 'text-amber-400',
      border: 'border-amber-500/20',
      bg: 'bg-amber-500/5',
    },
    {
      label: 'Retrieval Engine',
      value: '100% Recall@5',
      sub: 'Dense + BM25 Hybrid RRF',
      icon: Layers,
      color: 'text-green-400',
      border: 'border-green-500/20',
      bg: 'bg-green-500/5',
    },
    {
      label: 'Privacy & Security',
      value: '100% Guardrail',
      sub: 'Aadhaar / PII Masked',
      icon: ShieldCheck,
      color: 'text-blue-400',
      border: 'border-blue-500/20',
      bg: 'bg-blue-500/5',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-6 max-w-5xl mx-auto px-4">
      {stats.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className={`p-3.5 rounded-2xl glass-card border ${item.border} ${item.bg} flex items-center space-x-3 transition-transform hover:-translate-y-0.5 duration-200`}
          >
            <div className={`p-2.5 rounded-xl bg-slate-900/80 border border-white/5 ${item.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="text-sm font-bold text-white tracking-tight">{item.value}</span>
              </div>
              <p className="text-[11px] font-medium text-slate-300 truncate">{item.label}</p>
              <p className="text-[10px] text-slate-400 truncate">{item.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
