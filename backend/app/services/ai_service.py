from __future__ import annotations

from typing import List, Optional

import re
from bson import ObjectId

from tenacity import retry, stop_after_attempt, wait_exponential

from app.models.document import AnalysisResult, ExecutiveSummary
from app.config import settings
from app.database import get_database
from app.services.llm_router import SmartLLMRouter
from app.services.rag_service import get_collection_count, get_relevant_context
from app.utils.json_utils import JSONRepairError, parse_json_robustly
from app.utils.logging_utils import get_logger
from app.services.localization_service import generate_pros_cons, simplify_text, SUPPORTED_LANGUAGES

logger = get_logger("ai_service")
router = SmartLLMRouter()

LEGAL_SUMMARY_PROMPT = """You are a senior legal counsel and expert contract analyst. Your task is to perform a deep-dive analysis of the provided legal document. 

CRITICAL: You MUST provide a value for EVERY single field in the JSON structure. Never return empty arrays or 0 scores if you can possibly infer the risk from the text. 

Return ONLY valid JSON. Do not include markdown, explanations, or code blocks. Ensure all fields are always present.

Instructions:
1. Start with a comprehensive 'introduction' that explains exactly what this document is, who it's for, and its primary significance in plain English.
2. Extract every piece of relevant information for each field in the 'summary' section. 
3. Be descriptive. Instead of "Yes" or "No", explain the terms. 
4. Generate a 'risk_scorecard' with scores (0-100) for Financial, Legal, Compliance, and Ownership categories. A score of 100 means very safe, 0 means extremely risky. 
5. Identify at least 3-5 'risk_attention_areas' (Financial, Liability, Ownership, Compliance, Privacy, Termination). For each, provide severity, impact, why it matters, and consequences.
6. Identify 'potential_loss_areas' where the user might face financial or legal losses.
7. Provide 'safety_recommendations' and 'careful_review_items' for the user.
8. If a detail is missing, provide a "Best Practice" recommendation instead of "Not found".
9. Never invent legal details that are not supported by the document text, but you MUST provide analytical insights based on what IS there.
10. Base every conclusion strictly on the provided document content.
11. Return clean JSON without markdown formatting.

Your response MUST be a valid JSON object with this exact structure:
{
  "summary": {
    "introduction": "...",
    "purpose": "...",
    "agreement_purpose": "...",
    "involved_parties": "...",
    "duration": "...",
    "payment_terms": "...",
    "termination_conditions": "...",
    "governing_law": "...",
    "liabilities": "...",
    "confidentiality": "...",
    "ownership": "...",
    "obligations": "..."
  },
  "key_points": [
    { "category": "Obligation | Deadline | Penalty | Renewal | Ownership | Dispute", "point": "..." }
  ],
  "risk_analysis": [
    { "type": "Financial | Legal | Operational | Privacy | Compliance", "severity": "low | medium | high | critical", "clause": "...", "reason": "..." }
  ],
  "risk_score": 0-100,
  "risk_level": "low | medium | high | critical",
  "recommendations": [ "..." ],
  "risk_scorecard": {
    "financial_score": 0-100,
    "legal_score": 0-100,
    "compliance_score": 0-100,
    "ownership_score": 0-100,
    "overall_score": 0-100
  },
  "risk_attention_areas": [
    { "area": "...", "severity": "low | medium | high | critical", "impact": "...", "why_it_matters": "...", "consequences": "..." }
  ],
  "potential_loss_areas": [
    { "area": "...", "business_impact": "...", "legal_impact": "...", "financial_consequences": "..." }
  ],
  "safety_recommendations": [ "..." ],
  "careful_review_items": [ "..." ]
}

Analyze the document thoroughly. Respond ONLY with valid JSON."""

CLAUSE_EXPLANATION_PROMPT = """You are a legal expert. Explain the following legal clause in simple, 
easy-to-understand language for a non-lawyer. Include:
1. What it means in plain English
2. Why it matters
3. Potential risks or implications
4. What to watch out for
5. Explain any uncommon legal terminology in simple language.
6. Mention whether the clause is generally standard, risky, or negotiable.

Clause text:
{clause_text}"""

RISK_ANALYSIS_PROMPT = """You are a legal risk analyst. Analyze the following clause from a legal document 
and determine its risk level. Consider:
- Is it one-sided or unfair?
- Does it limit liability excessively?
- Are there hidden obligations?
- Could it cause financial harm?
- Is it non-standard or unusual?
- Consider whether the clause creates long-term obligations or hidden legal exposure.
- Detect ambiguity or overly broad wording.
- Explain who benefits most from the clause.
Use only the provided clause text when determining risks.
Do not assume additional legal context beyond the provided clause.

Rate the risk as: low, medium, high, or critical.
Provide your analysis as JSON with keys: risk_level, risk_score (0-100), explanation, red_flags (array).
Respond ONLY with valid JSON.

Clause:
{clause_text}"""

CHATBOT_SYSTEM_PROMPT = """You are an AI legal assistant specializing in contract and legal document analysis.
You have access to the content of the user's uploaded legal document. Answer questions about the document
accurately and helpfully. If the user asks about something not in the document, say so clearly.

Rules:
1. Detect the user's language and respond in the same language.
2. If the user asks for a specific regional language explanation, provide it.
3. Simplify legal meanings for non-lawyers.
4. Always cite specific sections or clauses when possible. 
5. Be professional but approachable.
6. If the answer involves legal risk, clearly explain why the clause may be important or risky.
7. Avoid giving definitive legal advice; instead provide informational guidance.
8. If the user is in "Easy Mode" (indicated in the prompt), keep explanations very simple and avoid jargon.
"""


_NOT_FOUND = "Information not found in document"


BASIC_OVERVIEW_PROMPT = """You are a legal document analyst.

Goal: Provide a best-effort high-level overview of what the document is about, using ONLY the provided excerpt text. If exact details (parties, dates, jurisdiction, payment, etc.) are not present in the excerpt, do NOT invent them. However, you MUST still write a useful introduction describing what the document appears to be about (based on headings, repeated terms, scope, and structure).

Return ONLY valid JSON. No markdown. No extra keys. Use empty arrays/objects instead of null.

Your response MUST follow this exact structure:
{
  "summary": {
    "introduction": "Describe what this document appears to be (type + topic) in plain English.",
    "purpose": "Best-effort purpose from excerpt; if unclear, explain what the document is trying to do at a high level.",
    "agreement_purpose": "Best-effort objective; if unclear, keep it high-level.",
    "involved_parties": "Only list parties if explicitly named; otherwise say \"Information not found in document\".",
    "duration": "Only if explicitly present; otherwise \"Information not found in document\".",
    "payment_terms": "Only if explicitly present; otherwise \"Information not found in document\".",
    "termination_conditions": "Only if explicitly present; otherwise \"Information not found in document\".",
    "governing_law": "Only if explicitly present; otherwise \"Information not found in document\".",
    "liabilities": "Only if explicitly present; otherwise \"Information not found in document\".",
    "confidentiality": "Only if explicitly present; otherwise \"Information not found in document\".",
    "ownership": "Only if explicitly present; otherwise \"Information not found in document\".",
    "obligations": "Summarize major obligations only if explicitly present; otherwise \"Information not found in document\"."
  },
  "key_points": [],
  "risk_analysis": [],
  "risk_score": 0,
  "risk_level": "low",
  "recommendations": []
}"""


def _infer_basic_overview(text: str, title: str = "", filename: str = "") -> str:
    base = (title or filename or "").strip()
    t = (text or "").lower()
    doc_type = ""

    if "form 10-k" in t or re.search(r"\b10-k\b", t):
        doc_type = "an SEC Form 10-K annual report"
    elif "form 8-k" in t or re.search(r"\b8-k\b", t):
        doc_type = "an SEC Form 8-K current report"
    elif "privacy policy" in t:
        doc_type = "a privacy policy"
    elif "terms of service" in t or "terms and conditions" in t:
        doc_type = "terms of service / terms and conditions"
    elif "employment agreement" in t:
        doc_type = "an employment agreement"
    elif "non-disclosure" in t or "nondisclosure" in t or "nda" in t:
        doc_type = "a non-disclosure agreement (NDA)"
    elif "lease" in t and "tenant" in t:
        doc_type = "a lease agreement"
    elif "license agreement" in t:
        doc_type = "a license agreement"
    elif "statement of work" in t or re.search(r"\bSOW\b", text or ""):
        doc_type = "a statement of work"
    elif "master services agreement" in t or re.search(r"\bMSA\b", text or ""):
        doc_type = "a master services agreement"
    elif "purchase agreement" in t:
        doc_type = "a purchase agreement"
    elif "subscription" in t and "service" in t:
        doc_type = "a subscription/service agreement"
    elif "agreement" in t:
        doc_type = "a legal agreement"
    elif "report" in t or "financial statements" in t:
        doc_type = "a report / disclosure document"

    if doc_type:
        if base:
            return f'This document (“{base}”) appears to be {doc_type}. The overview below is based only on the extracted text and may be incomplete if parts of the PDF were not readable.'
        return f"This document appears to be {doc_type}. The overview below is based only on the extracted text and may be incomplete if parts of the PDF were not readable."

    if base:
        return f'This document (“{base}”) appears to be a legal/business document. The overview below is based only on the extracted text and may be incomplete if parts of the PDF were not readable.'
    return "This document appears to be a legal/business document. The overview below is based only on the extracted text and may be incomplete if parts of the PDF were not readable."


def _get_fallback_analysis(overview: Optional[str] = None) -> AnalysisResult:
    return AnalysisResult(
        summary=ExecutiveSummary(
            introduction=overview or "This document appears to be a legal/business document. The overview below is based only on the extracted text and may be incomplete if parts of the PDF were not readable.",
            purpose=_NOT_FOUND,
            agreement_purpose=_NOT_FOUND,
            involved_parties=_NOT_FOUND,
            duration=_NOT_FOUND,
            payment_terms=_NOT_FOUND,
            termination_conditions=_NOT_FOUND,
            governing_law=_NOT_FOUND,
            liabilities=_NOT_FOUND,
            confidentiality=_NOT_FOUND,
            ownership=_NOT_FOUND,
            obligations=_NOT_FOUND,
        ),
        key_points=[],
        risk_analysis=[],
        risk_score=50.0, # Baseline safety score
        risk_level="low",
        recommendations=["AI analysis failed to generate specific recommendations. Please ensure the document is readable and try again."],
        risk_scorecard=RiskScorecard(
            financial_score=50.0,
            legal_score=50.0,
            compliance_score=50.0,
            ownership_score=50.0,
            overall_score=50.0
        ),
        risk_attention_areas=[],
        potential_loss_areas=[],
        safety_recommendations=["Read the full document carefully.", "Consult a legal professional before signing."],
        careful_review_items=["Termination clauses", "Liability limitations", "Payment obligations"]
    )


def _needs_basic_overview(summary: object) -> bool:
    if not isinstance(summary, dict):
        return True
    intro = str(summary.get("introduction", "")).strip()
    if not intro or intro == _NOT_FOUND or "encountered an issue" in intro.lower():
        return True
    fields = [
        "purpose",
        "agreement_purpose",
        "involved_parties",
        "duration",
        "payment_terms",
        "termination_conditions",
        "governing_law",
        "liabilities",
        "confidentiality",
        "ownership",
        "obligations",
    ]
    missing = 0
    for f in fields:
        if str(summary.get(f, "")).strip() == _NOT_FOUND:
            missing += 1
    return missing >= 8


async def _generate_basic_overview(document_id: str, fallback_context: List[str]) -> Optional[dict]:
    db = get_database()
    doc = await db.documents.find_one({"_id": ObjectId(document_id)})
    title = str(doc.get("title", "")) if doc else ""
    filename = str(doc.get("filename", "")) if doc else ""
    extracted = str(doc.get("extracted_text", "")) if doc else ""
    excerpt = (extracted or "\n\n".join(fallback_context or []))[:12000]
    if not excerpt.strip():
        overview = _infer_basic_overview("", title=title, filename=filename)
        return _get_fallback_analysis(overview=overview).model_dump()

    user_prompt = f"Document name: {title or filename or 'Unknown'}\n\nExcerpt:\n{excerpt}"
    llm = await router.run(
        task="summary",
        system=BASIC_OVERVIEW_PROMPT,
        user=user_prompt,
        context_chunks=[excerpt],
        prefer_fast=False,
        require_json=True,
        temperature=0.1,
        max_tokens=1100,
        groq_model=settings.GROQ_MODEL_QUALITY,
    )
    try:
        parsed = parse_json_robustly(llm.text, max_attempts=4)
        validated = AnalysisResult(**parsed).model_dump()
        validated["llm_provider"] = llm.provider
        validated["llm_model"] = llm.model
        validated["llm_fallback_used"] = llm.fallback_used
        validated["llm_routing_reason"] = llm.routing_reason
        validated["llm_context_chunks"] = llm.context_chunks
        validated["llm_context_chars"] = llm.context_chars
        validated["llm_context_tokens_est"] = llm.context_tokens_est
        validated["llm_latency_ms"] = llm.latency_ms
        if _needs_basic_overview(validated.get("summary")):
            validated["summary"]["introduction"] = _infer_basic_overview(excerpt, title=title, filename=filename)
        return validated
    except Exception:
        overview = _infer_basic_overview(excerpt, title=title, filename=filename)
        return _get_fallback_analysis(overview=overview).model_dump()


def _merge_with_fallback(parsed_data: dict) -> dict:
    fallback = _get_fallback_analysis().model_dump()
    if not isinstance(parsed_data, dict):
        return fallback

    summary = parsed_data.get("summary")
    if isinstance(summary, dict):
        for key in fallback["summary"].keys():
            val = summary.get(key)
            if isinstance(val, str) and val.strip() and val.strip().lower() not in {"null", "none", "undefined"}:
                fallback["summary"][key] = val

    kp = parsed_data.get("key_points")
    if isinstance(kp, list):
        out = []
        for p in kp:
            if not isinstance(p, dict):
                continue
            point_text = p.get("point") or p.get("text") or p.get("description")
            if point_text:
                out.append({"category": str(p.get("category", "General")), "point": str(point_text)})
        if out:
            fallback["key_points"] = out

    ra = parsed_data.get("risk_analysis")
    if isinstance(ra, list):
        out = []
        for r in ra:
            if not isinstance(r, dict):
                continue
            reason = r.get("reason") or r.get("explanation") or r.get("description")
            if reason:
                out.append(
                    {
                        "type": str(r.get("type", "Legal")),
                        "severity": str(r.get("severity", "medium")).lower(),
                        "clause": str(r.get("clause", r.get("text", "N/A"))),
                        "reason": str(reason),
                    }
                )
        if out:
            fallback["risk_analysis"] = out

    recs = parsed_data.get("recommendations")
    if isinstance(recs, list):
        out = [str(r) for r in recs if r and str(r).strip()]
        if out:
            fallback["recommendations"] = out

    if "risk_score" in parsed_data:
        try:
            score = float(parsed_data["risk_score"])
            if 0 <= score <= 100:
                fallback["risk_score"] = score
        except (ValueError, TypeError):
            pass

    if "risk_level" in parsed_data:
        level = str(parsed_data["risk_level"]).lower()
        if level in {"low", "medium", "high", "critical"}:
            fallback["risk_level"] = level

    # Handle new risk intelligence fields
    if "risk_scorecard" in parsed_data and isinstance(parsed_data["risk_scorecard"], dict):
        sc = parsed_data["risk_scorecard"]
        for key in ["financial_score", "legal_score", "compliance_score", "ownership_score", "overall_score"]:
            if key in sc:
                try:
                    fallback["risk_scorecard"][key] = float(sc[key])
                except (ValueError, TypeError):
                    pass

    if "risk_attention_areas" in parsed_data and isinstance(parsed_data["risk_attention_areas"], list):
        out = []
        for area in parsed_data["risk_attention_areas"]:
            if isinstance(area, dict) and area.get("area"):
                out.append({
                    "area": str(area.get("area")),
                    "severity": str(area.get("severity", "medium")).lower(),
                    "impact": str(area.get("impact", "High")),
                    "why_it_matters": str(area.get("why_it_matters", "Legal protection")),
                    "consequences": str(area.get("consequences", "Potential disputes"))
                })
        if out:
            fallback["risk_attention_areas"] = out

    if "potential_loss_areas" in parsed_data and isinstance(parsed_data["potential_loss_areas"], list):
        out = []
        for item in parsed_data["potential_loss_areas"]:
            if isinstance(item, dict) and item.get("area"):
                out.append({
                    "area": str(item.get("area")),
                    "business_impact": str(item.get("business_impact", "Operational delays")),
                    "legal_impact": str(item.get("legal_impact", "Contractual breach")),
                    "financial_consequences": str(item.get("financial_consequences", "Potential penalties"))
                })
        if out:
            fallback["potential_loss_areas"] = out

    if "safety_recommendations" in parsed_data and isinstance(parsed_data["safety_recommendations"], list):
        out = [str(r) for r in parsed_data["safety_recommendations"] if r and str(r).strip()]
        if out:
            fallback["safety_recommendations"] = out

    if "careful_review_items" in parsed_data and isinstance(parsed_data["careful_review_items"], list):
        out = [str(r) for r in parsed_data["careful_review_items"] if r and str(r).strip()]
        if out:
            fallback["careful_review_items"] = out

    return fallback


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=8),
    before_sleep=lambda retry_state: logger.info(f"Retrying AI summary... Attempt {retry_state.attempt_number}"),
)
async def generate_legal_summary(document_id: str) -> dict:
    try:
        chunk_count = get_collection_count(document_id)
        if chunk_count == 0:
            raise ValueError("Document context not yet available in vector database.")

        search_query = "introduction parties purpose duration payment termination governing law liability confidentiality ownership obligations"
        top_k = 15
        if chunk_count >= 500:
            top_k = 50
        elif chunk_count >= 200:
            top_k = 35
        context_chunks = await get_relevant_context(document_id, search_query, top_k=top_k)
        if not context_chunks:
            basic = await _generate_basic_overview(document_id, [])
            return basic or _get_fallback_analysis().model_dump()

        user_prompt = (
            "Based ONLY on the following document excerpts, provide a legal analysis:\n\n"
            + "\n\n".join(context_chunks)
        )
        llm = await router.run(
            task="summary",
            system=LEGAL_SUMMARY_PROMPT,
            user=user_prompt,
            context_chunks=context_chunks,
            prefer_fast=False,
            require_json=True,
            temperature=0.1,
            max_tokens=3500,
            groq_model=settings.GROQ_MODEL_QUALITY,
        )

        try:
            parsed = parse_json_robustly(llm.text, max_attempts=5)
        except JSONRepairError:
            parsed = {}

        try:
            validated = AnalysisResult(**parsed)
            out = validated.model_dump()
        except Exception:
            out = _merge_with_fallback(parsed)

        out["llm_provider"] = llm.provider
        out["llm_model"] = llm.model
        out["llm_fallback_used"] = llm.fallback_used
        out["llm_routing_reason"] = llm.routing_reason
        out["llm_context_chunks"] = llm.context_chunks
        out["llm_context_chars"] = llm.context_chars
        out["llm_context_tokens_est"] = llm.context_tokens_est
        out["llm_latency_ms"] = llm.latency_ms

        if _needs_basic_overview(out.get("summary")):
            rescued = await _generate_basic_overview(document_id, context_chunks)
            if rescued and isinstance(rescued.get("summary"), dict):
                for k, v in rescued["summary"].items():
                    cur = str(out.get("summary", {}).get(k, "")).strip()
                    if not cur or cur == _NOT_FOUND:
                        out["summary"][k] = v
                if str(out["summary"].get("introduction", "")).strip() in {"", _NOT_FOUND}:
                    out["summary"]["introduction"] = rescued["summary"].get("introduction", out["summary"].get("introduction", ""))

        # Generate Pros/Cons and Easy Summary in parallel
        import asyncio
        try:
            pros_cons_data = await generate_pros_cons(context_chunks)
            out.update(pros_cons_data)
        except Exception as e:
            logger.error(f"Failed to generate pros/cons: {e}")
        
        # Generate Easy Summary
        try:
            easy_summary_dict = {}
            if "summary" in out:
                easy_tasks = []
                keys_to_simplify = ["introduction", "purpose", "agreement_purpose", "obligations", "liabilities"]
                
                async def simplify_key(k, v):
                    try:
                        simple_v = await simplify_text(v)
                        return k, simple_v
                    except Exception:
                        return k, v
                    
                for k, v in out["summary"].items():
                    if k in keys_to_simplify and v and v != _NOT_FOUND:
                        easy_tasks.append(simplify_key(k, v))
                    else:
                        easy_summary_dict[k] = v
                        
                if easy_tasks:
                    simplified_results = await asyncio.gather(*easy_tasks)
                    for k, v in simplified_results:
                        easy_summary_dict[k] = v
                        
                out["easy_summary"] = easy_summary_dict
        except Exception as e:
            logger.error(f"Failed to generate easy summary: {e}")

        return out
    except Exception as e:
        logger.error(f"Ultimate summary failure for {document_id}: {e}")
        return _get_fallback_analysis().model_dump()


async def explain_clause(clause_text: str) -> str:
    """
    Explain a legal clause in plain English.
    
    Args:
        clause_text: The clause text to explain.
    
    Returns:
        Plain-English explanation string.
    """
    user_prompt = CLAUSE_EXPLANATION_PROMPT.format(clause_text=clause_text)
    llm = await router.run(
        task="clause_explain",
        system="You are a legal expert.",
        user=user_prompt,
        context_chunks=[clause_text],
        prefer_fast=True,
        require_json=False,
        temperature=0.4,
        max_tokens=900,
        groq_model=settings.GROQ_MODEL_FAST,
    )
    return llm.text


async def analyze_clause_risk(clause_text: str) -> dict:
    """
    Analyze the risk level of a specific clause.
    
    Args:
        clause_text: The clause text to assess.
    
    Returns:
        Dict with risk_level, risk_score, explanation, red_flags.
    """
    user_prompt = RISK_ANALYSIS_PROMPT.format(clause_text=clause_text)
    llm = await router.run(
        task="risk_clause",
        system="You are a legal risk analyst.",
        user=user_prompt,
        context_chunks=[clause_text],
        prefer_fast=True,
        require_json=True,
        temperature=0.3,
        max_tokens=700,
        groq_model=settings.GROQ_MODEL_QUALITY,
    )

    result = {"risk_level": "medium", "risk_score": 50, "explanation": "Unable to analyze risk", "red_flags": []}
    try:
        parsed = parse_json_robustly(llm.text, max_attempts=3)
    except JSONRepairError:
        return result

    level = str(parsed.get("risk_level", "")).lower()
    if level in {"low", "medium", "high", "critical"}:
        result["risk_level"] = level
    try:
        score = float(parsed.get("risk_score", result["risk_score"]))
        if 0 <= score <= 100:
            result["risk_score"] = score
    except (ValueError, TypeError):
        pass
    if parsed.get("explanation"):
        result["explanation"] = str(parsed["explanation"])
    if isinstance(parsed.get("red_flags"), list):
        result["red_flags"] = [str(x) for x in parsed["red_flags"] if x]
    return result


async def chat_with_document(
    query: str,
    context_chunks: List[str],
    chat_history: List[dict] = None
) -> str:
    """
    Answer a user's question about a document using retrieved context.
    
    This is the final step of the RAG pipeline:
    1. User asks a question
    2. Relevant chunks are retrieved from ChromaDB (done by rag_service)
    3. This function sends the context + question to OpenAI for generation
    
    Args:
        query: The user's question.
        context_chunks: Relevant text chunks retrieved via semantic search.
        chat_history: Previous messages for conversation continuity.
    
    Returns:
        The AI assistant's response.
    """
    llm = await chat_with_document_meta(query=query, context_chunks=context_chunks, chat_history=chat_history)
    return llm["response"]


async def chat_with_document_meta(
    query: str,
    context_chunks: List[str],
    chat_history: List[dict] = None,
    target_lang: str = "en",
    easy_mode: bool = False
) -> dict:
    try:
        context = "\n\n---\n\n".join(context_chunks or [])
        history_text = ""
        if chat_history:
            history_lines = []
            for msg in chat_history[-10:]:
                role = str(msg.get("role", "user"))
                content = str(msg.get("content", ""))
                if content.strip():
                    history_lines.append(f"{role.upper()}: {content}")
            if history_lines:
                history_text = "\n".join(history_lines) + "\n"

        mode_instruction = "IMPORTANT: Respond in EASY LANGUAGE for a non-expert. Avoid legal jargon." if easy_mode else ""
        lang_instruction = f"IMPORTANT: Respond in {SUPPORTED_LANGUAGES.get(target_lang, 'English')} language." if target_lang != "en" else ""

        user_prompt = f"Relevant document excerpts:\n{context}\n\n{history_text}\n{mode_instruction}\n{lang_instruction}\nUSER: {query}\nASSISTANT:"
        llm = await router.run(
            task="chat",
            system=CHATBOT_SYSTEM_PROMPT,
            user=user_prompt,
            context_chunks=context_chunks or [],
            prefer_fast=True,
            require_json=False,
            temperature=0.5,
            max_tokens=1200,
            groq_model=settings.GROQ_MODEL_FAST,
        )
        return {
            "response": llm.text,
            "llm_provider": llm.provider,
            "llm_model": llm.model,
            "llm_fallback_used": llm.fallback_used,
        }
    except Exception as e:
        logger.error(f"Chat failed: {e}")
        return {
            "response": "I apologize, but I encountered an error while processing your request. Please try again in a few moments.",
            "llm_provider": "error",
            "llm_model": "error",
            "llm_fallback_used": True,
        }
