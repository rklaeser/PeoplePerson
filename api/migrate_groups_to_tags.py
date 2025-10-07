#!/usr/bin/env python3
"""
Migration script to convert Groups to Tags with category "group"

This script:
1. Reads all existing Groups
2. Creates corresponding Tags with category="group" 
3. Converts GroupAssociations to PersonTags
4. Optionally removes old Group data after confirmation

Usage:
    python migrate_groups_to_tags.py [--dry-run] [--delete-groups]
"""

import argparse
import sys
from sqlmodel import Session, select
from database import SessionLocal
from models import Group, GroupAssociation, Tag, PersonTag


def migrate_groups_to_tags(dry_run: bool = True, delete_groups: bool = False):
    """
    Migrate all groups to tags with category 'group'
    
    Args:
        dry_run: If True, only print what would be done without making changes
        delete_groups: If True, delete old group data after migration
    """
    db = SessionLocal()
    
    try:
        # Get all groups
        groups_query = select(Group)
        groups = db.exec(groups_query).all()
        
        if not groups:
            print("No groups found to migrate.")
            return
        
        print(f"Found {len(groups)} groups to migrate:")
        for group in groups:
            print(f"  - {group.name} (ID: {group.id}, User: {group.user_id})")
        
        if dry_run:
            print("\n--- DRY RUN MODE - No changes will be made ---")
        else:
            print(f"\n--- MIGRATING {len(groups)} GROUPS ---")
        
        # Track migration statistics
        tags_created = 0
        associations_migrated = 0
        groups_deleted = 0
        
        for group in groups:
            # Check if tag with same name already exists for this user
            existing_tag_query = select(Tag).where(
                Tag.user_id == group.user_id,
                Tag.name == group.name,
                Tag.category == "group"
            )
            existing_tag = db.exec(existing_tag_query).first()
            
            if existing_tag:
                print(f"Tag '{group.name}' already exists for user {group.user_id}, using existing tag")
                tag = existing_tag
            else:
                # Create new tag from group
                tag_data = {
                    "name": group.name,
                    "category": "group",
                    "description": group.description,
                    "user_id": group.user_id
                }
                
                if not dry_run:
                    tag = Tag(**tag_data)
                    db.add(tag)
                    db.commit()
                    db.refresh(tag)
                    tags_created += 1
                    print(f"Created tag: {tag.name}")
                else:
                    print(f"Would create tag: {group.name} (category: group)")
                    # For dry run, create a mock tag object
                    tag = type('MockTag', (), {'id': f'mock-{group.id}'})()
            
            # Get all group associations for this group
            associations_query = select(GroupAssociation).where(
                GroupAssociation.group_id == group.id
            )
            associations = db.exec(associations_query).all()
            
            print(f"  Found {len(associations)} associations to migrate")
            
            for assoc in associations:
                # Check if person-tag association already exists
                if not dry_run:
                    existing_person_tag_query = select(PersonTag).where(
                        PersonTag.person_id == assoc.person_id,
                        PersonTag.tag_id == tag.id
                    )
                    existing_person_tag = db.exec(existing_person_tag_query).first()
                    
                    if existing_person_tag:
                        print(f"    Person-tag association already exists, skipping")
                        continue
                    
                    # Create PersonTag from GroupAssociation
                    person_tag = PersonTag(
                        person_id=assoc.person_id,
                        tag_id=tag.id
                    )
                    db.add(person_tag)
                    associations_migrated += 1
                    print(f"    Migrated association: Person {assoc.person_id} -> Tag {tag.id}")
                else:
                    print(f"    Would migrate: Person {assoc.person_id} -> Tag {tag.name}")
                    associations_migrated += 1
        
        if not dry_run:
            db.commit()
            print(f"\nCommitted all changes to database")
        
        # Delete old group data if requested
        if delete_groups and not dry_run:
            print(f"\n--- DELETING OLD GROUP DATA ---")
            for group in groups:
                # First delete all associations
                associations_query = select(GroupAssociation).where(
                    GroupAssociation.group_id == group.id
                )
                associations = db.exec(associations_query).all()
                for assoc in associations:
                    db.delete(assoc)
                
                # Then delete the group
                db.delete(group)
                groups_deleted += 1
                print(f"Deleted group: {group.name}")
            
            db.commit()
            print(f"Deleted {groups_deleted} groups and their associations")
        
        elif delete_groups and dry_run:
            print(f"\n--- WOULD DELETE {len(groups)} GROUPS ---")
            for group in groups:
                print(f"Would delete group: {group.name}")
        
        # Print summary
        print(f"\n--- MIGRATION SUMMARY ---")
        print(f"Tags created: {tags_created}")
        print(f"Associations migrated: {associations_migrated}")
        if delete_groups:
            print(f"Groups deleted: {groups_deleted}")
        
        if dry_run:
            print("\nThis was a dry run. Use --no-dry-run to apply changes.")
        else:
            print("\nMigration completed successfully!")
    
    except Exception as e:
        print(f"Error during migration: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Migrate Groups to Tags")
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
    parser.add_argument(
        "--delete-groups", 
        action="store_true", 
        help="Delete old group data after migration (USE WITH CAUTION)"
    )
    
    args = parser.parse_args()
    
    # Determine dry_run mode
    dry_run = args.dry_run and not args.no_dry_run
    
    if not dry_run and args.delete_groups:
        print("WARNING: You are about to delete all group data!")
        print("This operation cannot be undone.")
        confirm = input("Type 'DELETE' to confirm: ")
        if confirm != "DELETE":
            print("Migration aborted.")
            sys.exit(1)
    
    migrate_groups_to_tags(dry_run=dry_run, delete_groups=args.delete_groups)


if __name__ == "__main__":
    main()