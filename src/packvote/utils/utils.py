from typing import List

from langchain.agents.middleware import wrap_tool_call
from langchain_core.messages import ToolMessage
from pydantic import BaseModel, Field, field_validator


class UserSurvey(BaseModel):
    """Get user survey inputs."""

    name: str = Field(description="The name of the user")
    phone: int = Field(description="The phone number of the user (10 digits)")
    country_code: str = Field(description="The country code for the phone number")
    budget_category: int = Field(description="The minimum budget of the user")
    budget_range: list = Field(description="The budget range [low, high]")
    current_location: str = Field(description="The current location of the user")
    travel_date: str = Field(description="The preferred travel date of the user")
    travel_duration: int = Field(
        description="The preferred travel duration of the user"
    )
    preferences: List[str] = Field(
        description="The list of preferred travel preferences of the user"
    )

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        """Validate that phone number is exactly 10 digits."""
        if not isinstance(v, int):
            raise ValueError("Phone number must be an integer")
        phone_str = str(v)
        if len(phone_str) != 10:
            raise ValueError("Phone number must be exactly 10 digits")
        return v


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
