from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import get_current_user, require_admin
from app.models import Equipment, EquipmentStatus, Loan, LoanStatus, User
from app.loan_dates import validate_loan_schedule
from app.schemas import LoanCreate, LoanRead
from app.terms import CURRENT_LOAN_TERMS_VERSION

router = APIRouter(prefix="/loans", tags=["loans"])


def _load_loan(db: Session, loan_id: int) -> Loan | None:
    return (
        db.query(Loan)
        .options(joinedload(Loan.equipment), joinedload(Loan.borrower))
        .filter(Loan.id == loan_id)
        .first()
    )


@router.post("", response_model=LoanRead, status_code=status.HTTP_201_CREATED)
def create_loan(
    body: LoanCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not body.terms_accepted:
        raise HTTPException(
            status_code=400,
            detail="É necessário aceitar o termo de responsabilidade para solicitar o empréstimo.",
        )
    if body.terms_version != CURRENT_LOAN_TERMS_VERSION:
        raise HTTPException(
            status_code=400,
            detail="Versão do termo desatualizada. Atualize a página e leia o termo novamente.",
        )

    eq = db.get(Equipment, body.equipment_id)
    if eq is None:
        raise HTTPException(status_code=404, detail="Equipamento não encontrado")
    if eq.status != EquipmentStatus.disponivel:
        raise HTTPException(
            status_code=400,
            detail="Equipamento indisponível para empréstimo (emprestado ou em manutenção)",
        )

    blocking = (
        db.query(Loan)
        .filter(
            Loan.equipment_id == eq.id,
            Loan.status.in_([LoanStatus.pendente, LoanStatus.ativo]),
        )
        .first()
    )
    if blocking:
        raise HTTPException(
            status_code=400,
            detail="Já existe solicitação pendente ou empréstimo ativo para este equipamento.",
        )

    now = datetime.now(timezone.utc)
    date_err = validate_loan_schedule(body.pickup_at, body.due_at, now=now)
    if date_err:
        raise HTTPException(status_code=400, detail=date_err)

    loan = Loan(
        equipment_id=eq.id,
        borrower_id=user.id,
        pickup_at=body.pickup_at,
        due_at=body.due_at,
        status=LoanStatus.pendente,
        terms_accepted_at=now,
        terms_version=body.terms_version,
    )
    db.add(loan)
    db.commit()
    db.refresh(loan)
    loan = _load_loan(db, loan.id)
    assert loan is not None
    return loan


@router.get("/me", response_model=list[LoanRead])
def my_loans(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rows = (
        db.query(Loan)
        .options(joinedload(Loan.equipment), joinedload(Loan.borrower))
        .filter(Loan.borrower_id == user.id)
        .order_by(Loan.created_at.desc())
        .all()
    )
    return rows


@router.get("/pending", response_model=list[LoanRead])
def pending_loans_admin(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    rows = (
        db.query(Loan)
        .options(joinedload(Loan.equipment), joinedload(Loan.borrower))
        .filter(Loan.status == LoanStatus.pendente)
        .order_by(Loan.created_at.desc())
        .all()
    )
    return rows


@router.get("/active", response_model=list[LoanRead])
def active_loans_admin(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    rows = (
        db.query(Loan)
        .options(joinedload(Loan.equipment), joinedload(Loan.borrower))
        .filter(Loan.status == LoanStatus.ativo)
        .order_by(Loan.due_at)
        .all()
    )
    return rows


@router.get("/finished", response_model=list[LoanRead])
def finished_loans_admin(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Histórico de empréstimos encerrados (devolução registrada)."""
    rows = (
        db.query(Loan)
        .options(joinedload(Loan.equipment), joinedload(Loan.borrower))
        .filter(Loan.status == LoanStatus.finalizado)
        .order_by(Loan.returned_at.desc(), Loan.created_at.desc())
        .all()
    )
    return rows


@router.get("/rejected", response_model=list[LoanRead])
def rejected_loans_admin(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    rows = (
        db.query(Loan)
        .options(joinedload(Loan.equipment), joinedload(Loan.borrower))
        .filter(Loan.status == LoanStatus.recusado)
        .order_by(Loan.created_at.desc())
        .all()
    )
    return rows


@router.post("/{loan_id}/approve", response_model=LoanRead)
def approve_loan(
    loan_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    loan = _load_loan(db, loan_id)
    if loan is None:
        raise HTTPException(status_code=404, detail="Empréstimo não encontrado")
    if loan.status != LoanStatus.pendente:
        raise HTTPException(status_code=400, detail="Somente solicitações pendentes podem ser aprovadas")

    eq = loan.equipment
    if eq is None:
        raise HTTPException(status_code=400, detail="Equipamento associado não encontrado")
    if eq.status != EquipmentStatus.disponivel:
        raise HTTPException(status_code=400, detail="Equipamento não está mais disponível para aprovação")

    other = (
        db.query(Loan)
        .filter(
            Loan.equipment_id == eq.id,
            Loan.id != loan.id,
            Loan.status.in_([LoanStatus.pendente, LoanStatus.ativo]),
        )
        .first()
    )
    if other:
        raise HTTPException(
            status_code=400,
            detail="Outra solicitação ou empréstimo já ocupa este equipamento; recuse a solicitação atual ou a outra.",
        )

    loan.status = LoanStatus.ativo
    loan.approved_at = datetime.now(timezone.utc)
    eq.status = EquipmentStatus.emprestado
    db.commit()
    db.refresh(loan)
    return _load_loan(db, loan_id)  # type: ignore[return-value]


@router.post("/{loan_id}/reject", response_model=LoanRead)
def reject_loan(
    loan_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    loan = _load_loan(db, loan_id)
    if loan is None:
        raise HTTPException(status_code=404, detail="Empréstimo não encontrado")
    if loan.status != LoanStatus.pendente:
        raise HTTPException(status_code=400, detail="Somente solicitações pendentes podem ser recusadas")

    loan.status = LoanStatus.recusado
    db.commit()
    db.refresh(loan)
    return _load_loan(db, loan_id)  # type: ignore[return-value]


@router.post("/{loan_id}/return", response_model=LoanRead)
def return_loan(
    loan_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    loan = _load_loan(db, loan_id)
    if loan is None:
        raise HTTPException(status_code=404, detail="Empréstimo não encontrado")
    if loan.status != LoanStatus.ativo:
        raise HTTPException(status_code=400, detail="Empréstimo já finalizado ou ainda não aprovado")
    if loan.borrower_id != user.id:
        raise HTTPException(status_code=403, detail="Somente o tomador pode registrar a devolução")

    loan.returned_at = datetime.now(timezone.utc)
    loan.status = LoanStatus.finalizado
    loan.equipment.status = EquipmentStatus.disponivel
    db.commit()
    db.refresh(loan)
    return loan
