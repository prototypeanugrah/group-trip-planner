from langchain.tools import tool
from tavily import TavilyClient

from src.packvote import TAVILY_API_KEY


@tool
def search_tavily(query: str, max_results: int) -> str:
    """Search the Tavily API for the given query.

    Args:
        query (str): The query to search the Tavily API for.
        max_results (int): The maximum number of results to return.
    Returns:
        str: The results of the search.
    """

    client = TavilyClient(api_key=TAVILY_API_KEY)

    results = client.search(query=query, max_results=max_results)
    return results
