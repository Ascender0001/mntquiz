# Project Description — Location-Based Quiz Web Game

## Overview

A web-based question-and-answer game intended to be run at a specific physical location (for example, a lakeside event). Visitors register with their contact details, answer a set of questions, and — if they pass — have their data stored for follow-up. The game is **geofenced**: only people physically present within a defined radius (roughly a 1 km wide area around the event site) are able to play.

The application includes a **public game front-end** for participants and an **admin panel** for managing questions and reviewing results. Organizers can export the contact data of everyone who passed as a CSV file.

The visual style should follow the look and feel of [mnt.org.rs](https://www.mnt.org.rs) — the official website of the Hungarian National Council (Magyar Nemzeti Tanács) — which is a clean, modern, institutional design with clear typography, a restrained color palette, and multilingual support.

---

## Goals

- Provide an engaging on-site quiz that participants play from their own phones.
- Collect verified contact details from participants who successfully complete the quiz.
- Restrict participation to people who are physically at the event location.
- Give organizers a simple back-office to manage questions and review who passed.
- Produce a clean CSV export of successful participants for follow-up (mailing, prizes, etc.).

---

## Key Features

### 1. Registration Gate
Before the quiz can begin, the participant must provide:
- First name
- Last name
- Email address
- Phone number

The game cannot start until these fields are filled in and validated (valid email format, plausible phone number, no empty fields). This data is tied to the resulting quiz attempt.

### 2. The Quiz
- After registration, the participant is shown a series of questions.
- Questions and their possible answers are managed from the admin panel.
- Each attempt is scored against the correct answers.
- The result is a simple **pass / fail** based on how many answers were correct (the passing threshold should be configurable).

### 3. Conditional Data Storage
- If the participant **passes**, their registration data is stored and marked as a successful attempt.
- If the participant **fails**, the attempt is still recorded as a submission (pass/fail status), but they are not added to the successful contact list. *(Exact handling of failed attempts — whether their contact data is stored or discarded — is an open decision, see "Open Questions".)*

### 4. Geolocation / Range Restriction (core feature)
- The most important feature: the app only allows people **within a defined area** to play — for example, a circle of roughly 1 km diameter centered on the event location.
- On starting, the app requests the user's location (browser geolocation) and checks whether they fall inside the configured radius.
- If they are outside the allowed area, they cannot start the quiz and are shown an explanatory message.
- The center coordinates and radius must be configurable per event from the admin panel, so the same app can be reused at different sites.

### 5. Admin Panel
A protected area for organizers, providing:

**Question management**
- Create, edit, and delete questions and their answer options.
- Mark the correct answer(s).
- Filter and search questions (e.g., by text, category, or status).
- Enable/disable questions so only a chosen subset is active for an event.

**Submissions overview**
- View all submitted quiz attempts.
- For each attempt, show **only the player's registration data and whether they passed or failed** — the actual answers the player gave are **not** shown.
- Filter submissions (e.g., by pass/fail, date, or name).

**Configuration**
- Set the geofence center point and radius.
- Set the passing threshold.

**Export**
- Generate and download a **CSV of all successful participants**, containing their first name, last name, email, and phone number (plus useful metadata such as timestamp).

---

## Participant User Flow

1. Participant opens the web app on their phone at the event.
2. App checks the participant's location.
   - **Outside the area** → blocked with a friendly message.
   - **Inside the area** → continues.
3. Participant fills in the registration form (first name, last name, email, phone).
4. Participant answers the quiz questions.
5. App scores the attempt.
   - **Pass** → participant's data is stored; they see a success screen.
   - **Fail** → attempt recorded as failed; participant sees a fail screen.

---

## Data Model (high level)

- **Question**: text, answer options, correct answer(s), category/tag, active flag.
- **Attempt / Submission**: linked registration data (first name, last name, email, phone), pass/fail result, score, timestamp, (optionally) location captured at start.
- **Event / Config**: geofence center coordinates, radius, passing threshold, active question set.

> Note: The admin submissions view intentionally exposes only registration data + pass/fail — never the individual answers.

---

## CSV Export

- One row per successful participant.
- Suggested columns: `first_name`, `last_name`, `email`, `phone`, `passed_at`.
- Downloadable on demand from the admin panel.
- Encoding should support special characters (UTF-8) for Hungarian/Serbian names.

---

## Design & Style

- Follow the visual language of **mnt.org.rs**: clean and institutional, generous whitespace, clear headings, a calm and professional color palette.
- **Mobile-first**, since participants will play on their phones on-site.
- **Multilingual support** is recommended, matching the reference site (Hungarian / Serbian Latin / Serbian Cyrillic / English), so the interface can be shown in the participant's preferred language.
- Simple, large tap targets for the registration form and answer buttons.

---

## Technical Considerations

- **Geolocation** relies on the browser's location API, which requires the participant to grant permission and to have location services enabled. The app must handle the case where permission is denied or location is unavailable.
- Geofencing based on device GPS is approximate; the radius should allow some tolerance. It deters remote play but is not a hard security boundary.
- **Privacy**: participants are submitting personal contact data. The app should include appropriate consent/notice, and stored data should be handled in line with applicable data-protection rules (e.g., GDPR).
- The admin panel needs authentication and should not be publicly accessible.

---

## Open Questions

- Should failed attempts store the participant's contact data, or only record the pass/fail outcome?
- How many questions per quiz, and what is the passing threshold?
- Are answers single-choice, multiple-choice, or mixed?
- Can a person play more than once (e.g., after failing)? Is there any deduplication by email/phone?
- Should the geofence be a single circle, or configurable to more complex shapes?
- Which languages are required for the interface at launch?
