# 🚀 HireZone — Full-Stack AI-Powered Recruitment & Career Platform

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-5.2-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-4285F4?logo=google-gemini&logoColor=white)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**HireZone** is an end-to-end, two-sided recruitment and talent management platform that streamlines interactions between candidates (students/job seekers) and hiring teams. Built with the **MERN** stack, HireZone elevates the hiring experience with **Google Gemini AI ATS resume screening**, an **interactive Kanban pipeline**, **room-isolated real-time messaging via Socket.io**, **Google OAuth 2.0**, automated **transactional email notifications**, and **defensive enterprise-grade security**.

---

## 🌐 Live Application & Infrastructure

| Service | Platform | Link |
| :--- | :--- | :--- |
| **Frontend Web App** | Vercel (CI/CD) | [hire-zone-eight.vercel.app](https://hire-zone-eight.vercel.app) |
| **Backend REST & WebSocket** | Render | Deployed Web Service |
| **Database** | MongoDB Atlas | Cloud Multi-Region Cluster |

---

## ✨ Key Highlights & Core Features

### 🤖 1. AI-Powered ATS Resume Screening & Scoring
* **PDF Resume Extraction:** Ingests candidate resumes using `multer` and extracts raw content via `pdf-parse`.
* **Gemini AI Evaluation:** Integrates `@google/genai` (powered by `gemini-2.5-flash` with fallback to `gemini-2.0-flash`) using structured JSON schemas to compute:
  * **Match Score (0–100):** Comprehensive alignment score between candidate profile/resume and job requirements.
  * **Key Strengths:** Bulleted highlights of candidate qualifications.
  * **Missing Skills:** Critical requirement gaps identified for recruiter awareness.
  * **AI Summary:** 2-sentence executive hiring recommendation.
* **Deterministic Fallback Engine:** Built-in keyword and skill-corpus matching engine guarantees continuous uptime even if API quotas or network timeouts occur.

### 📋 2. Interactive Recruiter Kanban Pipeline
* **Drag-and-Drop Workflow:** Recruiters can drag candidate application cards smoothly across stages:
  $$\text{Pending} \longrightarrow \text{Reviewed} \longrightarrow \text{Shortlisted} \longrightarrow \text{Hired} \lor \text{Rejected}$$
* **Multiple Views:** Toggle seamlessly between visual **Kanban Board** and tabular **List View**.
* **AI Score Ranking:** Instantly sort applicants by descending Gemini ATS match score to focus on top talent.
* **Inline AI Insights:** Expandable cards reveal strengths, missing qualifications, and summary without leaving the pipeline.
* **Direct Actions:** Update application statuses, review attached PDF resumes, and launch instant candidate chat.

### 🎯 3. Smart Job Recommendations
* **Skill-Overlap Matching:** Algorithm compares candidate profile skills with active job requirements.
* **Weighted Scoring:** Evaluates exact and fuzzy keyword overlap with bonus weighting for job-title alignment.
* **Personalized Feeds:** Surfaces relevant job opportunities tailored to each student on their home and dashboard feeds.

### 💬 4. Room-Isolated Real-Time Messaging (Socket.io)
* **Bidirectional Communication:** Instant real-time messaging between candidates and recruiters without polling or manual refreshes.
* **Application Room Isolation:** Chats are partitioned into distinct, authenticated socket rooms mapped directly to application IDs.
* **Live Notifications & Unread Counters:** Real-time personal socket rooms broadcast new message pings, updating unread badges and red-dot indicators on navigation bars instantly.
* **Persistent History:** Full chat transcripts are stored in MongoDB and served via REST API upon joining.

### 🔐 5. Dual-Role RBAC & Defensive Security Architecture
* **Flexible Authentication:** Sign up/in via email & password (hashed with `bcryptjs`) or one-click **Google OAuth 2.0** (`@react-oauth/google` and `google-auth-library`).
* **Role-Based Access Control (RBAC):** Strict segregation between `Student` / `Candidate` and `Recruiter` roles with dedicated views and middleware checks.
* **Cryptographic JWTs:** Stateless authentication powered by signed JSON Web Tokens.
* **HTTP Hardening:** Protected with `helmet` for secure HTTP headers.
* **Brute-Force Rate Limiting:** Enforces strict request throttles on authentication endpoints via `express-rate-limit`.
* **NoSQL Injection Hygiene:** Automated input sanitization using `express-mongo-sanitize`.
* **CORS Guard:** Strict domain whitelisting across local, staging, and production environments.

### 📧 6. Automated Transactional Emails
* **Nodemailer Integration:** Sends automated email alerts to candidates when their application status advances (e.g., shortlisted, interviewed, hired).

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Client (React 19 + Vite SPA)                       │
│           Tailwind CSS • Context API • Socket.io Client • Axios         │
│          Dual Portals: Candidate Dashboard / Recruiter Kanban           │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
         HTTP REST (JSON / JWT)          WebSocket (Bidirectional)
         Port: 5000                      Rooms: Application & User
                    │                                 │
                    ▼                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Server (Node.js + Express 5)                        │
│   Helmet • RateLimit • MongoSanitize • CORS • Multer (PDF Parser)      │
└──────────────┬─────────────────────┬─────────────────────┬──────────────┘
               │                     │                     │
               ▼                     ▼                     ▼
┌─────────────────────────┐ ┌─────────────────┐ ┌─────────────────────────┐
│      MongoDB Atlas      │ │ Google Gen AI   │ │   Nodemailer (SMTP)     │
│  Users, Jobs, Apps,     │ │ Gemini 2.5/2.0  │ │ Status Alert Emails     │
│  Messages, Resumes      │ │ ATS Evaluation  │ │                         │
└─────────────────────────┘ └─────────────────┘ └─────────────────────────┘
```

---

## 🛠️ Tech Stack & Tooling

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, React Router DOM v7, Tailwind CSS, Bootstrap, React Icons, Context API |
| **Backend** | Node.js, Express.js 5, Socket.io, Multer, pdf-parse, Nodemailer |
| **Artificial Intelligence** | Google Gemini API (`@google/genai` — `gemini-2.5-flash` / `gemini-2.0-flash`) |
| **Database** | MongoDB Atlas, Mongoose ODM 9 |
| **Authentication & Security** | Google OAuth 2.0, JWT, Bcrypt.js, Helmet, Express Rate Limit, Mongo Sanitize, CORS |
| **DevOps & Hosting** | Vercel (Frontend), Render (Backend), Git, GitHub |

---

## 📂 Project Structure

```
HireZone/
├── .gitignore                   # Global repository gitignore
├── README.md                    # Project documentation
│
├── Client/                      # Frontend Application (React + Vite)
│   ├── .env.example             # Template for client environment variables
│   ├── .gitignore               # Client-specific gitignore
│   ├── index.html               # Single Page Application HTML entry
│   ├── package.json             # Frontend dependencies & scripts
│   ├── vercel.json              # Vercel deployment & rewrite configuration
│   ├── vite.config.js           # Vite build configuration
│   └── src/
│       ├── assets/              # Logos and illustrations
│       ├── components/          # Navbar, Footer, ChatModal, MessageDrawer, ProtectedRoute
│       ├── context/             # AuthContext (JWT & user state)
│       ├── pages/               # Home, Login, Register, Profile, ApplyJob,
│       │                        # StudentDashboard, RecruiterDashboard, RecruiterApplicants (Kanban)
│       ├── services/            # Axios API client with interceptors
│       └── utils/               # Socket.io connection setup
│
└── Server/                      # Backend API & WebSocket Server
    ├── .env.example             # Template for server environment variables
    ├── .gitignore               # Server-specific gitignore
    ├── server.js                # Express & Socket.io server entry point
    ├── package.json             # Backend dependencies & scripts
    ├── config/                  # MongoDB connection setup
    ├── controllers/             # Auth, Job, Application, Chat, and Profile controllers
    ├── middleware/              # JWT auth, RBAC authorization, and Multer upload
    ├── models/                  # Mongoose Schemas (User, Job, Application, Message)
    ├── routes/                  # RESTful API route definitions
    ├── services/                # Google Gemini AI ATS evaluation service
    ├── uploads/resumes/         # Local resume storage directory (.gitkeep)
    └── utils/                   # Nodemailer transactional email helper
```

---

## 📡 REST API Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user (`student` or `recruiter`) | Public |
| `POST` | `/api/auth/login` | Authenticate with email/password; returns JWT | Public |
| `POST` | `/api/auth/google` | Authenticate using Google OAuth ID token | Public |
| `GET` | `/api/auth/me` | Fetch verified authenticated user profile | Private (JWT) |

### 💼 Jobs (`/api/jobs`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/jobs` | Retrieve all active jobs (search, filter by type/category) | Public |
| `GET` | `/api/jobs/suggested` | Get AI-tailored job recommendations based on skills | Student (JWT) |
| `GET` | `/api/jobs/:id` | Fetch specific job listing details | Public |
| `POST` | `/api/jobs` | Create a new job vacancy listing | Recruiter (JWT) |
| `PUT` | `/api/jobs/:id` | Update an existing job vacancy | Recruiter (JWT) |
| `DELETE` | `/api/jobs/:id` | Remove a job listing | Recruiter (JWT) |

### 📝 Applications (`/api/applications`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/applications` | Submit application with PDF resume & trigger Gemini ATS | Student (JWT) |
| `GET` | `/api/applications/my-applications` | Get all applications submitted by candidate | Student (JWT) |
| `GET` | `/api/applications/job/:jobId/applicants` | Get applicants for a job (sorted, scored) | Recruiter (JWT) |
| `PATCH` | `/api/applications/:id/status` | Advance candidate stage (triggers email & event) | Recruiter (JWT) |

### 💬 Chat & Messages (`/api/chat`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/chat/:applicationId` | Fetch message history for an application room | Participant (JWT) |
| `POST` | `/api/chat/send` | Persist a new message to the database | Participant (JWT) |
| `GET` | `/api/chat/unread-count` | Retrieve unread message badge count | Private (JWT) |

---

## ⚡ WebSocket Events (Socket.io)

| Event | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `join_user_room` | Client ➔ Server | `userId` | Joins user's private notification channel |
| `join_room` | Client ➔ Server | `applicationId` | Joins application-specific chat room |
| `send_message` | Client ➔ Server | `{ applicationId, sender, receiver, text }` | Broadcasts message to room & receiver |
| `receive_message` | Server ➔ Client | `Message object` | Delivers real-time message to connected clients |

---

## ⚙️ Getting Started (Local Development)

### Prerequisites
* **Node.js** (v18.x or higher) & **npm**
* **MongoDB** (Local instance or [MongoDB Atlas](https://www.mongodb.com/atlas) URI)
* **Google Cloud Console** (OAuth 2.0 Client ID for Google login)
* **Google Gemini API Key** ([Google AI Studio](https://aistudio.google.com/))

---

### 1. Clone the Repository
```bash
git clone https://github.com/sayanth/HireZone.git
cd HireZone
```

---

### 2. Configure & Run Backend Server

1. Navigate to the `Server` directory:
   ```bash
   cd Server
   npm install
   ```

2. Create your `.env` file from the provided template:
   ```bash
   cp .env.example .env
   ```

3. Fill in your environment variables in `Server/.env`:
   ```env
   PORT=5000
   CLIENT_URL=http://localhost:5173
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/hirezone?retryWrites=true&w=majority
   JWT_SECRET=your_super_secret_jwt_key
   GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com

   # Email Alerts (Nodemailer SMTP)
   EMAIL_SERVICE=gmail
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_gmail_app_password

   # Google Gemini AI Key
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server runs on `http://localhost:5000`.*

---

### 3. Configure & Run Frontend Client

1. Open a new terminal and navigate to the `Client` directory:
   ```bash
   cd Client
   npm install
   ```

2. Create your `.env` file from the provided template:
   ```bash
   cp .env.example .env
   ```

3. Configure your `Client/.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *The client runs on `http://localhost:5173`.*

---

## 🚀 Deployment Guide

### Frontend Deployment (Vercel)
1. Push your repository to GitHub.
2. In [Vercel](https://vercel.com/), click **Add New Project** and import the `HireZone` repository.
3. Set **Root Directory** to `Client`.
4. Framework Preset: **Vite**.
5. Add the Environment Variables:
   * `VITE_API_URL`: Your deployed backend URL + `/api` (e.g., `https://hirezone-api.onrender.com/api`)
   * `VITE_SOCKET_URL`: Your deployed backend URL (e.g., `https://hirezone-api.onrender.com`)
   * `VITE_GOOGLE_CLIENT_ID`: Your Google OAuth Client ID
6. Click **Deploy**. The included `vercel.json` automatically manages client-side routing.

### Backend Deployment (Render)
1. In [Render](https://render.com/), create a new **Web Service**.
2. Connect your GitHub repository and set **Root Directory** to `Server`.
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `npm start`
5. Configure the environment variables in the Render dashboard:
   * `PORT`: `5000`
   * `CLIENT_URL`: `https://hire-zone-eight.vercel.app`
   * `MONGO_URI`: Your MongoDB Atlas connection string
   * `JWT_SECRET`: Your production JWT secret
   * `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID
   * `EMAIL_USER` & `EMAIL_PASS`: SMTP credentials
   * `GEMINI_API_KEY`: Your Google AI Studio API Key

---

## 🔒 Security Best Practices Implemented
* **No Hardcoded Secrets:** All secrets, keys, and credentials are kept out of source control using `.gitignore` and `.env.example` templates.
* **Input Sanitization:** Proactively defends against NoSQL injection via `express-mongo-sanitize`.
* **Rate Limiting:** Protects against credential stuffing and brute-force attacks on auth endpoints.
* **CORS Whitelisting:** Enforces trusted origin checks across HTTP and WebSocket handshakes.
* **Isolated File Uploads:** Validates PDF MIME types and extensions with a 5 MB file size limit.

---

## 👨‍💻 Author

**Sayanth K V**
* **GitHub:** [@sayanth](https://github.com/sayanthkv)
* **LinkedIn:** [SAYANTH K V](www.linkedin.com/in/sayanth-thedeveloper)
* **Email:** [sayanthsajeev363@gmail.com](mailto:sayanthsajeev363@gmail.com)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
