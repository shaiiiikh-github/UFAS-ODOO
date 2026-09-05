from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Urban Furniture Accounting System"
    
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "tahir2535"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5433
    POSTGRES_DB: str = "urban_accounting"

    # Auth / JWT settings. Override SECRET_KEY via .env in any real deployment.
    SECRET_KEY: str = "urban-furniture-dev-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12

    # Comma-separated list of allowed frontend origins for CORS.
    # Override via .env, e.g. CORS_ORIGINS=http://localhost:5173,https://myapp.com
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Razorpay (test mode keys by default — replace for production).
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""

    @property
    def async_database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    # Loads variables from the .env file
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()