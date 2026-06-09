# ⚖️ AI Legal Document Analyzer

An advanced AI-powered legal document analysis platform that simplifies complex contracts, identifies risks, enables multilingual legal understanding, and provides intelligent conversational assistance using Retrieval-Augmented Generation (RAG).

---

# 🚀 Features

## 📄 Smart Legal Document Analysis

* Upload legal agreements and contracts in PDF format
* AI-powered clause extraction and legal classification
* Automatic legal risk detection
* Contract summarization with simplified explanations
* Clause-by-clause intelligent breakdown

---

## 🤖 AI-Powered Legal Chatbot

* Ask questions directly about uploaded documents
* Context-aware conversational AI
* Retrieval-Augmented Generation (RAG) support
* Semantic document search using vector embeddings
* Multilingual AI responses

---

## 🌐 Multilingual Legal Accessibility

* Translate legal analysis into regional languages
* Simplified “Easy Mode” explanations
* Legal terms converted into understandable language
* Designed for non-technical and non-legal users

---

## 📊 Advanced Analytics Dashboard

* Clause distribution analysis
* Risk scoring visualization
* Legal intelligence insights
* Contract metadata tracking
* AI confidence scoring

---

## 🔐 Authentication & Security

* JWT-based authentication system
* Secure API routes
* Protected document access
* User-specific document management

---

# 🧠 AI & ML Technologies Used

## NLP & Embeddings

* Sentence Transformers
* HuggingFace Transformers
* LegalBERT
* Semantic Embeddings

## LLM Providers

* Groq API
* Gemini API

## Vector Database

* ChromaDB

## OCR & Parsing

* PDF extraction
* OCR support

---

# 🏗️ Tech Stack

## Frontend

* React.js
* Tailwind CSS
* Framer Motion
* Axios
* React Router
* i18next

## Backend

* FastAPI
* Python
* Pydantic
* Uvicorn

## Database

* MongoDB Atlas
* ChromaDB

## AI/ML

* HuggingFace Transformers
* Sentence Transformers
* LangChain

## Deployment

* Render
* Docker

---

# 📂 Project Structure

```bash
AI-Legal-Document-Analyzer/
│
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── models/
│   │   ├── database/
│   │   ├── utils/
│   │   └── main.py
│   │
│   ├── uploads/
│   ├── chroma_data/
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

# ⚙️ Installation Guide

## 1️⃣ Clone Repository

```bash
git clone https://github.com/tarun-1313/Ai-Legal-Document-Analyzer.git
cd Ai-Legal-Document-Analyzer
```

---

# 🔧 Backend Setup

## 2️⃣ Create Virtual Environment

```bash
python -m venv venv
```

### Windows

```bash
venv\Scripts\activate
```

### Linux/Mac

```bash
source venv/bin/activate
```

---

## 3️⃣ Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 4️⃣ Configure Environment Variables

Create `.env` file inside backend folder:

```env
# MongoDB
MONGODB_URL=your_mongodb_connection
MONGODB_DB_NAME=legal_analyzer

# JWT
JWT_SECRET_KEY=your_secret_key

# Groq
GROQ_API_KEY=your_groq_api_key

# Gemini
GEMINI_API_KEY=your_gemini_api_key

# Embeddings
EMBEDDING_MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2

# ChromaDB
CHROMA_PERSIST_DIR=./chroma_data
```

---

## 5️⃣ Start Backend

```bash
uvicorn app.main:app --reload
```

Backend runs on:

```bash
http://localhost:8000
```

Swagger Docs:

```bash
http://localhost:8000/docs
```

---

# 🎨 Frontend Setup

## 6️⃣ Install Frontend Dependencies

```bash
cd frontend
npm install
```

---

## 7️⃣ Start Frontend

```bash
npm run dev
```

Frontend runs on:

```bash
http://localhost:5173
```

---

# 🐳 Docker Deployment

## Build Docker Container

```bash
docker build -t legal-ai .
```

## Run Container

```bash
docker run -p 8000:8000 legal-ai
```

---

# ☁️ Render Deployment

## Backend Start Command

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## Root Directory

```bash
backend
```

---

# 🔍 API Endpoints

## Authentication

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

---

## Documents

```http
POST   /api/documents/upload
GET    /api/documents/
GET    /api/documents/{doc_id}/status
DELETE /api/documents/{doc_id}
GET    /api/documents/{doc_id}/report
```

---

## Chatbot

```http
POST /api/chat/ask
```

---

# 📈 Workflow

```text
User Uploads Document
        ↓
PDF/OCR Extraction
        ↓
Clause Classification
        ↓
Risk Analysis
        ↓
Embedding Generation
        ↓
Vector Storage (ChromaDB)
        ↓
AI Chat & Semantic Search
```

---

# 🧪 Future Improvements

* Real-time collaborative contract review
* AI-generated legal suggestions
* Voice-based legal assistant
* Support for DOCX & scanned documents
* Fine-tuned legal LLMs
* Cloud vector database support
* Advanced compliance analytics

---

# 👨‍💻 Author

## Tarun Chaudhari

AI & Full Stack Developer

GitHub:
https://github.com/tarun-1313

---

# 📜 License

This project is developed for educational, research, and portfolio purposes.

---

# ⭐ Support

If you like this project:

* Star the repository
* Fork the project
* Share feedback
* Contribute improvements

---
