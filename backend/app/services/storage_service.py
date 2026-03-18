from abc import ABC, abstractmethod
import logging

logger = logging.getLogger(__name__)


class StorageService(ABC):
    @abstractmethod
    async def upload_image(self, file_data: bytes, filename: str) -> str:
        """Upload image, return URL."""
        ...

    @abstractmethod
    async def delete_image(self, url: str) -> bool:
        """Delete image by URL, return success."""
        ...


class DummyStorageService(StorageService):
    """Returns placeholder URLs for development."""

    async def upload_image(self, file_data: bytes, filename: str) -> str:
        return f"https://placehold.co/400x400?text={filename}"

    async def delete_image(self, url: str) -> bool:
        return True


class S3StorageService(StorageService):
    """Production storage using AWS S3 or compatible."""

    def __init__(self, bucket: str, region: str = "ap-northeast-2") -> None:
        self.bucket = bucket
        self.region = region

    async def upload_image(self, file_data: bytes, filename: str) -> str:
        import boto3
        import uuid

        s3 = boto3.client("s3", region_name=self.region)
        key = f"images/{uuid.uuid4().hex}_{filename}"
        s3.put_object(Bucket=self.bucket, Key=key, Body=file_data, ContentType="image/jpeg")
        return f"https://{self.bucket}.s3.{self.region}.amazonaws.com/{key}"

    async def delete_image(self, url: str) -> bool:
        import boto3

        s3 = boto3.client("s3", region_name=self.region)
        # Extract key from URL
        prefix = f"https://{self.bucket}.s3.{self.region}.amazonaws.com/"
        if not url.startswith(prefix):
            return False
        key = url[len(prefix):]
        s3.delete_object(Bucket=self.bucket, Key=key)
        return True
