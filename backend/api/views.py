import requests

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from datetime import datetime, timezone

from .utils.checkpoint_utils import generate_route_checkpoints

from .services.tomtom_service import (
    fetch_truck_routes,
    geocode_location as tomtom_geocode_location,
    reverse_geocode_location,
    TomTomAPIKeyError
)

from .services.weather_service import (
    attach_weather_to_routes,
    fetch_weather_forecast,
    WeatherForecastNotFound
)

from .utils.risk_utils import attach_risk_to_routes
from .utils.route_analysis import analyze_routes

@api_view(['GET'])
def health_check(request):

    return Response({
        "status": "success",
        "message": "Weather-Aware Truck Routing API is running"
    })


@api_view(['POST'])
def generate_routes(request):

    origin = request.data.get("origin")
    destination = request.data.get("destination")
    departure_time = request.data.get("departure_time")

    load_weight_lb = request.data.get("load_weight_lb")

    checkpoint_interval_miles = request.data.get("checkpoint_interval_miles", 25)
    try:
        checkpoint_interval_miles = int(checkpoint_interval_miles)
    except (TypeError, ValueError):
        return Response(
            {"error": "Checkpoint interval must be 10, 25 or 50"},
            status=400
        )

    if checkpoint_interval_miles not in [10, 25, 50]:
        return Response(
            {"error": "Checkpoint interval must be 10, 25 or 50"},
            status=400
        )



    if load_weight_lb is None:
        return Response({
            "error": "Truck load weight is required"
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        load_weight_lb = float(load_weight_lb)

        if load_weight_lb <= 0:
            raise ValueError()

    except (TypeError, ValueError):
        return Response({
            "error": "Provide a valid positive load weight"
        }, status=status.HTTP_400_BAD_REQUEST)


    
    # Validate input
    if not origin or not destination:

        return Response({
            "error": "Origin and destination are required"
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        origin_lat = float(origin["latitude"])
        origin_lon = float(origin["longitude"])

        destination_lat = float(destination["latitude"])
        destination_lon = float(destination["longitude"])

    except (KeyError, TypeError, ValueError):

        return Response({
            "error": "Provide valid origin and destination coordinates"
        }, status=status.HTTP_400_BAD_REQUEST)

    # Read API key
    try:
        routes = fetch_truck_routes(
            origin_lat,
            origin_lon,
            destination_lat,
            destination_lon,
            departure_time
        )

        if not routes:
            return Response({
                "error": "TomTom returned no routes"
            }, status=status.HTTP_502_BAD_GATEWAY)

        # Generate checkpoints for all routes.
        for route in routes:
            route["checkpoints"] = generate_route_checkpoints(
                route,
                departure_time,
                checkpoint_interval_miles
            )

        # Attach weather to every checkpoint.
        attach_weather_to_routes(routes)

        # Calculate weather risk using the truck's load weight.
        attach_risk_to_routes(routes, load_weight_lb)

        # Summarize route risks and select the safest route.
        recommended_route_id = analyze_routes(routes)

        return Response({
            "status": "success",
            "total_routes": len(routes),
            "routes": routes,
            "load_weight_lb": load_weight_lb,
            "checkpoint_interval_miles": checkpoint_interval_miles,
            "recommended_route_id": recommended_route_id,
            "recommendation_status": (
                "provisional"
                if any(
                    route["risk_summary"]["unknown_miles"] > 0
                    for route in routes
                )
                else "complete"
            ),
        })

    except TomTomAPIKeyError:
        return Response({
            "error": "TomTom API key is not configured"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except requests.RequestException:
        return Response({
            "error": "Unable to retrieve routes from TomTom"
        }, status=status.HTTP_502_BAD_GATEWAY)



@api_view(['GET'])
def geocode_location(request):

    query = request.query_params.get("q")

    if not query:
        return Response({
            "error": "Location is required"
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        results = tomtom_geocode_location(query)

        return Response({
            "status": "success",
            "results": results
        })

    except TomTomAPIKeyError:
        return Response({
            "error": "TomTom API key is missing"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except requests.RequestException:
        return Response({
            "error": "Unable to find the location"
        }, status=status.HTTP_502_BAD_GATEWAY)



@api_view(["GET"])
def weather_forecast(request):
    latitude = request.query_params.get("lat")
    longitude = request.query_params.get("lon")
    requested_time = request.query_params.get("datetime")

    if not latitude or not longitude or not requested_time:
        return Response({
            "error": "lat, lon and datetime are required"
        }, status=400)

    try:
        latitude = float(latitude)
        longitude = float(longitude)

        if not (
            -90 <= latitude <= 90
            and -180 <= longitude <= 180
        ):
            return Response({
                "error": "Invalid coordinates"
            }, status=400)

        target_time = datetime.fromisoformat(
            requested_time.replace("Z", "+00:00")
        )

        if target_time.tzinfo is None:
            target_time = target_time.replace(tzinfo=timezone.utc)

        target_time = target_time.astimezone(timezone.utc)

    except ValueError:
        return Response({
            "error": "Invalid coordinates or datetime format"
        }, status=400)

    try:
        forecast = fetch_weather_forecast(
            latitude,
            longitude,
            target_time
        )

        return Response(forecast)

    except WeatherForecastNotFound as error:
        return Response({
            "error": str(error)
        }, status=404)

    except requests.RequestException as error:
        return Response({
            "error": "Weather service request failed",
            "details": str(error)
        }, status=502)


@api_view(["GET"])
def reverse_geocode(request):
    latitude = request.query_params.get("lat")
    longitude = request.query_params.get("lon")

    if latitude is None or longitude is None:
        return Response({
            "error": "Latitude and longitude are required"
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        latitude = float(latitude)
        longitude = float(longitude)

        if not (
            -90 <= latitude <= 90
            and -180 <= longitude <= 180
        ):
            return Response({
                "error": "Invalid coordinates"
            }, status=status.HTTP_400_BAD_REQUEST)

        address = reverse_geocode_location(latitude, longitude)

        if not address:
            return Response({
                "error": "No address found for these coordinates"
            }, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "status": "success",
            "address": address,
            "latitude": latitude,
            "longitude": longitude
        })

    except TomTomAPIKeyError:
        return Response({
            "error": "TomTom API key is not configured"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except requests.RequestException:
        return Response({
            "error": "Unable to retrieve address from TomTom"
        }, status=status.HTTP_502_BAD_GATEWAY)