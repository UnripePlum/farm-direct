from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User, UserRole
from app.services.container import ServiceContainer

bearer_scheme = HTTPBearer()


async def verify_firebase_token(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """Firebase ID 토큰을 검증하고 디코딩된 토큰 정보를 반환합니다."""
    token = credentials.credentials
    try:
        return await ServiceContainer.auth().verify_token(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"토큰 검증 실패: {str(exc)}",
        )


async def get_current_user(
    decoded_token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db),
) -> User:
    """현재 인증된 사용자를 데이터베이스에서 조회합니다."""
    firebase_uid = decoded_token.get("uid")
    if not firebase_uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="토큰에서 사용자 UID를 가져올 수 없습니다.",
        )

    result = await db.execute(select(User).where(User.firebase_uid == firebase_uid))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다. 먼저 회원가입을 진행해 주세요.",
        )

    return user


async def require_farmer(
    current_user: User = Depends(get_current_user),
) -> User:
    """현재 사용자가 농부(farmer) 역할인지 확인합니다."""
    if current_user.role != UserRole.farmer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="농부 계정만 이 기능을 사용할 수 있습니다.",
        )
    return current_user
