function displayWeatherData({ sunRise, sunSet, cityName, weatherDetails }){

    // Standort anzeigen
    const locationElement = document.getElementById('location');
    if(locationElement){
      locationElement.textContent = `Standort: ${cityName}`;
    }

    // Sonnenaufgang und Sonnenuntergang abrufen
    const sunRiseString = new Date(sunRise).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const sunSetString = new Date(sunSet).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // In die HTML einfügen
    const sunriseElement = document.getElementById('sunrise');
    sunriseElement.textContent = `Sonnenaufgang: ${sunRiseString}`;

    const sunsetElement = document.getElementById('sunset');
    sunsetElement.textContent = `Sonnenuntergang: ${sunSetString}`;

    const { weatherCode, temperatureNow, temperatureMax, temperatureMin, temperatureApparent, precipitationAvg, 
      windSpeed, windDirection, humidity, uvIndex} = weatherDetails;

    const leftInformation = document.getElementById('leftInformation')
    if (leftInformation) {
      leftInformation.innerHTML = `
      <p>
        <h1>Wetterzustand: ${weatherCode}</h1>

      </p>
      `;
    }

    const rightInformation = document.getElementById('rightInformation')
    if (rightInformation) {
      rightInformation.innerHTML = `
      <p>
        <h1>${temperatureNow}°C</h1>
        <h6>H:${temperatureMax}°C   T:${temperatureMin}°C</h4>
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

