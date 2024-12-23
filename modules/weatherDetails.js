
function displayWeatherData({ sunRise, sunSet, cityName, weatherDetails }){


    // Standort anzeigen
    const locationElement = document.getElementById('location');
    if(locationElement){
      locationElement.textContent = `Standort: ${cityName}`;
    }


    // Sonnenaufgang und Sonnenuntergang
    const sunriseElement = document.getElementById('sunrise');
    sunriseElement.textContent = `Sonnenaufgang: ${sunRise}`;

    const sunsetElement = document.getElementById('sunset');
    sunsetElement.textContent = `Sonnenuntergang: ${sunSet}`;

    const { weatherCode, temperatureNow, temperatureMax, temperatureMin, temperatureApparent, precipitationAvg, 
      windSpeed, windDirection, humidity, uvIndex} = weatherDetails;

  

    const leftInformation = document.getElementById('leftInformation')
    if (leftInformation) {
      leftInformation.textContent = 
      `Wetterzustand: ${weatherCode}`;
    }

    const rightInformation = document.getElementById('rightInformation')
    if (rightInformation) {
      rightInformation.innerHTML = `
      <p>
        <h1>${temperatureNow}°C</h1>
        <h6>H:${temperatureMax}°C</h6>
        <h6>T:${temperatureMin}°C</h6>
        <h6>Gefühlt: ${temperatureApparent}°</h6>
      </p>
      <p>
        <h4>Regenfall: ${precipitationAvg} %</h4>
        <h4>Wind: ${windSpeed} km/h (${windDirection}°)</h4>
        <h4>Luftfeuchtigkeit: ${humidity}%</h4>
        <h4>UV-Index: ${uvIndex}</h4>
      </p>
      `;
    }
}

// Export der Funktion
export { displayWeatherData };

