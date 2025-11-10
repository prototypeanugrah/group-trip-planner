from __future__ import annotations

import logging
import os

from dotenv import load_dotenv

load_dotenv()

LOGGER = logging.getLogger(__name__)

# Qdrant
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
QDRANT_URL = os.getenv("QDRANT_URL")

# OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Tavil
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

# OpenWeatherMap
OPENWEATHERMAP_API_KEY = os.getenv("OPENWEATHERMAP_API_KEY")

# LangSmith tracing
os.environ["LANGSMITH_TRACING"] = "true"

# LangGraph Models
ITINERARY_PLANNER_MODEL = "gpt-4o-mini"

__all__ = [
    "LOGGER",
    "QDRANT_API_KEY",
    "QDRANT_URL",
    "OPENAI_API_KEY",
    "TAVILY_API_KEY",
    "OPENWEATHERMAP_API_KEY",
    "ITINERARY_PLANNER_MODEL",
]
