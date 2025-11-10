import json
import os

from dotenv import load_dotenv
from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings
from langchain_qdrant import FastEmbedSparse, QdrantVectorStore, RetrievalMode

from src.packvote.backend.utils.utils import UserSurvey

load_dotenv()


def create_vector_db(
    user_responses: list[UserSurvey],
) -> QdrantVectorStore:
    """Create a vector database.

    Args:

    Returns:
        QdrantVectorStore: The vector database.
    """
    # get environment variables
    QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
    QDRANT_URL = os.getenv("QDRANT_URL")

    # create embeddings
    dense_embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
    sparse_embeddings = FastEmbedSparse(model_name="Qdrant/bm25")

    documents = [
        Document(
            page_content=json.dumps(user_response.model_dump()),
            metadata={"name": user_response.name},
        )
        for user_response in user_responses
    ]

    # Create vector store with force_recreate to avoid conflicts with existing collections
    vector_store = QdrantVectorStore.from_documents(
        documents=documents,
        embedding=dense_embeddings,
        sparse_embedding=sparse_embeddings,
        collection_name="user_responses_collection",
        # path=config.vector_db_path,
        url=QDRANT_URL,
        api_key=QDRANT_API_KEY,
        retrieval_mode=RetrievalMode.HYBRID,
        force_recreate=True,
    )

    print("Vector store created successfully")

    return vector_store
