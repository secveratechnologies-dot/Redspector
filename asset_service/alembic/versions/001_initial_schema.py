"""initial_schema

Revision ID: 001
Revises: 
Create Date: 2026-06-22 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table('assets',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('type', sa.String(), nullable=False),
    sa.Column('value', sa.String(), nullable=False),
    sa.Column('status', sa.String(), nullable=True),
    sa.Column('tags', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('tenant_id', 'value', name='uix_tenant_asset_value')
    )
    op.create_index(op.f('ix_assets_tenant_id'), 'assets', ['tenant_id'], unique=False)
    # GIN index for JSONB tags
    op.execute('CREATE INDEX ix_assets_tags ON assets USING gin (tags);')
    
    op.create_table('asset_metadata',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('asset_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('source', sa.String(), nullable=False),
    sa.Column('data', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('discovered_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['asset_id'], ['assets.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    # GIN index for JSONB data
    op.execute('CREATE INDEX ix_asset_metadata_data ON asset_metadata USING gin (data);')

def downgrade() -> None:
    op.execute('DROP INDEX ix_asset_metadata_data;')
    op.drop_table('asset_metadata')
    
    op.execute('DROP INDEX ix_assets_tags;')
    op.drop_index(op.f('ix_assets_tenant_id'), table_name='assets')
    op.drop_table('assets')
