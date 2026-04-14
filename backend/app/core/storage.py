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

    # We only inject the service_account_email parameter if it's set.
    # If it evaluates to None, we let the library fall back to its default behavior
    # (which works locally with a JSON key file).
    kwargs = {}
    if settings.GCS_SERVICE_ACCOUNT_EMAIL:
        kwargs["service_account_email"] = settings.GCS_SERVICE_ACCOUNT_EMAIL

    return blob.generate_signed_url(
        version="v4",
        expiration=datetime.timedelta(minutes=expiration_minutes),
        method="GET",
        **kwargs,
    )
