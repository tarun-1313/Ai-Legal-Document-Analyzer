"""
Chatbot & Search Routes
Handles the RAG-based chatbot and semantic search endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime

from app.database import get_database
from app.utils.auth_utils import get_current_user
from app.models.document import ChatRequest, ChatResponse, SearchRequest, SearchResult
from app.services.rag_service import get_relevant_context, semantic_search
from app.services.ai_service import chat_with_document_meta
from app.utils.logging_utils import get_logger

router = APIRouter(prefix="/api/chat", tags=["Chatbot & Search"])
logger = get_logger("chatbot")


def _fallback_context_from_document(doc: dict) -> list[str]:
    chunks = doc.get("text_chunks")
    if isinstance(chunks, list) and chunks:
        return [str(c) for c in chunks[:5] if c]
    extracted = doc.get("extracted_text")
    if isinstance(extracted, str) and extracted.strip():
        text = extracted.strip()
        max_total = 6000
        max_chunk = 1200
        text = text[:max_total]
        return [text[i : i + max_chunk] for i in range(0, len(text), max_chunk)][:5]
    return []


@router.post("/ask", response_model=ChatResponse)
async def ask_question(request: ChatRequest, current_user=Depends(get_current_user)):
    """
    Ask a question about an uploaded document.
    
    RAG Pipeline:
    1. Retrieve relevant chunks from ChromaDB
    2. Build context from retrieved chunks
    3. Send context + question to OpenAI
    4. Save chat history to MongoDB
    5. Return response
    """
    db = get_database()

    # Verify document belongs to user
    try:
        doc_oid = ObjectId(request.document_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid document_id")

    doc = await db.documents.find_one({"_id": doc_oid, "user_id": current_user["id"]})
    if not doc:
        return ChatResponse(response="Document not found.", sources=[])

    # Step 1: Retrieve relevant context (RAG)
    context_chunks = []
    try:
        context_chunks = await get_relevant_context(request.document_id, request.message)
    except Exception as e:
        logger.warning(f"RAG retrieval failed for document {request.document_id}: {e}", exc_info=True)

    if not isinstance(context_chunks, list) or not context_chunks:
        context_chunks = _fallback_context_from_document(doc)

    if not context_chunks:
        status = str(doc.get("status") or "unknown")
        step = str(doc.get("current_step") or "").strip()
        hint = f" ({step})" if step else ""
        return ChatResponse(
            response=f"That document is not ready for chat yet. Current status: {status}{hint}. Please wait for analysis to finish, then try again.",
            sources=[],
        )

    # Step 2: Get chat history for context continuity
    history_cursor = db.chat_history.find(
        {"document_id": request.document_id, "user_id": current_user["id"]}
    ).sort("timestamp", -1).limit(10)
    chat_history = []
    async for msg in history_cursor:
        chat_history.append({"role": msg["role"], "content": msg["content"]})
    chat_history.reverse()

    # Step 3: Generate response via OpenAI
    llm_provider = ""
    llm_model = ""
    llm_fallback_used = False
    try:
        resp = await chat_with_document_meta(
            query=request.message,
            context_chunks=context_chunks,
            chat_history=chat_history,
            target_lang=request.target_lang,
            easy_mode=request.easy_mode,
        )
        response_text = resp.get("response", "")
        llm_provider = resp.get("llm_provider", "")
        llm_model = resp.get("llm_model", "")
        llm_fallback_used = bool(resp.get("llm_fallback_used", False))
    except Exception as e:
        logger.error(f"Chat generation failed for document {request.document_id}: {e}", exc_info=True)
        response_text = "I'm sorry, I couldn't process your question right now. Please try again."

    # Step 4: Save to chat history
    now = datetime.utcnow()
    await db.chat_history.insert_many([
        {
            "document_id": request.document_id,
            "user_id": current_user["id"],
            "role": "user",
            "content": request.message,
            "timestamp": now,
        },
        {
            "document_id": request.document_id,
            "user_id": current_user["id"],
            "role": "assistant",
            "content": response_text,
            "timestamp": now,
        },
    ])

    return ChatResponse(
        response=response_text,
        sources=[c[:200] for c in context_chunks[:3]],
        llm_provider=llm_provider,
        llm_model=llm_model,
        llm_fallback_used=llm_fallback_used,
    )


@router.post("/search")
async def search_document(request: SearchRequest, current_user=Depends(get_current_user)):
    """Perform semantic search within a document."""
    results = await semantic_search(request.document_id, request.query, request.top_k)
    return {"results": results}


@router.get("/history/{document_id}")
async def get_chat_history(document_id: str, current_user=Depends(get_current_user)):
    """Get chat history for a document."""
    db = get_database()
    cursor = db.chat_history.find(
        {"document_id": document_id, "user_id": current_user["id"]}
    ).sort("timestamp", 1)

    messages = []
    async for msg in cursor:
        messages.append({
            "role": msg["role"],
            "content": msg["content"],
            "timestamp": msg["timestamp"].isoformat(),
        })
    return {"messages": messages}
