from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta, timezone
from jose import jwt

from app.database import get_db
from app.config import settings
from app.dependencies import verify_firebase_token, get_current_user, require_farmer
from app.models.user import User, UserRole, FarmerProfile
from app.schemas.user import (
    UserCreate, UserLogin, UserResponse, UserUpdate, SocialLoginRequest, LoginResponse,
    FarmerProfileCreate, FarmerProfileResponse,
)


def _create_access_token(user: User) -> str:
    """사용자 정보로 JWT 액세스 토큰을 생성합니다."""
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.value,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

router = APIRouter(prefix="/api/auth", tags=["인증"])


@router.post(
    "/register",
    response_model=LoginResponse,
    status_code=status.HTTP_201_CREATED,
    summary="회원가입",
)
async def register(
    user_data: UserCreate,
    decoded_token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db),
) -> LoginResponse:
    """
    Firebase 토큰으로 인증 후 사용자를 등록합니다.

    - **email**: 사용자 이메일
    - **name**: 사용자 이름
    - **role**: 역할 (farmer / consumer)
    - **firebase_uid**: Firebase UID (토큰에서 검증됨)
    """
    # Verify firebase_uid matches the token
    token_uid = decoded_token.get("uid")
    if token_uid != user_data.firebase_uid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Firebase UID가 토큰과 일치하지 않습니다.",
        )

    # Check if user already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 등록된 이메일입니다.",
        )

    user = User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        phone=user_data.phone,
        address=user_data.address,
        firebase_uid=user_data.firebase_uid,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return LoginResponse(access=_create_access_token(user), user=UserResponse.model_validate(user))


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="로그인",
)
async def login(
    decoded_token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db),
) -> LoginResponse:
    """
    Firebase 토큰으로 로그인합니다. 토큰에서 UID를 추출해 사용자를 조회합니다.
    """
    firebase_uid = decoded_token.get("uid")
    result = await db.execute(select(User).where(User.firebase_uid == firebase_uid))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="등록되지 않은 사용자입니다. 먼저 회원가입을 진행해 주세요.",
        )
    return LoginResponse(access=_create_access_token(user), user=UserResponse.model_validate(user))


@router.get(
    "/me",
    response_model=UserResponse,
    summary="내 정보 조회",
)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """현재 인증된 사용자의 프로필 정보를 반환합니다."""
    return current_user


@router.post(
    "/social-login",
    response_model=LoginResponse,
    summary="소셜 로그인 (Google/Kakao)",
)
async def social_login(
    req: SocialLoginRequest,
    decoded_token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db),
) -> LoginResponse:
    """
    Firebase 소셜 로그인 토큰으로 인증합니다.
    사용자가 존재하면 로그인, 없으면 자동으로 회원가입합니다.
    """
    firebase_uid = decoded_token.get("uid")
    email = decoded_token.get("email", "")
    name = decoded_token.get("name", decoded_token.get("email", "사용자"))

    result = await db.execute(select(User).where(User.firebase_uid == firebase_uid))
    user = result.scalar_one_or_none()

    if user is not None:
        return LoginResponse(access=_create_access_token(user), user=UserResponse.model_validate(user))

    # Auto-register new social login user
    user = User(
        email=email,
        name=name,
        role=UserRole.consumer,
        firebase_uid=firebase_uid,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return LoginResponse(access=_create_access_token(user), user=UserResponse.model_validate(user))


@router.put(
    "/me",
    response_model=UserResponse,
    summary="내 정보 수정",
)
async def update_me(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """현재 인증된 사용자의 프로필 정보를 수정합니다."""
    for field, value in update_data.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    await db.flush()
    await db.refresh(current_user)
    return current_user


@router.post(
    "/farmer-profile",
    response_model=FarmerProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="농장 프로필 생성",
)
async def create_farmer_profile(
    profile_data: FarmerProfileCreate,
    farmer: User = Depends(require_farmer),
    db: AsyncSession = Depends(get_db),
) -> FarmerProfileResponse:
    """현재 농부 사용자의 농장 프로필을 생성합니다."""
    # Check if profile already exists
    result = await db.execute(
        select(FarmerProfile).where(FarmerProfile.user_id == farmer.id)
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 농장 프로필이 존재합니다.",
        )

    profile = FarmerProfile(
        user_id=farmer.id,
        **profile_data.model_dump(),
    )
    db.add(profile)
    await db.flush()
    await db.refresh(profile)
    return profile


@router.get(
    "/farmer-profile",
    response_model=FarmerProfileResponse,
    summary="내 농장 프로필 조회",
)
async def get_farmer_profile(
    farmer: User = Depends(require_farmer),
    db: AsyncSession = Depends(get_db),
) -> FarmerProfileResponse:
    """현재 농부 사용자의 농장 프로필을 반환합니다."""
    result = await db.execute(
        select(FarmerProfile).where(FarmerProfile.user_id == farmer.id)
    )
    profile = result.scalar_one_or_none()
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="농장 프로필이 존재하지 않습니다. 먼저 프로필을 생성해 주세요.",
        )
    return profile


class RoleUpdateRequest(BaseModel):
    role: UserRole


@router.put(
    "/role",
    response_model=UserResponse,
    summary="사용자 역할 변경",
)
async def update_role(
    req: RoleUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """사용자의 역할을 변경합니다 (consumer <-> farmer)."""
    current_user.role = req.role
    await db.flush()
    await db.refresh(current_user)
    return current_user
