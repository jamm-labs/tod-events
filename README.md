# Todmorden Events (Hugo)

This repository contains a simple events website built with **Hugo**.  
It is designed to list upcoming community events in **date order**, in a way that feels more like a **calendar or schedule** than a blog.

This README explains:

- how to clone and run the site locally
- how the project is set up
- how events are added
- how events are ordered by date
- how we started exploring GitHub Issues as an “event submission form”

It is written for people who are **new to Hugo**.

Here are some notes from our meeting on 12 January 2026:  
http://pad.riseup.net/p/tod-events-keep

---

## 1. What this project is

This site uses Hugo as a **static site generator**.

- There is no database
- There is no backend
- All events are written as Markdown files
- Hugo turns those files into HTML at build time

This makes it:

- cheap to host, for example on GitHub Pages
- easy to version control
- resistant to spam and form abuse

---

## 2. Getting the project running locally

### Requirements

You will need:

- Git
- Hugo
- a GitHub account if you want to use GitHub Pages or GitHub Issues

Because this site uses the **Stack** theme, you will probably need **Hugo Extended**, not just the standard Hugo binary. The Extended version is needed for themes that compile SCSS.

Install Hugo here:  
https://gohugo.io/installation/

Check your Hugo version:

    hugo version

If Hugo Extended is installed, the version output normally includes `extended`.

#### Using more than one Hugo version

One practical approach is to keep more than one Hugo binary installed on your machine and give each one a different name, for example `hugo0138` or `hugo0800`. That way you can run the version that best matches the project instead of constantly uninstalling and reinstalling Hugo.

For example, after installing a Hugo binary, you might rename it:

    sudo mv /usr/local/bin/hugo /usr/local/bin/hugo0138

Then check it:

    hugo0138 version

And run the project with that specific version:

    hugo0138 server --buildFuture

If you keep multiple versions installed, it becomes much easier to test older and newer Hugo releases against the same site.

For this repository, that can be useful if:

- one contributor already has a different Hugo version installed
- the Stack theme behaves differently across versions
- you want to avoid breaking other Hugo projects on your machine

---

### Clone the repository

Clone the repo in the usual way:

    git clone <REPO-URL>
    cd tod-events

---

### Initialise and update the theme submodule

This project uses a Git submodule for the theme, so after cloning you should run:

    git submodule init
    git submodule update

A one-line alternative is:

    git submodule update --init --recursive

If you skip this step, the theme files may be missing and the site may not build properly.

---

### Run the local development server

To view future-dated events during development, run:

    hugo server --buildFuture

Then open the local address Hugo gives you, usually something like:

    http://localhost:1313/

---

## 3. Project structure

A simplified structure looks like this:

    content/
      events/
        _index.md
        2026-02-21-family-coding-club.md

    layouts/
      index.html
      _default/
      partials/

    themes/
      stack/

Events live in `content/events/`.

Templates and custom layout logic live in `layouts/`.

The site theme is included as a Git submodule in `themes/stack/`.

---

## 4. Creating the events section

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

## 5. Adding events

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

This keeps sorting reliable and makes date-based filtering easier.

---

## 6. Making events behave like a calendar

By default, Hugo treats content more like blog posts.  
We override that behaviour so events behave more like a schedule.

### Filtering to future events

In the page template:

    {{ $now := now }}
    {{ $events := where site.RegularPages "Section" "events" }}
    {{ $events = where $events "Date" "ge" $now }}

This hides past events automatically.

### Ordering by date

After filtering, we explicitly order the results:

    {{ $events = $events.ByDate }}

This ensures:

- the earliest upcoming event appears first
- ordering stays correct as new events are added

### Grouping by day

To create a schedule-style view:

    {{ $grouped := $events.GroupByDate "2006-01-02" "asc" }}

Note:

- Hugo groups in descending order by default
- `"asc"` is needed for calendar-style ordering

---

## 7. Using partials to keep things simple

Event rendering lives in a partial:

    {{ partial "events-list.html" (dict "Events" $events) }}

Key rule:

- the partial expects `.Events`
- filtering and ordering happen before the partial is called

This keeps the partial simple and avoids Hugo scoping problems.

---

## 8. Homepage vs events page

During development, the homepage mirrors the events list.

Longer term, the plan is:

- `/events/` = full calendar or full event archive
- `/` = preview of upcoming events

This keeps responsibilities clearer.

---

## 9. GitHub Issues as an event submission form (experimental)

Instead of using a normal web form, we are exploring **GitHub Issues** as a way to collect event submissions.

Why this is appealing:

- no spam form handling
- built-in moderation
- works well with GitHub Pages
- everything stays in version control

The basic idea is:

- create an Issue template for events
- users fill it in like a form
- approved issues are turned into Markdown event files

GitHub Issue templates:  
https://docs.github.com/en/issues/tracking-your-work-with-issues/creating-issues/creating-issue-templates-for-your-repository

---

## 10. Useful Hugo documentation

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

## 11. Why this approach

This setup aims to be:

- understandable by non-specialists
- easy to maintain
- transparent
- cheap to host
- flexible enough to grow

The guiding principle is **clarity over cleverness**.

---

## 12. Next steps

Planned improvements include:

- visual refinement of the schedule
- iCal export
- formalising the GitHub Issue to event workflow
- simple guides for non-technical contributors
