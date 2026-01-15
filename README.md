# Todmorden Events (Hugo)

This repository contains a simple events website built with **Hugo**.
It is designed to list upcoming community events in **date order**, in a way that feels more like a **calendar or schedule** than a blog.

This README explains:
- how the project is set up
- how events are added
- how events are ordered by date
- how we started exploring GitHub Issues as an “event submission form”

It is written for people who are **new to Hugo**.

Here are some notes from our meeting on 12th Jan 2026 - 
http://pad.riseup.net/p/tod-events-keep

---

## 1. What this project is (and isn’t)

This site uses Hugo as a **static site generator**.

- There is no database
- There is no backend
- All events are written as Markdown files
- Hugo turns those files into HTML at build time

This makes it:
- cheap to host (GitHub Pages)
- easy to version control
- resistant to spam and form abuse

---

## 2. Project setup

### Requirements

You need:
- Hugo (extended version recommended)
- Git
- A GitHub account (for Pages and Issues)

Install Hugo:
https://gohugo.io/installation/

Check it works:

    hugo version

---

## 3. Creating the Hugo site

The site was created with:

    hugo new site tod-events
    cd tod-events

This creates the basic Hugo directory structure:

    content/
    layouts/
    static/
    themes/
    hugo.toml

---

## 4. Adding the Stack theme

The site uses the **Stack theme** as a starting point.

Theme repository:
https://github.com/CaiJimmy/hugo-theme-stack

Add it as a submodule:

    git submodule add https://github.com/CaiJimmy/hugo-theme-stack themes/stack

Enable it in `hugo.toml`:

    theme = "stack"

Theme documentation:
https://stack.jimmycai.com/

---

## 5. Creating the events section

Hugo treats folders under `content/` as **sections**.

We created:

    content/events/

And an index file:

    content/events/_index.md

Example `_index.md`:

    ---
    title: "Events"
    description: "Upcoming workshops, drop-ins, and community events"
    ---

This controls how `/events/` is rendered.

---

## 6. Adding events (Markdown files)

Each event is a Markdown file inside `content/events/`.

Example:

    ---
    title: "Family Coding Club"
    date: 2026-02-21T10:30:00
    end: 2026-02-21T12:00:00
    location: "Todmorden Library"
    tags: ["coding", "family"]
    draft: false
    ---

    An informal drop-in coding session for children and families.
    No prior experience needed.

### Important conventions

- Use full ISO datetimes
- Use `date` as the start time
- Use `end` as a full datetime
- Avoid separate `start` fields

This keeps sorting reliable.

---

## 7. Making events behave like a calendar

By default, Hugo treats content like blog posts.
We override that behaviour.

### Filtering to future events

In the page template:

    {{ $now := now }}
    {{ $events := where site.RegularPages "Section" "events" }}
    {{ $events = where $events "Date" "ge" $now }}

This hides past events automatically.

---

### Ordering by date

After filtering, we explicitly order:

    {{ $events = $events.ByDate }}

This ensures:
- earliest upcoming event appears first
- ordering stays correct as events are added

---

### Grouping by day

To create a schedule-style view:

    {{ $grouped := $events.GroupByDate "2006-01-02" "asc" }}

Note:
- Hugo groups descending by default
- "asc" is required for calendar-style ordering

---

## 8. Using partials to keep things simple

Event rendering lives in a partial:

    {{ partial "events-list.html" (dict "Events" $events) }}

Key rule:
- The partial expects `.Events`
- Filtering and ordering happen before the partial is called

This avoids Hugo scoping issues.

---

## 9. Homepage vs events page

During development, the homepage mirrors the events list.

Longer term:
- `/events/` = full calendar
- `/` = preview of upcoming events

This keeps responsibilities clear.

---

## 10. GitHub Issues as an event submission form (experimental)

Instead of a web form, we are exploring **GitHub Issues** as input.

Why:
- No spam
- Built-in moderation
- Works well with GitHub Pages
- Everything stays in version control

The idea:
- Create an Issue template for events
- Users fill it in like a form
- Approved issues are converted into Markdown files

GitHub Issue templates:
https://docs.github.com/en/issues/tracking-your-work-with-issues/creating-issues/creating-issue-templates-for-your-repository

---

## 11. Useful Hugo documentation

Hugo getting started:
https://gohugo.io/getting-started/

Content organisation:
https://gohugo.io/content-management/organization/

Page variables:
https://gohugo.io/variables/page/

Templates and functions:
https://gohugo.io/templates/

Dates and time formatting:
https://gohugo.io/functions/time/

---

## 12. Why this approach

This setup aims to be:
- understandable by non-specialists
- easy to maintain
- transparent
- cheap to host
- flexible enough to grow

The guiding principle is **clarity over cleverness**.

---

## 13. Next steps

Planned improvements include:
- visual refinement of the schedule
- iCal export
- formalising the GitHub Issue → event workflow
- simple guides for non-technical contributors
