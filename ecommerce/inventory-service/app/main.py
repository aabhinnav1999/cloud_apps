from fastapi import FastAPI
from app.api.inventory import router as inventory_router
from app.db.base import Base
from app.db.session import engine

# Import model so SQLAlchemy can detect it
from app.models.inventory import Inventory  # noqa: F401

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Inventory Service")

app.include_router(inventory_router)


@app.get("/")
def health_check():
    return {"message": "Inventory Service is running"}