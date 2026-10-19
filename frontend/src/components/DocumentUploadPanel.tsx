'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  FolderOpen,
  X,
  FileUp,
  BookOpen,
  Tag,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface UploadResult {
  status: 'success' | 'error';
  doc_name: string;
  category: string;
  total_pages: number;
  chunks_created: number;
  message: string;
}

interface UploadedFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  result?: UploadResult;
  error?: string;
}

const CATEGORIES = [
  { value: 'general', label: '📄 General', desc: 'Any government document' },
  { value: 'farmers', label: '🌾 Farmers', desc: 'Agriculture & farmer welfare' },
  { value: 'health', label: '🏥 Health', desc: 'Health schemes & hospitals' },
  { value: 'employment', label: '🛠️ Employment', desc: 'Skills & job schemes' },
  { value: 'education', label: '📚 Education', desc: 'Student & scholarship schemes' },
  { value: 'women', label: '👩 Women', desc: 'Women empowerment schemes' },
  { value: 'housing', label: '🏠 Housing', desc: 'Housing & infrastructure' },
  { value: 'finance', label: '💰 Finance', desc: 'Loans, subsidies & banking' },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface DocumentUploadPanelProps {
  onGoToChat?: (query?: string) => void;
}

export default function DocumentUploadPanel({ onGoToChat }: DocumentUploadPanelProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [category, setCategory] = useState<string>('general');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (newFiles: FileList | File[]) => {
    const pdfFiles = Array.from(newFiles).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );
    if (pdfFiles.length === 0) return;

    const uploadedFiles: UploadedFile[] = pdfFiles.map((f) => ({
      file: f,
      id: `${f.name}-${Date.now()}-${Math.random()}`,
      status: 'pending',
    }));
    setFiles((prev) => [...prev, ...uploadedFiles]);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const uploadAll = async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    for (const uploadedFile of pendingFiles) {
      // Mark as uploading
      setFiles((prev) =>
        prev.map((f) => (f.id === uploadedFile.id ? { ...f, status: 'uploading' } : f))
      );

      try {
        const formData = new FormData();
        formData.append('file', uploadedFile.file);
        formData.append('category', category);

        const response = await fetch(`${API_BASE}/upload`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result: UploadResult = await response.json();
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadedFile.id ? { ...f, status: 'success', result } : f
            )
          );
        } else {
          const err = await response.json().catch(() => ({ detail: 'Upload failed' }));
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadedFile.id
                ? { ...f, status: 'error', error: err.detail || 'Upload failed' }
                : f
            )
          );
        }
      } catch (err: any) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id
              ? { ...f, status: 'error', error: err.message || 'Network error' }
              : f
          )
        );
      }
    }

    setIsUploading(false);
  };

  const clearCompleted = () => {
    setFiles((prev) => prev.filter((f) => f.status === 'pending' || f.status === 'uploading'));
  };

  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const successCount = files.filter((f) => f.status === 'success').length;
  const errorCount = files.filter((f) => f.status === 'error').length;

  return (
    <div className="flex flex-col gap-6">

      {/* Header Info Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-amber-300">Upload Any Government PDF</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload any official scheme circular, gazette notification, or policy PDF.
            It will be instantly parsed, chunked, and indexed — then you can ask questions about it using the AI Assistant.
          </p>
        </div>
      </div>

      {/* Category Selector */}
      <div>
        <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
          <Tag className="w-3.5 h-3.5 inline mr-1" />
          Document Category
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                category === cat.value
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
              }`}
            >
              <div className="text-sm font-semibold">{cat.label}</div>
              <div className="text-xs opacity-70 mt-0.5">{cat.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all py-12 flex flex-col items-center justify-center gap-3 ${
          isDragging
            ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
            : 'border-white/20 bg-white/3 hover:border-white/40 hover:bg-white/5'
        }`}
      >
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDragging ? 'bg-amber-500/20' : 'bg-white/10'}`}>
          <FileUp className={`w-7 h-7 ${isDragging ? 'text-amber-400' : 'text-slate-400'}`} />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-white">
            {isDragging ? 'Drop PDFs here' : 'Drag & drop PDF files here'}
          </p>
          <p className="text-xs text-slate-500 mt-1">or click to browse · PDF only · Multiple files supported</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {/* File Queue */}
      {files.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Queue ({files.length} file{files.length !== 1 ? 's' : ''})
            </p>
            {(successCount > 0 || errorCount > 0) && (
              <button
                onClick={clearCompleted}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear done
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
            {files.map((f) => (
              <div
                key={f.id}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                  f.status === 'success'
                    ? 'bg-green-500/10 border-green-500/30'
                    : f.status === 'error'
                    ? 'bg-red-500/10 border-red-500/30'
                    : f.status === 'uploading'
                    ? 'bg-blue-500/10 border-blue-500/30'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                {/* Icon */}
                <div className="mt-0.5 flex-shrink-0">
                  {f.status === 'success' && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                  {f.status === 'error' && <XCircle className="w-5 h-5 text-red-400" />}
                  {f.status === 'uploading' && <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />}
                  {f.status === 'pending' && <FileText className="w-5 h-5 text-slate-400" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{f.file.name}</p>
                  <p className="text-xs text-slate-500">
                    {(f.file.size / 1024).toFixed(1)} KB
                  </p>
                  {f.status === 'success' && f.result && (
                    <p className="text-xs text-green-400 mt-1">
                      ✅ {f.result.chunks_created} chunks indexed from {f.result.total_pages} pages
                    </p>
                  )}
                  {f.status === 'error' && (
                    <p className="text-xs text-red-400 mt-1">❌ {f.error}</p>
                  )}
                  {f.status === 'uploading' && (
                    <p className="text-xs text-blue-400 mt-1">⏳ Parsing & indexing into ChromaDB...</p>
                  )}
                </div>

                {/* Remove button (only for pending) */}
                {f.status === 'pending' && (
                  <button
                    onClick={() => removeFile(f.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-xs text-slate-500">
            {pendingCount > 0 && <span className="text-slate-400">📋 {pendingCount} pending</span>}
            {successCount > 0 && <span className="text-green-400">✅ {successCount} indexed</span>}
            {errorCount > 0 && <span className="text-red-400">❌ {errorCount} failed</span>}
          </div>

          {/* Upload Button */}
          {pendingCount > 0 && (
            <button
              onClick={uploadAll}
              disabled={isUploading}
              className={`w-full py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                isUploading
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:shadow-lg hover:shadow-amber-500/25 hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Indexing {pendingCount} file{pendingCount !== 1 ? 's' : ''}...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload & Index {pendingCount} PDF{pendingCount !== 1 ? 's' : ''} into AI
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Success CTA */}
      {successCount > 0 && pendingCount === 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-green-500/15 to-emerald-500/10 border border-green-500/30 p-5 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-green-300">
                🎉 {successCount} document{successCount !== 1 ? 's' : ''} indexed successfully into ChromaDB!
              </p>
              <p className="text-xs text-slate-300 mt-1">
                Your uploaded PDF is now fully available to the AI Assistant with automatic page citation retrieval.
              </p>
            </div>
          </div>

          {onGoToChat && (
            <div className="pt-2 border-t border-green-500/20 flex flex-wrap items-center gap-2">
              <button
                onClick={() => onGoToChat('')}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs rounded-xl shadow-lg hover:brightness-110 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Go to AI Assistant to Ask Questions →</span>
              </button>

              <button
                onClick={() => onGoToChat('What is the monthly contribution for a Rs 5000 pension under APY if I join at age 18?')}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 text-xs rounded-lg transition-all"
              >
                Ask: "APY Contribution for Rs 5000 pension?"
              </button>
            </div>
          )}
        </div>
      )}

      {/* Note */}
      <div className="rounded-xl bg-white/3 border border-white/10 p-3 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-500">
          Uploaded documents are indexed into the same vector database as built-in PDFs.
          The AI will cite them with the exact filename and page number in its answers.
          Only PDF files are supported. Maximum recommended size: 50 MB per file.
        </p>
      </div>

    </div>
  );
}
