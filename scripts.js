const API_KEY = '0871350e-3503-11f0-9b8b-0242ac130003-0871357c-3503-11f0-9b8b-0242ac130003'; // Storm Glass API key
const weatherIcons = {
  'clear': 'images/sun.png',
  'partlyCloudy': 'images/cloud.png',
  'cloudy': 'images/cloud.png',
  'rain': 'images/rain.png',
  'snow': 'images/snow.png',
  'drizzle': 'images/rain.png',
  'thunderstorm': 'images/rain.png',
  'mist': 'images/cloud.png',
  'fog': 'images/cloud.png'
};

document.addEventListener('DOMContentLoaded', () => {
  console.log('Page loaded:', window.location.pathname);
  const path = window.location.pathname;
  const page = path.split('/').pop() || 'index.html';
  
  // Load settings
  const settings = JSON.parse(localStorage.getItem('weatherSettings')) || {
    unit: 'metric',
    theme: 'light',
    defaultLocation: 'London'
  };
  document.body.className = `theme-${settings.theme}`;
  
  // Initialize Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').catch(error => {
      console.error('Service Worker registration failed:', error);
    });
  }

  // Common functions
  function showLoading(element) {
    element.querySelector('.loading').classList.remove('hidden');
    element.querySelectorAll('.weather-content, .forecast-content').forEach(el => el.classList.add('hidden'));
    element.querySelector('.error').classList.add('hidden');
  }

  function showError(element, message) {
    element.querySelector('.loading').classList.add('hidden');
    element.querySelector('.error').textContent = message;
    element.querySelector('.error').classList.remove('hidden');
    console.error('Error displayed:', message);
  }

  // Map Storm Glass cloud cover to weather condition
  function getWeatherCondition(cloudCover, precipitation) {
    if (!cloudCover || !precipitation) return 'cloudy';
    if (cloudCover < 20) return 'clear';
    if (cloudCover < 60) return 'partlyCloudy';
    if (precipitation > 0.5) {
      if (precipitation > 5) return 'rain';
      return 'drizzle';
    }
    return 'cloudy';
  }

  // Home Page: Current Weather
  if (page === 'index.html') {
    const weatherCard = document.querySelector('.weather-card');
    const searchForm = document.getElementById('search-form');
    const locationInput = document.getId('location-input');
    const unitToggle = document.getElementById('unit-toggle');
    const voiceSearch = document.getElementById('voice-search');

    function displayWeather(data, city, unit) {
      console.log('Displaying weather for:', city, data.hours[0]);
      const weatherContent = weatherCard.querySelector('.weather-content');
      const current = data.hours[0];
      const condition = getWeatherCondition(current.cloudCover?.noaa, current.precipitation?.noaa);
      weatherContent.querySelector('#city-name').textContent = city;
      weatherContent.querySelector('#temperature').textContent = `Temperature: ${Math.round(current.airTemperature.noaa)}°${unit === 'metric' ? 'C' : 'F'}`;
      weatherContent.querySelector('#description').textContent = `Condition: ${condition.charAt(0).toUpperCase() + condition.slice(1)}`;
      weatherContent.querySelector('#humidity').textContent = `Humidity: ${Math.round(current.humidity.noaa)}%`;
      weatherContent.querySelector('#wind').textContent = `Wind: ${Math.round(current.windSpeed.noaa)} ${unit === 'metric' ? 'm/s' : 'mph'}`;
      weatherContent.querySelector('#weather-icon').src = weatherIcons[condition] || 'images/cloud.png';
      weatherContent.querySelector('#weather-icon').alt = condition;
      weatherContent.classList.remove('hidden');
    }

    async function fetchWeather(lat, lon, city, unit) {
      console.log('Fetching weather for:', city, lat, lon);
      showLoading(weatherCard);
      try {
        const response = await fetch(`https://api.stormglass.io/v2/weather/point?lat=${lat}&lng=${lon}&params=airTemperature,cloudCover,precipitation,humidity,windSpeed`, {
          headers: { 'Authorization': API_KEY }
        });
        if (!response.ok) throw new Error(`API error: ${response.statusText}`);
        const data = await response.json();
        if (!data.hours || !data.hours[0]) throw new Error('No weather data available');
        displayWeather(data, city, unit);
        localStorage.setItem('lastLocation', city);
        localStorage.setItem('lastCoords', JSON.stringify({ lat, lon }));
        return data;
      } catch (error) {
        showError(weatherCard, error.message);
        console.error('Fetch weather failed:', error);
        return null;
      }
    }

    async function resolveLocation(location, unit) {
      console.log('Resolving location:', location);
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`);
        const data = await response.json();
        if (!response.ok || !data.length) throw new Error('Location not found');
        const { lat, lon, display_name } = data[0];
        return { lat: parseFloat(lat), lon: parseFloat(lon), city: display_name.split(',')[0] };
      } catch (error) {
        showError(weatherCard, error.message);
        console.error('Resolve location failed:', error);
        return null;
      }
    }

    function getLocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            const city = response.ok ? (await response.json()).address.city || 'Unknown' : 'Unknown';
            await fetchWeather(latitude, longitude, city, settings.unit);
          },
          async () => {
            const defaultLoc = settings.defaultLocation || 'London';
            const coords = await resolveLocation(defaultLoc, settings.unit);
            if (coords) fetchWeather(coords.lat, coords.lon, coords.city, settings.unit);
            showError(weatherCard, 'Location access denied, using default location');
          }
        );
      } else {
        const defaultLoc = settings.defaultLocation || 'London';
        resolveLocation(defaultLoc, settings.unit).then(coords => {
          if (coords) fetchWeather(coords.lat, coords.lon, coords.city, settings.unit);
          showError(weatherCard, 'Geolocation not supported, using default location');
        });
      }
    }

    searchForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const location = locationInput.value.trim();
      if (location) {
        const coords = await resolveLocation(location, settings.unit);
        if (coords) fetchWeather(coords.lat, coords.lon, coords.city, settings.unit);
      }
    });

    unitToggle.addEventListener('click', async () => {
      settings.unit = settings.unit === 'metric' ? 'imperial' : 'metric';
      localStorage.setItem('weatherSettings', JSON.stringify(settings));
      unitToggle.textContent = `°${settings.unit === 'metric' ? 'C' : 'F'} / °${settings.unit === 'metric' ? 'F' : 'C'}`;
      const lastLocation = localStorage.getItem('lastLocation') || settings.defaultLocation;
      const coords = await resolveLocation(lastLocation, settings.unit);
      if (coords) fetchWeather(coords.lat, coords.lon, coords.city, settings.unit);
    });

    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      voiceSearch.addEventListener('click', () => {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.start();
        recognition.onresult = async (event) => {
          locationInput.value = event.results[0][0].transcript;
          const coords = await resolveLocation(locationInput.value, settings.unit);
          if (coords) fetchWeather(coords.lat, coords.lon, coords.city, settings.unit);
        };
        recognition.onerror = () => showError(weatherCard, 'Voice recognition failed');
      });
    } else {
      voiceSearch.disabled = true;
      voiceSearch.title = 'Voice search not supported in this browser';
    }

    const lastLocation = localStorage.getItem('lastLocation') || settings.defaultLocation;
    if (lastLocation) {
      resolveLocation(lastLocation, settings.unit).then(coords => {
        if (coords) fetchWeather(coords.lat, coords.lon, coords.city, settings.unit);
      });
    } else {
      getLocation();
    }
  }

  // Forecast Page: Daily and Hourly Forecast
  if (page === 'forecast.html') {
    const forecastCard = document.querySelector('.forecast-card');
    const tabs = document.querySelectorAll('.tab');
    let activeTab = 'daily';

    async function fetchForecast(lat, lon, city, unit) {
      console.log('Fetching forecast for:', city, lat, lon);
      showLoading(forecastCard);
      try {
        const response = await fetch(`https://api.stormglass.io/v2/weather/point?lat=${lat}&lng=${lon}&params=airTemperature,cloudCover,precipitation,humidity,windSpeed&start=${new Date().toISOString()}&end=${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()}`, {
          headers: { 'Authorization': API_KEY }
        });
        if (!response.ok) throw new Error(`API error: ${response.statusText}`);
        const data = await response.json();
        if (!data.hours) throw new Error('No forecast data available');
        displayForecast(data, city, unit);
      } catch (error) {
        showError(forecastCard, error.message);
        console.error('Fetch forecast failed:', error);
      }
    }

    function displayForecast(data, city, unit) {
      console.log('Displaying forecast for:', city);
      const dailyForecast = document.getElementById('daily-forecast');
      const hourlyForecast = document.getElementById('hourly-forecast');
      dailyForecast.innerHTML = '';
      hourlyForecast.innerHTML = '';

      // Daily forecast (group by day)
      const dailyData = {};
      data.hours.forEach(item => {
        const date = new Date(item.time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        if (!dailyData[date]) dailyData[date] = [];
        dailyData[date].push(item);
      });

      Object.keys(dailyData).slice(0, 7).forEach(date => {
        const dayData = dailyData[date][0];
        const condition = getWeatherCondition(dayData.cloudCover?.noaa, dayData.precipitation?.noaa);
        const div = document.createElement('div');
        div.className = 'forecast-item';
        div.innerHTML = `
          <p>${date}</p>
          <img src="${weatherIcons[condition] || 'images/cloud.png'}" alt="${condition}">
          <p>${Math.round(dayData.airTemperature.noaa)}°${unit === 'metric' ? 'C' : 'F'}</p>
          <p>${condition.charAt(0).toUpperCase() + condition.slice(1)}</p>
        `;
        dailyForecast.appendChild(div);
      });

      // Hourly forecast (next 24 hours)
      data.hours.slice(0, 8).forEach(item => {
        const condition = getWeatherCondition(item.cloudCover?.noaa, item.precipitation?.noaa);
        const div = document.createElement('div');
        div.className = 'forecast-item';
        div.innerHTML = `
          <p>${new Date(item.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
          <img src="${weatherIcons[condition] || 'images/cloud.png'}" alt="${condition}">
          <p>${Math.round(item.airTemperature.noaa)}°${unit === 'metric' ? 'C' : 'F'}</p>
          <p>Precip: ${Math.round(item.precipitation.noaa * 100)}%</p>
        `;
        hourlyForecast.appendChild(div);
      });

      document.getElementById(`${activeTab}-forecast`).classList.remove('hidden');
    }

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.forecast-content').forEach(c => c.classList.add('hidden'));
        activeTab = tab.dataset.tab;
        document.getElementById(`${activeTab}-forecast`).classList.remove('hidden');
      });
    });

    const lastLocation = localStorage.getItem('lastLocation') || settings.defaultLocation;
    if (lastLocation) {
      resolveLocation(lastLocation, settings.unit).then(coords => {
        if (coords) fetchForecast(coords.lat, coords.lon, coords.city, settings.unit);
      });
    }
  }

  // Maps Page: Interactive ArcGIS Map
  if (page === 'maps.html') {
    // Load ArcGIS API dynamically
    const arcgisScript = document.createElement('script');
    arcgisScript.src = 'https://js.arcgis.com/4.28/';
    arcgisScript.onload = initializeMap;
    arcgisScript.onerror = () => console.error('Failed to load ArcGIS script');
    document.head.appendChild(arcgisScript);

    async function initializeMap() {
      console.log('Initializing ArcGIS map');
      require([
        'esri/Map',
        'esri/views/MapView',
        'esri/Graphic',
        'esri/layers/GraphicsLayer',
        'esri/geometry/Point',
        'esri/symbols/SimpleMarkerSymbol'
      ], (Map, MapView, Graphic, GraphicsLayer, Point, SimpleMarkerSymbol) => {
        const map = new Map({
          basemap: 'streets'
        });

        const view = new MapView({
          container: 'map',
          map: map,
          zoom: 6,
          center: [-0.1278, 51.5074] // Default: London
        });

        const graphicsLayer = new GraphicsLayer();
        map.add(graphicsLayer);

        async function addWeatherPoints() {
          console.log('Adding weather points for:', localStorage.getItem('lastLocation'));
          const location = localStorage.getItem('lastLocation') || settings.defaultLocation || 'London';
          try {
            const coords = await resolveLocation(location, settings.unit);
            if (!coords) throw new Error('Location not found');
            const response = await fetch(`https://api.stormglass.io/v2/weather/point?lat=${coords.lat}&lng=${coords.lon}&params=airTemperature,cloudCover,precipitation`, {
              headers: { 'Authorization': API_KEY }
            });
            if (!response.ok) throw new Error(`API error: ${response.statusText}`);
            const data = await response.json();
            if (!data.hours || !data.hours[0]) throw new Error('No weather data available');
            const current = data.hours[0];
            const condition = getWeatherCondition(current.cloudCover?.noaa, current.precipitation?.noaa);

            view.center = [coords.lon, coords.lat];

            const point = new Point({
              longitude: coords.lon,
              latitude: coords.lat
            });

            const markerSymbol = new SimpleMarkerSymbol({
              color: [226, 119, 40],
              outline: {
                color: [255, 255, 255],
                width: 2
              }
            });

            const pointGraphic = new Graphic({
              geometry: point,
              symbol: markerSymbol,
              attributes: {
                city: coords.city,
                temperature: `${Math.round(current.airTemperature.noaa)}°${settings.unit === 'metric' ? 'C' : 'F'}`,
                condition: condition
              },
              popupTemplate: {
                title: '{city}',
                content: 'Temperature: {temperature}<br>Condition: {condition}'
              }
            });

            graphicsLayer.add(pointGraphic);
          } catch (error) {
            console.error('Failed to load weather data for map:', error.message);
          }
        }

        view.when(() => {
          addWeatherPoints();
        });
      });
    }
  }

  // Settings Page
  if (page === 'settings.html') {
    const form = document.getElementById('settings-form');
    document.getElementById('default-location').value = settings.defaultLocation;
    document.getElementById('unit').value = settings.unit;
    document.getElementById('theme').value = settings.theme;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      settings.defaultLocation = document.getElementById('default-location').value.trim();
      settings.unit = document.getElementById('unit').value;
      settings.theme = document.getElementById('theme').value;
      localStorage.setItem('weatherSettings', JSON.stringify(settings));
      document.body.className = `theme-${settings.theme}`;
      alert('Settings saved!');
    });
  }
});