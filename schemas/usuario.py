from pydantic import BaseModel, EmailStr
from datetime import datetime


# Dados recebidos para criar usuário
class UsuarioCreate(BaseModel):

    nome: str

    email: EmailStr

    senha: str

    tipo: str = "vendedor"



# Dados usados no login
class UsuarioLogin(BaseModel):

    email: EmailStr

    senha: str



# Resposta da API
class UsuarioResponse(BaseModel):

    id: int

    nome: str

    email: EmailStr

    tipo: str

    ativo: bool

    criado_em: datetime


    class Config:

        from_attributes = True