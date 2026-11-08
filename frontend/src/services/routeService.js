const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api";

export async function geocodeLocation(location) {
  const response = await fetch(
    `${API_BASE_URL}/geocode/?q=${encodeURIComponent(location)}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Location search failed");
  }

  if (!data.results || data.results.length === 0) {
    throw new Error(`No results found for ${location}`);
  }

  return data.results;
}

export async function generateRoutes(payload) {
  const response = await fetch(`${API_BASE_URL}/routes/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Route generation failed");
  }

  return data;
}

export async function reverseGeocode(latitude, longitude) {
  const response = await fetch(
    `${API_BASE_URL}/reverse-geocode/?lat=${latitude}&lon=${longitude}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Unable to find your address");
  }

  return data.address;
}