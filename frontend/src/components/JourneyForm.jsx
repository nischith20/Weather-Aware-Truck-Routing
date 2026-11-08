
import { reverseGeocode } from "../services/routeService";

function JourneyForm({
  origin,
  setOrigin,
  destination,
  setDestination,
  departureTime,
  setDepartureTime,
  loadWeight,
  setLoadWeight,
  handleSubmit,
  loading,
  error
}) {

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const address = await reverseGeocode(latitude, longitude);

          setOrigin(address);
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          alert(error.message);
        }
      },
      (error) => {
        console.error("GPS error:", error);
        alert(error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  return (
    <section className="form-card">
      <h2>Plan Your Journey</h2>

      <form onSubmit={handleSubmit}>
        <label>Origin</label>

        <div className="origin-input-wrapper">
          <input
            type="text"
            placeholder="Enter starting location"
            value={origin}
            onChange={e => setOrigin(e.target.value)}
            required
          />

          <button
            type="button"
            className="location-button"
            onClick={useCurrentLocation}
            title="Use my current location"
          >
            <span>◎</span>
            <span>My Location</span>
          </button>
        </div>

        <label>Destination</label>
        <input
          type="text"
          placeholder="Enter destination"
          value={destination}
          onChange={e => setDestination(e.target.value)}
          required
        />

        <label>Departure Date & Time</label>
        <input
          type="datetime-local"
          value={departureTime}
          onChange={e => setDepartureTime(e.target.value)}
          required
        />

        <label>Truck Load Weight (lb)</label>
        <input
          type="number"
          placeholder="Enter load weight"
          value={loadWeight}
          onChange={e => setLoadWeight(e.target.value)}
          min="1"
          step="any"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Generating Routes..." : "Generate Routes"}
        </button>
      </form>

      {error && (
        <p className="error-message">{error}</p>
      )}
    </section>
  );
}

export default JourneyForm;
