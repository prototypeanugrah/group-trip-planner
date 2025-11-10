import json
from typing import Any, Dict

from src.packvote.backend.utils.langgraph_elements import UserSurvey


def get_user_prefs(user_survey_file_path: str) -> Dict[str, Any]:
    """Get the user preferences from the user surveys.

    Args:
        user_survey_file_path: The path to the user survey file.

    Returns:
        A dictionary containing the user surveys, travel date, and travel duration.
    """
    with open(user_survey_file_path, "r", encoding="utf-8") as f:
        user_survey_responses = json.load(f)

    travel_date = user_survey_responses.pop("travel_date")
    travel_duration = user_survey_responses.pop("travel_duration")
    submissions = user_survey_responses.pop("submissions", [])

    user_surveys = [UserSurvey.model_validate(response) for response in submissions]
    return {
        "user_surveys": user_surveys,
        "travel_date": travel_date,
        "travel_duration": travel_duration,
    }
