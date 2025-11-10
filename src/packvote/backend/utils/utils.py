from langchain.agents.middleware import wrap_tool_call
from langchain_core.messages import ToolMessage
from pydantic import BaseModel, Field


class OutputTravelResearchSchema(BaseModel):
    """The output schema for the travel research agent."""

    travel_options: str = Field(description="The detailed travel option for the user")
    travel_cost: int = Field(description="The estimated cost of the travel options")
    destination_weather: str = Field(
        description="The weather of the destination location"
    )
    travel_interests: list[str] = Field(
        description="The interests of the travel options"
    )
    travel_preferences: list[str] = Field(
        description="The preferences of the travel options"
    )


@wrap_tool_call
def handle_tool_errors(request, handler):
    """Handle tool execution errors with custom messages."""
    try:
        return handler(request)
    except Exception as e:
        # Return a custom error message to the model
        return ToolMessage(
            content=f"Tool error: Please check your input and try again. ({str(e)})",
            tool_call_id=request.tool_call["id"],
        )
