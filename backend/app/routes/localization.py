from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
from app.utils.auth_utils import get_current_user
from app.services.localization_service import translate_text, translate_analysis_result, simplify_text, SUPPORTED_LANGUAGES
from app.database import get_database
from bson import ObjectId

router = APIRouter(prefix="/api/localization", tags=["Localization"])

@router.get("/languages")
async def get_languages():
    """Get list of supported languages."""
    return SUPPORTED_LANGUAGES

@router.post("/translate")
async def translate_content(
    content: Dict[str, Any],
    target_lang: str,
    current_user=Depends(get_current_user)
):
    """Translate arbitrary JSON content or strings."""
    if not target_lang or target_lang == "en":
        return content
        
    if isinstance(content, str):
        translated_text = await translate_text(content, target_lang)
        return {"translated": translated_text}
        
    # If it's the analysis result structure
    if "summary" in content and "risk_analysis" in content:
        return await translate_analysis_result(content, target_lang)
        
    # Generic dict translation (recursive)
    async def translate_recursive(obj):
        if isinstance(obj, str):
            return await translate_text(obj, target_lang)
        elif isinstance(obj, list):
            import asyncio
            return await asyncio.gather(*[translate_recursive(item) for item in obj])
        elif isinstance(obj, dict):
            new_dict = {}
            for k, v in obj.items():
                new_dict[k] = await translate_recursive(v)
            return new_dict
        return obj
        
    return await translate_recursive(content)

@router.get("/document/{doc_id}/translate/{lang_code}")
async def get_translated_document(
    doc_id: str,
    lang_code: str,
    current_user=Depends(get_current_user)
):
    """Get document analysis translated into a specific language."""
    db = get_database()
    doc = await db.documents.find_one({"_id": ObjectId(doc_id), "user_id": current_user["id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    analysis = doc.get("analysis")
    if not analysis:
        raise HTTPException(status_code=400, detail="Document not yet analyzed")
        
    if lang_code == "en":
        return analysis
        
    # Check if translation already exists in DB to save costs/latency
    # For now, we'll generate on the fly but ideally we cache this in a 'translations' collection
    translated = await translate_analysis_result(analysis, lang_code)
    return translated

@router.post("/simplify")
async def simplify_legal_text(
    text: str,
    current_user=Depends(get_current_user)
):
    """Simplify legal text into easy language."""
    simplified = await simplify_text(text)
    return {"simplified": simplified}
