'use client';

import React, { useState } from 'react';
import { Calculator, Sparkles, ArrowRight, ShieldAlert, CheckCircle } from 'lucide-react';

interface WelfareCalculatorProps {
  onAskAI: (query: string) => void;
}

export default function WelfareCalculator({ onAskAI }: WelfareCalculatorProps) {
  const [selectedCalc, setSelectedCalc] = useState<'pm-kisan' | 'vishwakarma-stipend' | 'kcc-interest' | 'svanidhi-subsidy'>('pm-kisan');

  // PM-KISAN inputs
  const [kisanInstallments, setKisanInstallments] = useState(3);

  // PM Vishwakarma inputs
  const [trainingDays, setTrainingDays] = useState(15);
  const [dailyStipend, setDailyStipend] = useState(500);
  const [includeToolkit, setIncludeToolkit] = useState(true);

  // KCC Loan inputs
  const [kccPrincipal, setKccPrincipal] = useState(200000);
  const [isPromptRepayment, setIsPromptRepayment] = useState(true);

  // PM SVANidhi inputs
  const [svanidhiLoan, setSvanidhiLoan] = useState(10000);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Calculator className="w-4 h-4" />
          <span>Python AST Safe Arithmetic Engine</span>
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Government Benefit & Subsidy Calculator
        </h2>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto mt-2">
          Compute accurate financial grants, loan interest subventions, and training stipends without arithmetic hallucinations.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
        {[
          { id: 'pm-kisan', label: '🌾 PM-KISAN Installments' },
          { id: 'vishwakarma-stipend', label: '🛠️ Vishwakarma Training Stipend' },
          { id: 'kcc-interest', label: '💳 KCC 4% Subsidized Loan' },
          { id: 'svanidhi-subsidy', label: '🛒 PM SVANidhi 7% Subsidy' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCalc(tab.id as any)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              selectedCalc === tab.id
                ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/25'
                : 'glass-card border border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Calculator Card */}
      <div className="rounded-3xl glass-panel border border-white/10 p-6 sm:p-8 max-w-3xl mx-auto shadow-2xl">
        
        {/* 1. PM-KISAN */}
        {selectedCalc === 'pm-kisan' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">PM-KISAN Samman Nidhi Calculation</h3>
                <p className="text-xs text-slate-400">₹2,000 per installment every 4 months via Direct Benefit Transfer (DBT)</p>
              </div>
              <span className="text-2xl">🌾</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Number of 4-Month Installments in Financial Year: <span className="text-orange-400 font-bold">{kisanInstallments}</span>
              </label>
              <input
                type="range"
                min="1"
                max="3"
                value={kisanInstallments}
                onChange={(e) => setKisanInstallments(Number(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                <span>1 Installment (₹2,000)</span>
                <span>2 Installments (₹4,000)</span>
                <span>3 Installments (₹6,000 Full Year)</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between">
              <div>
                <span className="text-xs text-orange-400 font-semibold uppercase tracking-wider block">Total Disbursed Benefit</span>
                <span className="text-2xl font-black text-white">₹{(kisanInstallments * 2000).toLocaleString('en-IN')}</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Equivalent to ₹500/month [Source: PM_KISAN, Page 1]</span>
              </div>
              <button
                onClick={() => onAskAI(`If a farmer gets 6000 per year under PM KISAN, calculate monthly amount 6000 / 12`)}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verify with AI</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. PM Vishwakarma */}
        {selectedCalc === 'vishwakarma-stipend' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">PM Vishwakarma Skill & Toolkit Package</h3>
                <p className="text-xs text-slate-400">₹500/day training allowance + ₹15,000 modern digital toolkit grant</p>
              </div>
              <span className="text-2xl">🛠️</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Training Days (Basic: 5-7 | Advanced: 15+): <span className="text-orange-400 font-bold">{trainingDays} Days</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={trainingDays}
                  onChange={(e) => setTrainingDays(Number(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 sm:pt-0">
                <input
                  type="checkbox"
                  id="toolkit"
                  checked={includeToolkit}
                  onChange={(e) => setIncludeToolkit(e.target.checked)}
                  className="w-5 h-5 accent-orange-500 rounded cursor-pointer"
                />
                <label htmlFor="toolkit" className="text-xs font-semibold text-slate-200 cursor-pointer">
                  Include ₹15,000 Toolkit e-Voucher Incentive
                </label>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between">
              <div>
                <span className="text-xs text-orange-400 font-semibold uppercase tracking-wider block">Total Financial Package</span>
                <span className="text-2xl font-black text-white">
                  ₹{((trainingDays * dailyStipend) + (includeToolkit ? 15000 : 0)).toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  (Stipend: ₹{(trainingDays * dailyStipend).toLocaleString('en-IN')} + Toolkit: ₹{includeToolkit ? '15,000' : '0'})
                </span>
              </div>
              <button
                onClick={() => onAskAI(`If an artisan attends ${trainingDays} days training at 500 per day plus 15000 toolkit, calculate total benefit`)}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verify with AI</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. KCC Loan */}
        {selectedCalc === 'kcc-interest' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Kisan Credit Card (KCC) Crop Loan Interest</h3>
                <p className="text-xs text-slate-400">7% Base Rate - 3% Prompt Repayment Incentive = 4% Effective Interest</p>
              </div>
              <span className="text-2xl">💳</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Crop Loan Principal Amount: <span className="text-emerald-400 font-bold">₹{kccPrincipal.toLocaleString('en-IN')}</span>
              </label>
              <input
                type="range"
                min="50000"
                max="300000"
                step="25000"
                value={kccPrincipal}
                onChange={(e) => setKccPrincipal(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                <span>₹50,000</span>
                <span>₹1,60,000 (Collateral Free)</span>
                <span>₹3,00,000 (Max Limit)</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="prompt"
                checked={isPromptRepayment}
                onChange={(e) => setIsPromptRepayment(e.target.checked)}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
              <label htmlFor="prompt" className="text-xs font-semibold text-slate-200 cursor-pointer">
                Apply 3% Prompt Repayment Incentive (PRI) for on-time payment
              </label>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider block">
                  Annual Interest Payable ({isPromptRepayment ? '4% Subsidized Rate' : '7% Base Rate'})
                </span>
                <span className="text-2xl font-black text-white">
                  ₹{(kccPrincipal * (isPromptRepayment ? 0.04 : 0.07)).toLocaleString('en-IN')} / year
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Saves ₹{(kccPrincipal * 0.03).toLocaleString('en-IN')} through prompt repayment subvention!
                </span>
              </div>
              <button
                onClick={() => onAskAI(`What is the interest on KCC crop loan of ${kccPrincipal} at 4% prompt repayment rate?`)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verify with AI</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. PM SVANidhi */}
        {selectedCalc === 'svanidhi-subsidy' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">PM SVANidhi Street Vendor Subsidy</h3>
                <p className="text-xs text-slate-400">7% Interest Subsidy directly credited quarterly + ₹1,200 annual digital cashback</p>
              </div>
              <span className="text-2xl">🛒</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Select Loan Tranche: <span className="text-blue-400 font-bold">₹{svanidhiLoan.toLocaleString('en-IN')}</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[10000, 20000, 50000].map((amt, i) => (
                  <button
                    key={amt}
                    onClick={() => setSvanidhiLoan(amt)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      svanidhiLoan === amt
                        ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                        : 'bg-slate-800 text-slate-300 border-white/5 hover:bg-slate-700'
                    }`}
                  >
                    Tranche {i + 1}: ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
              <div>
                <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider block">7% Annual Interest Subsidy Credited</span>
                <span className="text-2xl font-black text-white">
                  ₹{(svanidhiLoan * 0.07).toLocaleString('en-IN')} / year
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">+ Up to ₹1,200 Cashback for Digital UPI Transactions</span>
              </div>
              <button
                onClick={() => onAskAI(`What is 7% interest subsidy on ${svanidhiLoan} loan under PM SVANidhi?`)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verify with AI</span>
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
