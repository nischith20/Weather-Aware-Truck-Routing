import { useEffect, useMemo, useRef, useState } from "react";

import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Popup,
  useMap
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

const routeColors = [
  "#2563eb",
  "#16a34a",
  "#e11d48"
];

// Colors based on weather risk.
const riskColors = {
  low: "#16a34a",
  moderate: "#eab308",
  high: "#f97316",
  severe: "#dc2626",
  no_travel: "#7f1d1d",
  unknown: "#64748b"
};

function FitRoutes({ routes }) {
  const map = useMap();

  useEffect(() => {
    const allPoints = routes.flatMap(route =>
      (route.coordinates || [])
        .filter(point =>
          Number.isFinite(point.latitude) &&
          Number.isFinite(point.longitude)
        )
        .map(point => [
          point.latitude,
          point.longitude
        ])
    );

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);

      map.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 12
      });
    }
  }, [routes, map]);

  return null;
}

function getRiskColor(riskLevel) {
  return riskColors[riskLevel] || riskColors.unknown;
}

function getForecastForCheckpoint(checkpoint, offsetHours) {
  const forecast = checkpoint.forecast_by_hour?.find(
    item => Number(item.offset_hours) === Number(offsetHours)
  );

  if (forecast) {
    return {
      ...forecast,
      risk: forecast.risk || (
        Number(offsetHours) === 0 ? checkpoint.risk : null
      )
    };
  }

  if (Number(offsetHours) === 0) {
    return {
      weather: checkpoint.weather,
      risk: checkpoint.risk
    };
  }

  return null;
}

function WeatherCheckpoint({ checkpoint, offsetHours }) {
  const forecast = getForecastForCheckpoint(
    checkpoint,
    offsetHours
  );

  if (!forecast) return null;

  const weather = forecast.weather || {};
  const risk = forecast.risk || {};

  const riskLevel =
    risk.risk_level ||
    risk.risk ||
    "unknown";

  return (
    <CircleMarker
      center={[
        checkpoint.latitude,
        checkpoint.longitude
      ]}
      radius={8}
      pathOptions={{
        color: "#ffffff",
        weight: 2,
        fillColor: getRiskColor(riskLevel),
        fillOpacity: 0.95
      }}
    >
      <Popup>
        <div className="weather-popup">
          <strong>
            Checkpoint {checkpoint.checkpoint_id}
          </strong>

          <p>
            Distance: {checkpoint.distance_miles} miles
          </p>

          <p>
            Risk:
            <strong> {riskLevel.replace("_", " ").toUpperCase()}</strong>
          </p>

          <p>
            Forecast:
            {" "}
            {weather.forecast_time || "Unavailable"}
          </p>

          <hr />

          <p>
            Temperature:
            {" "}
            {weather.temperature_c ?? "N/A"} °C
          </p>

          <p>
            Wind:
            {" "}
            {weather.wind_speed_kmh ?? "N/A"} km/h
          </p>

          <p>
            Rain:
            {" "}
            {weather.precipitation_mm ?? "N/A"} mm
          </p>

          <p>
            Snow:
            {" "}
            {weather.snowfall_cm ?? "N/A"} cm
          </p>
        </div>
      </Popup>
    </CircleMarker>
  );
}

function RouteMap({
  routes,
  locations,
  selectedRoute,
  onSelectRoute,
  forecastOffset,
  onForecastOffsetChange
}) {
  const mapWrapperRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await mapWrapperRef.current?.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);


  const selectedRouteData = useMemo(() => {
    return (
      routes.find(route => route.route_id === selectedRoute) ||
      routes[0]
    );
  }, [routes, selectedRoute]);

  const allCoordinates = routes.flatMap(route =>
    route.coordinates || []
  );

  if (allCoordinates.length === 0) {
    return (
      <div className="map-empty">
        No route coordinates available.
      </div>
    );
  }

  const firstPoint = allCoordinates[0];

  const checkpoints =
    selectedRouteData?.checkpoints || [];

  const hasForecastData = checkpoints.some(checkpoint =>
    (checkpoint.forecast_by_hour || []).some(
      item => Number(item.offset_hours) === forecastOffset
    )
  );

  return (
    <div className="weather-map-panel">

      {/* Forecast controls */}

      <div className="forecast-controls">

        <div className="forecast-heading">
          <h3>Weather Forecast</h3>

          <span>
            +{forecastOffset} hours
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="48"
          step="1"
          value={forecastOffset}
          onChange={e =>
            onForecastOffsetChange(Number(e.target.value))
          }
          className="forecast-slider"
        />

        <div className="slider-labels">
          <span>Now</span>
          <span>12 hours</span>
          <span>24 hours</span>
          <span>36 hours</span>
          <span>48 hours</span>
        </div>

        <p className="forecast-description">
          Showing forecast data for Route{" "}
          {selectedRouteData?.route_id}.
        </p>

        {!hasForecastData && (
          <p className="forecast-notice">
            Hourly forecast data for this selection is not
            available.
          </p>
        )}

      </div>

      {/* Risk legend */}

      <div className="weather-legend">
        {Object.entries(riskColors).map(([risk, color]) => (
          <div className="weather-legend-item" key={risk}>
            <span
              className="weather-dot"
              style={{ backgroundColor: color }}
            />
            {risk.replace("_", " ")}
          </div>
        ))}
      </div>

      {/* Leaflet map */}

      <div className="map-wrapper" ref={mapWrapperRef}>
        <button
          className="map-fullscreen-button"
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit fullscreen" : "View fullscreen"}
          type="button"
        >
          {isFullscreen ? "✕" : "⤢"}
        </button>

        <MapContainer
          center={[
            firstPoint.latitude,
            firstPoint.longitude
          ]}
          zoom={6}
          scrollWheelZoom={true}
          className="route-map"
        >

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitRoutes routes={routes} />

          {/* Draw all routes */}

          {routes.map((route, index) => {
            const positions = (route.coordinates || [])
              .map(point => [
                point.latitude,
                point.longitude
              ]);

            const isSelected =
              selectedRoute === route.route_id;

            return (
              <Polyline
                key={route.route_id}
                positions={positions}
                pathOptions={{
                  color: routeColors[index % routeColors.length],
                  weight: isSelected ? 8 : 5,
                  opacity: isSelected ? 1 : 0.55
                }}
                eventHandlers={{
                  click: () =>
                    onSelectRoute(route.route_id)
                }}
              >
                <Popup>
                  <strong>Route {route.route_id}</strong>
                  <br />
                  Distance: {route.distance_km} km
                  <br />
                  Travel time: {route.duration_minutes} minutes
                </Popup>
              </Polyline>
            );
          })}

          {/* Weather checkpoints for selected route */}

          {checkpoints.map(checkpoint => (
            <WeatherCheckpoint
              key={`${selectedRouteData.route_id}-${checkpoint.checkpoint_id}`}
              checkpoint={checkpoint}
              offsetHours={forecastOffset}
            />
          ))}

          {/* Origin marker */}

          {locations && (
            <CircleMarker
              center={[
                locations.origin.latitude,
                locations.origin.longitude
              ]}
              radius={9}
              pathOptions={{
                color: "#ffffff",
                fillColor: "#16a34a",
                fillOpacity: 1,
                weight: 3
              }}
            >
              <Popup>
                <strong>Starting Point</strong>
                <br />
                {locations.origin.address}
              </Popup>
            </CircleMarker>
          )}

          {/* Destination marker */}

          {locations && (
            <CircleMarker
              center={[
                locations.destination.latitude,
                locations.destination.longitude
              ]}
              radius={9}
              pathOptions={{
                color: "#ffffff",
                fillColor: "#dc2626",
                fillOpacity: 1,
                weight: 3
              }}
            >
              <Popup>
                <strong>Destination</strong>
                <br />
                {locations.destination.address}
              </Popup>
            </CircleMarker>
          )}

        </MapContainer>

      </div>
    </div>
  );
}

export default RouteMap;