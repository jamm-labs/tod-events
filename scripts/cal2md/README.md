# cal2md

Convert iCalendar (.ics) files to Hugo markdown posts.

## Installation

Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

```bash
python cal2md.py --cal_path <path-to-ics> --method <grouping> --output_path <output-dir>
```

### Arguments

- `--cal_path`: Path to your .ics file
- `--method`: How to group events:
  - `single`: One markdown file per event
  - `day`: Group events by day
  - `week`: Group events by week
  - `month`: Group events by month
- `--output_path`: Directory where markdown files will be created

### Examples

Create individual files for each event:
```bash
python cal2md.py --cal_path calendar.ics --method single --output_path output/
```

Group events by month:
```bash
python cal2md.py --cal_path calendar.ics --method month --output_path output/
```

## Output

Each markdown file includes Hugo front matter with date, title, and event details in the body.
