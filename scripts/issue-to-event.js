// scripts/issue-to-event.js
// Turns a GitHub Issue Form submission into a Hugo event markdown file.

const fs = require("fs");
const path = require("path");

const issueTitle = process.env.ISSUE_TITLE || "";
const body = process.env.ISSUE_BODY || "";
const issueNumber = process.env.ISSUE_NUMBER || "0";

function extractSection(label) {
  // Matches GitHub Issue Form output like:
  // ### Event title
  // Family Coding Club
  const re = new RegExp(`###\\s+${escapeRegExp(label)}\\s*\\n+([\\s\\S]*?)(?=\\n###\\s+|$)`, "m");
  const m = body.match(re);
  if (!m) return "";
  return m[1].trim().replace(/\r/g, "");
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/^\[event\]\s*/i, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Pull values using the *labels* shown in your Issue Form
const eventTitle = extractSection("Event title") || issueTitle.replace(/^\[Event\]\s*/i, "").trim();
const date = extractSection("Event date");     // expects YYYY-MM-DD
const start = extractSection("Start time");    // expects HH:MM (optional)
const end = extractSection("End time");        // expects HH:MM (optional)
const location = extractSection("Location");
const description = extractSection("Event description");

// Basic validation (fail fast so you notice)
if (!eventTitle) throw new Error("Missing Event title");
if (!date) throw new Error("Missing Event date (YYYY-MM-DD)");
if (!location) throw new Error("Missing Location");
if (!description) throw new Error("Missing Event description");

// Build ISO datetimes.
// We treat `date` as the day, and combine with start/end times.
// If start is missing, default to 10:00 to avoid invalid Hugo ordering.
const startTime = start ? start : "10:00";
const dateStart = `${date}T${startTime}:00`;

// If end time is missing, omit `end` completely.
const dateEnd = end ? `${date}T${end}:00` : "";

// Filename: YYYY-MM-DD-slug.md
const filename = `${date}-${slugify(eventTitle) || `issue-${issueNumber}`}.md`;
const outDir = path.join("content", "events");
const outPath = path.join(outDir, filename);

// Ensure directory exists
fs.mkdirSync(outDir, { recursive: true });

// Front matter (YAML)
let frontMatter = `---\n`;
frontMatter += `title: "${eventTitle.replace(/"/g, '\\"')}"\n`;
frontMatter += `date: ${dateStart}\n`;
if (dateEnd) frontMatter += `end: ${dateEnd}\n`;
frontMatter += `location: "${location.replace(/"/g, '\\"')}"\n`;
frontMatter += `tags: ["event-submission"]\n`;
frontMatter += `draft: false\n`;
frontMatter += `---\n`;

const content = `${frontMatter}${description.trim()}\n\n` +
  `<!-- Generated from issue #${issueNumber}. Edit as needed before merging. -->\n`;

fs.writeFileSync(outPath, content, "utf8");

console.log(`Wrote ${outPath}`);
