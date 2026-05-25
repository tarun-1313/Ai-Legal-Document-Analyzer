"""
Clause Classifier Service
Classifies legal clauses into CUAD categories and detects risky clauses.
"""

import torch
import torch.nn.functional as F
from typing import List, Dict, Optional
from transformers import AutoTokenizer, AutoModelForSequenceClassification

CUAD_CLAUSE_TYPES = [
    "Document Name", "Parties", "Agreement Date", "Effective Date",
    "Expiration Date", "Renewal Term", "Notice Period To Terminate Renewal",
    "Governing Law", "Most Favored Nation", "Non-Compete",
    "Exclusivity", "No-Solicit Of Customers", "No-Solicit Of Employees",
    "Non-Disparagement", "Termination For Convenience",
    "Rofr/Rofo/Rofn", "Change Of Control", "Anti-Assignment",
    "Revenue/Profit Sharing", "Price Restrictions",
    "Minimum Commitment", "Volume Restriction", "Ip Ownership Assignment",
    "Joint Ip Ownership", "License Grant", "Non-Transferable License",
    "Affiliate License-Licensor", "Affiliate License-Licensee",
    "Unlimited/All-You-Can-Eat-License", "Irrevocable Or Perpetual License",
    "Source Code Escrow", "Post-Termination Services",
    "Competing Activities", "Audit Rights", "Uncapped Liability",
    "Cap On Liability", "Liquidated Damages", "Warranty Duration",
    "Insurance", "Covenant Not To Sue", "Third Party Beneficiary",
]

CUAD_DESCRIPTIONS = {
    "Document Name": "The name or title of the contract.",
    "Parties": "The entities or individuals entering into the agreement.",
    "Agreement Date": "The date the contract was signed or executed.",
    "Effective Date": "The date when the contract terms officially begin.",
    "Expiration Date": "The date when the contract naturally ends.",
    "Renewal Term": "Terms for extending the contract after the initial period.",
    "Notice Period To Terminate Renewal": "Time required to notify the other party of non-renewal.",
    "Governing Law": "The jurisdiction/laws that apply to this contract.",
    "Most Favored Nation": "Guaranteeing the buyer the best terms offered to others.",
    "Non-Compete": "Restriction on starting or joining a competing business.",
    "Exclusivity": "Sole rights given to a party to provide or receive goods/services.",
    "No-Solicit Of Customers": "Prohibition on approaching the other party's clients.",
    "No-Solicit Of Employees": "Prohibition on hiring the other party's staff.",
    "Non-Disparagement": "Agreement not to say negative things about the other party.",
    "Termination For Convenience": "Right to end the contract without needing a specific reason.",
    "Rofr/Rofo/Rofn": "Right of First Refusal/Offer/Negotiation for future deals.",
    "Change Of Control": "Rights triggered if a party is acquired or merged.",
    "Anti-Assignment": "Restrictions on transferring contract rights to others.",
    "Revenue/Profit Sharing": "Requirement to share earnings with the other party.",
    "Price Restrictions": "Limits on changing prices for goods or services.",
    "Minimum Commitment": "Minimum purchase or performance requirements.",
    "Volume Restriction": "Limits on the quantity of goods or services provided.",
    "Ip Ownership Assignment": "Transfer of intellectual property rights to a party.",
    "Joint Ip Ownership": "Shared ownership of intellectual property created.",
    "License Grant": "Permission given to use certain property or technology.",
    "Non-Transferable License": "License that cannot be passed to another party.",
    "Affiliate License-Licensor": "License extended from the licensor's affiliates.",
    "Affiliate License-Licensee": "License extended to the licensee's affiliates.",
    "Unlimited/All-You-Can-Eat-License": "Usage license without volume or seat limits.",
    "Irrevocable Or Perpetual License": "License that cannot be taken back or never expires.",
    "Source Code Escrow": "Depositing code with a third party for safety.",
    "Post-Termination Services": "Help or services provided after the contract ends.",
    "Competing Activities": "Limits on engaging in specific business activities.",
    "Audit Rights": "Right to inspect records to ensure compliance.",
    "Uncapped Liability": "No limit on the amount of damages a party may pay.",
    "Cap On Liability": "Maximum limit on financial damages for a breach.",
    "Liquidated Damages": "Pre-agreed penalty amount for specific contract breaches.",
    "Warranty Duration": "The time period during which a warranty is valid.",
    "Insurance": "Requirement to maintain specific insurance coverage.",
    "Covenant Not To Sue": "Agreement not to bring legal action against a party.",
    "Third Party Beneficiary": "A non-signer who still gains rights from the contract.",
}

RISK_WEIGHTS = {
    "Uncapped Liability": 0.95, "Non-Compete": 0.85, "Exclusivity": 0.80,
    "Anti-Assignment": 0.75, "Termination For Convenience": 0.70,
    "Change Of Control": 0.70, "Liquidated Damages": 0.65,
    "Cap On Liability": 0.60, "No-Solicit Of Employees": 0.60,
    "Competing Activities": 0.55, "Non-Disparagement": 0.50,
    "Volume Restriction": 0.45, "Minimum Commitment": 0.45,
}

KEYWORD_MAP = {
    "Document Name": ["agreement", "contract", "amendment"],
    "Parties": ["between", "party", "hereinafter", "undersigned"],
    "Agreement Date": ["dated", "as of", "entered into"],
    "Effective Date": ["effective date", "commencement date"],
    "Expiration Date": ["expiration", "expire", "termination date"],
    "Renewal Term": ["renewal", "renew", "auto-renew"],
    "Governing Law": ["governing law", "governed by", "jurisdiction"],
    "Non-Compete": ["non-compete", "noncompete", "shall not compete"],
    "Exclusivity": ["exclusive", "exclusivity", "sole and exclusive"],
    "No-Solicit Of Employees": ["solicit", "hiring", "recruit"],
    "Non-Disparagement": ["disparage", "disparagement"],
    "Termination For Convenience": ["terminate", "without cause", "for convenience"],
    "Change Of Control": ["change of control", "merger", "acquisition"],
    "Anti-Assignment": ["assignment", "assign", "transfer"],
    "License Grant": ["license", "grant", "right to use"],
    "Uncapped Liability": ["unlimited liability", "uncapped"],
    "Cap On Liability": ["cap on liability", "limited to", "not exceed"],
    "Liquidated Damages": ["liquidated damages", "penalty"],
    "Warranty Duration": ["warranty", "warranted"],
    "Insurance": ["insurance", "indemnif", "coverage"],
    "Ip Ownership Assignment": ["intellectual property", "ip", "ownership"],
    "Audit Rights": ["audit", "inspect", "examination"],
    "Minimum Commitment": ["minimum", "commitment", "guaranteed"],
    "Competing Activities": ["competing", "competitive activities"],
}


# Global instance for singleton pattern
_classifier_instance = None


def get_classifier():
    """Get or create the global LegalBERT classifier instance."""
    global _classifier_instance
    if _classifier_instance is None:
        from app.config import settings
        _classifier_instance = CUADClassifier(model_path=settings.LEGALBERT_MODEL_PATH)
        _classifier_instance.load_model()
    return _classifier_instance


class CUADClassifier:
    """
    Singleton wrapper for LegalBERT clause classification.
    """
    def __init__(self, model_path: Optional[str] = None):
        self.model = None
        self.tokenizer = None
        self.label2id = {}
        self.id2label = {}
        self.model_path = model_path
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.is_loaded = False

    def load_model(self):
        """Load trained model and its label mapping from local directory."""
        try:
            import os
            from app.config import settings
            
            # Use absolute path to the directory containing model files
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            path = self.model_path or os.path.normpath(os.path.join(base_dir, settings.LEGALBERT_MODEL_PATH))
            
            # Required files for a proper HuggingFace model load
            required_files = ["config.json", "model.safetensors", "tokenizer.json", "tokenizer_config.json"]
            
            if os.path.exists(path):
                has_files = all(os.path.exists(os.path.join(path, f)) for f in required_files)
            else:
                has_files = False

            if has_files:
                print(f"Loading LegalBERT from: {path}...")
                
                # Load tokenizer and model from the local directory
                self.tokenizer = AutoTokenizer.from_pretrained(path, local_files_only=True)
                self.model = AutoModelForSequenceClassification.from_pretrained(
                    path, 
                    local_files_only=True
                )
                
                # Setup label mapping from model config
                self.id2label = self.model.config.id2label
                self.label2id = self.model.config.label2id
                
                self.model.to(self.device)
                self.model.eval()
                print(f"AI Model loaded with {len(self.id2label)} classes on {self.device}")
                self.is_loaded = True
            else:
                missing = [f for f in required_files if not os.path.exists(os.path.join(path, f))]
                print(f"❌ Model directory incomplete or missing at: {path}. Missing: {missing}")
                print("⚠️ Falling back to Keyword matching is NOT ALLOWED per strict requirements.")
                self.is_loaded = False
                
        except Exception as e:
            print(f"❌ Classifier load error: {e}")
            self.is_loaded = False

    def classify_clause(self, text: str) -> List[Dict]:
        """
        Classify a single clause using only the AI Model.
        """
        if self.model and self.tokenizer:
            return self._classify_with_model(text)
        
        # If model is not loaded, we do NOT fall back to keywords as per requirements
        return []

    def _classify_with_model(self, text: str) -> List[Dict]:
        """Predict clause type using the fine-tuned Legal-BERT model with softmax confidence."""
        inputs = self.tokenizer(
            text, 
            return_tensors="pt", 
            truncation=True, 
            max_length=512, 
            padding=True
        ).to(self.device)
        
        with torch.no_grad():
            outputs = self.model(**inputs)
            # Use Softmax to get realistic confidence scores
            probs = F.softmax(outputs.logits, dim=1)
            # Get top 3 predictions
            confidences, indices = torch.topk(probs, k=3)
            
        results = []
        for i in range(confidences.size(1)):
            conf = confidences[0][i].item()
            idx = indices[0][i].item()
            label = self.id2label.get(idx, "Unknown")
            
            # If label is a generic "LABEL_X", map it to our descriptive types
            if label.startswith("LABEL_") and idx < len(CUAD_CLAUSE_TYPES):
                label = CUAD_CLAUSE_TYPES[idx]
            
            # STRICT REQUIREMENT: Only show results with confidence > 75%
            if conf >= 0.75:
                results.append({
                    "clause_type": label,
                    "description": CUAD_DESCRIPTIONS.get(label, "Detected via semantic matching"),
                    "confidence": round(conf, 4),
                    "risk_weight": RISK_WEIGHTS.get(label, 0.3),
                })
        return results

    # REMOVED: Keyword fallback logic to ensure strict model-only predictions

    def classify_document_chunks(self, chunks: List[str]) -> List[Dict]:
        """
        Classify multiple chunks and filter results.
        Ensures high confidence and removes duplicate clause types by keeping the best match.
        """
        clause_map = {}  # {clause_type: best_clause_dict}
        
        for i, chunk in enumerate(chunks):
            # Use model or fallback keywords
            predictions = self.classify_clause(chunk)
            
            for cls in predictions:
                # Use a very lenient threshold (0.3+) to ensure we get results
                if cls["confidence"] < 0.3:
                    continue
                
                clause_type = cls["clause_type"]
                risk_level = "low"
                if cls["risk_weight"] >= 0.8: risk_level = "critical"
                elif cls["risk_weight"] >= 0.6: risk_level = "high"
                elif cls["risk_weight"] >= 0.4: risk_level = "medium"
                
                clause_data = {
                    "clause_type": clause_type,
                    "description": cls.get("description", "Detected via semantic matching"),
                    "text": chunk[:800],  # Increased preview length
                    "confidence": cls["confidence"],
                    "risk_level": risk_level,
                    "chunk_index": i,
                }
                
                # Keep the one with highest confidence for each type
                if clause_type not in clause_map or cls["confidence"] > clause_map[clause_type]["confidence"]:
                    clause_map[clause_type] = clause_data
                    
        return sorted(list(clause_map.values()), key=lambda x: x["confidence"], reverse=True)

    def calculate_overall_risk(self, clauses: List[Dict]) -> tuple:
        if not clauses:
            return 0.0, "low"
        total_w, total_s = 0, 0
        for c in clauses:
            w = c.get("confidence", 0.5)
            r = RISK_WEIGHTS.get(c["clause_type"], 0.3)
            total_s += r * w * 100
            total_w += w
        score = min(total_s / total_w, 100) if total_w > 0 else 0
        level = "critical" if score >= 75 else "high" if score >= 50 else "medium" if score >= 25 else "low"
        return round(score, 1), level


classifier = CUADClassifier()

if __name__ == "__main__":
    # 🧪 Test block to verify the classifier works independently
    import sys
    from pathlib import Path
    
    # Setup for standalone run
    print("🧪 Running Clause Classifier in Test Mode...")
    classifier.load_model()
    
    test_clauses = [
        "The Employee shall not, for a period of two years, engage in any business that competes with the Company.",
        "This agreement shall be governed by the laws of the State of Delaware.",
        "The total liability of the Provider shall be unlimited for any breaches of data privacy."
    ]
    
    for i, text in enumerate(test_clauses):
        print(f"\n--- Test {i+1} ---")
        print(f"Input: {text[:70]}...")
        results = classifier.classify_clause(text)
        if not results:
            print("❌ No classification found.")
        for r in results:
            risk_label = "CRITICAL" if r['risk_weight'] > 0.8 else "HIGH" if r['risk_weight'] > 0.6 else "MEDIUM" if r['risk_weight'] > 0.4 else "LOW"
            print(f"✅ Type: {r['clause_type']} ({r['confidence']*100:.1f}%) | Risk: {risk_label}")
