from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.order import CartItem
from app.models.product import Product
from app.schemas.order import CartItemCreate, CartItemUpdate, CartItemResponse

router = APIRouter(prefix="/api/cart", tags=["장바구니"])


@router.get(
    "/",
    response_model=List[CartItemResponse],
    summary="장바구니 조회",
)
async def get_cart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[CartItemResponse]:
    """현재 사용자의 장바구니 목록을 반환합니다."""
    result = await db.execute(
        select(CartItem).where(CartItem.user_id == current_user.id)
    )
    items = result.scalars().all()
    return items


@router.post(
    "/",
    response_model=CartItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="장바구니 상품 추가",
)
async def add_to_cart(
    item_data: CartItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CartItemResponse:
    """장바구니에 상품을 추가합니다. 이미 있으면 수량을 증가시킵니다."""
    # Check product exists
    prod_result = await db.execute(select(Product).where(Product.id == item_data.product_id))
    product = prod_result.scalar_one_or_none()
    if product is None or not product.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="상품을 찾을 수 없습니다.")

    # Check if already in cart
    existing_result = await db.execute(
        select(CartItem).where(
            CartItem.user_id == current_user.id,
            CartItem.product_id == item_data.product_id,
        )
    )
    existing = existing_result.scalar_one_or_none()

    if existing:
        existing.quantity += item_data.quantity
        await db.flush()
        await db.refresh(existing)
        return existing

    cart_item = CartItem(
        user_id=current_user.id,
        product_id=item_data.product_id,
        quantity=item_data.quantity,
    )
    db.add(cart_item)
    await db.flush()
    await db.refresh(cart_item)
    return cart_item


@router.put(
    "/{item_id}",
    response_model=CartItemResponse,
    summary="장바구니 수량 수정",
)
async def update_cart_item(
    item_id: UUID,
    update_data: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CartItemResponse:
    """장바구니 항목의 수량을 수정합니다."""
    result = await db.execute(
        select(CartItem).where(
            CartItem.id == item_id,
            CartItem.user_id == current_user.id,
        )
    )
    item = result.scalar_one_or_none()

    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="장바구니 항목을 찾을 수 없습니다.")

    item.quantity = update_data.quantity
    await db.flush()
    await db.refresh(item)
    return item


@router.delete(
    "/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="장바구니 항목 삭제",
)
async def remove_from_cart(
    item_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """장바구니에서 항목을 삭제합니다."""
    result = await db.execute(
        select(CartItem).where(
            CartItem.id == item_id,
            CartItem.user_id == current_user.id,
        )
    )
    item = result.scalar_one_or_none()

    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="장바구니 항목을 찾을 수 없습니다.")

    await db.delete(item)
    await db.flush()
