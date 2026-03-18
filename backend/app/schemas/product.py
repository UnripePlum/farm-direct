from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from decimal import Decimal


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    icon_url: Optional[str] = None


class ProductCreate(BaseModel):
    category_id: Optional[int] = None
    name: str
    description: Optional[str] = None
    price: Decimal
    photos: List[str] = []
    stock: int = 0
    region: Optional[str] = None


class ProductUpdate(BaseModel):
    category_id: Optional[int] = None
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    photos: Optional[List[str]] = None
    stock: Optional[int] = None
    region: Optional[str] = None
    is_active: Optional[bool] = None


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    farmer_id: UUID
    category_id: Optional[int] = None
    name: str
    description: Optional[str] = None
    price: Decimal
    ai_suggested_price: Optional[Decimal] = None
    photos: List[str] = []
    stock: int
    region: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryResponse] = None


class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    page: int
    page_size: int
