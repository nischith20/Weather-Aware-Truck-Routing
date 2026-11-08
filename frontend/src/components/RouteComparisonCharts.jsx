import "./../App.css";

import { calculateForecastRiskSummary } from "../utils/routeAnalysis";

function RouteComparisonCharts({
  routes,
  recommendedRouteId,
  forecastOffset
}) {
  
  const routeData = routes.map(route => ({
    ...route,
    summary: calculateForecastRiskSummary(route, forecastOffset)
  }));

  const metrics = [
    {
      title: "Distance",
      max: Math.max(...routeData.map(r => Number(r.distance_km || 0)), 1),
      getValue: r => Number(r.distance_km || 0),
      format: v => `${v.toFixed(1)} km`
    },
    {
      title: "Travel Time",
      max: Math.max(...routeData.map(r => Number(r.duration_minutes || 0)), 1),
      getValue: r => Number(r.duration_minutes || 0),
      format: v => `${Math.floor(v / 60)}h ${Math.round(v % 60)}m`
    },
    {
      title: "Average Risk Score",
      max: 5,
      getValue: r => r.summary.average_risk_score,
      format: v => v == null ? "Unavailable" : `${v.toFixed(2)} / 5`
    },
    {
      title: "Severe + No Travel Miles",
      max: Math.max(
        ...routeData.map(r =>
          r.summary.severe_miles + r.summary.no_travel_miles
        ),
        1
      ),
      getValue: r =>
        r.summary.severe_miles + r.summary.no_travel_miles,
      format: v => `${v.toFixed(1)} miles`
    }
  ];

  return (
    <section className="comparison-chart-section">
      <h2>Route Performance Comparison</h2>

      <p className="chart-subtitle">
        Comparing routes at +{forecastOffset} hours.
      </p>

      <div className="comparison-chart-grid">
        {metrics.map(metric => (
          <div className="comparison-chart-card" key={metric.title}>
            <h3>{metric.title}</h3>

            {routeData.map(route => {
              const value = metric.getValue(route);

              const percentage = value == null
                ? 0
                : Math.max(0, Math.min((value / metric.max) * 100, 100));

              const recommended =
                route.route_id === recommendedRouteId;

              return (
                <div className="chart-route-row" key={route.route_id}>
                  <div className="chart-route-label">
                    <span>
                      Route {route.route_id}
                      {recommended ? " ★" : ""}
                    </span>
                    <strong>
                      {value == null ? "Unavailable" : metric.format(value)}
                    </strong>
                  </div>

                  <div className="chart-track">
                    <div
                      className={`chart-bar ${
                        recommended ? "recommended-chart-bar" : ""
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <p className="chart-footnote">
        Lower distance, travel time and risk scores are generally preferable.
        ★ indicates the recommended route.
      </p>
    </section>
  );
}

export default RouteComparisonCharts;
