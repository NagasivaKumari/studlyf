from fastapi import Depends, HTTPException
from bson import ObjectId
from typing import Optional

def get_current_user(request):
    """Get current authenticated user from request"""
    # Try to get user from Authorization header first
    authorization = request.headers.get("Authorization")
    if authorization:
        try:
            # Remove "Bearer " prefix
            token = authorization.replace("Bearer ", "")
            # For now, return a simple user object
            # In production, you should decode JWT token here
            return {
                "user_id": "temp_user_id",  # Replace with actual user_id from JWT
                "email": "temp@example.com",
                "institution_id": "temp_institution_id"
            }
        except:
            pass
    
    # Fallback to query parameter (for development)
    user_id = request.query_params.get("user_id")
    if user_id:
        return {
            "user_id": user_id,
            "email": "dev@example.com"
        }
    
    raise HTTPException(status_code=401, detail="Authentication required")
