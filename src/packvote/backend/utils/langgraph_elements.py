from typing import List, Literal, Optional, TypedDict

from langgraph.graph import MessagesState
from pydantic import BaseModel, Field, field_validator


class GraphState(TypedDict):
    """Graph state."""

    messages: MessagesState


class UserSurvey(BaseModel):
    """Get user survey inputs."""

    name: str = Field(description="The name of the user")
    phone: int = Field(description="The phone number of the user (10 digits)")
    country_code: str = Field(description="The country code for the phone number")
    budget_category: str = Field(
        description="The budget category of the user. (e.g. 'low', 'medium', 'high')"
    )
    budget_range: list = Field(description="The budget range [low, high]")
    current_location: str = Field(description="The current location of the user")
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


class BinaryEvaluation(BaseModel):
    """Binary approval signal returned by the evaluator."""

    verdict: Literal["approved", "revise"] = Field(
        description="Overall disposition for the itinerary"
    )
    rationale: str = Field(
        description="Brief reasoning for the verdict and key evidence"
    )
    revisions: List[str] = Field(
        default_factory=list,
        description="Specific actionable improvements expected for a re-run",
    )


class State(MessagesState):
    """State for the supervisor node."""

    next: str
    travel_date: Optional[str] = Field(
        description="The preferred travel date of the group of users",
    )
    travel_duration: Optional[int] = Field(
        description="The preferred travel duration of the group of users",
    )
    user_surveys: List[UserSurvey] = Field(description="The user surveys")
    latest_itinerary: Optional[str] = Field(
        default=None,
        description="Latest generated itinerary draft shared among nodes",
    )
    # evaluation: Optional[BinaryEvaluation] = Field(
    #     default=None,
    #     description="Latest binary grader evaluation payload",
    # )
    # attempts: int = Field(
    #     default=0, description="Number of itinerary generation attempts so far"
    # )


# class ItineraryItem(BaseModel):
#     day_index: int = Field(
#         description="The index of the day in the itinerary"
#     )  # 0..N-1
#     title: str = Field(description="The title of the itinerary item")
#     start_time_local: Time = Field(description="The start time of the itinerary item")
#     end_time_local: Time = Field(description="The end time of the itinerary item")
#     location_name: str = Field(description="The name of the location")
#     address: str | None = Field(description="The address of the location")
#     lat: float | None = Field(description="The latitude of the location")
#     lon: float | None = Field(description="The longitude of the location")
#     category: str = Field(description="The category of the itinerary item")
#     expected_cost: float | None = Field(
#         description="The expected cost of the itinerary item"
#     )
#     booking_required: bool = Field(
#         description="Whether the itinerary item requires a booking"
#     )
#     source: str | None = Field(description="The source of the itinerary item")


# class DayPlan(BaseModel):
#     date: Date = Field(description="The date of the day plan")
#     items: list[ItineraryItem] = Field(description="The items of the day plan")
#     slack_minutes: int = Field(description="The slack minutes for the day plan")


# class Itinerary(BaseModel):
#     destination_city: str = Field(description="The destination city of the itinerary")
#     timezone: str = Field(description="The timezone of the itinerary")
#     days: list[DayPlan] = Field(description="The days of the itinerary")
#     est_total_activity_cost: float | None = Field(
#         description="The estimated total activity cost of the itinerary"
#     )


# class EvalIssue(BaseModel):
#     severity: Literal["blocker", "warning", "nit"] = Field(
#         description="The severity of the evaluation issue"
#     )
#     code: str = Field(
#         description="The code of the evaluation issue"
#     )  # "TIME_OVERLAP", "TOO_FAR", "CLOSED_HOURS", "BUDGET_OVER"
#     message: str = Field(description="The message of the evaluation issue")
#     evidence: dict = Field(description="The evidence of the evaluation issue")


# class EvalReport(BaseModel):
#     ok: bool = Field(description="Whether the evaluation is ok")
#     issues: list[EvalIssue] = Field(description="The issues of the evaluation")
#     recommendations: list[str] = Field(
#         description="The recommendations of the evaluation"
#     )


# class FlightOption(BaseModel):
#     provider: str = Field(description="The provider of the flight option")
#     price_total: float = Field(description="The total price of the flight option")
#     currency: str = Field(description="The currency of the flight option")
#     depart_time_local: DateTime = Field(
#         description="The depart time of the flight option"
#     )
#     arrive_time_local: DateTime = Field(
#         description="The arrive time of the flight option"
#     )
#     origin: str = Field(description="The origin of the flight option")
#     destination: str = Field(description="The destination of the flight option")
#     cabin: str = Field(description="The cabin of the flight option")
#     fare_basis: str | None = Field(description="The fare basis of the flight option")
#     deeplink: str | None = Field(description="The deeplink of the flight option")


# class HotelOption(BaseModel):
#     provider: str = Field(description="The provider of the hotel option")
#     name: str = Field(description="The name of the hotel option")
#     nightly_price: float = Field(description="The nightly price of the hotel option")
#     currency: str = Field(description="The currency of the hotel option")
#     stars: float | None = Field(description="The stars of the hotel option")
#     rating: float | None = Field(description="The rating of the hotel option")
#     address: str | None = Field(description="The address of the hotel option")
#     checkin: Date = Field(description="The checkin date of the hotel option")
#     checkout: Date = Field(description="The checkout date of the hotel option")
#     deeplink: str | None = Field(description="The deeplink of the hotel option")


# class ActivityDeal(BaseModel):
#     provider: str = Field(description="The provider of the activity option")
#     title: str = Field(description="The title of the activity option")
#     price_per_person: float = Field(
#         description="The price per person of the activity option"
#     )
#     currency: str = Field(description="The currency of the activity option")
#     date: Date = Field(description="The date of the activity option")
#     timeslot: str | None = Field(description="The timeslot of the activity option")
#     deeplink: str | None = Field(description="The deeplink of the activity option")
#     matches_item_titles: list[str] = Field(
#         description="The matches item titles of the activity option"
#     )


# class LogisticsBundle(BaseModel):
#     flights: list[FlightOption] = Field(
#         description="The flights of the logistics bundle"
#     )
#     hotels: list[HotelOption] = Field(description="The hotels of the logistics bundle")
#     activities: list[ActivityDeal] = Field(
#         description="The activities of the logistics bundle"
#     )


# class FinalReport(BaseModel):
#     itinerary: Itinerary = Field(description="The itinerary of the final report")
#     flights: list[FlightOption] = Field(description="The flights of the final report")
#     hotels: list[HotelOption] = Field(description="The hotels of the final report")
#     activities: list[ActivityDeal] = Field(
#         description="The activities of the final report"
#     )
#     totals: dict = Field(
#         description="The totals of the final report"
#     )  # {"trip_total": ..., "per_person": ...}


# class TripState(TypedDict, total=False):
#     user: UserSurvey
#     itinerary: Itinerary
#     eval_report: EvalReport
#     approved: bool
#     logistics: LogisticsBundle
#     final_report: FinalReport
