"""app/api/routes/auth.py — Auth endpoints (Supabase JWT verification and user management)"""
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from app.db.supabase import get_supabase
from typing import Optional

router = APIRouter()

class SignupRequest(BaseModel):
    email: str
    password: str
    optional_metadata: Optional[dict] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    access_token: str
    user: dict
    session: Optional[dict] = None


@router.post("/signup", response_model=AuthResponse)
async def signup(request: SignupRequest):
    """Sign up a new user and return JWT token"""
    try:
        db = get_supabase()
        
        # Create user in Supabase Auth
        auth_response = db.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {
                "data": request.optional_metadata or {}
            }
        })
        
        if auth_response.user:
            # Get the session token
            session = auth_response.session
            if session and session.access_token:
                return AuthResponse(
                    access_token=session.access_token,
                    user={
                        "id": auth_response.user.id,
                        "email": auth_response.user.email,
                        "created_at": auth_response.user.created_at
                    },
                    session={
                        "access_token": session.access_token,
                        "refresh_token": session.refresh_token,
                        "expires_at": session.expires_at
                    }
                )
            else:
                # User created but email confirmation required
                raise HTTPException(
                    status_code=202, 
                    detail="User created successfully. Please check your email to confirm your account."
                )
        else:
            raise HTTPException(status_code=400, detail="Failed to create user")
            
    except Exception as e:
        # Handle common Supabase errors
        error_msg = str(e).lower()
        if "user already registered" in error_msg:
            raise HTTPException(status_code=409, detail="User with this email already exists")
        elif "weak password" in error_msg:
            raise HTTPException(status_code=400, detail="Password is too weak")
        elif "invalid email" in error_msg:
            raise HTTPException(status_code=400, detail="Invalid email address")
        else:
            raise HTTPException(status_code=500, detail=f"Signup failed: {str(e)}")


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """Login user and return JWT token"""
    try:
        db = get_supabase()
        
        # Sign in user
        auth_response = db.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        if auth_response.user and auth_response.session:
            session = auth_response.session
            return AuthResponse(
                access_token=session.access_token,
                user={
                    "id": auth_response.user.id,
                    "email": auth_response.user.email,
                    "created_at": auth_response.user.created_at
                },
                session={
                    "access_token": session.access_token,
                    "refresh_token": session.refresh_token,
                    "expires_at": session.expires_at
                }
            )
        else:
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
    except Exception as e:
        # Handle common Supabase errors
        error_msg = str(e).lower()
        if "invalid login credentials" in error_msg:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        elif "email not confirmed" in error_msg:
            raise HTTPException(status_code=401, detail="Please confirm your email address first")
        else:
            raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")


@router.get("/me")
async def get_me(authorization: Optional[str] = Header(None)):
    """Get current user info from JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization token")
    
    token = authorization.split(" ")[1]
    
    try:
        db = get_supabase()
        user = db.auth.get_user(token)
        
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        
        return {
            "id": user.user.id,
            "email": user.user.email,
            "created_at": user.user.created_at,
            "last_sign_in_at": user.user.last_sign_in_at,
            "user_metadata": user.user.user_metadata
        }
        
    except Exception as e:
        error_msg = str(e).lower()
        if "invalid" in error_msg or "expired" in error_msg:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        else:
            raise HTTPException(status_code=500, detail=f"Failed to get user info: {str(e)}")


@router.post("/logout")
async def logout(authorization: Optional[str] = Header(None)):
    """Logout user (revoke token)"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization token")
    
    token = authorization.split(" ")[1]
    
    try:
        db = get_supabase()
        # Sign out the user
        db.auth.sign_out(token)
        return {"message": "Successfully logged out"}
        
    except Exception as e:
        # Even if sign out fails, we can return success
        # as the token will expire naturally
        return {"message": "Logged out (token will expire naturally)"}
