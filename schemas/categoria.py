from pydantic import BaseModel
from datetime import datetime



class CategoriaCreate(BaseModel):

    nome: str

    descricao: str | None = None



class CategoriaUpdate(BaseModel):

    nome: str | None = None

    descricao: str | None = None

    ativo: bool | None = None



class CategoriaResponse(BaseModel):

    id: int

    nome: str

    descricao: str | None

    ativo: bool

    criado_em: datetime



    class Config:

        from_attributes = True