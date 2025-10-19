"""
Location resolution service - implements the location hierarchy.
Priority: Person address > Tag address > Zip code
"""

from sqlmodel import Session, select
from typing import Optional, Tuple
from models import Person, Tag, PersonTag
from services.geocoding import geocode_address
import logging

logger = logging.getLogger(__name__)


def get_person_coordinates(
    db: Session,
    person: Person
) -> Optional[Tuple[float, float, str]]:
    """
    Get coordinates for a person using location hierarchy.

    Priority:
    1. Person's own address (street + city + state)
    2. Person's own coordinates (if manually set)
    3. Tag-based location (from tags with addresses)
    4. Person's zip code only

    Args:
        db: Database session
        person: Person object

    Returns:
        Tuple of (latitude, longitude, source_description) or None

    Examples:
        (37.7749, -122.4194, "personal")
        (37.7849, -122.4094, "tag:Climbing Gym")
        (37.7484, -122.4156, "zip:94110")
    """

    # 1. Try person's stored coordinates (if address was geocoded)
    if person.latitude is not None and person.longitude is not None:
        return (person.latitude, person.longitude, "personal")

    # 2. Try to geocode person's full address
    if any([person.street_address, person.city, person.state]):
        coords = geocode_address(
            street_address=person.street_address,
            city=person.city,
            state=person.state,
            zip_code=person.zip
        )
        if coords:
            return (coords[0], coords[1], "personal")

    # 3. Try tag-based locations
    person_tags = db.exec(
        select(Tag)
        .join(PersonTag, PersonTag.tag_id == Tag.id)
        .where(PersonTag.person_id == person.id)
        .where(
            (Tag.latitude.isnot(None)) |
            (Tag.street_address.isnot(None))
        )
    ).all()

    for tag in person_tags:
        # Use stored tag coordinates if available
        if tag.latitude is not None and tag.longitude is not None:
            return (tag.latitude, tag.longitude, f"tag:{tag.name}")

        # Try to geocode tag address
        if any([tag.street_address, tag.city, tag.state, tag.zip]):
            coords = geocode_address(
                street_address=tag.street_address,
                city=tag.city,
                state=tag.state,
                zip_code=tag.zip
            )
            if coords:
                return (coords[0], coords[1], f"tag:{tag.name}")

    # 4. Fall back to person's zip code only
    if person.zip:
        coords = geocode_address(zip_code=person.zip)
        if coords:
            return (coords[0], coords[1], f"zip:{person.zip}")

    logger.info(f"No location data available for person {person.id}")
    return None
