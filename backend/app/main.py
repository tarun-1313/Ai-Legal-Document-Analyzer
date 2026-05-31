"""
FastAPI Main Application
Entry point for the AI Legal Document Analyzer backend.
"""

import os

# Force CPU mode (Render has no GPU)
os.environ["CUDA_VISIBLE_DEVICES"] = ""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time

from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.services.rag_service import get_embeddings

from app.routes import auth, documents, chatbot, analytics, localization

from app.utils.logging_utils import setup_logging, get_logger

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# =====================================================
# Logging Setup
# =====================================================
setup_logging()
logger = get_logger("main")


# =====================================================
# Rate Limiter
# =====================================================
limiter = Limiter(key_func=get_remote_address)


# =====================================================
# App Lifespan
# =====================================================
@asynccontextmanager
async def lifespan(app: FastAPI):

    logger.info("Starting application startup sequence...")

    try:
        # Create required directories
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)

        logger.info("Directories created successfully")

        # MongoDB connection
        try:
            await connect_to_mongo()
            logger.info("MongoDB connected successfully")

        except Exception as mongo_error:
            logger.error(
                f"MongoDB connection failed: {mongo_error}"
            )

        # ==========================
        # PRELOAD EMBEDDING MODEL
        # ==========================
        try:
            logger.info("Loading embedding model...")

            get_embeddings()

            logger.info(
                "Embedding model loaded successfully"
            )

        except Exception as embedding_error:
            logger.error(
                f"Embedding model loading failed: {embedding_error}",
                exc_info=True
            )

        logger.info(
            f"{settings.APP_NAME} "
            f"v{settings.APP_VERSION} started successfully"
        )

    except Exception as e:
        logger.error(
            f"Startup error: {e}",
            exc_info=True
        )

    yield

    logger.info("Shutting down application...")

    try:
        await close_mongo_connection()

    except Exception as e:
        logger.error(
            f"Shutdown error: {e}"
        )

# =====================================================
# FastAPI App
# =====================================================
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered legal document analysis platform",
    lifespan=lifespan,
)


# =====================================================
# Rate Limiter Configuration
# =====================================================
app.state.limiter = limiter

app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler
)


# =====================================================
# Request Logging Middleware
# =====================================================
@app.middleware("http")
async def log_requests(request: Request, call_next):

    start_time = time.time()

    response = await call_next(request)

    process_time = (
        (time.time() - start_time) * 1000
    )

    logger.info(
        f"{request.method} "
        f"{request.url.path} "
        f"- {response.status_code} "
        f"({process_time:.2f}ms)"
    )

    return response


# =====================================================
# Security Headers Middleware
# =====================================================
@app.middleware("http")
async def add_security_headers(request: Request, call_next):

    response = await call_next(request)

    response.headers[
        "X-Content-Type-Options"
    ] = "nosniff"

    response.headers[
        "X-Frame-Options"
    ] = "DENY"

    response.headers[
        "X-XSS-Protection"
    ] = "1; mode=block"

    return response


# =====================================================
# Global Exception Handler
# =====================================================
@app.exception_handler(Exception)
async def global_exception_handler(
    request: Request,
    exc: Exception
):

    logger.error(
        f"Unhandled error: {str(exc)}",
        exc_info=True
    )

    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error"
        },
    )


# =====================================================
# CORS Middleware
# =====================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://ai-legal-document-analyzer-six.vercel.app",
        "http://localhost:5173",
        "https://ai-legal-document-analyzer-4awrdqokx.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================
# ROUTES
# =====================================================

# TEMPORARILY DISABLED ROUTES
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(chatbot.router)
app.include_router(analytics.router)
app.include_router(localization.router)
# =====================================================
# Root Endpoint
# =====================================================
@app.get("/")
async def root():

    return {
        "status": "running",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION
    }


# =====================================================
# Health Endpoint
# =====================================================
@app.get("/health")
async def health_check():

    return {
        "status": "healthy"
    }
