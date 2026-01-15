// scripts/issue-to-event.js
// Convert a GitHub Issue Form submission into a Hugo event Markdown file.
// - Robust image handling (attribute order independent)
// - Hugo-safe datetime construction
// - Designed for clarity over cleverness

const fs = require("fs");
const path = require("path");

const issueTitle = process.env.ISSUE_TITLE || "";
const body = process.env.ISSUE_BODY || "";
const issueNumber = process.env.ISSUE_NUMBER || "0";

/* ----------------------------
   Helpers
----------------------------- */

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractSection(label) {
  const re = new RegExp(
    `###\\s+${escapeRegExp(label)}\\s*\\n+([\\s\\S]*?)(?=\\n###\\s+|$)`,
    "m"
  );
  const match = body.match(re);
  if (!match) return "";
  return match[1].trim().replace(/\r/g, "");
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/^\[event\]\s*/i, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normaliseImages(text) {
  if (!text) return text;

  return text.replace(/<img[^>]*>/gi, (imgTag) => {
    const srcMatch = imgTag.match(/src="([^"]+)"/i);
    if (!srcMatch) return imgTag;

    const altMatch = imgTag.match(/alt="([^"]*)"/i);
    const alt = altMatch ? altMatch[1] : "Event image";
    const src = srcMatch[1];

    return `![${alt}](${src})`;
  });
}

/* ----------------------------
   Extract fields
----------------------------- */

const eventTitle =
  extractSection("Event title") ||
  issueTitle.replace(/^\[event\]\s*/i, "").trim();

const date = extractSection("Event date");       // YYYY-MM-DD
const start = extractSection("Start time");      // HH:MM (optional)
const end = extractSection("End time");          // HH:MM (optional)
const location = extractSection("Location");
const rawDescription = extractSection("Event description");

/* ----------------------------
   Validate required fields
----------------------------- */

if (!eventTitle) throw new Error("Missing Event title");
if (!date) throw new Error("Missing Event date (YYYY-MM-DD)");
if (!location) throw new Error("Missing Location");
if (!rawDescription) throw new Error("Missing Event description");

/* ----------------------------
   Build datetimes
----------------------------- */

const startTime = start ? start : "10:00";
const dateStart = `${date}T${startTime}:00`;
const dateEnd = end ? `${date}T${end}:00` : "";

/* ----------------------------
   Build content
----------------------------- */

const description = normaliseImages(rawDescription);

const filename =
  `${date}-${slugify(eventTitle) || `issue-${issueNumber}`}.md`;

const outDir = path.join("content", "events");
const outPath = path.join(outDir, filename);

fs.mkdirSync(outDir, { recursive: true });

let frontMatter = `---\n`;
frontMatter += `title: "${eventTitle.replace(/"/g, '\\"')}"\n`;
frontMatter += `date: ${dateStart}\n`;
if (dateEnd) frontMatter += `end: ${dateEnd}\n`;
frontMatter += `location: "${location.replace(/"/g, '\\"')}"\n`;
frontMatter += `tags: ["event-submission"]\n`;
frontMatter += `draft: false\n`;
frontMatter += `---\n`;

const content =
  `${frontMatter}\n` +
  `${description}\n\n` +
  `<!-- Generated from issue #${issueNumber}. Edit as needed before merging. -->\n`;

fs.writeFileSync(outPath, content, "utf8");

console.log(`Event written to ${outPath}`);
