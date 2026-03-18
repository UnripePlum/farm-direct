import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Float, Numeric, DateTime, Date, ForeignKey, Enum, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class DemandTrend(str, enum.Enum):
    increasing = "increasing"
    stable = "stable"
    decreasing = "decreasing"


class PriceSuggestion(Base):
    __tablename__ = "price_suggestions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    suggested_price = Column(Numeric(12, 2), nullable=False)
    confidence = Column(Float, nullable=False)
    demand_level = Column(String(50), nullable=False)
    reasoning = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    product = relationship("Product", back_populates="price_suggestions")


class DemandForecast(Base):
    __tablename__ = "demand_forecasts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False, index=True)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    predicted_demand = Column(Float, nullable=False)
    trend = Column(Enum(DemandTrend), nullable=False, default=DemandTrend.stable)
    confidence = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    category = relationship("Category", back_populates="demand_forecasts")
