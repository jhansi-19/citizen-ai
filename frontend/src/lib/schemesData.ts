import { SchemeDetail } from '@/types';

export const OFFICIAL_SCHEMES_DATA: SchemeDetail[] = [
  {
    id: 'pm-kisan',
    title: 'PM-KISAN Samman Nidhi',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    category: 'farmers',
    badge: 'Direct Income Grant',
    badgeColor: 'from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30',
    icon: '🌾',
    headlineBenefit: '₹6,000 / Year in 3 Direct Installments',
    keyBenefits: [
      '₹2,000 transferred every 4 months via Direct Benefit Transfer (DBT)',
      '100% Central Government funded with zero intermediary cuts',
      'Direct credit linked to Aadhaar Payment Bridge (APB)'
    ],
    eligibility: [
      'All landholding farmer families with cultivable land',
      'Excludes institutional landholders and income tax payees',
      'Valid Aadhaar card and active bank account required'
    ],
    sampleQuery: 'What are the exact eligibility criteria and excluded categories for PM-KISAN?',
    officialPortal: 'https://pmkisan.gov.in'
  },
  {
    id: 'pm-vishwakarma',
    title: 'PM Vishwakarma Scheme',
    ministry: 'Ministry of Micro, Small & Medium Enterprises (MSME)',
    category: 'employment',
    badge: 'Artisans & Craftsmen',
    badgeColor: 'from-orange-500/20 to-amber-500/20 text-orange-300 border-orange-500/30',
    icon: '🛠️',
    headlineBenefit: '₹15,000 Toolkit + Collateral-Free Loans up to ₹3 Lakh',
    keyBenefits: [
      'Covers 18 traditional trades (Carpenters, Masons, Blacksmiths, Tailors, etc.)',
      'Basic (5-7 days) & Advanced (15 days) training with ₹500/day stipend',
      'Concessional loan interest at flat 5% (Govt provides 8% subvention)'
    ],
    eligibility: [
      'Artisan working with hands and traditional tools in family trade',
      'Minimum age 18 years on the date of registration',
      'One member per family eligible'
    ],
    sampleQuery: 'What are the 18 traditional trades covered under PM Vishwakarma and how to get toolkit incentive?',
    officialPortal: 'https://pmvishwakarma.gov.in'
  },
  {
    id: 'ayushman-bharat',
    title: 'Ayushman Bharat (AB PM-JAY)',
    ministry: 'National Health Authority (NHA) & MoHFW',
    category: 'health',
    badge: 'Universal Health Cover',
    badgeColor: 'from-green-500/20 to-emerald-500/20 text-green-300 border-green-500/30',
    icon: '🏥',
    headlineBenefit: '₹5,00,000 Cashless Health Cover / Family / Year',
    keyBenefits: [
      'Covers secondary and tertiary care hospitalization across India',
      'All pre-existing medical conditions covered from Day 1',
      '100% cashless & paperless access at empaneled public & private hospitals'
    ],
    eligibility: [
      'Identified poor and vulnerable families based on SECC 2011 data',
      'No restriction on family size, age, or gender',
      'Ayushman Card / ABHA ID holders'
    ],
    sampleQuery: 'What hospital treatments and pre-existing conditions are covered under Ayushman Bharat PM-JAY?',
    officialPortal: 'https://pmjay.gov.in'
  },
  {
    id: 'kcc',
    title: 'Kisan Credit Card (KCC)',
    ministry: 'Reserve Bank of India & NABARD',
    category: 'farmers',
    badge: 'Subsidized Agri Credit',
    badgeColor: 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30',
    icon: '💳',
    headlineBenefit: 'Crop Loans up to ₹3 Lakh @ 4% Effective Interest',
    keyBenefits: [
      'Base subsidized interest of 7% p.a. with 3% Prompt Repayment Incentive',
      'Collateral-free credit limit up to ₹1.60 Lakh (expandable to ₹3 Lakh)',
      'Covers crop cultivation, post-harvest expenses, dairy, and fisheries'
    ],
    eligibility: [
      'Owner cultivators, tenant farmers, oral lessees & sharecroppers',
      'Self Help Groups (SHGs) and Joint Liability Groups (JLGs)',
      'Valid for 5 years with simple annual renewal'
    ],
    sampleQuery: 'How does the 3% prompt repayment incentive work under Kisan Credit Card?',
    officialPortal: 'https://myscheme.gov.in/schemes/kcc'
  },
  {
    id: 'pm-svanidhi',
    title: "PM SVANidhi (Street Vendor's Nidhi)",
    ministry: 'Ministry of Housing and Urban Affairs (MoHUA)',
    category: 'employment',
    badge: 'Micro-Credit for Vendors',
    badgeColor: 'from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-500/30',
    icon: '🛒',
    headlineBenefit: 'Collateral-Free Loans up to ₹50,000 + 7% Interest Subsidy',
    keyBenefits: [
      'Tranche 1: ₹10,000 ➔ Tranche 2: ₹20,000 ➔ Tranche 3: ₹50,000',
      '7% per annum interest subsidy directly credited quarterly',
      'Up to ₹1,200 annual cashback for digital UPI transactions'
    ],
    eligibility: [
      'Urban street vendors vending on or before March 24, 2020',
      'Possessing Vending Certificate / ID Card from Urban Local Body',
      'No penalty for early or advance repayment'
    ],
    sampleQuery: 'What are the three progressive loan tranches under PM SVANidhi scheme?',
    officialPortal: 'https://pmsvanidhi.mohua.gov.in'
  },
  {
    id: 'pragati-scholarship',
    title: 'AICTE Pragati Scholarship',
    ministry: 'Ministry of Education & AICTE',
    category: 'students',
    badge: 'Girl Child Education',
    badgeColor: 'from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30',
    icon: '🎓',
    headlineBenefit: '₹50,000 / Year for Technical Degree & Diploma',
    keyBenefits: [
      'Financial support towards college tuition, books, computers & stationeries',
      'Disbursed annually for all years of technical study via DBT',
      'Up to 2 girl children per eligible family'
    ],
    eligibility: [
      'Girl students admitted to 1st year technical courses in AICTE institutions',
      'Annual family income must be less than or equal to ₹8.00 Lakh',
      'Applied through National Scholarship Portal (NSP)'
    ],
    sampleQuery: 'What is the family income limit and eligibility for AICTE Pragati Scholarship?',
    officialPortal: 'https://scholarships.gov.in'
  },
  {
    id: 'pmkvy',
    title: 'PM Kaushal Vikas Yojana 4.0 (PMKVY)',
    ministry: 'Ministry of Skill Development & Entrepreneurship',
    category: 'employment',
    badge: 'Free Technical Skill Training',
    badgeColor: 'from-amber-500/20 to-yellow-500/20 text-yellow-300 border-yellow-500/30',
    icon: '⚡',
    headlineBenefit: '100% Free Industry-Relevant Training & Certification',
    keyBenefits: [
      'Short Term Training (STT) & Recognition of Prior Learning (RPL)',
      'Future Skills training in AI, Robotics, 3D Printing, Drones, IoT & Green Hydrogen',
      'Free 3-year accidental insurance under PMSBY + QR-code Skill Badge'
    ],
    eligibility: [
      'School/college dropouts, unemployed youth, and existing craftspeople',
      'Indian citizens possessing valid Aadhaar and bank account',
      'Rozgar Melas and linkage with National Career Service (NCS) portal'
    ],
    sampleQuery: 'What future skills like AI and Drones are covered under PMKVY 4.0?',
    officialPortal: 'https://pmkvyofficial.org'
  },
  {
    id: 'pmfby',
    title: 'PM Fasal Bima Yojana (PMFBY)',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    category: 'farmers',
    badge: 'Comprehensive Crop Insurance',
    badgeColor: 'from-green-500/20 to-lime-500/20 text-lime-300 border-lime-500/30',
    icon: '🌱',
    headlineBenefit: 'Crop Insurance with Minimal 1.5% - 2.0% Farmer Premium',
    keyBenefits: [
      'Kharif Food & Oilseeds: Max 2.0% premium | Rabi: Max 1.5% premium',
      'Commercial / Horticultural crops: Max 5.0% premium',
      'Complete risk cover: Sowing prevention, standing crop loss, post-harvest losses'
    ],
    eligibility: [
      'All farmers growing notified crops in notified areas (loanee & non-loanee)',
      'Claims processed digitally via National Crop Insurance Portal',
      'Balance actuarial premium subsidized 50:50 by Central and State Govts'
    ],
    sampleQuery: 'What are the premium rates for Kharif and Rabi crops under PM Fasal Bima Yojana?',
    officialPortal: 'https://pmfby.gov.in'
  }
];
