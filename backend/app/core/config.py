from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "mysql+pymysql://joinme:joinme_password@localhost:3306/joinme"
    SECRET_KEY: str = "secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 4320
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    GCS_BUCKET_NAME: str = "joinme-images"
    GCS_SERVICE_ACCOUNT_EMAIL: str | None = None
    GOOGLE_MAPS_API_KEY: str | None = None

    model_config = SettingsConfigDict(env_file=(".env", "../.env"))


settings = Settings()
