import { updateTime } from './modules/header.js';
import { displayWeatherData } from './modules/weatherDetails.js';

//import { createLineChart } from './modules/lineChart.js';

updateTime();

const apiKey = 'dtYQZYtAmR1SF1gHaifXh854PrkeC0nm';
const options = { method: 'GET', headers: { accept: 'application/json' } };

//Funktion zum Speichern von Daten in Cache
function saveToCache(key, data, callInMinutes = 1) {
  const now = new Date();
  const item = {
    data: data,
    expiry: now.getTime() + callInMinutes * 60 * 1000, //Ablaufzeit in ms
  };
  localStorage.setItem(key, JSON.stringify(item));
}

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

function processWeatherData(weatherData, city) {
  const { realtime, forecast } = weatherData;
  console.log("Realtime-Daten:", realtime);
  console.log("Forecast-Daten:", forecast);
  if (!forecast.timelines || !forecast.timelines.daily || !forecast.timelines.hourly) {
    console.error("Fehler: Forecast-Daten sind unvollständig:", forecast.timelines);
    return;
  }

  const dailyForecast = forecast.timelines?.daily?.[0]?.values;

  if (!dailyForecast) {
    throw new Error('Forecast-Daten fehlen oder sind unvollständig!');
  }
  console.log("Tagesvorhersage:", dailyForecast);

 
  const hourlyData = forecast.timelines.hourly.map((entry) => ({
    time: entry.time || "Zeit nicht verfügbar",
    temp: entry.values.temperature,

  }));

  const allWeatherCodes = realtime.data.values.weatherCode;
  loadWeatherData().then((weatherCodeDescriptions) => {

    const weatherDescription = weatherCodeDescriptions[allWeatherCodes] || "Beschreibung nicht verfügbar";

    console.log("AllWeatherCodes:", weatherCodeDescriptions);
    console.log("Wettercode:", allWeatherCodes, "Beschreibung:", weatherDescription);

    const weatherDataShow = {
      weatherCode: weatherDescription || "Unbekannt",
      temperatureNow: realtime.data.values.temperature || "N/A",
      temperatureMax: dailyForecast.temperatureMax || "N/A",
      temperatureMin: dailyForecast.temperatureMin || "N/A",
      temperatureApparent: realtime.data.values.temperatureApparent || "N/A",
      precipitationAvg: dailyForecast.precipitationProbabilityAvg || "N/A",
      windSpeed: realtime.data.values.windSpeed || "N/A",
      windDirection: realtime.data.values.windDirection || "N/A",
      humidity: realtime.data.values.humidity || "N/A",
      uvIndex: realtime.data.values.uvIndex,
    };
    console.log("Weather-Details:", weatherDataShow);


  displayWeatherData({
    cityName: city,
    sunRise,
    sunSet,
    weatherDetails: weatherDataShow,
  });

  });

  console.log("Stundenwerte (hourlyData):", hourlyData);
  console.log("Beispiel einer hourly-Einheit:", forecast.timelines.hourly[0]);


  const sunRise = dailyForecast.sunriseTime;
  const sunSet = dailyForecast.sunsetTime;


  const cityName = city;

  console.log('Wetterdaten für displayWeatherData:', {sunRise, sunSet, cityName, weatherDataShow
  });

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
  fetchWeatherData('Berlin');
});
document.getElementById('searchButton').addEventListener('click', () => {

  const city = document.getElementById('cityInput').value.trim();
  if (!city) {
    alert("Bitte Stadt eingeben!");
    return;
  }
  fetchWeatherData(city);
})