import { updateTime } from './modules/header.js';
import { displayWeatherData } from './modules/weatherDetails.js';

updateTime();

const apiKey = 'dtYQZYtAmR1SF1gHaifXh854PrkeC0nm';
const options = { method: 'GET', headers: { accept: 'application/json' } };

function fetchWeatherData(city){
// Echtzeit-Wetterdaten abrufen
  fetch(`https://api.tomorrow.io/v4/weather/realtime?location=berlin&apikey=${apiKey}`, options)
    .then(res => res.json())
    .then(realtimeData => {
      //const location = "Berlin"; // 

      // Forecast-Daten abrufen
      return fetch(`https://api.tomorrow.io/v4/weather/forecast?location=berlin&apikey=${apiKey}`, options)
        .then(res => res.json())
        .then(forecastData => {
          const dailyForecast = forecastData.timelines?.daily?.[0]?.values;

          if (!dailyForecast) {
            throw new Error('Forecast-Daten fehlen oder sind unvollständig!');
          }

          const sunRise = dailyForecast.sunriseTime;
          const sunSet = dailyForecast.sunsetTime;

          // Display-Funktion mit den Daten aufrufen
          displayWeatherData({
            //location,
            sunRise,
            sunSet,
          });

          console.log("Daten für displayWeatherData:", {
        
              sunRise,
              sunSet,
            });
            
        });
    })
    .catch(err => console.error('Fehler beim Abrufen der Wetterdaten:', err));
}

document.getElementById('searchButton').addEventListener('click', () =>{

  const city = document.getElementById('cityInput').value.trim();

  if (!city){
    alert("Bitte Stadt eingeben!");
    return;
  }

  fetchWeatherData(city);
})