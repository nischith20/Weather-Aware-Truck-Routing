
import RouteCard from "./RouteCard";
import RouteComparisonCharts from "./RouteComparisonCharts";

function RouteRiskComparison({
  routes,
  recommendedRouteId,
  selectedRoute,
  setSelectedRoute,
  forecastOffset,
  calculateForecastRiskSummary,
  formatRiskScore,
  formatMiles,
}) {
  return (
    <section>
      <RouteComparisonCharts
        routes={routes}
        recommendedRouteId={recommendedRouteId}
        forecastOffset={forecastOffset}
      />

      <div className="routes-grid">
        {routes.map((route) => (
          <RouteCard
            key={route.route_id}
            route={route}
            summary={calculateForecastRiskSummary(
              route,
              forecastOffset
            )}
            isRecommended={route.route_id === recommendedRouteId}
            isSelected={selectedRoute === route.route_id}
            forecastOffset={forecastOffset}
            onSelectRoute={setSelectedRoute}
            formatRiskScore={formatRiskScore}
            formatMiles={formatMiles}
          />
        ))}
      </div>
    </section>
  );
}

export default RouteRiskComparison;
