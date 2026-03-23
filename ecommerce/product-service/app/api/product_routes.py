from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from app.services.product_service import (
    create_product,
    delete_product,
    get_all_products,
    get_product_by_id,
    update_product,
)

router = APIRouter(prefix="/api/products", tags=["Products"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def build_product_response(product) -> ProductResponse:
    return ProductResponse(
        id=product.id,
        name=product.name,
        description=product.description,
        brand=product.brand,
        price=product.price,
        image_url=product.image_url,
        is_active=product.is_active,
        created_at=product.created_at,
        category_id=product.category_id,
        category_name=product.category.name if product.category else "",
    )


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def add_product(payload: ProductCreate, db: Session = Depends(get_db)):
    try:
        product = create_product(db, payload)
        product = get_product_by_id(db, product.id)
        return build_product_response(product)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("", response_model=list[ProductResponse])
def list_products(
    category_id: int | None = Query(None),
    search: str | None = Query(None),
    is_active: bool | None = Query(None),
    db: Session = Depends(get_db),
):
    products = get_all_products(
        db=db,
        category_id=category_id,
        search=search,
        is_active=is_active,
    )
    return [build_product_response(product) for product in products]


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return build_product_response(product)


@router.put("/{product_id}", response_model=ProductResponse)
def edit_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)):
    try:
        product = update_product(db, product_id, payload)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        product = get_product_by_id(db, product_id)
        return build_product_response(product)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_product(product_id: int, db: Session = Depends(get_db)):
    deleted = delete_product(db, product_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Product not found")
    return None