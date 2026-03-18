from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.models.product import Category
from app.schemas.product import CategoryResponse

router = APIRouter(prefix="/api/categories", tags=["카테고리"])


@router.get(
    "/",
    response_model=List[CategoryResponse],
    summary="카테고리 목록 조회",
)
async def list_categories(
    db: AsyncSession = Depends(get_db),
) -> List[CategoryResponse]:
    """전체 농산물 카테고리 목록을 반환합니다."""
    result = await db.execute(select(Category).order_by(Category.id))
    return result.scalars().all()
