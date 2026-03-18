from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.order import Order, OrderStatus
from app.models.payment import Payment, PaymentStatus
from app.schemas.payment import (
    PaymentPrepareRequest,
    PaymentPrepareResponse,
    PaymentConfirmRequest,
    PaymentConfirmResponse,
)
from app.config import settings
from app.services.container import ServiceContainer

router = APIRouter(prefix="/api/payments", tags=["결제"])


@router.post(
    "/prepare",
    response_model=PaymentPrepareResponse,
    summary="결제 준비",
)
async def prepare_payment(
    req: PaymentPrepareRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PaymentPrepareResponse:
    """
    결제를 준비합니다. 주문 정보를 검증하고 PG사에 사전 등록합니다.
    반환된 merchant_uid를 프론트엔드 결제 모듈에 전달하세요.
    """
    order_result = await db.execute(select(Order).where(Order.id == req.order_id))
    order = order_result.scalar_one_or_none()

    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="주문을 찾을 수 없습니다.")
    if order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="본인의 주문만 결제할 수 있습니다.")
    if order.status != OrderStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="결제 대기 상태의 주문만 결제할 수 있습니다.",
        )

    merchant_uid = f"farmdirect_{order.id}_{uuid.uuid4().hex[:8]}"

    # Create a pending payment record
    payment = Payment(
        order_id=order.id,
        method=req.method,
        amount=order.total_price,
        status=PaymentStatus.pending,
        pg_transaction_id=merchant_uid,
    )
    db.add(payment)
    await db.flush()

    return PaymentPrepareResponse(
        merchant_uid=merchant_uid,
        amount=order.total_price,
        order_id=order.id,
        pg_provider="portone",
        pg_merchant_id=settings.PG_MERCHANT_ID,
    )


@router.post(
    "/confirm",
    response_model=PaymentConfirmResponse,
    summary="결제 승인",
)
async def confirm_payment(
    req: PaymentConfirmRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PaymentConfirmResponse:
    """
    PG사 결제 완료 후 서버 사이드에서 결제를 검증하고 승인합니다.
    imp_uid를 이용해 PG사 서버에서 결제 정보를 재조회하여 위변조를 방지합니다.
    """
    order_result = await db.execute(select(Order).where(Order.id == req.order_id))
    order = order_result.scalar_one_or_none()

    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="주문을 찾을 수 없습니다.")
    if order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="접근 권한이 없습니다.")

    payment_result = await db.execute(
        select(Payment).where(Payment.order_id == req.order_id)
    )
    payment = payment_result.scalar_one_or_none()

    if payment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="결제 정보를 찾을 수 없습니다.")

    # Verify payment via the payment service abstraction
    result = await ServiceContainer.payment().verify_payment(req.imp_uid, int(order.total_price))

    if not result["verified"]:
        pg_status = result.get("status", "unknown")
        pg_amount = result.get("amount", 0)
        if pg_status != "paid":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"결제가 완료되지 않았습니다. PG 상태: {pg_status}",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"결제 금액이 일치하지 않습니다. 주문: {order.total_price}원, PG: {pg_amount}원",
        )

    payment.status = PaymentStatus.completed
    payment.pg_transaction_id = req.imp_uid
    payment.pg_response = {"amount": result["amount"], "status": result["status"]}

    order.status = OrderStatus.paid
    await db.flush()
    await db.refresh(payment)

    # Create notification for the buyer
    from app.routers.notifications import create_notification
    await create_notification(
        db=db,
        user_id=order.user_id,
        notification_type="order_status",
        title="결제 완료",
        message=f"주문 결제가 완료되었습니다. 금액: {order.total_price}원",
    )

    return payment
