import datetime as dt
import requests
import icalendar
from collections import defaultdict


class Event:
    def __init__(self, summary, start, end, description, location):
        """Initialise and do some light parsing"""
        self.summary = summary

        # Start and end to datetime format, so we can manipulate them
        self.start = dt.datetime.strptime(start, "%Y-%m-%d %H:%M:%S")
        self.end = dt.datetime.strptime(end, "%Y-%m-%d %H:%M:%S")

        # if start = end,
        if self.start == self.end:
            self.weekday = self.start.strftime("%A")

        else:
            self.weekday = f"{self.start.strftime('%A')} to {self.end.strftime('%A')}"

        # Get rid of ugly double spaces
        self.description = description.replace("\n\n", "\n").strip()

        # Location as is
        self.location = location

    def to_hugo_post(self):
        """Prepare a single event as a hugo markdown post"""
        meta_data = "\n".join(
            [
                self.summary,
                f"date: {self.start.isoformat()}",
                f"end: {self.end.isoformat()}",
            ]
        )

        front_matter = f"---\n{meta_data}---\n\n"

        if self.location:
            meta_data += f"\nlocation: {self.location}"

        if self.description:
            content = f"{self.description}"
        else:
            content = ""

        return front_matter + content

    def to_body_content(self):
        """Prepare a single event as markdown body content"""
        content_lines = [
            f"## {self.summary}\n",
            f"- **Start:** {self.start.strftime('%Y-%m-%d %H:%M')}\n",
            f"- **End:** {self.end.strftime('%Y-%m-%d %H:%M')}\n",
        ]
        if self.location:
            content_lines.append(f"- **Location:** {self.location}\n")

        if self.description:
            content_lines.append(f"\n{self.description}\n")

        content_lines.append("\n---\n")

        return "".join(content_lines)


class Calendar:
    def __init__(self) -> None:
        self.events = []

    def _parse_events(self):
        events = []
        for component in self.cal.walk():
            if component.name == "VEVENT":
                summary = component.get("summary")
                dtstart = component.get("dtstart").dt.strftime("%Y-%m-%d %H:%M:%S")
                dtend = component.get("dtend").dt.strftime("%Y-%m-%d %H:%M:%S")
                location = component.get("location", "")
                description = component.get("description", "")

                event = Event(
                    summary=summary,
                    start=dtstart,
                    end=dtend,
                    description=description,
                    location=location,
                )
                events.append(event)
        self.events = events

    def from_url(self, cal_url):
        response = requests.get(cal_url)
        self.cal = icalendar.Calendar.from_ical(response.content)

        self._parse_events()

    def from_file(self, cal_file):
        with open(cal_file, "rb") as f:
            self.cal = icalendar.Calendar.from_ical(f.read())
        self._parse_events()

    def export_to_markdown(self, method="single"):
        """
        Export events to Hugo markdown grouped by method.

        Args:
            method: Grouping method - 'single', 'day', 'week', or 'month'

        Returns:
            List of dicts with 'filename' and 'content' keys for each markdown file
        """
        results = []

        if method == "single":
            # One file per event
            for event in self.events:
                filename = f"{event.start.strftime('%Y-%m-%d')}-{self._slugify(event.summary)}.md"
                content = event.to_hugo_post()
                results.append({"filename": filename, "content": content})

        elif method == "day":
            # Group events by day
            events_by_day = defaultdict(list)
            for event in self.events:
                day_key = event.start.strftime("%Y-%m-%d")
                events_by_day[day_key].append(event)

            for day_key, day_events in events_by_day.items():
                filename = f"{day_key}-events.md"
                content = self._create_grouped_post(day_key, day_events, "day")
                results.append({"filename": filename, "content": content})

        elif method == "week":
            # Group events by week
            events_by_week = defaultdict(list)
            for event in self.events:
                week_key = event.start.strftime("%Y-W%W")
                events_by_week[week_key].append(event)

            for week_key, week_events in events_by_week.items():
                year, week = week_key.split("-W")
                first_day = dt.datetime.strptime(f"{year}-W{week}-1", "%Y-W%W-%w")
                filename = f"{first_day.strftime('%Y-%m-%d')}-week-events.md"
                content = self._create_grouped_post(week_key, week_events, "week")
                results.append({"filename": filename, "content": content})

        elif method == "month":
            # Group events by month
            events_by_month = defaultdict(list)
            for event in self.events:
                month_key = event.start.strftime("%Y-%m")
                events_by_month[month_key].append(event)

            for month_key, month_events in events_by_month.items():
                filename = f"{month_key}-events.md"
                content = self._create_grouped_post(month_key, month_events, "month")
                results.append({"filename": filename, "content": content})
        else:
            raise ValueError(
                f"Invalid method: {method}. Must be 'single', 'day', 'week', or 'month'"
            )

        return results

    def _slugify(self, text):
        """Convert text to a slug suitable for filenames"""
        import re

        text = text.lower()
        text = re.sub(r"[^\w\s-]", "", text)
        text = re.sub(r"[-\s]+", "-", text)
        return text.strip("-")

    def _create_grouped_post(self, key, events, grouping_type):
        """Create a Hugo post for grouped events"""
        # Sort events by start time
        events.sort(key=lambda e: e.start)

        # Get the earliest start time for the date field
        earliest = min(events, key=lambda e: e.start)

        # Create title based on grouping type
        if grouping_type == "day":
            title = f"Events on {earliest.start.strftime('%A, %B %d, %Y')}"
        elif grouping_type == "week":
            year, week = key.split("-W")
            first_day = dt.datetime.strptime(f"{year}-W{week}-1", "%Y-W%W-%w")
            last_day = first_day + dt.timedelta(days=6)
            title = f"Events Week of {first_day.strftime('%B %d')} - {last_day.strftime('%B %d, %Y')}"
        elif grouping_type == "month":
            date_obj = dt.datetime.strptime(key, "%Y-%m")
            title = f"Events in {date_obj.strftime('%B %Y')}"
        else:
            title = f"Events for {key}"

        # Create front matter
        meta_data = [
            f"title: {title}",
            f"date: {earliest.start.isoformat()}",
        ]

        front_matter = f"---\n{chr(10).join(meta_data)}\n---\n\n"

        # Create content with all events
        content_parts = [front_matter]
        content_parts.append(f"# {title}\n\n")

        for event in events:
            content_parts.append(event.to_body_content())

        return "".join(content_parts)
