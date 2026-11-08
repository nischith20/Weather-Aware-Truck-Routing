
def summarize_route_risk(route):
    checkpoints = sorted(
        route.get("checkpoints", []),
        key=lambda cp: cp["distance_miles"]
    )

    summary = {
        "low_miles": 0.0,
        "moderate_miles": 0.0,
        "high_miles": 0.0,
        "severe_miles": 0.0,
        "no_travel_miles": 0.0,
        "unknown_miles": 0.0,
        "average_risk_score": None
    }

    weighted_risk_total = 0.0
    known_miles = 0.0

    for index in range(len(checkpoints) - 1):
        checkpoint = checkpoints[index]
        next_checkpoint = checkpoints[index + 1]

        segment_miles = max(
            0.0,
            next_checkpoint["distance_miles"]
            - checkpoint["distance_miles"]
        )

        risk = checkpoint.get("risk", {})
        risk_level = risk.get("risk_level")
        risk_score = risk.get("risk_score")

        if risk_level == "unknown" or risk_score is None:
            summary["unknown_miles"] += segment_miles
            continue

        if risk_level == "no_travel":
            summary["no_travel_miles"] += segment_miles
            # Count no-travel miles in the severe-or-worse total.
            summary["severe_miles"] += segment_miles

        elif risk_level == "severe":
            summary["severe_miles"] += segment_miles

        elif risk_level == "high":
            summary["high_miles"] += segment_miles

        elif risk_level == "moderate":
            summary["moderate_miles"] += segment_miles

        elif risk_level == "low":
            summary["low_miles"] += segment_miles

        known_miles += segment_miles
        weighted_risk_total += risk_score * segment_miles

    if known_miles > 0:
        summary["average_risk_score"] = round(
            weighted_risk_total / known_miles, 2
        )

    # Round distance totals for a cleaner API response.
    for key in summary:
        if key != "average_risk_score":
            summary[key] = round(summary[key], 2)

    return summary


def analyze_routes(routes):
    """
    Add risk summaries to routes and select the best route
    using the project's required priority order.
    """

    for route in routes:
        route["risk_summary"] = summarize_route_risk(route)

    if not routes:
        return None

    def route_sort_key(route):
        summary = route["risk_summary"]

        average_risk = summary["average_risk_score"]
        if average_risk is None:
            average_risk = float("inf")

        return (
            summary["severe_miles"],
            summary["high_miles"],
            average_risk,
            route["duration_minutes"]
        )

    ranked_routes = sorted(routes, key=route_sort_key)

    best_route = ranked_routes[0]

    # Mark the recommended route in the response.
    for route in routes:
        route["recommended"] = (
            route["route_id"] == best_route["route_id"]
        )

    return best_route["route_id"]
