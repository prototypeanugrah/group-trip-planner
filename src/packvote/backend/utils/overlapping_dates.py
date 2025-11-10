# Function to calculate group overlap (intersection of all travelers' windows),
# assuming 'travel_date' is the start date (YYYY-MM-DD) and 'travel_duration' is in days.
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple


def _to_date(iso_str: str):
    return datetime.strptime(iso_str, "%Y-%m-%d").date()


def _window_from_record(rec: Dict) -> Tuple:
    """
    Returns (start_date, end_date_inclusive) for a single record.
    """
    start = _to_date(str(rec["travel_date"]))
    duration = int(rec["travel_duration"])
    if duration < 1:
        raise ValueError(
            f"travel_duration must be >= 1, got {duration} for {rec.get('name')}"
        )
    end = start + timedelta(days=duration - 1)
    return start, end


def group_overlap(trips: List[Dict]) -> Dict[str, Optional[str]]:
    """
    Compute the intersection (inclusive) of all travelers' date windows.
    Each item in `trips` must contain 'travel_date' (YYYY-MM-DD) and 'travel_duration' (int days).

    Returns:
        {
          'overlap_start': 'YYYY-MM-DD' or None,
          'overlap_end': 'YYYY-MM-DD' or None,
          'overlap_days': int
        }
    """
    if not trips:
        return {"overlap_start": None, "overlap_end": None, "overlap_days": 0}

    starts, ends = [], []
    for rec in trips:
        s, e = _window_from_record(rec)
        starts.append(s)
        ends.append(e)

    latest_start = max(starts)
    earliest_end = min(ends)
    if latest_start <= earliest_end:
        days = (earliest_end - latest_start).days + 1  # inclusive
        return {
            "overlap_start": latest_start.isoformat(),
            "overlap_end": earliest_end.isoformat(),
            "overlap_days": days,
        }
    else:
        return {
            "overlap_start": None,
            "overlap_end": None,
            "overlap_days": 0,
        }
