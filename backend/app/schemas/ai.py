from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID
from decimal import Decimal

from app.models.ai import DemandTrend


class PriceSuggestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
    suggested_price: Decimal
    confidence: float
    demand_level: str
    reasoning: Optional[str] = None
    created_at: datetime


class DemandForecastResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    category_id: int
    period_start: date
    period_end: date
    predicted_demand: float
    trend: DemandTrend
    confidence: float
    created_at: datetime


class PriceTrendPoint(BaseModel):
    date: date
    price: Decimal
    volume: Optional[float] = None


class PriceTrendResponse(BaseModel):
    product_id: UUID
    product_name: str
    current_price: Decimal
    trend: DemandTrend
    data_points: List[PriceTrendPoint] = []
    forecast_next_week: Optional[Decimal] = None
