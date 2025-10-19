#!/usr/bin/env python3
"""
Migration script to convert Person.body notes to NotebookEntry records

This script:
1. Creates the notebookEntries table if it doesn't exist
2. Migrates existing Person.body data to NotebookEntry with entry_date = created_at
3. Preserves all existing data - does NOT delete Person.body field

Usage:
    python migrate_notes_to_notebook.py [--dry-run]
"""

import argparse
from datetime import datetime
from sqlmodel import Session, select
from database import SessionLocal, engine
from models import Person, NotebookEntry, SQLModel


def migrate_notes_to_notebook(dry_run: bool = True):
    """
    Migrate all Person.body notes to NotebookEntry records

    Args:
        dry_run: If True, only print what would be done without making changes
    """
    # First, ensure the notebookEntries table exists
    if not dry_run:
        print("Creating notebookEntries table if it doesn't exist...")
        SQLModel.metadata.create_all(engine)
        print("Table creation complete.")
    else:
        print("--- DRY RUN MODE - Table would be created ---")

    db = SessionLocal()

    try:
        # Get all people with non-empty body fields
        people_query = select(Person).where(
            Person.body != "",
            Person.body != "Add a description",
            Person.body.isnot(None)
        )
        people = db.exec(people_query).all()

        if not people:
            print("\nNo people with notes found to migrate.")
            return

        print(f"\nFound {len(people)} people with notes to migrate:")

        if dry_run:
            print("\n--- DRY RUN MODE - No changes will be made ---")
        else:
            print(f"\n--- MIGRATING {len(people)} NOTES ---")

        # Track migration statistics
        entries_created = 0
        entries_skipped = 0

        for person in people:
            # Use person's creation date as the entry date
            entry_date = person.created_at.date().isoformat()

            # Check if an entry already exists for this person on this date
            existing_entry_query = select(NotebookEntry).where(
                NotebookEntry.person_id == person.id,
                NotebookEntry.entry_date == entry_date
            )
            existing_entry = db.exec(existing_entry_query).first()

            if existing_entry:
                print(f"Entry for {person.name} on {entry_date} already exists, skipping")
                entries_skipped += 1
                continue

            if not dry_run:
                # Create new notebook entry from person.body
                entry = NotebookEntry(
                    person_id=person.id,
                    user_id=person.user_id,
                    entry_date=entry_date,
                    content=person.body,
                    created_at=person.created_at,
                    updated_at=person.created_at
                )
                db.add(entry)
                entries_created += 1
                print(f"Created entry for {person.name} on {entry_date} ({len(person.body)} chars)")
            else:
                print(f"Would create entry for {person.name} on {entry_date} ({len(person.body)} chars)")
                entries_created += 1

        if not dry_run:
            db.commit()
            print(f"\nCommitted all changes to database")

        # Print summary
        print(f"\n--- MIGRATION SUMMARY ---")
        print(f"Entries created: {entries_created}")
        print(f"Entries skipped (already exist): {entries_skipped}")
        print(f"Total people processed: {len(people)}")

        if dry_run:
            print("\nThis was a dry run. Use --no-dry-run to apply changes.")
        else:
            print("\nMigration completed successfully!")
            print("\nNote: Person.body fields have been preserved and not modified.")
            print("You can clean these up later after verifying the migration.")

    except Exception as e:
        print(f"Error during migration: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Migrate Person notes to NotebookEntries")
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

    migrate_notes_to_notebook(dry_run=dry_run)


if __name__ == "__main__":
    main()
