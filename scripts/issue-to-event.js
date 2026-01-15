// scripts/issue-to-event.js
// Convert a GitHub Issue Form submission into a Hugo event Markdown file.
// Robust approach:
// - Extract fields from headings (### Event date, etc.)
// - Title can come from ISSUE_TITLE or "### Event title" (supports both)
// - Description comes from "### Event description"
// - Images are detected anywhere in the issue body and appended if missing
// - Converts <img ...> to Markdown images

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

function extractSection(label, text = body) {
  const re = new RegExp(
    `###\\s+${escapeRegExp(label)}\\s*\\n+([\\s\\S]*?)(?=\\n###\\s+|$)`,
    "m"
  );
  const match = text.match(re);
  if (!match) return "";
  return match[1].replace(/\r/g, "").trim();
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

function imgTagToMarkdown(imgTag) {
  const srcMatch = imgTag.match(/src="([^"]+)"/i);
  if (!srcMatch) return null;

  const altMatch = imgTag.match(/alt="([^"]*)"/i);
  const alt = (altMatch ? altMatch[1] : "Event image").trim() || "Event image";
  const src = srcMatch[1].trim();

  return `![${alt}](${src})`;
}

function extractImagesAnywhere(text) {
  const images = new Set();

  // 1) HTML <img ...>
  const imgTags = text.match(/<img[^>]*>/gi) || [];
  for (const tag of imgTags) {
    const md = imgTagToMarkdown(tag);
    if (md) images.add(md);
  }

  // 2) Markdown images ![alt](url)
  const mdImgRe = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let m;
  while ((m = mdImgRe.exec(text)) !== null) {
    const alt = (m[1] || "Event image").trim() || "Event image";
    const url = (m[2] || "").trim();
    if (url) images.add(`![${alt}](${url})`);
  }

  return Array.from(images);
}

function ensureImagesInDescription(descriptionText, allBodyText) {
  const descHasImg =
    /<img\b/i.test(descriptionText) || /!\[[^\]]*\]\([^)]+\)/.test(descriptionText);

  // Normalise any <img> tags *within* the description itself
  let desc = descriptionText.replace(/<img[^>]*>/gi, (tag) => {
    const md = imgTagToMarkdown(tag);
    return md ? md : tag;
  });

  if (!descHasImg) {
    // If description didn’t include images, append any images found elsewhere in the body
    const imgs = extractImagesAnywhere(allBodyText);
    if (imgs.length) {
      desc = `${desc}\n\n${imgs.join("\n\n")}`;
    }
  }

  return desc.trim();
}

function extractCheckedTags(label) {
  const section = extractSection(label);
  if (!section) return [];

  return section
    .split("\n")
    .map(line => line.trim())
    .filter(line => /^\- \[x\]\s+/i.test(line))
    .map(line =>
      line
        .replace(/^\- \[x\]\s+/i, "")
        .toLowerCase()
        .replace(/\s+/g, "-")
    );
}


/* ----------------------------
   Extract fields
----------------------------- */

// Support BOTH patterns:
// - Issue Forms where title is in ISSUE_TITLE only
// - Issue Forms where a "### Event title" field is present
const eventTitle = issueTitle.trim();


const date = extractSection("Event date");        // YYYY-MM-DD
const start = extractSection("Start time");       // HH:MM (optional)
const end = extractSection("End time");           // HH:MM (optional)
const location = extractSection("Location");
const rawDescription = extractSection("Event description");

/* ----------------------------
   Validate required fields
----------------------------- */

if (!eventTitle) throw new Error("Missing event title");
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

const description = ensureImagesInDescription(rawDescription, body);

const filename = `${date}-${slugify(eventTitle) || `issue-${issueNumber}`}.md`;
const outDir = path.join("content", "events");
const outPath = path.join(outDir, filename);

fs.mkdirSync(outDir, { recursive: true });

const tagsFromIssue = extractCheckedTags("Event tags");
const finalTags = tagsFromIssue.length
  ? tagsFromIssue
  : ["event-submission"];


let frontMatter = `---\n`;
frontMatter += `title: "${eventTitle.replace(/"/g, '\\"')}"\n`;
frontMatter += `date: ${dateStart}\n`;
if (dateEnd) frontMatter += `end: ${dateEnd}\n`;
frontMatter += `location: "${location.replace(/"/g, '\\"')}"\n`;
frontMatter += `tags: [${finalTags.map(t => `"${t}"`).join(", ")}]\n`;
frontMatter += `draft: false\n`;
frontMatter += `---\n`;

const content =
  `${frontMatter}\n` +
  `${description}\n\n` +
  `<!-- Generated from issue #${issueNumber}. Edit as needed before merging. -->\n`;

fs.writeFileSync(outPath, content, "utf8");





console.log(`Event written to ${outPath}`);
