
export function calculateForecastRiskSummary(route, offsetHours) {
  const checkpoints = [...(route.checkpoints || [])].sort(
    (a, b) => Number(a.distance_miles) - Number(b.distance_miles)
  );

  const totalMiles = Number(route.distance_km || 0) * 0.621371;

  const summary = {
    low_miles: 0,
    moderate_miles: 0,
    high_miles: 0,
    severe_miles: 0,
    no_travel_miles: 0,
    unknown_miles: 0,
    average_risk_score: null
  };

  let weightedRisk = 0;
  let knownMiles = 0;

  checkpoints.forEach((checkpoint, index) => {
    const startMiles = Number(checkpoint.distance_miles || 0);

    const nextMiles =
      index < checkpoints.length - 1
        ? Number(checkpoints[index + 1].distance_miles || 0)
        : totalMiles;

    const segmentMiles = Math.max(
      0,
      Math.min(nextMiles, totalMiles) - Math.min(startMiles, totalMiles)
    );

    if (segmentMiles <= 0) return;

    const forecast = (checkpoint.forecast_by_hour || []).find(
      item => Number(item.offset_hours) === Number(offsetHours)
    );

    const risk =
      forecast?.risk ||
      (Number(offsetHours) === 0 ? checkpoint.risk : null);

    const riskLevel = risk?.risk_level || "unknown";
    const riskScore = risk?.risk_score;

    if (
      !["low", "moderate", "high", "severe", "no_travel"].includes(riskLevel) ||
      riskScore == null
    ) {
      summary.unknown_miles += segmentMiles;
      return;
    }

    summary[`${riskLevel}_miles`] += segmentMiles;

    weightedRisk += Number(riskScore) * segmentMiles;
    knownMiles += segmentMiles;
  });

  if (knownMiles > 0) {
    summary.average_risk_score = Number(
      (weightedRisk / knownMiles).toFixed(2)
    );
  }

  Object.keys(summary).forEach(key => {
    if (key.endsWith("_miles")) {
      summary[key] = Number(summary[key].toFixed(1));
    }
  });

  return summary;
}
