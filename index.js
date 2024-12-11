import { updateTime } from './modules/header.js';
import { displayWeatherData } from './modules/weatherDetails.js';
import { createLineChart } from './modules/lineChart.js';

updateTime();


const apiKey = 'dtYQZYtAmR1SF1gHaifXh854PrkeC0nm';
const options = { method: 'GET', headers: { accept: 'application/json' } };

//Funktion zum Speichern von Daten in Cache
function saveToCache(key, data, callInMinutes){
  const now = new Date();
  const item ={
    data: data,
    expiry: now.getTime() + callInMinutes * 60 * 1000, //Ablaufzeit in 1h in ms
  };
  localStorage.setItem(key, JSON.stringify(item));
}

//Funktion zum Abrufen der Daten vom Cache


function getFromCache(key){
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;

  const item = JSON.parse(itemStr);
  const now = new Date();

  //Überprüfung ob die Daten im Cache abgelaufen sind
  if (now.getTime() > item.expiry){
    localStorage.removeItem(key);
    return null;
  }
  return item.data;
}

//Funktiomn zur Verarbeitung von Wetterdaten
function processWeatherData(weatherData, city) {



  const dailyForecast = forecastData.timelines?.daily?.[0]?.values;

  if (!dailyForecast) {
    throw new Error('Forecast-Daten fehlen oder sind unvollständig!');
  }



  const hourlyData = forecastData.timelines.hourly.map((entry) => ({
    time: entry.startTime,
    temp: entry.values.tempurature,

  }));

  const sunRise = dailyForecast.sunriseTime;
  const sunSet = dailyForecast.sunsetTime;

  displayWeatherData({
    cityName: city,
    sunRise,
    sunSet,
  })


  console.log('Wetterdaten für displayWeatherData:', {sunRise, sunSet, cityName
  });

  createLineChart(document.getElementById("lineChart"), hourlyData);


}

 async function fetchWeatherData(city){

  const cacheKey = `weatherData_${city}`;
  const cachedData = getFromCache(cacheKey);

  if (cachedData) {
    console.log("Cache-Daten gefunden:", cachedData);
    return; //Verlasse wenn die Funktion verwendet wird
  }

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

    const weatherData = {
      realtime: realtimeData,
      forecast: forecastData,
    };

    //Daten im Cache speichern
    saveToCache(cacheKey, weatherData, 60);

    //Verarbeitung der Wetterdaten
    processWeatherData(weatherData, city);


    fetchWeatherData('Berlin').then(() => {
      const lineChart = "#lineChart"; // Container-ID
      createLineChart(lineChart, threeHoursData); // Übergib die 3-Stunden-Daten
    });
    /*
    const data = [
      { time: "2024-12-11T00:00:00", temp: 5 },
      { time: "2024-12-11T03:00:00", temp: 7 },
      { time: "2024-12-11T06:00:00", temp: 10 },
      { time: "2024-12-11T09:00:00", temp: 15 },
      { time: "2024-12-11T12:00:00", temp: 12 },
    ];

   //createLineChart(lineChart, data);
    
    //Zoomstufen
    //3 stunden-intervall
    //const threeHoursData = hourlyData.filter((_, index) => index % 3 === 0);

    //1 stunde-intervall
    //const oneHourData = hourlyData;

    //Tageshöchstwerte (7 Tage Vorhersage)
    
    const dailyData = d3.rollups(
      hourlyData,
      (v) => d3.max(v, (d) => d.temp), //Höchsttemperatur des Tages
      (d) => d.time.slice(0, 10) //Gruppierung nach Datum
    ).map(([date, temp]) => ({date, temp}));
     */


    } catch (error){
      console.error("Fehler beim abrufen der Daten", error);
    }
  }

// Standardstandort Berlin beim Laden der Seite
document.addEventListener('DOMContentLoaded', () => {
  fetchWeatherData('Berlin'); // Standartstadt
});

document.getElementById('searchButton').addEventListener('click', () =>{

  const city = document.getElementById('cityInput').value.trim();

  if (!city){
    alert("Bitte Stadt eingeben!");
    return;
  }

  fetchWeatherData(city);
})