'use client';

import React from 'react';
import {
  Bot,
  Layers,
  Calculator,
  ArrowLeftRight,
  FileText,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export type ActiveTab = 'chat' | 'schemes' | 'calculator' | 'compare' | 'upload';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenDocs: () => void;
}

export default function Navbar({ activeTab, onSelectTab, onOpenDocs }: NavbarProps) {
  const navTabs = [
    { id: 'chat', label: 'AI Assistant', icon: Bot, badge: 'Live RAG' },
    { id: 'schemes', label: 'Explore Schemes', icon: Layers, badge: '12 Central' },
    { id: 'calculator', label: 'Benefit Calculator', icon: Calculator, badge: 'Safe AST' },
    { id: 'compare', label: 'Compare Schemes', icon: ArrowLeftRight },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div
            onClick={() => onSelectTab('chat')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-green-600 p-[2px] flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0B0F19] rounded-[14px] flex items-center justify-center">
                <span className="text-xl font-bold bg-gradient-to-r from-orange-400 via-white to-green-400 bg-clip-text text-transparent">
                  🇮🇳
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-black tracking-tight text-white group-hover:text-orange-400 transition-colors">
                  Citizen AI
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 border border-orange-500/30">
                  Gov Welfare
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Citation-Grounded Policy Intelligence</p>
            </div>
          </div>

          {/* Main Navigation Tabs */}
          <nav className="flex items-center space-x-1 bg-slate-900/80 p-1.5 rounded-2xl border border-white/10">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id as ActiveTab)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center space-x-1.5 ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/25'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`hidden md:inline-block text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                      isActive ? 'bg-black/20 text-white' : 'bg-white/10 text-slate-400'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenDocs}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-white/10 transition-colors shadow-sm"
              title="Official PDF Guidelines"
            >
              <FileText className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">12 PDF Vault</span>
            </button>

            <a
              href="https://india.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-green-500/10 border border-green-500/20 text-[11px] font-semibold text-green-400 hover:bg-green-500/20 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
              <span>india.gov.in</span>
            </a>
          </div>

        </div>
      </div>
    </header>
  );
}
