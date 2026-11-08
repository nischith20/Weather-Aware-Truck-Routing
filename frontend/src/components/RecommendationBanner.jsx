
function RecommendationBanner({ recommendationStatus }) {
  if (recommendationStatus === "provisional") {
    return (
      <div className="warning-banner">
        <strong>Provisional recommendation:</strong>{" "}
        Some route checkpoints have missing weather data.
        Check the unknown miles before relying on the recommendation.
      </div>
    );
  }

  if (recommendationStatus === "complete") {
    return (
      <div className="success-banner">
        Weather data is available.
      </div>
    );
  }

  return null;
}

export default RecommendationBanner;
