from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, HttpUrl


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    description: str = Field(..., min_length=5)
    brand: str = Field(..., min_length=2, max_length=100)
    price: Decimal = Field(..., gt=0)
    image_url: HttpUrl
    category_id: int
    is_active: bool = True


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    description: Optional[str] = Field(None, min_length=5)
    brand: Optional[str] = Field(None, min_length=2, max_length=100)
    price: Optional[Decimal] = Field(None, gt=0)
    image_url: Optional[HttpUrl] = None
    category_id: Optional[int] = None
    is_active: Optional[bool] = None


class ProductResponse(BaseModel):
    id: int
    name: str
    description: str
    brand: str
    price: Decimal
    image_url: str
    is_active: bool
    created_at: datetime
    category_id: int
    category_name: str

    model_config = {"from_attributes": True}