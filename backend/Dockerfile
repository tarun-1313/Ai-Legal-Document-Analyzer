# =========================
# Stage 1: Build Dependencies
# =========================
FROM python:3.11-slim as builder

WORKDIR /app

# Install build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Upgrade pip
RUN pip install --upgrade pip

# Install Python dependencies
RUN pip install --user --no-cache-dir -r requirements.txt


# =========================
# Stage 2: Runtime
# =========================
FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    poppler-utils \
    libmagic1 \
    curl \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages
COPY --from=builder /root/.local /root/.local

ENV PATH=/root/.local/bin:$PATH

# Copy application
COPY . .

# Create required folders
RUN mkdir -p uploads chroma_data reports ml_models huggingface_cache && \
    chmod -R 755 uploads chroma_data reports ml_models huggingface_cache

# Environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV APP_ENV=production
ENV HF_HOME=/app/huggingface_cache
ENV CUDA_VISIBLE_DEVICES=""

# Render port
EXPOSE 10000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:10000/health || exit 1

# Start FastAPI
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "10000", "--log-level", "info"]