from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "product-service"
    app_port: int = 8082

    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "productdb"
    db_user: str = "postgres"
    db_password: str = "postgres"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+psycopg2://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )


settings = Settings()