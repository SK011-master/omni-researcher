# backend/app/models.py
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base

class ResearchSession(Base):
    __tablename__ = "research_sessions"

    # The unique ID for each research run
    id = Column(Integer, primary_key=True, index=True)
    
    # The user's original prompt
    task = Column(String, index=True, nullable=False)
    
    # The raw notes gathered by the Researcher Agent
    research_data = Column(Text, nullable=True)
    
    # The final formatted Markdown output
    final_report = Column(Text, nullable=True)
    
    # An automatic timestamp of when the research was conducted
    created_at = Column(DateTime(timezone=True), server_default=func.now())