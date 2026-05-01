from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import datetime

class HCP(Base):
    __tablename__ = "hcps"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    specialty = Column(String)

    interactions = relationship("Interaction", back_populates="hcp")

class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    hcp_id = Column(Integer, ForeignKey("hcps.id"))
    date = Column(DateTime, default=datetime.datetime.utcnow)
    interaction_type = Column(String)
    notes = Column(Text)
    sentiment = Column(String)
    summary = Column(Text)

    hcp = relationship("HCP", back_populates="interactions")

class FollowUp(Base):
    __tablename__ = "follow_ups"

    id = Column(Integer, primary_key=True, index=True)
    interaction_id = Column(Integer, ForeignKey("interactions.id"))
    hcp_id = Column(Integer, ForeignKey("hcps.id"))
    scheduled_date = Column(DateTime)
    description = Column(Text)
    status = Column(String, default="Pending")
