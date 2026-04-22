import math
import os
import httpx
from app.core.config import settings


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance in miles between two points
    on the earth (specified in decimal degrees).
    """
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.asin(math.sqrt(a))

    # Radius of earth in miles is 3959.87433
    return 3959.87433 * c


async def geocode_address(address: str) -> tuple[float | None, float | None]:
    """
    Uses the Google Maps Geocoding API to convert an address string into latitude and longitude.
    Returns a tuple of (latitude, longitude).
    """
    api_key = settings.GOOGLE_MAPS_API_KEY

    if not api_key:
        print("WARNING: GOOGLE_MAPS_API_KEY is missing! Check your .env file.")

    if not api_key or not address:
        return None, None

    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {"address": address, "key": api_key}

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            if data.get("status") == "OK" and data.get("results"):
                location = data["results"][0]["geometry"]["location"]
                return location["lat"], location["lng"]
    except Exception as e:
        print(f"Error geocoding address: {e}")

    return None, None
