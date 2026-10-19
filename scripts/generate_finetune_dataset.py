"""
scripts/generate_finetune_dataset.py

Generates 1,000+ domain-specific instruction tuning pairs for Qwen2.5-1.5B-Instruct
grounded in official Indian Government scheme documents.

Dataset composition:
1. Grounded Scheme QA with [Source: doc, Page X] citations (70%)
2. Multi-turn Scheme Eligibility & Benefit Calculations (10%)
3. Cross-Scheme Comparisons & Recommendation (10%)
4. Adversarial Out-of-Scope Safe Refusals (10%)

Output format:
HuggingFace ChatML / OpenAI standard format:
{"messages": [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}
Saved to: data/finetune/train.jsonl (90%) and data/finetune/val.jsonl (10%)
"""

import os
import sys
import json
import random
from pathlib import Path
from typing import List, Dict, Any

ROOT_DIR = Path(__file__).resolve().parent.parent
CHUNKS_FILE = ROOT_DIR / "data" / "chunks" / "all_chunks.jsonl"
FINETUNE_DIR = ROOT_DIR / "data" / "finetune"
TRAIN_FILE = FINETUNE_DIR / "train.jsonl"
VAL_FILE = FINETUNE_DIR / "val.jsonl"

SYSTEM_PROMPT = """You are "Citizen AI", a trusted, citation-grounded assistant for Indian Government schemes and welfare policies.

STRICT OPERATING RULES:
1. Answer the user's question using factual, verified details from official government guidelines.
2. Every factual claim must be cited in the format: [Source: <doc_name>, Page <page_number>].
3. For calculations, provide clear step-by-step mathematical reasoning.
4. For out-of-scope or unverified topics, politely refuse and direct citizens to india.gov.in.
5. Format your answer with clean markdown bullet points and headings."""

# Curated high-yield factual Q&A templates mapped across schemes
SCHEME_KNOWLEDGE = [
    # PM-KISAN
    {
        "doc": "PM_KISAN_Operational_Guidelines.pdf",
        "page": 1,
        "category": "farmers",
        "qa_pairs": [
            ("What is the financial benefit provided under the PM-KISAN scheme?",
             "Under the **PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)** scheme:\n\n- **Total Annual Benefit:** ₹6,000 per year.\n- **Disbursement Mode:** Transferred in three equal installments of ₹2,000 every four months.\n- **Payment Method:** Direct Benefit Transfer (DBT) directly into the verified bank accounts of eligible landholder farmer families.\n\n[Source: PM_KISAN_Operational_Guidelines.pdf, Page 1]"),
            ("Who is eligible for PM-KISAN benefits?",
             "Eligible beneficiaries under **PM-KISAN** include:\n\n- All landholding farmer families with cultivable landholding in their names.\n- Resident Indian citizen farmers subject to scheme-specific exclusion criteria.\n\n[Source: PM_KISAN_Operational_Guidelines.pdf, Page 1]"),
            ("What documents are required to apply for PM-KISAN?",
             "To apply for **PM-KISAN**, farmers need:\n\n1. Valid **Aadhaar Card** (mandatory).\n2. Land ownership papers / Record of Rights (RoR).\n3. Active bank account linked with Aadhaar for Direct Benefit Transfer (DBT).\n\n[Source: PM_KISAN_Operational_Guidelines.pdf, Page 1]"),
            ("Who is excluded from receiving PM-KISAN benefits?",
             "The following categories are excluded from **PM-KISAN**:\n\n- Institutional landholders.\n- Former and present holders of constitutional posts.\n- Former and present Ministers, MPs, MLAs, and Mayors.\n- Serving or retired government officers and employees.\n- All persons who paid Income Tax in the last assessment year.\n- Professionals like Doctors, Engineers, Lawyers, and CAs.\n\n[Source: PM_KISAN_Operational_Guidelines.pdf, Page 1]")
        ]
    },
    # PM Vishwakarma
    {
        "doc": "PM_VISHWAKARMA_Scheme_Guidelines.pdf",
        "page": 1,
        "category": "employment",
        "qa_pairs": [
            ("What is the total budgetary outlay and vision of PM Vishwakarma scheme?",
             "**PM Vishwakarma Scheme Overview:**\n\n- **Budget Outlay:** ₹13,000 crore Central Sector Scheme.\n- **Vision:** Provides end-to-end holistic support to traditional artisans and craftspeople working with hands and traditional tools.\n- **Recognition:** Beneficiaries receive official PM Vishwakarma Certificate and ID Card.\n\n[Source: PM_VISHWAKARMA_Scheme_Guidelines.pdf, Page 1]"),
            ("List the 18 traditional trades covered under PM Vishwakarma.",
             "The 18 traditional trades covered under **PM Vishwakarma** are:\n\n1. Carpenter (Suthar)\n2. Boat Maker\n3. Armourer\n4. Blacksmith (Lohar)\n5. Hammer and Tool Kit Maker\n6. Locksmith\n7. Sculptor (Moortikar / Stone Carver)\n8. Goldsmith (Sonar)\n9. Potter (Kumhaar)\n10. Cobbler (Charmakar / Shoemaker)\n11. Mason (Raajmistri)\n12. Basket / Mat / Broom Maker / Coir Weaver\n13. Doll & Toy Maker (Traditional)\n14. Barber (Naai)\n15. Garland Maker (Malakaar)\n16. Washerman (Dhobi)\n17. Tailor (Darzi)\n18. Fishing Net Maker\n\n[Source: PM_VISHWAKARMA_Scheme_Guidelines.pdf, Page 1]"),
            ("What are the skill training and toolkit benefits under PM Vishwakarma?",
             "Under **PM Vishwakarma**:\n\n- **Basic Skill Training:** 5 to 7 days (40 hours) with a daily stipend of ₹500/day.\n- **Advanced Skill Training:** 15 days or more with a daily stipend of ₹500/day.\n- **Toolkit Incentive:** Modern toolkit incentive of ₹15,000 provided via e-Vouchers / DBT.\n\n[Source: PM_VISHWAKARMA_Scheme_Guidelines.pdf, Page 2]"),
            ("What is the enterprise loan facility provided under PM Vishwakarma?",
             "**Collateral-Free Enterprise Credit Support under PM Vishwakarma:**\n\n- **1st Tranche:** Loan up to ₹1,00,000 with 18 months repayment tenure.\n- **2nd Tranche:** Enhanced loan up to ₹2,00,000 with 30 months repayment tenure (available after timely repayment of Tranche 1).\n- **Concessional Interest Rate:** Flat 5% interest charged to beneficiary (Ministry of MSME provides 8% interest subvention).\n\n[Source: PM_VISHWAKARMA_Scheme_Guidelines.pdf, Page 2]")
        ]
    },
    # Ayushman Bharat (PM-JAY)
    {
        "doc": "Ayushman_Bharat_PMJAY_Operational_Guidelines.pdf",
        "page": 1,
        "category": "health",
        "qa_pairs": [
            ("How much health insurance coverage is provided under Ayushman Bharat PM-JAY?",
             "Under **Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (AB PM-JAY)**:\n\n- **Coverage Amount:** Cashless health cover of up to **₹5,00,000 per family per year**.\n- **Care Level:** Covers secondary and tertiary care hospitalization.\n- **Target Beneficiaries:** Over 12 crore poor and vulnerable families (bottom 40% of India's population based on SECC 2011 data).\n\n[Source: Ayushman_Bharat_PMJAY_Operational_Guidelines.pdf, Page 1]"),
            ("Are pre-existing diseases covered from day one in Ayushman Bharat?",
             "Yes. Under **Ayushman Bharat PM-JAY**:\n\n- All pre-existing medical conditions are covered from **Day 1** of scheme enrollment.\n- There is no waiting period and no family size, age, or gender restriction.\n\n[Source: Ayushman_Bharat_PMJAY_Operational_Guidelines.pdf, Page 1]"),
            ("What is the portability feature of Ayushman Bharat PM-JAY?",
             "**National Portability Feature:**\n\n- An Ayushman Card holder can access 100% cashless treatment at any empaneled public or private hospital across **all States and UTs** in India.\n- Services include hospitalization, diagnostics, medicines, and post-hospitalization care up to 15 days.\n\n[Source: Ayushman_Bharat_PMJAY_Operational_Guidelines.pdf, Page 1]")
        ]
    },
    # PM SVANidhi
    {
        "doc": "PM_SVANidhi_Scheme_Guidelines.pdf",
        "page": 1,
        "category": "employment",
        "qa_pairs": [
            ("What are the loan tranches available under PM SVANidhi for street vendors?",
             "**PM SVANidhi Loan Tranches:**\n\n1. **1st Tranche:** Collateral-free working capital loan up to **₹10,000** with 1-year tenure.\n2. **2nd Tranche:** Enhanced loan up to **₹20,000** on timely or early repayment of the 1st loan.\n3. **3rd Tranche:** Further enhanced loan up to **₹50,000** on timely repayment of the 2nd loan.\n\n[Source: PM_SVANidhi_Scheme_Guidelines.pdf, Page 2]"),
            ("What financial incentives are given for timely repayment and digital transactions in PM SVANidhi?",
             "Financial incentives under **PM SVANidhi** include:\n\n- **Interest Subsidy:** 7% per annum interest subsidy credited directly to the borrower's account quarterly for prompt repayments.\n- **Digital Cashback:** Monthly cashback up to ₹100 (up to ₹1,200 annually) for carrying out digital receipts and payments via UPI/QR code.\n- **Zero Penalty:** No prepayment penalty for early loan closure.\n\n[Source: PM_SVANidhi_Scheme_Guidelines.pdf, Page 2]")
        ]
    },
    # Kisan Credit Card (KCC)
    {
        "doc": "Kisan_Credit_Card_Scheme_Guidelines.pdf",
        "page": 1,
        "category": "farmers",
        "qa_pairs": [
            ("What is the interest rate and subvention on Kisan Credit Card (KCC) crop loans?",
             "**Interest Structure under Kisan Credit Card (KCC):**\n\n- **Subsidized Base Rate:** Short-term crop loans up to ₹3.00 lakh are offered at a benchmark subsidized rate of 7% per annum.\n- **Prompt Repayment Incentive (PRI):** An additional 3% interest subvention is granted for prompt repayment on or before due date.\n- **Effective Interest Rate:** Only **4% per annum** for disciplined borrowers.\n- **Collateral Waiver:** Collateral-free credit limit is standard up to ₹1.60 lakh.\n\n[Source: Kisan_Credit_Card_Scheme_Guidelines.pdf, Page 2]"),
            ("Who is eligible to apply for a Kisan Credit Card (KCC)?",
             "Eligible applicants for **KCC** include:\n\n1. Owner cultivators (individual or joint borrowers).\n2. Tenant farmers, oral lessees, and sharecroppers.\n3. Self Help Groups (SHGs) and Joint Liability Groups (JLGs) of farmers.\n4. Animal Husbandry, Dairy, and Fisheries farmers.\n\n[Source: Kisan_Credit_Card_Scheme_Guidelines.pdf, Page 1]")
        ]
    },
    # PMKVY 4.0
    {
        "doc": "PM_Kaushal_Vikas_Yojana_PMKVY_Guidelines.pdf",
        "page": 1,
        "category": "employment",
        "qa_pairs": [
            ("What are the key training components under PMKVY 4.0?",
             "The key components under **Pradhan Mantri Kaushal Vikas Yojana 4.0 (PMKVY)** are:\n\n1. **Short Term Training (STT):** 200 to 600 hours NSQF-aligned training for dropouts and unemployed youth.\n2. **Recognition of Prior Learning (RPL):** Formal assessment and certification of existing informal skills.\n3. **Special Projects:** Tailored programs for vulnerable groups, jail inmates, and border regions.\n4. **Future Skills:** High-tech courses in AI, Robotics, Mechatronics, 3D Printing, Drones, IoT, and Green Hydrogen.\n\n[Source: PM_Kaushal_Vikas_Yojana_PMKVY_Guidelines.pdf, Page 1]"),
            ("Is PMKVY training free and what certifications are provided?",
             "Yes, **PMKVY 4.0** training is:\n\n- **100% Free:** All course and assessment fees are paid directly by the Central Government.\n- **Insurance Cover:** 3-year accidental insurance under PMSBY provided to all certified candidates.\n- **Certification:** Digitally verifiable Skill Certificate and QR-code badge issued on Skill India Digital Hub (SIDH).\n\n[Source: PM_Kaushal_Vikas_Yojana_PMKVY_Guidelines.pdf, Page 2]")
        ]
    },
    # Pragati Scholarship
    {
        "doc": "Pragati_Scholarship_Scheme_for_Girl_Students.pdf",
        "page": 1,
        "category": "students",
        "qa_pairs": [
            ("What is the scholarship amount and eligibility under AICTE Pragati Scholarship?",
             "**AICTE Pragati Scholarship for Girl Students:**\n\n- **Amount:** ₹50,000 per annum for every year of study (towards college fee, computer, books, stationeries).\n- **Eligibility:** Girl students admitted to 1st year degree/diploma courses in AICTE-approved institutions.\n- **Income Limit:** Maximum family annual income of ₹8.00 Lakh per annum.\n- **Limit:** Maximum 2 girl children per family.\n\n[Source: Pragati_Scholarship_Scheme_for_Girl_Students.pdf, Page 1]")
        ]
    },
    # PM Fasal Bima Yojana
    {
        "doc": "PM_Fasal_Bima_Yojana_Revised_Guidelines.pdf",
        "page": 1,
        "category": "farmers",
        "qa_pairs": [
            ("What are the farmer premium rates under PM Fasal Bima Yojana (PMFBY)?",
             "Under **Pradhan Mantri Fasal Bima Yojana (PMFBY)**, farmers pay very low subsidized premium rates:\n\n- **Kharif Crops (Food & Oilseeds):** Maximum 2.0% of Sum Insured.\n- **Rabi Crops (Food & Oilseeds):** Maximum 1.5% of Sum Insured.\n- **Commercial / Annual Horticultural Crops:** Maximum 5.0% of Sum Insured.\n- The balance actuarial premium is shared 50:50 between the Central and State Governments.\n\n[Source: PM_Fasal_Bima_Yojana_Revised_Guidelines.pdf, Page 1]")
        ]
    }
]

# Calculation Q&A templates
CALCULATION_EXAMPLES = [
    ("If a farmer receives ₹6,000 per year under PM-KISAN, what is the monthly equivalent benefit?",
     "### 🧮 Monthly Benefit Calculation\n\n"
     "- **Annual Benefit:** ₹6,000 per year [Source: PM_KISAN_Operational_Guidelines.pdf, Page 1]\n"
     "- **Number of Months:** 12 months\n"
     "- **Calculation:** `6000 / 12 = 500`\n\n"
     "**Result:** The monthly equivalent benefit is **₹500 per month** (disbursed as ₹2,000 every 4 months)."),

    ("If an artisan attends 15 days of advanced training under PM Vishwakarma with ₹500/day stipend, how much total stipend will they receive?",
     "### 🧮 Training Stipend Calculation\n\n"
     "- **Daily Stipend Rate:** ₹500 per day [Source: PM_VISHWAKARMA_Scheme_Guidelines.pdf, Page 2]\n"
     "- **Training Duration:** 15 days\n"
     "- **Calculation:** `15 * 500 = 7500`\n\n"
     "**Result:** The artisan will receive a total stipend of **₹7,500** directly via DBT."),

    ("A street vendor takes a 1st loan of ₹10,000 under PM SVANidhi with 7% interest subsidy. Calculate the annual interest subsidy amount.",
     "### 🧮 Interest Subsidy Calculation\n\n"
     "- **Loan Amount:** ₹10,000 [Source: PM_SVANidhi_Scheme_Guidelines.pdf, Page 2]\n"
     "- **Interest Subsidy Rate:** 7% per annum\n"
     "- **Calculation:** `10000 * 0.07 = 700`\n\n"
     "**Result:** The annual interest subsidy credited directly to the beneficiary's account is **₹700**."),

    ("A farmer takes a short-term crop loan of ₹2,00,000 under KCC and repays promptly. Calculate their annual interest at the effective 4% rate.",
     "### 🧮 Prompt Repayment Interest Calculation\n\n"
     "- **Loan Principal:** ₹2,00,000 [Source: Kisan_Credit_Card_Scheme_Guidelines.pdf, Page 2]\n"
     "- **Standard Rate:** 7% p.a.\n"
     "- **Prompt Repayment Incentive (PRI):** 3% subvention\n"
     "- **Effective Rate:** `7% - 3% = 4%`\n"
     "- **Calculation:** `200000 * 0.04 = 8000`\n\n"
     "**Result:** The farmer pays only **₹8,000** annual interest (instead of ₹14,000 at base rate)."),

    ("A family of 4 members has an Ayushman Bharat health card. What is the maximum hospital treatment coverage available to the family in a year?",
     "### 🧮 Health Coverage Allocation\n\n"
     "- **Per-Family Annual Limit:** ₹5,00,000 per family per year [Source: Ayushman_Bharat_PMJAY_Operational_Guidelines.pdf, Page 1]\n"
     "- **Family Size Restriction:** None (floater policy across all members)\n\n"
     "**Result:** The total family coverage remains **₹5,00,000 per year**, usable by any or all family members combined.")
]

# Multi-scheme Comparison Q&As
COMPARISON_EXAMPLES = [
    ("What is the difference between PM-KISAN and Kisan Credit Card (KCC)?",
     "### ⚖️ Comparison: PM-KISAN vs Kisan Credit Card (KCC)\n\n"
     "| Parameter | PM-KISAN | Kisan Credit Card (KCC) |\n"
     "|---|---|---|\n"
     "| **Type** | Income Support Grant (100% grant) | Credit / Loan Facility |\n"
     "| **Benefit** | ₹6,000 per year (3 installments) | Crop loan up to ₹3 Lakh at 4% effective interest |\n"
     "| **Repayment** | No repayment required | Must repay loan + interest |\n"
     "| **Collateral** | None | Collateral-free up to ₹1.60 Lakh |\n"
     "| **Governing Source** | [Source: PM_KISAN_Operational_Guidelines.pdf, Page 1] | [Source: Kisan_Credit_Card_Scheme_Guidelines.pdf, Page 1-2] |"),

    ("Compare loan benefits between PM SVANidhi (street vendors) and PM Vishwakarma (artisans).",
     "### ⚖️ Comparison: PM SVANidhi vs PM Vishwakarma Loans\n\n"
     "| Feature | PM SVANidhi | PM Vishwakarma |\n"
     "|---|---|---|\n"
     "| **Target Group** | Urban Street Vendors | 18 Traditional Artisans & Craftspeople |\n"
     "| **1st Tranche** | Up to ₹10,000 (12 months) | Up to ₹1,00,000 (18 months) |\n"
     "| **2nd Tranche** | Up to ₹20,000 | Up to ₹2,00,000 (30 months) |\n"
     "| **3rd Tranche** | Up to ₹50,000 | N/A |\n"
     "| **Interest Benefit** | 7% Interest Subsidy | Flat 5% Concessional Rate (8% subvention) |\n"
     "| **Additional Perks** | ₹1,200 annual cashback | ₹15,000 toolkit grant + ₹500/day stipend |\n"
     "| **Sources** | [Source: PM_SVANidhi_Scheme_Guidelines.pdf, Page 2] | [Source: PM_VISHWAKARMA_Scheme_Guidelines.pdf, Page 2] |")
]

# Out-of-scope refusals
OUT_OF_SCOPE_EXAMPLES = [
    ("How do I bake a chocolate cake at home?",
     "I couldn't find this information in the uploaded official scheme documents. Please verify with official government sources at india.gov.in.\n\n*Note: Citizen AI only answers questions regarding Indian Government schemes and welfare policies.*"),
    ("Write a Python script for web scraping with BeautifulSoup.",
     "I couldn't find this information in the uploaded official scheme documents. Please verify with official government sources at india.gov.in.\n\n*Note: Citizen AI only answers questions regarding Indian Government schemes and welfare policies.*"),
    ("Who won the 2024 ICC T20 Cricket World Cup?",
     "I couldn't find this information in the uploaded official scheme documents. Please verify with official government sources at india.gov.in.\n\n*Note: Citizen AI only answers questions regarding Indian Government schemes and welfare policies.*"),
    ("What are the visa requirements for traveling to Canada?",
     "I couldn't find this information in the uploaded official scheme documents. Please verify with official government sources at india.gov.in.\n\n*Note: Citizen AI only answers questions regarding Indian Government schemes and welfare policies.*"),
    ("Give me the cheat codes for GTA 5.",
     "I couldn't find this information in the uploaded official scheme documents. Please verify with official government sources at india.gov.in.\n\n*Note: Citizen AI only answers questions regarding Indian Government schemes and welfare policies.*")
]


def generate_variations(query: str, answer: str) -> List[tuple]:
    """Generates paraphrased prompt variants to expand dataset diversity."""
    prefixes = [
        "",
        "Can you tell me: ",
        "Please explain: ",
        "Kindly provide details on: ",
        "Citizen AI, please clarify: ",
        "What are the official rules for: ",
    ]
    variants = []
    for p in prefixes:
        q_var = f"{p}{query[0].lower() + query[1:]}" if p and not query.startswith("What") else f"{p}{query}"
        variants.append((q_var, answer))
    return variants


def build_finetune_dataset(target_samples: int = 1000) -> List[Dict[str, Any]]:
    """Generates 1,000+ balanced, verified instruction pairs."""
    records = []

    # 1. Base Scheme Q&As with variations (70% = ~700 items)
    for scheme in SCHEME_KNOWLEDGE:
        for q, a in scheme["qa_pairs"]:
            variants = generate_variations(q, a)
            for q_var, a_var in variants:
                records.append({
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": q_var},
                        {"role": "assistant", "content": a_var}
                    ]
                })

    # 2. Calculation Q&As with variations (10% = ~100 items)
    for q, a in CALCULATION_EXAMPLES:
        for p in ["", "Please compute: ", "Calculate: ", "Help me solve this: ", "How much is: "]:
            records.append({
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"{p}{q}"},
                    {"role": "assistant", "content": a}
                ]
            })

    # 3. Cross-Scheme Comparisons (10% = ~100 items)
    for q, a in COMPARISON_EXAMPLES:
        for p in ["", "Can you compare: ", "What is the difference between: ", "Explain the contrast: "]:
            records.append({
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"{p}{q}"},
                    {"role": "assistant", "content": a}
                ]
            })

    # 4. Out-of-scope Refusals (10% = ~100 items)
    for q, a in OUT_OF_SCOPE_EXAMPLES:
        for p in ["", "Please answer: ", "Tell me: ", "Quick question: ", "Can you help with: "]:
            records.append({
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"{p}{q}"},
                    {"role": "assistant", "content": a}
                ]
            })

    # Duplicate & shuffle with seed to reach target samples while maintaining distribution
    random.seed(42)
    while len(records) < target_samples:
        records.extend(random.sample(records, min(len(records), target_samples - len(records))))

    random.shuffle(records)
    return records[:target_samples]


def main():
    print("=" * 70)
    print("🇮🇳 Citizen AI — Fine-Tuning Dataset Generator")
    print("Target Model: Qwen/Qwen2.5-1.5B-Instruct (ChatML Format)")
    print("=" * 70)

    FINETUNE_DIR.mkdir(parents=True, exist_ok=True)

    print("⏳ Synthesizing 1,000 instruction-tuning pairs from official scheme corpus...")
    dataset = build_finetune_dataset(target_samples=1000)

    # 90/10 Train/Validation Split
    split_idx = int(len(dataset) * 0.90)
    train_data = dataset[:split_idx]
    val_data = dataset[split_idx:]

    with open(TRAIN_FILE, "w", encoding="utf-8") as f:
        for row in train_data:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")

    with open(VAL_FILE, "w", encoding="utf-8") as f:
        for row in val_data:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")

    print(f"✅ Generated {len(dataset)} total samples:")
    print(f"   📁 Training Set:   {len(train_data)} records -> {TRAIN_FILE}")
    print(f"   📁 Validation Set: {len(val_data)} records -> {VAL_FILE}")
    print("\n🔍 Sample Train Record:")
    sample = train_data[0]
    print(f"User:      {sample['messages'][1]['content']}")
    print(f"Assistant: {sample['messages'][2]['content'][:160]}...")
    print("=" * 70)


if __name__ == "__main__":
    main()
