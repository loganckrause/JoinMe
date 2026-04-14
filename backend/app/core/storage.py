import os
import uuid
import datetime
import shutil
from fastapi import UploadFile
from app.core.config import settings

# Check environment variables directly to bypass Pydantic schema omissions
CURRENT_STORAGE_BACKEND = os.environ.get(
    "STORAGE_BACKEND", getattr(settings, "STORAGE_BACKEND", "local")
)

# Initialize the client.
storage_client = None
if CURRENT_STORAGE_BACKEND != "local":
    from google.cloud import storage
    from google.auth.transport import requests
    import google.auth

    # In Cloud Run, this automatically authenticates using the service account.
    # Locally, it looks for the GOOGLE_APPLICATION_CREDENTIALS environment variable.
    # We explicitly request the cloud-platform scope so the access token has
    # permission to call the IAM Credentials API for URL signing.
    credentials, project = google.auth.default(
        scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )
    storage_client = storage.Client(credentials=credentials, project=project)

BUCKET_NAME = settings.GCS_BUCKET_NAME


def upload_image_to_gcs(file: UploadFile, folder: str = "misc") -> str:
    """
    Uploads a FastAPI UploadFile to Google Cloud Storage and returns the public URL.
    """
    # Generate a unique filename to prevent collisions
    extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    unique_filename = f"{folder}/{uuid.uuid4()}.{extension}"

    # Handle local development storage
    if CURRENT_STORAGE_BACKEND == "local":
        upload_dir = os.environ.get(
            "LOCAL_UPLOAD_DIR", getattr(settings, "LOCAL_UPLOAD_DIR", "./uploads")
        )
        file_path = os.path.join(upload_dir, unique_filename)
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "wb+") as f:
            shutil.copyfileobj(file.file, f)
        return unique_filename

    bucket = storage_client.bucket(BUCKET_NAME)
    blob = bucket.blob(unique_filename)
    blob.upload_from_file(file.file, content_type=file.content_type)

    return unique_filename


def generate_signed_url(blob_name: str, expiration_minutes: int = 60) -> str:
    """
    Generates a v4 signed URL for temporarily downloading/viewing a private blob.
    """
    if not blob_name:
        return blob_name

    # If the picture is already a valid URL or a raw base64 string, do not sign it
    if blob_name.startswith(("http://", "https://", "data:")) or len(blob_name) > 255:
        return blob_name

    # Return local static path for development
    if CURRENT_STORAGE_BACKEND == "local":
        if blob_name.startswith("/"):
            return blob_name
        return f"/uploads/{blob_name}"

    bucket = storage_client.bucket(BUCKET_NAME)
    blob = bucket.blob(blob_name)

    kwargs = {}
    credentials = storage_client._credentials

    # If the current credentials cannot sign payloads locally (e.g. Cloud Run),
    # we must provide both the service_account_email and an access_token.
    if credentials and not hasattr(credentials, "sign_bytes"):
        if not credentials.valid:
            credentials.refresh(requests.Request())
        kwargs["access_token"] = credentials.token

        service_account_email = settings.GCS_SERVICE_ACCOUNT_EMAIL
        if not service_account_email and hasattr(credentials, "service_account_email"):
            service_account_email = credentials.service_account_email
        kwargs["service_account_email"] = service_account_email

    return blob.generate_signed_url(
        version="v4",
        expiration=datetime.timedelta(minutes=expiration_minutes),
        method="GET",
        **kwargs,
    )
