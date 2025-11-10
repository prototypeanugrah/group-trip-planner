from typing import Literal

from langgraph.types import Command

from src.packvote.backend.pipelines.get_user_prefs import get_user_prefs
from src.packvote.backend.utils.langgraph_elements import State


def retrieve_node(state: State) -> Command[Literal["supervisor"]]:
    user_surveys = get_user_prefs(
        user_survey_file_path="src/packvote/backend/artifacts/model_inputs/user_surveys/final_submissions.json"
    )
    return Command(
        update={
            "user_surveys": user_surveys["user_surveys"],
            "travel_date": user_surveys["travel_date"],
            "travel_duration": user_surveys["travel_duration"],
        },
        goto="supervisor",
    )
