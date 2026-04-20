from pydantic import BaseModel, Field


class InventoryCreate(BaseModel):
    product_id: int
    total_quantity: int = Field(..., ge=0)


class InventoryUpdate(BaseModel):
    total_quantity: int = Field(..., ge=0)


class StockAction(BaseModel):
    quantity: int = Field(..., gt=0)


class InventoryResponse(BaseModel):
    id: int
    product_id: int
    total_quantity: int
    reserved_quantity: int
    available_quantity: int

    class Config:
        from_attributes = True