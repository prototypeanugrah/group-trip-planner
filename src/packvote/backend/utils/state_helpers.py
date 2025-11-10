from __future__ import annotations

from typing import Optional, Sequence

from langchain_core.messages import BaseMessage

from src.packvote.backend.utils.langgraph_elements import State

ITINERARY_AUTHOR = "itinerary_researcher"


def _coerce_text(value) -> str:
    if isinstance(value, str):
        return value
    return str(value)


def _latest_named_message(
    messages: Sequence[BaseMessage] | None, name: str
) -> Optional[str]:
    if not messages:
        return None
    for message in reversed(messages):
        if getattr(message, "name", None) == name:
            return _coerce_text(message.content)
    return None


def get_latest_itinerary(state: State) -> Optional[str]:
    """Read the newest itinerary text from state or message history."""
    itinerary = state.get("latest_itinerary")
    if itinerary:
        return itinerary
    messages = state.get("messages")
    return _latest_named_message(messages, ITINERARY_AUTHOR)
