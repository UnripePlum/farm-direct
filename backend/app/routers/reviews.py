from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.review import Review
from app.models.product import Product
from app.models.order import Order, OrderItem, OrderStatus
from app.schemas.review import ReviewCreate, ReviewResponse

router = APIRouter(prefix="/api/reviews", tags=["리뷰"])


@router.post(
    "/",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="리뷰 작성",
)
async def create_review(
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReviewResponse:
    """
    구매한 상품에 리뷰를 작성합니다.
    평점은 1~5 사이의 정수입니다.
    """
    prod_result = await db.execute(select(Product).where(Product.id == review_data.product_id))
    product = prod_result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="상품을 찾을 수 없습니다.")

    # Verify the user has a completed order containing this product
    purchase_check = await db.execute(
        select(OrderItem)
        .join(Order, OrderItem.order_id == Order.id)
        .where(
            Order.user_id == current_user.id,
            Order.status == OrderStatus.completed,
            OrderItem.product_id == review_data.product_id,
        )
        .limit(1)
    )
    if purchase_check.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="구매 완료된 상품만 리뷰를 작성할 수 있습니다.",
        )

    # Check for duplicate review on same product/order
    existing_result = await db.execute(
        select(Review).where(
            Review.user_id == current_user.id,
            Review.product_id == review_data.product_id,
            Review.order_id == review_data.order_id,
        )
    )
    if existing_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 해당 상품에 리뷰를 작성하셨습니다.",
        )

    review = Review(
        user_id=current_user.id,
        product_id=review_data.product_id,
        order_id=review_data.order_id,
        rating=review_data.rating,
        text=review_data.text,
        photos=review_data.photos,
    )
    db.add(review)
    await db.flush()
    await db.refresh(review)
    return review


@router.get(
    "/product/{product_id}",
    response_model=List[ReviewResponse],
    summary="상품 리뷰 목록 조회",
)
async def list_product_reviews(
    product_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> List[ReviewResponse]:
    """특정 상품의 리뷰 목록을 최신순으로 반환합니다."""
    result = await db.execute(
        select(Review)
        .where(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
    )
    return result.scalars().all()
