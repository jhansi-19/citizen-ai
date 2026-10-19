"""
scripts/prepare_colab_zip.py

Creates a self-contained ZIP archive for Google Colab / Google Drive execution.
Contains:
1. data/finetune/train.jsonl
2. data/finetune/val.jsonl
3. notebooks/citizen_ai_qlora_finetune.ipynb
4. README_COLAB.md with step-by-step instructions
"""

import os
import zipfile
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
ZIP_OUTPUT = ROOT_DIR / "citizen_ai_colab_training.zip"

README_CONTENT = """# 🇮🇳 Citizen AI — Google Colab Fine-Tuning Instructions

This archive contains everything needed to fine-tune `Qwen/Qwen2.5-1.5B-Instruct` on Google Colab (Free T4 GPU).

## 🚀 Step-by-Step Instructions:

1. **Open Google Colab:**
   - Go to [colab.research.google.com](https://colab.research.google.com/)
   - Click **Upload** and upload `citizen_ai_qlora_finetune.ipynb`.

2. **Select Free T4 GPU:**
   - In Colab menu: **Runtime** -> **Change runtime type** -> Select **T4 GPU** -> Click **Save**.

3. **Upload Dataset Files:**
   - In Colab left sidebar, click the **Folder icon 📁** (Files).
   - Drag and drop `train.jsonl` and `val.jsonl` directly into the Files root.

4. **Run All Cells:**
   - Click **Runtime** -> **Run all** (or run each cell sequentially with Shift + Enter).
   - Expected runtime on T4 GPU: **~8 to 12 minutes**.

5. **Download Fine-Tuned Weights:**
   - After the notebook finishes, a file named `citizen_ai_lora_weights.zip` will appear in the Files panel.
   - Right-click and download it to your local machine (or save to Google Drive).

---
*Built with ❤️ for Citizen AI.*
"""


def main():
    print("=" * 70)
    print("🇮🇳 Citizen AI — Preparing Google Colab Training Package")
    print("=" * 70)

    # 1. Write README_COLAB.md
    readme_path = ROOT_DIR / "README_COLAB.md"
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(README_CONTENT)

    # 2. Files to include
    files_to_pack = [
        ("train.jsonl", ROOT_DIR / "data" / "finetune" / "train.jsonl"),
        ("val.jsonl", ROOT_DIR / "data" / "finetune" / "val.jsonl"),
        ("citizen_ai_qlora_finetune.ipynb", ROOT_DIR / "notebooks" / "citizen_ai_qlora_finetune.ipynb"),
        ("README_COLAB.md", readme_path),
    ]

    # Verify all files exist
    missing = [name for name, path in files_to_pack if not path.exists()]
    if missing:
        print(f"❌ Missing files: {missing}")
        print("Please run `python scripts/generate_finetune_dataset.py` first.")
        return

    # 3. Create zip
    with zipfile.ZipFile(ZIP_OUTPUT, "w", zipfile.ZIP_DEFLATED) as zf:
        for arcname, filepath in files_to_pack:
            zf.write(filepath, arcname=arcname)
            print(f"  📦 Added: {arcname} ({filepath.stat().st_size / 1024:.1f} KB)")

    print(f"\n✅ Packaged successfully into: {ZIP_OUTPUT}")
    print(f"   Size: {ZIP_OUTPUT.stat().st_size / 1024:.1f} KB")
    print("=" * 70)


if __name__ == "__main__":
    main()
