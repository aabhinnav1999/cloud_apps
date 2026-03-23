from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.schemas.category import CategoryCreate, CategoryResponse
from app.services.category_service import create_category, get_all_categories

router = APIRouter(prefix="/api/categories", tags=["Categories"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def add_category(payload: CategoryCreate, db: Session = Depends(get_db)):
    try:
        category = create_category(db, payload)
        return category
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("", response_model=list[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    return get_all_categories(db)