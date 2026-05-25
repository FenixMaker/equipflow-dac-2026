from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import get_current_user
from app.models import LoanNotification, User
from app.schemas import NotificationRead

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/me", response_model=list[NotificationRead])
def my_notifications(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rows = (
        db.query(LoanNotification)
        .filter(LoanNotification.recipient_id == user.id)
        .order_by(LoanNotification.created_at.desc())
        .limit(50)
        .all()
    )
    return rows


@router.patch("/{notification_id}/read", response_model=NotificationRead)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    note = db.get(LoanNotification, notification_id)
    if note is None:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")
    if note.recipient_id != user.id:
        raise HTTPException(status_code=403, detail="Notificação de outro usuário")
    if note.read_at is None:
        note.read_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(note)
    return note
