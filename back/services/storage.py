import io
import os
from botocore.client import Config
import boto3
from botocore.exceptions import ClientError


S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL", "http://127.0.0.1:9000")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "minioadmin")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "minioadmin")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "pdflashcards")
S3_REGION = os.getenv("S3_REGION", "us-east-1")

MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {"application/pdf"}


def get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=S3_ENDPOINT_URL,
        aws_access_key_id=S3_ACCESS_KEY,
        aws_secret_access_key=S3_SECRET_KEY,
        region_name=S3_REGION,
        config=Config(signature_version="s3v4"),
    )


def ensure_bucket():
    client = get_s3_client()
    try:
        client.head_bucket(Bucket=S3_BUCKET_NAME)
    except ClientError:
        client.create_bucket(Bucket=S3_BUCKET_NAME)


def upload_bytes(data: bytes, object_key: str, content_type: str):
    client = get_s3_client()
    client.put_object(
        Bucket=S3_BUCKET_NAME,
        Key=object_key,
        Body=data,
        ContentType=content_type,
    )


def download_bytes(object_key: str) -> bytes:
    client = get_s3_client()
    response = client.get_object(Bucket=S3_BUCKET_NAME, Key=object_key)
    return response["Body"].read()


def delete_object(object_key: str):
    client = get_s3_client()
    client.delete_object(Bucket=S3_BUCKET_NAME, Key=object_key)


def generate_presigned_url(object_key: str, expires_in: int = 300) -> str:
    client = get_s3_client()
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": S3_BUCKET_NAME, "Key": object_key},
        ExpiresIn=expires_in,
    )