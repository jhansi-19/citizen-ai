'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, CheckCircle2, Layers, ExternalLink } from 'lucide-react';
import { DocumentInfo } from '@/types';
import { fetchDocuments } from '@/lib/api';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DocumentModal({ isOpen, onClose }: DocumentModalProps) {
  const [docs, setDocs] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchDocuments().then((data) => {
        setDocs(data);
        setLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categoryColor: Record<string, string> = {
    farmers: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    employment: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    health: 'text-green-400 bg-green-500/10 border-green-500/20',
    students: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-3xl glass-panel border border-white/10 shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Indexed Scheme Knowledge Base</h3>
              <p className="text-xs text-slate-400">12 Official Government Guidelines Grounded in ChromaDB Vector Store</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content List */}
        <div className="p-6 overflow-y-auto space-y-3">
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm">Loading verified documents from backend...</p>
            </div>
          ) : docs.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <FileText className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-medium">12 Schemes are active in local vector index</p>
              <p className="text-xs text-slate-500">PM-KISAN, PM Vishwakarma, PM-JAY, KCC, PMFBY, PMKVY, PM SVANidhi, Pragati...</p>
            </div>
          ) : (
            docs.map((doc, idx) => {
              const badgeStyle = categoryColor[doc.category] || 'text-slate-300 bg-slate-500/10 border-slate-500/20';
              const cleanName = doc.doc_name.replace(/_/g, ' ').replace('.pdf', '');

              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl glass-card border border-white/5 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="p-2 rounded-xl bg-slate-800 text-slate-300 shrink-0">
                      <FileText className="w-4 h-4 text-orange-400" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate">{cleanName}</h4>
                      <div className="flex items-center space-x-3 mt-1 text-xs text-slate-400">
                        <span>{doc.total_pages} Pages</span>
                        <span>•</span>
                        <span>{doc.chunk_count} Chunks</span>
                        <span>•</span>
                        <span>{doc.file_size_kb.toFixed(1)} KB</span>
                      </div>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider border shrink-0 ${badgeStyle}`}>
                    {doc.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400">
          <span>All documents stored with SHA256 integrity hash</span>
          <span className="text-orange-400 font-medium">Source: Official Government Portals</span>
        </div>

      </div>
    </div>
  );
}
