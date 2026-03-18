from pydantic import BaseModel, ConfigDict
from typing import Optional, Any, Dict
from datetime import datetime
from uuid import UUID
from decimal import Decimal

from app.models.payment import PaymentStatus


class PaymentPrepareRequest(BaseModel):
    order_id: UUID
    method: str


class PaymentPrepareResponse(BaseModel):
    merchant_uid: str
    amount: Decimal
    order_id: UUID
    pg_provider: str
    pg_merchant_id: str


class PaymentConfirmRequest(BaseModel):
    imp_uid: str
    merchant_uid: str
    order_id: UUID


class PaymentConfirmResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    order_id: UUID
    method: str
    amount: Decimal
    status: PaymentStatus
    pg_transaction_id: Optional[str] = None
    created_at: datetime
