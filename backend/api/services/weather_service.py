
import requests

from datetime import timedelta

from ..utils.checkpoint_utils import parse_datetime
from datetime import datetime, timedelta, timezone

def get_weather_at_index(hourly, index, forecast_time):
    """Extract weather values for one forecast hour."""

    return {
        "forecast_time": forecast_time.isoformat(),
        "temperature_c": hourly["temperature_2m"][index],
        "wind_speed_kmh": hourly["wind_speed_10m"][index],
        "precipitation_mm": hourly["precipitation"][index],
        "snowfall_cm": hourly["snowfall"][index]
    }


def attach_weather_to_routes(routes):
    """
    Fetch weather for all route checkpoints.

    Each checkpoint receives:
    1. Weather at estimated truck arrival.
    2. Hourly weather forecasts from arrival through arrival + 48 hours.
    """

    all_checkpoints = []

    for route in routes:
        for checkpoint in route.get("checkpoints", []):
            all_checkpoints.append(checkpoint)

    if not all_checkpoints:
        return

    batch_size = 50

    for start in range(0, len(all_checkpoints), batch_size):

        batch = all_checkpoints[start:start + batch_size]

        params = {
            "latitude": ",".join(
                str(cp["latitude"]) for cp in batch
            ),
            "longitude": ",".join(
                str(cp["longitude"]) for cp in batch
            ),
            "hourly": (
                "temperature_2m,"
                "wind_speed_10m,"
                "precipitation,"
                "snowfall"
            ),
            "forecast_days": 16,
            "timezone": "UTC"
        }

        try:
            response = requests.get(
                "https://api.open-meteo.com/v1/forecast",
                params=params,
                timeout=60
            )

            response.raise_for_status()

            weather_results = response.json()

            if isinstance(weather_results, dict):
                weather_results = [weather_results]

            # Make sure every checkpoint has a matching API result.
            if len(weather_results) != len(batch):
                raise ValueError(
                    "Weather API returned an unexpected number "
                    "of location results."
                )

            for checkpoint, weather_data in zip(
                batch,
                weather_results
            ):

                hourly = weather_data.get("hourly", {})
                times = hourly.get("time", [])

                if not times:
                    checkpoint["weather_error"] = (
                        "No forecast data available"
                    )
                    checkpoint["forecast_by_hour"] = []
                    continue

                forecast_times = [
                    parse_datetime(value)
                    for value in times
                ]

                # The estimated arrival time at this checkpoint.
                target_time = parse_datetime(
                    checkpoint["estimated_arrival"]
                )

                # Find the closest available forecast hour.
                closest_index = min(
                    range(len(forecast_times)),
                    key=lambda i: abs(
                        forecast_times[i] - target_time
                    )
                )

                forecast_time = forecast_times[closest_index]

                difference_hours = abs(
                    (
                        forecast_time - target_time
                    ).total_seconds()
                ) / 3600

                if difference_hours > 1:
                    checkpoint["weather_error"] = (
                        "No forecast near estimated arrival time"
                    )
                    checkpoint["forecast_by_hour"] = []
                    continue

                # Preserve the original arrival-time weather.
                checkpoint["weather"] = get_weather_at_index(
                    hourly,
                    closest_index,
                    forecast_time
                )

                # Generate forecasts for hours 0 through 48.
                forecast_by_hour = []

                for offset in range(49):

                    target_forecast_time = (
                        target_time + timedelta(hours=offset)
                    )

                    forecast_index = min(
                        range(len(forecast_times)),
                        key=lambda i: abs(
                            forecast_times[i]
                            - target_forecast_time
                        )
                    )

                    actual_forecast_time = (
                        forecast_times[forecast_index]
                    )

                    time_difference = abs(
                        (
                            actual_forecast_time
                            - target_forecast_time
                        ).total_seconds()
                    ) / 3600

                    if time_difference > 1:
                        continue

                    weather = get_weather_at_index(
                        hourly,
                        forecast_index,
                        actual_forecast_time
                    )

                    forecast_by_hour.append({
                        "offset_hours": offset,
                        "weather": weather
                    })

                checkpoint["forecast_by_hour"] = (
                    forecast_by_hour
                )

        except (
            requests.RequestException,
            ValueError,
            KeyError,
            TypeError,
            IndexError
        ) as error:

            for checkpoint in batch:
                checkpoint["weather_error"] = str(error)
                checkpoint["forecast_by_hour"] = []




class WeatherForecastNotFound(Exception):
    pass


def fetch_weather_forecast(latitude, longitude, target_time):
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": (
            "temperature_2m,"
            "wind_speed_10m,"
            "precipitation,"
            "snowfall"
        ),
        "forecast_days": 16,
        "timezone": "UTC"
    }

    response = requests.get(
        "https://api.open-meteo.com/v1/forecast",
        params=params,
        timeout=15
    )
    response.raise_for_status()

    data = response.json()
    hourly = data.get("hourly", {})
    times = hourly.get("time", [])

    if not times:
        raise WeatherForecastNotFound(
            "No hourly forecast data available"
        )

    forecast_times = [
        datetime.fromisoformat(t).replace(tzinfo=timezone.utc)
        for t in times
    ]

    closest_index = min(
        range(len(forecast_times)),
        key=lambda i: abs(forecast_times[i] - target_time)
    )

    closest_time = forecast_times[closest_index]

    difference_hours = abs(
        (closest_time - target_time).total_seconds()
    ) / 3600

    if difference_hours > 1:
        raise WeatherForecastNotFound(
            "No forecast available near the requested time"
        )

    return {
        "latitude": latitude,
        "longitude": longitude,
        "requested_time": target_time.isoformat(),
        "forecast_time": closest_time.isoformat(),
        "temperature_c": hourly["temperature_2m"][closest_index],
        "wind_speed_kmh": hourly["wind_speed_10m"][closest_index],
        "precipitation_mm": hourly["precipitation"][closest_index],
        "snowfall_cm": hourly["snowfall"][closest_index]
    }
