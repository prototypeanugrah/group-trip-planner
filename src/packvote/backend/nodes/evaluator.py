from typing import Literal

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.types import Command

from src.packvote.backend.utils.langgraph_elements import BinaryEvaluation, State
from src.packvote.backend.utils.prompt_formatters import format_user_surveys
from src.packvote.backend.utils.state_helpers import get_latest_itinerary

GRADER_MODEL = "gpt-4o-mini"
grader_llm = ChatOpenAI(model=GRADER_MODEL, temperature=0)
binary_grader = grader_llm.with_structured_output(BinaryEvaluation)


def evaluator_node(state: State) -> Command[Literal["supervisor"]]:
    itinerary = get_latest_itinerary(state)
    if not itinerary:
        return Command(
            update={
                "messages": [
                    SystemMessage(
                        content=(
                            "Binary grader was invoked without an itinerary draft. "
                            "Requesting the planner to generate a proposal before grading."
                        )
                    )
                ],
                "evaluation": None,
            },
            goto="supervisor",
        )

    user_surveys = state.get("user_surveys") or []
    travel_date = state.get("travel_date") or ""
    travel_duration = state.get("travel_duration") or 0
    survey_summary = format_user_surveys(user_surveys, travel_date, travel_duration)

    structured_evaluation = binary_grader.invoke(
        [
            SystemMessage(
                content=(
                    "You are a binary grader for collaborative trip itineraries. "
                    "Approve only if the plan clearly balances every traveler's needs, "
                    "fits the shared budget range, and references logistics feasibility. "
                    "Otherwise request revisions and specify concrete critiques."
                )
            ),
            HumanMessage(
                content=(
                    f"Traveler surveys:\n{survey_summary}\n\n"
                    f"Itinerary draft:\n{itinerary}\n\n"
                    "Return a binary verdict plus rationale and bullet revisions."
                )
            ),
        ]
    )

    evaluation_message = (
        f"Verdict: {structured_evaluation.verdict.upper()}\n"
        f"Rationale: {structured_evaluation.rationale}\n"
        "Revisions:\n"
        + (
            "\n".join(f"- {item}" for item in structured_evaluation.revisions)
            or "- None"
        )
    )

    return Command(
        update={
            "messages": [
                HumanMessage(
                    content=evaluation_message,
                    name="binary_grader",
                )
            ],
            "evaluation": structured_evaluation.model_dump(),
        },
        goto="supervisor",
    )
