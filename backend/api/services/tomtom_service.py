
import os
import requests


class TomTomAPIKeyError(Exception):
    pass


def get_api_key():
    api_key = os.getenv("TOMTOM_API_KEY")

    if not api_key:
        raise TomTomAPIKeyError("TomTom API key is not configured")

    return api_key


def fetch_truck_routes(
    origin_lat,
    origin_lon,
    destination_lat,
    destination_lon,
    departure_time=None
):
    api_key = get_api_key()

    url = (
        "https://api.tomtom.com/routing/1/calculateRoute/"
        f"{origin_lat},{origin_lon}:"
        f"{destination_lat},{destination_lon}/json"
    )

    params = {
        "key": api_key,
        "travelMode": "truck",
        "maxAlternatives": 2,
        "routeType": "fastest",
        "traffic": "true"
    }

    if departure_time:
        params["departAt"] = departure_time

    response = requests.get(url, params=params, timeout=30)
    response.raise_for_status()

    data = response.json()
    routes = []

    for index, route in enumerate(data.get("routes", [])):
        summary = route["summary"]
        coordinates = []

        for leg in route.get("legs", []):
            for point in leg.get("points", []):
                coordinates.append({
                    "latitude": point["latitude"],
                    "longitude": point["longitude"]
                })

        routes.append({
            "route_id": index + 1,
            "distance_km": round(
                summary["lengthInMeters"] / 1000, 2
            ),
            "duration_minutes": round(
                summary["travelTimeInSeconds"] / 60, 2
            ),
            "coordinates": coordinates
        })

    return routes


def geocode_location(query):
    api_key = get_api_key()

    url = (
        "https://api.tomtom.com/search/2/geocode/"
        f"{requests.utils.quote(query)}.json"
    )

    params = {
        "key": api_key,
        "limit": 5
    }

    response = requests.get(url, params=params, timeout=20)
    response.raise_for_status()

    data = response.json()
    results = []

    for item in data.get("results", []):
        position = item["position"]

        results.append({
            "latitude": position["lat"],
            "longitude": position["lon"],
            "address": item["address"]["freeformAddress"]
        })

    return results
def reverse_geocode_location(latitude, longitude):
    api_key = os.getenv("TOMTOM_API_KEY")

    if not api_key:
        raise TomTomAPIKeyError("TomTom API key is missing")

    url = (
        f"https://api.tomtom.com/search/2/reverseGeocode/"
        f"{latitude},{longitude}.json"
    )

    response = requests.get(
        url,
        params={"key": api_key},
        timeout=15
    )

    response.raise_for_status()

    data = response.json()
    addresses = data.get("addresses", [])

    if not addresses:
        return None

    return addresses[0]["address"].get("freeformAddress")