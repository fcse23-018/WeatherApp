WeatherApp
A modern, responsive web application for viewing real-time weather data and interactive weather maps. WeatherApp provides current weather conditions, 7-day forecasts (daily and hourly), and a dynamic map visualization for any location worldwide.
Features

Current Weather: Displays temperature, humidity, wind speed, and weather conditions for a user-specified or geolocated city.
Forecast: Offers 7-day daily and 24-hour hourly weather forecasts with detailed metrics.
Interactive Maps: Visualizes weather data on an interactive map powered by the ArcGIS JavaScript API, with clickable markers showing temperature and conditions.
Progressive Web App (PWA): Offline support, fast loading, and installable on mobile/desktop devices.
Voice Search: Supports voice input for location search (browser-dependent).
Customizable Settings: Allows users to set default locations, units (°C/°F), and themes (light/dark).

Technologies

Frontend: HTML5, CSS3, JavaScript (ES6+)
APIs:
Storm Glass API: Provides weather data (temperature, precipitation, humidity, wind speed).
Nominatim OpenStreetMap API: Resolves city names to coordinates.
ArcGIS JavaScript API: Renders interactive weather maps.


PWA: Service Worker and Web App Manifest for offline capabilities and app-like experience.
No external libraries: Pure CSS for styling, ensuring lightweight performance.

Installation

Clone the repository:git clone https://github.com/your-username/WeatherApp.git


Navigate to the project directory:cd WeatherApp


Set up the images folder with required icons (sun.png, cloud.png, rain.png, snow.png, and favicons).
Host the app:
Local: Run python -m http.server 8000 and access at http://localhost:8000.
Production: Deploy to Netlify or Vercel with HTTPS.


Replace the Storm Glass API key in script.js with your own (sign up at Storm Glass):const API_KEY = 'your-storm-glass-api-key';



Usage

Home Page: View current weather by entering a city or enabling geolocation.
Forecast Page: Toggle between daily (7-day) and hourly (24-hour) forecasts.
Maps Page: Explore an interactive ArcGIS map with weather data markers.
Settings: Customize default location, units, and theme.
Offline Mode: Access cached pages and images without internet (weather data requires connectivity).

Notes

The Storm Glass free tier has a 50-request/day limit. Upgrade for higher usage.
Ensure all image files are in the images folder with exact names.
Test in Chrome for full functionality (voice search, PWA). Firefox/Edge support core features.

Contributing
Contributions are welcome! Please open an issue or submit a pull request for bug fixes or enhancements.
License
MIT License
