"""
RAG (Retrieval-Augmented Generation) Service
Implements the complete RAG pipeline using LangChain and ChromaDB:
1. Document chunking → 2. Embedding generation → 3. Vector storage → 4. Semantic retrieval

Architecture:
  User Query → Embed Query → ChromaDB Similarity Search → Top-K Chunks → LLM Context → Response
"""

import os
import anyio
from typing import List, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma

from app.config import settings

# ─── Global ChromaDB Client ──────────────────────────────────────
_chroma_client: Optional[chromadb.PersistentClient] = None
_embeddings: Optional[HuggingFaceEmbeddings] = None


def get_embeddings() -> HuggingFaceEmbeddings:
    """Lazy-initialize local HuggingFace embeddings model (No OpenAI)."""
    global _embeddings
    if _embeddings is None:
        print(f"Loading local embedding model: {settings.EMBEDDING_MODEL_NAME}...")
        _embeddings = HuggingFaceEmbeddings(
            model_name=settings.EMBEDDING_MODEL_NAME,
            model_kwargs={'device': settings.EMBEDDING_DEVICE},
            encode_kwargs={'normalize_embeddings': True}
        )
    return _embeddings


def get_chroma_client():
    """Get or create persistent ChromaDB client."""
    global _chroma_client
    if _chroma_client is None:
        os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
        # Disable anonymized telemetry to prevent errors and improve speed
        _chroma_client = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIR,
            settings=ChromaSettings(anonymized_telemetry=False)
        )
    return _chroma_client


def get_collection_count(document_id: str) -> int:
    """Check how many chunks are indexed for a document."""
    try:
        client = get_chroma_client()
        collection_name = f"doc_{document_id}"
        collection = client.get_collection(collection_name)
        return collection.count()
    except Exception:
        return 0


def get_text_splitter() -> RecursiveCharacterTextSplitter:
    """
    Create a semantic text splitter optimized for legal documents.
    Splits by sections, paragraphs, and sentence boundaries.
    """
    return RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
        is_separator_regex=False,
    )


async def index_document(document_id: str, text: str) -> List[str]:
    """
    Index a document into ChromaDB for semantic search using local embeddings.
    """
    # Step 1: Split text into chunks using improved semantic splitting
    splitter = get_text_splitter()
    chunks = splitter.split_text(text)
    
    if not chunks:
        return []
    
    # Step 2 & 3: Create vector store with LOCAL embeddings (Run in thread)
    collection_name = f"doc_{document_id}"
    embeddings = get_embeddings()
    client = get_chroma_client()
    
    metadatas = [
        {"document_id": document_id, "chunk_index": i, "source": f"chunk_{i}"}
        for i in range(len(chunks))
    ]
    
    await anyio.to_thread.run_sync(
        lambda: Chroma.from_texts(
            texts=chunks,
            embedding=embeddings,
            metadatas=metadatas,
            collection_name=collection_name,
            client=client, # Pass existing client to avoid "Instance already exists" error
        )
    )
    
    print(f"✅ Indexed {len(chunks)} chunks with local embeddings for document {document_id}")
    return chunks


async def semantic_search(
    document_id: str,
    query: str,
    top_k: int = 5
) -> List[dict]:
    """
    Perform semantic search on a document's indexed chunks using local embeddings.
    """
    collection_name = f"doc_{document_id}"
    embeddings = get_embeddings()
    client = get_chroma_client()
    
    # Perform similarity search with relevance scores (Run in thread)
    def _search():
        vectorstore = Chroma(
            collection_name=collection_name,
            embedding_function=embeddings,
            client=client, # Pass existing client
        )
        return vectorstore.similarity_search_with_relevance_scores(query, k=top_k)

    results = await anyio.to_thread.run_sync(_search)
    
    search_results = []
    for doc, score in results:
        search_results.append({
            "text": doc.page_content,
            "score": float(score),
            "metadata": doc.metadata,
        })
    
    return search_results


async def get_relevant_context(document_id: str, query: str, top_k: int = 5) -> List[str]:
    """
    Retrieve relevant context chunks for the RAG chatbot.
    This is a convenience wrapper around semantic_search that returns just the text.
    
    Args:
        document_id: The document to search.
        query: The user's question.
        top_k: Number of chunks to retrieve.
    
    Returns:
        List of relevant text chunks.
    """
    results = await semantic_search(document_id, query, top_k)
    return [r["text"] for r in results]


async def delete_document_index(document_id: str):
    """
    Remove a document's vectors from ChromaDB.
    Called when a user deletes a document.
    """
    try:
        client = get_chroma_client()
        collection_name = f"doc_{document_id}"
        client.delete_collection(collection_name)
        print(f"🗑️ Deleted ChromaDB collection: {collection_name}")
    except Exception as e:
        print(f"⚠️ Could not delete collection: {e}")
