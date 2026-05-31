"""
Document Models
Pydantic models for legal document upload, analysis results, and storage.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ClauseInfo(BaseModel):
    """A single detected clause with its classification and risk."""
    clause_type: str
    text: str
    confidence: float = 0.0
    risk_level: RiskLevel = RiskLevel.LOW
    explanation: Optional[str] = None
    page_number: Optional[int] = None


class ExecutiveSummary(BaseModel):
    """Dynamically extracted executive summary fields."""
    introduction: str = "Information not found in document"
    purpose: str = "Information not found in document"
    agreement_purpose: str = "Information not found in document"
    involved_parties: str = "Information not found in document"
    duration: str = "Information not found in document"
    payment_terms: str = "Information not found in document"
    termination_conditions: str = "Information not found in document"
    governing_law: str = "Information not found in document"
    liabilities: str = "Information not found in document"
    confidentiality: str = "Information not found in document"
    ownership: str = "Information not found in document"
    obligations: str = "Information not found in document"

class KeyPoint(BaseModel):
    """A specific legal insight or key point."""
    category: str
    point: str

class RiskAnalysis(BaseModel):
    """Detailed risk detection result."""
    type: str
    severity: RiskLevel
    clause: str
    reason: str

class ProsConsItem(BaseModel):
    """A single pro or con item."""
    title: str
    description: str

class RiskScorecard(BaseModel):
    """Granular risk metrics for the dashboard."""
    financial_score: float = 0.0
    legal_score: float = 0.0
    compliance_score: float = 0.0
    ownership_score: float = 0.0
    overall_score: float = 0.0

class RiskAttentionArea(BaseModel):
    """Specific area of the agreement that needs attention."""
    area: str
    severity: RiskLevel
    impact: str
    why_it_matters: str
    consequences: str

class PotentialLossArea(BaseModel):
    """Area where user might face losses."""
    area: str
    business_impact: str
    legal_impact: str
    financial_consequences: str

class AnalysisResult(BaseModel):
    """Full analysis output for a document."""
    summary: ExecutiveSummary = Field(default_factory=ExecutiveSummary)
    key_points: List[KeyPoint] = []
    risk_analysis: List[RiskAnalysis] = []
    risk_score: float = 0.0
    risk_level: RiskLevel = RiskLevel.LOW
    recommendations: List[str] = []
    
    # New Accessibility Fields
    pros: List[ProsConsItem] = []
    cons: List[ProsConsItem] = []
    hidden_risks: List[ProsConsItem] = []
    financial_concerns: List[ProsConsItem] = []
    easy_summary: Optional[ExecutiveSummary] = None
    
    # New Risk Intelligence Fields
    risk_scorecard: RiskScorecard = Field(default_factory=RiskScorecard)
    risk_attention_areas: List[RiskAttentionArea] = []
    potential_loss_areas: List[PotentialLossArea] = []
    safety_recommendations: List[str] = []
    careful_review_items: List[str] = []
    
    llm_provider: str = ""
    llm_model: str = ""
    llm_fallback_used: bool = False
    llm_routing_reason: str = ""
    llm_context_chunks: int = 0
    llm_context_chars: int = 0
    llm_context_tokens_est: int = 0
    llm_latency_ms: float = 0.0


class DocumentUpload(BaseModel):
    """Metadata sent with a document upload."""
    title: Optional[str] = None
    description: Optional[str] = None


class DocumentStatus(str, Enum):
    UPLOADED = "uploaded"
    EXTRACTING = "extracting"
    EMBEDDING = "embedding"
    INDEXING = "indexing"
    ANALYZING = "analyzing"
    COMPLETED = "completed"
    FAILED = "failed"


class DocumentResponse(BaseModel):
    """Document data returned to the client."""
    id: str
    user_id: str
    title: str
    filename: str
    file_size: int
    page_count: int = 0
    status: str = "uploaded"
    current_step: Optional[str] = None
    processing_progress: int = 0
    extracted_text: Optional[str] = None
    analysis: Optional[AnalysisResult] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class DocumentInDB(BaseModel):
    """Full document record as stored in MongoDB."""
    user_id: str
    title: str
    filename: str
    file_path: str
    file_size: int
    page_count: int = 0
    status: str = "uploaded"
    current_step: Optional[str] = None
    processing_progress: int = 0
    extracted_text: Optional[str] = None
    text_chunks: List[str] = []
    analysis: Optional[dict] = None
    clauses: List[dict] = []
    chroma_collection_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


class ChatMessage(BaseModel):
    """A single chat message."""
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ChatRequest(BaseModel):
    """Chat request from the user about a document."""
    document_id: str
    message: str
    target_lang: Optional[str] = "en"
    easy_mode: Optional[bool] = False


class ChatResponse(BaseModel):
    """Chat response from the AI."""
    response: str
    sources: List[str] = []
    llm_provider: str = ""
    llm_model: str = ""
    llm_fallback_used: bool = False


class SearchRequest(BaseModel):
    """Semantic search request."""
    document_id: str
    query: str
    top_k: int = 5


class SearchResult(BaseModel):
    """A single semantic search result."""
    text: str
    score: float
    metadata: dict = {}
