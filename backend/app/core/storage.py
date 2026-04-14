import os
import uuid
import datetime
from google.cloud import storage
from fastapi import UploadFile
from app.core.config import settings

# Initialize the client.
# In Cloud Run, this automatically authenticates using the service account.
# Locally, it looks for the GOOGLE_APPLICATION_CREDENTIALS environment variable.
storage_client = storage.Client()
BUCKET_NAME = settings.GCS_BUCKET_NAME


def upload_image_to_gcs(file: UploadFile, folder: str = "misc") -> str:
    """
    Uploads a FastAPI UploadFile to Google Cloud Storage and returns the public URL.
    """
    bucket = storage_client.bucket(BUCKET_NAME)

    # Generate a unique filename to prevent collisions
    extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    unique_filename = f"{folder}/{uuid.uuid4()}.{extension}"

    blob = bucket.blob(unique_filename)
    blob.upload_from_file(file.file, content_type=file.content_type)

    return unique_filename


def generate_signed_url(blob_name: str, expiration_minutes: int = 60) -> str:
    """
    Generates a v4 signed URL for temporarily downloading/viewing a private blob.
    """
    bucket = storage_client.bucket(BUCKET_NAME)
    blob = bucket.blob(blob_name)

    service_account_email = settings.GCS_SERVICE_ACCOUNT_EMAIL

    # Automatically detect the service account email if running on Cloud Run / Compute Engine
    # This bypasses the need to explicitly set the environment variable.
    if not service_account_email and hasattr(
        storage_client._credentials, "service_account_email"
    ):
        service_account_email = storage_client._credentials.service_account_email

    kwargs = {}
    if service_account_email:
        kwargs["service_account_email"] = service_account_email

    return blob.generate_signed_url(
        version="v4",
        expiration=datetime.timedelta(minutes=expiration_minutes),
        method="GET",
        **kwargs,
    )
