from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langgraph.graph import START, StateGraph

from src.packvote.backend import ITINERARY_PLANNER_MODEL
from src.packvote.backend.nodes.researcher import search_activity_node
from src.packvote.backend.nodes.retrieve import retrieve_node
from src.packvote.backend.nodes.supervisor import make_supervisor_node
from src.packvote.backend.utils.langgraph_elements import State

load_dotenv()

llm = ChatOpenAI(model=ITINERARY_PLANNER_MODEL, temperature=0, max_tokens=100)

research_supervisor_node = make_supervisor_node(
    llm,
    ["search_activity"],
)

workflow = StateGraph(State)
workflow.add_node("retrieve", retrieve_node)
workflow.add_node("search_activity", search_activity_node)
workflow.add_node("supervisor", research_supervisor_node)
workflow.add_edge(START, "retrieve")
workflow.add_edge("retrieve", "supervisor")
# Note: generate_itinerary and binary_grader use Command(goto="supervisor") for routing
# Note: supervisor uses Command(goto=...) for conditional routing, so no explicit edges needed

workflow = workflow.compile()

# Draw the mermaid diagram and save it to a file
workflow.get_graph().draw_mermaid_png(output_file_path="workflow.png")

response = workflow.invoke(
    {
        "messages": [
            {
                "role": "user",
                "content": "Create an itinerary for a 3 day trip to Tokyo, Japan",
            }
        ]
    },
    {"recursion_limit": 5},
)
print(response)
