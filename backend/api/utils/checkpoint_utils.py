
import math
from datetime import datetime, timedelta, timezone


def haversine_distance_km(point1, point2):
    """Calculate the distance between two latitude/longitude points."""

    lat1 = math.radians(point1["latitude"])
    lon1 = math.radians(point1["longitude"])
    lat2 = math.radians(point2["latitude"])
    lon2 = math.radians(point2["longitude"])

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2)
        * math.sin(dlon / 2) ** 2
    )

    return 6371 * 2 * math.atan2(
        math.sqrt(a),
        math.sqrt(1 - a)
    )


def parse_datetime(value):
    """Convert an ISO datetime string into a UTC-aware datetime."""

    parsed = datetime.fromisoformat(
        value.replace("Z", "+00:00")
    )

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)

    return parsed.astimezone(timezone.utc)


def generate_route_checkpoints(
    route,
    departure_time,
    interval_miles=25
):
    coordinates = route.get("coordinates", [])

    if len(coordinates) < 2:
        return []

    total_distance_km = float(route["distance_km"])
    total_duration_minutes = float(route["duration_minutes"])

    if total_distance_km <= 0 or total_duration_minutes < 0:
        return []

    departure = parse_datetime(departure_time)

    # Calculate distance between route coordinates.
    segment_distances = []
    cumulative_distances = [0.0]

    for i in range(len(coordinates) - 1):
        segment_distance = haversine_distance_km(
            coordinates[i],
            coordinates[i + 1]
        )

        segment_distances.append(segment_distance)

        cumulative_distances.append(
            cumulative_distances[-1] + segment_distance
        )

    geometry_distance = cumulative_distances[-1]

    if geometry_distance <= 0:
        return []

    total_distance_miles = total_distance_km / 1.609344

    # Starting point, regular intervals, and destination.
    distances = [0.0]
    current_distance = float(interval_miles)

    while current_distance < total_distance_miles:
        distances.append(current_distance)
        current_distance += interval_miles

    distances.append(total_distance_miles)

    checkpoints = []

    for index, distance_miles in enumerate(distances):

        fraction = distance_miles / total_distance_miles

        target_geometry_distance = (
            fraction * geometry_distance
        )

        segment_index = len(segment_distances) - 1

        for i in range(len(segment_distances)):
            if (
                target_geometry_distance
                <= cumulative_distances[i + 1]
            ):
                segment_index = i
                break

        segment_start = cumulative_distances[segment_index]
        segment_length = segment_distances[segment_index]

        if segment_length == 0:
            segment_fraction = 0
        else:
            segment_fraction = (
                target_geometry_distance - segment_start
            ) / segment_length

        start = coordinates[segment_index]
        end = coordinates[segment_index + 1]

        latitude = (
            start["latitude"]
            + (
                end["latitude"] - start["latitude"]
            ) * segment_fraction
        )

        longitude = (
            start["longitude"]
            + (
                end["longitude"] - start["longitude"]
            ) * segment_fraction
        )

        eta = departure + timedelta(
            minutes=total_duration_minutes * fraction
        )

        checkpoints.append({
            "checkpoint_id": index + 1,
            "distance_miles": round(distance_miles, 2),
            "latitude": round(latitude, 6),
            "longitude": round(longitude, 6),
            "estimated_arrival": eta.isoformat()
        })

    return checkpoints
