from typing import Literal

from langchain.agents import create_agent
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.types import Command

from src.packvote.backend import ITINERARY_PLANNER_MODEL
from src.packvote.backend.tools.search import search_tavily
from src.packvote.backend.utils.langgraph_elements import State

planner_llm = ChatOpenAI(
    model=ITINERARY_PLANNER_MODEL,
    temperature=0.1,
    max_tokens=500,
)

search_agent = create_agent(
    model=planner_llm,
    tools=[search_tavily],
)


def search_activity_node(state: State) -> Command[Literal["supervisor"]]:
    # travel_date = state.get("travel_date")
    # travel_duration = state.get("travel_duration")
    # user_surveys = state.get("user_surveys") or []
    # if not user_surveys:
    #     raise ValueError("User surveys must be loaded before generating an itinerary.")

    # trip_planning_context = format_user_surveys(
    #     user_surveys,
    #     travel_date,
    #     travel_duration,
    # )

    response = search_agent.invoke(state)

    return Command(
        update={
            "messages": [
                HumanMessage(
                    content=response["messages"][-1].content,
                    name="search_activity",
                ),
            ],
        },
        # We want the worker to route to the supervisor node after searching for activities
        goto="supervisor",
    )

    response = search_agent.invoke(
        [
            SystemMessage(
                content=(
                    "You are the lead travel itinerary researcher for PackVote. Craft a cohesive, "
                    "budget-aware itinerary that balances every traveler's preferences. "
                    "Structure the output in markdown with sections: Overview, Daily Plan, "
                    "Logistics, and Budget Notes."
                )
            ),
            HumanMessage(
                content=(
                    # f"Latest user instruction:\n{user_intent}\n\n"
                    # f"Traveler surveys:\n{survey_context}\n\n"
                    # f"Iteration guidance:\n{revision_notes}\n\n"
                    "Return a refreshed itinerary that explicitly calls out how each traveler "
                    "is considered. Highlight tradeoffs when budgets conflict."
                )
            ),
        ]
    )

    itinerary_text = response.content
    # attempts = state.get("attempts", 0) + 1

    return Command(
        update={
            "messages": [
                HumanMessage(
                    content=itinerary_text,
                    name="itinerary_researcher",
                )
            ],
            "latest_itinerary": itinerary_text,
            # "evaluation": None,
            # "attempts": attempts,
        },
        goto="supervisor",
    )


# Backwards compatibility with earlier graph wiring
search_node = search_activity_node
