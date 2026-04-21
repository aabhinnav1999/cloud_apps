from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.inventory import Inventory


def get_inventory_by_product_id(db: Session, product_id: int):
    return db.query(Inventory).filter(Inventory.product_id == product_id).first()


def create_inventory(db: Session, product_id: int, total_quantity: int):
    existing_inventory = get_inventory_by_product_id(db, product_id)
    if existing_inventory:
        raise HTTPException(status_code=400, detail="Inventory already exists for this product")

    inventory = Inventory(
        product_id=product_id,
        total_quantity=total_quantity,
        reserved_quantity=0
    )
    db.add(inventory)
    db.commit()
    db.refresh(inventory)
    return inventory


def update_inventory(db: Session, product_id: int, total_quantity: int):
    inventory = get_inventory_by_product_id(db, product_id)
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")

    if total_quantity < inventory.reserved_quantity:
        raise HTTPException(
            status_code=400,
            detail="Total quantity cannot be less than reserved quantity"
        )

    inventory.total_quantity = total_quantity
    db.commit()
    db.refresh(inventory)
    return inventory


def reserve_stock(db: Session, product_id: int, quantity: int):
    inventory = get_inventory_by_product_id(db, product_id)
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")

    available_quantity = inventory.total_quantity - inventory.reserved_quantity
    if quantity > available_quantity:
        raise HTTPException(status_code=400, detail="Not enough stock available")

    inventory.reserved_quantity += quantity
    db.commit()
    db.refresh(inventory)
    return inventory


def release_stock(db: Session, product_id: int, quantity: int):
    inventory = get_inventory_by_product_id(db, product_id)
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")

    if quantity > inventory.reserved_quantity:
        raise HTTPException(status_code=400, detail="Cannot release more than reserved stock")

    inventory.reserved_quantity -= quantity
    db.commit()
    db.refresh(inventory)
    return inventory


def deduct_stock(db: Session, product_id: int, quantity: int):
    inventory = get_inventory_by_product_id(db, product_id)
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")

    if quantity > inventory.reserved_quantity:
        raise HTTPException(status_code=400, detail="Cannot deduct more than reserved stock")

    inventory.reserved_quantity -= quantity
    inventory.total_quantity -= quantity
    db.commit()
    db.refresh(inventory)
    return inventory