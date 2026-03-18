from abc import ABC, abstractmethod
import logging

logger = logging.getLogger(__name__)


class PaymentService(ABC):
    @abstractmethod
    async def prepare_payment(self, merchant_uid: str, amount: int, order_name: str) -> dict:
        """Prepare payment, return {merchant_uid, pg_provider, ready: bool}."""
        ...

    @abstractmethod
    async def verify_payment(self, imp_uid: str, expected_amount: int) -> dict:
        """Verify payment with PG, return {verified: bool, amount: int, status: str}."""
        ...


class DummyPaymentService(PaymentService):
    """Always succeeds for development."""

    async def prepare_payment(self, merchant_uid: str, amount: int, order_name: str) -> dict:
        return {"merchant_uid": merchant_uid, "pg_provider": "dummy", "ready": True}

    async def verify_payment(self, imp_uid: str, expected_amount: int) -> dict:
        return {"verified": True, "amount": expected_amount, "status": "paid"}


class PortOnePaymentService(PaymentService):
    """Production payment via PortOne (아임포트)."""

    def __init__(self, api_key: str, api_secret: str) -> None:
        self.api_key = api_key
        self.api_secret = api_secret

    async def prepare_payment(self, merchant_uid: str, amount: int, order_name: str) -> dict:
        import httpx

        async with httpx.AsyncClient() as client:
            token_resp = await client.post(
                "https://api.iamport.kr/users/getToken",
                json={"imp_key": self.api_key, "imp_secret": self.api_secret},
            )
            if token_resp.status_code != 200:
                return {"merchant_uid": merchant_uid, "pg_provider": "portone", "ready": False}

            access_token = token_resp.json().get("response", {}).get("access_token")
            prepare_resp = await client.post(
                "https://api.iamport.kr/payments/prepare",
                headers={"Authorization": access_token},
                json={"merchant_uid": merchant_uid, "amount": amount},
            )
            ready = prepare_resp.status_code == 200
            return {"merchant_uid": merchant_uid, "pg_provider": "portone", "ready": ready}

    async def verify_payment(self, imp_uid: str, expected_amount: int) -> dict:
        import httpx

        async with httpx.AsyncClient() as client:
            # 1. Get PortOne access token
            token_resp = await client.post(
                "https://api.iamport.kr/users/getToken",
                json={"imp_key": self.api_key, "imp_secret": self.api_secret},
            )
            if token_resp.status_code != 200:
                logger.error("PG사 인증 실패: status=%d", token_resp.status_code)
                return {"verified": False, "amount": 0, "status": "auth_failed"}

            access_token = token_resp.json().get("response", {}).get("access_token")

            # 2. Verify payment amount with PG
            verify_resp = await client.get(
                f"https://api.iamport.kr/payments/{imp_uid}",
                headers={"Authorization": access_token},
            )
            if verify_resp.status_code != 200:
                logger.error("결제 정보 조회 실패: imp_uid=%s", imp_uid)
                return {"verified": False, "amount": 0, "status": "lookup_failed"}

            pg_data = verify_resp.json().get("response", {})
            pg_amount = pg_data.get("amount", 0)
            pg_status = pg_data.get("status", "")

            verified = pg_status == "paid" and pg_amount == expected_amount
            return {"verified": verified, "amount": pg_amount, "status": pg_status}
