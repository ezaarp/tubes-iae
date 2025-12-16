import os
from jose import jwt, JWTError
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

JWT_SECRET = os.getenv("JWT_SECRET", "a8f5e2d9c4b7a1e6f3d8c2b5a9e7f4d1c8b6a3e9f2d7c5b8a4e1f6d3c9b7a2e5")

security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Verify JWT token and return decoded payload"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except JWTError:
        raise HTTPException(status_code=403, detail="Invalid or expired token")

def require_role(*roles):
    """Decorator to require specific roles"""
    def decorator(credentials: HTTPAuthorizationCredentials = Security(security)):
        payload = verify_token(credentials)
        user_role = payload.get("role")
        
        if user_role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        return payload
    
    return decorator

def optional_auth(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Optional authentication - returns None if no token"""
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except JWTError:
        return None
