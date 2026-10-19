"""
scripts/create_test_pdfs.py

Creates 4 test PDFs with real Indian government scheme content
that are NOT in the existing training data.
Schemes covered:
  1. Pradhan Mantri Awas Yojana (PMAY) - Housing
  2. Atal Pension Yojana (APY) - Pension
  3. PM Ujjwala Yojana 2.0 (PMUY) - LPG for women
  4. Sukanya Samriddhi Yojana (SSY) - Girl child savings

Run from: C:\\citizen_AI\\backend\\
  python ..\\scripts\\create_test_pdfs.py
"""

from pathlib import Path
from fpdf import FPDF
from fpdf.enums import XPos, YPos

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "data" / "testing_folder_pdfs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def clean(text: str) -> str:
    """Remove characters not supported by built-in Helvetica (latin-1 only)."""
    replacements = {
        "\u2014": " - ",   # em dash
        "\u2013": " - ",   # en dash
        "\u2019": "'",     # right single quote
        "\u2018": "'",     # left single quote
        "\u201c": '"',     # left double quote
        "\u201d": '"',     # right double quote
        "\u2022": "-",     # bullet
        "\u20b9": "Rs",    # rupee sign (just in case)
    }
    for char, replacement in replacements.items():
        text = text.replace(char, replacement)
    return text


def make_pdf(filename: str, title: str, content: list) -> Path:
    """Create a clean PDF. content = list of (heading, body) tuples."""
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    # Title
    pdf.set_font("Helvetica", "B", 15)
    pdf.set_fill_color(220, 235, 255)
    pdf.cell(0, 12, clean(title), new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C", fill=True)
    pdf.ln(4)

    for heading, body in content:
        pdf.set_font("Helvetica", "B", 11)
        pdf.cell(0, 8, clean(heading), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("Helvetica", "", 10)
        pdf.multi_cell(0, 6, clean(body))
        pdf.ln(3)

    out = OUTPUT_DIR / filename
    pdf.output(str(out))
    size_kb = out.stat().st_size // 1024
    print(f"  Created: {filename}  ({size_kb} KB)")
    return out


# ─────────────────────────────────────────────
# 1. PMAY - Pradhan Mantri Awas Yojana
# ─────────────────────────────────────────────
make_pdf(
    "Pradhan_Mantri_Awas_Yojana_PMAY_Guidelines.pdf",
    "PRADHAN MANTRI AWAS YOJANA (PMAY) - HOUSING FOR ALL",
    [
        ("1. SCHEME OVERVIEW",
         "Pradhan Mantri Awas Yojana (PMAY) is a flagship mission of the Government of India launched on "
         "25 June 2015 with the objective of providing pucca (permanent) houses to all eligible rural and "
         "urban households. The scheme operates under two components:\n"
         "- PMAY-Gramin (Rural): Implemented by Ministry of Rural Development.\n"
         "- PMAY-Urban (Urban): Implemented by Ministry of Housing and Urban Affairs (MoHUA)."),

        ("2. ELIGIBILITY CRITERIA",
         "PMAY-Gramin: Households listed in Socio-Economic and Caste Census 2011 (SECC 2011) and prioritised "
         "by Gram Sabhas. Houseless families and those living in 0 or 1-room kutcha houses are given highest "
         "priority.\n\n"
         "PMAY-Urban Income Categories:\n"
         "- Economically Weaker Section (EWS): Annual income up to Rs 3 lakh.\n"
         "- Low Income Group (LIG): Annual income Rs 3 lakh to Rs 6 lakh.\n"
         "- Middle Income Group-I (MIG-I): Annual income Rs 6 lakh to Rs 12 lakh.\n"
         "- Middle Income Group-II (MIG-II): Annual income Rs 12 lakh to Rs 18 lakh.\n\n"
         "Key Condition: The beneficiary or any family member must NOT own a pucca house anywhere in India."),

        ("3. FINANCIAL ASSISTANCE AND SUBSIDY",
         "PMAY-Gramin Financial Support:\n"
         "- Plain areas: Rs 1,20,000 per unit.\n"
         "- Hilly/difficult/IAP districts: Rs 1,30,000 per unit.\n"
         "- Convergence with MGNREGS provides 90 to 95 days of unskilled labour wages.\n\n"
         "PMAY-Urban Credit Linked Subsidy Scheme (CLSS):\n"
         "- EWS/LIG: 6.5% interest subsidy on home loans up to Rs 6 lakh. Max subsidy: Rs 2.67 lakh.\n"
         "- MIG-I: 4% interest subsidy on loans up to Rs 9 lakh. Max subsidy: Rs 2.35 lakh.\n"
         "- MIG-II: 3% interest subsidy on loans up to Rs 12 lakh. Max subsidy: Rs 2.30 lakh.\n"
         "All subsidy disbursed upfront via Direct Benefit Transfer (DBT) to lending institutions."),

        ("4. EXCLUSION CATEGORIES",
         "Households NOT eligible for PMAY benefits:\n"
         "- Households already owning a pucca house in India (any family member).\n"
         "- Families with annual income above Rs 18 lakh (Urban).\n"
         "- Beneficiaries who previously availed Government housing scheme benefits.\n"
         "- Households with motorised 2/3/4 wheeler, refrigerator, landline phone, or more than "
         "2.5 acres of irrigated land (PMAY-Gramin exclusion filter from SECC data).\n"
         "- Government employees in Class-I and Class-II services."),

        ("5. APPLICATION PROCESS",
         "PMAY-Gramin: Beneficiaries identified from SECC 2011 data by Gram Sabhas. No separate "
         "application needed. AwaasSoft MIS portal used for tracking construction progress.\n\n"
         "PMAY-Urban: Online application at pmaymis.gov.in. Aadhaar mandatory. Documents required:\n"
         "- Income certificate, Aadhaar card, bank account details.\n"
         "- Affidavit confirming no pucca house ownership by any family member.\n\n"
         "Helpline: 1800-11-6446 (Toll Free)\n"
         "Official portals: pmayg.nic.in (rural) and pmay-urban.gov.in (urban)."),
    ]
)

# ─────────────────────────────────────────────
# 2. APY - Atal Pension Yojana
# ─────────────────────────────────────────────
make_pdf(
    "Atal_Pension_Yojana_APY_Scheme_Details.pdf",
    "ATAL PENSION YOJANA (APY) - PENSION FOR UNORGANISED SECTOR",
    [
        ("1. SCHEME OVERVIEW",
         "Atal Pension Yojana (APY) was launched on 9 May 2015 by the Government of India, focused on "
         "workers in the unorganised sector. It is regulated by the Pension Fund Regulatory and Development "
         "Authority (PFRDA) under the National Pension System (NPS) architecture. The scheme provides a "
         "guaranteed minimum monthly pension of Rs 1,000, Rs 2,000, Rs 3,000, Rs 4,000, or Rs 5,000 "
         "after the subscriber attains age 60, depending on contributions made."),

        ("2. ELIGIBILITY CRITERIA",
         "Who can join APY:\n"
         "- Indian citizens between 18 and 40 years of age.\n"
         "- Must have a savings bank account or post office savings account.\n"
         "- Aadhaar and mobile number required for enrollment.\n"
         "- Income tax payers are NOT eligible to join APY (as per October 2022 notification).\n"
         "- Subscribers already covered under EPF, NPS (Government), or ESIC are NOT eligible."),

        ("3. PENSION AMOUNT AND CONTRIBUTION TABLE",
         "Guaranteed monthly pension after age 60 and corresponding monthly contributions:\n\n"
         "Rs 1,000 pension: Join at 18 yrs = Rs 42/month | Join at 40 yrs = Rs 291/month.\n"
         "Rs 2,000 pension: Join at 18 yrs = Rs 84/month | Join at 40 yrs = Rs 582/month.\n"
         "Rs 3,000 pension: Join at 18 yrs = Rs 126/month | Join at 40 yrs = Rs 873/month.\n"
         "Rs 4,000 pension: Join at 18 yrs = Rs 168/month | Join at 40 yrs = Rs 1,164/month.\n"
         "Rs 5,000 pension: Join at 18 yrs = Rs 210/month | Join at 40 yrs = Rs 1,454/month.\n\n"
         "Government Co-contribution: 50% of subscriber's contribution or Rs 1,000/year (whichever is lower) "
         "for 5 years (FY 2015-16 to 2019-20) for eligible non-income-tax-payer subscribers."),

        ("4. DEATH AND SPOUSE BENEFITS",
         "On death of subscriber before age 60:\n"
         "- Spouse may continue the APY account for the remaining contribution period to receive pension.\n"
         "- OR spouse may withdraw the full accumulated corpus.\n\n"
         "On death of subscriber after age 60:\n"
         "- Spouse receives the same monthly pension amount as the subscriber.\n\n"
         "On death of both subscriber and spouse:\n"
         "- Nominee receives the accumulated pension corpus as a lump sum (not monthly pension)."),

        ("5. EXIT, WITHDRAWAL AND PENALTIES",
         "Voluntary exit before age 60: Allowed only in exceptional circumstances (terminal illness or "
         "death of subscriber). Only subscriber's own contribution plus net accrued income is returned. "
         "Government co-contribution is forfeited on premature exit.\n\n"
         "Penalty for non-payment of monthly contribution:\n"
         "- Rs 1/month for contributions up to Rs 100.\n"
         "- Rs 2/month for contributions Rs 101 to Rs 500.\n"
         "- Rs 5/month for contributions Rs 501 to Rs 1,000.\n"
         "- Rs 10/month for contributions above Rs 1,001.\n\n"
         "Enrollment: Any bank branch or post office. Online via net banking.\n"
         "PFRDA Helpline: 1800-110-708 (Toll Free)."),
    ]
)

# ─────────────────────────────────────────────
# 3. PMUY - PM Ujjwala Yojana 2.0
# ─────────────────────────────────────────────
make_pdf(
    "PM_Ujjwala_Yojana_2_PMUY_Guidelines.pdf",
    "PM UJJWALA YOJANA 2.0 (PMUY) - CLEAN COOKING FUEL FOR WOMEN",
    [
        ("1. SCHEME OVERVIEW",
         "Pradhan Mantri Ujjwala Yojana (PMUY) was launched on 1 May 2016 at Ballia, Uttar Pradesh to "
         "provide deposit-free LPG connections to adult women from Below Poverty Line (BPL) households. "
         "Ujjwala 2.0 was launched on 10 August 2021, extending benefits to migrant workers and additional "
         "categories. The scheme is implemented by the Ministry of Petroleum and Natural Gas through Oil "
         "Marketing Companies (OMCs): IOCL, BPCL, and HPCL."),

        ("2. ELIGIBILITY CRITERIA",
         "Adult women (18 years and above) from any of these categories:\n"
         "- Below Poverty Line (BPL) households listed under SECC 2011.\n"
         "- SC/ST households.\n"
         "- Beneficiaries of Pradhan Mantri Awas Yojana Gramin.\n"
         "- Antyodaya Anna Yojana (AAY) cardholders.\n"
         "- Forest dwellers.\n"
         "- Most Backward Classes (MBC).\n"
         "- Tea and ex-tea garden tribes of Assam.\n"
         "- 14-Point Declaration: Women from poor households not covered above may self-declare poverty.\n\n"
         "Ujjwala 2.0 Special Provision: Migrant women may use a self-declaration as proof of address. "
         "A local ration card or permanent address proof is NOT mandatory for migrant applicants."),

        ("3. BENEFITS PROVIDED UNDER PMUY",
         "Free benefits provided to eligible women:\n"
         "- Deposit-free LPG connection (zero security deposit).\n"
         "- First LPG refill (14.2 kg cylinder) provided FREE of cost.\n"
         "- One hot plate (gas stove) provided FREE of cost.\n"
         "- EMI facility available for purchasing additional refill cylinders.\n\n"
         "LPG Subsidy for Ujjwala Beneficiaries:\n"
         "- Government provides additional subsidy of Rs 200 per cylinder for up to 12 cylinders per year "
         "to all PMUY beneficiaries, credited directly via DBT to Aadhaar-linked bank account."),

        ("4. EXCLUSION CRITERIA",
         "The following are NOT eligible for PMUY:\n"
         "- Households already having an LPG connection in any family member's name.\n"
         "- Adult male applicants (scheme is exclusively for adult women).\n"
         "- Women from households with annual income above BPL threshold (unless using 14-point declaration).\n"
         "- Households with government employees or income tax payers."),

        ("5. APPLICATION PROCESS",
         "How to apply for a PMUY LPG connection:\n"
         "- Visit nearest LPG distributor of IOCL/BPCL/HPCL with Aadhaar card and bank passbook.\n"
         "- Fill KYC Form (available at distributor or download from pmuy.gov.in).\n"
         "- Provide BPL ration card OR SECC documentation OR 14-point self-declaration.\n"
         "- Aadhaar-linked bank account is mandatory for DBT subsidy credit.\n\n"
         "Online Application: pmuy.gov.in\n"
         "UMANG App: Search 'PMUY' on UMANG application.\n"
         "LPG Emergency Helpline: 1906 (available 24x7)."),
    ]
)

# ─────────────────────────────────────────────
# 4. SSY - Sukanya Samriddhi Yojana
# ─────────────────────────────────────────────
make_pdf(
    "Sukanya_Samriddhi_Yojana_SSY_Guidelines.pdf",
    "SUKANYA SAMRIDDHI YOJANA (SSY) - GIRL CHILD SAVINGS SCHEME",
    [
        ("1. SCHEME OVERVIEW",
         "Sukanya Samriddhi Yojana (SSY) is a small savings scheme launched on 22 January 2015 under the "
         "'Beti Bachao Beti Padhao' campaign of the Government of India. Administered by the Ministry of "
         "Finance through Post Offices and authorised banks, SSY provides a high-interest, tax-exempt "
         "savings account for the welfare, higher education, and marriage expenses of girl children."),

        ("2. ELIGIBILITY CRITERIA",
         "Who can open an SSY account:\n"
         "- Account can be opened only in the name of a girl child below 10 years of age.\n"
         "- Only the natural or legal guardian (parent) can open and operate the account.\n"
         "- Maximum of 2 SSY accounts per family (one per girl child).\n"
         "- Exception: A 3rd account is allowed if twin or triplet girls are born in the 2nd birth.\n"
         "- Girl child must be an Indian citizen and resident in India.\n"
         "- NRIs (Non-Resident Indians) are NOT eligible to open SSY accounts."),

        ("3. INTEREST RATE AND DEPOSIT RULES",
         "Current Interest Rate (FY 2024-25): 8.2% per annum, compounded annually.\n"
         "This is one of the highest interest rates among all Government small savings schemes.\n\n"
         "Deposit Rules:\n"
         "- Minimum deposit per year: Rs 250.\n"
         "- Maximum deposit per year: Rs 1,50,000.\n"
         "- Deposits must be made for 15 years from the date of account opening.\n"
         "- Account matures after 21 years from opening OR at marriage after age 18 (whichever is earlier).\n"
         "- Partial withdrawal: Up to 50% of account balance allowed after girl turns 18 years old, "
         "for higher education expenses only."),

        ("4. TAX BENEFITS - EEE STATUS",
         "SSY enjoys complete Triple-E (Exempt-Exempt-Exempt) tax status:\n\n"
         "- Contributions (Deposits): Eligible for tax deduction under Section 80C of the Income Tax Act, "
         "up to Rs 1.5 lakh per financial year.\n"
         "- Interest Earned: Completely tax-exempt under Section 10 of the Income Tax Act.\n"
         "- Maturity Amount (Withdrawal): Fully tax-exempt at the time of withdrawal.\n\n"
         "This Triple-E status makes SSY one of the most tax-efficient savings instruments available "
         "to Indian taxpayers for girl child welfare."),

        ("5. ACCOUNT OPENING AND PREMATURE CLOSURE RULES",
         "Where to open SSY account:\n"
         "- Any Post Office (Head Post Office or Sub Post Office) across India.\n"
         "- Authorised banks: SBI, PNB, Bank of Baroda, Canara Bank, and all major banks.\n\n"
         "Documents Required:\n"
         "- Birth certificate of girl child.\n"
         "- Aadhaar card of parent/guardian.\n"
         "- Address proof and photograph.\n\n"
         "Premature Closure Allowed only in these cases:\n"
         "- Death of the account holder (girl child) - full corpus returned.\n"
         "- Life-threatening medical condition of account holder.\n"
         "- Marriage of girl after attaining 18 years (1 month advance notice required).\n\n"
         "Default Account Revival: If minimum deposit not made, pay Rs 50 penalty per year of default "
         "plus the minimum deposit amount to revive the account.\n"
         "Post Office Helpline: 1800-11-2211 (Toll Free)."),
    ]
)

print(f"\nAll 4 test PDFs created successfully!")
print(f"Location: {OUTPUT_DIR}")
print("\nFiles created:")
for f in sorted(OUTPUT_DIR.glob("*.pdf")):
    print(f"  {f.name}  ({f.stat().st_size // 1024} KB)")
