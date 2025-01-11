
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

  // Aktualisiert die linken Wetterinformationen
  const leftInformation = document.getElementById('leftInformation');
  if (leftInformation) {
    leftInformation.querySelector('#currTemp').textContent = `${temperatureNow}°C`;
    leftInformation.querySelector('#highTemp').textContent = `${temperatureMax}°C`;
    leftInformation.querySelector('#lowTemp').textContent = `${temperatureMin}°C`;
    
  }
  const middleInformation = document.getElementById('weatherDescriptionContainer');
  if (middleInformation){
    middleInformation.querySelector('#weatherDescription').textContent = weatherCode;
  }
  // Aktualisiert die rechten Wetterinformationen
  const rightInformation = document.getElementById('rightInformation');
  if (rightInformation) {
    rightInformation.querySelector('#feelsLike').textContent = `${temperatureApparent}°C`;
      rightInformation.querySelector('#precip').textContent = `${precipitationAvg} %`;
      rightInformation.querySelector('#windSpeed').textContent = `${windSpeed} km/h (${windDirection}°)`;
      rightInformation.querySelector('#humidity').textContent = `${humidity}%`;
      rightInformation.querySelector('#uvI').textContent = `${uvIndex}`;
  }
}
// Export der Funktion
export { displayWeatherData };

