from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID

from app.models.user import UserRole


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    role: UserRole = UserRole.consumer
    phone: Optional[str] = None
    address: Optional[str] = None
    firebase_uid: str


class UserLogin(BaseModel):
    firebase_token: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    name: str
    role: UserRole
    phone: Optional[str] = None
    address: Optional[str] = None
    firebase_uid: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class LoginResponse(BaseModel):
    """로그인 응답 (사용자 정보 + 액세스 토큰)"""
    access: str
    user: "UserResponse"


class SocialLoginRequest(BaseModel):
    """소셜 로그인 요청 (Firebase ID 토큰)"""
    provider: str  # "google" | "kakao"
    token: str  # Firebase ID token from client


class FarmerProfileCreate(BaseModel):
    farm_name: str
    farm_location: Optional[str] = None
    description: Optional[str] = None
    photo_url: Optional[str] = None


class FarmerProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    farm_name: str
    farm_location: Optional[str] = None
    description: Optional[str] = None
    photo_url: Optional[str] = None
    created_at: datetime
