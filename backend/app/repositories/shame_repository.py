"""
Repository for hall_of_shame_entries table.

Provides:
- Paginated gallery listing with sort options and optional agent filter
- Get by public slug
- Upsert (insert or update) keyed on conversation_id + submitter_session_id
- Soft-delete via is_hidden flag
"""

import logging
import math
import uuid
from typing import Literal

from sqlalchemy import String, cast, func, select, update
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.shame import HallOfShameEntry
from app.repositories.base_repository import BaseRepository
from app.schemas.shame import ShameEntryCreate

logger = logging.getLogger(__name__)


class ShameRepository(BaseRepository[HallOfShameEntry, ShameEntryCreate, ShameEntryCreate]):
    """Operations on the hall_of_shame_entries table."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(HallOfShameEntry, session)

    async def get_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        sort_by: Literal["recent", "top"] = "recent",
        agent_slug_filter: str | None = None,
    ) -> tuple[list[HallOfShameEntry], int]:
        """
        Return a page of non-hidden entries plus total count.

        Returns:
            (entries, total_count)
        """
        base_stmt = select(HallOfShameEntry).where(HallOfShameEntry.is_hidden.is_(False))

        # Optional filter: entries where agent_slugs contains the given slug.
        if agent_slug_filter is not None:
            # Use the @> (contains) operator for GIN-indexed ARRAY column.
            base_stmt = base_stmt.where(
                HallOfShameEntry.agent_slugs.contains(
                    cast([agent_slug_filter], ARRAY(String(64)))
                )
            )

        # Count total matching rows.
        count_stmt = select(func.count()).select_from(base_stmt.subquery())
        total_result = await self.session.execute(count_stmt)
        total: int = total_result.scalar_one()

        # Apply sort order.
        if sort_by == "top":
            base_stmt = base_stmt.order_by(
                HallOfShameEntry.upvote_count.desc(),
                HallOfShameEntry.created_at.desc(),
            )
        else:
            base_stmt = base_stmt.order_by(HallOfShameEntry.created_at.desc())

        # Pagination.
        offset = (page - 1) * page_size
        paged_stmt = base_stmt.offset(offset).limit(page_size)

        result = await self.session.execute(paged_stmt)
        entries = list(result.scalars().all())

        return entries, total

    async def get_by_slug(self, slug: str) -> HallOfShameEntry | None:
        """Fetch a visible entry by its public slug. Returns None if not found or hidden."""
        stmt = select(HallOfShameEntry).where(
            HallOfShameEntry.slug == slug,
            HallOfShameEntry.is_hidden.is_(False),
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_conversation_id(self, conversation_id: uuid.UUID) -> HallOfShameEntry | None:
        """Fetch an entry by conversation_id regardless of visibility."""
        stmt = select(HallOfShameEntry).where(
            HallOfShameEntry.conversation_id == conversation_id
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def upsert(
        self,
        conversation_id: uuid.UUID,
        submitter_session_id: str,
        data: ShameEntryCreate,
        generated_slug: str,
    ) -> tuple[HallOfShameEntry, bool]:
        """
        Insert or update an entry keyed on conversation_id.

        - If no row with this conversation_id exists → insert with the generated_slug.
        - If a row exists AND submitter_session_id matches → update transcript/title/agent_slugs.
        - If a row exists but submitter_session_id does NOT match → return (entry, False)
          without modifying anything. The caller raises 403 FORBIDDEN.

        Returns:
            (entry, is_new): is_new=True on insert, False on update.

        Does NOT call commit().
        """
        existing = await self.get_by_conversation_id(conversation_id)

        if existing is None:
            # Insert new entry.
            new_entry = HallOfShameEntry(
                conversation_id=conversation_id,
                slug=generated_slug,
                title=data.title,
                transcript=[msg.model_dump(mode="json") for msg in data.transcript],
                agent_slugs=data.agent_slugs,
                submitter_session_id=submitter_session_id,
            )
            self.session.add(new_entry)
            await self.session.flush()
            await self.session.refresh(new_entry)
            logger.info("Nuova entry Hall of Shame creata: slug='%s'", new_entry.slug)
            return new_entry, True

        # Row exists — check ownership.
        if existing.submitter_session_id != submitter_session_id:
            # Caller must raise 403 FORBIDDEN; we return the existing entry as context.
            return existing, False

        # Ownership confirmed — update mutable fields.
        existing.title = data.title
        existing.transcript = [msg.model_dump(mode="json") for msg in data.transcript]
        existing.agent_slugs = data.agent_slugs
        # updated_at is managed by the PostgreSQL trigger — no need to set here.
        self.session.add(existing)
        await self.session.flush()
        await self.session.refresh(existing)
        logger.info("Entry Hall of Shame aggiornata: slug='%s'", existing.slug)
        return existing, False

    async def soft_delete(self, slug: str) -> bool:
        """
        Set is_hidden=True for the entry with this slug.

        Returns True if the entry was found and hidden, False if not found.
        Does NOT call commit().
        """
        stmt = (
            update(HallOfShameEntry)
            .where(HallOfShameEntry.slug == slug)
            .values(is_hidden=True)
            .returning(HallOfShameEntry.id)
        )
        result = await self.session.execute(stmt)
        row = result.fetchone()
        await self.session.flush()
        if row is not None:
            logger.info("Entry nascosta (soft-delete): slug='%s'", slug)
            return True
        return False
