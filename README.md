# Todmorden Events (Hugo)

This repository contains a simple events website built with **Hugo**.  
It is designed to list upcoming community events in **date order**, in a way that feels more like a **calendar or schedule** than a blog.

This README explains:
- how the project is set up
- how events are added
- how events are ordered by date
- how we started exploring GitHub Issues as an “event submission form”

It is written for people who are **new to Hugo**.

---

## 1. What this project is (and isn’t)

This site uses Hugo as a **static site generator**.

- There is **no database**
- There is **no backend**
- All events are written as **Markdown files**
- Hugo turns those files into HTML at build time

This makes it:
- cheap to host (GitHub Pages)
- easy to version control
- resistant to spam and form abuse

---

## 2. Project setup

### Requirements

You need:
- Hugo (extended version)
- Git
- A GitHub account (for Pages + Issues)

Install Hugo:
https://gohugo.io/installation/

Check it works:
```bash
hugo version
