import json

from langchain.agents import create_agent
from langchain_community.utilities.openweathermap import OpenWeatherMapAPIWrapper
from langchain_openai import ChatOpenAI

from src.packvote.backend.tools.search import search_tavily
from src.packvote.backend.utils.langgraph_elements import UserSurvey
from src.packvote.backend.utils.utils import (
    OutputTravelResearchSchema,
    handle_tool_errors,
)


def main():
    # Read the sample responses
    with open(
        "src/packvote/backend/artifacts/user_surveys/test_submission.json",
        "r",
        encoding="utf-8",
    ) as f:
        user_survey_responses = json.load(f)
    user_surveys = [
        UserSurvey.model_validate(response) for response in user_survey_responses
    ]

    weather_tool = OpenWeatherMapAPIWrapper()

    travel_research_agent = create_agent(
        tools=[search_tavily, weather_tool.run],
        model=ChatOpenAI(model="gpt-4o-mini"),
        middleware=[handle_tool_errors],
        response_format=OutputTravelResearchSchema,
        system_prompt="""You are a travel research agent. 
        You are given user survey inputs of a group of friends that are planning to travel together.
        Your task is to research a single best travel option for this group of friends.
        Analyze the travel options, the user preferences, interests to create a detailed 
        travel option that is most suitable for the group of friends.""",
    )

    input_message = {
        "role": "user",
        "content": f"The users are: {user_surveys}.",
    }

    for step in travel_research_agent.stream(
        {"messages": [input_message]},
        stream_mode="values",
    ):
        step["messages"][-1].pretty_print()

    # Save the response to a file
    with open("response.json", "w", encoding="utf-8") as f:
        json.dump(step["messages"][-1].content, f, indent=4)


if __name__ == "__main__":
    main()
