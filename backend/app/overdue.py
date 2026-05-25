"""Cálculo de atraso, multa diária e bloqueio por empréstimo vencido."""

from dataclasses import dataclass
from datetime import date, datetime, timezone

from sqlalchemy.orm import Session

from app.models import Loan, LoanStatus

FINE_PER_DAY_BRL = 15.0


def _as_utc_date(dt: datetime) -> date:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).date()


def is_loan_overdue(due_at: datetime, status: LoanStatus, *, now: datetime | None = None) -> bool:
    if status != LoanStatus.ativo:
        return False
    now = now or datetime.now(timezone.utc)
    due_end = due_at if due_at.tzinfo else due_at.replace(tzinfo=timezone.utc)
    due_end = due_end.astimezone(timezone.utc).replace(hour=23, minute=59, second=59, microsecond=999999)
    return now > due_end


def overdue_days(due_at: datetime, *, now: datetime | None = None) -> int:
    """Dias de calendário após a data prevista de devolução (0 se ainda no prazo)."""
    now = now or datetime.now(timezone.utc)
    if not is_loan_overdue(due_at, LoanStatus.ativo, now=now):
        return 0
    due_d = _as_utc_date(due_at)
    today = _as_utc_date(now)
    return max(0, (today - due_d).days)


def compute_fine(due_at: datetime, *, now: datetime | None = None) -> float:
    days = overdue_days(due_at, now=now)
    return round(days * FINE_PER_DAY_BRL, 2)


@dataclass(frozen=True)
class OverdueInfo:
    is_overdue: bool
    days_overdue: int
    fine_amount: float
    equipment_blocked: bool


def overdue_info_for_loan(loan: Loan, *, now: datetime | None = None) -> OverdueInfo:
    now = now or datetime.now(timezone.utc)
    overdue = is_loan_overdue(loan.due_at, loan.status, now=now)
    if not overdue:
        return OverdueInfo(False, 0, 0.0, False)
    days = overdue_days(loan.due_at, now=now)
    fine = round(days * FINE_PER_DAY_BRL, 2)
    return OverdueInfo(True, days, fine, True)


def borrower_has_overdue_loans(db: Session, borrower_id: int) -> bool:
    active = (
        db.query(Loan)
        .filter(Loan.borrower_id == borrower_id, Loan.status == LoanStatus.ativo)
        .all()
    )
    now = datetime.now(timezone.utc)
    return any(is_loan_overdue(l.due_at, l.status, now=now) for l in active)
