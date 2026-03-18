from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from decimal import Decimal

from app.models.order import OrderStatus


class OrderItemCreate(BaseModel):
    product_id: UUID
    quantity: int


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    order_id: UUID
    product_id: Optional[UUID] = None
    quantity: int
    price_at_purchase: Decimal


class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    shipping_address: str
    shipping_name: str
    shipping_phone: str


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    status: OrderStatus
    total_price: Decimal
    shipping_address: str
    shipping_name: str
    shipping_phone: str
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []


class CartItemCreate(BaseModel):
    product_id: UUID
    quantity: int = 1


class CartItemUpdate(BaseModel):
    quantity: int


class CartItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    product_id: UUID
    quantity: int
