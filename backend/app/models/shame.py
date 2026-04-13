"""
SQLAlchemy 2.x mapped models for Hall of Shame feature.
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class HallOfShameEntry(Base):
    __tablename__ = "hall_of_shame_entries"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        unique=True,
        nullable=False,
    )
    slug: Mapped[str] = mapped_column(
        String(128),
        unique=True,
        nullable=False,
    )
    title: Mapped[str] = mapped_column(
        String(256),
        nullable=False,
    )
    transcript: Mapped[list] = mapped_column(
        JSONB,
        nullable=False,
    )
    agent_slugs: Mapped[list[str]] = mapped_column(
        ARRAY(String(64)),
        nullable=False,
        server_default=text("'{}'"),
    )
    submitter_session_id: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
    )
    upvote_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default=text("0"),
    )
    is_featured: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("FALSE"),
    )
    is_hidden: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("FALSE"),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("NOW()"),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("NOW()"),
    )

    # Relationships
    upvotes: Mapped[list["ShameUpvote"]] = relationship(
        "ShameUpvote",
        back_populates="entry",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class ShameUpvote(Base):
    __tablename__ = "shame_upvotes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    entry_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hall_of_shame_entries.id", ondelete="CASCADE"),
        nullable=False,
    )
    voter_session_id: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("NOW()"),
    )

    # Relationships
    entry: Mapped["HallOfShameEntry"] = relationship(
        "HallOfShameEntry",
        back_populates="upvotes",
    )
