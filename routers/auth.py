from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db

from models.usuario import Usuario

from schemas.usuario import (
    UsuarioCreate,
    UsuarioLogin,
    UsuarioResponse
)

from passlib.context import CryptContext


router = APIRouter(
    prefix="/auth",
    tags=["Autenticacao"]
)


# =========================
# SENHAS
# =========================

pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto"
)


def criar_hash(senha):

    return pwd_context.hash(senha)



def verificar_senha(
    senha,
    senha_hash
):

    return pwd_context.verify(
        senha,
        senha_hash
    )


# =========================
# REGISTRO
# =========================

@router.post(
    "/registro",
    response_model=UsuarioResponse
)
async def criar_usuario(
    dados: UsuarioCreate,
    db: AsyncSession = Depends(get_db)
):

    result = await db.execute(
        select(Usuario).where(
            Usuario.email == dados.email
        )
    )

    existe = result.scalar_one_or_none()


    if existe:

        raise HTTPException(
            status_code=400,
            detail="Email já cadastrado"
        )


    novo_usuario = Usuario(

        nome=dados.nome,

        email=dados.email,

        senha_hash=criar_hash(
            dados.senha
        ),

        tipo=dados.tipo
    )


    db.add(novo_usuario)


    await db.commit()


    await db.refresh(
        novo_usuario
    )


    return novo_usuario



# =========================
# LOGIN
# =========================

@router.post("/login")
async def login(
    dados: UsuarioLogin,
    db: AsyncSession = Depends(get_db)
):


    result = await db.execute(
        select(Usuario).where(
            Usuario.email == dados.email
        )
    )


    usuario = result.scalar_one_or_none()



    if usuario is None:

        raise HTTPException(
            status_code=401,
            detail="Usuário não encontrado"
        )



    senha_ok = verificar_senha(
        dados.senha,
        usuario.senha_hash
    )



    if not senha_ok:

        raise HTTPException(
            status_code=401,
            detail="Senha incorreta"
        )



    return {

        "mensagem": "Login efetuado",

        "usuario": {

            "id": usuario.id,

            "nome": usuario.nome,

            "tipo": usuario.tipo

        }

    }

# =========================
# LISTAR USUÁRIOS
# =========================

@router.get("/usuarios")
async def listar_usuarios(
    db: AsyncSession = Depends(get_db)
):

    result = await db.execute(
        select(Usuario)
    )

    usuarios = result.scalars().all()


    return usuarios



# =========================
# ATUALIZAR USUÁRIO
# =========================

@router.put("/usuarios/{usuario_id}")
async def atualizar_usuario(
    usuario_id:int,
    dados:UsuarioCreate,
    db:AsyncSession = Depends(get_db)
):


    result = await db.execute(
        select(Usuario).where(
            Usuario.id == usuario_id
        )
    )


    usuario = result.scalar_one_or_none()



    if not usuario:

        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )



    usuario.nome = dados.nome

    usuario.email = dados.email

    usuario.tipo = dados.tipo


    if dados.senha:

        usuario.senha_hash = criar_hash(
            dados.senha
        )



    await db.commit()

    await db.refresh(usuario)


    return usuario





# =========================
# APAGAR USUÁRIO
# =========================

@router.delete("/usuarios/{usuario_id}")
async def apagar_usuario(
    usuario_id:int,
    db:AsyncSession = Depends(get_db)
):


    result = await db.execute(
        select(Usuario).where(
            Usuario.id == usuario_id
        )
    )


    usuario = result.scalar_one_or_none()



    if not usuario:

        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )


    await db.delete(usuario)


    await db.commit()



    return {

        "mensagem":
        "Usuário removido"

    }
