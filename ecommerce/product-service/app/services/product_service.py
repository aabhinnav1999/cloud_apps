from sqlalchemy.orm import Session, joinedload

from app.models.category import Category
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


def create_product(db: Session, payload: ProductCreate) -> Product:
    category = db.query(Category).filter(Category.id == payload.category_id).first()
    if not category:
        raise ValueError("Category not found")

    product = Product(
        name=payload.name,
        description=payload.description,
        brand=payload.brand,
        price=payload.price,
        image_url=str(payload.image_url),
        category_id=payload.category_id,
        is_active=payload.is_active,
    )

    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def get_all_products(
    db: Session,
    category_id: int | None = None,
    search: str | None = None,
    is_active: bool | None = None,
) -> list[Product]:
    query = db.query(Product).options(joinedload(Product.category))

    if category_id is not None:
        query = query.filter(Product.category_id == category_id)

    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))

    if is_active is not None:
        query = query.filter(Product.is_active == is_active)

    return query.order_by(Product.created_at.desc()).all()


def get_product_by_id(db: Session, product_id: int) -> Product | None:
    return (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(Product.id == product_id)
        .first()
    )


def update_product(db: Session, product_id: int, payload: ProductUpdate) -> Product | None:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return None

    update_data = payload.model_dump(exclude_unset=True)

    if "category_id" in update_data:
        category = db.query(Category).filter(Category.id == update_data["category_id"]).first()
        if not category:
            raise ValueError("Category not found")

    if "image_url" in update_data and update_data["image_url"] is not None:
        update_data["image_url"] = str(update_data["image_url"])

    for key, value in update_data.items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: int) -> bool:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return False

    db.delete(product)
    db.commit()
    return True