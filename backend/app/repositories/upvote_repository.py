"""
Repository for shame_upvotes table.

Provides:
- has_voted: check whether a session has already voted on an entry
- add_vote: insert upvote record AND atomically increment denormalized counter
"""

import logging
import uuid

from sqlalchemy import select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.shame import HallOfShameEntry, ShameUpvote
from app.repositories.base_repository import BaseRepository
from app.schemas.shame import ShameEntryCreate

logger = logging.getLogger(__name__)


class UpvoteRepository(BaseRepository[ShameUpvote, ShameEntryCreate, ShameEntryCreate]):
    """Operations on the shame_upvotes table."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(ShameUpvote, session)

    async def has_voted(self, entry_id: uuid.UUID, voter_session_id: str) -> bool:
        """
        Return True if voter_session_id has already upvoted entry_id.

        This is the DB-side check (used as fallback when Redis is unavailable).
        """
        stmt = select(ShameUpvote.id).where(
            ShameUpvote.entry_id == entry_id,
            ShameUpvote.voter_session_id == voter_session_id,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none() is not None

    async def add_vote(self, entry_id: uuid.UUID, voter_session_id: str) -> int:
        """
        Insert an upvote record and atomically increment the denormalized counter.

        The UPDATE uses the form `upvote_count = upvote_count + 1` — no SELECT needed,
        no TOCTOU race. The INSERT is done first so that if the UNIQUE constraint
        fires (race condition), the IntegrityError propagates before we touch the counter.

        Returns the new upvote_count after increment.

        Raises:
            sqlalchemy.exc.IntegrityError: if the UNIQUE constraint on
                (entry_id, voter_session_id) fires — caller handles as 409.

        Does NOT call commit().
        """
        # Step 1: Insert upvote record (will raise IntegrityError on duplicate).
        upvote = ShameUpvote(
            entry_id=entry_id,
            voter_session_id=voter_session_id,
        )
        self.session.add(upvote)
        await self.session.flush()  # Trigger UNIQUE constraint check here.

        # Step 2: Atomic increment of the denormalized counter.
        stmt = (
            update(HallOfShameEntry)
            .where(HallOfShameEntry.id == entry_id)
            .values(upvote_count=HallOfShameEntry.upvote_count + 1)
            .returning(HallOfShameEntry.upvote_count)
        )
        result = await self.session.execute(stmt)
        new_count: int = result.scalar_one()
        await self.session.flush()

        logger.info(
            "Upvote registrato: entry_id='%s', nuovo conteggio=%d",
            entry_id,
            new_count,
        )
        return new_count
