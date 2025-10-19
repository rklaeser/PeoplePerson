"""Quick test of GeminiClient functionality."""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
from ai.extractor import PersonExtractor

# Load environment variables
load_dotenv()

def test_intent_detection():
    """Test intent detection."""
    print("Testing intent detection...")
    extractor = PersonExtractor()

    result = extractor.detect_intent("I met Tom and Jane today")
    print(f"  Intent: {result.intent}")
    print(f"  Is CREATE: {result.is_create_request}")
    assert result.is_create_request == True
    print("  ✓ Intent detection passed")


def test_extraction():
    """Test basic extraction."""
    print("\nTesting extraction...")
    extractor = PersonExtractor()

    result = extractor.extract("I met Tom today. He has blonde hair and rides a motorcycle.")
    print(f"  Found {len(result)} person(s)")
    if result:
        print(f"  Name: {result[0].name}")
        print(f"  Attributes: {result[0].attributes}")
    assert len(result) >= 1
    assert "Tom" in result[0].name
    print("  ✓ Extraction passed")


if __name__ == "__main__":
    try:
        test_intent_detection()
        test_extraction()
        print("\n✓ All tests passed!")
    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        raise
