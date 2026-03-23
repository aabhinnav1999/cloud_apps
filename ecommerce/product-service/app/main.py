from fastapi import FastAPI
from fastapi.responses import JSONResponse

from app.api.category_routes import router as category_router
from app.api.product_routes import router as product_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine

from app.models.category import Category
from app.models.product import Product

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.app_name)


@app.get("/health")
def health_check():
    return JSONResponse(
        content={
            "service": settings.app_name,
            "status": "up",
            "port": settings.app_port,
        }
    )


app.include_router(category_router)
app.include_router(product_router)