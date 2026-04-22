from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.inventory import (
    InventoryCreate,
    InventoryUpdate,
    StockAction,
    InventoryResponse,
)
from app.services import inventory_service

router = APIRouter(prefix="/api/inventory", tags=["Inventory"])


def build_inventory_response(inventory) -> InventoryResponse:
    return InventoryResponse(
        id=inventory.id,
        product_id=inventory.product_id,
        total_quantity=inventory.total_quantity,
        reserved_quantity=inventory.reserved_quantity,
        available_quantity=inventory.total_quantity - inventory.reserved_quantity,
    )


@router.post("/", response_model=InventoryResponse)
def create_inventory(payload: InventoryCreate, db: Session = Depends(get_db)):
    inventory = inventory_service.create_inventory(
        db=db,
        product_id=payload.product_id,
        total_quantity=payload.total_quantity,
    )
    return build_inventory_response(inventory)


@router.get("/{product_id}", response_model=InventoryResponse)
def get_inventory(product_id: int, db: Session = Depends(get_db)):
    inventory = inventory_service.get_inventory_by_product_id(db, product_id)
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")
    return build_inventory_response(inventory)


@router.put("/{product_id}", response_model=InventoryResponse)
def update_inventory(product_id: int, payload: InventoryUpdate, db: Session = Depends(get_db)):
    inventory = inventory_service.update_inventory(
        db=db,
        product_id=product_id,
        total_quantity=payload.total_quantity,
    )
    return build_inventory_response(inventory)


@router.post("/{product_id}/reserve", response_model=InventoryResponse)
def reserve_stock(product_id: int, payload: StockAction, db: Session = Depends(get_db)):
    inventory = inventory_service.reserve_stock(
        db=db,
        product_id=product_id,
        quantity=payload.quantity,
    )
    return build_inventory_response(inventory)


@router.post("/{product_id}/release", response_model=InventoryResponse)
def release_stock(product_id: int, payload: StockAction, db: Session = Depends(get_db)):
    inventory = inventory_service.release_stock(
        db=db,
        product_id=product_id,
        quantity=payload.quantity,
    )
    return build_inventory_response(inventory)


@router.post("/{product_id}/deduct", response_model=InventoryResponse)
def deduct_stock(product_id: int, payload: StockAction, db: Session = Depends(get_db)):
    inventory = inventory_service.deduct_stock(
        db=db,
        product_id=product_id,
        quantity=payload.quantity,
    )
    return build_inventory_response(inventory)