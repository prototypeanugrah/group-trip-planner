from __future__ import annotations

from datetime import datetime, timedelta
from typing import Sequence

from src.packvote.backend.utils.langgraph_elements import UserSurvey


def format_user_surveys(
    user_surveys: Sequence[UserSurvey], travel_date: str, travel_duration: int
) -> str:
    """Render a concise, structured summary of all traveler surveys."""
    sections = []
    for idx, survey in enumerate(user_surveys, start=1):
        budget = f"${survey.budget_range[0]} - ${survey.budget_range[1]}"

        start_date = datetime.strptime(travel_date, "%Y-%m-%d")
        end_date = (start_date + timedelta(days=travel_duration - 1)).strftime(
            "%Y-%m-%d"
        )

        sections.append(
            "\n".join(
                [
                    f"Traveler {idx}:",
                    f"Travel window: {start_date} to {end_date}",
                    f"- Budget category: {survey.budget_category} | Range: {budget}",
                    f"- Interests: {', '.join(survey.preferences)}",
                ]
            )
        )
    return "\n\n".join(sections)
