"""
Document Routes
Handles document upload, listing, retrieval, deletion, and analysis triggering.
"""

import os
import uuid
import anyio
from datetime import datetime
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, BackgroundTasks
from fastapi.responses import FileResponse
from typing import Optional, List
from bson import ObjectId

from app.config import settings
from app.database import get_database
from app.utils.auth_utils import get_current_user
from app.services.ocr_service import extract_text_from_pdf, chunk_text
from app.services.rag_service import index_document, delete_document_index
from app.services.ai_service import generate_legal_summary, explain_clause, analyze_clause_risk
from app.services.clause_classifier import get_classifier
from app.services.report_service import generate_analysis_report
from app.utils.logging_utils import get_logger
from app.models.document import DocumentStatus

router = APIRouter(prefix="/api/documents", tags=["Documents"])
logger = get_logger("documents")


async def _process_document(doc_id: str, file_path: str):
    """
    Background task: extract text, classify clauses, generate summary,
    index into ChromaDB, and store results in MongoDB.
    
    PRODUCTION-READY PIPELINE:
    1. Extract Text & Metadata (Immediate update)
    2. Chunk & Embed
    3. Index to ChromaDB
    4. AI Analysis (LLM) - ONLY AFTER indexing is confirmed
    5. Finalize
    """
    db = get_database()
    logger.info(f"🔄 Starting production pipeline for document {doc_id}")
    
    try:
        # ─── STEP 1: Text Extraction ───
        await db.documents.update_one(
            {"_id": ObjectId(doc_id)},
            {"$set": {
                "status": DocumentStatus.EXTRACTING, 
                "current_step": "Extracting text and metadata...",
                "processing_progress": 10
            }}
        )
        text, page_count = await anyio.to_thread.run_sync(extract_text_from_pdf, file_path)
        
        if not text or len(text.strip()) < 50:
            raise ValueError("Document appears empty or unreadable.")

        # SAVE METADATA EARLY - Dashboard can now show basic info
        await db.documents.update_one(
            {"_id": ObjectId(doc_id)},
            {"$set": {
                "extracted_text": text[:2000], # Preview
                "page_count": page_count,
                "processing_progress": 30
            }}
        )
        logger.info(f"📄 Basic metadata saved for {doc_id}")

        # ─── STEP 2: Chunking & Embedding ───
        await db.documents.update_one(
            {"_id": ObjectId(doc_id)},
            {"$set": {
                "status": DocumentStatus.EMBEDDING, 
                "current_step": "Generating embeddings...",
                "processing_progress": 40
            }}
        )
        chunks = chunk_text(text)
        
        # ─── STEP 3: ChromaDB Indexing ───
        await db.documents.update_one(
            {"_id": ObjectId(doc_id)},
            {"$set": {
                "status": DocumentStatus.INDEXING, 
                "current_step": "Indexing into vector database...",
                "processing_progress": 60
            }}
        )
        await index_document(doc_id, text)
        logger.info(f"📦 Indexing complete for {doc_id}")

        # ─── STEP 4: AI Analysis & Classification ───
        await db.documents.update_one(
            {"_id": ObjectId(doc_id)},
            {"$set": {
                "status": DocumentStatus.ANALYZING, 
                "current_step": "AI deep analysis in progress...",
                "processing_progress": 80
            }}
        )
        
        # Initialize classifier singleton
        classifier_inst = get_classifier()

        # Run Analysis and Classification in Parallel (Since indexing is done)
        import asyncio
        summary_task = generate_legal_summary(doc_id)
        classification_task = anyio.to_thread.run_sync(classifier_inst.classify_document_chunks, chunks)

        ai_analysis, clauses = await asyncio.gather(summary_task, classification_task)

        # Merge risk scores
        risk_score, risk_level = classifier_inst.calculate_overall_risk(clauses)
        ai_risk_score = ai_analysis.get("risk_score", 0)
        final_risk_score = max(risk_score, ai_risk_score)
        final_risk_level = "critical" if final_risk_score >= 75 else "high" if final_risk_score >= 50 else "medium" if final_risk_score >= 25 else "low"
        
        ai_analysis["risk_score"] = final_risk_score
        ai_analysis["risk_level"] = final_risk_level

        # ─── STEP 5: Finalize ───
        await db.documents.update_one(
            {"_id": ObjectId(doc_id)},
            {"$set": {
                "status": DocumentStatus.COMPLETED,
                "current_step": "Analysis complete",
                "processing_progress": 100,
                "extracted_text": text,
                "text_chunks": chunks[:50],
                "analysis": ai_analysis,
                "clauses": clauses,
                "updated_at": datetime.utcnow(),
            }}
        )
        logger.info(f"✅ Production pipeline finished for {doc_id}")

    except Exception as e:
        logger.error(f"❌ Pipeline failed for {doc_id}: {e}", exc_info=True)
        await db.documents.update_one(
            {"_id": ObjectId(doc_id)},
            {"$set": {
                "status": DocumentStatus.FAILED, 
                "error_message": str(e),
                "current_step": "Error occurred"
            }}
        )


@router.post("/upload/")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    current_user=Depends(get_current_user),
):
    """Upload a PDF document and trigger background analysis."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    # Save file
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    unique_name = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_name)

    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File exceeds {settings.MAX_FILE_SIZE_MB}MB limit")

    with open(file_path, "wb") as f:
        f.write(content)

    # Create document record
    db = get_database()
    doc = {
        "user_id": current_user["id"],
        "title": title or file.filename,
        "filename": file.filename,
        "file_path": file_path,
        "file_size": len(content),
        "status": "uploaded",
        "created_at": datetime.utcnow(),
    }
    result = await db.documents.insert_one(doc)
    doc_id = str(result.inserted_id)

    # Start background processing
    background_tasks.add_task(_process_document, doc_id, file_path)

    return {"id": doc_id, "status": "uploaded", "message": "Document uploaded, analysis started."}


@router.get("/")
async def list_documents(current_user=Depends(get_current_user)):
    """List all documents for the current user."""
    db = get_database()
    cursor = db.documents.find(
        {"user_id": current_user["id"]},
        {"extracted_text": 0, "text_chunks": 0}
    ).sort("created_at", -1)

    docs = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        docs.append(doc)
    return docs


@router.get("/{doc_id}/status")
async def get_document_status(doc_id: str, current_user=Depends(get_current_user)):
    """Get the current processing status and progress of a document."""
    db = get_database()
    doc = await db.documents.find_one(
        {"_id": ObjectId(doc_id), "user_id": current_user["id"]},
        {"status": 1, "current_step": 1, "processing_progress": 1, "error_message": 1}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {
        "id": doc_id,
        "status": doc.get("status", "unknown"),
        "current_step": doc.get("current_step", ""),
        "progress": doc.get("processing_progress", 0),
        "error": doc.get("error_message")
    }


@router.post("/{doc_id}/retry")
async def retry_document_analysis(
    doc_id: str,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user)
):
    """Retry the analysis pipeline for a failed document."""
    db = get_database()
    doc = await db.documents.find_one({"_id": ObjectId(doc_id), "user_id": current_user["id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Update status to trigger fresh run
    await db.documents.update_one(
        {"_id": ObjectId(doc_id)},
        {"$set": {"status": DocumentStatus.UPLOADED, "error_message": None}}
    )
    
    background_tasks.add_task(_process_document, doc_id, doc["file_path"])
    return {"message": "Retry started"}


@router.delete("/{doc_id}")
async def delete_document(doc_id: str, current_user=Depends(get_current_user)):
    """Delete a document and its vector index."""
    db = get_database()
    doc = await db.documents.find_one({"_id": ObjectId(doc_id), "user_id": current_user["id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete file
    if os.path.exists(doc.get("file_path", "")):
        os.remove(doc["file_path"])

    # Delete from ChromaDB
    await delete_document_index(doc_id)

    # Delete from MongoDB
    await db.documents.delete_one({"_id": ObjectId(doc_id)})
    await db.chat_history.delete_many({"document_id": doc_id})

    return {"message": "Document deleted successfully"}


@router.get("/{doc_id}/report")
async def download_report(doc_id: str, current_user=Depends(get_current_user)):
    """Generate and download a PDF analysis report."""
    db = get_database()
    doc = await db.documents.find_one({"_id": ObjectId(doc_id), "user_id": current_user["id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.get("status") not in ["analyzed", "completed"]:
        raise HTTPException(status_code=400, detail="Document has not been analyzed yet")

    report_path = generate_analysis_report(
        document_title=doc.get("title", "Untitled"),
        analysis=doc.get("analysis", {}),
        clauses=doc.get("clauses", []),
    )

    return FileResponse(report_path, media_type="application/pdf", filename=f"report_{doc['title']}.pdf")


@router.post("/{doc_id}/explain-clause")
async def explain_clause_route(doc_id: str, clause_text: str = Form(...), current_user=Depends(get_current_user)):
    """Explain a specific clause in plain English."""
    explanation = await explain_clause(clause_text)
    return {"explanation": explanation}
