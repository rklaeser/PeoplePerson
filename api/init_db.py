#!/usr/bin/env python3
"""
Database initialization script for SQLAlchemy models
"""
import os
import sys
from sqlalchemy import create_engine
from app.database import Base, Person, Group, History, GroupAssociation, PersonAssociation, User
from app.config import DATABASE_URL

def init_database():
    """Initialize the database with SQLAlchemy tables"""
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not set in environment")
        sys.exit(1)
    
    print(f"Connecting to database: {DATABASE_URL}")
    
    try:
        # Create engine
        engine = create_engine(DATABASE_URL)
        
        # Drop all tables (for clean rebuild)
        print("Dropping existing tables...")
        Base.metadata.drop_all(engine, checkfirst=True)
        
        # Create all tables
        print("Creating tables...")
        Base.metadata.create_all(engine)
        
        print("Database initialization complete!")
        print("Created tables:")
        friendship_tables = []
        auth_tables = []
        
        for table_name in Base.metadata.tables.keys():
            if table_name in ['users']:
                auth_tables.append(table_name)
            else:
                friendship_tables.append(table_name)
        
        print("User tables:")
        for table in sorted(auth_tables):
            print(f"  - {table}")
        print("Friendship tables:")
        for table in sorted(friendship_tables):
            print(f"  - {table}")
            
    except Exception as e:
        print(f"ERROR: Failed to initialize database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    init_database()