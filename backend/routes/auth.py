from fastapi import Depends, HTTPException, Request
from bson import ObjectId
from typing import Optional
from auth_utils import decode_access_token

def get_current_user(request: Request):
    """Get current authenticated user from request using JWT."""
    # Try to get user from Authorization header first
    authorization = request.headers.get("Authorization")
    if authorization and authorization.startswith("Bearer "):
        try:
            token = authorization.split(" ")[1]
            payload = decode_access_token(token)
            if payload and payload.get("user_id"):
                return payload
        except Exception:
            pass
    
    # Fallback to query parameter (for development/legacy)
    user_id = request.query_params.get("user_id")
    if user_id:
        return {
            "user_id": user_id,
            "email": "dev@example.com",
            "role": "user"
        }
    
    raise HTTPException(status_code=401, detail="Authentication required")
