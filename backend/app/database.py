import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Load variables from the .env file
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# The engine is the core connection to the database
engine = create_engine(DATABASE_URL)

# A session is one "conversation" with the database
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class that our table models will inherit from
Base = declarative_base()


# Dependency: gives a database session to a request, then closes it
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()