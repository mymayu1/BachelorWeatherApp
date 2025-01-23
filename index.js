import { updateTime } from './modules/header.js';
import { displayWeatherData } from './modules/weatherDetails.js';
import { createLineChart, createRealtimeChart } from './modules/lineChart.js';
const { DateTime } = luxon;

const apiKey = 'dtYQZYtAmR1SF1gHaifXh854PrkeC0nm';
const options = { method: 'GET', headers: { accept: 'application/json' } };

// Cache management
function saveToCache(key, data, callInMinutes = 1) {
    const now = new Date();
    const item = {
        data: data,
        expiry: now.getTime() + callInMinutes * 60 * 1000
    };
    localStorage.setItem(key, JSON.stringify(item));
}

function getFromCache(key) {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;

    const item = JSON.parse(itemStr);
    return new Date().getTime() > item.expiry ? null : item.data;
}

// Forecast data handling
async function fetchForecastData(city) {
    const forecastKey = `weatherData_forecast_${city}`;
    const cachedForecast = getFromCache(forecastKey);
    
    if (cachedForecast) return cachedForecast;

    const forecastUrl = `https://api.tomorrow.io/v4/weather/forecast?location=${city}&apikey=${apiKey}`;
    try {
        const response = await fetch(forecastUrl, options);
        if (!response.ok) throw new Error("Forecast data fetch error");
        const forecastData = await response.json();
        saveToCache(forecastKey, forecastData, 15);
        return forecastData;
    } catch (error) {
        console.error("Forecast fetch error:", error);
        return null;
    }
}

function processWeatherData(weatherData, city) {
    const { realtime, forecast } = weatherData;
    const hourlyForecastData = forecast.timelines.hourly.map(entry => ({
        time: entry.time,
        temp: entry.values.temperature
    }));

    processForecastData(hourlyForecastData);
    
    const todayForecast = forecast.timelines?.daily?.[0]?.values;
    const { lat: latitude, lon: longitude } = realtime.location || {};
    
    if (!latitude || !longitude) {
        console.error("Coordinates unavailable");
        return;
    }

    const timeZone = getTimeZone(latitude, longitude);
    const sunRiseLocal = convertToLocalTime(todayForecast.sunriseTime, timeZone);
    const sunSetLocal = convertToLocalTime(todayForecast.sunsetTime, timeZone);
    
    loadWeatherData().then(weatherCodeDescriptions => {
        const weatherDescription = weatherCodeDescriptions[realtime.data.values.weatherCode] || "Unknown";
        
        displayWeatherData({
            cityName: city,
            sunRise: sunRiseLocal,
            sunSet: sunSetLocal,
            weatherDetails: {
                weatherCode: weatherDescription,
                temperatureNow: Math.floor(realtime.data.values?.temperature) ?? "N/A",
                temperatureMax: Math.floor(todayForecast.temperatureMax) ?? "N/A",
                temperatureMin: Math.floor(todayForecast.temperatureMin) ?? "N/A",
                temperatureApparent: Math.floor(realtime.data.values.temperatureApparent) ?? "N/A",
                precipitationAvg: todayForecast?.precipitationProbabilityAvg ?? "N/A",
                windSpeed: realtime.data.values.windSpeed || "N/A",
                windDirection: realtime.data.values.windDirection || "N/A",
                humidity: realtime.data.values.humidity || "N/A",
                uvIndex: realtime.data.values.uvIndex
            }
        });
    });
}

function getTimeZone(latitude, longitude) {
    const offset = longitude / 15;
    const hours = Math.floor(offset);
    const minutes = Math.abs(Math.round((offset - hours) * 60));
    return `UTC${hours >= 0 ? "+" : ""}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function convertToLocalTime(time, timeZone) {
    if (!time) return "Invalid time";
    try {
        return DateTime.fromISO(time, { zone: "UTC" })
            .setZone(timeZone)
            .toLocaleString(DateTime.TIME_24_SIMPLE);
    } catch (error) {
        console.error("Time conversion error:", error);
        return "Time error";
    }
}

async function loadWeatherData() {
    try {
        const response = await fetch('./weatherCodes.json');
        if (!response.ok) throw new Error("Weather codes fetch error");
        const jsonData = await response.json();
        return jsonData.weatherCode;
    } catch (error) {
        console.error("Weather codes load error:", error);
        return {};
    }
}

function setupWebSocket(city, updateChartCallback) {
    const ws = new WebSocket("ws://127.0.0.1:8080");
    
    ws.onopen = () => {
        ws.send(JSON.stringify({ type: "subscribe", city }));
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.city !== city) return;

            const chartData = [{
                time: new Date(data.time).toISOString(),
                temp: Math.floor(data.temp),
                humidity: Number(data.humidity),
                windSpeed: Number(data.windSpeed),
                visibility: Number(data.visibility),
                pressureSurfaceLevel: Number(data.pressureSurfaceLevel),
                cloudCover: Number(data.cloudCover)
            }];

            updateChartCallback?.(chartData);
        } catch (error) {
            console.error("WebSocket data processing error:", error);
        }
    };

    return ws;
}

function processForecastData(hourlyForecastData) {
    const currentTime = new Date();
    const weekForecast = new Date(currentTime);
    weekForecast.setDate(currentTime.getDate() + 5);

    const filteredData = hourlyForecastData.filter(d => {
        const dataTime = new Date(d.time);
        return dataTime >= currentTime && dataTime <= weekForecast;
    }).map(d => ({
        time: d.time,
        temp: Math.floor(d.temp)
    }));

    document.getElementById('forecastContainer').innerHTML = '';
    createLineChart("#forecastContainer", filteredData);
}

// Event Listeners and Initialization
document.addEventListener('DOMContentLoaded', () => {
    let realtimeChart = null;
    let currentWebSocket = null;
    let currentCity = "Berlin";

    function initializeChart() {
        d3.select("#realtimeContainer").html("");
        realtimeChart = createRealtimeChart("#realtimeContainer", []);
    }

    async function handleCityChange(newCity) {
        currentWebSocket?.close();
        currentCity = newCity;
        
        d3.select("#realtimeContainer").html("");
        realtimeChart = createRealtimeChart("#realtimeContainer", []);
        
        try {
            const [forecast, realtime] = await Promise.all([
                fetchForecastData(newCity),
                fetch(`https://api.tomorrow.io/v4/weather/realtime?location=${newCity}&apikey=${apiKey}`, options)
                    .then(res => res.json())
            ]);
            
            if (forecast && realtime) {
                processWeatherData({ forecast, realtime }, newCity);
            }
        } catch (error) {
            console.error("Error fetching weather data:", error);
        }

        currentWebSocket = setupWebSocket(newCity, data => {
            if (currentCity === newCity) {
                realtimeChart?.update(data);
            }
        });
    }

    initializeChart();
    handleCityChange(currentCity);

    document.getElementById('searchButton').addEventListener('click', () => {
        const newCity = document.getElementById('cityInput').value.trim();
        if (newCity) handleCityChange(newCity);
    });

    document.getElementById('cityInput').addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            const newCity = event.target.value.trim();
            if (newCity) handleCityChange(newCity);
        }
    });
});

// Tab switching
document.getElementById("forecastTab").addEventListener("click", () => {
    document.getElementById("forecastContainer").classList.remove("hidden");
    document.getElementById("realtimeContainer").classList.add("hidden");
});

document.getElementById("realtimeTab").addEventListener("click", () => {
    document.getElementById("realtimeContainer").classList.remove("hidden");
    document.getElementById("forecastContainer").classList.add("hidden");
});