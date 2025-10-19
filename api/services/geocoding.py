"""
Geocoding service to convert addresses to coordinates.
Uses geopy with Nominatim (free, OpenStreetMap-based).
"""

from geopy.geocoders import Nominatim
from typing import Optional, Tuple
import logging

logger = logging.getLogger(__name__)

# Initialize geocoder (Nominatim requires a user agent)
geolocator = Nominatim(user_agent="peopleperson-app")


def geocode_address(
    street_address: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    zip_code: Optional[str] = None
) -> Optional[Tuple[float, float]]:
    """
    Convert address to coordinates.

    Args:
        street_address: Street address (e.g., "123 Main St")
        city: City name
        state: State name or abbreviation
        zip_code: ZIP/postal code

    Returns:
        Tuple of (latitude, longitude) or None if geocoding fails

    Examples:
        >>> geocode_address(zip_code="94110")
        (37.7484, -122.4156)

        >>> geocode_address(street_address="1 Hacker Way", city="Menlo Park", state="CA")
        (37.4845, -122.1477)
    """
    # Build address string from available components
    parts = [p for p in [street_address, city, state, zip_code] if p]
    if not parts:
        logger.warning("No address components provided for geocoding")
        return None

    address = ", ".join(parts)

    try:
        # Restrict to US by using countrycodes parameter
        location = geolocator.geocode(
            address,
            timeout=10,
            country_codes=['us']  # Only search in United States
        )
        if location:
            logger.info(f"Geocoded '{address}' to ({location.latitude}, {location.longitude})")
            return (location.latitude, location.longitude)
        else:
            logger.warning(f"Could not geocode address: {address}")
            return None
    except Exception as e:
        logger.error(f"Geocoding error for '{address}': {e}")
        return None
