'use client';

import React from 'react';
import { FileText, ExternalLink, Bookmark } from 'lucide-react';
import { Citation } from '@/types';

interface CitationCardProps {
  citations: Citation[];
}

export default function CitationCard({ citations }: CitationCardProps) {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-white/5">
      <div className="flex items-center space-x-2 mb-2">
        <Bookmark className="w-3.5 h-3.5 text-orange-400" />
        <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
          Verified Official Citations ({citations.length})
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {citations.map((c, idx) => {
          const isWeb = c.url && c.url.startsWith('http');
          const cleanDocName = c.doc_name.replace(/_/g, ' ').replace('.pdf', '');

          if (isWeb) {
            return (
              <a
                key={idx}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-800/90 hover:bg-slate-700 text-blue-300 border border-blue-500/20 transition-all hover:scale-[1.02]"
              >
                <ExternalLink className="w-3 h-3 text-blue-400" />
                <span className="truncate max-w-[200px]">{cleanDocName}</span>
              </a>
            );
          }

          return (
            <div
              key={idx}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-900/90 text-orange-200 border border-orange-500/20 shadow-sm"
            >
              <FileText className="w-3 h-3 text-orange-400 shrink-0" />
              <span className="font-medium truncate max-w-[220px]">{cleanDocName}</span>
              <span className="px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 text-[10px] font-bold">
                P.{c.page}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
