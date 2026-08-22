import os
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from fastapi.responses import FileResponse

from database import Base, engine


# =====================================================
# ROUTERS
# =====================================================

from routers import (
    auth,
    dashboard,
    produtos,
    categorias,
    vendas,
    stock,
    caixa,
    despesas,
    despesa_fora_caixa,
    relatorios,
    lucros,
    configuracao,
    investimentos
)


# =====================================================
# CAMINHOS
# =====================================================

BASE_DIR = Path(__file__).resolve().parent

STATIC_DIR = BASE_DIR / "static"

TEMPLATES_DIR = BASE_DIR / "templates"

# Service Worker está na raiz do projeto
SERVICE_WORKER_FILE = BASE_DIR / "service-worker.js"

# =====================================================
# ANDROID DIGITAL ASSET LINKS
# =====================================================
#
# O arquivo está agora na raiz:
#
# .well-known/
#     assetlinks.json
#
# URL pública:
#
# https://celso.onrender.com/.well-known/assetlinks.json
#
# =====================================================

WELL_KNOWN_DIR = BASE_DIR / ".well-known"

ASSETLINKS_FILE = (
    WELL_KNOWN_DIR / "assetlinks.json"
)


# =====================================================
# TEMPLATES
# =====================================================

templates = Jinja2Templates(
    directory=str(TEMPLATES_DIR)
)


# =====================================================
# APP
# =====================================================

is_production = (
    os.getenv("ENV") == "production"
)


app = FastAPI(
    title="PDV",
    version="1.0.0",

    docs_url=(
        None
        if is_production
        else "/docs"
    ),

    redoc_url=(
        None
        if is_production
        else "/redoc"
    )
)


# =====================================================
# STATIC
# =====================================================

app.mount(
    "/static",
    StaticFiles(
        directory=str(STATIC_DIR)
    ),
    name="static"
)


# =====================================================
# SERVICE WORKER
# =====================================================
#
# Arquivo físico:
#
# service-worker.js
#
# Localização:
#
# BASE_DIR / service-worker.js
#
# URL pública:
#
# https://celso.onrender.com/service-worker.js
#
# O scope será "/".
# =====================================================

@app.get(
    "/service-worker.js",
    include_in_schema=False
)
async def service_worker():

    return FileResponse(
        path=SERVICE_WORKER_FILE,
        media_type="application/javascript",
        headers={
            "Service-Worker-Allowed": "/"
        }
    )


# =====================================================
# ANDROID DIGITAL ASSET LINKS
# =====================================================
#
# Arquivo físico:
#
# .well-known/assetlinks.json
#
# Localização:
#
# BASE_DIR / .well-known / assetlinks.json
#
# URL pública:
#
# https://celso.onrender.com/.well-known/assetlinks.json
#
# =====================================================

@app.get(
    "/.well-known/assetlinks.json",
    include_in_schema=False
)
async def assetlinks():

    return FileResponse(
        path=ASSETLINKS_FILE,
        media_type="application/json"
    )


# =====================================================
# CORS
# =====================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "*"
    ],

    allow_credentials=True,

    allow_methods=[
        "*"
    ],

    allow_headers=[
        "*"
    ],
)


# =====================================================
# STARTUP
# =====================================================

@app.on_event("startup")
async def startup():

    async with engine.begin() as conn:

        await conn.run_sync(
            Base.metadata.create_all
        )

    print(
        "✅ Banco de dados conectado"
    )

    print(
        "✅ Sistema Bar do Celso iniciado"
    )


# =====================================================
# PÁGINA PRINCIPAL
# =====================================================

@app.get("/")
async def home(
    request: Request
):

    return templates.TemplateResponse(
        "dashboard.html",
        {
            "request": request
        }
    )


# =====================================================
# DASHBOARD
# =====================================================

@app.get("/dashboard")
async def dashboard_page(
    request: Request
):

    return templates.TemplateResponse(
        "dashboard.html",
        {
            "request": request
        }
    )


# =====================================================
# ROTAS API
# =====================================================

app.include_router(
    auth.router
)

app.include_router(
    dashboard.router
)

app.include_router(
    produtos.router
)

app.include_router(
    categorias.router
)

app.include_router(
    vendas.router
)

app.include_router(
    stock.router
)

app.include_router(
    caixa.router
)

app.include_router(
    despesas.router
)

app.include_router(
    despesa_fora_caixa.router
)

app.include_router(
    relatorios.router
)

app.include_router(
    lucros.router
)

app.include_router(
    configuracao.router
)
app.include_router(
    investimentos.router
)