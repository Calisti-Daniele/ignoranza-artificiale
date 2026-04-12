"""
Generic async base repository providing common CRUD abstractions
over a SQLAlchemy AsyncSession.

Design constraints:
- NEVER calls session.commit() — commit/rollback is managed by get_db() dependency.
- Uses session.flush() when the generated PK is needed within the same transaction.
- Uses model_dump() (Pydantic V2) — never .dict().
"""

from typing import Any, Generic, TypeVar

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base

ModelT = TypeVar("ModelT", bound=Base)
CreateSchemaT = TypeVar("CreateSchemaT", bound=BaseModel)
UpdateSchemaT = TypeVar("UpdateSchemaT", bound=BaseModel)


class BaseRepository(Generic[ModelT, CreateSchemaT, UpdateSchemaT]):
    """Generic async CRUD repository."""

    def __init__(self, model: type[ModelT], session: AsyncSession) -> None:
        self.model = model
        self.session = session

    async def get_by_id(self, record_id: Any) -> ModelT | None:
        """Fetch a single record by primary key. Returns None if not found."""
        result = await self.session.get(self.model, record_id)
        return result

    async def get_all(self) -> list[ModelT]:
        """Fetch all records of this model type."""
        stmt = select(self.model)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, schema: CreateSchemaT) -> ModelT:
        """
        Insert a new record.

        Calls flush() so the generated PK is available before the transaction commits.
        Does NOT call commit().
        """
        data = schema.model_dump()
        instance = self.model(**data)
        self.session.add(instance)
        await self.session.flush()
        await self.session.refresh(instance)
        return instance

    async def update(self, instance: ModelT, schema: UpdateSchemaT) -> ModelT:
        """
        Apply partial updates from a Pydantic schema to an existing ORM instance.

        Uses model_dump(exclude_unset=True) to only overwrite provided fields.
        Calls flush() but NOT commit().
        """
        update_data = schema.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(instance, field, value)
        self.session.add(instance)
        await self.session.flush()
        await self.session.refresh(instance)
        return instance

    async def delete(self, instance: ModelT) -> None:
        """Hard-delete a record. Calls flush() but NOT commit()."""
        await self.session.delete(instance)
        await self.session.flush()
