import { updateTime } from './modules/header.js';
import { displayWeatherData } from './modules/weatherDetails.js';

updateTime();

const apiKey = 'dtYQZYtAmR1SF1gHaifXh854PrkeC0nm';
const options = { method: 'GET', headers: { accept: 'application/json' } };

 async function fetchWeatherData(city){

  try{
    // Echtzeit-Wetterdaten abrufen
    const realtimeResponse = await fetch(
      `https://api.tomorrow.io/v4/weather/realtime?location=${city}&apikey=${apiKey}`,
      options
    );

    const realtimeData = await realtimeResponse.json();
    console.log("Echtzeitdaten:", realtimeData);

    //Forecast-Wetterdaten abrufen
    const forecastResponse = await fetch(
      `https://api.tomorrow.io/v4/weather/forecast?location=${city}&apikey=${apiKey}`,

      options
    );

    const forecastData = await forecastResponse.json();
    console.log("Forecastdaten:", forecastData);

    const dailyForecast = forecastData.timelines?.daily?.[0]?.values;

    if (!dailyForecast) {
      throw new Error('Forecast-Daten fehlen oder sind unvollständig!');
    }

    const sunRise = dailyForecast.sunriseTime;
    const sunSet = dailyForecast.sunsetTime;

    displayWeatherData({
      cityName: city,
      sunRise,
      sunSet,
    })

    console.log('Wetterdaten für displayWeatherData:', {sunRise, sunSet, cityName
    });

    } catch (error){
      console.error("Fehler beim abrufen der Daten", error);
    }
  }

// Standardstandort Berlin beim Laden der Seite
document.addEventListener('DOMContentLoaded', () => {
  fetchWeatherData('Berlin'); // Standardstadt
});

document.getElementById('searchButton').addEventListener('click', () =>{

  const city = document.getElementById('cityInput').value.trim();

  if (!city){
    alert("Bitte Stadt eingeben!");
    return;
  }

  fetchWeatherData(city);
})