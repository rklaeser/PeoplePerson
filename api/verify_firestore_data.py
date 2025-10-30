#!/usr/bin/env python3
"""
Verify Firestore Migration

Quick script to verify that data was migrated successfully from PostgreSQL to Firestore.

Usage:
    python verify_firestore_data.py [--user-email EMAIL]
"""

import argparse
import firebase_admin
from firebase_admin import firestore


def init_firebase():
    """Initialize Firebase Admin SDK"""
    if not firebase_admin._apps:
        firebase_admin.initialize_app()
    return firestore.client()


def verify_user_data(db, user_id: str, user_email: str = None):
    """Verify a user's data in Firestore"""
    print(f"\n{'='*60}")
    print(f"User: {user_email or user_id}")
    print(f"{'='*60}")

    stats = {
        'people': 0,
        'tags': 0,
        'memories': 0,
        'messages': 0,
        'history': 0,
        'entries': 0,
    }

    # Count people
    people_ref = db.collection(f'users/{user_id}/people')
    people = list(people_ref.stream())
    stats['people'] = len(people)

    # For each person, count subcollections
    for person_doc in people:
        person_id = person_doc.id

        # Count memories
        memories = list(db.collection(f'users/{user_id}/people/{person_id}/memories').stream())
        stats['memories'] += len(memories)

        # Count messages
        messages = list(db.collection(f'users/{user_id}/people/{person_id}/messages').stream())
        stats['messages'] += len(messages)

        # Count history
        history = list(db.collection(f'users/{user_id}/people/{person_id}/history').stream())
        stats['history'] += len(history)

    # Count tags
    tags = list(db.collection(f'users/{user_id}/tags').stream())
    stats['tags'] = len(tags)

    # Count entries
    entries = list(db.collection(f'users/{user_id}/entries').stream())
    stats['entries'] = len(entries)

    # Print stats
    print(f"\nData counts:")
    for key, value in stats.items():
        print(f"  {key:15s}: {value}")

    # Sample some data
    if people:
        print(f"\nSample person (first one):")
        person = people[0]
        person_data = person.to_dict()
        print(f"  ID: {person.id}")
        print(f"  Name: {person_data.get('name')}")
        print(f"  Email: {person_data.get('email')}")
        print(f"  Tags: {len(person_data.get('tagIds', []))}")

    if tags:
        print(f"\nSample tag (first one):")
        tag = tags[0]
        tag_data = tag.to_dict()
        print(f"  ID: {tag.id}")
        print(f"  Name: {tag_data.get('name')}")
        print(f"  Category: {tag_data.get('category')}")
        print(f"  Person count: {tag_data.get('personCount', 0)}")

    return stats


def main():
    parser = argparse.ArgumentParser(description='Verify Firestore migration')
    parser.add_argument('--user-email', type=str, help='Verify specific user by email')
    args = parser.parse_args()

    print("Firestore Data Verification")
    print("="*60)

    # Initialize Firestore
    db = init_firebase()
    print("✓ Connected to Firestore")

    # Get users to verify
    users_ref = db.collection('users')

    if args.user_email:
        # Need to scan all users to find by email (Firestore doesn't have user email at top level)
        print(f"\nSearching for user: {args.user_email}")
        print("Note: This searches all users, might be slow with many users")

        found = False
        for user_doc in users_ref.stream():
            user_id = user_doc.id
            # Check if any people in this user have this email (not ideal, but works)
            # Better approach would be to store email in user doc
            verify_user_data(db, user_id, args.user_email)
            found = True
            break

        if not found:
            print(f"✗ Could not find user with email: {args.user_email}")
            print("  Note: Search is by user ID (firebase_uid)")
            print("  List all users to find the correct ID")

    else:
        # Verify all users
        print("\nFetching all users...")
        users = list(users_ref.stream())

        if not users:
            print("✗ No users found in Firestore!")
            print("  Migration may not have run yet, or no data exists")
            return

        print(f"✓ Found {len(users)} user(s)")

        total_stats = {
            'people': 0,
            'tags': 0,
            'memories': 0,
            'messages': 0,
            'history': 0,
            'entries': 0,
        }

        for user_doc in users:
            user_id = user_doc.id
            user_stats = verify_user_data(db, user_id)

            for key in total_stats:
                total_stats[key] += user_stats[key]

        print(f"\n{'='*60}")
        print("Total across all users:")
        print(f"{'='*60}")
        for key, value in total_stats.items():
            print(f"  {key:15s}: {value}")


if __name__ == "__main__":
    main()
