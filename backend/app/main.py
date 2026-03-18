import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, products, categories, cart, orders, payments, reviews, notifications, ai

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("FarmDirect API started")
    yield
    logger.info("FarmDirect API shutting down")


app = FastAPI(
    title=settings.APP_NAME,
    description="농산물 직거래 플랫폼 API - 농부와 소비자를 직접 연결합니다.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(categories.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(reviews.router)
app.include_router(notifications.router)
app.include_router(ai.router)


@app.get("/", tags=["헬스체크"], summary="서버 상태 확인")
async def health_check() -> dict:
    """서버가 정상 동작 중인지 확인합니다."""
    return {"status": "ok", "service": settings.APP_NAME, "version": "1.0.0"}
