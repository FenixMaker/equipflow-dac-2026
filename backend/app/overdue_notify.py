from app.models import Loan, User
from app.overdue import FINE_PER_DAY_BRL, overdue_info_for_loan


def build_overdue_notification_message(loan: Loan, borrower: User) -> str:
    info = overdue_info_for_loan(loan)
    eq = loan.equipment
    eq_name = eq.name if eq else "equipamento"
    patrimonio = eq.inventory_code if eq else "—"
    days = info.days_overdue
    fine = info.fine_amount
    day_word = "dia" if days == 1 else "dias"
    return (
        f"Prezado(a) {borrower.full_name}, o empréstimo de «{eq_name}» (patrimônio {patrimonio}) "
        f"está em atraso há {days} {day_word}. "
        f"Multa acumulada: R$ {fine:.2f} (R$ {FINE_PER_DAY_BRL:.2f} por dia de atraso). "
        f"O equipamento permanece BLOQUEADO para novos empréstimos e uso externo até a devolução registrada. "
        f"Providencie a devolução o quanto antes junto à coordenação do NRDT."
    )
