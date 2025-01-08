import { updateTime } from './modules/header.js';
import { displayWeatherData } from './modules/weatherDetails.js';
const { DateTime } = luxon;
import { createLineChart } from './modules/lineChart.js';
import { createRealtimeChart } from './modules/lineChart.js';


updateTime();

const apiKey = 'dtYQZYtAmR1SF1gHaifXh854PrkeC0nm';
const options = { method: 'GET', headers: { accept: 'application/json' } };

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
  try {
    const realtimeResponse = await fetch(
      `https://api.tomorrow.io/v4/weather/realtime?location=${city}&apikey=${apiKey}`,
      options
    );
    const realtimeData = await realtimeResponse.json();
    const currentTemp = Math.floor(realtimeData.data.values.temperature) || "N/A";
    const currentTime = new Date(realtimeData.data.time).toISOString();

    return { time: currentTime, temp: currentTemp }; 
  } catch (error) {
    console.error("Fehler beim Abrufen der Echtzeitdaten:", error);
    return null;
  }
}

// Echtzeitdaten regelmäßig aktualisieren
function startRealtimeUpdates(city, updateInterval = 60000, updateChartCallback) {
  let realtimeData = [];
  const maxDataPoints = 100; // Begrenzung der Punkte für bessere Performance

  async function updateChart() {
    const newRealtimeData = await fetchRealtimeData(city);
    if (newRealtimeData) {
      // Echtzeitdaten aktualisieren
      realtimeData.push(newRealtimeData);

      // Entferne alte Daten, wenn die maximale Punktzahl überschritten wird
      if (realtimeData.length > maxDataPoints) {
        realtimeData.shift();
      }

      // Echtzeit-Chart aktualisieren
      if (typeof updateChartCallback === "function") {
        updateChartCallback(realtimeData);
      } else {
        console.error("updateChartCallback ist keine Funktion!");
      }
    }
  }

  // Initialen Abruf starten
  updateChart();
  // Intervall für Updates setzen
  setInterval(updateChart, updateInterval);
}



function processWeatherData(weatherData, city) {
  const { realtime, forecast } = weatherData;

  console.log("Realtime-Daten:", realtime);
  console.log("Forecast-Daten:", forecast);
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

  //Extrahiere die Höchst- und Tiefsttemperaturen sowie das Datum
  const temperatureHiLo = dailyForecast.map((entry) => {
    if (!entry.time || !entry.values.temperatureMax || !entry.values.temperatureMin) {
      console.error("Fehler: Ungültige Daten für", entry);
      return null;
    }
    return {
      date: entry.time, // Zeitstempel
      tempMax: entry.values.temperatureMax, // Höchsttemperatur
      tempMin: entry.values.temperatureMin, // Tiefsttemperatur
    };
  }).filter(item => item !== null); // Filtere ungültige Einträge heraus


 
  const hourlyForecastData = forecast.timelines.hourly.map((entry) => ({
    time: entry.time || "Zeit nicht verfügbar",
    temp: entry.values.temperature,

  }));


  console.log("Daten für Chart:", hourlyForecastData);

  // Erstellt den Line Chart
  processForecastData(hourlyForecastData, temperatureHiLo);

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
  function convertToLocalTime(time, timeZone){
    if (!time) {
      console.error("Ungültiger Zeitwert für Konvertierung:", time);
      return "Ungültige Zeit";
    }

    try {
      const localTime = DateTime.fromISO(time, { zone: "UTC" }).setZone(timeZone);
      return localTime.toLocaleString(DateTime.TIME_24_SIMPLE);
    } catch(error){
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
//console.log("temperatureHiLo:", temperatureHiLo);

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

async function fetchWeatherData(city) {
  const cacheKey = `weatherData_${city}`;
  const cachedData = getFromCache(cacheKey);

  if (cachedData) {
    console.log("Cache-Daten gefunden:", cachedData);
    processWeatherData(cachedData, city);
    return;
  }

  try {
    const realtimeResponse = await fetch(
      `https://api.tomorrow.io/v4/weather/realtime?location=${city}&apikey=${apiKey}`, options
    );
    const realtimeData = await realtimeResponse.json();

    const forecastResponse = await fetch(
      `https://api.tomorrow.io/v4/weather/forecast?location=${city}&apikey=${apiKey}`, options
    );
    const forecastData = await forecastResponse.json();

    const weatherData = {
      realtime: realtimeData,
      forecast: forecastData,
    };

    saveToCache(cacheKey, weatherData, 60);
    processWeatherData(weatherData, city);

  } catch (error) {
    console.error("Fehler beim abrufen der Daten", error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const city = "Berlin"; // Standardstadt
  fetchWeatherData(city);

  // Echtzeitdaten-Chart initialisieren
  const realtimeChart = createRealtimeChart("#realtimeContainer", []);
  
  // Funktion zum Aktualisieren des Echtzeit-Charts
  function updateRealtimeChart(data) {
    realtimeChart.update(data);
  }
  // Echtzeitdaten starten
  startRealtimeUpdates(city, 60000, updateRealtimeChart); // Updates alle 60 Sekunden

});
document.getElementById('searchButton').addEventListener('click', () => {

  const city = document.getElementById('cityInput').value.trim();
  if (!city) {
    alert("Bitte Stadt eingeben!");
    return;
  }
  fetchWeatherData(city);
});

document.getElementById('cityInput').addEventListener('keyup', (event) => {
  if (event.key === 'Enter') {
    const city = event.target.value.trim();
    if (!city){
      alert("Bitte Stadt eingeben!");
     return;
    }
    fetchWeatherData(city);
  }
});

function getHourlyForecastData(forecast, currentTime){
  const currentHour = new Date(currentTime).getHours();

  // Filtere stündliche Daten ab der aktuellen Stunde
  const hourlyData = forecast.filter((entry) => {
    const entryHour = new Date(entry.time).getHours();
    return entryHour >= currentHour;
  });

  return hourlyData;

}
function processForecastData(hourlyForecastData){

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


