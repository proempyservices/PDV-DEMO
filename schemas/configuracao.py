from pydantic import BaseModel, Field


class ConfiguracaoResponse(BaseModel):

    id: int

    percentual_saque: float


class ConfiguracaoUpdate(BaseModel):

    percentual_saque: float = Field(
        ...,
        ge=0,
        le=100
    )