from __future__ import annotations

from app.services.auth_service import AuthService, DummyAuthService, FirebaseAuthService
from app.services.payment_service import PaymentService, DummyPaymentService, PortOnePaymentService
from app.services.storage_service import StorageService, DummyStorageService, S3StorageService
from app.services.notification_service import (
    NotificationPushService,
    DummyNotificationPushService,
    FCMNotificationService,
)


class ServiceContainer:
    """Lazy-initializing service container. Uses dummy services by default."""

    _auth: AuthService | None = None
    _payment: PaymentService | None = None
    _storage: StorageService | None = None
    _push: NotificationPushService | None = None

    @classmethod
    def auth(cls) -> AuthService:
        if cls._auth is None:
            from app.config import settings

            if settings.USE_REAL_SERVICES:
                cls._auth = FirebaseAuthService()
            else:
                cls._auth = DummyAuthService()
        return cls._auth

    @classmethod
    def payment(cls) -> PaymentService:
        if cls._payment is None:
            from app.config import settings

            if settings.USE_REAL_SERVICES:
                cls._payment = PortOnePaymentService(settings.PG_API_KEY, settings.PG_API_SECRET)
            else:
                cls._payment = DummyPaymentService()
        return cls._payment

    @classmethod
    def storage(cls) -> StorageService:
        if cls._storage is None:
            from app.config import settings

            if settings.USE_REAL_SERVICES:
                cls._storage = S3StorageService(
                    bucket=getattr(settings, "S3_BUCKET", "farmdirect-images"),
                    region=getattr(settings, "S3_REGION", "ap-northeast-2"),
                )
            else:
                cls._storage = DummyStorageService()
        return cls._storage

    @classmethod
    def push(cls) -> NotificationPushService:
        if cls._push is None:
            from app.config import settings

            if settings.USE_REAL_SERVICES:
                cls._push = FCMNotificationService()
            else:
                cls._push = DummyNotificationPushService()
        return cls._push

    @classmethod
    def reset(cls) -> None:
        """Reset all services (for testing)."""
        cls._auth = cls._payment = cls._storage = cls._push = None
