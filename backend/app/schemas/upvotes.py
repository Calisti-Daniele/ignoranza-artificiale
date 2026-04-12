"""
Pydantic V2 schemas for upvote responses.
"""

from pydantic import BaseModel, ConfigDict


class UpvoteResponse(BaseModel):
    """Response body for POST /shame/{slug}/upvote."""

    model_config = ConfigDict(from_attributes=True)

    slug: str
    upvote_count: int
