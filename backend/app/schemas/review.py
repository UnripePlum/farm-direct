from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class ReviewCreate(BaseModel):
    product_id: UUID
    order_id: Optional[UUID] = None
    rating: int = Field(..., ge=1, le=5)
    text: Optional[str] = None
    photos: List[str] = []


class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    product_id: UUID
    order_id: Optional[UUID] = None
    rating: int
    text: Optional[str] = None
    photos: List[str] = []
    created_at: datetime
