from __future__ import annotations

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .db import Base


class Drug(Base):
    __tablename__ = "drugs"

    id = Column(Integer, primary_key=True, index=True)
    drug_name = Column(String(200), unique=True, index=True, nullable=False)
    generic_name = Column(String(200), nullable=True)
    standard_dosage_min = Column(Float, nullable=False, default=0.0)
    standard_dosage_max = Column(Float, nullable=False, default=0.0)
    common_side_effects = Column(Text, nullable=True)
    drug_class = Column(String(200), nullable=True)

    prescriptions = relationship("Prescription", back_populates="drug")


class DrugInteraction(Base):
    __tablename__ = "drug_interactions"

    id = Column(Integer, primary_key=True, index=True)
    drug_a = Column(String(200), nullable=False, index=True)
    drug_b = Column(String(200), nullable=False, index=True)
    severity = Column(String(50), nullable=False)
    warning = Column(Text, nullable=False)
    description = Column(Text, nullable=False)


class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    image_name = Column(String(255), nullable=True)
    patient_notes = Column(Text, nullable=True)
    raw_extracted_text = Column(Text, nullable=True)
    authenticity_score = Column(String(50), nullable=False)
    confidence_score = Column(Float, nullable=False, default=0.0)
    possible_condition = Column(Text, nullable=True)
    analysis_data = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False)
    drug_id = Column(Integer, ForeignKey("drugs.id"), nullable=True)

    drug = relationship("Drug", back_populates="prescriptions")


class VerificationLog(Base):
    __tablename__ = "verification_logs"

    id = Column(Integer, primary_key=True, index=True)
    prescription_id = Column(Integer, nullable=False)
    drug_name = Column(String(200), nullable=False)
    matched_name = Column(String(200), nullable=True)
    dosage_prescribed = Column(String(80), nullable=True)
    safe_range = Column(String(120), nullable=True)
    dosage_flag = Column(Boolean, nullable=False, default=False)
    interaction_warning = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False)
