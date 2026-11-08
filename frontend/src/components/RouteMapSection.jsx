
import RouteMap from "./RouteMap";

function RouteMapSection({
  routes,
  locations,
  selectedRoute,
  onSelectRoute,
  forecastOffset,
  onForecastOffsetChange,
  mapSectionRef,
}) {
  return (
    <div className="map-section" ref={mapSectionRef}>
      <h2>Route Map</h2>

      <div className="map-legend">
        <div className="legend-item">
          <span
            className="legend-color"
            style={{ background: "#2563eb" }}
          />
          Route 1
        </div>

        <div className="legend-item">
          <span
            className="legend-color"
            style={{ background: "#16a34a" }}
          />
          Route 2
        </div>

        <div className="legend-item">
          <span
            className="legend-color"
            style={{ background: "#e11d48" }}
          />
          Route 3
        </div>
      </div>

      <RouteMap
        routes={routes}
        locations={locations}
        selectedRoute={selectedRoute}
        onSelectRoute={onSelectRoute}
        forecastOffset={forecastOffset}
        onForecastOffsetChange={onForecastOffsetChange}
      />
    </div>
  );
}

export default RouteMapSection;
