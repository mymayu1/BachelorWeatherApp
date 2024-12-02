function displayWeatherData({ sunRise, sunSet }){

      // Standort anzeigen
    //  const locationElement = document.getElementById('location');
    //  locationElement.textContent = `Standort: ${location}`;

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
}

// Export der Funktion
export { displayWeatherData };

