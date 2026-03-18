from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional
from uuid import UUID

from app.database import get_db
from app.dependencies import get_current_user, require_farmer
from app.models.user import User
from app.models.product import Product
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductListResponse,
)

router = APIRouter(prefix="/api/products", tags=["상품"])


@router.get(
    "/",
    response_model=ProductListResponse,
    summary="상품 목록 조회",
)
async def list_products(
    page: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(20, ge=1, le=100, description="페이지 크기"),
    category_id: Optional[int] = Query(None, description="카테고리 필터"),
    region: Optional[str] = Query(None, description="지역 필터"),
    min_price: Optional[float] = Query(None, description="최소 가격"),
    max_price: Optional[float] = Query(None, description="최대 가격"),
    search: Optional[str] = Query(None, description="상품명 검색"),
    db: AsyncSession = Depends(get_db),
) -> ProductListResponse:
    """
    농산물 상품 목록을 조회합니다. 카테고리, 지역, 가격 범위, 검색어로 필터링할 수 있습니다.
    """
    query = select(Product).where(Product.is_active == True)  # noqa: E712

    if category_id is not None:
        query = query.where(Product.category_id == category_id)
    if region:
        query = query.where(Product.region == region)
    if min_price is not None:
        query = query.where(Product.price >= min_price)
    if max_price is not None:
        query = query.where(Product.price <= max_price)
    if search:
        query = query.where(Product.name.ilike(f"%{search}%"))

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()

    offset = (page - 1) * page_size
    result = await db.execute(query.offset(offset).limit(page_size))
    products = result.scalars().all()

    return ProductListResponse(
        items=[ProductResponse.model_validate(p) for p in products],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/my-products",
    response_model=ProductListResponse,
    summary="내 상품 목록 조회 (농부 전용)",
)
async def list_my_products(
    page: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(20, ge=1, le=100, description="페이지 크기"),
    farmer: User = Depends(require_farmer),
    db: AsyncSession = Depends(get_db),
) -> ProductListResponse:
    """현재 농부의 상품 목록을 반환합니다."""
    if farmer.farmer_profile is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="농장 프로필을 먼저 등록해 주세요.",
        )

    query = select(Product).where(Product.farmer_id == farmer.farmer_profile.id)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()

    offset = (page - 1) * page_size
    result = await db.execute(query.order_by(Product.created_at.desc()).offset(offset).limit(page_size))
    products = result.scalars().all()

    return ProductListResponse(
        items=[ProductResponse.model_validate(p) for p in products],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/recommended",
    response_model=list[ProductResponse],
    summary="추천 상품 목록",
)
async def list_recommended_products(
    db: AsyncSession = Depends(get_db),
) -> list[ProductResponse]:
    """재고가 가장 많은 활성 상품 상위 10개를 반환합니다."""
    result = await db.execute(
        select(Product)
        .where(Product.is_active == True)  # noqa: E712
        .order_by(Product.stock.desc())
        .limit(10)
    )
    products = result.scalars().all()
    return [ProductResponse.model_validate(p) for p in products]


@router.get(
    "/{product_id}",
    response_model=ProductResponse,
    summary="상품 상세 조회",
)
async def get_product(
    product_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> ProductResponse:
    """특정 상품의 상세 정보를 조회합니다."""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="상품을 찾을 수 없습니다.",
        )
    return product


@router.post(
    "/",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    summary="상품 등록 (농부 전용)",
)
async def create_product(
    product_data: ProductCreate,
    farmer: User = Depends(require_farmer),
    db: AsyncSession = Depends(get_db),
) -> ProductResponse:
    """
    농부가 새 상품을 등록합니다. 농부 계정만 사용 가능합니다.
    """
    if farmer.farmer_profile is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="농장 프로필을 먼저 등록해 주세요.",
        )

    product = Product(
        farmer_id=farmer.farmer_profile.id,
        **product_data.model_dump(),
    )
    db.add(product)
    await db.flush()
    await db.refresh(product)
    return product


@router.put(
    "/{product_id}",
    response_model=ProductResponse,
    summary="상품 수정 (농부 전용)",
)
async def update_product(
    product_id: UUID,
    update_data: ProductUpdate,
    farmer: User = Depends(require_farmer),
    db: AsyncSession = Depends(get_db),
) -> ProductResponse:
    """상품 정보를 수정합니다. 본인의 상품만 수정 가능합니다."""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()

    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="상품을 찾을 수 없습니다.")

    if farmer.farmer_profile is None or product.farmer_id != farmer.farmer_profile.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="본인의 상품만 수정할 수 있습니다.")

    for field, value in update_data.model_dump(exclude_none=True).items():
        setattr(product, field, value)

    await db.flush()
    await db.refresh(product)
    return product


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="상품 삭제 (농부 전용)",
)
async def delete_product(
    product_id: UUID,
    farmer: User = Depends(require_farmer),
    db: AsyncSession = Depends(get_db),
) -> None:
    """상품을 비활성화합니다 (소프트 삭제). 본인의 상품만 삭제 가능합니다."""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()

    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="상품을 찾을 수 없습니다.")

    if farmer.farmer_profile is None or product.farmer_id != farmer.farmer_profile.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="본인의 상품만 삭제할 수 있습니다.")

    product.is_active = False
    await db.flush()
