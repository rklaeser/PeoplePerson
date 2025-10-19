#!/usr/bin/env python3
"""
Migration script to convert intent-based categories to health score system

This script:
1. Adds last_contact_date column to people table
2. Backfills last_contact_date from most recent message
3. Drops the intent column
4. Preserves all existing data

Usage:
    python migrate_to_health_score.py [--dry-run]
"""

import argparse
from datetime import datetime
from sqlalchemy import text
from sqlmodel import Session
from database import SessionLocal, engine
from models import Person, Message, SQLModel


def migrate_to_health_score(dry_run: bool = True):
    """
    Migrate from intent categories to health score system

    Args:
        dry_run: If True, only print what would be done without making changes
    """
    db = SessionLocal()

    try:
        if dry_run:
            print("\n--- DRY RUN MODE - No changes will be made ---")
        else:
            print("\n--- MIGRATING TO HEALTH SCORE SYSTEM ---")

        # Step 1: Add last_contact_date column if it doesn't exist
        print("\n1. Adding last_contact_date column...")
        if not dry_run:
            try:
                # Try to add the column - will fail silently if it already exists
                db.execute(text("""
                    ALTER TABLE people
                    ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                """))
                db.commit()
                print("   ✓ Column added")
            except Exception as e:
                # Column might already exist
                db.rollback()
                print(f"   ℹ Column may already exist: {e}")
        else:
            print("   Would add last_contact_date column")

        # Step 2: Backfill last_contact_date from most recent message
        print("\n2. Backfilling last_contact_date from messages...")

        # Count people that will be updated
        result = db.execute(text("""
            SELECT COUNT(*) as count
            FROM people p
            WHERE EXISTS (
                SELECT 1 FROM messages m WHERE m."personId" = p.id
            )
        """))
        people_with_messages = result.scalar()

        result = db.execute(text("""
            SELECT COUNT(*) as count
            FROM people p
            WHERE NOT EXISTS (
                SELECT 1 FROM messages m WHERE m."personId" = p.id
            )
        """))
        people_without_messages = result.scalar()

        print(f"   People with messages: {people_with_messages}")
        print(f"   People without messages: {people_without_messages}")

        if not dry_run:
            # Update people with messages - set to most recent message date
            db.execute(text("""
                UPDATE people p
                SET last_contact_date = (
                    SELECT MAX(m."sentAt")
                    FROM messages m
                    WHERE m."personId" = p.id
                )
                WHERE EXISTS (
                    SELECT 1 FROM messages m WHERE m."personId" = p.id
                )
            """))

            # Update people without messages - set to created_at
            db.execute(text("""
                UPDATE people
                SET last_contact_date = "createdAt"
                WHERE last_contact_date IS NULL
            """))

            db.commit()
            print("   ✓ Backfill completed")
        else:
            print("   Would backfill last_contact_date from messages")

        # Step 3: Drop intent column
        print("\n3. Dropping intent column...")
        if not dry_run:
            try:
                # Check if column exists before dropping
                result = db.execute(text("""
                    SELECT COUNT(*)
                    FROM pragma_table_info('people')
                    WHERE name='intent'
                """))
                column_exists = result.scalar() > 0

                if column_exists:
                    db.execute(text("ALTER TABLE people DROP COLUMN intent"))
                    db.commit()
                    print("   ✓ Intent column dropped")
                else:
                    print("   ℹ Intent column already removed")
            except Exception as e:
                db.rollback()
                print(f"   ⚠ Could not drop intent column: {e}")
        else:
            print("   Would drop intent column")

        # Print summary
        print("\n--- MIGRATION SUMMARY ---")
        print(f"Total people in database: {people_with_messages + people_without_messages}")
        print(f"People with message history: {people_with_messages}")
        print(f"People without messages (using created_at): {people_without_messages}")

        if dry_run:
            print("\nThis was a dry run. Use --no-dry-run to apply changes.")
        else:
            print("\n✓ Migration completed successfully!")
            print("\nIntent system removed, health score system ready to use.")

    except Exception as e:
        print(f"\n✗ Error during migration: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Migrate to health score system")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        default=True,
        help="Show what would be done without making changes (default)"
    )
    parser.add_argument(
        "--no-dry-run",
        action="store_true",
        help="Actually perform the migration"
    )

    args = parser.parse_args()

    # Determine dry_run mode
    dry_run = args.dry_run and not args.no_dry_run

    migrate_to_health_score(dry_run=dry_run)


if __name__ == "__main__":
    main()
