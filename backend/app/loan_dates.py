"""Validação de datas previstas de retirada e devolução (empréstimo)."""

from datetime import date, datetime, timezone

MIN_LOAN_DAYS = 3


def _as_utc_date(dt: datetime) -> date:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).date()


def validate_loan_schedule(pickup_at: datetime, due_at: datetime, *, now: datetime | None = None) -> str | None:
    """
    Retorna mensagem de erro em português ou None se válido.
    Regras: retirada >= hoje; devolução > retirada; intervalo mínimo de MIN_LOAN_DAYS dias de calendário.
    """
    now = now or datetime.now(timezone.utc)
    today = _as_utc_date(now)
    pickup_d = _as_utc_date(pickup_at)
    due_d = _as_utc_date(due_at)

    if pickup_d < today:
        return "A data de retirada não pode ser anterior a hoje."
    if due_d <= pickup_d:
        return "A data de devolução deve ser posterior à data de retirada (não pode ser no mesmo dia)."
    gap = (due_d - pickup_d).days
    if gap < MIN_LOAN_DAYS:
        return f"O empréstimo deve ter no mínimo {MIN_LOAN_DAYS} dias entre retirada e devolução."
    return None
