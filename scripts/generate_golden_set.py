"""
scripts/generate_golden_set.py

Generates and compiles a rigorous Golden Evaluation Dataset for Citizen AI.
Covers in-domain factual questions across all 4 categories (Farmers, Students, Health, Employment)
plus adversarial / out-of-scope queries to evaluate hallucination prevention.

Outputs:
    data/golden_set.jsonl
"""

import json
import random
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
CHUNKS_FILE = ROOT_DIR / "data" / "chunks" / "all_chunks.jsonl"
GOLDEN_SET_FILE = ROOT_DIR / "data" / "golden_set.jsonl"

# Curated benchmark evaluation pairs mapped to exact source documents & pages
CURATED_EVAL_BENCHMARKS = [
    # ── FARMERS ─────────────────────────────────────────────────────────────
    {
        "id": "farm_01",
        "category": "farmers",
        "question": "What is the annual financial assistance provided under PM-KISAN?",
        "ground_truth": "Rs 6,000 per year provided in three equal installments of Rs 2,000 every four months.",
        "expected_doc": "PM_KISAN_Operational_Guidelines.pdf",
        "expected_page": 1,
        "is_out_of_scope": False
    },
    {
        "id": "farm_02",
        "category": "farmers",
        "question": "Who are excluded from receiving PM-KISAN benefits?",
        "ground_truth": "Institutional landholders, constitutional post holders, serving/retired government employees, pensioners with monthly pension of Rs 10,000 or more, income tax payees, and professionals like doctors, engineers, lawyers, CAs.",
        "expected_doc": "PM_KISAN_Operational_Guidelines.pdf",
        "expected_page": 2,
        "is_out_of_scope": False
    },
    {
        "id": "farm_03",
        "category": "farmers",
        "question": "What are the premium rates payable by farmers under PM Fasal Bima Yojana for Kharif and Rabi crops?",
        "ground_truth": "2.0% of Sum Insured for Kharif crops and 1.5% of Sum Insured for Rabi crops (5.0% for commercial/horticultural crops).",
        "expected_doc": "PM_Fasal_Bima_Yojana_Revised_Guidelines.pdf",
        "expected_page": 1,
        "is_out_of_scope": False
    },
    {
        "id": "farm_04",
        "category": "farmers",
        "question": "What is the effective interest rate for prompt repaying farmers under the Kisan Credit Card scheme?",
        "ground_truth": "Effective interest rate of 4% per annum after receiving the 3% prompt repayment incentive on the subsidized 7% base rate.",
        "expected_doc": "Kisan_Credit_Card_Scheme_Guidelines.pdf",
        "expected_page": 2,
        "is_out_of_scope": False
    },
    {
        "id": "farm_05",
        "category": "farmers",
        "question": "What subsidy percentage is provided to small and marginal farmers for micro-irrigation under PMKSY Per Drop More Crop?",
        "ground_truth": "55% financial assistance for small and marginal farmers (45% for other farmers).",
        "expected_doc": "PM_Krishi_Sinchayee_Yojana_Guidelines.pdf",
        "expected_page": 2,
        "is_out_of_scope": False
    },

    # ── STUDENTS & SCHOLARSHIPS ──────────────────────────────────────────────
    {
        "id": "stud_01",
        "category": "students",
        "question": "What is the family income ceiling for eligibility under the Central Sector Scheme of Scholarships (CSSS)?",
        "ground_truth": "Gross family income from all sources must not exceed Rs 4.50 lakh per annum.",
        "expected_doc": "Central_Sector_Scholarship_College_University_Students.pdf",
        "expected_page": 1,
        "is_out_of_scope": False
    },
    {
        "id": "stud_02",
        "category": "students",
        "question": "What is the scholarship rate per annum for graduation and post-graduation under CSSS?",
        "ground_truth": "Rs 12,000 per annum for graduation (first 3 years) and Rs 20,000 per annum for post-graduation.",
        "expected_doc": "Central_Sector_Scholarship_College_University_Students.pdf",
        "expected_page": 2,
        "is_out_of_scope": False
    },
    {
        "id": "stud_03",
        "category": "students",
        "question": "What is the annual scholarship amount for girl students under AICTE Pragati Scheme?",
        "ground_truth": "Rs 50,000 per annum for every year of study for technical degree and diploma courses.",
        "expected_doc": "Pragati_Scholarship_For_Girl_Students.pdf",
        "expected_page": 2,
        "is_out_of_scope": False
    },
    {
        "id": "stud_04",
        "category": "students",
        "question": "What is the family income limit for the Post Matric Scholarship for SC students?",
        "ground_truth": "Total family income from all sources should not exceed Rs 2.50 lakh per annum.",
        "expected_doc": "Post_Matric_Scholarship_SC_Students.pdf",
        "expected_page": 1,
        "is_out_of_scope": False
    },

    # ── HEALTH ───────────────────────────────────────────────────────────────
    {
        "id": "hlth_01",
        "category": "health",
        "question": "What is the annual health coverage amount per family under Ayushman Bharat PM-JAY?",
        "ground_truth": "Rs 5,00,000 (5 Lakh) per family per year for secondary and tertiary care hospitalization.",
        "expected_doc": "Ayushman_Bharat_PMJAY_Operational_Guidelines.pdf",
        "expected_page": 1,
        "is_out_of_scope": False
    },
    {
        "id": "hlth_02",
        "category": "health",
        "question": "How many days of pre-hospitalization and post-hospitalization expenses are covered under AB PM-JAY?",
        "ground_truth": "Up to 3 days of pre-hospitalization and 15 days of post-hospitalization expenses including medicines and diagnostics.",
        "expected_doc": "Ayushman_Bharat_PMJAY_Operational_Guidelines.pdf",
        "expected_page": 1,
        "is_out_of_scope": False
    },
    {
        "id": "hlth_03",
        "category": "health",
        "question": "What is the price of Jan Aushadhi Suvidha sanitary napkins at PMBJK kendras?",
        "ground_truth": "Rs 1 per pad (Oxo-Biodegradable Sanitary Napkins).",
        "expected_doc": "Pradhan_Mantri_Jan_Aushadhi_Yojana_Guidelines.pdf",
        "expected_page": 1,
        "is_out_of_scope": False
    },

    # ── EMPLOYMENT & SKILLS ──────────────────────────────────────────────────
    {
        "id": "emp_01",
        "category": "employment",
        "question": "What are the loan tranche amounts available to street vendors under PM SVANidhi?",
        "ground_truth": "1st Tranche up to Rs 10,000 (1-year tenure), 2nd Tranche up to Rs 20,000, and 3rd Tranche up to Rs 50,000.",
        "expected_doc": "PM_SVANidhi_Scheme_Guidelines.pdf",
        "expected_page": 2,
        "is_out_of_scope": False
    },
    {
        "id": "emp_02",
        "category": "employment",
        "question": "What toolkit incentive and stipend are provided to artisans under PM Vishwakarma scheme?",
        "ground_truth": "Rs 15,000 toolkit incentive and Rs 500 per day stipend during basic and advanced training.",
        "expected_doc": "PM_VISHWAKARMA_Scheme_Guidelines.pdf",
        "expected_page": 2,
        "is_out_of_scope": False
    },
    {
        "id": "emp_03",
        "category": "employment",
        "question": "What is the interest rate on enterprise credit loans under PM Vishwakarma?",
        "ground_truth": "Concessional flat interest rate of 5% with Ministry providing 8% subvention.",
        "expected_doc": "PM_VISHWAKARMA_Scheme_Guidelines.pdf",
        "expected_page": 2,
        "is_out_of_scope": False
    },

    # ── OUT-OF-SCOPE / ADVERSARIAL (GUARDRAIL TESTS) ─────────────────────────
    {
        "id": "oos_01",
        "category": "out_of_scope",
        "question": "What is the procedure to apply for an H-1B visa in the United States?",
        "ground_truth": "I couldn't find this information in the uploaded official scheme documents. Please verify with official government sources at india.gov.in.",
        "expected_doc": "NONE",
        "expected_page": 0,
        "is_out_of_scope": True
    },
    {
        "id": "oos_02",
        "category": "out_of_scope",
        "question": "Can you give me a python function to train a convolutional neural network?",
        "ground_truth": "I couldn't find this information in the uploaded official scheme documents. Please verify with official government sources at india.gov.in.",
        "expected_doc": "NONE",
        "expected_page": 0,
        "is_out_of_scope": True
    },
    {
        "id": "oos_03",
        "category": "out_of_scope",
        "question": "What were the box office earnings of the movie Titanic in 1997?",
        "ground_truth": "I couldn't find this information in the uploaded official scheme documents. Please verify with official government sources at india.gov.in.",
        "expected_doc": "NONE",
        "expected_page": 0,
        "is_out_of_scope": True
    }
]


def main():
    print("=" * 70)
    print("🇮🇳 Citizen AI — Golden Evaluation Dataset Generator")
    print("=" * 70)

    GOLDEN_SET_FILE.parent.mkdir(parents=True, exist_ok=True)

    with open(GOLDEN_SET_FILE, "w", encoding="utf-8") as f:
        for item in CURATED_EVAL_BENCHMARKS:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")

    print(f"✅ Generated {len(CURATED_EVAL_BENCHMARKS)} benchmark Q&A pairs in: {GOLDEN_SET_FILE}")
    print("\nDataset Composition:")
    print("  • Farmers:         5 pairs")
    print("  • Students:        4 pairs")
    print("  • Health:          3 pairs")
    print("  • Employment:      3 pairs")
    print("  • Out-of-Scope:    3 adversarial test pairs")
    print("=" * 70)


if __name__ == "__main__":
    main()
