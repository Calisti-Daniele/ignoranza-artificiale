"""Initial schema — hall_of_shame_entries and shame_upvotes tables.

Revision ID: 0001
Revises: (none)
Create Date: 2026-04-13
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # Reusable trigger function — updates updated_at on every row UPDATE.
    # ------------------------------------------------------------------
    op.execute(
        """
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """
    )

    # ------------------------------------------------------------------
    # Table: hall_of_shame_entries
    # ------------------------------------------------------------------
    op.create_table(
        "hall_of_shame_entries",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column(
            "conversation_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            unique=True,
        ),
        sa.Column("slug", sa.String(128), nullable=False, unique=True),
        sa.Column("title", sa.String(256), nullable=False),
        sa.Column("transcript", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column(
            "agent_slugs",
            postgresql.ARRAY(sa.String(64)),
            nullable=False,
            server_default=sa.text("'{}'"),
        ),
        sa.Column("submitter_session_id", sa.String(128), nullable=False),
        sa.Column(
            "upvote_count",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column(
            "is_featured",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("FALSE"),
        ),
        sa.Column(
            "is_hidden",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("FALSE"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    # Indexes for hall_of_shame_entries
    op.create_index(
        "ix_shame_conversation_id",
        "hall_of_shame_entries",
        ["conversation_id"],
        unique=True,
    )
    op.create_index(
        "ix_shame_slug",
        "hall_of_shame_entries",
        ["slug"],
        unique=True,
    )
    op.create_index(
        "ix_shame_created_at",
        "hall_of_shame_entries",
        [sa.text("created_at DESC")],
        unique=False,
    )
    op.create_index(
        "ix_shame_upvote_count",
        "hall_of_shame_entries",
        [sa.text("upvote_count DESC")],
        unique=False,
    )
    op.create_index(
        "ix_shame_is_hidden",
        "hall_of_shame_entries",
        ["is_hidden"],
        unique=False,
    )
    # GIN index for agent_slugs ARRAY column
    op.create_index(
        "ix_shame_agent_slugs",
        "hall_of_shame_entries",
        ["agent_slugs"],
        unique=False,
        postgresql_using="gin",
    )

    # BEFORE UPDATE trigger to maintain updated_at
    op.execute(
        """
        CREATE TRIGGER trg_shame_entries_updated_at
        BEFORE UPDATE ON hall_of_shame_entries
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """
    )

    # ------------------------------------------------------------------
    # Table: shame_upvotes
    # ------------------------------------------------------------------
    op.create_table(
        "shame_upvotes",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column(
            "entry_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("hall_of_shame_entries.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("voter_session_id", sa.String(128), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    # Indexes for shame_upvotes
    op.create_index(
        "ix_upvotes_entry_id",
        "shame_upvotes",
        ["entry_id"],
        unique=False,
    )
    op.create_index(
        "uq_upvotes_entry_voter",
        "shame_upvotes",
        ["entry_id", "voter_session_id"],
        unique=True,
    )


def downgrade() -> None:
    # Drop trigger before dropping the table it references.
    op.execute(
        "DROP TRIGGER IF EXISTS trg_shame_entries_updated_at ON hall_of_shame_entries;"
    )

    # Drop tables in dependency order (child first).
    op.drop_table("shame_upvotes")
    op.drop_table("hall_of_shame_entries")

    # Drop the trigger function last.
    op.execute("DROP FUNCTION IF EXISTS update_updated_at_column();")
