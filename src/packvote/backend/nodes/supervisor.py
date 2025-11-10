from typing import Callable, Literal, TypedDict

from langchain_core.language_models.chat_models import BaseChatModel
from langgraph.graph import END
from langgraph.types import Command

from src.packvote.backend.utils.langgraph_elements import State


def make_supervisor_node(
    llm: BaseChatModel,
    members: list[str],
    # ) -> Callable[[State], Command[Literal[*members, "__end__"]]]:
) -> Callable[[State], Command[str]]:
    """A deterministic research supervisor orchestrating workers."""

    options = ["FINISH"] + members

    system_prompt = """
    You are the lead travel itinerary researcher for PackVote. Craft a cohesive,
    budget-aware itinerary that balances every traveler's preferences.
    Structure the output in markdown with sections: Overview, Daily Plan,
    Logistics, and Budget Notes.
    """

    class Router(TypedDict):
        """Worker to route to next. If no workers needed, route to FINISH."""

        next: Literal[*options]

    def supervisor_node(state: State) -> Command[Literal[*members, "__end__"]]:
        """An LLM-based router."""
        messages = [
            {"role": "system", "content": system_prompt},
        ] + state["messages"]
        response = llm.with_structured_output(Router).invoke(messages)
        goto = response["next"]
        if goto == "FINISH":
            goto = END

        return Command(goto=goto, update={"next": goto})

    return supervisor_node
