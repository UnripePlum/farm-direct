from abc import ABC, abstractmethod
import logging

logger = logging.getLogger(__name__)


class AuthService(ABC):
    @abstractmethod
    async def verify_token(self, token: str) -> dict:
        """Verify auth token and return user info dict with uid, email, name."""
        ...

    @abstractmethod
    async def create_user(self, email: str, password: str) -> str:
        """Create auth user, return uid."""
        ...


class DummyAuthService(AuthService):
    """Development auth service that accepts any token."""

    async def verify_token(self, token: str) -> dict:
        # In dev mode, accept any non-empty token
        # Parse a simple format: "dev_<email>" or just return a default user
        if not token or token == "":
            return {"uid": "dev-user-001", "email": "dev@farmdirect.kr", "name": "개발자"}
        if token.startswith("dev_"):
            email = token[4:]
            return {"uid": f"dev-{email}", "email": email, "name": email.split("@")[0]}
        # Accept any token in dev mode
        return {"uid": f"dev-{hash(token) % 10000:04d}", "email": "user@farmdirect.kr", "name": "테스트유저"}

    async def create_user(self, email: str, password: str) -> str:
        return f"dev-{hash(email) % 10000:04d}"


class FirebaseAuthService(AuthService):
    """Production auth service using Firebase Admin SDK."""

    def __init__(self) -> None:
        import os
        import firebase_admin
        from firebase_admin import credentials

        if not firebase_admin._apps:
            from app.config import settings

            cred_path = settings.FIREBASE_CREDENTIALS_PATH
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
            else:
                firebase_admin.initialize_app()

    async def verify_token(self, token: str) -> dict:
        from firebase_admin import auth as firebase_auth

        decoded = firebase_auth.verify_id_token(token)
        return {
            "uid": decoded["uid"],
            "email": decoded.get("email", ""),
            "name": decoded.get("name", ""),
        }

    async def create_user(self, email: str, password: str) -> str:
        from firebase_admin import auth as firebase_auth

        user = firebase_auth.create_user(email=email, password=password)
        return user.uid
