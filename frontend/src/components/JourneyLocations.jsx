
function JourneyLocations({ locations }) {
  if (!locations) {
    return null;
  }

  return (
    <section className="results-section">
      <h2>Journey Locations</h2>

      <p>
        <strong>Origin:</strong> {locations.origin.address}
      </p>

      <p>
        <strong>Destination:</strong> {locations.destination.address}
      </p>
    </section>
  );
}

export default JourneyLocations;
