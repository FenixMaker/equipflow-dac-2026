from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, require_admin
from app.models import Equipment, EquipmentStatus, Loan, LoanStatus, User
from app.schemas import EquipmentCreate, EquipmentRead, EquipmentStatusEnum, EquipmentUpdate

router = APIRouter(prefix="/equipment", tags=["equipment"])


@router.get("", response_model=list[EquipmentRead])
def list_equipment(
    status_filter: EquipmentStatusEnum | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Equipment)
    if status_filter is not None:
        q = q.filter(Equipment.status == EquipmentStatus(status_filter.value))
        if status_filter == EquipmentStatusEnum.disponivel:
            busy_ids = [
                row[0]
                for row in db.query(Loan.equipment_id)
                .filter(Loan.status.in_([LoanStatus.pendente, LoanStatus.ativo]))
                .distinct()
                .all()
            ]
            if busy_ids:
                q = q.filter(~Equipment.id.in_(busy_ids))
    return q.order_by(Equipment.name).all()


@router.post("", response_model=EquipmentRead, status_code=status.HTTP_201_CREATED)
def create_equipment(
    body: EquipmentCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    already = db.query(Equipment).filter(Equipment.inventory_code == body.inventory_code).first()
    if already:
        raise HTTPException(status_code=400, detail="Código de patrimônio já cadastrado")
    eq = Equipment(
        name=body.name,
        inventory_code=body.inventory_code,
        description=body.description,
        status=EquipmentStatus(body.status.value),
    )
    db.add(eq)
    db.commit()
    db.refresh(eq)
    return eq


@router.patch("/{equipment_id}", response_model=EquipmentRead)
def update_equipment(
    equipment_id: int,
    body: EquipmentUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    eq = db.get(Equipment, equipment_id)
    if eq is None:
        raise HTTPException(status_code=404, detail="Equipamento não encontrado")

    if body.status is not None:
        blocking_loan = (
            db.query(Loan)
            .filter(
                Loan.equipment_id == equipment_id,
                Loan.status.in_([LoanStatus.ativo, LoanStatus.pendente]),
            )
            .first()
        )
        if blocking_loan and body.status == EquipmentStatusEnum.manutencao:
            raise HTTPException(
                status_code=400,
                detail="Não é possível enviar para manutenção com solicitação pendente ou empréstimo ativo",
            )
        if blocking_loan and body.status == EquipmentStatusEnum.disponivel:
            raise HTTPException(
                status_code=400,
                detail="Há solicitação pendente ou empréstimo ativo: resolva antes de marcar como disponível",
            )

    if body.name is not None:
        eq.name = body.name
    if body.inventory_code is not None:
        other = (
            db.query(Equipment)
            .filter(Equipment.inventory_code == body.inventory_code, Equipment.id != equipment_id)
            .first()
        )
        if other:
            raise HTTPException(status_code=400, detail="Código de patrimônio já usado")
        eq.inventory_code = body.inventory_code
    if body.description is not None:
        eq.description = body.description
    if body.status is not None:
        eq.status = EquipmentStatus(body.status.value)

    db.commit()
    db.refresh(eq)
    return eq
