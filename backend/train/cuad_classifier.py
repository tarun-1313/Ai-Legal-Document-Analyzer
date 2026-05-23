#!/usr/bin/env python
"""cuad_classifier.py

Fine‑tune a BERT/Legal‑BERT model on the CUAD clause‑classification dataset.

Usage example:
    python -m backend.train.cuad_classifier \
        --data_path data/cuad.json \
        --output_path ml_models/cuad_classifier.pt \
        --epochs 80 \
        --batch_size 16 \
        --learning_rate 2e-5

The script expects the CUAD JSON file to contain a top‑level object with
"train" and "validation" keys, each mapping to a list of examples:
    {
        "text": "... clause text ...",
        "label": "<clause_type>"
    }

The script creates a simple ``torch.utils.data.Dataset`` that tokenises the
text using a HuggingFace tokenizer, maps textual labels to integer IDs and
feeds the data to the ``transformers.Trainer`` API.  After training the model
weights are saved to the ``output_path`` as a ``.pt`` checkpoint (state_dict).

Dependencies (already in ``requirements.txt``):
    torch, transformers, python‑dotenv (for optional .env loading)

If you need the ``datasets`` library you can install it with:
    pip install datasets
"""

import argparse
import json
import os
import pickle
import pandas as pd
from pathlib import Path
from typing import List, Dict
from sklearn.model_selection import train_test_split

import torch
import numpy as np
from torch.utils.data import Dataset, DataLoader
from sklearn.metrics import accuracy_score, f1_score, precision_recall_fscore_support
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    Trainer,
    TrainingArguments,
    EarlyStoppingCallback,
    set_seed,
)

# ---------------------------------------------------------------------------
# Dataset utilities
# ---------------------------------------------------------------------------
class CUADDataset(Dataset):
    """Simple PyTorch dataset for CUAD.

    It tokenises the ``text`` field and converts the string ``label`` to an
    integer ID based on the ``label2id`` mapping supplied at construction.
    """

    def __init__(self, examples: List[Dict], tokenizer, label2id: Dict[str, int], max_length: int = 512):
        self.examples = examples
        self.tokenizer = tokenizer
        self.label2id = label2id
        self.max_length = max_length

    def __len__(self):
        return len(self.examples)

    def __getitem__(self, idx):
        item = self.examples[idx]
        text = item["text"]
        label_str = item["label"]
        label_id = self.label2id[label_str]
        enc = self.tokenizer(
            text,
            truncation=True,
            padding="max_length",
            max_length=self.max_length,
            return_tensors="pt",
        )
        # Remove batch dimension added by tokenizer
        enc = {k: v.squeeze(0) for k, v in enc.items()}
        enc["labels"] = torch.tensor(label_id, dtype=torch.long)
        return enc

# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------
def load_data(path: str) -> Dict[str, List[Dict]]:
    """Load data from JSON or CSV file.
    
    If CSV, expects columns: 'clause_text' and 'clause_type'
    If JSON, expects format: {"train": [...], "validation": [...]}
    """
    ext = Path(path).suffix.lower()
    
    if ext == ".csv":
        print(f"📊 Loading CSV dataset from {path}...")
        df = pd.read_csv(path)
        # Rename columns if they match our expected names
        df = df.rename(columns={
            "clause_text": "text", 
            "clause_type": "label",
            "text": "text",
            "label": "label"
        })
        
        # Filter out empty rows
        df = df.dropna(subset=["text", "label"])
        
        # Convert to list of dicts
        examples = df[["text", "label"]].to_dict("records")
        
        # Split into train/val
        train_ex, val_ex = train_test_split(examples, test_size=0.15, random_state=42)
        return {"train": train_ex, "validation": val_ex}
        
    else:
        print(f"📄 Loading JSON dataset from {path}...")
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data

def build_label_mappings(train_examples: List[Dict]) -> Dict[str, int]:
    """Create ``label -> id`` and ``id -> label`` dictionaries.
    """
    labels = sorted({ex["label"] for ex in train_examples})
    label2id = {lbl: idx for idx, lbl in enumerate(labels)}
    return label2id

# ---------------------------------------------------------------------------
# Main training routine
# ---------------------------------------------------------------------------
def main():
    # Get the directory of the current script to build relative paths
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent.parent
    
    default_data_path = str(project_root / "dataset" / "all_reshaped_clauses.csv")
    default_output_path = str(script_dir.parent / "ml_models" / "cuad_classifier.pt")

    parser = argparse.ArgumentParser(description="Fine‑tune Legal‑BERT on CUAD.")
    parser.add_argument(
        "--data_path", 
        type=str, 
        default=default_data_path,
        help=f"Path to dataset (default: {default_data_path})"
    )
    parser.add_argument(
        "--output_path",
        type=str,
        default=default_output_path,
        help=f"Where to store the trained checkpoint (default: {default_output_path})",
    )
    parser.add_argument("--model_name", type=str, default="nlpaueb/legal-bert-base-uncased", help="Pre‑trained model identifier.")
    parser.add_argument("--epochs", type=int, default=80, help="Number of training epochs.")
    parser.add_argument("--batch_size", type=int, default=16, help="Training batch size.")
    parser.add_argument("--learning_rate", type=float, default=2e-5, help="Learning rate.")
    parser.add_argument("--max_length", type=int, default=512, help="Maximum token length.")
    parser.add_argument("--seed", type=int, default=42, help="Random seed.")
    args = parser.parse_args()

    set_seed(args.seed)

    # -------------------------------------------------------------------
    # Load data & prepare label mapping
    # -------------------------------------------------------------------
    data = load_data(args.data_path)
    train_examples = data.get("train", [])
    val_examples = data.get("validation", [])
    if not train_examples:
        raise ValueError("No training examples found in the provided CUAD file.")

    label2id = build_label_mappings(train_examples)
    num_labels = len(label2id)
    print(f"Found {num_labels} distinct clause labels.")

    # -------------------------------------------------------------------
    # Tokenizer & model
    # -------------------------------------------------------------------
    tokenizer = AutoTokenizer.from_pretrained(args.model_name, use_fast=True)
    model = AutoModelForSequenceClassification.from_pretrained(
        args.model_name, num_labels=num_labels
    )

    # -------------------------------------------------------------------
    # Datasets
    # -------------------------------------------------------------------
    train_dataset = CUADDataset(train_examples, tokenizer, label2id, max_length=args.max_length)
    val_dataset = CUADDataset(val_examples, tokenizer, label2id, max_length=args.max_length)

    # -------------------------------------------------------------------
    # Trainer configuration
    # -------------------------------------------------------------------
    training_args = TrainingArguments(
        output_dir="./tmp_trainer",
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size,
        learning_rate=args.learning_rate,
        eval_strategy="epoch",
        save_strategy="epoch",
        logging_strategy="steps",
        logging_steps=50,
        load_best_model_at_end=True,
        metric_for_best_model="f1_weighted",
        greater_is_better=True,
        seed=args.seed,
        report_to=[],
    )

    def compute_metrics(eval_pred):
        logits, labels = eval_pred
        preds = np.argmax(logits, axis=1)
        
        # Calculate multiple metrics
        acc = accuracy_score(labels, preds)
        precision, recall, f1, _ = precision_recall_fscore_support(labels, preds, average='weighted')
        
        return {
            "accuracy": acc,
            "f1_weighted": f1,
            "precision": precision,
            "recall": recall
        }

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        compute_metrics=compute_metrics,
        callbacks=[EarlyStoppingCallback(early_stopping_patience=2)],
    )

    # -------------------------------------------------------------------
    # Train & save
    # -------------------------------------------------------------------
    print("🚀 Starting training...")
    trainer.train()
    
    # Ensure destination directory exists
    output_path = Path(args.output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Save model weights, tokenizer, and label mapping as a single package
    save_data = {
        "state_dict": model.state_dict(),
        "label2id": label2id,
        "id2label": {v: k for k, v in label2id.items()},
        "model_config": model.config,
    }
    
    torch.save(save_data, str(output_path))
    print(f"✅ Model package (weights + labels) saved to {output_path}")

if __name__ == "__main__":
    main()
