import { useState, useEffect, useRef } from "react";
import "./App.css";

import JourneyForm from "./components/JourneyForm";
import JourneyLocations from "./components/JourneyLocations";
import RecommendationBanner from "./components/RecommendationBanner";
import RouteMapSection from "./components/RouteMapSection";
import RouteRiskComparison from "./components/RouteRiskComparison";

import { calculateForecastRiskSummary } from "./utils/routeAnalysis";

import {geocodeLocation,generateRoutes,} from "./services/routeService";


function App() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [loadWeight, setLoadWeight] = useState("");

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locations, setLocations] = useState(null);

  const [selectedRoute, setSelectedRoute] = useState(null);
  const [recommendedRouteId, setRecommendedRouteId] = useState(null);
  const [recommendationStatus, setRecommendationStatus] = useState("");

  // Used to automatically scroll to the map after route generation.
  const mapSectionRef = useRef(null);

  const [forecastOffset, setForecastOffset] = useState(0);

  useEffect(() => {
    if (routes.length > 0 && mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }, [routes]);

  

  // Generate truck routes.
    
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setRoutes([]);
    setLocations(null);
    setSelectedRoute(null);
    setRecommendedRouteId(null);
    setRecommendationStatus("");

    try {
      // Step 1: Find origin and destination.
      const [originResults, destinationResults] = await Promise.all([
        geocodeLocation(origin),
        geocodeLocation(destination)
      ]);

      const originLocation = originResults[0];
      const destinationLocation = destinationResults[0];

      setLocations({
        origin: originLocation,
        destination: destinationLocation
      });

      // Step 2: Generate truck routes using the service.
      const data = await generateRoutes({
        origin: {
          latitude: originLocation.latitude,
          longitude: originLocation.longitude
        },
        destination: {
          latitude: destinationLocation.latitude,
          longitude: destinationLocation.longitude
        },
        departure_time: new Date(departureTime).toISOString(),
        load_weight_lb: Number(loadWeight),
        checkpoint_interval_miles: 25
      });

      const generatedRoutes = data.routes || [];

      setRecommendedRouteId(data.recommended_route_id ?? null);
      setRecommendationStatus(data.recommendation_status || "");

      setRoutes(generatedRoutes);

      // Initially select the recommended route.
      const initialRouteId =
        data.recommended_route_id ??
        generatedRoutes[0]?.route_id ??
        null;

      setSelectedRoute(initialRouteId);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  // Display miles safely.
  const formatMiles = (value) => {
    return Number(value || 0).toFixed(1);
  };

  // Display average risk score.
  const formatRiskScore = (value) => {
    return value == null ? "Unavailable" : Number(value).toFixed(2);
  };

  return (
    <div className="app-container">

      <header className="header">
        <h1>Weather-Aware Truck Routing</h1>
        <p>
          Find safer routes using weather and truck load information.
        </p>
      </header>

      <main className="main-content">

        {/* Journey form */}
        <JourneyForm
          origin={origin}
          setOrigin={setOrigin}
          destination={destination}
          setDestination={setDestination}
          departureTime={departureTime}
          setDepartureTime={setDepartureTime}
          loadWeight={loadWeight}
          setLoadWeight={setLoadWeight}
          handleSubmit={handleSubmit}
          loading={loading}
          error={error}
        />

        {/* Journey locations */}
        <JourneyLocations locations={locations} />

        {/* Route results */}
        {routes.length > 0 && (
          <section className="results-section">

            <RecommendationBanner recommendationStatus={recommendationStatus}/>

            {/* Map appears first and automatically scrolls into view */}
            <RouteMapSection
              routes={routes}
              locations={locations}
              selectedRoute={selectedRoute}
              onSelectRoute={setSelectedRoute}
              forecastOffset={forecastOffset}
              onForecastOffsetChange={setForecastOffset}
              mapSectionRef={mapSectionRef}
            />

            
            <RouteRiskComparison
              routes={routes}
              recommendedRouteId={recommendedRouteId}
              selectedRoute={selectedRoute}
              setSelectedRoute={setSelectedRoute}
              forecastOffset={forecastOffset}
              calculateForecastRiskSummary={calculateForecastRiskSummary}
              formatRiskScore={formatRiskScore}
              formatMiles={formatMiles}
            />


          </section>
        )}

      </main>
    </div>
  );
}

export default App;
