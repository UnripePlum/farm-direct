from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from typing import List
from uuid import UUID

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.notification import Notification, NotificationType
from app.schemas.notification import NotificationResponse

router = APIRouter(prefix="/api/notifications", tags=["알림"])


async def create_notification(
    db: AsyncSession,
    user_id: UUID,
    notification_type: str,
    title: str,
    message: str,
) -> Notification:
    """알림을 생성하는 헬퍼 함수. 다른 라우터에서 호출할 수 있습니다."""
    notification = Notification(
        user_id=user_id,
        type=NotificationType(notification_type),
        title=title,
        message=message,
    )
    db.add(notification)
    await db.flush()
    await db.refresh(notification)
    return notification


class NotificationCreate(BaseModel):
    user_id: UUID
    type: NotificationType
    title: str
    message: str


@router.post(
    "/",
    response_model=NotificationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="알림 생성 (내부 서비스용)",
)
async def create_notification_endpoint(
    data: NotificationCreate,
    db: AsyncSession = Depends(get_db),
) -> NotificationResponse:
    """알림을 생성합니다. 내부 서비스에서 호출하는 용도입니다."""
    notification = await create_notification(
        db=db,
        user_id=data.user_id,
        notification_type=data.type.value,
        title=data.title,
        message=data.message,
    )
    return notification


@router.get(
    "/unread-count",
    summary="읽지 않은 알림 수 조회",
)
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """현재 사용자의 읽지 않은 알림 수를 반환합니다."""
    result = await db.execute(
        select(func.count()).select_from(
            select(Notification)
            .where(
                Notification.user_id == current_user.id,
                Notification.is_read == False,  # noqa: E712
            )
            .subquery()
        )
    )
    count = result.scalar_one()
    return {"count": count}


@router.put(
    "/mark-all-read",
    summary="모든 알림 읽음 처리",
)
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """현재 사용자의 모든 알림을 읽음 상태로 변경합니다."""
    await db.execute(
        update(Notification)
        .where(
            Notification.user_id == current_user.id,
            Notification.is_read == False,  # noqa: E712
        )
        .values(is_read=True)
    )
    await db.flush()
    return {"message": "모든 알림이 읽음 처리되었습니다."}


@router.get(
    "/",
    response_model=List[NotificationResponse],
    summary="알림 목록 조회",
)
async def list_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[NotificationResponse]:
    """현재 사용자의 알림 목록을 최신순으로 반환합니다."""
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
    )
    return result.scalars().all()


@router.put(
    "/{notification_id}/read",
    response_model=NotificationResponse,
    summary="알림 읽음 처리",
)
async def mark_as_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> NotificationResponse:
    """특정 알림을 읽음 상태로 변경합니다."""
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
    )
    notification = result.scalar_one_or_none()

    if notification is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="알림을 찾을 수 없습니다.")

    notification.is_read = True
    await db.flush()
    await db.refresh(notification)
    return notification
