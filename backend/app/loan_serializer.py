from sqlalchemy.orm import Session

from app.models import Loan
from app.overdue import borrower_has_overdue_loans, overdue_info_for_loan
from app.schemas import LoanRead


def serialize_loan(loan: Loan, db: Session | None = None) -> LoanRead:
    info = overdue_info_for_loan(loan)
    borrower_blocked = (
        borrower_has_overdue_loans(db, loan.borrower_id) if db is not None else info.is_overdue
    )
    return LoanRead(
        id=loan.id,
        equipment_id=loan.equipment_id,
        borrower_id=loan.borrower_id,
        created_at=loan.created_at,
        pickup_at=loan.pickup_at,
        due_at=loan.due_at,
        approved_at=loan.approved_at,
        returned_at=loan.returned_at,
        status=loan.status,
        terms_accepted_at=loan.terms_accepted_at,
        terms_version=loan.terms_version,
        equipment=loan.equipment,
        borrower=loan.borrower,
        days_overdue=info.days_overdue,
        fine_amount=info.fine_amount,
        equipment_blocked=info.equipment_blocked,
        borrower_blocked=borrower_blocked,
    )
