from langchain_community.utilities.openweathermap import OpenWeatherMapAPIWrapper

from src.packvote import OPENWEATHERMAP_API_KEY


def get_weather(city: str) -> str:
    """Get the weather for a given city.

    Args:
        city (str): The city to get the weather for.

    Returns:
        str: The weather for the given city.
    """
    return OpenWeatherMapAPIWrapper(api_key=OPENWEATHERMAP_API_KEY)
