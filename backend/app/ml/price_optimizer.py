"""
가격 최적화 모듈 (Price Optimization)

수요 예측 및 공급 데이터를 기반으로 농산물의 최적 판매 가격을 제안합니다.
"""

from __future__ import annotations

import logging
import math
from dataclasses import dataclass
from decimal import Decimal
from typing import Any

logger = logging.getLogger(__name__)


@dataclass
class SupplyData:
    """공급 데이터 컨테이너."""

    current_stock: int
    avg_daily_sales: float
    competitor_prices: list[float]


@dataclass
class PriceSuggestionResult:
    """가격 제안 결과 컨테이너."""

    suggested_price: Decimal
    confidence: float          # 0.0 ~ 1.0
    demand_level: str          # "low" / "medium" / "high"
    reasoning: str


class PriceOptimizer:
    """
    공급-수요 기반 가격 최적화 엔진.

    알고리즘 개요
    -------------
    1. 수요 예측값으로 수요 지수를 계산합니다 (현재 평균 대비 증감률).
    2. 재고 소진 예상 일수로 공급 압력을 계산합니다.
    3. 경쟁사 가격 중앙값을 시장 기준가로 사용합니다.
    4. 수요 지수와 공급 압력을 결합하여 기준가 대비 조정률을 산출합니다.
    5. 최종 가격은 기준가의 ±30% 범위로 제한합니다.

    사용 예시::

        optimizer = PriceOptimizer()
        result = optimizer.suggest_price(
            product_id=uuid,
            current_price=Decimal("5000"),
            demand_forecast=[{"yhat": 120}, {"yhat": 130}],
            supply_data=SupplyData(stock=200, avg_daily_sales=15, competitor_prices=[4800, 5200]),
        )
    """

    # Price adjustment bounds
    MAX_INCREASE_RATIO = 0.30   # +30%
    MAX_DECREASE_RATIO = 0.30   # -30%

    def suggest_price(
        self,
        product_id: Any,
        current_price: Decimal,
        demand_forecast: list[dict],
        supply_data: SupplyData,
    ) -> PriceSuggestionResult:
        """
        수요 예측과 공급 데이터를 기반으로 최적 가격을 제안합니다.

        Parameters
        ----------
        product_id:
            상품 식별자 (로깅용).
        current_price:
            현재 상품 가격.
        demand_forecast:
            ``forecaster.predict()`` 반환값. ``yhat`` 필드를 사용합니다.
        supply_data:
            재고, 일 평균 판매량, 경쟁사 가격 데이터.

        Returns
        -------
        PriceSuggestionResult
        """
        demand_index = self._compute_demand_index(demand_forecast)
        supply_pressure = self._compute_supply_pressure(supply_data)
        market_price = self._compute_market_price(supply_data.competitor_prices, current_price)

        # Combined adjustment: demand pushes price up, surplus supply pushes down
        raw_adjustment = (demand_index - 1.0) * 0.5 - supply_pressure * 0.3
        clamped = max(-self.MAX_DECREASE_RATIO, min(self.MAX_INCREASE_RATIO, raw_adjustment))

        suggested = market_price * Decimal(str(1.0 + clamped))
        suggested = suggested.quantize(Decimal("1"))  # Round to whole number

        demand_level = self._classify_demand(demand_index)
        confidence = self._compute_confidence(demand_forecast, supply_data)
        reasoning = self._build_reasoning(
            demand_index=demand_index,
            supply_pressure=supply_pressure,
            market_price=market_price,
            clamped=clamped,
            demand_level=demand_level,
        )

        logger.info(
            "상품 %s 가격 제안: %s원 (신뢰도: %.2f, 수요: %s)",
            product_id, suggested, confidence, demand_level,
        )

        return PriceSuggestionResult(
            suggested_price=suggested,
            confidence=confidence,
            demand_level=demand_level,
            reasoning=reasoning,
        )

    # ------------------------------------------------------------------
    # Internal computation helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _compute_demand_index(forecast: list[dict]) -> float:
        """
        예측 수요의 평균을 계산하고 100을 기준값으로 정규화합니다.
        반환값 > 1.0 이면 수요 증가, < 1.0 이면 수요 감소.
        """
        if not forecast:
            return 1.0
        yhats = [f.get("yhat", 0.0) for f in forecast if f.get("yhat", 0.0) > 0]
        if not yhats:
            return 1.0
        avg = sum(yhats) / len(yhats)
        return avg / 100.0  # normalised against baseline of 100 units/day

    @staticmethod
    def _compute_supply_pressure(supply_data: SupplyData) -> float:
        """
        재고 소진 예상 일수로 공급 압력을 산출합니다.
        days_of_stock < 7 이면 희소 (압력 음수), > 30 이면 과잉 (압력 양수).
        반환 범위: -1.0 ~ +1.0.
        """
        if supply_data.avg_daily_sales <= 0:
            return 0.0
        days_of_stock = supply_data.current_stock / supply_data.avg_daily_sales
        # Sigmoid-like mapping centred at 14 days
        pressure = math.tanh((days_of_stock - 14) / 10)
        return pressure  # positive = oversupply, negative = undersupply

    @staticmethod
    def _compute_market_price(competitor_prices: list[float], current_price: Decimal) -> Decimal:
        """경쟁사 가격의 중앙값을 시장 기준가로 반환합니다."""
        if not competitor_prices:
            return current_price
        sorted_prices = sorted(competitor_prices)
        n = len(sorted_prices)
        mid = n // 2
        median = sorted_prices[mid] if n % 2 == 1 else (sorted_prices[mid - 1] + sorted_prices[mid]) / 2
        return Decimal(str(median))

    @staticmethod
    def _classify_demand(demand_index: float) -> str:
        if demand_index >= 1.2:
            return "high"
        if demand_index >= 0.8:
            return "medium"
        return "low"

    @staticmethod
    def _compute_confidence(forecast: list[dict], supply_data: SupplyData) -> float:
        """예측 구간 폭과 데이터 풍부도로 신뢰도를 산출합니다 (0~1)."""
        if not forecast:
            return 0.3

        # Narrow forecast interval → higher confidence
        intervals = [
            f.get("yhat_upper", 0) - f.get("yhat_lower", 0)
            for f in forecast
            if "yhat_upper" in f and "yhat_lower" in f
        ]
        avg_interval = sum(intervals) / len(intervals) if intervals else 50.0
        interval_score = max(0.0, 1.0 - avg_interval / 100.0)

        # More competitor price data → higher confidence
        comp_score = min(1.0, len(supply_data.competitor_prices) / 5.0)

        confidence = 0.6 * interval_score + 0.4 * comp_score
        return round(min(1.0, max(0.0, confidence)), 4)

    @staticmethod
    def _build_reasoning(
        demand_index: float,
        supply_pressure: float,
        market_price: Decimal,
        clamped: float,
        demand_level: str,
    ) -> str:
        demand_kr = {"high": "높음", "medium": "보통", "low": "낮음"}.get(demand_level, demand_level)
        direction = "인상" if clamped > 0 else ("인하" if clamped < 0 else "유지")
        pct = abs(clamped) * 100
        return (
            f"수요 지수: {demand_index:.2f} (수요 {demand_kr}), "
            f"공급 압력: {supply_pressure:+.2f}, "
            f"시장 기준가: {market_price}원 기준 {direction} {pct:.1f}% 적용."
        )
