'use client';

import React, { useState } from 'react';
import { ArrowLeftRight, Sparkles, Check, X } from 'lucide-react';

interface ComparisonMatrixProps {
  onAskAI: (query: string) => void;
}

export default function ComparisonMatrix({ onAskAI }: ComparisonMatrixProps) {
  const comparisonSets = [
    {
      title: '🌾 PM-KISAN vs 💳 Kisan Credit Card (KCC)',
      subtitle: 'Income Support vs Subsidized Crop Loans for Indian Farmers',
      schemes: ['PM-KISAN', 'Kisan Credit Card (KCC)'],
      headers: ['Parameter', 'PM-KISAN Samman Nidhi', 'Kisan Credit Card (KCC)'],
      rows: [
        ['Type of Assistance', 'Direct Income Support Grant (100% Grant)', 'Subsidized Short-Term Revolving Credit / Loan'],
        ['Benefit Amount', '₹6,000 per year (3 installments of ₹2,000)', 'Scale of finance up to ₹3.00 Lakh'],
        ['Effective Interest Rate', '0% (No loan, non-repayable grant)', '4% per annum (with Prompt Repayment Incentive)'],
        ['Repayment Obligation', 'None (Kept directly by farmer)', 'Principal + 4% interest payable within 12 months'],
        ['Collateral Requirement', 'No collateral needed', 'Collateral-free up to ₹1.60 Lakh (tie-up to ₹3 Lakh)'],
        ['Target Beneficiaries', 'All landholding farmer families', 'Owner cultivators, tenant farmers, oral lessees, dairy/fishers'],
        ['Disbursement Mode', 'Direct Benefit Transfer (DBT) to bank', 'Rupay Kisan Debit Card / ATM withdrawal']
      ],
      queryPrompt: 'What is the complete comparison between PM-KISAN and Kisan Credit Card?'
    },
    {
      title: '🛠️ PM Vishwakarma vs 🛒 PM SVANidhi',
      subtitle: 'Traditional Artisans Support vs Urban Street Vendors Micro-Credit',
      schemes: ['PM Vishwakarma', 'PM SVANidhi'],
      headers: ['Parameter', 'PM Vishwakarma Scheme', 'PM SVANidhi Scheme'],
      rows: [
        ['Target Audience', '18 Traditional Trades (Carpenters, Masons, Tailors, etc.)', 'Urban Street Vendors, Hawkers & Thelewale'],
        ['Credit Support', 'Tranche 1: ₹1 Lakh (18m) | Tranche 2: ₹2 Lakh (30m)', 'Tranche 1: ₹10k | Tranche 2: ₹20k | Tranche 3: ₹50k'],
        ['Interest Subsidy / Rate', 'Flat 5% concessional rate (Govt pays 8% subvention)', '7% per annum interest subsidy credited quarterly'],
        ['Free Toolkit / Grant', '₹15,000 Modern Toolkit incentive via e-Voucher', 'No toolkit (working capital micro-loan only)'],
        ['Skill Training & Stipend', 'Basic (5-7d) & Advanced (15d+) @ ₹500/day stipend', 'No formal training requirement'],
        ['Digital Incentives', '₹1 per transaction up to 100 transactions/month', 'Up to ₹100 cashback/month (₹1,200/year via UPI)'],
        ['Collateral Free', '100% Collateral-Free (CGTMSE covered)', '100% Collateral-Free (Credit Guarantee covered)']
      ],
      queryPrompt: 'Compare loan tranches, interest subsidies, and perks between PM Vishwakarma and PM SVANidhi.'
    }
  ];

  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const activeSet = comparisonSets[activeSetIndex];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
          <ArrowLeftRight className="w-4 h-4" />
          <span>Cross-Scheme Intelligence Matrix</span>
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Side-by-Side Scheme Comparison
        </h2>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto mt-2">
          Compare loan limits, interest subventions, collateral waivers, and eligibility across major central schemes.
        </p>
      </div>

      {/* Comparison Selector Tabs */}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        {comparisonSets.map((set, idx) => (
          <button
            key={idx}
            onClick={() => setActiveSetIndex(idx)}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              activeSetIndex === idx
                ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/25'
                : 'glass-card border border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            {set.title}
          </button>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="rounded-3xl glass-panel border border-white/10 overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-white/10 bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">{activeSet.title}</h3>
            <p className="text-xs text-slate-400">{activeSet.subtitle}</p>
          </div>
          <button
            onClick={() => onAskAI(activeSet.queryPrompt)}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Analyze with Citizen AI</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-slate-950/60">
                {activeSet.headers.map((h, i) => (
                  <th
                    key={i}
                    className={`py-3.5 px-5 font-bold uppercase tracking-wider ${
                      i === 0 ? 'text-slate-400 w-1/4' : 'text-orange-300 w-3/8'
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {activeSet.rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-5 font-semibold text-slate-300 bg-slate-900/30">
                    {row[0]}
                  </td>
                  <td className="py-3 px-5 text-slate-200">
                    {row[1]}
                  </td>
                  <td className="py-3 px-5 text-slate-200">
                    {row[2]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
