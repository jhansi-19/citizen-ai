# 🇮🇳 Citizen AI — Google Colab Fine-Tuning Instructions

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
