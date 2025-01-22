import asyncio
import websockets
import json
from datetime import datetime
import aiohttp
import ssl
import certifi
import logging
from collections import deque
from time import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

API_KEY = 'dtYQZYtAmR1SF1gHaifXh854PrkeC0nm'
BASE_URL = 'https://api.tomorrow.io/v4/weather/realtime'

class RateLimiter:
    def __init__(self, requests_per_second=2, requests_per_hour=25):
        self.requests_per_second = requests_per_second
        self.requests_per_hour = requests_per_hour
        self.requests_history = deque()
        self.hourly_requests_history = deque()
        
    async def wait_if_needed(self):
        current_time = time()
        
        # Clean up old requests from history
        while self.requests_history and current_time - self.requests_history[0] > 1:
            self.requests_history.popleft()
        while self.hourly_requests_history and current_time - self.hourly_requests_history[0] > 3600:
            self.hourly_requests_history.popleft()
        
        # Check rate limits
        if len(self.requests_history) >= self.requests_per_second:
            wait_time = 1 - (current_time - self.requests_history[0])
            if wait_time > 0:
                logger.info(f"Rate limit reached, waiting {wait_time:.2f} seconds")
                await asyncio.sleep(wait_time)
        
        if len(self.hourly_requests_history) >= self.requests_per_hour:
            wait_time = 3600 - (current_time - self.hourly_requests_history[0])
            if wait_time > 0:
                logger.info(f"Hourly rate limit reached, waiting {wait_time:.2f} seconds")
                await asyncio.sleep(wait_time)
        
        # Record the request
        self.requests_history.append(current_time)
        self.hourly_requests_history.append(current_time)

class WeatherWebSocketServer:
    def __init__(self):
        self.connections = {}  # Store client connections with their subscribed cities
        self.ssl_context = ssl.create_default_context(cafile=certifi.where())
        self.rate_limiter = RateLimiter(requests_per_second=2, requests_per_hour=25)
        self.city_data_cache = {}  # Cache for city weather data
        self.cache_expiry = 60  # Cache expiry in seconds

    async def fetch_weather_data(self, city):
        """Fetch weather data from Tomorrow.io API with rate limiting"""
        # Check cache first
        cache_entry = self.city_data_cache.get(city)
        if cache_entry and time() - cache_entry['timestamp'] < self.cache_expiry:
            logger.info(f"Using cached data for {city}")
            return cache_entry['data']

        # Wait for rate limiter
        await self.rate_limiter.wait_if_needed()

        try:
            params = {
                'location': city,
                'apikey': API_KEY
            }
            headers = {'accept': 'application/json'}
            
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    BASE_URL, 
                    params=params, 
                    headers=headers,
                    ssl=self.ssl_context
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        result = {
                            'time': data['data']['time'],
                            'temp': data['data']['values']['temperature'],
                            'city': city
                        }
                        # Cache the result
                        self.city_data_cache[city] = {
                            'data': result,
                            'timestamp': time()
                        }
                        return result
                    elif response.status == 429:
                        logger.error(f"Rate limit exceeded for {city}")
                        await asyncio.sleep(5)  # Wait before retry
                        return None
                    else:
                        logger.error(f"API Error: {response.status} for city {city}")
                        return None
        except Exception as e:
            logger.error(f"Error fetching weather data: {e}")
            return None

    async def broadcast_to_city_subscribers(self, city, data):
        """Broadcast weather data to all clients subscribed to a specific city"""
        if city in self.connections:
            disconnected = []
            for websocket in self.connections[city]:
                try:
                    await websocket.send(json.dumps(data))
                except websockets.exceptions.ConnectionClosed:
                    disconnected.append(websocket)
                except Exception as e:
                    logger.error(f"Error broadcasting to client: {e}")
                    disconnected.append(websocket)
            
            # Clean up disconnected clients
            for websocket in disconnected:
                await self.remove_client(websocket)

    async def remove_client(self, websocket):
        """Remove a client from all city subscriptions"""
        for city in self.connections:
            if websocket in self.connections[city]:
                self.connections[city].remove(websocket)
        logger.info("Client removed from subscriptions")

    async def handle_subscription(self, websocket, city):
        """Handle a client's subscription to a city"""
        if city not in self.connections:
            self.connections[city] = set()
        self.connections[city].add(websocket)
        logger.info(f"Client subscribed to {city}")

    async def periodic_updates(self):
        """Periodically fetch and broadcast weather updates"""
        while True:
            try:
                for city in list(self.connections.keys()):
                    if self.connections[city]:  # Only fetch if there are subscribers
                        data = await self.fetch_weather_data(city)
                        if data:
                            await self.broadcast_to_city_subscribers(city, data)
                await asyncio.sleep(144)  # Update every 2.4 minutes
            except Exception as e:
                logger.error(f"Error in periodic updates: {e}")
                await asyncio.sleep(5)  # Wait before retrying

    async def handler(self, websocket):
        """Handle WebSocket connections"""
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    if data.get('type') == 'subscribe':
                        city = data.get('city')
                        if city:
                            await self.handle_subscription(websocket, city)
                            # Send initial data immediately
                            initial_data = await self.fetch_weather_data(city)
                            if initial_data:
                                await websocket.send(json.dumps(initial_data))
                except json.JSONDecodeError:
                    logger.error("Invalid JSON received")
                except Exception as e:
                    logger.error(f"Error processing message: {e}")

        except websockets.exceptions.ConnectionClosed:
            logger.info("Client connection closed")
        finally:
            await self.remove_client(websocket)

async def main():
    server = WeatherWebSocketServer()
    
    # Start periodic updates task
    asyncio.create_task(server.periodic_updates())
    
    async with websockets.serve(server.handler, "127.0.0.1", 8080):
        logger.info("WebSocket server running on ws://127.0.0.1:8080")
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    asyncio.run(main())