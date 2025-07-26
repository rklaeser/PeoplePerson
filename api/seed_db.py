#!/usr/bin/env python3
"""
Database seeding script for FastAPI
Replicates the data from the SvelteKit seed.ts file
"""

import asyncio
import uuid
from ai_service.database import engine, SessionLocal, User, Person, Group, GroupAssociation, PersonAssociation, IntentEnum, Base
from sqlalchemy.orm import Session

# Demo user data (matches the FastAPI auth.py development bypass)
DEMO_USER_ID = uuid.UUID('00000000-0000-0000-0000-000000000001')
DEMO_FIREBASE_UID = "demo-firebase-uid-dwight"

def seed_database():
    """Seed the database with demo data"""
    
    # Create session
    db = SessionLocal()
    
    try:
        print("Starting database seeding...")
        
        # Create all tables if they don't exist
        print("Creating tables...")
        Base.metadata.create_all(bind=engine)
        
        # Clear existing data (be careful with this!)
        print("Clearing existing data...")
        try:
            db.query(PersonAssociation).delete()
            db.query(GroupAssociation).delete()
            db.query(Person).delete()
            db.query(Group).delete()
            db.query(User).delete()
            db.commit()
        except Exception as e:
            print(f"Note: Could not clear some tables (they may not exist): {e}")
            db.rollback()
            
        print("Creating demo user...")
        
        # Create the demo user first (required for foreign key constraints)
        demo_user = User(
            id=DEMO_USER_ID,
            firebase_uid=DEMO_FIREBASE_UID,
            name="Dwight Schrute",
            email="dwight@schrutefarms.com",
            email_verified=None  # Not verified in demo
        )
        db.add(demo_user)
        db.commit()
        
        print("Creating groups...")
        
        # Create Work group
        work_group = Group(
            name='Work',
            userId=DEMO_USER_ID
        )
        db.add(work_group)
        
        # Create Beet Club group
        beet_club_group = Group(
            name='Beet Club',
            userId=DEMO_USER_ID
        )
        db.add(beet_club_group)
        db.commit()
        
        print("Creating people...")
        
        # Create Work group members
        michael = Person(
            name='Michael Scott',
            body="World's Best Boss. My hero.",
            intent='core',  # Use lowercase string instead of enum
            profile_pic_index=0,
            userId=DEMO_USER_ID
        )
        db.add(michael)
        
        pam = Person(
            name='Pam Beesly',
            body='Office Administrator',
            intent='invest',  # Use lowercase string
            profile_pic_index=1,
            userId=DEMO_USER_ID
        )
        db.add(pam)
        
        creed = Person(
            name='Creed Bratton',
            body="Quality Assurance, even I think he's creepy.",
            intent='new',  # Use lowercase string
            profile_pic_index=2,
            userId=DEMO_USER_ID
        )
        db.add(creed)
        
        # Create Beet Club members
        rolf = Person(
            name='Rolf Ahl',
            body='Legendary Beeter',
            intent='core',  # Use lowercase string
            profile_pic_index=3,
            userId=DEMO_USER_ID
        )
        db.add(rolf)
        
        mose = Person(
            name='Mose',
            body='Legendary Beeter',
            intent='core',  # Use lowercase string
            profile_pic_index=4,
            userId=DEMO_USER_ID
        )
        db.add(mose)
        
        angela = Person(
            name='Angela Martin',
            body='Office Administrator',
            intent='romantic',  # Use lowercase string
            profile_pic_index=5,
            userId=DEMO_USER_ID
        )
        db.add(angela)
        
        # Create additional people
        jan = Person(
            name='Jan Levinson',
            body='Former Dunder Mifflin VP',
            intent='core',  # Use lowercase string
            profile_pic_index=6,
            userId=DEMO_USER_ID
        )
        db.add(jan)
        
        hunter = Person(
            name='Hunter',
            body="Jan's former assistant",
            intent='associate',  # Use lowercase string
            profile_pic_index=7,
            userId=DEMO_USER_ID
        )
        db.add(hunter)
        
        ed_truck = Person(
            name='Ed Truck',
            body='Former Regional Manager, epic death',
            intent='archive',  # Use lowercase string
            profile_pic_index=7,
            userId=DEMO_USER_ID
        )
        db.add(ed_truck)
        
        david = Person(
            name='David Wallace',
            body='Left the company.',
            intent='archive',  # Use lowercase string
            profile_pic_index=8,
            userId=DEMO_USER_ID
        )
        db.add(david)
        
        jim = Person(
            name='Jim Halpert',
            body='Sales Representative, kinda mean to me sometimes.',
            intent='invest',  # Use lowercase string
            profile_pic_index=9,
            userId=DEMO_USER_ID
        )
        db.add(jim)
        
        # Commit people first to get their IDs
        db.commit()
        
        print("Creating group associations...")
        
        # Associate Work group members
        work_members = [michael, pam, creed, jim, ed_truck, david, angela, jan]
        for person in work_members:
            association = GroupAssociation(
                personId=person.id,
                groupId=work_group.id,
                userId=DEMO_USER_ID
            )
            db.add(association)
        
        # Associate Beet Club members
        beet_club_members = [rolf, mose]
        for person in beet_club_members:
            association = GroupAssociation(
                personId=person.id,
                groupId=beet_club_group.id,
                userId=DEMO_USER_ID
            )
            db.add(association)
        
        print("Creating person associations...")
        
        # Create person associations
        jan_hunter_association = PersonAssociation(
            personId=jan.id,
            associateId=hunter.id
        )
        db.add(jan_hunter_association)
        
        # Commit all associations
        db.commit()
        
        print("Database seeded successfully with Work and Beet Club groups!")
        print(f"Created {len(work_members)} work group members")
        print(f"Created {len(beet_club_members)} beet club members")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()