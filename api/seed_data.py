#!/usr/bin/env python3
"""
Seed script for PeoplePerson development database.
Creates test data including users and people.
"""

import os
from sqlmodel import Session
from database import engine
from models import User, Person, IntentChoices
from uuid import uuid4

def seed_database():
    """Seed the database with test data."""
    
    with Session(engine) as session:
        # Check if we already have people
        from sqlmodel import select
        existing_people = session.exec(select(Person)).all()
        if existing_people:
            print("Database already has people. Skipping seeding.")
            return
        
        print("Seeding database with test data...")
        
        # Find or create test user
        test_user = session.exec(
            select(User).where(User.firebase_uid == "NkaYWimClOAwOxXHwBYeAVlxxC2L")
        ).first()
        
        if not test_user:
            test_user = User(
                firebase_uid="NkaYWimClOAwOxXHwBYeAVlxxC2L",
                name="test",
                email="test@example.com"
            )
            session.add(test_user)
            session.flush()  # Get the user ID
        
        # Create Jordan as a test person
        jordan = Person(
            name="Jordan",
            body="A great friend and colleague. Always there when you need them.",
            intent=IntentChoices.CORE,
            birthday="March 15",
            mnemonic="Joyful spirit",
            zip="94102",
            profile_pic_index=1,
            phone_number="+1-555-0123",
            user_id=test_user.id
        )
        session.add(jordan)
        
        session.commit()
        print("✅ Database seeded successfully!")
        print(f"   - Created test user: {test_user.name} ({test_user.email})")
        print(f"   - Created person: {jordan.name}")

if __name__ == "__main__":
    seed_database()