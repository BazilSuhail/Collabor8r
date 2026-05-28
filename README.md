<div align="center">

<img src="public/collabor8r.webp" alt="Collabor8r logo" width="140" />

# Collabor8r

**v2.0**

*One workspace for everything your team builds, ships and supports.*

![Version](https://img.shields.io/badge/version-2.0-6C5CE7?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)
![React](https://img.shields.io/badge/React-19.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8.3.5-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3.3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

</div>

---

## Overview

Collabor8r is a Jira-style work management suite. It covers multi-organization workspaces, issues, kanban boards, backlogs and sprints, configurable workflows, goals, releases, risks, budgets, timesheets, reports and dashboards, automation, forms, a service desk, a wiki, test management and an AI assistant (Jerry), plus integrations and webhooks.

This repository is the **React web client**. It talks to the [Collabor8r-Server](https://github.com/BazilSuhail) (Express + MongoDB API). A companion mobile app, **Collabora8r-Mobile-App** (Expo), uses the same backend.

## What it is about, and why it is better

Most teams end up stitching together a tracker, a wiki, a help desk, a form tool, a time tracker and an automation service. Each one has its own login, permissions and data, and the pieces rarely agree with each other.

Collabor8r puts all of that behind one login, one permission model and one data model:

- **Versus Jira:** the same depth (workflows, custom fields, roles, sprints, releases, audit logs) without the add-on marketplace. Wiki, service desk, forms, test management, budget and timesheets are built in rather than separate paid apps.
- **Versus Trello:** boards are only one view. You also get a real backlog, sprints, custom workflows, reports and per-project roles.
- **Versus Asana and ClickUp:** goals, risks, budgets and releases link to actual issues. Nothing lives in a parallel silo.
- **Versus Linear:** the same fast, keyboard-friendly feel, plus the broader scope that larger teams need, such as service desk, test runs, wiki and automation.
- **AI included:** Jerry, the in-app assistant, drafts and helps in context, with a usage meter so the cost stays visible.

Because everything is one product, a customer request from the service desk can become an issue, be worked on a board, be tracked in a release, be covered by a test case, be documented in the wiki and be reported on in a dashboard, all without leaving the app or syncing between tools.

## Tech stack

| Layer | Technology |
| --- | --- |
| UI library | ![React](https://img.shields.io/badge/React-19.3.1-61DAFB?logo=react&logoColor=black) ![React DOM](https://img.shields.io/badge/React_DOM-19.3.1-61DAFB?logo=react&logoColor=black) |
| Routing | ![React Router](https://img.shields.io/badge/React_Router-7.18.5-CA4245?logo=reactrouter&logoColor=white) |
| Build tooling | ![Vite](https://img.shields.io/badge/Vite-8.3.5-646CFF?logo=vite&logoColor=white) ![Plugin React](https://img.shields.io/badge/@vitejs/plugin--react-6.1.2-646CFF?logo=vite&logoColor=white) |
| Styling | ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3.3-06B6D4?logo=tailwindcss&logoColor=white) ![Tailwind Vite](https://img.shields.io/badge/@tailwindcss/vite-4.3.3-06B6D4?logo=tailwindcss&logoColor=white) |
| HTTP client | ![Axios](https://img.shields.io/badge/Axios-1.12.2-5A29E4?logo=axios&logoColor=white) |
| Animation | ![GSAP](https://img.shields.io/badge/GSAP-3.15.0-88CE02?logo=greensock&logoColor=black) |
| Icons | ![React Icons](https://img.shields.io/badge/React_Icons-5.7.0-E91E63) |
| Linting | ![Oxlint](https://img.shields.io/badge/Oxlint-%5E1.92.0-FF7043) |
| Backend API | Collabor8r-Server (Express, MongoDB) |
| Mobile | Collabora8r-Mobile-App (Expo) |

## Features

**Work tracking**
- Issues with a list view, detail page, labels and custom fields
- Kanban boards, plus a board hub across projects
- Backlog and sprint planning
- Configurable workflows with a visual workflow editor
- My work: a personal view of everything assigned to you
- Calendar view

**Planning and delivery**
- Goals
- Releases
- Risk register
- Budget tracking
- Timesheets

**Insight**
- Project reports
- Custom dashboards, plus a personal home dashboard
- Notifications with per-user preferences
- Activity feeds and audit logs at project and organization level

**Knowledge and support**
- Wiki with a Markdown editor, spaces and page history
- Service desk with a request queue, SLA countdowns and desk settings
- Forms with a builder and public form pages
- Test management with test cases and test runs
- Translation (CAT) workspace

**Automation and integrations**
- Automation rules with a rule editor
- Integrations and webhooks

**AI**
- Jerry assistant panel and AI drafts, with a usage meter

**Teams and administration**
- Multiple organizations, member management and invitations (org and project)
- Project roles and role-based access (viewer, admin, lead and more)
- Account security: password change, active sessions and API tokens
- Profile, appearance and theme settings
- Global finder and in-app help
- Responsive layout with a bottom tab bar on small screens

## Functionalities: what is used, and why

| Concern | Technology | What it does and why it is better |
| --- | --- | --- |
| Rendering | React 19 | Component model for a large, many-screen app. The latest runtime keeps updates fast. |
| Navigation | React Router 7 | Nested layouts with route guards (`RequireAuth`, `RequireProject`) so access is enforced per page. |
| Dev and build | Vite 8 | Near-instant dev server and quick production builds. |
| Styling | Tailwind CSS 4 via `@tailwindcss/vite` | Utility-first styling with no separate config step. Themes and dark or light appearance stay consistent. |
| Data access | Axios with token store and refresh logic | Central client that attaches tokens and refreshes sessions, so users are not logged out mid-task. |
| State | React Context (auth, org, project, shell, toast) | Lightweight, dependency-free shared state. Custom hooks (`useResource`, `useMutation`, `usePaged`) handle loading, mutation and pagination uniformly. |
| Permissions | Role helpers in `utils/permissions.js` | Navigation and actions are shown only when the user's project role allows them. |
| Motion | GSAP | Smooth, controlled transitions for boards and panels. |
| Icons | React Icons | Large icon set with tree-shaking, so the bundle stays lean. |
| Code quality | Oxlint | Very fast linting. |

## Comparison

| Capability | Collabor8r v2.0 | Collabor8r v1 | Jira | Trello | Asana | ClickUp | Linear |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Multi-org workspaces | Yes | Limited | Yes | Yes | Yes | Yes | Yes |
| Issues and kanban | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Backlog and sprints | Yes | Basic | Yes | Add-on | Limited | Yes | Yes |
| Custom workflows and fields | Yes | No | Yes | Limited | Limited | Yes | Limited |
| Built-in wiki | Yes | No | Separate product | No | No | Yes | No |
| Built-in service desk | Yes | No | Separate product | No | No | Limited | No |
| Forms | Yes | No | Add-on | Add-on | Yes | Yes | No |
| Test management | Yes | No | Add-on | No | No | Limited | No |
| Goals, risks, budget | Yes | No | Add-on | No | Goals only | Yes | Limited |
| Timesheets | Yes | No | Add-on | Add-on | Add-on | Yes | No |
| Automation and webhooks | Yes | No | Yes | Yes | Yes | Yes | Yes |
| Built-in AI assistant | Yes | No | Paid tier | Paid tier | Paid tier | Paid add-on | Limited |
| Audit logs | Yes | No | Paid tier | Paid tier | Paid tier | Paid tier | Paid tier |
| Mobile app | Yes (Expo) | No | Yes | Yes | Yes | Yes | Yes |
| Open source | Yes (MIT) | Yes | No | No | No | No | No |

The competitor columns are a general summary and vary by plan and by version. Check each vendor for current details.

## Getting started

```bash
bun install      # or npm install
bun run dev      # start the Vite dev server
bun run build    # production build
bun run preview  # preview the build
```

The client needs the Collabor8r-Server API to be running and reachable.

## License

Released under the [MIT License](LICENSE). Copyright (c) 2026 BazilSuhail.

## About the author

Built by **BazilSuhail**.

[![GitHub](https://img.shields.io/badge/GitHub-BazilSuhail-181717?style=for-the-badge&logo=github)](https://github.com/BazilSuhail)
