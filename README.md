# Interview Report — GenAI

[![Repo Size](https://img.shields.io/github/repo-size/harsha5200-d/Interview-report-genai?color=blue)](https://github.com/harsha5200-d/Interview-report-genai)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Built with Node](https://img.shields.io/badge/stack-Node.js-blue.svg)](https://nodejs.org)


A polished, end-to-end Interview Plan generator using AI and resume parsing. Upload a resume (PDF or DOCX) or paste your self-description and a job description — the backend analyzes your profile, the AI crafts a structured interview plan (technical + behavioral questions, skill gaps, preparation plan), and the app renders a printable PDF.

**Why this project**: helps candidates prepare for interviews by turning a job posting + resume into a focused, actionable study plan.

---

**Features**
- **Resume parsing**: PDF extraction using `pdf-parse`.
- **AI analysis**: Google GenAI (Gemini) integrated with server-side schema validation and a deterministic local fallback when quota is unavailable.
- **Persistence**: MongoDB (Mongoose) stores generated interview reports for retrieval.
- **PDF export**: Puppeteer renders an attractive printable interview plan.
- **Auth & UX**: Simple auth flow with React Context; single-page app built with Vite and React Router.

---

**Quick Links**
- Backend entry: `Backend/server.js`
- Report controller: `Backend/src/controller/interview.controller.js`
- AI service: `Backend/src/services/ai.service.js`
- Mongoose model: `Backend/src/models/interviewReport.model.js`
- Frontend root: `Frontend/interview-genai/src/App.jsx`
- Home / uploader UI: `Frontend/interview-genai/src/Features/Interview/pages/Home.jsx`
- Auth hook: `Frontend/interview-genai/src/Features/Auth/hooks/useAuth.js`

---

**Tech Stack**
- Node.js, Express
- MongoDB + Mongoose
- React, Vite, React Router
- pdf-parse, Puppeteer
- Google GenAI client (with local fallback)

---

**Setup (development)**

1. Install dependencies for root, backend, and frontend (run each in their folder if needed):

```bash
# from repo root
npm install
# backend
cd Backend && npm install
# frontend
cd Frontend/interview-genai && npm install
```

2. Environment (example `.env` keys used by the project):

- `MONGO_URI` — MongoDB connection string
- `PORT` — backend port (e.g., 3000)
- `GOOGLE_API_KEY` — optional (Gemini) — if missing, the server uses a local fallback

3. Run the development orchestration from project root:

```bash
npm run dev
```

This script starts the backend first, then launches the frontend dev server.

---

**Usage**
- Open the frontend (Vite dev server) and sign in or register.
- Paste a job description, upload a resume (PDF), or paste a self-description.
- Click `Generate My Interview Strategy` and view or download the generated interview plan PDF.

---

**Design Notes & Caveats**
- The AI integration uses Google GenAI models; you will need an API key and quota for production-quality results. The server includes a deterministic fallback generator for offline or quota-limited runs.
- `pdf-parse` exports can vary between versions; the backend includes robust handling for current module shapes.

---

**Contributing**
- Create a branch with a descriptive name, add tests or verify manually, and open a PR.
- Keep changes small and focused; respect existing file structure.

---

**Beautiful Badge & Demo (optional)**
To add a demo screenshot, place `assets/demo.png` in the repo and insert the markdown:

```md
![Demo](assets/demo.png)
```

---

**License**
This project is provided under the MIT License. See `LICENSE`.

---

If you want, I can also:
- Create a dedicated `README-short.md` for GitHub profile cards,
- Add a contributing guide, or
- Open a PR with this README pushed to your remote (`https://github.com/harsha5200-d/Interview-report-genai.git`).
