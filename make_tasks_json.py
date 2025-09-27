#!/usr/bin/env python3
"""Utility for refreshing GDPval task scaffolding.

Downloads the Hugging Face `openai/gdpval` training split and emits two JSON
artifacts under the current directory:

* tasks.json    : prompt metadata, reference file URLs, and answer_id mapping
* answers.json  : lightweight lookup table of ideal answer text + references

Running this script requires network access and an environment where
`datasets` (Hugging Face Datasets) is installed.  Outputs are UTF-8 encoded and
pretty-printed for human diff review.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable, List

from datasets import load_dataset

ROOT = Path(__file__).parent
TASKS_PATH = ROOT / "tasks.json"
ANSWERS_PATH = ROOT / "answers.json"


def normalise_ideal(raw: object) -> List[str]:
    """Return a list of ideal answer snippets from the dataset entry."""
    if raw is None:
        return []
    if isinstance(raw, str):
        return [raw]
    if isinstance(raw, Iterable):
        return [str(item) for item in raw if isinstance(item, str)]
    return []


def main() -> None:
    ds = load_dataset("openai/gdpval", split="train")

    tasks = []
    answers = {}

    for idx, record in enumerate(ds):
        task_id = record.get("task_id") or record.get("id") or f"task_{idx:05d}"
        prompt = record.get("prompt", "").strip()
        ideal_list = normalise_ideal(record.get("ideal"))
        reference_files = record.get("reference_file_urls") or []

        tasks.append(
            {
                "id": task_id,
                "input": prompt,
                "answer_id": task_id,
                "reference_files": reference_files,
            }
        )

        answers[task_id] = {
            "title": prompt[:64],
            "ideal_text": " ".join(ideal_list).strip(),
            "reference_files": reference_files,
        }

    TASKS_PATH.write_text(json.dumps(tasks, ensure_ascii=False, indent=2), encoding="utf-8")
    ANSWERS_PATH.write_text(json.dumps(answers, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Saved {len(tasks)} tasks to {TASKS_PATH}")
    print(f"Saved {len(answers)} answer entries to {ANSWERS_PATH}")


if __name__ == "__main__":  # pragma: no cover
    main()
