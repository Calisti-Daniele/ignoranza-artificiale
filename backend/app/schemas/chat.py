"""
Pydantic V2 schemas for Chat endpoint.
"""

from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class MessageItem(BaseModel):
    """A single message in the conversation history."""

    model_config = ConfigDict(from_attributes=True)

    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    """Request body for POST /chat/stream."""

    model_config = ConfigDict(from_attributes=True)

    message: str = Field(..., min_length=1, max_length=4000, description="The user's current message")
    agent_slug: str | None = Field(
        default=None,
        description="Force routing to a specific agent. If null, Master Agent selects.",
    )
    conversation_history: list[MessageItem] = Field(
        default_factory=list,
        max_length=40,
        description="Previous messages to provide context. Client manages this state.",
    )
    conversation_id: UUID | None = Field(
        default=None,
        description="Client-generated UUID identifying this conversation session.",
    )
