"""
Authentication Routes
Handles user registration, login, and profile retrieval with JWT tokens.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime

from app.database import get_database
from app.models.user import UserCreate, UserLogin, UserResponse, Token
from app.utils.auth_utils import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """
    Register a new user.
    1. Check if email already exists
    2. Hash the password
    3. Insert into MongoDB
    4. Return JWT token
    """
    db = get_database()

    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_doc = {
        "name": user_data.name,
        "email": user_data.email,
        "hashed_password": hash_password(user_data.password),
        "created_at": datetime.utcnow(),
        "is_active": True,
    }

    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    token = create_access_token(data={"sub": user_data.email, "user_id": user_id})

    return Token(
        access_token=token,
        user=UserResponse(
            id=user_id,
            name=user_data.name,
            email=user_data.email,
            created_at=user_doc["created_at"],
        ),
    )


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """
    Authenticate user and return JWT token.
    """
    db = get_database()

    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = str(user["_id"])
    token = create_access_token(data={"sub": user["email"], "user_id": user_id})

    doc_count = await db.documents.count_documents({"user_id": user_id})

    return Token(
        access_token=token,
        user=UserResponse(
            id=user_id,
            name=user["name"],
            email=user["email"],
            created_at=user["created_at"],
            documents_count=doc_count,
        ),
    )


@router.get("/me", response_model=UserResponse)
async def get_profile(current_user=Depends(get_current_user)):
    """Get the current authenticated user's profile."""
    db = get_database()
    doc_count = await db.documents.count_documents({"user_id": current_user["id"]})
    return UserResponse(
        id=current_user["id"],
        name=current_user["name"],
        email=current_user["email"],
        created_at=current_user["created_at"],
        documents_count=doc_count,
    )
