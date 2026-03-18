from __future__ import annotations

from abc import ABC, abstractmethod
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class NotificationPushService(ABC):
    @abstractmethod
    async def send_push(self, user_id: str, title: str, body: str, data: Optional[dict] = None) -> bool:
        """Send a push notification to a user."""
        ...


class DummyNotificationPushService(NotificationPushService):
    """Logs notifications instead of sending them."""

    async def send_push(self, user_id: str, title: str, body: str, data: Optional[dict] = None) -> bool:
        logger.info("[PUSH] To=%s: %s - %s", user_id, title, body)
        return True


class FCMNotificationService(NotificationPushService):
    """Production push via Firebase Cloud Messaging."""

    def __init__(self) -> None:
        import firebase_admin

        if not firebase_admin._apps:
            firebase_admin.initialize_app()

    async def send_push(self, user_id: str, title: str, body: str, data: Optional[dict] = None) -> bool:
        from firebase_admin import messaging

        message = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            data=data or {},
            topic=f"user_{user_id}",
        )
        try:
            messaging.send(message)
            return True
        except Exception:
            logger.exception("FCM 전송 실패: user_id=%s", user_id)
            return False
