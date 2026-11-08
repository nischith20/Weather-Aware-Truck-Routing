
function RouteCard({
  route,
  summary,
  isRecommended,
  isSelected,
  forecastOffset,
  onSelectRoute,
  formatRiskScore,
  formatMiles,
}) {
  const riskSegments = [
    { key: "low", label: "Low", color: "#16a34a" },
    { key: "moderate", label: "Moderate", color: "#eab308" },
    { key: "high", label: "High", color: "#f97316" },
    { key: "severe", label: "Severe", color: "#dc2626" },
    { key: "no_travel", label: "No Travel", color: "#7f1d1d" },
    { key: "unknown", label: "Unknown", color: "#64748b" },
  ].map((segment) => ({
    ...segment,
    miles: Number(summary[`${segment.key}_miles`] || 0),
  }));

  const totalRiskMiles = riskSegments.reduce(
    (total, segment) => total + segment.miles,
    0
  );

  const hasNoTravel = Number(summary.no_travel_miles || 0) > 0;
  const hasSevere = Number(summary.severe_miles || 0) > 0;
  const hasUnknown = Number(summary.unknown_miles || 0) > 0;

  return (
    
    <div
      className={`route-card ${
        isSelected ? "selected" : ""
      } ${isRecommended ? "recommended" : ""}`}
      onClick={() => onSelectRoute(route.route_id)}
    >
      
      <div className="route-card-header">
        <h3>Route {route.route_id}</h3>

        {isRecommended && (
          <span className="recommended-badge">Recommended</span>
        )}
      </div>

      <p>
        Distance:
        <strong> {route.distance_km} km</strong>
      </p>

      <p>
        Travel Time:
        <strong>
          {" "}
          {Math.floor(route.duration_minutes / 60)} h{" "}
          {Math.round(route.duration_minutes % 60)} m
        </strong>
      </p>

      <p>
        Average Risk Score:
        <strong> {formatRiskScore(summary.average_risk_score)}</strong>
      </p>

      <div className="risk-breakdown">
        <h4>Weather Risk Breakdown </h4>
        <h4>(+{forecastOffset} hours)</h4>

        <div className="risk-bar">
          {riskSegments.map(
            (segment) =>
              segment.miles > 0 && (
                <div
                  key={segment.key}
                  className="risk-bar-segment"
                  style={{
                    width:
                      totalRiskMiles > 0
                        ? `${(segment.miles / totalRiskMiles) * 100}%`
                        : "0%",
                    backgroundColor: segment.color,
                  }}
                  title={`${segment.label}: ${segment.miles} miles`}
                />
              )
          )}
        </div>

        <p className="risk-total">
          Analyzed distance: {formatMiles(totalRiskMiles)} miles
        </p>

        <div className="risk-percentages">
          {riskSegments.map((segment) => (
            <div className="risk-percentage-item" key={segment.key}>
              <span
                className="risk-dot"
                style={{ backgroundColor: segment.color }}
              />
              <span>{segment.label}</span>
              <strong>
                {totalRiskMiles > 0
                  ? ((segment.miles / totalRiskMiles) * 100).toFixed(1)
                  : "0.0"}
                %
              </strong>
            </div>
          ))}
        </div>
      </div>

      {hasNoTravel && (
        <div className="route-warning danger">
          <strong>Danger:</strong> This route contains no-travel weather
          conditions.
        </div>
      )}

      {!hasNoTravel && hasSevere && (
        <div className="route-warning danger">
          <strong>Warning:</strong> This route contains severe weather
          segments.
        </div>
      )}

      {hasUnknown && (
        <div className="route-warning unknown-warning">
          <strong>Weather unavailable:</strong> Some route segments could
          not be assessed.
        </div>
      )}

      {!hasNoTravel && !hasSevere && !hasUnknown && (
        <div className="route-safe">
          No severe, no-travel, or unknown segments reported.
        </div>
      )}

      <p className="coordinates-count">
        Map coordinates:
        <strong> {route.coordinates?.length || 0}</strong>
      </p>

      <p className="select-route-hint">
        Click to display this route on the map.
      </p>
    </div>
  );
}

export default RouteCard;
