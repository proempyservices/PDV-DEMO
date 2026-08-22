import ssl

from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession
)

from sqlalchemy.orm import (
    sessionmaker,
    declarative_base
)


# ==========================
# DATABASE URL
# ==========================
DATABASE_URL = (
    "postgresql+asyncpg://"
    "neondb_owner:npg_aGyLhNVD5Ie7@"
    "ep-gentle-bird-aylptvjm-pooler.c-5.us-east-2.aws.neon.tech/"
    "neondb"
)



# ==========================
# SSL NEON
# ==========================

ssl_context = ssl.create_default_context()


# ==========================
# ENGINE
# ==========================

engine = create_async_engine(

    DATABASE_URL,

    echo=True,

    connect_args={
        "ssl": ssl_context
    },


    # evita conexões mortas do Neon
    pool_pre_ping=True,

    # recicla conexões antigas
    pool_recycle=300,

    pool_size=5,

    max_overflow=10

)



# ==========================
# SESSION
# ==========================

SessionLocal = sessionmaker(

    bind=engine,

    class_=AsyncSession,

    expire_on_commit=False

)



# ==========================
# BASE
# ==========================

Base = declarative_base()



# ==========================
# DEPENDENCY FASTAPI
# ==========================

async def get_db():

    async with SessionLocal() as session:

        try:

            yield session

        finally:

            await session.close()