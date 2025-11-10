"""PackVote API

This API is used to create a new project and submit user surveys.

Usage:
    uv run uvicorn app:app --reload
Returns:
    API for the PackVote project.


"""

import csv
import io
import json
import urllib.parse
from datetime import datetime
from pathlib import Path
from typing import List

import httpx
from fastapi import FastAPI, Form, Query, Request
from fastapi.responses import (
    JSONResponse,
    PlainTextResponse,
    RedirectResponse,
)
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import ValidationError

from src.packvote.backend.utils.langgraph_elements import UserSurvey

app = FastAPI(title="PackVote")

# JSON file for persistent storage - path will be determined by project_name from form
ARTIFACTS_DIR = Path("src/packvote/backend/artifacts/model_inputs/user_surveys")
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
PROJECTS_FILE = Path("src/packvote/backend/artifacts/model_inputs/projects.json")

# Mount frontend assets
app.mount(
    "/static",
    StaticFiles(directory="src/packvote/frontend/static"),
    name="static",
)
templates = Jinja2Templates(directory="src/packvote/frontend/templates")

# In-memory “DB”
SUBMISSIONS: List[UserSurvey] = []

PREFERENCES = [
    "Beaches",
    "City sightseeing",
    "Outdoor adventures",
    "Festivals/events",
    "Food exploration",
    "Nightlife",
    "Shopping",
    "Spa wellness",
]
BUDGET_CARDS = {
    "low": {"label": "Low", "range": [0, 1000]},
    "medium": {"label": "Medium", "range": [1000, 2500]},
    "high": {"label": "High", "range": [2500, 5000]},
}


# ---------- Storage Functions ----------
def get_projects() -> List[dict]:
    """Load all projects from the projects file."""
    if PROJECTS_FILE.exists():
        try:
            with open(PROJECTS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except json.JSONDecodeError:
            return []
    return []


def save_projects(projects: List[dict]) -> None:
    """Save projects list to file."""
    with open(PROJECTS_FILE, "w", encoding="utf-8") as f:
        json.dump(projects, f, indent=2, ensure_ascii=False)


def add_project(
    project_name: str, travel_date: str = None, travel_duration: int = None
) -> dict:
    """Add a new project if it doesn't exist."""
    projects = get_projects()
    safe_name = sanitize_project_name(project_name)

    # Check if project already exists
    for p in projects:
        if p.get("safe_name") == safe_name:
            # Update travel info if provided
            if travel_date is not None:
                p["travel_date"] = travel_date
            if travel_duration is not None:
                p["travel_duration"] = travel_duration
            save_projects(projects)
            return p

    # Create new project
    new_project = {
        "name": project_name.strip(),
        "safe_name": safe_name,
        "created_at": None,  # Could add timestamp if needed
    }
    if travel_date is not None:
        new_project["travel_date"] = travel_date
    if travel_duration is not None:
        new_project["travel_duration"] = travel_duration
    projects.append(new_project)
    save_projects(projects)
    return new_project


def sanitize_project_name(project_name: str) -> str:
    """Sanitize project name to be filesystem-safe."""
    safe_name = "".join(
        c for c in project_name if c.isalnum() or c in ("-", "_")
    ).strip()
    if not safe_name:
        safe_name = "default"
    return safe_name


def get_submissions_file_path(project_name: str) -> Path:
    """Get the file path for a given project name."""
    safe_name = sanitize_project_name(project_name)
    return ARTIFACTS_DIR / f"{safe_name}_submissions.json"


def load_submissions_from_file(project_name: str) -> List[UserSurvey]:
    """Load submissions from JSON file for a given project if it exists."""
    submissions_file = get_submissions_file_path(project_name)
    if submissions_file.exists():
        try:
            with open(submissions_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                # Handle backward compatibility: old format (object with travel_date, travel_duration, submissions)
                if isinstance(data, dict) and "submissions" in data:
                    submissions_list = data.get("submissions", [])
                else:
                    # Current format (array of submissions)
                    submissions_list = data if isinstance(data, list) else []

                submissions = []
                for item in submissions_list:
                    # Remove added_at before creating UserSurvey object
                    item_copy = {
                        k: v for k, v in item.items() if k not in ("added_at",)
                    }
                    # Handle backward compatibility: convert phone to int if string
                    if "phone" in item_copy and isinstance(item_copy["phone"], str):
                        phone_clean = "".join(filter(str.isdigit, item_copy["phone"]))
                        if len(phone_clean) == 10:
                            item_copy["phone"] = int(phone_clean)
                        else:
                            continue  # Skip invalid phone numbers
                    # Add default country_code if missing (backward compatibility)
                    if "country_code" not in item_copy:
                        item_copy["country_code"] = "+1"  # Default to US
                    submissions.append(UserSurvey(**item_copy))
                return submissions
        except (json.JSONDecodeError, ValidationError, KeyError) as e:
            print(f"Error loading submissions file: {e}")
            return []
    return []


def load_submissions_with_metadata(project_name: str) -> dict:
    """Load submissions with metadata (like added_at) from JSON file.
    Returns dict with submissions array."""
    submissions_file = get_submissions_file_path(project_name)
    if submissions_file.exists():
        try:
            with open(submissions_file, "r", encoding="utf-8") as f:
                data = json.load(f)

                # Handle backward compatibility: old format (object with travel_date, travel_duration, submissions)
                if isinstance(data, dict) and "submissions" in data:
                    submissions_list = data.get("submissions", [])
                else:
                    # Current format (array of submissions)
                    submissions_list = data if isinstance(data, list) else []

                # Validate each item as UserSurvey, but return full data including added_at
                validated_data = []
                for item in submissions_list:
                    # Validate the submission (excluding added_at)
                    item_copy = {
                        k: v for k, v in item.items() if k not in ("added_at",)
                    }
                    # Handle backward compatibility: convert phone to int if string
                    if "phone" in item_copy and isinstance(item_copy["phone"], str):
                        phone_clean = "".join(filter(str.isdigit, item_copy["phone"]))
                        if len(phone_clean) == 10:
                            item_copy["phone"] = int(phone_clean)
                        else:
                            continue  # Skip invalid phone numbers
                    # Add default country_code if missing (backward compatibility)
                    if "country_code" not in item_copy:
                        item_copy["country_code"] = "+1"  # Default to US
                    survey = UserSurvey(**item_copy)
                    # Return validated data merged with metadata
                    result = survey.model_dump()
                    if "added_at" in item:
                        result["added_at"] = item["added_at"]
                    validated_data.append(result)

                # Return submissions array
                return {"submissions": validated_data}
        except (json.JSONDecodeError, ValidationError, KeyError) as e:
            print(f"Error loading submissions file: {e}")
            return {"submissions": []}
    return {"submissions": []}


def append_submission_to_file(survey: UserSurvey, project_name: str) -> None:
    """Append a single submission to the JSON file for the given project."""
    submissions_file = get_submissions_file_path(project_name)

    # Read existing data
    existing_submissions = []

    if submissions_file.exists():
        try:
            with open(submissions_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                # Handle backward compatibility: old format (object with travel_date, travel_duration, submissions)
                if isinstance(data, dict) and "submissions" in data:
                    existing_submissions = data.get("submissions", [])
                else:
                    # Current format (array of submissions)
                    existing_submissions = data if isinstance(data, list) else []
        except json.JSONDecodeError:
            existing_submissions = []

    # Append new submission with timestamp
    submission_data = survey.model_dump()
    submission_data["added_at"] = datetime.now().isoformat()
    existing_submissions.append(submission_data)

    # Write back to file as array
    with open(submissions_file, "w", encoding="utf-8") as f:
        json.dump(existing_submissions, f, indent=2, ensure_ascii=False)


# In-memory storage (will be project-specific in future)
SUBMISSIONS: List[UserSurvey] = []


# ---------- Routes ----------
@app.get("/")
def form(request: Request, project: str = None):
    # Pass config to the template; JS reads it from data-* attributes
    projects = get_projects()
    selected_project = (
        project if project else (projects[0]["safe_name"] if projects else None)
    )
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "preferences": PREFERENCES,
            "budget_cards": BUDGET_CARDS,
            "projects": projects,
            "selected_project": selected_project,
        },
    )


@app.get("/api/projects")
def list_projects():
    """Get all projects."""
    return JSONResponse(get_projects())


@app.post("/api/projects")
async def create_project(request: Request):
    """Create a new project."""
    form_data = await request.form()
    project_name = form_data.get("name", "").strip()
    if not project_name:
        return PlainTextResponse("Project name is required", status_code=400)

    travel_date = form_data.get("travel_date", "").strip()
    travel_duration = form_data.get("travel_duration", "").strip()

    if not travel_date:
        return PlainTextResponse("Travel date is required", status_code=400)

    if not travel_duration:
        return PlainTextResponse("Travel duration is required", status_code=400)

    try:
        travel_duration_int = int(travel_duration)
    except ValueError:
        return PlainTextResponse("Travel duration must be a number", status_code=400)

    project = add_project(project_name, travel_date, travel_duration_int)

    # Initialize submissions file as empty array
    submissions_file = get_submissions_file_path(project_name)
    if not submissions_file.exists():
        with open(submissions_file, "w", encoding="utf-8") as f:
            json.dump([], f, indent=2, ensure_ascii=False)

    return JSONResponse(project)


@app.get("/api/projects/{project_name}/submissions")
def get_project_submissions(project_name: str):
    """Get all submissions for a specific project."""
    submissions = load_submissions_with_metadata(project_name)
    return JSONResponse(submissions)


@app.delete("/api/projects/{project_name}")
def delete_project(project_name: str):
    """Delete a project and its submissions file."""
    projects = get_projects()
    safe_name = sanitize_project_name(project_name)

    # Remove project from projects list
    projects = [p for p in projects if p.get("safe_name") != safe_name]
    save_projects(projects)

    # Delete submissions file if it exists
    submissions_file = get_submissions_file_path(project_name)
    if submissions_file.exists():
        try:
            submissions_file.unlink()
        except Exception as e:
            print(f"Error deleting submissions file: {e}")
            return PlainTextResponse(
                f"Project deleted but failed to delete submissions file: {e}",
                status_code=500,
            )

    return JSONResponse({"message": "Project deleted successfully"})


@app.delete("/api/projects/{project_name}/submissions")
async def delete_participant(project_name: str, request: Request):
    """Delete a participant from a project's submissions."""
    try:
        body = await request.json()
        participant_id = body.get("participant_id")

        if not participant_id:
            return PlainTextResponse("participant_id is required", status_code=400)

        # Decode the participant identifier
        participant_data = json.loads(urllib.parse.unquote(participant_id))

        # Load submissions
        submissions_file = get_submissions_file_path(project_name)
        if not submissions_file.exists():
            return PlainTextResponse(
                "Project submissions file not found", status_code=404
            )

        try:
            with open(submissions_file, "r", encoding="utf-8") as f:
                data = json.load(f)
        except json.JSONDecodeError:
            return PlainTextResponse("Invalid submissions file", status_code=500)

        # Handle backward compatibility: old format (object with travel_date, travel_duration, submissions)
        if isinstance(data, dict) and "submissions" in data:
            submissions_list = data.get("submissions", [])
        else:
            # Current format (array of submissions)
            submissions_list = data if isinstance(data, list) else []

        # Find and remove the matching participant
        # Match by name, phone, and added_at
        original_count = len(submissions_list)
        submissions_list = [
            s
            for s in submissions_list
            if not (
                s.get("name") == participant_data.get("name")
                and str(s.get("phone")) == str(participant_data.get("phone"))
                and s.get("added_at") == participant_data.get("added_at")
            )
        ]

        if len(submissions_list) == original_count:
            return PlainTextResponse("Participant not found", status_code=404)

        # Save updated submissions as array
        with open(submissions_file, "w", encoding="utf-8") as f:
            json.dump(submissions_list, f, indent=2, ensure_ascii=False)

        return JSONResponse({"message": "Participant deleted successfully"})

    except json.JSONDecodeError as e:
        return PlainTextResponse(f"Invalid request body: {e}", status_code=400)
    except Exception as e:
        return PlainTextResponse(f"Error deleting participant: {e}", status_code=500)


@app.post("/submit")
async def submit(
    request: Request,
    project_name: str = Form(...),
    name: str = Form(...),
    phone: str = Form(...),
    country_code: str = Form(...),
    budget_category: str = Form(...),
    budget_range: str = Form(...),
    current_location: str = Form(...),
):
    try:
        # Get preferences from form - FastAPI handles multiple values with same name
        form_data = await request.form()
        preferences = form_data.getlist("preferences")

        # Clean phone number - remove all non-digit characters
        phone_clean = "".join(filter(str.isdigit, phone.strip()))

        # Validate phone number is exactly 10 digits
        if len(phone_clean) != 10:
            return PlainTextResponse(
                "Phone number must be exactly 10 digits", status_code=400
            )

        # Convert to int
        try:
            phone_int = int(phone_clean)
        except ValueError:
            return PlainTextResponse(
                "Phone number must contain only digits", status_code=400
            )

        # Validate budget_category is one of the allowed values
        budget_category_lower = budget_category.strip().lower()
        if budget_category_lower not in ["low", "medium", "high"]:
            return PlainTextResponse(
                "Budget category must be 'low', 'medium', or 'high'", status_code=400
            )

        payload = {
            "name": name.strip(),
            "phone": phone_int,
            "country_code": country_code.strip(),
            "budget_category": budget_category_lower,
            "budget_range": json.loads(budget_range),
            "current_location": current_location.strip(),
            "preferences": preferences or [],
        }
        survey = UserSurvey(**payload)
    except (ValidationError, json.JSONDecodeError) as e:
        return PlainTextResponse(str(e), status_code=400)

    # Save to project-specific file
    project_name_clean = sanitize_project_name(project_name)
    # Ensure project exists
    add_project(project_name)
    SUBMISSIONS.append(survey)
    append_submission_to_file(survey, project_name_clean)
    return RedirectResponse(f"/?project={project_name_clean}", status_code=303)


@app.get("/api/location/autocomplete")
async def location_autocomplete(query: str = Query(..., min_length=2)):
    """Get location suggestions from Photon API (designed for autocomplete)."""
    try:
        # Use Photon API - designed specifically for autocomplete
        url = "https://photon.komoot.io/api"
        params = {
            "q": query,
            "limit": 8,  # Get more results to filter better
            "lang": "en",
        }
        headers = {"User-Agent": "PackVote/1.0"}

        async with httpx.AsyncClient() as client:
            response = await client.get(
                url, params=params, headers=headers, timeout=5.0
            )
            response.raise_for_status()
            data = response.json()

        # Format results to show city, state/country
        suggestions = []
        seen_locations = set()  # Avoid duplicates

        features = data.get("features", [])

        for feature in features:
            properties = feature.get("properties", {})

            # Get location type - prioritize cities, towns, villages
            location_type = properties.get("type", "").lower()
            osm_value = properties.get("osm_value", "").lower()

            # Filter to only include populated places
            valid_types = ("city", "town", "village", "municipality", "administrative")
            if location_type not in valid_types and osm_value not in valid_types:
                # Check if it's a place with a name (might be a city)
                if not properties.get("name"):
                    continue
                # Allow if it has city/town-like properties
                if location_type not in (
                    "place",
                    "administrative",
                ) and osm_value not in ("place", "administrative"):
                    continue

            # Get city/town name
            city = (
                properties.get("city")
                or properties.get("name")
                or properties.get("town")
                or properties.get("village")
            )

            if not city:
                continue

            # Get state and country
            state = (
                properties.get("state")
                or properties.get("state_code")
                or properties.get("region")
            )
            country = properties.get("country", "")
            country_code = properties.get("countrycode", "").upper()

            # Format display name - prioritize US format (City, State)
            if state and (country == "United States" or country_code == "US"):
                # For US, prefer state code if available
                state_code = properties.get("state_code", "")
                if state_code and len(state_code) == 2:
                    display_name = f"{city}, {state_code}"
                elif state and len(state) <= 2:
                    display_name = f"{city}, {state.upper()}"
                else:
                    display_name = f"{city}, {state}"
            elif state:
                display_name = f"{city}, {state}"
            elif country:
                display_name = f"{city}, {country}"
            else:
                display_name = city

            # Create a unique key to avoid duplicates
            location_key = display_name.lower()
            if location_key in seen_locations:
                continue
            seen_locations.add(location_key)

            # Check if the query matches the city name (case-insensitive)
            query_lower = query.lower().strip()
            city_lower = city.lower().strip()

            # Only include results where the city name starts with the query
            # This ensures "austi" matches "Austin" but not "Haparanda kommun"
            if not city_lower.startswith(query_lower):
                # Allow if query is at least 3 chars and city contains it (for partial matches)
                if len(query_lower) >= 3 and query_lower in city_lower:
                    pass  # Allow it but with lower priority
                else:
                    continue  # Skip if it doesn't match at all

            # Prioritize results where the query matches the beginning of the city name
            priority = 0
            if city_lower.startswith(query_lower):
                priority = 2  # Highest priority for prefix matches
            elif query_lower in city_lower:
                priority = 1  # Lower priority for contains matches

            suggestions.append(
                {
                    "display_name": display_name,
                    "full_name": properties.get("name", ""),
                    "priority": priority,
                }
            )

        # Sort by priority (prefix matches first), then limit to 5
        suggestions.sort(key=lambda x: -x["priority"])
        suggestions = suggestions[:5]

        # Remove priority from response
        for suggestion in suggestions:
            suggestion.pop("priority", None)

        return JSONResponse(suggestions)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@app.get("/submissions")
def list_submissions(project: str = None):
    if project:
        submissions = load_submissions_from_file(project)
        return JSONResponse([s.model_dump() for s in submissions])
    return JSONResponse([s.model_dump() for s in SUBMISSIONS])


@app.get("/submissions.csv")
def download_csv(project: str = None):
    submissions = load_submissions_from_file(project) if project else SUBMISSIONS
    if not submissions:
        return PlainTextResponse("No submissions yet.", status_code=200)
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(
        [
            "name",
            "phone",
            "country_code",
            "budget_category",
            "budget_range",
            "current_location",
            "preferences",
        ]
    )
    for s in submissions:
        # Format phone with country code if available
        s_dict = s.model_dump()
        phone_display = str(s_dict.get("phone", ""))
        country_code = s_dict.get("country_code", "")
        if country_code:
            phone_display = f"{country_code} {phone_display}"
        w.writerow(
            [
                s_dict.get("name", "").capitalize(),
                phone_display,
                country_code,
                s_dict.get("budget_category", ""),
                json.dumps(s_dict.get("budget_range", [])),
                s_dict.get("current_location", "").capitalize(),
                "; ".join(s_dict.get("preferences", [])).capitalize(),
            ]
        )
    buf.seek(0)
    return PlainTextResponse(buf.read(), media_type="text/csv")
