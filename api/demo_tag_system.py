#!/usr/bin/env python3
"""
Demo script showing the new tag system capabilities

This script demonstrates:
1. Creating tags with different categories
2. Tagging people with multiple tags
3. Searching people by tags
4. Tag statistics and suggestions
"""

from sqlmodel import Session
from database import SessionLocal
from models import User, Person, Tag, PersonTag, IntentChoices


def demo_tag_system():
    """Demonstrate the tag system with sample data"""
    db = SessionLocal()
    
    try:
        # Create a demo user
        demo_user = User(
            firebase_uid="demo_user_123",
            name="Demo User",
            email="demo@example.com"
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)
        print(f"Created demo user: {demo_user.name}")
        
        # Create sample tags with different categories
        tags_data = [
            # Relationship tags
            {"name": "Family", "category": "relationship", "color": "#ff6b6b"},
            {"name": "Close Friends", "category": "relationship", "color": "#4ecdc4"},
            {"name": "Work Colleagues", "category": "relationship", "color": "#45b7d1"},
            {"name": "Acquaintances", "category": "relationship", "color": "#96ceb4"},
            
            # Location tags
            {"name": "NYC", "category": "location", "color": "#ffeaa7"},
            {"name": "San Francisco", "category": "location", "color": "#fab1a0"},
            {"name": "Remote", "category": "location", "color": "#e17055"},
            
            # Interest/hobby tags
            {"name": "Tennis", "category": "hobby", "color": "#a29bfe"},
            {"name": "Photography", "category": "hobby", "color": "#fd79a8"},
            {"name": "Cooking", "category": "hobby", "color": "#fdcb6e"},
            {"name": "Tech", "category": "hobby", "color": "#6c5ce7"},
            
            # Lifestyle tags
            {"name": "Vegetarian", "category": "lifestyle", "color": "#00b894"},
            {"name": "Dog Owner", "category": "lifestyle", "color": "#e84393"},
            {"name": "Early Riser", "category": "lifestyle", "color": "#00cec9"},
            
            # General tags
            {"name": "Important", "category": "general", "color": "#ff7675"},
            {"name": "Mentor", "category": "general", "color": "#74b9ff"}
        ]
        
        tags = []
        for tag_data in tags_data:
            tag = Tag(**tag_data, user_id=demo_user.id)
            db.add(tag)
            tags.append(tag)
        
        db.commit()
        for tag in tags:
            db.refresh(tag)
        
        print(f"\nCreated {len(tags)} tags across categories:")
        categories = {}
        for tag in tags:
            if tag.category not in categories:
                categories[tag.category] = []
            categories[tag.category].append(tag.name)
        
        for category, tag_names in categories.items():
            print(f"  {category}: {', '.join(tag_names)}")
        
        # Create sample people
        people_data = [
            {
                "name": "Alice Johnson",
                "body": "Software engineer at tech startup, loves tennis and photography",
                "intent": IntentChoices.CORE,
                "tags": ["Close Friends", "NYC", "Tech", "Tennis", "Photography", "Vegetarian"]
            },
            {
                "name": "Bob Chen", 
                "body": "Product manager, dog lover, amazing cook",
                "intent": IntentChoices.INVEST,
                "tags": ["Work Colleagues", "San Francisco", "Tech", "Cooking", "Dog Owner"]
            },
            {
                "name": "Carol Williams",
                "body": "Sister, lives across the country but we talk regularly",
                "intent": IntentChoices.CORE,
                "tags": ["Family", "Remote", "Early Riser", "Important"]
            },
            {
                "name": "David Rodriguez",
                "body": "Former colleague turned mentor, great career advice",
                "intent": IntentChoices.INVEST,
                "tags": ["Mentor", "Work Colleagues", "NYC", "Tech", "Important"]
            },
            {
                "name": "Emma Thompson",
                "body": "Met at photography workshop, shoots amazing landscapes",
                "intent": IntentChoices.NEW,
                "tags": ["Acquaintances", "Photography", "Early Riser"]
            },
            {
                "name": "Frank Miller",
                "body": "Tennis partner, plays every Saturday morning",
                "intent": IntentChoices.ASSOCIATE,
                "tags": ["Acquaintances", "Tennis", "Early Riser", "NYC"]
            }
        ]
        
        people = []
        for person_data in people_data:
            tag_names = person_data.pop("tags")
            person = Person(**person_data, user_id=demo_user.id)
            db.add(person)
            people.append((person, tag_names))
        
        db.commit()
        
        # Tag the people
        for person, tag_names in people:
            db.refresh(person)
            print(f"\nTagging {person.name} with: {', '.join(tag_names)}")
            
            for tag_name in tag_names:
                tag = next(t for t in tags if t.name == tag_name)
                person_tag = PersonTag(person_id=person.id, tag_id=tag.id)
                db.add(person_tag)
        
        db.commit()
        print("\nAll people have been tagged!")
        
        # Demonstrate tag system capabilities
        print("\n" + "="*60)
        print("TAG SYSTEM DEMONSTRATION")
        print("="*60)
        
        # 1. Show people by category
        print("\n1. PEOPLE BY RELATIONSHIP CATEGORY:")
        relationship_tags = [t for t in tags if t.category == "relationship"]
        for tag in relationship_tags:
            people_with_tag = db.query(Person).join(PersonTag).filter(
                PersonTag.tag_id == tag.id
            ).all()
            if people_with_tag:
                names = [p.name for p in people_with_tag]
                print(f"   {tag.name}: {', '.join(names)}")
        
        # 2. Show people in NYC who like tech
        print("\n2. TECH PEOPLE IN NYC:")
        nyc_tag = next(t for t in tags if t.name == "NYC")
        tech_tag = next(t for t in tags if t.name == "Tech")
        
        nyc_tech_people = db.query(Person).join(PersonTag, Person.id == PersonTag.person_id).filter(
            PersonTag.tag_id.in_([nyc_tag.id, tech_tag.id])
        ).group_by(Person.id).having(db.func.count(PersonTag.tag_id) == 2).all()
        
        for person in nyc_tech_people:
            print(f"   {person.name}")
        
        # 3. Show people with multiple shared interests
        print("\n3. PEOPLE WITH MULTIPLE HOBBIES:")
        hobby_tags = [t for t in tags if t.category == "hobby"]
        
        for person, _ in people:
            person_hobby_tags = db.query(Tag).join(PersonTag).filter(
                PersonTag.person_id == person.id,
                Tag.category == "hobby"
            ).all()
            if len(person_hobby_tags) > 1:
                hobby_names = [t.name for t in person_hobby_tags]
                print(f"   {person.name}: {', '.join(hobby_names)}")
        
        # 4. Show tag statistics
        print("\n4. TAG USAGE STATISTICS:")
        for category in categories.keys():
            cat_tags = [t for t in tags if t.category == category]
            total_usage = 0
            for tag in cat_tags:
                usage_count = db.query(PersonTag).filter(PersonTag.tag_id == tag.id).count()
                total_usage += usage_count
            print(f"   {category}: {len(cat_tags)} tags, {total_usage} total uses")
        
        # 5. Show most popular tags
        print("\n5. MOST POPULAR TAGS:")
        tag_usage = []
        for tag in tags:
            usage_count = db.query(PersonTag).filter(PersonTag.tag_id == tag.id).count()
            if usage_count > 0:
                tag_usage.append((tag.name, tag.category, usage_count))
        
        tag_usage.sort(key=lambda x: x[2], reverse=True)
        for name, category, count in tag_usage[:5]:
            print(f"   {name} ({category}): {count} people")
        
        print("\n" + "="*60)
        print("Demo completed! The tag system provides:")
        print("• Flexible categorization (relationship, location, hobby, lifestyle)")
        print("• Multi-dimensional tagging (one person can have many tags)")
        print("• Powerful filtering and search capabilities")
        print("• Visual organization with colors")
        print("• Statistics and insights")
        print("="*60)
        
    except Exception as e:
        print(f"Error in demo: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    demo_tag_system()