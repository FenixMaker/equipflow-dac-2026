from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, SessionLocal, engine
from app.models import Equipment, EquipmentStatus, User, UserRole
from app.auth_utils import hash_password
from app.lan_hosts import get_lan_ipv4_addresses
from app.routers import auth, equipment, loans


def seed_if_empty():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).first() is None:
            db.add_all(
                [
                    User(
                        email="admin@labnrdt.edu.br",
                        full_name="Coordenação NRDT",
                        hashed_password=hash_password("Admin@123"),
                        role=UserRole.admin,
                    ),
                    User(
                        email="usuario@labnrdt.edu.br",
                        full_name="Docente Silva",
                        hashed_password=hash_password("Usuario@123"),
                        role=UserRole.borrower,
                    ),
                ]
            )
            db.commit()
        if db.query(Equipment).first() is None:
            db.add_all(
                [
                    Equipment(
                        name='Notebook Dell 14"',
                        inventory_code="PAT-LAB-001",
                        description="Core i5, 16 GB RAM, SSD 512 GB. Windows 11. Ideal para aulas e apresentações. Carregador Dell original incluído.",
                        status=EquipmentStatus.disponivel,
                    ),
                    Equipment(
                        name="Projetor portátil Epson",
                        inventory_code="PAT-LAB-014",
                        description="Full HD, 3200 lm. Maleta com cabo HDMI (2 m), cabo VGA e controlo remoto com pilhas.",
                        status=EquipmentStatus.disponivel,
                    ),
                    Equipment(
                        name="Monitor LED 24\"",
                        inventory_code="PAT-LAB-003",
                        description="1920×1080, painel IPS, entradas HDMI e DisplayPort. Cabo de alimentação e HDMI na caixa.",
                        status=EquipmentStatus.disponivel,
                    ),
                    Equipment(
                        name="Tablet Samsung Galaxy Tab",
                        inventory_code="PAT-LAB-005",
                        description="11 polegadas, caneta S Pen incluída. Útil para anotações em campo e demos tácteis.",
                        status=EquipmentStatus.disponivel,
                    ),
                    Equipment(
                        name="Câmara DSLR Canon",
                        inventory_code="PAT-LAB-008",
                        description="Corpo + objetiva 18-55 mm, cartão SD 32 GB, bateria extra e carregador. Manual em PDF no NRDT.",
                        status=EquipmentStatus.disponivel,
                    ),
                    Equipment(
                        name="Tripé universal 1,7 m",
                        inventory_code="PAT-LAB-009",
                        description="Suporta até 4 kg. Cabeça de bola com nível. Bolsa de transporte.",
                        status=EquipmentStatus.disponivel,
                    ),
                    Equipment(
                        name="Caixa de som Bluetooth JBL",
                        inventory_code="PAT-LAB-011",
                        description="À prova de respingos (IPX7). Autonomia ~12 h. Cabo USB-C para carregar.",
                        status=EquipmentStatus.disponivel,
                    ),
                    Equipment(
                        name="Microfone lapela sem fio",
                        inventory_code="PAT-LAB-012",
                        description="Receptor USB-C + jack 3,5 mm. Alcance ~50 m em linha de vista. Estojo rígido.",
                        status=EquipmentStatus.disponivel,
                    ),
                    Equipment(
                        name="Switch de rede 8 portas Gigabit",
                        inventory_code="PAT-LAB-015",
                        description="TP-Link não gerido. Inclui alimentação externa e manual de instalação rápida.",
                        status=EquipmentStatus.disponivel,
                    ),
                    Equipment(
                        name="Kit cabos HDMI (várias medidas)",
                        inventory_code="PAT-LAB-017",
                        description="Conjunto de 3 cabos: 1 m, 2 m e 5 m. Testados antes de cada empréstimo.",
                        status=EquipmentStatus.disponivel,
                    ),
                    Equipment(
                        name="Webcam Logitech Full HD",
                        inventory_code="PAT-LAB-021",
                        description="USB-A, microfone estéreo integrado. Suporte para monitor ou tripé (rosca padrão).",
                        status=EquipmentStatus.disponivel,
                    ),
                    Equipment(
                        name="Multímetro digital Fluke",
                        inventory_code="PAT-LAB-019",
                        description="Medição AC/DC, continuidade e diodo. Pontas de prova no estojo. Calibração anual recomendada.",
                        status=EquipmentStatus.disponivel,
                    ),
                    Equipment(
                        name="Apresentador laser e controlo remoto",
                        inventory_code="PAT-LAB-026",
                        description="Compatível com Windows e macOS (USB receptor nano). Botões de avanço/voltar e apagador de ecrã.",
                        status=EquipmentStatus.disponivel,
                    ),
                    Equipment(
                        name="Headset USB para videoconferência",
                        inventory_code="PAT-LAB-027",
                        description="Cancelamento de ruído básico, microfone articulado. Cabo fixo ~1,8 m.",
                        status=EquipmentStatus.disponivel,
                    ),
                    Equipment(
                        name="Mini UPS 600 VA",
                        inventory_code="PAT-LAB-028",
                        description="Proteção contra picos e quedas breves de energia. Não ligar motores ou impressoras laser.",
                        status=EquipmentStatus.disponivel,
                    ),
                    Equipment(
                        name="Router Wi‑Fi portátil 4G",
                        inventory_code="PAT-LAB-029",
                        description="Bateria interna ~8 h. Cartão SIM não incluído — apenas para demos de rede em sala.",
                        status=EquipmentStatus.disponivel,
                    ),
                    Equipment(
                        name="Câmara documentos USB",
                        inventory_code="PAT-LAB-031",
                        description="Resolução adequada para transparências e livros. Dobrável com LED integrado e software no NRDT.",
                        status=EquipmentStatus.disponivel,
                    ),
                    Equipment(
                        name="Kit Arduino laboratório",
                        inventory_code="PAT-LAB-022",
                        description="Em revisão elétrica e inventário de componentes — não disponível para empréstimo até liberação.",
                        status=EquipmentStatus.manutencao,
                    ),
                    Equipment(
                        name="Osciloscópio portátil 2 canais",
                        inventory_code="PAT-LAB-024",
                        description="Firmware em atualização e sondas em calibração. Previsão fictícia de retorno: próxima sprint.",
                        status=EquipmentStatus.manutencao,
                    ),
                    Equipment(
                        name="Impressora portátil térmica",
                        inventory_code="PAT-LAB-032",
                        description="Bluetooth e USB. Bobina de papel incluída. Ideal para etiquetas e comprovantes em eventos.",
                        status=EquipmentStatus.disponivel,
                    ),
                    Equipment(
                        name="Extensão elétrica 5 m (6 tomadas)",
                        inventory_code="PAT-LAB-033",
                        description="Com proteção contra surtos. Cabo em bom estado; não usar em carga acima de 10 A.",
                        status=EquipmentStatus.disponivel,
                    ),
                    Equipment(
                        name="Power bank 20.000 mAh USB-C",
                        inventory_code="PAT-LAB-034",
                        description="Carrega notebook e telemóvel. Cabo USB-C incluído. Verificar carga antes de retirar.",
                        status=EquipmentStatus.disponivel,
                    ),
                    Equipment(
                        name="Hub USB-C 7 em 1",
                        inventory_code="PAT-LAB-035",
                        description="HDMI, USB-A, leitor SD e Ethernet. Compatível com MacBook e portáteis USB-C.",
                        status=EquipmentStatus.disponivel,
                    ),
                    Equipment(
                        name="Gravador de voz digital",
                        inventory_code="PAT-LAB-036",
                        description="Memória interna ~32 h. Microfone omnidirecional. Pilhas AA no estojo.",
                        status=EquipmentStatus.disponivel,
                    ),
                    Equipment(
                        name="Gimbal para smartphone",
                        inventory_code="PAT-LAB-037",
                        description="Estabilização 3 eixos. App de controlo no QR do manual. Bateria carregada na base.",
                        status=EquipmentStatus.disponivel,
                    ),
                    Equipment(
                        name="Medidor de consumo (plug inteligente)",
                        inventory_code="PAT-LAB-038",
                        description="Demonstração de eficiência energética. Wi‑Fi 2,4 GHz; app de configuração no NRDT.",
                        status=EquipmentStatus.disponivel,
                    ),
                    Equipment(
                        name="Maleta de ferramentas básicas",
                        inventory_code="PAT-LAB-039",
                        description="Chaves, alicates, fita métrica e nível. Uso em montagem de stands e ajustes leves.",
                        status=EquipmentStatus.disponivel,
                    ),
                ]
            )
            db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(_: FastAPI):
    seed_if_empty()
    yield


app = FastAPI(title="EquipFlow API", version="0.1.0", lifespan=lifespan)

# Origens explícitas (localhost) + regex para apresentação na LAN (Vite em portas 5xxx típicas).
_LAN_VITE_ORIGIN = (
    r"^http://("
    r"192\.168\.\d{1,3}\.\d{1,3}"
    r"|10\.\d{1,3}\.\d{1,3}\.\d{1,3}"
    r"|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}"
    r"):5\d{3}$"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=_LAN_VITE_ORIGIN,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(equipment.router)
app.include_router(loans.router)


@app.get("/health")
def health():
    return {"status": "ok", "lan_addresses": get_lan_ipv4_addresses()}
