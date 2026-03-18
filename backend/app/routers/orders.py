from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from uuid import UUID
from decimal import Decimal

from app.database import get_db
from app.dependencies import get_current_user, require_farmer
from app.models.user import User
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate

router = APIRouter(prefix="/api/orders", tags=["주문"])


@router.post(
    "/",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="주문 생성",
)
async def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrderResponse:
    """
    장바구니 항목을 기반으로 주문을 생성합니다.
    재고 확인 및 총 금액 계산이 자동으로 이루어집니다.
    """
    total_price = Decimal("0")
    order_items = []

    for item_data in order_data.items:
        prod_result = await db.execute(select(Product).where(Product.id == item_data.product_id))
        product = prod_result.scalar_one_or_none()

        if product is None or not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"상품 {item_data.product_id}을(를) 찾을 수 없습니다.",
            )
        if product.stock < item_data.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"상품 '{product.name}'의 재고가 부족합니다. 남은 재고: {product.stock}",
            )

        item_price = product.price * item_data.quantity
        total_price += item_price
        order_items.append((product, item_data.quantity, product.price))

    order = Order(
        user_id=current_user.id,
        total_price=total_price,
        shipping_address=order_data.shipping_address,
        shipping_name=order_data.shipping_name,
        shipping_phone=order_data.shipping_phone,
        status=OrderStatus.pending,
    )
    db.add(order)
    await db.flush()

    for product, quantity, price in order_items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=quantity,
            price_at_purchase=price,
        )
        db.add(order_item)
        product.stock -= quantity

    await db.flush()
    # Re-query with eager loading to include items in response
    result = await db.execute(
        select(Order).where(Order.id == order.id).options(selectinload(Order.items))
    )
    order = result.scalar_one()
    return order


@router.get(
    "/",
    response_model=List[OrderResponse],
    summary="내 주문 목록 조회",
)
async def list_my_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[OrderResponse]:
    """현재 사용자의 주문 목록을 최신순으로 반환합니다."""
    result = await db.execute(
        select(Order)
        .where(Order.user_id == current_user.id)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
    )
    return result.scalars().all()


@router.get(
    "/{order_id}",
    response_model=OrderResponse,
    summary="주문 상세 조회",
)
async def get_order(
    order_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrderResponse:
    """특정 주문의 상세 정보를 조회합니다."""
    result = await db.execute(select(Order).where(Order.id == order_id).options(selectinload(Order.items)))
    order = result.scalar_one_or_none()

    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="주문을 찾을 수 없습니다.")

    if order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="본인의 주문만 조회할 수 있습니다.")

    return order


@router.put(
    "/{order_id}/status",
    response_model=OrderResponse,
    summary="주문 상태 변경 (농부 전용)",
)
async def update_order_status(
    order_id: UUID,
    status_update: OrderStatusUpdate,
    farmer: User = Depends(require_farmer),
    db: AsyncSession = Depends(get_db),
) -> OrderResponse:
    """
    주문 상태를 변경합니다. 농부 계정만 사용 가능합니다.
    processing → shipped → completed 순서로 진행됩니다.
    """
    result = await db.execute(select(Order).where(Order.id == order_id).options(selectinload(Order.items)))
    order = result.scalar_one_or_none()

    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="주문을 찾을 수 없습니다.")

    # Verify farmer owns products in this order
    if farmer.farmer_profile is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="농장 프로필이 없습니다.",
        )

    items_result = await db.execute(
        select(OrderItem).where(OrderItem.order_id == order.id)
    )
    order_items = items_result.scalars().all()

    farmer_owns_product = False
    for item in order_items:
        if item.product_id is not None:
            prod_result = await db.execute(select(Product).where(Product.id == item.product_id))
            product = prod_result.scalar_one_or_none()
            if product and product.farmer_id == farmer.farmer_profile.id:
                farmer_owns_product = True
                break

    if not farmer_owns_product:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="해당 주문에 본인의 상품이 포함되어 있지 않습니다.",
        )

    order.status = status_update.status
    await db.flush()
    await db.refresh(order)

    # Create notification for the buyer
    from app.routers.notifications import create_notification
    status_kr = {
        "processing": "처리 중",
        "shipped": "배송 중",
        "completed": "배송 완료",
    }
    status_text = status_kr.get(status_update.status.value, status_update.status.value)
    await create_notification(
        db=db,
        user_id=order.user_id,
        notification_type="order_status",
        title="주문 상태 변경",
        message=f"주문이 '{status_text}' 상태로 변경되었습니다.",
    )

    return order


@router.put(
    "/{order_id}/cancel",
    response_model=OrderResponse,
    summary="주문 취소",
)
async def cancel_order(
    order_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrderResponse:
    """
    주문을 취소합니다. 대기(pending) 또는 결제완료(paid) 상태의 주문만 취소 가능합니다.
    취소 시 재고가 복원됩니다.
    """
    result = await db.execute(select(Order).where(Order.id == order_id).options(selectinload(Order.items)))
    order = result.scalar_one_or_none()

    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="주문을 찾을 수 없습니다.")

    if order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="본인의 주문만 취소할 수 있습니다.")

    if order.status not in (OrderStatus.pending, OrderStatus.paid):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="대기 또는 결제완료 상태의 주문만 취소할 수 있습니다.",
        )

    # Restore stock for each order item
    items_result = await db.execute(
        select(OrderItem).where(OrderItem.order_id == order.id)
    )
    items = items_result.scalars().all()

    for item in items:
        if item.product_id is not None:
            prod_result = await db.execute(select(Product).where(Product.id == item.product_id))
            product = prod_result.scalar_one_or_none()
            if product:
                product.stock += item.quantity

    order.status = OrderStatus.cancelled
    await db.flush()
    await db.refresh(order)

    # Create notification for the buyer
    from app.routers.notifications import create_notification
    await create_notification(
        db=db,
        user_id=order.user_id,
        notification_type="order_status",
        title="주문 취소",
        message="주문이 취소되었습니다.",
    )

    return order
