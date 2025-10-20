"""Comprehensive tests for AI module."""
import os
import sys
import pytest
from unittest.mock import Mock, patch
from uuid import uuid4

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
from sqlmodel import Session, create_engine, SQLModel, select
from ai.extractor import (
    PersonExtractor,
    PersonManager,
    PersonExtraction,
    CRUDIntent,
    IntentAnalysis
)
from models import Person, User

load_dotenv()

# Test database setup
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DATABASE_URL, echo=False)


@pytest.fixture
def db_session():
    """Create a fresh database session for each test."""
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    SQLModel.metadata.drop_all(engine)


@pytest.fixture
def test_user(db_session):
    """Create a test user."""
    user = User(
        firebase_uid="test_uid_123",
        email="test@example.com",
        name="Test User"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


class TestIntentDetection:
    """Test intent detection functionality."""

    def test_create_intent_simple(self):
        """Test CREATE intent with simple narrative."""
        extractor = PersonExtractor()
        result = extractor.detect_intent("I met Tom today")
        assert result.intent == CRUDIntent.CREATE
        assert result.is_create_request == True

    def test_create_intent_multiple_people(self):
        """Test CREATE intent with multiple people."""
        extractor = PersonExtractor()
        result = extractor.detect_intent("Met Sarah and Alex at the conference")
        assert result.intent == CRUDIntent.CREATE
        assert result.is_create_request == True

    def test_create_intent_with_add_keyword(self):
        """Test CREATE intent with 'add' keyword."""
        extractor = PersonExtractor()
        result = extractor.detect_intent("Add a new contact named Jessica")
        assert result.intent == CRUDIntent.CREATE
        assert result.is_create_request == True

    def test_read_intent(self):
        """Test READ intent detection."""
        extractor = PersonExtractor()
        result = extractor.detect_intent("Show me Tom's contact information")
        assert result.intent == CRUDIntent.READ
        assert result.is_create_request == False

    def test_update_intent(self):
        """Test UPDATE intent detection."""
        extractor = PersonExtractor()
        result = extractor.detect_intent("Update Jane's email to jane@example.com")
        assert result.intent == CRUDIntent.UPDATE
        assert result.is_create_request == False

    def test_none_intent_greeting(self):
        """Test NONE intent with greeting."""
        extractor = PersonExtractor()
        result = extractor.detect_intent("Hello! How are you?")
        assert result.intent == CRUDIntent.NONE
        assert result.is_create_request == False

    def test_none_intent_weather(self):
        """Test NONE intent with unrelated question."""
        extractor = PersonExtractor()
        result = extractor.detect_intent("What's the weather like today?")
        assert result.intent == CRUDIntent.NONE
        assert result.is_create_request == False


class TestEntityExtraction:
    """Test entity extraction functionality."""

    def test_extract_single_person_with_attributes(self):
        """Test extracting single person with attributes."""
        extractor = PersonExtractor()
        result = extractor.extract("I met Tom today. He has blonde hair and rides a motorcycle.")

        assert len(result) == 1
        assert result[0].name == "Tom"
        assert "blonde hair" in result[0].attributes.lower() or "motorcycle" in result[0].attributes.lower()

    def test_extract_multiple_people(self):
        """Test extracting multiple people."""
        extractor = PersonExtractor()
        result = extractor.extract("Met Sarah and Alex at the conference. Sarah is a designer. Alex works at Google.")

        assert len(result) == 2
        names = [p.name for p in result]
        assert "Sarah" in names
        assert "Alex" in names

    def test_extract_person_with_email(self):
        """Test extracting person with email."""
        extractor = PersonExtractor()
        result = extractor.extract("Met Jessica. Her email is jessica@example.com")

        assert len(result) == 1
        assert result[0].name == "Jessica"
        assert result[0].email == "jessica@example.com"

    def test_extract_person_with_phone(self):
        """Test extracting person with phone number."""
        extractor = PersonExtractor()
        result = extractor.extract("Met Jane. Her number is 415-555-0123")

        assert len(result) == 1
        assert result[0].name == "Jane"
        assert result[0].phone_number is not None
        assert "415" in result[0].phone_number

    def test_extract_no_people(self):
        """Test extraction with no people mentioned."""
        extractor = PersonExtractor()
        result = extractor.extract("Went to the park today. It was nice.")

        assert len(result) == 0


class TestFieldValidation:
    """Test field validation in PersonExtraction."""

    def test_email_normalization(self):
        """Test email is normalized to lowercase."""
        extraction = PersonExtraction(
            name="Test Person",
            email="Test@EXAMPLE.COM"
        )
        assert extraction.email == "test@example.com"

    def test_name_min_length(self):
        """Test name minimum length validation."""
        with pytest.raises(ValueError, match="at least 2 characters"):
            PersonExtraction(name="A")

    def test_name_max_length(self):
        """Test name maximum length validation."""
        long_name = "A" * 101
        with pytest.raises(ValueError, match="less than 100 characters"):
            PersonExtraction(name=long_name)

    def test_phone_with_digits(self):
        """Test phone number must contain digits."""
        extraction = PersonExtraction(
            name="Test",
            phone_number="415-555-0123"
        )
        assert extraction.phone_number == "415-555-0123"

    def test_phone_validation_fails_no_digits(self):
        """Test phone validation fails without digits."""
        with pytest.raises(ValueError, match="must contain digits"):
            PersonExtraction(
                name="Test",
                phone_number="no-digits-here"
            )


class TestNameMatching:
    """Test name matching functionality."""

    def test_find_by_name_exact_match(self, db_session, test_user):
        """Test finding exact name match (case-insensitive)."""
        # Create existing person
        existing = Person(
            name="Tom",
            body="blonde hair, rides a motorcycle",
            user_id=test_user.id
        )
        db_session.add(existing)
        db_session.commit()

        # Test exact match
        manager = PersonManager(db_session)
        results = manager.find_by_name("Tom", test_user.id)

        assert len(results) == 1
        assert results[0].name == "Tom"

    def test_find_by_name_case_insensitive(self, db_session, test_user):
        """Test case-insensitive matching."""
        # Create existing person
        existing = Person(
            name="Tom",
            body="software engineer",
            user_id=test_user.id
        )
        db_session.add(existing)
        db_session.commit()

        # Test with different case
        manager = PersonManager(db_session)
        results = manager.find_by_name("tom", test_user.id)

        assert len(results) == 1
        assert results[0].name == "Tom"

    def test_find_by_name_starts_with(self, db_session, test_user):
        """Test matching names that start with search term."""
        # Create existing person
        existing = Person(
            name="Thomas",
            body="designer",
            user_id=test_user.id
        )
        db_session.add(existing)
        db_session.commit()

        # Test starts with
        manager = PersonManager(db_session)
        results = manager.find_by_name("Tom", test_user.id)

        assert len(results) == 1
        assert results[0].name == "Thomas"

    def test_find_by_name_contains(self, db_session, test_user):
        """Test matching names that contain search term."""
        # Create existing person
        existing = Person(
            name="Sarah Johnson",
            body="designer",
            user_id=test_user.id
        )
        db_session.add(existing)
        db_session.commit()

        # Test contains
        manager = PersonManager(db_session)
        results = manager.find_by_name("Johnson", test_user.id)

        assert len(results) == 1
        assert results[0].name == "Sarah Johnson"

    def test_find_by_name_no_match(self, db_session, test_user):
        """Test finding no match for different name."""
        # Create existing person
        existing = Person(
            name="Sarah",
            body="designer",
            user_id=test_user.id
        )
        db_session.add(existing)
        db_session.commit()

        # Test with unrelated name
        manager = PersonManager(db_session)
        results = manager.find_by_name("Alexander", test_user.id)

        assert len(results) == 0

    def test_find_by_name_no_existing_people(self, db_session, test_user):
        """Test when no people exist yet."""
        manager = PersonManager(db_session)
        results = manager.find_by_name("Tom", test_user.id)

        assert len(results) == 0

    def test_find_by_name_priority_order(self, db_session, test_user):
        """Test that exact matches come before partial matches."""
        # Create multiple people
        exact = Person(name="Tom", body="", user_id=test_user.id)
        starts_with = Person(name="Tommy", body="", user_id=test_user.id)
        contains = Person(name="John Tomson", body="", user_id=test_user.id)

        db_session.add(exact)
        db_session.add(starts_with)
        db_session.add(contains)
        db_session.commit()

        # Test priority ordering
        manager = PersonManager(db_session)
        results = manager.find_by_name("Tom", test_user.id)

        assert len(results) == 3
        assert results[0].name == "Tom"  # Exact match first
        assert results[1].name == "Tommy"  # Starts with second
        assert results[2].name == "John Tomson"  # Contains third


class TestPersonManager:
    """Test PersonManager functionality."""

    def test_create_person(self, db_session, test_user):
        """Test creating a new person."""
        extraction = PersonExtraction(
            name="Tom",
            attributes="blonde hair, rides a motorcycle",
            email="tom@example.com",
            phone_number="415-555-0123"
        )

        manager = PersonManager(db_session)
        person = manager.create_person(extraction, test_user.id)

        assert person.name == "Tom"
        assert person.body == ""  # Body is deprecated, uses notebook entries now
        assert person.phone_number == "415-555-0123"
        assert person.user_id == test_user.id
        assert person.id is not None

    def test_create_person_no_attributes(self, db_session, test_user):
        """Test creating person without attributes."""
        extraction = PersonExtraction(name="Jane")

        manager = PersonManager(db_session)
        person = manager.create_person(extraction, test_user.id)

        assert person.name == "Jane"
        assert person.body == ""

    def test_link_to_existing(self, db_session, test_user):
        """Test linking extraction to existing person."""
        # Create existing person
        existing = Person(
            name="Tom",
            body="",
            user_id=test_user.id
        )
        db_session.add(existing)
        db_session.commit()
        db_session.refresh(existing)

        # Link new extraction - should append to today's notebook entry
        extraction = PersonExtraction(
            name="Tom",
            attributes="rides a motorcycle"
        )

        manager = PersonManager(db_session)
        updated = manager.link_to_existing(extraction, existing.id)

        assert updated.id == existing.id
        # Attributes are now stored in notebook entries, not body
        assert updated.body == ""

    def test_link_to_existing_not_found(self, db_session, test_user):
        """Test linking to non-existent person raises error."""
        extraction = PersonExtraction(name="Tom")
        fake_id = uuid4()

        manager = PersonManager(db_session)

        with pytest.raises(ValueError, match="not found"):
            manager.link_to_existing(extraction, fake_id)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
