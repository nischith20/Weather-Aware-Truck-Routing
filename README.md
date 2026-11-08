# Weather-Aware Truck Routing

A web-based truck route planning application that evaluates weather conditions along multiple routes and recommends the safest route based on weather risks, truck load weight, and travel time.

## Overview

Weather-Aware Truck Routing helps truck drivers and fleet operators make safer travel decisions by analyzing weather conditions along their planned journeys.

The application generates up to three possible routes, checks weather conditions at route checkpoints, calculates risk levels, and recommends the safest available route.

## Features

- **Multiple route generation:** Generate up to three possible truck routes using TomTom Routing API.
- **Current location:** Use browser GPS to automatically populate the origin.
- **Location search:** Search for origin and destination using TomTom Geocoding.
- **Weather analysis:** Retrieve weather forecasts from Open-Meteo.
- **Checkpoint-based analysis:** Analyze weather conditions at configurable intervals of 10, 25, or 50 miles.
- **Weather risk classification:** Classify wind, rain, and snow conditions into low, moderate, high, severe, and no-travel levels.
- **Truck load consideration:** Apply additional weather risk rules based on truck load weight.
- **Route recommendation:** Recommend routes based on severe miles, high-risk miles, average risk, and travel duration.
- **Interactive map:** Display routes, checkpoints, weather information, and risk markers.
- **Forecast slider:** Explore weather forecasts over the next 48 hours.
- **Route comparison:** Compare distance, travel time, average risk, and severe-risk miles.

## Technologies Used

### Frontend

- React
- Vite
- JavaScript
- Leaflet
- React Leaflet
- CSS

### Backend

- Python
- Django
- Django REST Framework
- Requests

### External APIs

- TomTom Routing API
- TomTom Geocoding API
- TomTom Reverse Geocoding API
- Open-Meteo Weather API

### Deployment

- GitHub
- Vercel (Frontend)
- Render (Backend)
- Docker

## How It Works

1. The user enters an origin and destination or selects their current location.
2. The user selects departure date and time and enters truck load weight.
3. The frontend sends the journey details to the Django backend.
4. The backend requests possible truck routes from TomTom.
5. Checkpoints are generated along each route.
6. Open-Meteo provides weather information for the checkpoints.
7. The backend calculates weather risks using wind, rain, snow, and truck load rules.
8. The application compares the available routes and recommends the safest option.
9. The frontend displays routes, weather checkpoints, risk levels, and forecast information on an interactive map.

## Backend Setup

### 1. Navigate to the backend

```bash
cd backend
```

### 2. Create a virtual environment

```bash
python -m venv venv
```

Activate it:

Windows PowerShell:

```powershell
venv\Scripts\Activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file inside the backend folder.

Copy the contents of `.env.example` and replace the placeholder with your TomTom API key.

```env
TOMTOM_API_KEY=actual_api_key
```

### 5. Start the backend

```bash
python manage.py runserver
```

Backend URL:

```text
http://127.0.0.1:8000/
```

## Frontend Setup

### 1. Navigate to the frontend

```bash
cd frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the frontend

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:5173/
```

## API Endpoints

| Method | Endpoint                | Description                             |
| ------ | ----------------------- | --------------------------------------- |
| GET    | `/api/health/`          | Check backend status                    |
| GET    | `/api/geocode/`         | Search for a location                   |
| GET    | `/api/reverse-geocode/` | Convert GPS coordinates into an address |
| POST   | `/api/routes/`          | Generate and analyze truck routes       |
| GET    | `/api/weather/`         | Retrieve weather forecast data          |

### Route Generation Request

`POST /api/routes/`

Example request:

```json
{
  "origin": {
    "latitude": 12.045604,
    "longitude": 77.026048
  },
  "destination": {
    "latitude": 12.2958,
    "longitude": 76.6394
  },
  "departure_time": "2026-11-08T16:00:00",
  "load_weight_lb": 25000,
  "checkpoint_interval_miles": 25
}
```

The API returns available routes, checkpoint weather information, risk summaries, and the recommended route.

## Weather Risk Analysis

Weather conditions are classified into different risk levels:

| Risk Level | Description                                     |
| ---------- | ----------------------------------------------- |
| Low        | Normal driving conditions                       |
| Moderate   | Some weather-related caution required           |
| High       | Increased driving risk                          |
| Severe     | Dangerous driving conditions                    |
| No Travel  | Conditions exceed the defined safety thresholds |
| Unknown    | Weather information is unavailable              |

The risk calculation also considers truck load weight and additional wind-related safety rules.

## Docker Setup

The project includes Dockerfiles for both frontend and backend, along with a Docker Compose configuration.

From the project root, run:

```bash
docker compose up --build
```

Frontend:

```text
http://localhost:5173/
```

Backend:

```text
http://localhost:8000/
```

Make sure your backend `.env` file is configured before starting Docker Compose.

## Deployment

The application can be deployed using separate hosting platforms:

- Frontend: Vercel
- Backend: Render
- Source code: GitHub

Configure the following environment variables in the hosting platforms:

**Render Backend**

```env
TOMTOM_API_KEY=actual_api_key
```

**Vercel Frontend**

```env
VITE_API_BASE_URL=https://backend-service.onrender.com/api
```

Replace the example URL with your actual deployed backend URL.

Configure Django's production `ALLOWED_HOSTS` and CORS settings to include your deployed domains.

## Security

- API keys are stored in backend environment variables.
- Never commit the actual `.env` file.
- Use `.env.example` to document required configuration.
- Restrict production CORS to trusted frontend origins.

## Future Improvements

- Real-time weather updates.
- Additional truck-specific safety parameters.
- Improved route visualization.
- More detailed weather alerts.
- Fleet management and saved route history.

---

**Note:** Weather forecasts and route recommendations depend on external API availability and forecast coverage. A recommendation may be provisional when checkpoint weather information is unavailable.
