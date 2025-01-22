import { updateTime } from './modules/header.js';
import { displayWeatherData } from './modules/weatherDetails.js';
const { DateTime } = luxon;
import { createLineChart } from './modules/lineChart.js';
import { createRealtimeChart } from './modules/lineChart.js';


updateTime();

const apiKey = 'dtYQZYtAmR1SF1gHaifXh854PrkeC0nm';
const options = { method: 'GET', headers: { accept: 'application/json' } };

class ApiRateLimiter {
  constructor({ maxRequestsPerSecond, maxRequestsPerHour }) {
    this.queue = [];
    this.isProcessing = false;
    this.maxRequestsPerSecond = maxRequestsPerSecond;
    this.maxRequestsPerHour = maxRequestsPerHour;
    this.requestsInLastSecond = 0;
    this.requestsInLastHour = 0;

    setInterval(() => {
      console.log(`Anfragen in der letzten Sekunde: ${this.requestsInLastSecond}`);
      this.requestsInLastSecond = 0;
    }, 1000);

    console.log(`Anfragen in der letzten Stunde: ${this.requestsInLastHour}`);
    setInterval(() => {
      this.requestsInLastHour = 0;
    }, 3600000);
  }

  addRequest(requestFunction) {
    const backoff = Math.min(5000, (this.requestsInLastSecond + 1) * 1000); // Backoff bei hoher Last
    return new Promise((resolve, reject) => {
      this.queue.push({ requestFunction, resolve, reject, backoff });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) continue;
      const { requestFunction, resolve, reject, backoff } = item;
      if (
        this.requestsInLastSecond < this.maxRequestsPerSecond &&
        this.requestsInLastHour < this.maxRequestsPerHour
      ) {
        try {
          this.requestsInLastSecond++;
          this.requestsInLastHour++;
          const result = await requestFunction();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      } else {
        console.warn(`Warte ${backoff / 1000} Sekunden wegen API-Limit`);
        await new Promise((res) => setTimeout(res, backoff));
        this.queue.unshift({ requestFunction, resolve, reject, backoff });
      }
    }

    this.isProcessing = false;
  }
}

const apiLimiter = new ApiRateLimiter({ maxRequestsPerSecond: 3, maxRequestsPerHour: 25 });



async function fetchWithLimiter(url, options) {
  return apiLimiter.addRequest(() => fetch(url, options));
}

//Funktion zum Speichern von Daten in Cache
function saveToCache(key, data, callInMinutes = 1) {
  try {
    const now = new Date();
    const item = {
      data: data,
      expiry: now.getTime() + callInMinutes * 60 * 1000, //Ablaufzeit in ms
    };
    const itemStr = JSON.stringify(item);

    // Speicherplatz prüfen
    if (itemStr.length > 5000000) { // 5 MB als Beispiel
      console.warn("Daten sind zu groß für localStorage und werden nicht gespeichert.");
      return;
    }
    localStorage.setItem(key, itemStr);
  } catch (error) {
    console.error("Fehler beim Speichern in localStorage:", error);
  }
}
function clearExpiredCache() {
  const now = new Date();
  Object.keys(localStorage).forEach((key) => {
    try {
      const itemStr = localStorage.getItem(key);
      const item = JSON.parse(itemStr);
      if (item.expiry && now.getTime() > item.expiry) {
        localStorage.removeItem(key); // Lösche abgelaufene Einträge
        console.log(`Abgelaufener Cache entfernt: ${key}`);
      }
    } catch (error) {
      console.error(`Fehler beim Prüfen von ${key}:`, error);
    }
  });
}

// Ruft clearExpiredCache vor jedem Speichern auf
clearExpiredCache();

//Funktion zum Abrufen der Daten vom Cache
function getFromCache(key) {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;

  const item = JSON.parse(itemStr);
  const now = new Date();

  if (now.getTime() > item.expiry) {
    localStorage.removeItem(key);
    return null;
  }
  return item.data;
}


// Funktion, um Echtzeitdaten periodisch abzurufen
async function fetchRealtimeData(city) {
  console.log("fetchRealtimeData aufgerufen für Stadt:", city);
  const realtimeKey = `weatherData_realtime_${city}`;
  const cachedRealtimeData = getFromCache(realtimeKey);

  if (cachedRealtimeData) {
    console.log("Echtzeitdaten aus Cache verwendet:", cachedRealtimeData);
    return cachedRealtimeData;
  }

  try {
    const realtimeUrl = `https://api.tomorrow.io/v4/weather/realtime?location=${city}&apikey=${apiKey}`;
    const realtimeResponse = await fetchWithLimiter(realtimeUrl, options);

    if (!realtimeResponse.ok) {
      console.error("Fehler beim Abrufen der Echtzeitdaten:", realtimeResponse.statusText);
      return null;
    }

    const realtimeData = await realtimeResponse.json();
    console.log("Empfangene Echtzeitdaten:", realtimeData);

    const currentTemp = Math.floor(realtimeData.data.values.temperature) || "N/A";
    const currentTime = new Date(realtimeData.data.time).toISOString();

    saveToCache(realtimeKey, { time: currentTime, temp: currentTemp });

    console.log("Neue Echtzeitdaten abgerufen und gespeichert:", {
      time: currentTime,
      temp: currentTemp,
    });

    return { time: currentTime, temp: currentTemp };
  } catch (error) {
    console.error("Fehler beim Abrufen der Echtzeitdaten:", error);

    if (cachedRealtimeData) {
      console.warn("Verwende ältere Echtzeitdaten aus Cache nach API-Fehler:", cachedRealtimeData);
      return cachedRealtimeData;
    }
    return null;

  }

}

// Echtzeitdaten regelmäßig aktualisieren
function startRealtimeUpdates(city, updateInterval = 60000, updateChartCallback) {
  let realtimeData = [];
  const maxDataPoints = 100;
  let isWebSocketConnected = false; 

  setupWebSocket(city, (newData) => {
    console.log("WebSocket-Daten für den Chart:", newData);
    realtimeData.push(...newData);
    console.log("WebSocket-Daten:", newData);
    if (realtimeData.length > maxDataPoints) {
      realtimeData = realtimeData.slice(-maxDataPoints);
    }
    console.log("Echtzeitdaten nach WebSocket-Update:", realtimeData);
    if (typeof updateChartCallback === "function") {
      updateChartCallback(realtimeData);
    }
  });

  // Optionaler Fallback: Periodische API-Abfragen
  setInterval(async () => {
    if (!isWebSocketConnected) {
      console.warn("WebSocket nicht verbunden, Fallback zur API");
      const newRealtimeData = await fetchRealtimeData(city);
      if (newRealtimeData) {
        realtimeData.push(newRealtimeData);

        // Beschränkung auf maximale Datenpunkte
        if (realtimeData.length > maxDataPoints) {
          realtimeData.shift();
        }

        if (typeof updateChartCallback === "function") {
          updateChartCallback(realtimeData);
        }
      }
    }
  }, updateInterval);
}



function processWeatherData(weatherData, city) {
  const { realtime, forecast, fetchedAt } = weatherData;

  console.log("Daten abgerufen um:", fetchedAt);
  console.log("Realtime-Daten:", realtime);
  console.log("Forecast-Daten:", forecast);

  const currentTime = new Date().toISOString();

  if (new Date(fetchedAt) < new Date(currentTime)) {
    console.log("Verwende gespeicherte Forecast-Daten.");
  }

  const currentTemp = Math.floor(realtime.data.values.temperature) || "N/A";
  console.log("Aktuelle Temperatur:", currentTemp);

  if (!forecast.timelines || !forecast.timelines.daily || !forecast.timelines.hourly) {
    console.error("Fehler: Forecast-Daten sind unvollständig:", forecast.timelines);
    return;
  }

  const todayForecast = forecast.timelines?.daily?.[0]?.values;

  const dailyForecast = forecast.timelines?.daily;

  if (!todayForecast) {
    throw new Error('Forecast-Daten fehlen oder sind unvollständig!');
  }
  console.log("Tagesvorhersage:", todayForecast);


  const hourlyForecastData = forecast.timelines.hourly.map((entry) => ({
    time: entry.time || "Zeit nicht verfügbar",
    temp: entry.values.temperature,

  }));


  console.log("Daten für Chart:", hourlyForecastData);

  // Erstellt den Line Chart
  processForecastData(hourlyForecastData);

  const allWeatherCodes = realtime.data.values.weatherCode;

  //Hole latitude und longitude aus den realtime daten
  const { lat: latitude, lon: longitude } = realtime.location || {};
  if (latitude === undefined || longitude === undefined) {
    console.error("Koordinaten nicht verfügbar!");
    return;
  }
  //Zeitzone basierend auf den Koordinaten
  const timeZone = getTimeZone(latitude, longitude);
  const sunRiseLocal = convertToLocalTime(todayForecast.sunriseTime, timeZone);
  const sunSetLocal = convertToLocalTime(todayForecast.sunsetTime, timeZone);

  loadWeatherData().then((weatherCodeDescriptions) => {
    const weatherDescription = weatherCodeDescriptions[allWeatherCodes] || "Beschreibung nicht verfügbar";

    const weatherDataShow = {
      weatherCode: weatherDescription || "Unbekannt",
      temperatureNow: Math.floor(realtime.data.values?.temperature) ?? "N/A",
      temperatureMax: Math.floor(todayForecast.temperatureMax) ?? "N/A",
      temperatureMin: Math.floor(todayForecast.temperatureMin) ?? "N/A",
      temperatureApparent: Math.floor(realtime.data.values.temperatureApparent) ?? "N/A",
      precipitationAvg: todayForecast?.precipitationProbabilityAvg ?? "Daten fehlen",
      windSpeed: realtime.data.values.windSpeed || "N/A",
      windDirection: realtime.data.values.windDirection || "N/A",
      humidity: realtime.data.values.humidity || "N/A",
      uvIndex: realtime.data.values.uvIndex,
    };
    console.log("Weather-Details:", weatherDataShow);


    displayWeatherData({
      cityName: city,
      sunRise: sunRiseLocal,
      sunSet: sunSetLocal,
      weatherDetails: weatherDataShow,
    });


  });
  console.log("Zeitzone:", timeZone);
  console.log("Lokaler Sonnenaufgang:", sunRiseLocal);
  console.log("Lokaler Sonnenuntergang:", sunSetLocal);



  function getTimeZone(latitude, longitude) {
    if (latitude === undefined || longitude === undefined) {
      console.error("Ungültige Koordinaten:", { latitude, longitude });
      return "UTC";
    }
    const offset = longitude / 15; // Näherung für Zeitzonen
    const hours = Math.floor(offset);
    const minutes = Math.abs(Math.round((offset - hours) * 60));
    const utcZone = `UTC${hours >= 0 ? "+" : ""}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    return utcZone;
  }


  //Funktion um die lokale Zeit zu finden
  function convertToLocalTime(time, timeZone) {
    if (!time) {
      console.error("Ungültiger Zeitwert für Konvertierung:", time);
      return "Ungültige Zeit";
    }

    try {
      const localTime = DateTime.fromISO(time, { zone: "UTC" }).setZone(timeZone);
      return localTime.toLocaleString(DateTime.TIME_24_SIMPLE);
    } catch (error) {
      console.error("Fehler bei der Zeitkonvertierung:", error);
      return "Zeitfehler";
    }
  }
  console.log("Stundenwerte (hourlyForecastData):", hourlyForecastData);
  console.log("Beispiel einer hourly-Einheit:", forecast.timelines.hourly[0]);


  const sunRise = todayForecast.sunriseTime;
  const sunSet = todayForecast.sunsetTime;


  const cityName = city;

  console.log('Wetterdaten für displayWeatherData:', { sunRise, sunSet, cityName, weatherData });

}

async function loadWeatherData() {
  try {
    const response = await fetch('./weatherCodes.json');
    if (!response.ok) {
      throw new Error(`Fehler beim Laden der JSON-Datei: ${response.statusText}`);
    }
    const jsonData = await response.json();
    return jsonData.weatherCode;
  } catch (error) {
    console.error("Fehler beim Laden der Wettercodes:", error);
    return {};
  }
}

async function fetchForecastData(city) {
  const forecastKey = `weatherData_forecast_${city}`;
  const cachedForecast = getFromCache(forecastKey);

  if (cachedForecast) {
    console.log("Gespeicherte Vorhersagedaten verwenden:", cachedForecast);
    return cachedForecast;
  }

  const forecastUrl = `https://api.tomorrow.io/v4/weather/forecast?location=${city}&apikey=${apiKey}`;
  try {
    const response = await fetchWithLimiter(forecastUrl, options);
    if (!response.ok) throw new Error("Fehler beim Abrufen der Vorhersagedaten");
    const forecastData = await response.json();
    saveToCache(forecastKey, forecastData, 15); // 15 Minuten Cache für Vorhersage
    return forecastData;
  } catch (error) {
    console.error("Fehler beim Abrufen der Vorhersagedaten:", error);
    return null;
  }
}

async function fetchRealtimeData(city) {
  const realtimeKey = `weatherData_realtime_${city}`;
  const cachedRealtime = getFromCache(realtimeKey);

  if (cachedRealtime) {
    console.log("Gespeicherte Echtzeitdaten verwenden:", cachedRealtime);
    return cachedRealtime;
  }

  const realtimeUrl = `https://api.tomorrow.io/v4/weather/realtime?location=${city}&apikey=${apiKey}`;
  try {
    const response = await fetchWithLimiter(realtimeUrl, options);
    if (!response.ok) throw new Error("Fehler beim Abrufen der Echtzeitdaten");
    const realtimeData = await response.json();
    saveToCache(realtimeKey, realtimeData, 2); // 2 Minuten Cache für Echtzeitdaten
    return realtimeData;
  } catch (error) {
    console.error("Fehler beim Abrufen der Echtzeitdaten:", error);
    return null;
  }
}

async function fetchWeatherData(city) {

  try {
    const forecastData = await fetchForecastData(city);
    const realtimeData = await fetchRealtimeData(city);

    if (forecastData && realtimeData) {
      const weatherData = {
        realtime: realtimeData,
        forecast: forecastData,
        fetchedAt: new Date().toISOString(),
      };
      processWeatherData(weatherData, city);
    } else {
      console.error("Eines der Datenpakete konnte nicht abgerufen werden.");
    }
  } catch (error) {
    console.error("Fehler beim Abrufen der Wetterdaten:", error);
  }
}


function setupWebSocket(city, updateChartCallback) {
  const WEBSOCKET_URL = "ws://127.0.0.1:8080";
  let ws = null;
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 5;
  const INITIAL_RECONNECT_DELAY = 1000;
  let isConnected = false;
  let lastSubscribedCity = null;

  function connect() {
      if (ws) {
          ws.close();
      }

      ws = new WebSocket(WEBSOCKET_URL);
      const receivedTimestamps = new Set();

      ws.onopen = () => {
          console.log(`WebSocket connection established for ${city}`);
          isConnected = true;
          reconnectAttempts = 0;
          lastSubscribedCity = city;
          // Subscribe to the city's weather updates
          ws.send(JSON.stringify({ type: "subscribe", city: city }));
      };

      ws.onmessage = (event) => {
          try {
              const data = JSON.parse(event.data);
              
              // Verify this data is for the correct city
              if (data.city !== city) {
                  console.warn("Received data for wrong city, ignoring.");
                  return;
              }

              // Check for duplicate timestamps
              if (receivedTimestamps.has(data.time)) {
                  console.warn("Duplicate data received, ignoring.");
                  return;
              }
              receivedTimestamps.add(data.time);

              // Clear old timestamps (optional, prevents memory leaks)
              if (receivedTimestamps.size > 1000) {
                  const oldestTimestamp = Array.from(receivedTimestamps)[0];
                  receivedTimestamps.delete(oldestTimestamp);
              }

              // Format data for the chart
              const chartData = [{
                  time: new Date(data.time).toISOString(),
                  temp: parseFloat(data.temp.toFixed(1)),
                  humidity: Number(data.humidity),
                  windSpeed: Number(data.windSpeed),
                  visibility: Number(data.visibility),
                  pressureSurfaceLevel: Number(data.pressureSurfaceLevel),
                  cloudCover: Number(data.cloudCover)
              }];

              console.log("Processing data for chart:", chartData);

              if (typeof updateChartCallback === "function") {
                  updateChartCallback(chartData);
              }else {
                console.warn("No valid callback function provided");
            }
          } catch (error) {
              console.error("Error processing WebSocket data:", error);
          }
      };

      ws.onclose = () => {
          console.warn(`WebSocket connection closed for ${city}`);
          isConnected = false;
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
              const delay = INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts);
              console.log(`Attempting to reconnect in ${delay/1000} seconds...`);
              setTimeout(() => {
                  reconnectAttempts++;
                  connect();
              }, delay);
          } else {
              console.error("Max reconnection attempts reached");
          }
      };

      ws.onerror = (error) => {
          console.error("WebSocket error:", error);
      };
  }

  connect();

  return {
      disconnect: () => {
          if (ws) {
            console.log(`Disconnecting WebSocket for ${city}`);
              isConnected = false;
              lastSubscribedCity = null;
              ws.close();
              ws = null;
          }
      },
      isConnected: () => isConnected,
      reconnect: () => {
        console.log(`Reconnecting WebSocket for ${city}`);
        reconnectAttempts = 0;
        connect();
      }
  };
}

document.addEventListener('DOMContentLoaded', () => {
  let currentWebSocket = null;
  let realtimeChart = null;
  let chartData = [];
  const MAX_DATA_POINTS = 30;
  let currentCity = "Berlin";

  let cityDataMap = new Map();

  // Function to initialize or reset the chart
  function initializeChart() {
      // Clear existing chart
      d3.select("#realtimeContainer").html("");
      
      // Reset chart data
      chartData = [];
      
      // Create new chart
      realtimeChart = createRealtimeChart("#realtimeContainer", []);
      console.log("Chart initialized");
  }

  // Function to handle city changes
 async function handleCityChange(newCity) {
    console.log(`Changing to city: ${newCity}`);
          
    // Close existing WebSocket connection if it exists
    if (currentWebSocket && currentWebSocket.disconnect) {
        console.log("Closing existing WebSocket connection");
        currentWebSocket.disconnect();
        currentWebSocket = null;
    }

    // Update current city
    currentCity = newCity;
    
    // Clear data for the new city
    cityDataMap.set(currentCity, []);
    
    // Clear existing chart and create new one
    initializeChart();

    // Fetch weather data for the new city
    await fetchWeatherData(newCity);

    console.log("Setting up new WebSocket for", newCity);
    // Setup new WebSocket connection
    currentWebSocket = setupWebSocket(newCity, (data) => {
        if (currentCity === newCity) { // Only process data if it's for the current city
            updateRealtimeChart(data);
        }
    });
  }

  function updateRealtimeChart(newData) {
      // Validate that the data is for the current city
    if (!newData || newData.length === 0) {
      console.warn("No data received for chart update");
      return;
    }
    // Process incoming data to include all metrics
    const processedData = newData.map(d => ({
      time: d.time,
      temperature: Number(d.temp) || NaN,
      humidity: Number(d.humidity) || NaN,
      windSpeed: Number(d.windSpeed) || NaN,
      visibility: Number(d.visibility) || NaN,
      pressureSurfaceLevel: Number(d.pressureSurfaceLevel) || NaN,
      cloudCover: Number(d.cloudCover) || NaN
    }));
    chartData.push(...processedData);
    
    console.log("Updating chart with new data for", currentCity, ":", newData);
    
    // Get current city's data array
    let cityData = cityDataMap.get(currentCity) || [];
    
    // Add new data points
    cityData.push(...newData);
    
    // Keep only the last MAX_DATA_POINTS
    if (cityData.length > MAX_DATA_POINTS) {
        cityData = cityData.slice(-MAX_DATA_POINTS);
    }
    
    // Sort data by time
    cityData.sort((a, b) => new Date(a.time) - new Date(b.time));
    
    // Update the stored data for this city
    cityDataMap.set(currentCity, cityData);
    
    console.log("Current data for", currentCity, ":", cityData);

    // Update chart if it exists
    if (realtimeChart && typeof realtimeChart.update === 'function') {
        realtimeChart.update(cityData);
    } else {
        console.warn("Chart not properly initialized");
    }
  }

  async function searchCity(){
    const newCity = document.getElementById('cityInput').value.trim();
    if (!newCity) {
      alert("Please enter a city!");
      return;
    }
   await handleCityChange(newCity);
  }

  // Initialize with default city
  console.log("Starting initialization with default city");
  initializeChart();
  handleCityChange(currentCity).catch(err => {
    console.error("Error during initialization:", err);
  });


  // Update the city search handler
  document.getElementById('searchButton').addEventListener('click', searchCity);

  // Update the Enter key handler
  document.getElementById('cityInput').addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
      searchCity();
    }
  });
});


function getHourlyForecastData(forecast, currentTime) {
  const currentHour = new Date(currentTime).getHours();

  // Filtere stündliche Daten ab der aktuellen Stunde
  const hourlyData = forecast.filter((entry) => {
    const entryHour = new Date(entry.time).getHours();
    return entryHour >= currentHour;
  });

  return hourlyData;

}
function processForecastData(hourlyForecastData) {

  const currentTime = new Date();
  const weekForecast = new Date();
  weekForecast.setDate(currentTime.getDate() + 5);

  //Filter damit nur die nächsten 5 Tage angezeigt werden
  const filteredData = hourlyForecastData.filter(d => {
    const dataTime = new Date(d.time);
    return dataTime >= currentTime && dataTime <= weekForecast;
  })

  // Konvertiert Daten ins richtige Format für den Chart
  const chartData = filteredData.map((d) => ({
    time: d.time,
    temp: Math.floor(d.temp),
  }));

  // Alte SVG entfernen
  const chartContainer = document.getElementById('forecastContainer');
  chartContainer.innerHTML = '';

  createLineChart("#forecastContainer", chartData);

}

window.addEventListener("storage", (event) => {
  if (event.key && event.key.startsWith("weatherData_")) {
    console.log("Cache in anderen Tabs aktualisiert:", event.key);
    const cachedData = getFromCache(event.key);
    if (cachedData) {
      processWeatherData(cachedData, event.key.split("_")[1]);
    }
  }
});


document.getElementById("forecastTab").addEventListener("click", () => {
  document.getElementById("forecastContainer").classList.add("active");
  document.getElementById("realtimeContainer").classList.remove("active");
  document.getElementById("forecastContainer").classList.remove("hidden");
  document.getElementById("realtimeContainer").classList.add("hidden");
});

document.getElementById("realtimeTab").addEventListener("click", () => {
  document.getElementById("realtimeContainer").classList.add("active");
  document.getElementById("forecastContainer").classList.remove("active");
  document.getElementById("realtimeContainer").classList.remove("hidden");
  document.getElementById("forecastContainer").classList.add("hidden");
});


