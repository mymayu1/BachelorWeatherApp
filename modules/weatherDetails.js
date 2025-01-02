
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
      leftInformation.querySelector('h1').textContent = weatherCode;
  }

    const rightInformation = document.getElementById('rightInformation')
    if (rightInformation) {
      rightInformation.querySelector('#currTemp').textContent = `${temperatureNow}°C`;
      rightInformation.querySelector('#highTemp').textContent = `H:${temperatureMax}°C`;
      rightInformation.querySelector('#lowTemp').textContent = `T:${temperatureMin}°C`;
      rightInformation.querySelector('#feelsLike').textContent = `Gefühlt: ${temperatureApparent}°C`;
      rightInformation.querySelector('#precip').textContent = `Regenfall: ${precipitationAvg} %`;
      rightInformation.querySelector('#windSpeed').textContent = `Wind: ${windSpeed} km/h (${windDirection}°)`;
      rightInformation.querySelector('#humidity').textContent = `Luftfeuchtigkeit: ${humidity}%`;
      rightInformation.querySelector('#uvI').textContent = `UV-Index: ${uvIndex}`;
  }
}

// Export der Funktion
export { displayWeatherData };

