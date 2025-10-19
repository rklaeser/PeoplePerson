"""
Migration script to add location fields to people and tags tables.
Run this once to add the new columns to the database.
"""

from sqlalchemy import text
from database import engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def migrate():
    """Add location fields to people and tags tables"""

    with engine.connect() as connection:
        # Start a transaction
        trans = connection.begin()

        try:
            logger.info("Adding location columns to people table...")

            # Add columns to people table
            connection.execute(text("""
                ALTER TABLE people
                ADD COLUMN IF NOT EXISTS street_address VARCHAR,
                ADD COLUMN IF NOT EXISTS city VARCHAR,
                ADD COLUMN IF NOT EXISTS state VARCHAR,
                ADD COLUMN IF NOT EXISTS latitude FLOAT,
                ADD COLUMN IF NOT EXISTS longitude FLOAT
            """))

            logger.info("Adding location columns to tags table...")

            # Add columns to tags table
            connection.execute(text("""
                ALTER TABLE tags
                ADD COLUMN IF NOT EXISTS street_address VARCHAR,
                ADD COLUMN IF NOT EXISTS city VARCHAR,
                ADD COLUMN IF NOT EXISTS state VARCHAR,
                ADD COLUMN IF NOT EXISTS zip VARCHAR,
                ADD COLUMN IF NOT EXISTS latitude FLOAT,
                ADD COLUMN IF NOT EXISTS longitude FLOAT
            """))

            # Commit the transaction
            trans.commit()
            logger.info("Migration completed successfully!")

        except Exception as e:
            # Rollback on error
            trans.rollback()
            logger.error(f"Migration failed: {e}")
            raise


if __name__ == "__main__":
    logger.info("Starting location fields migration...")
    migrate()
    logger.info("Done!")
