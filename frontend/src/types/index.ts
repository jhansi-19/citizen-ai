export interface Citation {
  doc_name: string;
  page: number;
  score?: number;
  category?: string;
  url?: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  intent?: string;
  tool_used?: string;
  citations?: Citation[];
  confidence?: number;
  latency_sec?: number;
  timestamp: string;
}

export interface AskResponse {
  answer: string;
  intent: string;
  tool_used: string;
  citations: Citation[];
  confidence: number;
  latency_sec: number;
  cached?: boolean;
}

export interface DocumentInfo {
  doc_name: string;
  category: string;
  total_pages: number;
  chunk_count: number;
  file_size_kb: number;
}

export interface SchemeDetail {
  id: string;
  title: string;
  ministry: string;
  category: 'farmers' | 'employment' | 'health' | 'students';
  badge: string;
  badgeColor: string;
  icon: string;
  headlineBenefit: string;
  keyBenefits: string[];
  eligibility: string[];
  sampleQuery: string;
  officialPortal: string;
}
