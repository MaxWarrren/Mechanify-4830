# Mechanify — Mechanic Shop Management Platform

Mechanify is a full-stack web application for managing a mechanic shop. Shop staff can track customers through a CRM pipeline, manage vehicle records, create and monitor repair jobs, and interact with an AI assistant that can reference uploaded PDF manuals to answer technical questions.

---

## Team

| Name | Role |
|---|---|
| Maxwell Warren | Full Stack Developer |

---

## Live Deployment

| Service | URL |
|---|---|
| Frontend (Vercel) | https://mechanify-4830-fp.vercel.app |
| Backend API (Render) | https://mechanify-backend.onrender.com |

> **Note:** The backend runs on Render's free tier and may take 30–60 seconds to wake up after inactivity.

---

## Demo Video

[YouTube Demo — Mechanify](https://www.youtube.com/watch?v=PLACEHOLDER)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 21 (standalone components, signals, zone.js) |
| UI Library | Spartan-ng + Tailwind CSS |
| Backend | Node.js + Express 5, native `http` module |
| Database | MongoDB Atlas + Mongoose |
| AI Chat | Google Gemini (`gemini-3.1-flash-lite-preview`) via `@google/genai` |
| Embeddings | Voyage AI (`voyage-4-lite`, 1024-dim) |
| Vector Search | MongoDB Atlas Vector Search |
| Deployment | Vercel (frontend) + Render (backend) |

---

## Features

- **Customer CRM** — Pipeline stages (Lead → Active → Returning → Inactive), search, revenue tracking
- **Vehicle Management** — Full CRUD with owner lookup, mileage, VIN, and job history
- **Repair Jobs** — Status tracking (Pending / In Progress / Completed), cost estimates
- **AI Chat** — Multi-session chat with memory, PDF knowledge base via RAG, page-level citations, markdown rendering
- **Knowledge Base** — Upload vehicle manuals as PDFs; chunks are embedded and stored for vector search

---

## Local Setup

### Prerequisites

- Node.js 20+
- npm
- MongoDB Atlas account (or local MongoDB)
- Google Gemini API key
- Voyage AI API key

### 1. Clone the repository

```bash
git clone https://github.com/MaxWarrren/Mechanify-4830.git
cd Mechanify-4830
```

### 2. Backend setup

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=3000
MONGO_URI=your_mongodb_atlas_connection_string
GEMINI_API_KEY=your_gemini_api_key
VOYAGE_API_KEY=your_voyage_api_key
```

Start the server:

```bash
node server.js
```

The API will be available at `http://localhost:3000`.

### 3. Seed the database (optional)

```bash
cd server
node seed/seed.js
```

This inserts 3 customers, 3 vehicles, and 3 jobs covering all statuses.

### 4. Frontend setup

```bash
cd client
npm install
ng serve
```

The app will be available at `http://localhost:4200`.

---

## API Routes

All routes are prefixed with `/api/`.

| Method | Route | Description |
|---|---|---|
| GET/POST | `/api/customers` | List all / create customer |
| GET/PUT/DELETE | `/api/customers/:id` | Get / update / delete customer |
| GET/POST | `/api/vehicles` | List all / create vehicle |
| GET/PUT/DELETE | `/api/vehicles/:id` | Get / update / delete vehicle |
| GET/POST | `/api/jobs` | List all / create job |
| GET/PUT/DELETE | `/api/jobs/:id` | Get / update / delete job |
| POST | `/api/chat` | Send message (SSE streaming) |
| GET/POST | `/api/chat/sessions` | List / create chat sessions |
| GET/PATCH/DELETE | `/api/chat/sessions/:id` | Get / update / delete session |
| POST | `/api/knowledge/upload` | Upload PDF manual |
| GET | `/api/knowledge/manuals` | List uploaded manuals |
| DELETE | `/api/knowledge/manuals/:id` | Delete manual |

---

## Project Structure

```
Mechanify-4830/
├── client/                  # Angular 21 frontend
│   └── src/app/
│       ├── core/
│       │   ├── interfaces/  # TypeScript interfaces
│       │   ├── services/    # HTTP services (one per resource)
│       │   └── pipes/       # MarkdownPipe
│       ├── pages/           # Routed page components
│       └── shared/          # Reusable components (nav, sidebar)
└── server/                  # Express backend
    ├── config/              # MongoDB connection
    ├── controllers/         # Business logic
    ├── models/              # Mongoose schemas
    ├── routes/              # Route definitions
    └── seed/                # Database seed script
```

---

*INFOTC 4830 — Web Development II — Spring 2026*
