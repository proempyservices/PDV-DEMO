from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db

from models.categoria import Categoria

from schemas.categoria import (
    CategoriaCreate,
    CategoriaUpdate,
    CategoriaResponse
)


router = APIRouter(
    prefix="/categorias",
    tags=["Categorias"]
)



# ==========================
# LISTAR
# ==========================

@router.get(
    "/",
    response_model=list[CategoriaResponse]
)
async def listar_categorias(
    db: AsyncSession = Depends(get_db)
):

    resultado = await db.execute(
        select(Categoria)
    )

    categorias = resultado.scalars().all()

    return categorias



# ==========================
# CRIAR
# ==========================

@router.post(
    "/",
    response_model=CategoriaResponse
)
async def criar_categoria(
    dados: CategoriaCreate,
    db: AsyncSession = Depends(get_db)
):

    resultado = await db.execute(
        select(Categoria).where(
            Categoria.nome == dados.nome
        )
    )

    existe = resultado.scalar_one_or_none()


    if existe:

        raise HTTPException(
            status_code=400,
            detail="Categoria já existe"
        )


    categoria = Categoria(
        nome=dados.nome,
        descricao=dados.descricao
    )


    db.add(categoria)

    await db.commit()

    await db.refresh(categoria)


    return categoria



# ==========================
# ATUALIZAR
# ==========================

@router.put(
    "/{categoria_id}",
    response_model=CategoriaResponse
)
async def atualizar_categoria(
    categoria_id: int,
    dados: CategoriaUpdate,
    db: AsyncSession = Depends(get_db)
):

    resultado = await db.execute(
        select(Categoria).where(
            Categoria.id == categoria_id
        )
    )

    categoria = resultado.scalar_one_or_none()


    if not categoria:

        raise HTTPException(
            status_code=404,
            detail="Categoria não encontrada"
        )


    for campo, valor in dados.model_dump(
        exclude_unset=True
    ).items():

        setattr(
            categoria,
            campo,
            valor
        )


    await db.commit()

    await db.refresh(categoria)


    return categoria



# ==========================
# APAGAR (DESATIVAR)
# ==========================

@router.delete("/{categoria_id}")
async def apagar_categoria(
    categoria_id: int,
    db: AsyncSession = Depends(get_db)
):

    resultado = await db.execute(
        select(Categoria).where(
            Categoria.id == categoria_id
        )
    )

    categoria = resultado.scalar_one_or_none()


    if not categoria:

        raise HTTPException(
            status_code=404,
            detail="Categoria não encontrada"
        )


    await db.delete(categoria)

    await db.commit()


    return {
        "mensagem": "Categoria apagada"
    }
