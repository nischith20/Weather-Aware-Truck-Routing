from django.urls import path
from . import views


urlpatterns = [
    path('health/', views.health_check, name='health-check'),

    path('routes/', views.generate_routes, name='generate-routes'),

    path('geocode/', views.geocode_location, name='geocode-location'),

    path("weather/", views.weather_forecast, name="weather_forecast"),
    path("reverse-geocode/", views.reverse_geocode, name="reverse-geocode"),
]