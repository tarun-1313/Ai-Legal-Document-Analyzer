from typing import List, Dict, Any, Optional
import time
import asyncio
from deep_translator import GoogleTranslator
from app.services.llm_router import SmartLLMRouter
from app.config import settings
from app.database import get_database
from app.utils.logging_utils import get_logger
from app.utils.json_utils import parse_json_robustly

logger = get_logger("localization_service")
router = SmartLLMRouter()

SUPPORTED_LANGUAGES = {
    "en": "English",
    "hi": "Hindi",
    "mr": "Marathi",
    "pa": "Punjabi",
    "gu": "Gujarati",
    "ta": "Tamil",
    "te": "Telugu",
    "kn": "Kannada",
    "ml": "Malayalam",
    "bn": "Bengali",
    "ur": "Urdu",
    "or": "Odia",
    "as": "Assamese",
    "sa": "Sanskrit",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "ar": "Arabic"
}

# Add map for deep-translator if codes differ
LANG_CODE_MAP = {
    "en": "en",
    "hi": "hi",
    "mr": "mr",
    "pa": "pa",
    "gu": "gu",
    "ta": "ta",
    "te": "te",
    "kn": "kn",
    "ml": "ml",
    "bn": "bn",
    "ur": "ur",
    "or": "or",
    "as": "as",
    "sa": "sa",
    "es": "es",
    "fr": "fr",
    "de": "de",
    "ar": "ar"
}

SIMPLIFICATION_PROMPT = """You are a legal accessibility expert. Your goal is to simplify complex legal text into "Easy Language" that a common person, rural user, or elderly person can easily understand.

Instructions:
1. Use everyday language. Avoid all legal jargon.
2. If you must use a legal term, explain it simply in parentheses.
3. Focus on "What does this mean for ME?" (the user).
4. Explain obligations, penalties, and risks very clearly.
5. Keep sentences short and direct.
6. Preserve the actual legal intent and meaning. Do not hallucinate.

Original Legal Text:
{text}

Respond ONLY with the simplified version in English."""

PROS_CONS_PROMPT = """You are a legal document auditor. Analyze the provided document context and generate a balanced list of Pros (Advantages) and Cons (Risks/Disadvantages) for the user.

Return ONLY valid JSON.

Structure:
{{
  "pros": [
    {{ "title": "Short title", "description": "Simple explanation of the advantage" }}
  ],
  "cons": [
    {{ "title": "Short title", "description": "Simple explanation of the risk or disadvantage" }}
  ],
  "hidden_risks": [
    {{ "title": "Short title", "description": "Explanation of a non-obvious risk" }}
  ],
  "financial_concerns": [
    {{ "title": "Short title", "description": "Explanation of financial implications" }}
  ]
}}

Document Context:
{context}

Respond ONLY with valid JSON."""

async def simplify_text(text: str) -> str:
    """Simplify legal text into plain English."""
    if not text or len(text.strip()) < 5:
        return text
        
    llm = await router.run(
        task="simplification",
        system="You are a legal accessibility expert.",
        user=SIMPLIFICATION_PROMPT.format(text=text),
        context_chunks=[text],
        prefer_fast=True,
        require_json=False,
        temperature=0.3,
        max_tokens=1000,
        groq_model=settings.GROQ_MODEL_FAST
    )
    return llm.text

async def translate_text(text: str, target_lang_code: str) -> str:
    """Translate text into the target language using deep-translator (Fast)."""
    if target_lang_code == "en" or not text or len(text.strip()) < 2:
        return text
        
    target_lang = LANG_CODE_MAP.get(target_lang_code, target_lang_code)
    
    try:
        # Check cache first
        db = get_database()
        import hashlib
        text_hash = hashlib.md5(text.encode()).hexdigest()
        cache_key = f"{target_lang}_{text_hash}"
        
        try:
            cached = await db.translations.find_one({"_id": cache_key})
            if cached:
                return cached["translated_text"]
        except Exception as e:
            logger.warning(f"Translation cache lookup failed: {e}")
            
        # Perform translation using deep-translator (much faster than LLM)
        # Use a timeout or wrap in a thread to prevent blocking if needed
        # deep-translator is synchronous, so we run in executor
        loop = asyncio.get_event_loop()
        translated = await loop.run_in_executor(
            None, 
            lambda: GoogleTranslator(source='auto', target=target_lang).translate(text)
        )
        
        if not translated:
            return text

        # Save to cache
        try:
            await db.translations.update_one(
                {"_id": cache_key},
                {"$set": {
                    "original_text": text,
                    "translated_text": translated,
                    "target_lang": target_lang,
                    "created_at": time.time()
                }},
                upsert=True
            )
        except Exception as e:
            logger.warning(f"Failed to save translation to cache: {e}")
        
        return translated
    except Exception as e:
        logger.error(f"Translation failed for {target_lang}: {e}")
        return text # Fallback to original English text on failure

async def generate_pros_cons(context_chunks: List[str]) -> Dict[str, Any]:
    """Generate pros and cons from document context."""
    context = "\n\n".join(context_chunks)
    llm = await router.run(
        task="pros_cons",
        system="You are a legal document auditor.",
        user=PROS_CONS_PROMPT.format(context=context),
        context_chunks=context_chunks,
        prefer_fast=False,
        require_json=True,
        temperature=0.2,
        max_tokens=1500,
        groq_model=settings.GROQ_MODEL_QUALITY
    )
    
    try:
        return parse_json_robustly(llm.text)
    except Exception as e:
        logger.error(f"Failed to parse pros/cons JSON: {e}")
        return {"pros": [], "cons": [], "hidden_risks": [], "financial_concerns": []}

async def translate_analysis_result(analysis: Dict[str, Any], target_lang_code: str) -> Dict[str, Any]:
    """Translate a full analysis result into the target language using fast translator."""
    if target_lang_code == "en":
        return analysis
        
    import copy
    import asyncio
    translated = copy.deepcopy(analysis)
    
    tasks = []
    
    # Summary
    if "summary" in translated:
        for key, value in translated["summary"].items():
            if isinstance(value, str) and value.strip():
                async def t_summary(k, v):
                    translated["summary"][k] = await translate_text(v, target_lang_code)
                tasks.append(t_summary(key, value))
                
    # Easy Summary
    if "easy_summary" in translated and translated["easy_summary"]:
        for key, value in translated["easy_summary"].items():
            if isinstance(value, str) and value.strip():
                async def t_easy_summary(k, v):
                    translated["easy_summary"][k] = await translate_text(v, target_lang_code)
                tasks.append(t_easy_summary(key, value))

    # Key Points
    if "key_points" in translated:
        for i, item in enumerate(translated["key_points"]):
            if "point" in item:
                async def t_kp(idx, p):
                    translated["key_points"][idx]["point"] = await translate_text(p, target_lang_code)
                tasks.append(t_kp(i, item["point"]))
            if "category" in item:
                async def t_cat(idx, c):
                    translated["key_points"][idx]["category"] = await translate_text(c, target_lang_code)
                tasks.append(t_cat(i, item["category"]))
                
    # Risk Analysis
    if "risk_analysis" in translated:
        for i, item in enumerate(translated["risk_analysis"]):
            if "reason" in item:
                async def t_risk(idx, r):
                    translated["risk_analysis"][idx]["reason"] = await translate_text(r, target_lang_code)
                tasks.append(t_risk(i, item["reason"]))
            if "type" in item:
                async def t_rtype(idx, t):
                    translated["risk_analysis"][idx]["type"] = await translate_text(t, target_lang_code)
                tasks.append(t_rtype(i, item["type"]))
                
    # Recommendations
    if "recommendations" in translated:
        for i, rec in enumerate(translated["recommendations"]):
            async def t_rec(idx, r):
                translated["recommendations"][idx] = await translate_text(r, target_lang_code)
            tasks.append(t_rec(i, rec))
        
    # Pros/Cons sections
    for section in ["pros", "cons", "hidden_risks", "financial_concerns"]:
        if section in translated:
            for i, item in enumerate(translated[section]):
                if "title" in item:
                    async def t_pc_title(s, idx, t):
                        translated[s][idx]["title"] = await translate_text(t, target_lang_code)
                    tasks.append(t_pc_title(section, i, item["title"]))
                if "description" in item:
                    async def t_pc_desc(s, idx, d):
                        translated[s][idx]["description"] = await translate_text(d, target_lang_code)
                    tasks.append(t_pc_desc(section, i, item["description"]))
                    
    # New Risk Intelligence Fields (will be added to analysis soon)
    for section in ["risk_attention_areas", "potential_loss_areas", "safety_recommendations"]:
        if section in translated:
            for i, item in enumerate(translated[section]):
                if isinstance(item, str):
                    async def t_simple_str(s, idx, text):
                        translated[s][idx] = await translate_text(text, target_lang_code)
                    tasks.append(t_simple_str(section, i, item))
                elif isinstance(item, dict):
                    for k, v in item.items():
                        if isinstance(v, str):
                            async def t_dict_val(s, idx, key, val):
                                translated[s][idx][key] = await translate_text(val, target_lang_code)
                            tasks.append(t_dict_val(section, i, k, v))

    if tasks:
        await asyncio.gather(*tasks)
                    
    return translated
