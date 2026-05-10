# AGENTS.md — Mechanify
> Web Development II Final Project | Angular + Express + MongoDB | 250 pts total

---

## What This App Is

Mechanify is a mechanic shop management and customer-facing AI assistant platform. Customers can ask questions about their vehicle and repair history, while shop staff manage jobs, vehicles, and customers. The AI layer uses Google Gemini Embedding 2 (text-embedding-004) for document/PDF processing and Gemini 1.5 Flash Lite as the conversational chat model.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular (latest stable) |
| Backend | Node.js + Express, started via native `http` server in `server.js` |
| Database | MongoDB + Mongoose |
| AI | Google Gemini Embedding 2 + Gemini 1.5 Flash Lite via `@google/generative-ai` SDK |
| Deployment | Frontend → Vercel, Backend → Railway or Render |

---

## Project Structure

The project is split into two top-level directories: `client/` for the Angular frontend and `server/` for the Express backend.

The client follows standard Angular structure with a `core/` folder containing all services and interfaces, a `pages/` folder for routed views, and a `shared/` folder for reusable components.

The server follows strict MVC separation with dedicated `models/`, `controllers/`, and `routes/` folders, plus a `config/` folder for database connection and a `seed/` folder for the seed script. The entry point is `server.js`, which wraps Express using the native Node `http` module.

---

## Data Models

There are three Mongoose models: **Customer**, **Vehicle**, and **Job**.

- A Customer has a name, email, and phone number.
- A Vehicle belongs to a Customer and has make, model, year, VIN, and mileage.
- A Job belongs to a Vehicle and has a description, status (pending / in-progress / completed), estimated cost, and optional actual cost.

All three models require schema-level validation. Vehicle and Job reference their parent documents using ObjectId refs to support population.

---

## API Routes

All routes are prefixed with `/api/`. Full CRUD is required on all three core resources. The chat endpoint accepts a message and optional vehicleId, queries the relevant vehicle and job data from the database to build context, then sends the composed prompt to Gemini Flash Lite and returns the response.

- `/api/customers` — full CRUD
- `/api/vehicles` — full CRUD
- `/api/jobs` — full CRUD
- `/api/chat` — POST only, handles AI chat requests

---

## Angular Frontend Requirements

**Routing** — The app uses Angular Router with at least five distinct routes: a home/dashboard, vehicle list, vehicle detail, jobs list, customers list, and the AI chat interface. A wildcard 404 route should also be included.

**Services** — Every HTTP call must go through an Angular service using HttpClient and Observables with `.subscribe()`. There should be one service per resource: VehicleService, JobService, CustomerService, and ChatService. Direct fetch or http calls from components are not acceptable.

**Interfaces** — Every data model must have a corresponding TypeScript interface stored in `core/interfaces/`. No use of `any` types.

**Forms** — At least one form must use two-way data binding via `[(ngModel)]`. Reactive Forms with FormBuilder is preferred for create/edit flows. All forms must be functional and trigger service calls on submit with basic field validation.

**UI** — The interface should be clean, readable, and responsive. Use Angular Material or a CSS framework. Include loading states while data is fetching and empty states when lists have no results.

---

## Backend Requirements

**server.js** — The entry point must use the native Node `http` module to create the server rather than calling `app.listen()` directly. It must include port normalization logic and error/listening event handlers.

**Routing** — All routes must be defined in separate files within the `routes/` folder and imported into `app.js`. Routes cannot be defined inline in `server.js` or directly in `app.js`.

**MVC Structure** — Models contain only Mongoose schemas. Controllers contain all business logic and database calls. Routes import controllers and map HTTP methods to controller functions. No business logic or DB calls belong in route files or `server.js`.

**REST API** — All endpoints must return JSON, use correct HTTP status codes (200 for success, 201 for created, 204 for delete, 400 for bad input, 404 for not found, 500 for server errors), and support full CRUD on all three resources.

---

## AI Chat Integration

The chat feature is a RAG-lite system. When a user sends a message with an optional vehicleId, the backend queries MongoDB for that vehicle's details and service history, builds a context string, and injects it into the prompt sent to Gemini 1.5 Flash Lite. The model responds as Mechanify Assistant, an expert automotive advisor. The Angular ChatService calls `POST /api/chat` and displays the streamed reply in the chat UI.

Environment variables required in `server/.env`: `MONGO_URI`, `GEMINI_API_KEY`, `PORT`.

---

## Seed Data

A standalone seed script must exist at `server/seed/seed.js` and be runnable with `node seed/seed.js`. It should clear existing data and insert at least three customers, three vehicles, and three jobs covering each status (pending, in-progress, completed).

---

## Deployment

The frontend is deployed to Vercel with the build output pointing to `dist/client/browser` and the `environment.apiUrl` set to the live backend URL. The backend is deployed to Railway or Render with `node server.js` as the start command and environment variables set for `MONGO_URI`, `GEMINI_API_KEY`, and `PORT`. CORS must be configured in `app.js` to accept requests from the frontend origin.

---

## Documentation & Presentation

**README.md** must include a project description, team member names with their roles, local setup instructions for both client and server, links to the live deployed frontend and backend, and a link to the YouTube demo video.

**YouTube video** must have all team members presenting their portion of the work on camera. A slide deck must be submitted alongside the video.

---

## Critical Rules — Do Not Violate

- Remove `node_modules` from both `client/` and `server/` before submitting — failure results in a **-10 pt penalty**
- `server.js` must use `http.createServer(app)`, not just `app.listen()`
- Routes must be imported from `routes/` files into `app.js` — not defined inline
- All Angular API calls must go through services, never directly from components
- TypeScript interfaces are required for every model — no raw objects or `any` types
- At least two Mongoose models must have schema-level validation
- Every team member must appear and present in the video — 10 pts at stake
- README must include deployment URLs and video link before submission

---

## Suggested Build Order

1. Set up MongoDB Atlas and get the connection string
2. Scaffold `server/` with `server.js`, `app.js`, and `config/db.js`
3. Build all three Mongoose models with validation
4. Build controllers and routes for all three resources with full CRUD
5. Write and run the seed script, verify data in Atlas
6. Test all API endpoints with Postman or Thunder Client
7. Scaffold the Angular project with `ng new client`
8. Create all interfaces, services, routes, and page components
9. Wire up all forms and CRUD views to the backend services
10. Build the chat page and connect to `/api/chat` with Gemini integration
11. Deploy the backend and capture the live URL
12. Update `environment.ts` with the backend URL and deploy the frontend
13. Record the YouTube video with all team members
14. Finalize the README with all links and submit

---

*Web Development II — Spring 2026*