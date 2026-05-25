"""Garante que os usuários de demonstração existam no banco.

Como `seed_if_empty` só roda quando a tabela está vazia, novos solicitantes
adicionados depois precisam ser inseridos pelo upsert abaixo na inicialização.
"""

from sqlalchemy.orm import Session

from app.auth_utils import hash_password
from app.models import User, UserRole

ADMIN_PASSWORD = "Admin@123"
BORROWER_PASSWORD = "Usuario@123"

DEMO_BORROWERS: list[tuple[str, str]] = [
    ("usuario@labnrdt.edu.br", "Docente Silva"),
    ("rocha@labnrdt.edu.br", "Prof. Eduardo Rocha"),
    ("costa@labnrdt.edu.br", "Profª. Marina Costa"),
    ("daniel@labnrdt.edu.br", "Daniel Souza"),
    ("camila@labnrdt.edu.br", "Camila Ferreira"),
    ("joao@labnrdt.edu.br", "João Pereira"),
    ("lucas@labnrdt.edu.br", "Lucas Almeida"),
]


def ensure_demo_users(db: Session) -> None:
    existing = {
        email
        for (email,) in db.query(User.email).all()
    }

    if "admin@labnrdt.edu.br" not in existing:
        db.add(
            User(
                email="admin@labnrdt.edu.br",
                full_name="Coordenação NRDT",
                hashed_password=hash_password(ADMIN_PASSWORD),
                role=UserRole.admin,
            )
        )

    borrower_hash = hash_password(BORROWER_PASSWORD)
    for email, full_name in DEMO_BORROWERS:
        if email in existing:
            continue
        db.add(
            User(
                email=email,
                full_name=full_name,
                hashed_password=borrower_hash,
                role=UserRole.borrower,
            )
        )

    db.commit()
