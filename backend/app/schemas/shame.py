"""
Pydantic V2 schemas for Hall of Shame feature.

Covers: transcript messages, submit request/response, list response,
entry detail response.
"""

import uuid
from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class UserTranscriptMessage(BaseModel):
    """A transcript message authored by the user."""

    model_config = ConfigDict(from_attributes=True)

    role: Literal["user"]
    content: str = Field(..., min_length=1, max_length=4000)
    timestamp: datetime


class AgentTranscriptMessage(BaseModel):
    """A transcript message authored by an agent."""

    model_config = ConfigDict(from_attributes=True)

    role: Literal["agent"]
    content: str = Field(..., min_length=1, max_length=4000)
    timestamp: datetime
    agent_slug: str = Field(..., max_length=64)
    agent_name: str = Field(..., max_length=128)


# Discriminated union for transcript messages — avoids isinstance checks at validation time.
TranscriptMessage = Annotated[
    UserTranscriptMessage | AgentTranscriptMessage,
    Field(discriminator="role"),
]


class ShameEntryCreate(BaseModel):
    """Request body for POST /shame (upsert a Hall of Shame entry)."""

    model_config = ConfigDict(from_attributes=True)

    conversation_id: uuid.UUID = Field(..., description="Client-generated UUID for deduplication")
    title: str = Field(..., min_length=3, max_length=256)
    transcript: list[TranscriptMessage] = Field(..., min_length=2, max_length=200)
    agent_slugs: list[str] = Field(..., min_length=1, max_length=10)

    @model_validator(mode="after")
    def validate_transcript_has_both_roles(self) -> "ShameEntryCreate":
        roles = {msg.role for msg in self.transcript}
        if "user" not in roles:
            raise ValueError("Il transcript deve contenere almeno un messaggio dell'utente.")
        if "agent" not in roles:
            raise ValueError("Il transcript deve contenere almeno un messaggio dell'agente.")
        return self

    @model_validator(mode="after")
    def validate_agent_slugs_max_length(self) -> "ShameEntryCreate":
        for slug in self.agent_slugs:
            if len(slug) > 64:
                raise ValueError(f"Lo slug agente '{slug}' supera i 64 caratteri.")
        return self


class ShameSubmitResponse(BaseModel):
    """Response body for POST /shame."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    title: str
    public_url: str
    created_at: datetime


class ShameEntryCard(BaseModel):
    """A single entry in the Hall of Shame gallery list view (no full transcript)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    title: str
    agent_slugs: list[str]
    upvote_count: int
    is_featured: bool
    preview: str = Field(..., description="First agent message truncated to 200 chars")
    created_at: datetime


class PaginationMeta(BaseModel):
    """Pagination metadata for list responses."""

    page: int
    page_size: int
    total_entries: int
    total_pages: int


class ShameListResponse(BaseModel):
    """Paginated gallery response for GET /shame."""

    model_config = ConfigDict(from_attributes=True)

    entries: list[ShameEntryCard]
    pagination: PaginationMeta


class ShameEntryDetail(BaseModel):
    """Full detail response for GET /shame/{slug}."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    title: str
    agent_slugs: list[str]
    upvote_count: int
    is_featured: bool
    transcript: list[TranscriptMessage]
    created_at: datetime
