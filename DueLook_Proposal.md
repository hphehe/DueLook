# Proposal for Orbital 2026

**Team:**
* Hoang Phuong - A0325491A
* Nguyen Hoang Thai - A0325560J

**Project:** DueLook  
*"Let us look for what's due."*

## Motivation
The transition to Year 1 comes with a severe digital culture shock: the overwhelming flood of the university inbox. New students are suddenly bombarded with an unmanageable volume of emails, causing critical action items to inevitably get buried under the noise. In this daily chaos, the inbox becomes a source of anxiety rather than a tool for productivity. There is a critical need for a zero-configuration workflow engine that inherently understands the structure of a university semester and rescues students from inbox fatigue.

## Aim
DueLook is a web-based productivity tool designed to cure Year 1 inbox overwhelm by transforming a messy university email account into an actionable, automated workflow.

## User Stories
* As a student who wants a visually clean inbox, I want incoming mail to be automatically categorized into broad folders like Academics or CCA.
* As a student who wants to organize my specific classes, I want my Academics folder to automatically split into subfolders for my exact modules (e.g., CS2030S, CS1231S).
* As a student who wants to never miss an assignment, I want an AI to extract hard deadlines and surface them on a live calendar.
* As a user who wants accuracy, I want emails with uncertain dates routed to a "Needs Review" tab so the system doesn't silently guess the wrong deadline.
* As a user who wants a sense of accomplishment, I want completed and missed tasks visually organized into "Done" and "Missed" tabs to track my history.
* As a student who wants to build consistent email habits, I want an Inbox Health Bar that gamifies task completion.

## Features
* **Feature 1 (core): Broad Categorization.** The system automatically categorizes incoming mail into a strictly defined set of student-centric folders (e.g., Academics, Housing, CCA, Internships, Programs, and Others).
* **Feature 2 (core): Five-Tab State Machine UI.** Every processed email is organized into exactly one of five distinct visual states:
    * **Filtered:** The to-do list. Emails with confirmed, upcoming deadlines are displayed.
    * **Needs Review:** The trust mechanism of the app. It isolates emails with ambiguous text or multiple conflicting dates for manual verification. Because the AI is highly optimized to filter out promotional noise (Milestone 3), this tab prevents mistakes by capping manual checks to just 5-6 emails daily, ensuring users' trust.
    * **Done:** The archive for completed tasks.
    * **Missed:** Emails where the extracted deadline has passed without user action.
    * **No Deadline:** General storage for newsletters and emails confirmed to require no action.
* **Feature 3 (core): Inbox Health Bar.** To make email management less boring, a gamified health bar provides real-time feedback, rewarding points for completed tasks and deducting them for missed deadlines.
* **Feature 4 (core): Live Calendar.** Confirmed deadlines are displayed on an interactive calendar, giving students a clear overview of upcoming tasks. In Milestone 2, basic pattern matching extracts explicitly formatted dates (e.g., "due 18/03/2026") to populate the calendar. In Milestone 3, Gemini replaces this with proper natural language understanding, catching dates like "submit before our tutorial next Friday" that pattern matching would miss.
* **Feature 5 (extension): Specific Subfolder Routing.** Within broad categories, emails are further sorted into subfolders. Gemini identifies specific module codes (e.g., CS2030S, CS1231S) and CCA activity names directly from email content, routing them to the correct subfolder automatically.
* **Feature 6 (extension): AI-Powered Categorization & Smart Extraction.** The workflow utilizes Gemini API to simultaneously classify emails and extract exact dates from natural language (e.g., "submit before our tutorial next Friday"). Crucially, the AI employs a "Smart Prompt" to output structured data, explicitly distinguishing between genuine, actionable tasks and promotional noise. This ensures only real deadlines are extracted, even from the generic "Others" folder, drastically reducing hallucinations.
* **Feature 7 (extension): Panic Board.** An adjustable panic window surfaces tasks approaching within a critical timeframe that is customizable.

## Timeline

### Milestone 1 - Technical proof of concept
* Secure data pipeline established using MSAL and Microsoft Graph API connected to a staging account.
* FastAPI backend successfully fetches raw email data and displays it on a simple React frontend.

### Milestone 2 - Prototype
* Broad categorization implemented using rule-based backend sorting. Emails are sorted into top-level folders (Academics, CCA, Internships, etc).
* Basic deadline extraction using pattern matching to populate the calendar with explicitly formatted dates.
* Emails with ambiguous dates are routed to the Needs Review tab.
* Five-tab UI built and functioning (Feature 2).
* PostgreSQL database tracking email states and user HP.
* Basic Inbox Health Bar operational and calendar UI built. (Feature 3 & 4).
* *(Note: The "Needs Review" tab operates on basic logic until Milestone 3)*

### Milestone 3 - Extended system
* Gemini API integrated for AI-powered categorization and deadline extraction, replacing the rule-based classifier. (Feature 6).
* The Five-Tab UI becomes fully AI-driven, accurately filtering low-confidence or promotional emails away from the to-do list.
* Calendar fully populates with AI-extracted deadlines. (Feature 4).
* Module-level subfolders implemented. (Feature 5).
* Configurable panic window fully operational (Feature 7).
* Complete Inbox Health Bar gamification fully operational with all HP rules. (Feature 3 extended).

## Tech Stack
* **Frontend:** React.js (Vercel)
* **Backend:** Python / FastAPI (Render)
* **Database:** PostgreSQL (Render)
* **Auth:** MSAL with OAuth 2.0
* **AI Parsing:** Gemini API

## Qualifications
* **Phuong:** Strong background in competitive programming and proficient in C++, Java, JS, and Python.
* **Thai:** Self-taught developer, has experienced tools like PostgreSQL, React.js, and Git.

## Software Engineering
To ensure a reliable development process, we will implement structured user testing with other students to validate the UI. We will use Pytest for validating backend logic and AI extraction accuracy. We will also utilize a Git branching strategy (Feature / Dev / Main) alongside GitHub Actions to automate test pipelines on every pull request.

The frontend architecture will cleanly map to a state machine design pattern to effectively manage the five email states. The backend is structured into three distinct layers: Controllers handle incoming API requests from the frontend, Services contain the core logic such as email categorization and HP calculations, and Repositories manage all PostgreSQL queries. Finally, the database schema separates user state (HP, panic window settings, etc.) from email state (category, tab, extracted deadline, AI confidence score, etc.) across two core tables.