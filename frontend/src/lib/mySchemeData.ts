import { SchemeDetail } from '@/types';

export interface CategoryTile {
  id: string;
  name: string;
  count: number;
  icon: string;
  image: string;
  description: string;
}

export const CATEGORY_TILES: CategoryTile[] = [
  {
    id: 'farmers',
    name: 'Agriculture, Rural & Farming',
    count: 4,
    icon: '🌾',
    image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80',
    description: 'PM-KISAN ₹6k grant, KCC 4% loans, PM Fasal Bima crop insurance',
  },
  {
    id: 'employment',
    name: 'Artisans, Craftsmen & MSME',
    count: 4,
    icon: '🛠️',
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
    description: '18 PM Vishwakarma trades, ₹15k toolkits, PM SVANidhi loans',
  },
  {
    id: 'health',
    name: 'Health, Wellness & Insurance',
    count: 2,
    icon: '🏥',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
    description: 'Ayushman Bharat ₹5L cashless cover, Jan Aushadhi generic medicines',
  },
  {
    id: 'students',
    name: 'Education, Skills & Youth',
    count: 2,
    icon: '🎓',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
    description: 'AICTE Pragati ₹50k scholarship, PMKVY 4.0 free technical training',
  },
];

export const BENEFICIARY_TYPES = [
  { id: 'farmers', label: 'Farmers', icon: '🌾', count: '14+ Crore' },
  { id: 'artisans', label: 'Artisans & Craftsmen', icon: '🛠️', count: '30+ Lakh' },
  { id: 'vendors', label: 'Street Vendors', icon: '🛒', count: '65+ Lakh' },
  { id: 'women', label: 'Women & Girls', icon: '👩', count: '50+ Lakh' },
  { id: 'students', label: 'Students & Youth', icon: '🎓', count: '2+ Crore' },
  { id: 'health_b', label: 'Vulnerable Families', icon: '🏥', count: '12+ Crore' },
];

export const MYSCHEME_CARDS: SchemeDetail[] = [
  {
    id: 'pm-kisan',
    title: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    category: 'farmers',
    badge: 'Direct Income Grant',
    badgeColor: 'from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30',
    icon: '🌾',
    headlineBenefit: '₹6,000 / Year in 3 Direct Installments',
    keyBenefits: [
      '₹2,000 transferred every 4 months directly via DBT',
      '100% Central Sector grant with zero intermediary deduction',
      'Direct Aadhaar Payment Bridge (APB) bank credit'
    ],
    eligibility: [
      'All landholding farmer families with cultivable land in their names',
      'Resident Indian citizen farmers (excluding institutional entities)'
    ],
    sampleQuery: 'What are the criteria for PM-KISAN landholder eligibility and exclusion categories?',
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
    headlineBenefit: '₹15,000 Toolkit Grant + Collateral-Free Loans @ 5%',
    keyBenefits: [
      'Covers 18 traditional trades (Carpenters, Masons, Blacksmiths, Tailors, etc.)',
      'Basic (5-7 days) & Advanced (15 days) skill training with ₹500/day stipend',
      '1st Tranche Loan ₹1 Lakh (18m) ➔ 2nd Tranche ₹2 Lakh (30m)'
    ],
    eligibility: [
      'Artisans and craftspeople working with hands and traditional tools',
      'Minimum age 18 years on the date of registration'
    ],
    sampleQuery: 'What are the 18 traditional trades covered under PM Vishwakarma and how to apply for toolkit voucher?',
    officialPortal: 'https://pmvishwakarma.gov.in'
  },
  {
    id: 'ayushman-bharat',
    title: 'Ayushman Bharat (AB PM-JAY)',
    ministry: 'National Health Authority (NHA) & MoHFW',
    category: 'health',
    badge: 'Universal Healthcare',
    badgeColor: 'from-green-500/20 to-emerald-500/20 text-green-300 border-green-500/30',
    icon: '🏥',
    headlineBenefit: '₹5,00,000 Cashless Health Cover / Family / Year',
    keyBenefits: [
      'Secondary and tertiary care hospitalization across all empaneled hospitals in India',
      'Pre-existing medical conditions covered from Day 1 with zero waiting period',
      'Cashless diagnostics, surgeries, medicines, and post-hospitalization care'
    ],
    eligibility: [
      'Identified poor and vulnerable families from SECC 2011 database',
      'No cap on family size, age, or gender'
    ],
    sampleQuery: 'What treatments and pre-existing conditions are covered under Ayushman Bharat PM-JAY?',
    officialPortal: 'https://pmjay.gov.in'
  },
  {
    id: 'kcc',
    title: 'Kisan Credit Card (KCC) Scheme',
    ministry: 'Reserve Bank of India & NABARD',
    category: 'farmers',
    badge: 'Subsidized Crop Credit',
    badgeColor: 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30',
    icon: '💳',
    headlineBenefit: 'Crop Loans up to ₹3 Lakh @ 4% Effective Interest',
    keyBenefits: [
      '7% Base Interest Subvention with 3% Prompt Repayment Incentive (PRI)',
      'Collateral-free credit limit up to ₹1.60 Lakh (tie-up to ₹3 Lakh)',
      'Covers crop cultivation, post-harvest expenses, dairy, and fisheries'
    ],
    eligibility: [
      'Owner cultivators, tenant farmers, oral lessees & sharecroppers',
      'Self Help Groups (SHGs) and Joint Liability Groups (JLGs)'
    ],
    sampleQuery: 'What is the interest rate and subvention structure under Kisan Credit Card (KCC)?',
    officialPortal: 'https://myscheme.gov.in/schemes/kcc'
  },
  {
    id: 'pm-svanidhi',
    title: "PM SVANidhi (Street Vendor's AtmaNirbhar Nidhi)",
    ministry: 'Ministry of Housing and Urban Affairs (MoHUA)',
    category: 'employment',
    badge: 'Micro-Credit for Vendors',
    badgeColor: 'from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-500/30',
    icon: '🛒',
    headlineBenefit: 'Progressive Loans up to ₹50,000 + 7% Interest Subsidy',
    keyBenefits: [
      '1st Tranche ₹10k ➔ 2nd Tranche ₹20k ➔ 3rd Tranche ₹50k',
      '7% per annum interest subsidy directly credited quarterly',
      'Up to ₹1,200 annual cashback for digital receipts and payments'
    ],
    eligibility: [
      'Urban street vendors with Vending Certificate / ID Card from Urban Local Body',
      'Vendors vending on or before March 24, 2020'
    ],
    sampleQuery: 'What are the loan tranches and interest subsidies available under PM SVANidhi?',
    officialPortal: 'https://pmsvanidhi.mohua.gov.in'
  },
  {
    id: 'pragati-scholarship',
    title: 'AICTE Pragati Scholarship for Girl Students',
    ministry: 'Ministry of Education & AICTE',
    category: 'students',
    badge: 'Girl Child Education',
    badgeColor: 'from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30',
    icon: '🎓',
    headlineBenefit: '₹50,000 / Year for Technical Degree & Diploma',
    keyBenefits: [
      'Annual scholarship towards tuition, books, computers & stationeries',
      'Disbursed directly via DBT for every year of technical study',
      'Up to 2 girl children per eligible family'
    ],
    eligibility: [
      'Girl students admitted to 1st year technical courses in AICTE institutions',
      'Annual family income less than or equal to ₹8.00 Lakh'
    ],
    sampleQuery: 'What is the scholarship amount and family income limit for AICTE Pragati Scholarship?',
    officialPortal: 'https://scholarships.gov.in'
  },
  {
    id: 'pmkvy',
    title: 'PM Kaushal Vikas Yojana 4.0 (PMKVY)',
    ministry: 'Ministry of Skill Development & Entrepreneurship',
    category: 'employment',
    badge: 'Free Technical Training',
    badgeColor: 'from-amber-500/20 to-yellow-500/20 text-yellow-300 border-yellow-500/30',
    icon: '⚡',
    headlineBenefit: '100% Free Industry Training & PMSBY Insurance Cover',
    keyBenefits: [
      'Short Term Training (STT) and Recognition of Prior Learning (RPL)',
      'Future Skills training in AI, Robotics, 3D Printing, Drones, IoT & Green Hydrogen',
      'Free 3-year accidental insurance cover under PMSBY + QR Skill Certificate'
    ],
    eligibility: [
      'School/college dropouts, unemployed youth, and existing artisans',
      'Indian citizens possessing valid Aadhaar and bank account'
    ],
    sampleQuery: 'What training courses and insurance benefits are provided under PMKVY 4.0?',
    officialPortal: 'https://pmkvyofficial.org'
  },
  {
    id: 'pmfby',
    title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    category: 'farmers',
    badge: 'Subsidized Crop Insurance',
    badgeColor: 'from-green-500/20 to-lime-500/20 text-lime-300 border-lime-500/30',
    icon: '🌱',
    headlineBenefit: 'Comprehensive Crop Risk Cover @ 1.5% - 2% Premium',
    keyBenefits: [
      'Kharif Food & Oilseeds: Max 2.0% | Rabi Crops: Max 1.5% premium',
      'Commercial / Horticultural crops: Max 5.0% premium',
      'Covers prevented sowing, localized calamities, standing crop, post-harvest losses'
    ],
    eligibility: [
      'All farmers growing notified crops in notified areas',
      'Claims settled digitally via National Crop Insurance Portal'
    ],
    sampleQuery: 'What are the premium rates for Kharif and Rabi crops under PM Fasal Bima Yojana?',
    officialPortal: 'https://pmfby.gov.in'
  }
];
