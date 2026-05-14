"""
API interna para o Painel Autopass.

Ela executa as mesmas comparações das automações originais, mas recebendo o
período escolhido na tela. Assim o front consegue puxar valores reais para
qualquer data/período, em vez de usar amostra fixa.

Como rodar em uma VM/servidor com acesso aos bancos Oracle:
    pip install -r backend/requirements.txt
    uvicorn backend.autopass_api:app --host 0.0.0.0 --port 8000

Endpoint usado pelo site:
    POST /api/comparacao
"""
from __future__ import annotations

import os
from datetime import datetime
from typing import Literal

import oracledb
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

# -----------------------------------------------------------------------------
# Configuração Oracle
# -----------------------------------------------------------------------------
# Se precisar do Instant Client, configure no .env:
# ORACLE_CLIENT_LIB_DIR=C:\Oracle\instantclient
# Se não configurar, o driver tenta usar o modo thin.
client_dir = os.getenv("ORACLE_CLIENT_LIB_DIR")
if client_dir:
    try:
        oracledb.init_oracle_client(lib_dir=client_dir)
    except Exception as exc:  # evita quebrar no reload do uvicorn
        if "already initialized" not in str(exc).lower():
            raise


AUTOPASS = {
    "dsn": os.getenv("AUTOPASS_DSN"),
    "user": os.getenv("AUTOPASS_USER"),
    "password": os.getenv("AUTOPASS_PASS"),
}

GARAGENS_DB = {
    "dsn": os.getenv("GARAGENS_DSN"),
    "user": os.getenv("GARAGENS_USER"),
    "password": os.getenv("GARAGENS_PASS"),
}

METRO_DB = {
    "dsn": os.getenv("METRO_DSN"),
    "user": os.getenv("METRO_USER"),
    "password": os.getenv("METRO_PASS"),
}

CPTM_DB = {
    "dsn": os.getenv("CPTM_DSN"),
    "user": os.getenv("CPTM_USER"),
    "password": os.getenv("CPTM_PASS"),
}

GARAGENS = [
    {"nome": "BB / RALIP", "schema": "GA_BENFIC", "tp_ids": ["6", "7"]},
    {"nome": "VIAÇÃO MIRACATIBA LTDA", "schema": "GA_MIRCBA", "tp_ids": ["8"]},
    {"nome": "AUTO ÔNIBUS MORATENSE LTDA", "schema": "GA_MRATEN", "tp_ids": ["12"]},
    {"nome": "TIPBUS TRANSPORTE INTERMUNICIP", "schema": "GA_TIPBSV", "tp_ids": ["13"]},
    {"nome": "VIAÇÃO OSASCO MATRIZ LTDA", "schema": "GA_OSASCO", "tp_ids": ["15"]},
    {"nome": "VIACAO OSASCO LTDA - FILIAL", "schema": "GA_OSASCOFL", "tp_ids": ["16"]},
    {"nome": "DEL REY TRANSPORTES LTDA", "schema": "GA_DELREY", "tp_ids": ["21"]},
    {"nome": "NEXT MOBILIDADE SIST.EXISTENTE", "schema": "GA_METRA", "tp_ids": ["26"]},
    {"nome": "NEXT MOBILIDADE SIST REMANESCE", "schema": "GA_NEXT", "tp_ids": ["27"]},
    {"nome": "PÁSSARO MARRON SANTA ISABEL / UNILESTE", "schema": "GA_PMARROM", "tp_ids": ["29", "30"]},
    {"nome": "AUTO VIAÇÃO URUBUPUNGÁ LTDA", "schema": "GA_URUBPG", "tp_ids": ["32"]},
    {"nome": "EMPRESA DE TRANSPORTES MAIRIPORÃ", "schema": "GA_MAIRIP", "tp_ids": ["33"]},
    {"nome": "ETT CARAPICUIBA", "schema": "GA_ETTCRBA", "tp_ids": ["35"]},
    {"nome": "ARUJA TRANSPORTES COLETIVOS / MUNI", "schema": "GA_VLGAL03", "tp_ids": ["41", "42"]},
    {"nome": "VIAÇÃO CIDADE DE CAIEIRAS LTDA", "schema": "GA_CAIERS", "tp_ids": ["45"]},
    {"nome": "ALTO TIETE TRANSPORTES LTDA", "schema": "GA_ATIETE", "tp_ids": ["48"]},
    {"nome": "RADIAL SUZANO INTERMUNICIPAL", "schema": "GA_RADSUZ", "tp_ids": ["50"]},
    {"nome": "VIAÇÃO JACAREÍ LTDA", "schema": "GA_JACREI", "tp_ids": ["51"]},
    {"nome": "VIACAO RAPOSO TAVARES MUNI / LTDA", "schema": "GA_RAPOSO", "tp_ids": ["53", "54"]},
    {"nome": "VIAÇÃO PIRAJUÇARA / MUNICIPAL", "schema": "GA_PIRJRA", "tp_ids": ["60", "61"]},
    {"nome": "VIAÇÃO TALISMÃ - MUNI", "schema": "GA_TALISMA", "tp_ids": ["64"]},
    {"nome": "ALTO TIETE TRANSPORTE LTDA", "schema": "GA_RADIAL", "tp_ids": ["186"]},
]

TRILHOS = [
    {"nome": "METRO", "base": "METRO", "trilhos_db": "metro", "tp_id": "1"},
    {"nome": "CPTM", "base": "CPTM", "trilhos_db": "cptm", "tp_id": "2"},
    {"nome": "VIA 4", "base": "METRO", "trilhos_db": "metro", "tp_id": "3"},
    {"nome": "VIA MOBILIDADE", "base": "METRO", "trilhos_db": "metro", "tp_id": "4"},
    {"nome": "VIA MOBILIDADE 8 e 9", "base": "CPTM", "trilhos_db": "cptm", "tp_id": "122"},
]


# -----------------------------------------------------------------------------
# API
# -----------------------------------------------------------------------------
class PeriodPayload(BaseModel):
    mode: str | None = None
    start: str
    end: str


class ComparePayload(BaseModel):
    scope: Literal["garagens", "trilhos"]
    period: PeriodPayload


app = FastAPI(title="Painel Autopass - API de Comparação", version="1.0.0")

cors_origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "*").split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def parse_date(value: str) -> datetime:
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M"):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            pass
    raise HTTPException(status_code=400, detail=f"Data inválida: {value}")


def br_datetime(value: datetime) -> str:
    return value.strftime("%d/%m/%Y %H:%M:%S")


def require_config(config: dict[str, str | None], label: str) -> None:
    missing = [key for key, value in config.items() if not value]
    if missing:
        raise HTTPException(
            status_code=500,
            detail=f"Configuração incompleta para {label}: faltando {', '.join(missing)} no .env",
        )


def connect(config: dict[str, str | None], label: str):
    require_config(config, label)
    try:
        return oracledb.connect(user=config["user"], password=config["password"], dsn=config["dsn"])
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erro ao conectar em {label}: {exc}") from exc


def fetch_filenames(conn, sql: str, tp_id: str, inicio: datetime, fim: datetime) -> set[str]:
    pattern = f"%TOP_{tp_id}\\_%"
    try:
        with conn.cursor() as cur:
            cur.execute(sql, {"pattern": pattern, "inicio": inicio, "fim": fim})
            return {str(row[0]).strip().upper() for row in cur.fetchall() if row and row[0]}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erro ao executar query do TP_ID {tp_id}: {exc}") from exc


def query_autopass() -> str:
    return """
        SELECT DLF_FILENAME
        FROM devicelogfiles
        WHERE UPPER(dlf_filename) LIKE :pattern ESCAPE '\\'
          AND dlf_dtconn >= :inicio
          AND dlf_dtconn <= :fim
    """


def query_garagem(schema: str) -> str:
    # Schema vem de lista fixa acima, não do usuário.
    return f"""
        SELECT DLF_FILENAME
        FROM {schema}.devicelogfiles
        WHERE UPPER(dlf_filename) LIKE :pattern ESCAPE '\\'
          AND dlf_dtconn >= :inicio
          AND dlf_dtconn <= :fim
    """


def query_trilhos(trilhos_db: str) -> str:
    # Mesmo comportamento da automação enviada:
    # Metro usa qrcode.devicelogfiles; CPTM usa devicelogfiles no schema padrão.
    table = "qrcode.devicelogfiles" if trilhos_db == "metro" else "devicelogfiles"
    return f"""
        SELECT DLF_FILENAME
        FROM {table}
        WHERE UPPER(dlf_filename) LIKE :pattern ESCAPE '\\'
          AND dlf_dtconn >= :inicio
          AND dlf_dtconn <= :fim
    """


def response_meta(scope_label: str, inicio: datetime, fim: datetime) -> dict:
    return {
        "sourceLabel": "API Oracle interna",
        "periodLabel": f"{br_datetime(inicio)} até {br_datetime(fim)}",
        "generatedAt": br_datetime(datetime.now()),
        "modeLabel": f"Valores reais Autopass x {scope_label}",
    }


def compare_garagens(inicio: datetime, fim: datetime) -> dict:
    conn_auto = connect(AUTOPASS, "Autopass")
    conn_gar = connect(GARAGENS_DB, "Garagens")
    summary: list[dict] = []
    details: list[dict] = []

    try:
        for item in GARAGENS:
            arquivos_origem: set[str] = set()
            arquivos_autopass: set[str] = set()

            for tp_id in item["tp_ids"]:
                arquivos_origem |= fetch_filenames(conn_gar, query_garagem(item["schema"]), tp_id, inicio, fim)
                arquivos_autopass |= fetch_filenames(conn_auto, query_autopass(), tp_id, inicio, fim)

            so_origem = sorted(arquivos_origem - arquivos_autopass)
            so_autopass = sorted(arquivos_autopass - arquivos_origem)
            status = "Divergente" if so_origem or so_autopass else "OK"

            summary.append({
                "alvo": item["nome"],
                "schemaBase": item["schema"],
                "tpId": ", ".join(item["tp_ids"]),
                "origem": len(arquivos_origem),
                "autopass": len(arquivos_autopass),
                "originOnly": len(so_origem),
                "autopassOnly": len(so_autopass),
                "status": status,
            })

            for arquivo in so_origem:
                details.append({
                    "alvo": item["nome"],
                    "schemaBase": item["schema"],
                    "tpId": ", ".join(item["tp_ids"]),
                    "arquivo": arquivo,
                    "situacao": "Só na Garagem",
                    "situacaoTipo": "origem",
                })
            for arquivo in so_autopass:
                details.append({
                    "alvo": item["nome"],
                    "schemaBase": item["schema"],
                    "tpId": ", ".join(item["tp_ids"]),
                    "arquivo": arquivo,
                    "situacao": "Só no Autopass",
                    "situacaoTipo": "autopass",
                })
    finally:
        conn_auto.close()
        conn_gar.close()

    return {**response_meta("Garagens", inicio, fim), "summary": summary, "details": details}


def compare_trilhos(inicio: datetime, fim: datetime) -> dict:
    conn_auto = connect(AUTOPASS, "Autopass")
    conn_metro = connect(METRO_DB, "Metro")
    conn_cptm = connect(CPTM_DB, "CPTM")
    trilhos_conns = {"metro": conn_metro, "cptm": conn_cptm}

    summary: list[dict] = []
    details: list[dict] = []

    try:
        for item in TRILHOS:
            tp_id = item["tp_id"]
            conn_tri = trilhos_conns[item["trilhos_db"]]

            arquivos_origem = fetch_filenames(conn_tri, query_trilhos(item["trilhos_db"]), tp_id, inicio, fim)
            arquivos_autopass = fetch_filenames(conn_auto, query_autopass(), tp_id, inicio, fim)

            so_origem = sorted(arquivos_origem - arquivos_autopass)
            so_autopass = sorted(arquivos_autopass - arquivos_origem)
            status = "Divergente" if so_origem or so_autopass else "OK"

            summary.append({
                "alvo": item["nome"],
                "schemaBase": item["base"],
                "tpId": tp_id,
                "origem": len(arquivos_origem),
                "autopass": len(arquivos_autopass),
                "originOnly": len(so_origem),
                "autopassOnly": len(so_autopass),
                "status": status,
            })

            for arquivo in so_origem:
                details.append({
                    "alvo": item["nome"],
                    "schemaBase": item["base"],
                    "tpId": tp_id,
                    "arquivo": arquivo,
                    "situacao": "Só nos Trilhos",
                    "situacaoTipo": "origem",
                })
            for arquivo in so_autopass:
                details.append({
                    "alvo": item["nome"],
                    "schemaBase": item["base"],
                    "tpId": tp_id,
                    "arquivo": arquivo,
                    "situacao": "Só no Autopass",
                    "situacaoTipo": "autopass",
                })
    finally:
        conn_auto.close()
        conn_metro.close()
        conn_cptm.close()

    return {**response_meta("Trilhos", inicio, fim), "summary": summary, "details": details}


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/api/comparacao")
def comparar(payload: ComparePayload) -> dict:
    inicio = parse_date(payload.period.start)
    fim = parse_date(payload.period.end)

    if fim <= inicio:
        raise HTTPException(status_code=400, detail="A data final precisa ser maior que a data inicial.")

    if payload.scope == "garagens":
        return compare_garagens(inicio, fim)
    return compare_trilhos(inicio, fim)
