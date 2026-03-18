"""
수요 예측 모듈 (Demand Forecasting)

Prophet 모델을 사용하여 카테고리별 농산물 수요를 시계열 예측합니다.
"""

from __future__ import annotations

import logging
from typing import Any

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


class DemandForecaster:
    """
    Prophet 기반 수요 예측기.

    사용 예시::

        forecaster = DemandForecaster()
        forecaster.train(historical_df)
        predictions = forecaster.predict(category="채소류", periods=30)
    """

    def __init__(self) -> None:
        self._models: dict[str, Any] = {}
        self._is_fitted: dict[str, bool] = {}

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def train(self, data: pd.DataFrame, category_col: str = "category") -> None:
        """
        카테고리별로 Prophet 모델을 학습합니다.

        Parameters
        ----------
        data:
            학습 데이터. 반드시 ``ds`` (날짜), ``y`` (수요량), ``category`` 컬럼을 포함해야 합니다.
        category_col:
            카테고리 컬럼 이름 (기본값: ``"category"``).
        """
        try:
            from prophet import Prophet  # lazy import — optional dependency
        except ImportError:
            logger.warning("prophet 패키지가 설치되지 않았습니다. pip install prophet을 실행하세요.")
            return

        required_cols = {"ds", "y", category_col}
        missing = required_cols - set(data.columns)
        if missing:
            raise ValueError(f"데이터프레임에 필수 컬럼이 없습니다: {missing}")

        for category, group in data.groupby(category_col):
            category = str(category)
            logger.info("카테고리 '%s' 모델 학습 시작 (%d rows)", category, len(group))
            model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False,
                changepoint_prior_scale=0.05,
            )
            model.fit(group[["ds", "y"]].copy())
            self._models[category] = model
            self._is_fitted[category] = True
            logger.info("카테고리 '%s' 모델 학습 완료", category)

    def predict(self, category: str, periods: int = 30) -> list[dict]:
        """
        특정 카테고리의 수요를 예측합니다.

        Parameters
        ----------
        category:
            예측할 카테고리 이름.
        periods:
            예측할 미래 기간 (일 단위, 기본값: 30).

        Returns
        -------
        list[dict]
            ``[{"ds": date_str, "yhat": float, "yhat_lower": float, "yhat_upper": float}, ...]``
        """
        if category not in self._models:
            logger.warning("카테고리 '%s'에 대한 모델이 없습니다. 더미 예측값을 반환합니다.", category)
            return self._dummy_forecast(periods)

        model = self._models[category]
        future = model.make_future_dataframe(periods=periods, freq="D")
        forecast = model.predict(future)

        tail = forecast.tail(periods)
        return [
            {
                "ds": row["ds"].strftime("%Y-%m-%d"),
                "yhat": max(0.0, float(row["yhat"])),
                "yhat_lower": max(0.0, float(row["yhat_lower"])),
                "yhat_upper": max(0.0, float(row["yhat_upper"])),
            }
            for _, row in tail.iterrows()
        ]

    def is_fitted(self, category: str) -> bool:
        """해당 카테고리 모델이 학습되었는지 확인합니다."""
        return self._is_fitted.get(category, False)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _dummy_forecast(periods: int) -> list[dict]:
        """모델이 없을 때 반환하는 더미 예측 데이터."""
        today = pd.Timestamp.today().normalize()
        dates = pd.date_range(start=today + pd.Timedelta(days=1), periods=periods, freq="D")
        base = 100.0
        rng = np.random.default_rng(seed=42)
        noise = rng.normal(0, 5, size=periods)
        return [
            {
                "ds": d.strftime("%Y-%m-%d"),
                "yhat": max(0.0, base + noise[i]),
                "yhat_lower": max(0.0, base + noise[i] - 10),
                "yhat_upper": max(0.0, base + noise[i] + 10),
            }
            for i, d in enumerate(dates)
        ]
