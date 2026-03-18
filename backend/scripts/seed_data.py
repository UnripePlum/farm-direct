"""
시드 데이터 및 ML 모델 학습 스크립트

사용법:
    cd backend
    python -m scripts.seed_data          # 시드 데이터 + 모델 학습
    python -m scripts.seed_data --seed   # 시드 데이터만
    python -m scripts.seed_data --train  # 모델 학습만
"""

from __future__ import annotations

import argparse
import sys
import os
import logging
from datetime import date, timedelta
from decimal import Decimal

import numpy as np
import pandas as pd

# Add parent to path so we can import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Historical agricultural price/demand dataset (synthetic but realistic)
# ---------------------------------------------------------------------------

CATEGORIES = [
    {"id": 1, "name": "과일", "icon_url": "🍎"},
    {"id": 2, "name": "채소", "icon_url": "🥬"},
    {"id": 3, "name": "곡류", "icon_url": "🌾"},
    {"id": 4, "name": "버섯류", "icon_url": "🍄"},
    {"id": 5, "name": "뿌리채소", "icon_url": "🥕"},
    {"id": 6, "name": "엽경채류", "icon_url": "🥗"},
]

PRODUCE_ITEMS = {
    "사과": {"category": "과일", "base_price": 3500, "seasonality": [0.8, 0.7, 0.6, 0.5, 0.5, 0.6, 0.7, 0.8, 1.2, 1.5, 1.3, 1.0]},
    "배추": {"category": "채소", "base_price": 2000, "seasonality": [0.6, 0.5, 0.7, 0.8, 0.9, 1.0, 0.8, 0.7, 1.0, 1.3, 1.5, 1.2]},
    "쌀": {"category": "곡류", "base_price": 55000, "seasonality": [1.0, 1.0, 1.0, 1.0, 0.9, 0.9, 0.8, 0.8, 1.2, 1.3, 1.1, 1.0]},
    "딸기": {"category": "과일", "base_price": 8000, "seasonality": [1.5, 1.4, 1.2, 0.8, 0.3, 0.2, 0.2, 0.3, 0.5, 0.7, 1.0, 1.3]},
    "대파": {"category": "채소", "base_price": 1500, "seasonality": [1.3, 1.2, 0.9, 0.7, 0.6, 0.6, 0.7, 0.8, 1.0, 1.1, 1.3, 1.4]},
    "감자": {"category": "뿌리채소", "base_price": 2500, "seasonality": [0.8, 0.7, 0.8, 0.9, 1.0, 1.3, 1.5, 1.2, 1.0, 0.9, 0.8, 0.8]},
    "표고버섯": {"category": "버섯류", "base_price": 6000, "seasonality": [1.0, 1.0, 1.1, 1.2, 1.0, 0.8, 0.7, 0.8, 1.1, 1.3, 1.2, 1.0]},
    "상추": {"category": "엽경채류", "base_price": 1800, "seasonality": [0.8, 0.9, 1.1, 1.2, 1.3, 1.0, 0.7, 0.6, 0.8, 1.0, 1.1, 0.9]},
    "포도": {"category": "과일", "base_price": 7000, "seasonality": [0.3, 0.3, 0.3, 0.4, 0.5, 0.7, 1.0, 1.5, 1.5, 1.2, 0.5, 0.3]},
    "당근": {"category": "뿌리채소", "base_price": 2000, "seasonality": [1.0, 1.0, 0.9, 0.8, 0.8, 0.9, 1.0, 1.0, 1.1, 1.2, 1.1, 1.0]},
}


def generate_historical_data(years: int = 3) -> pd.DataFrame:
    """과거 {years}년 치 일별 수요/가격 데이터를 생성합니다."""
    rng = np.random.default_rng(seed=42)
    rows = []
    start_date = date.today() - timedelta(days=365 * years)

    for day_offset in range(365 * years):
        current_date = start_date + timedelta(days=day_offset)
        month_idx = current_date.month - 1

        for produce_name, info in PRODUCE_ITEMS.items():
            seasonal_factor = info["seasonality"][month_idx]
            base_demand = 100 * seasonal_factor
            noise = rng.normal(0, 8)
            demand = max(5, base_demand + noise)

            price_noise = rng.normal(0, info["base_price"] * 0.05)
            price = max(100, info["base_price"] * seasonal_factor + price_noise)

            rows.append({
                "ds": current_date.isoformat(),
                "y": round(demand, 1),
                "price": round(price, 0),
                "category": info["category"],
                "produce": produce_name,
            })

    df = pd.DataFrame(rows)
    logger.info("생성된 데이터: %d rows (%d일 x %d 품목)", len(df), 365 * years, len(PRODUCE_ITEMS))
    return df


def save_seed_csv(df: pd.DataFrame, path: str = "data/historical_data.csv") -> None:
    """시드 데이터를 CSV로 저장합니다."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    df.to_csv(path, index=False)
    logger.info("시드 데이터 저장: %s (%d rows)", path, len(df))


def train_models(df: pd.DataFrame) -> None:
    """카테고리별 Prophet 모델을 학습합니다."""
    from app.ml.forecaster import DemandForecaster

    forecaster = DemandForecaster()
    forecaster.train(df, category_col="category")

    # Test predictions
    for category in df["category"].unique():
        predictions = forecaster.predict(category, periods=7)
        if predictions:
            avg_pred = sum(p["yhat"] for p in predictions) / len(predictions)
            logger.info("  카테고리 '%s' 7일 예측 평균: %.1f", category, avg_pred)
        else:
            logger.warning("  카테고리 '%s' 예측 실패", category)

    logger.info("모델 학습 완료: %d 카테고리", len(forecaster._models))


def main() -> None:
    parser = argparse.ArgumentParser(description="FarmDirect 시드 데이터 & ML 학습")
    parser.add_argument("--seed", action="store_true", help="시드 데이터만 생성")
    parser.add_argument("--train", action="store_true", help="ML 모델 학습만 실행")
    args = parser.parse_args()

    run_all = not args.seed and not args.train

    logger.info("=== FarmDirect 시드 데이터 스크립트 시작 ===")

    df = generate_historical_data(years=3)

    if run_all or args.seed:
        save_seed_csv(df)
        logger.info("카테고리 목록: %s", [c["name"] for c in CATEGORIES])
        logger.info("품목 목록: %s", list(PRODUCE_ITEMS.keys()))

    if run_all or args.train:
        train_models(df)

    logger.info("=== 완료 ===")


if __name__ == "__main__":
    main()
