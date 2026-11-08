
# Risk scores used for route comparisons.
RISK_SCORES = {
    "low": 1,
    "moderate": 2,
    "high": 3,
    "severe": 4,
    "no_travel": 5
}


def classify_wind(wind_mph):
    if wind_mph < 25:
        return "low"
    elif wind_mph < 35:
        return "moderate"
    elif wind_mph < 45:
        return "high"
    elif wind_mph < 55:
        return "severe"
    return "no_travel"


def classify_rain(rain_inches_per_hour):
    if rain_inches_per_hour < 0.10:
        return "low"
    elif rain_inches_per_hour < 0.25:
        return "moderate"
    elif rain_inches_per_hour < 0.50:
        return "high"
    elif rain_inches_per_hour <= 1.00:
        return "severe"
    return "no_travel"


def classify_snow(snow_inches_per_hour):
    if snow_inches_per_hour < 0.5:
        return "low"
    elif snow_inches_per_hour < 1.0:
        return "moderate"
    elif snow_inches_per_hour < 2.0:
        return "high"
    elif snow_inches_per_hour <= 3.0:
        return "severe"
    return "no_travel"


def calculate_checkpoint_risk(checkpoint, load_weight_lb):
    weather = checkpoint.get("weather")

    if not weather:
        return {
            "risk_level": "unknown",
            "risk_score": None,
            "risk_reasons": [
                checkpoint.get(
                    "weather_error",
                    "Weather data unavailable"
                )
            ]
        }

    wind_kmh = weather.get("wind_speed_kmh")
    rain_mm = weather.get("precipitation_mm")
    snow_cm = weather.get("snowfall_cm")

    if any(value is None for value in [wind_kmh, rain_mm, snow_cm]):
        return {
            "risk_level": "unknown",
            "risk_score": None,
            "risk_reasons": ["Incomplete weather data"]
        }

    # Convert API units into project units.
    wind_mph = wind_kmh / 1.609344
    rain_inches = rain_mm / 25.4
    snow_inches = snow_cm / 2.54

    wind_risk = classify_wind(wind_mph)
    rain_risk = classify_rain(rain_inches)
    snow_risk = classify_snow(snow_inches)

    risks = [wind_risk, rain_risk, snow_risk]

    # Apply special truck-load rules to wind risk.
    if 45 <= wind_mph < 55 and load_weight_lb > 30000:
        wind_risk = "no_travel"
        risks[0] = wind_risk

    elif 35 <= wind_mph < 45 and load_weight_lb > 40000:
        wind_risk = "severe"
        risks[0] = wind_risk

    # Overall risk is the highest individual hazard.
    overall_risk = max(
        risks,
        key=lambda risk: RISK_SCORES[risk]
    )

    return {
        "risk_level": overall_risk,
        "risk_score": RISK_SCORES[overall_risk],
        "risk_factors": {
            "wind": {
                "value_mph": round(wind_mph, 2),
                "risk": wind_risk
            },
            "rain": {
                "value_inches_per_hour": round(rain_inches, 3),
                "risk": rain_risk
            },
            "snow": {
                "value_inches_per_hour": round(snow_inches, 3),
                "risk": snow_risk
            }
        },
        "risk_reasons": [
            f"Wind risk: {wind_risk}",
            f"Rain risk: {rain_risk}",
            f"Snow risk: {snow_risk}"
        ]
    }


def attach_risk_to_routes(routes, load_weight_lb):
    for route in routes:
        for checkpoint in route.get("checkpoints", []):

            # Calculate risk for the checkpoint's estimated arrival.
            checkpoint["risk"] = calculate_checkpoint_risk(
                checkpoint,
                load_weight_lb
            )

            # Calculate risk separately for every forecast hour.
            for forecast in checkpoint.get("forecast_by_hour", []):

                forecast["risk"] = calculate_checkpoint_risk(
                    {
                        "weather": forecast.get("weather")
                    },
                    load_weight_lb
                )
