from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from datetime import date, timedelta

from app.database import get_db
from app.dependencies import get_current_user, require_farmer
from app.models.user import User
from app.models.ai import PriceSuggestion, DemandForecast
from app.models.product import Product
from app.ml.forecaster import DemandForecaster
from app.ml.price_optimizer import PriceOptimizer, SupplyData, PriceSuggestionResult
from app.schemas.ai import (
    PriceSuggestionResponse,
    DemandForecastResponse,
    PriceTrendResponse,
    PriceTrendPoint,
    DemandTrend,
)

router = APIRouter(prefix="/api/ai", tags=["AI 예측"])

# Module-level instances
_forecaster = DemandForecaster()
_optimizer = PriceOptimizer()


@router.get(
    "/demand-forecast",
    response_model=List[DemandForecastResponse],
    summary="수요 예측 조회",
)
async def get_demand_forecast(
    category_id: Optional[int] = Query(None, description="카테고리 ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list:
    """
    카테고리별 농산물 수요 예측 데이터를 반환합니다.
    DB에 데이터가 없으면 ML 모델로 더미 예측을 생성하여 반환합니다.
    """
    query = select(DemandForecast).order_by(DemandForecast.created_at.desc())
    if category_id is not None:
        query = query.where(DemandForecast.category_id == category_id)

    result = await db.execute(query.limit(50))
    forecasts = result.scalars().all()

    if forecasts:
        return forecasts

    # No DB data — generate dummy predictions from the forecaster
    category_name = f"category_{category_id}" if category_id else "전체"
    predictions = _forecaster.predict(category=category_name, periods=7)

    dummy_results = []
    today = date.today()
    for i, pred in enumerate(predictions):
        dummy_results.append(DemandForecastResponse(
            id=UUID("00000000-0000-0000-0000-" + f"{i:012d}"),
            category_id=category_id or 0,
            period_start=today + timedelta(days=i),
            period_end=today + timedelta(days=i + 1),
            predicted_demand=pred["yhat"],
            trend=DemandTrend.stable,
            confidence=0.7,
            created_at=today,
        ))
    return dummy_results


@router.get(
    "/price-suggestion",
    response_model=PriceSuggestionResponse,
    summary="AI 가격 제안 조회",
)
async def get_price_suggestion(
    product_id: UUID = Query(..., description="상품 ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PriceSuggestionResponse:
    """
    특정 상품에 대한 AI 기반 최적 가격 제안을 반환합니다.
    DB에 저장된 제안이 없으면 PriceOptimizer를 사용해 즉시 계산합니다.
    """
    prod_result = await db.execute(select(Product).where(Product.id == product_id))
    product = prod_result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="상품을 찾을 수 없습니다.")

    # Get latest suggestion for this product
    result = await db.execute(
        select(PriceSuggestion)
        .where(PriceSuggestion.product_id == product_id)
        .order_by(PriceSuggestion.created_at.desc())
        .limit(1)
    )
    suggestion = result.scalar_one_or_none()

    if suggestion is not None:
        return suggestion

    # No DB suggestion — calculate on-the-fly using PriceOptimizer
    dummy_forecast = _forecaster.predict(category="default", periods=7)
    supply = SupplyData(
        current_stock=product.stock,
        avg_daily_sales=max(1.0, product.stock / 30.0),
        competitor_prices=[float(product.price) * 0.95, float(product.price) * 1.05],
    )
    price_result: PriceSuggestionResult = _optimizer.suggest_price(
        product_id=product.id,
        current_price=product.price,
        demand_forecast=dummy_forecast,
        supply_data=supply,
    )

    # Persist the suggestion
    new_suggestion = PriceSuggestion(
        product_id=product.id,
        suggested_price=price_result.suggested_price,
        confidence=price_result.confidence,
        demand_level=price_result.demand_level,
        reasoning=price_result.reasoning,
    )
    db.add(new_suggestion)
    await db.flush()
    await db.refresh(new_suggestion)
    return new_suggestion


@router.get(
    "/price-trends",
    response_model=PriceTrendResponse,
    summary="가격 트렌드 조회",
)
async def get_price_trends(
    product_id: UUID = Query(..., description="상품 ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PriceTrendResponse:
    """
    특정 상품의 가격 트렌드와 향후 1주일 예측가를 반환합니다.
    """
    prod_result = await db.execute(select(Product).where(Product.id == product_id))
    product = prod_result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="상품을 찾을 수 없습니다.")

    # Get latest price suggestion for trend info
    sugg_result = await db.execute(
        select(PriceSuggestion)
        .where(PriceSuggestion.product_id == product_id)
        .order_by(PriceSuggestion.created_at.desc())
        .limit(1)
    )
    suggestion = sugg_result.scalar_one_or_none()

    trend = DemandTrend.stable
    forecast_next_week = None
    if suggestion:
        level = suggestion.demand_level.lower()
        if "high" in level or "상승" in level:
            trend = DemandTrend.increasing
        elif "low" in level or "하락" in level:
            trend = DemandTrend.decreasing
        forecast_next_week = suggestion.suggested_price

    # Generate data points from dummy/historical data instead of empty list
    today = date.today()
    current_price_float = float(product.price)
    data_points = []
    import random
    rng = random.Random(hash(str(product_id)))
    for i in range(14):
        d = today - timedelta(days=13 - i)
        variation = rng.uniform(-0.05, 0.05)
        price = Decimal(str(round(current_price_float * (1 + variation), 0)))
        data_points.append(PriceTrendPoint(
            date=d,
            price=price,
            volume=round(rng.uniform(10, 100), 1),
        ))

    return PriceTrendResponse(
        product_id=product.id,
        product_name=product.name,
        current_price=product.price,
        trend=trend,
        data_points=data_points,
        forecast_next_week=forecast_next_week,
    )


@router.post(
    "/train",
    summary="모델 학습 트리거 (농부 전용)",
)
async def train_models(
    farmer: User = Depends(require_farmer),
) -> dict:
    """수요 예측 모델 학습을 트리거합니다. 농부 계정만 사용 가능합니다."""
    import pandas as pd
    import numpy as np

    # Generate dummy training data
    today = pd.Timestamp.today().normalize()
    dates = pd.date_range(end=today, periods=90, freq="D")
    rng = np.random.default_rng(seed=42)

    categories = ["채소류", "과일류", "곡류"]
    rows = []
    for cat in categories:
        base = rng.uniform(80, 120)
        for d in dates:
            rows.append({
                "ds": d,
                "y": max(0, base + rng.normal(0, 10)),
                "category": cat,
            })

    df = pd.DataFrame(rows)

    try:
        _forecaster.train(df)
        return {"message": "모델 학습이 완료되었습니다.", "categories": categories}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"모델 학습 중 오류가 발생했습니다: {str(e)}",
        )
