from sqlalchemy.orm import Session

from app.models.category import Category
from app.schemas.category import CategoryCreate


def create_category(db: Session, payload: CategoryCreate) -> Category:
    existing = db.query(Category).filter(Category.name.ilike(payload.name)).first()
    if existing:
        raise ValueError("Category already exists")

    category = Category(name=payload.name)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def get_all_categories(db: Session) -> list[Category]:
    return db.query(Category).order_by(Category.name.asc()).all()