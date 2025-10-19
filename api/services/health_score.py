"""
Simple health score calculation.
Score decays linearly based on days since last contact.
"""

from datetime import datetime
from typing import Literal

HealthStatus = Literal["healthy", "warning", "dormant"]

# Simple linear decay: lose ~1.5 points per day
# 100 → 0 in about 66 days
DECAY_RATE_PER_DAY = 1.5


def calculate_health_score(last_contact_date: datetime) -> int:
    """
    Calculate health score based on days since last contact.

    Formula: 100 - (days_inactive × 1.5)

    Args:
        last_contact_date: The datetime of last contact

    Returns:
        Health score (0-100)
    """
    days_inactive = (datetime.utcnow() - last_contact_date).days
    score = 100 - (days_inactive * DECAY_RATE_PER_DAY)
    return max(0, min(100, int(score)))


def get_health_status(score: int) -> HealthStatus:
    """
    Get health status from score.

    Returns:
        - healthy: 70-100 (green)
        - warning: 40-69 (yellow)
        - dormant: 0-39 (red)
    """
    if score >= 70:
        return "healthy"
    elif score >= 40:
        return "warning"
    else:
        return "dormant"


def get_health_emoji(status: HealthStatus) -> str:
    """Get emoji for health status"""
    return {
        "healthy": "🌳",
        "warning": "🍂",
        "dormant": "🪵",
    }[status]
