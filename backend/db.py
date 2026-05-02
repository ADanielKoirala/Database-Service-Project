import psycopg2
from config import config


def get_db():
    return psycopg2.connect(
        dbname=config.database_name,
        user=config.database_user,
        password=config.database_password,
        host=config.database_host,
        port=config.database_port,
    )
