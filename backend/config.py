from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    gemini_api_key: str
    tavily_api_key: str
    email_address: str
    email_app_password: str

    class Config:
        env_file = ".env"

settings = Settings()