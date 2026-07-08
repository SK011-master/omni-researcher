# backend/app/database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# SQLAlchemy requires 'postgresql://' not 'postgres://' (a common cloud database quirk)
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create the SQLAlchemy engine
engine = create_engine(DATABASE_URL)

# Create a session maker to manage database transactions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for our database models
Base = declarative_base()

# Dependency function to get a database session for our API routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()