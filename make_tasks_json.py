from datasets import load_dataset
import json

# GDPval データセットを読み込み
ds = load_dataset("openai/gdpval", split="train")

tasks = []
for rec in ds:
    prompt = rec.get("prompt", "")
    # データ構造によって ideal の場所が異なる場合あり
    ideal = rec.get("ideal") or rec.get("reference") or ""
    tasks.append({"input": prompt, "ideal": ideal})

with open("tasks.json", "w", encoding="utf-8") as f:
    json.dump(tasks, f, ensure_ascii=False, indent=2)

print("保存完了: tasks.json (件数:", len(tasks), ")")
