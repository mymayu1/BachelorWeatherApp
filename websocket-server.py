import asyncio
import websockets
import json
import requests
from datetime import datetime

API_KEY = "dtYQZYtAmR1SF1gHaifXh854PrkeC0nm"
DEFAULT_CITY = "Berlin"

# API-Rate-Limits
MAX_REQUESTS_PER_SECOND = 3
MAX_REQUESTS_PER_HOUR = 25

# Zeitstempel für die Anfragen
last_request_time = datetime.min
request_count_last_hour = 0
request_times = []

headers = { "accept": "application/json", }

# Funktion zum Überprüfen des Rate-Limits
def is_within_rate_limit():
    global request_count_last_hour, request_times
    now = datetime.now()

    # Entferne alte Anfragen außerhalb des Stundenlimits
    request_times = [t for t in request_times if now - t < timedelta(hours=1)]
    request_count_last_hour = len(request_times)

    if len(request_times) >= MAX_REQUESTS_PER_HOUR:
        return False

    # Überprüfe das Sekundenlimit
    if request_times and (now - request_times[-1]).total_seconds() < 1 / MAX_REQUESTS_PER_SECOND:
        return False

    return True

# Funktion zum Abrufen der Daten aus der API
def fetch_weather_data(city):
    try:
        API_URL = f"https://api.tomorrow.io/v4/weather/realtime?location={city}&apikey={API_KEY}"
        print(f"API-URL: {API_URL}")  # Debugging
        params = {
        "location": city,
        "apikey": API_KEY,
        }
        response = requests.get("https://api.tomorrow.io/v4/weather/realtime", headers=headers, params=params )
        if response.status_code == 200:
            weather_data = response.json()
            # Extrahiere relevante Felder
            return {
                "time": weather_data["data"]["time"],
                "temp": weather_data["data"]["values"]["temperature"],
            }
        else:
            print(f"API-Fehler: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Fehler beim Abrufen der Wetterdaten: {e}")
        return None

async def handler(websocket):
    while True:
       # Abrufen der Wetterdaten aus der API
        data = fetch_weather_data(DEFAULT_CITY)
        if data:
            # Daten im JSON-Format senden
            await websocket.send(json.dumps(data))
        else:
            # Fehlermeldung an den Client senden, wenn Daten fehlen
            await websocket.send(json.dumps({"error": "Fehler beim Abrufen der Wetterdaten"}))
        await asyncio.sleep(5)  # Aktualisierung alle 5 Sekunden

async def main():
    # Server starten
    async with websockets.serve(handler, "127.0.0.1", 8080):
        print("WebSocket-Server läuft auf ws://127.0.0.1:8080")
        await asyncio.Future()  # Blockiert den Event-Loop

if __name__ == "__main__":
    # Event-Loop explizit starten
    asyncio.run(main())
