from models import Calendar, Event
import argparse
import os

# Parse command-line arguments (cal_path, frequency, output_path) all required
parser = argparse.ArgumentParser(description="Convert iCal file to Markdown")

parser.add_argument(
    "--cal_path",
    type=str,
    required=True,
    help="Path to the iCal file (URL or local file)",
)
parser.add_argument(
    "--method",
    type=str,
    required=True,
    choices=["single", "day", "week", "month"],
    help="Grouping method for events: 'single' (one file per event), 'day', 'week', or 'month'",
)
parser.add_argument(
    "--output_path",
    type=str,
    required=True,
    help="Output path for the generated Markdown files",
)

args = parser.parse_args()


def main(cal_path, method, output_path):
    # Create output directory if it doesn't exist
    os.makedirs(output_path, exist_ok=True)

    calendar = Calendar()

    # Determine if cal_path is a URL or a local file
    if (
        cal_path.startswith("http://")
        or cal_path.startswith("https://")
        or cal_path.startswith("webcal://")
    ):
        raise NotImplementedError("URLs not yet supported, please use a .ics file")
    else:
        calendar.from_file(cal_path)

    # Export events to markdown
    results = calendar.export_to_markdown(method=method)

    # Write each file
    for item in results:
        filepath = os.path.join(output_path, item["filename"])
        with open(filepath, "w") as f:
            f.write(item["content"])
        print(f"Created: {filepath}")

    print(f"\nSuccessfully created {len(results)} markdown file(s) in {output_path}")


if __name__ == "__main__":
    main(args.cal_path, args.method, args.output_path)
