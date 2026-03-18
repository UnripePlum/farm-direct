from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID

from app.models.notification import NotificationType


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    type: NotificationType
    title: str
    message: str
    is_read: bool
    created_at: datetime
