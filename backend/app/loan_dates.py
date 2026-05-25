"""Validação de datas previstas de retirada e devolução (empréstimo)."""

from datetime import date, datetime, timedelta, timezone

MIN_LOAN_DAYS = 3

# Fuso do campus (Campo Grande/MS, UTC−4, sem horário de verão). Alinha "hoje" com o calendário do navegador no Brasil.
_CAMPUS_TZ = timezone(timedelta(hours=-4))


def _calendar_date(dt: datetime) -> date:
    # `pickup_at`/`due_at` representam um dia escolhido no formulário, não um instante real.
    # Por isso a validação usa a data declarada no payload, sem converter de fuso.
    return dt.date()


def _today_campus(now: datetime | None = None) -> date:
    now = now or datetime.now(timezone.utc)
    return now.astimezone(_CAMPUS_TZ).date()


def validate_loan_schedule(pickup_at: datetime, due_at: datetime, *, now: datetime | None = None) -> str | None:
    """
    Retorna mensagem de erro em português ou None se válido.
    Regras: retirada >= hoje; devolução > retirada; intervalo mínimo de MIN_LOAN_DAYS dias de calendário.
    """
    today = _today_campus(now)
    pickup_d = _calendar_date(pickup_at)
    due_d = _calendar_date(due_at)

    if pickup_d < today:
        return "A data de retirada não pode ser anterior a hoje."
    if due_d <= pickup_d:
        return "A data de devolução deve ser posterior à data de retirada (não pode ser no mesmo dia)."
    gap = (due_d - pickup_d).days
    if gap < MIN_LOAN_DAYS:
        return f"O empréstimo deve ter no mínimo {MIN_LOAN_DAYS} dias entre retirada e devolução."
    return None
