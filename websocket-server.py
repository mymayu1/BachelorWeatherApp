import asyncio
import websockets
import json
from datetime import datetime

async def handler(websocket):
    while True:
        # Simulierte Echtzeitdaten
        data = {
            "time": datetime.now().isoformat(),
            "temp": 25 + (datetime.now().second % 5),  # Simulierte Temperatur
            "humidity": 60
        }
        await websocket.send(json.dumps(data))  # Senden der Daten
        await asyncio.sleep(5)  # Aktualisierung alle 5 Sekunden

async def main():
    # Server starten
    async with websockets.serve(handler, "127.0.0.1", 8080):
        print("WebSocket-Server läuft auf ws://127.0.0.1:8080")
        await asyncio.Future()  # Blockiert den Event-Loop

if __name__ == "__main__":
    # Event-Loop explizit starten
    asyncio.run(main())
