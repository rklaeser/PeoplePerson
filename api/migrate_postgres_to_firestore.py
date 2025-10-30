#!/usr/bin/env python3
"""
Migrate data from PostgreSQL to Firestore

This script migrates all user data from PostgreSQL to Firestore,
transforming the relational schema to Firestore's nested collection structure.

Firestore structure:
users/{userId}/
  people/{personId}
  people/{personId}/memories/{memoryId}
  people/{personId}/messages/{messageId}
  people/{personId}/history/{historyId}
  tags/{tagId}
  entries/{entryId}

Prerequisites:
1. Start Cloud SQL proxy: make sql
2. Set FIREBASE_PROJECT_ID in .env or use Application Default Credentials
3. Ensure api/.env has correct DATABASE_URL

Usage:
    cd api
    source venv/bin/activate
    python migrate_postgres_to_firestore.py [--dry-run] [--user-email EMAIL]
"""

import os
import sys
from datetime import datetime
from typing import Dict, List, Any
import argparse
from dotenv import load_dotenv
from sqlmodel import Session, select, create_engine
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1.base_query import FieldFilter

# Import models
from models import (
    User, Person, Tag, PersonTag, NotebookEntry, Message,
    History, Entry, EntryPerson, MessageDirection
)

load_dotenv()


def init_firebase():
    """Initialize Firebase Admin SDK"""
    if not firebase_admin._apps:
        # Try to use Application Default Credentials first
        try:
            firebase_admin.initialize_app()
            print("✓ Using Application Default Credentials")
        except Exception as e:
            print(f"✗ Failed to initialize Firebase: {e}")
            print("\nMake sure you're authenticated with gcloud:")
            print("  gcloud auth application-default login")
            sys.exit(1)

    return firestore.client()


def init_postgres():
    """Initialize PostgreSQL connection"""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("✗ DATABASE_URL not found in .env")
        sys.exit(1)

    return create_engine(database_url)


def convert_datetime(dt: datetime) -> datetime:
    """Convert datetime to Firestore timestamp"""
    return dt if dt else datetime.utcnow()


def migrate_user_data(pg_session: Session, fs_db, user: User, dry_run: bool = False):
    """Migrate a single user's data to Firestore"""

    user_id = user.firebase_uid
    print(f"\n{'[DRY RUN] ' if dry_run else ''}Migrating user: {user.email} ({user_id})")

    stats = {
        'people': 0,
        'tags': 0,
        'memories': 0,
        'messages': 0,
        'history': 0,
        'entries': 0,
    }

    # Get user's people
    people = pg_session.exec(
        select(Person).where(Person.user_id == user.id)
    ).all()

    print(f"  Found {len(people)} people")

    for person in people:
        person_data = {
            'name': person.name,
            'body': person.body,
            'birthday': person.birthday,
            'mnemonic': person.mnemonic,
            'zip': person.zip,
            'profilePicIndex': person.profile_pic_index,
            'email': person.email,
            'phoneNumber': person.phone_number,
            'lastContactDate': convert_datetime(person.last_contact_date),
            'streetAddress': person.street_address,
            'city': person.city,
            'state': person.state,
            'latitude': person.latitude,
            'longitude': person.longitude,
            'createdAt': convert_datetime(person.created_at),
            'updatedAt': convert_datetime(person.updated_at),
        }

        # Get person's tags
        person_tags = pg_session.exec(
            select(PersonTag).where(PersonTag.person_id == person.id)
        ).all()
        person_data['tagIds'] = [str(pt.tag_id) for pt in person_tags]

        if not dry_run:
            person_ref = fs_db.collection(f'users/{user_id}/people').document(str(person.id))
            person_ref.set(person_data)

        stats['people'] += 1

        # Migrate person's memories (notebook entries)
        memories = pg_session.exec(
            select(NotebookEntry).where(NotebookEntry.person_id == person.id)
        ).all()

        for memory in memories:
            memory_data = {
                'entryDate': memory.entry_date,
                'content': memory.content,
                'createdAt': convert_datetime(memory.created_at),
                'updatedAt': convert_datetime(memory.updated_at),
            }

            if not dry_run:
                memory_ref = fs_db.collection(f'users/{user_id}/people/{person.id}/memories').document(memory.entry_date)
                memory_ref.set(memory_data)

            stats['memories'] += 1

        # Migrate person's messages
        messages = pg_session.exec(
            select(Message).where(Message.person_id == person.id)
        ).all()

        for message in messages:
            message_data = {
                'body': message.body,
                'direction': message.direction.value,
                'sentAt': convert_datetime(message.sent_at),
                'createdAt': convert_datetime(message.created_at),
                'updatedAt': convert_datetime(message.updated_at),
            }

            if not dry_run:
                message_ref = fs_db.collection(f'users/{user_id}/people/{person.id}/messages').document(str(message.id))
                message_ref.set(message_data)

            stats['messages'] += 1

        # Migrate person's history
        histories = pg_session.exec(
            select(History).where(History.person_id == person.id)
        ).all()

        for history in histories:
            history_data = {
                'changeType': history.change_type.value,
                'field': history.field,
                'detail': history.detail,
                'createdAt': convert_datetime(history.created_at),
                'updatedAt': convert_datetime(history.updated_at),
            }

            if not dry_run:
                history_ref = fs_db.collection(f'users/{user_id}/people/{person.id}/history').document(str(history.id))
                history_ref.set(history_data)

            stats['history'] += 1

    # Migrate user's tags
    tags = pg_session.exec(
        select(Tag).where(Tag.user_id == user.id)
    ).all()

    print(f"  Found {len(tags)} tags")

    for tag in tags:
        # Count how many people have this tag
        person_count = pg_session.exec(
            select(PersonTag).where(PersonTag.tag_id == tag.id)
        ).all()

        tag_data = {
            'name': tag.name,
            'category': tag.category,
            'color': tag.color,
            'description': tag.description,
            'streetAddress': tag.street_address,
            'city': tag.city,
            'state': tag.state,
            'zip': tag.zip,
            'latitude': tag.latitude,
            'longitude': tag.longitude,
            'personCount': len(person_count),
            'createdAt': convert_datetime(tag.created_at),
            'updatedAt': convert_datetime(tag.updated_at),
        }

        if not dry_run:
            tag_ref = fs_db.collection(f'users/{user_id}/tags').document(str(tag.id))
            tag_ref.set(tag_data)

        stats['tags'] += 1

    # Migrate user's entries (journal entries)
    entries = pg_session.exec(
        select(Entry).where(Entry.user_id == user.id)
    ).all()

    print(f"  Found {len(entries)} entries")

    for entry in entries:
        # Get associated person IDs
        entry_people = pg_session.exec(
            select(EntryPerson).where(EntryPerson.entry_id == entry.id)
        ).all()

        entry_data = {
            'content': entry.content,
            'processingStatus': entry.processing_status.value,
            'processingResult': entry.processing_result,
            'personIds': [str(ep.person_id) for ep in entry_people],
            'createdAt': convert_datetime(entry.created_at),
            'updatedAt': convert_datetime(entry.updated_at),
        }

        if not dry_run:
            entry_ref = fs_db.collection(f'users/{user_id}/entries').document(str(entry.id))
            entry_ref.set(entry_data)

        stats['entries'] += 1

    # Print stats
    print(f"\n  Migration stats:")
    for key, value in stats.items():
        print(f"    {key}: {value}")

    return stats


def main():
    parser = argparse.ArgumentParser(description='Migrate PostgreSQL data to Firestore')
    parser.add_argument('--dry-run', action='store_true', help='Simulate migration without writing to Firestore')
    parser.add_argument('--user-email', type=str, help='Migrate only a specific user by email')
    args = parser.parse_args()

    print("=" * 60)
    print("PostgreSQL → Firestore Migration")
    print("=" * 60)

    if args.dry_run:
        print("\n⚠️  DRY RUN MODE - No data will be written to Firestore\n")

    # Initialize connections
    print("\n1. Initializing connections...")
    pg_engine = init_postgres()
    fs_db = init_firebase()

    print("✓ PostgreSQL connected")
    print("✓ Firestore connected")

    # Get users to migrate
    print("\n2. Fetching users from PostgreSQL...")
    with Session(pg_engine) as session:
        if args.user_email:
            users = session.exec(
                select(User).where(User.email == args.user_email)
            ).all()
            if not users:
                print(f"✗ User not found: {args.user_email}")
                sys.exit(1)
        else:
            users = session.exec(select(User)).all()

        print(f"✓ Found {len(users)} user(s) to migrate")

        # Migrate each user
        print("\n3. Migrating user data...")
        total_stats = {
            'people': 0,
            'tags': 0,
            'memories': 0,
            'messages': 0,
            'history': 0,
            'entries': 0,
        }

        for user in users:
            user_stats = migrate_user_data(session, fs_db, user, dry_run=args.dry_run)
            for key in total_stats:
                total_stats[key] += user_stats[key]

        print("\n" + "=" * 60)
        print("Migration Complete!")
        print("=" * 60)
        print(f"\nTotal migrated:")
        for key, value in total_stats.items():
            print(f"  {key}: {value}")

        if args.dry_run:
            print("\n⚠️  This was a DRY RUN - no data was written")
            print("Run without --dry-run to perform actual migration")


if __name__ == "__main__":
    main()
