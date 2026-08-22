from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from sqlalchemy import func

from datetime import datetime, timedelta


from database import get_db

from models.venda import Venda

from models.despesa import Despesa



router = APIRouter(
    prefix="/relatorios",
    tags=["Relatórios"]
)



@router.get("/financeiro")
def relatorio_financeiro(
    db:Session=Depends(get_db)
):


    hoje=datetime.now().date()



    inicio_semana = hoje - timedelta(
        days=hoje.weekday()
    )



    inicio_mes = hoje.replace(
        day=1
    )



    vendas_dia=db.query(
        func.sum(Venda.total)
    ).filter(
        func.date(Venda.data_venda)==hoje
    ).scalar() or 0



    vendas_semana=db.query(
        func.sum(Venda.total)
    ).filter(
        Venda.data_venda>=inicio_semana
    ).scalar() or 0




    vendas_mes=db.query(
        func.sum(Venda.total)
    ).filter(
        Venda.data_venda>=inicio_mes
    ).scalar() or 0





    despesas_mes=db.query(
        func.sum(Despesa.valor)
    ).filter(
        Despesa.data_despesa>=inicio_mes
    ).scalar() or 0




    return {


        "vendas":{

            "dia":vendas_dia,

            "semana":vendas_semana,

            "mes":vendas_mes

        },


        "despesas_mes":despesas_mes,


        "lucro_mes":
            vendas_mes - despesas_mes

    }