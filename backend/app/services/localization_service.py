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

# Global semaphore to limit concurrent translations and avoid rate limits
translation_semaphore = asyncio.Semaphore(10)

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

TRANSLATION_PROMPT = """You are a professional legal translator. Your task is to translate the provided JSON object containing legal document analysis into {target_language}.

Instructions:
1. Translate ONLY the values of the strings. Do NOT translate the keys.
2. Maintain the exact same JSON structure.
3. Use professional legal terminology appropriate for {target_language}.
4. Ensure the translation is accurate, clear, and maintains the original legal meaning.
5. If a value is a number or a short code (like "high", "critical", "low"), keep it in English if that is standard for the target culture's legal tech, otherwise translate it accurately.
6. Return ONLY the valid JSON object. No markdown, no explanations.

Target Language: {target_language}
JSON to Translate:
{json_content}

Respond ONLY with valid JSON."""

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
        async with translation_semaphore:
            loop = asyncio.get_event_loop()
            try:
                # Add a timeout to the translation call
                translated = await asyncio.wait_for(
                    loop.run_in_executor(
                        None, 
                        lambda: GoogleTranslator(source='auto', target=target_lang).translate(text)
                    ),
                    timeout=15.0 # 15 seconds timeout per string
                )
            except asyncio.TimeoutError:
                logger.warning(f"Translation timed out for {target_lang}")
                return text
        
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
    """Translate a full analysis result into the target language using LLM (Fast & High Quality)."""
    if not analysis or target_lang_code == "en":
        return analysis
        
    target_language = SUPPORTED_LANGUAGES.get(target_lang_code, "Hindi")
    logger.info(f"Translating full analysis to {target_language} using LLM...")
    
    import json
    # Use LLM for translation - it's much faster than 100+ separate Google Translate calls
    # and handles legal nuances much better.
    try:
        # We only translate the main content areas to keep token count reasonable
        # but the prompt handles recursive translation of the whole JSON.
        llm = await router.run(
            task="translation",
            system=f"You are a professional legal translator specializing in {target_language}.",
            user=TRANSLATION_PROMPT.format(
                target_language=target_language,
                json_content=json.dumps(analysis, ensure_ascii=False)
            ),
            context_chunks=[], # Not needed for pure translation
            prefer_fast=True, # Use a faster model for translation
            require_json=True,
            temperature=0.1, # Low temperature for accurate translation
            max_tokens=4000,
            groq_model=settings.GROQ_MODEL_FAST
        )
        
        translated_json = parse_json_robustly(llm.text)
        if translated_json and isinstance(translated_json, dict):
            logger.info(f"LLM translation to {target_language} successful.")
            return translated_json
            
    except Exception as e:
        logger.error(f"LLM Translation failed: {e}. Falling back to individual string translation.")
    
    # Fallback to the slow recursive method if LLM fails
    import copy
    import asyncio
    translated = copy.deepcopy(analysis)
    
    tasks = []
    
    # Define a helper to recursively find and translate strings
    async def process_recursive(obj, key=None, parent=None):
        if isinstance(obj, str) and obj.strip() and len(obj) > 1:
            # Skip keys that shouldn't be translated
            if key in ["id", "_id", "status", "risk_level", "severity", "color", "risk_score", "score", "progress"]:
                return
            
            if len(obj) < 2:
                return

            async def t_task(o, k, p):
                try:
                    res = await translate_text(o, target_lang_code)
                    if p is not None:
                        p[k] = res
                except Exception as e:
                    logger.error(f"Error translating field {k}: {e}")

            tasks.append(t_task(obj, key, parent))
            
        elif isinstance(obj, list):
            for i, item in enumerate(obj):
                await process_recursive(item, i, obj)
        elif isinstance(obj, dict):
            for k, v in obj.items():
                await process_recursive(v, k, obj)

    await process_recursive(translated)

    if tasks:
        batch_size = 10
        for i in range(0, len(tasks), batch_size):
            batch = tasks[i:i+batch_size]
            await asyncio.gather(*batch)
                    
    return translated
