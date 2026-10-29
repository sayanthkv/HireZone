# 🚀 HireZone — Full-Stack Real-Time Recruitment Platform

**HireZone** is a scalable, two-sided recruitment and career enablement platform designed to streamline hiring interactions between recruiters and applicants. Built with the **MERN** stack, it delivers room-isolated real-time messaging via **Socket.io**, granular Role-Based Access Control (RBAC), automated transactional email notifications, and comprehensive backend security middleware.

---

## 🌐 Live Deployment & Repositories

* **Live Client Application:** [hire-zone-eight.vercel.app](https://hire-zone-eight.vercel.app)
* **Frontend Hosting:** Vercel (Continuous Deployment)
* **Backend Hosting:** Render (Web Service)
* **Database:** MongoDB Atlas

---

## ⚡ Key Highlights & Core Features

### 👥 Dual-Portal Workflow (RBAC)
* **Recruiter Suite:** Post, manage, edit, and close job vacancies; track applicant stages; review attached profiles; and initiate one-on-one live messaging threads.
* **Applicant Dashboard:** Search and filter active job opportunities, apply with customized resume data, monitor application statuses in real time, and converse directly with hiring teams.

### 💬 Real-Time Messaging & Session Isolation
* **Socket.io Powered:** Instant bidirectional messaging without polling or page refreshes.
* **Room Isolation:** Communication happens across unique, authenticated room channels mapped between recruiters and candidates.
* **Unread State Synchronization:** Implements active chat tracking (`activeChatAppId`) to dynamically toggle message counters and unread badge notifications.

### 🛡️ Defensive Backend Security Architecture
* **Authentication:** Stateless authentication using cryptographically signed **JSON Web Tokens (JWT)**.
* **HTTP Protection:** Enforces secure response headers using **Helmet.js**.
* **Rate Limiting:** Protects sensitive auth and message endpoints from brute-force attacks via `express-rate-limit`.
* **NoSQL Injection Hygiene:** Input sanitization powered by `mongo-sanitize`.
* **CORS Policy:** Strict domain whitelisting across staging and production environments.

### 📧 Transactional Notifications
* Integrated with **Nodemailer** over SMTP to deliver automated status changes and notification alerts directly to user inboxes.

---

## 🏗️ System Architecture

              ┌───────────────────────────────────────────┐
              │          React 18 + Vite (SPA)            │
              │   Tailwind CSS • Context API • Lucide     │
              └─────────────────────┬─────────────────────┘
                                    │
                     HTTP REST      │  WebSocket (Bidirectional)
                     (JSON / JWT)   │  (Room Events)
                                    ▼
              ┌───────────────────────────────────────────┐
              │             Node.js / Express             │
              │   Helmet • RateLimit • MongoSanitize      │
              │   Socket.io Server • Nodemailer (SMTP)    │
              └─────────────────────┬─────────────────────┘
                                    │
                                    ▼
              ┌───────────────────────────────────────────┐
              │           MongoDB Atlas (Cloud)           │
              │   Users • Jobs • Applications • Messages  │
              └───────────────────────────────────────────┘


              ---

## 🛠️ Tech Stack & Tooling

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React.js (Vite), JavaScript (ES6+), Tailwind CSS, Bootstrap, Lucide Icons, Context API |
| **Backend** | Node.js, Express.js, RESTful API Architecture, Socket.io, Nodemailer |
| **Database** | MongoDB, Mongoose ODM, MongoDB Atlas |
| **Security & Auth** | JSON Web Tokens (JWT), Bcrypt.js, Helmet.js, express-rate-limit, mongo-sanitize, CORS |
| **DevOps & Cloud** | Vercel, Render, Git, GitHub |

---

## 📂 Project Structure


hire-zone/
├── client/                     # Frontend React Application
│   ├── src/
│   │   ├── assets/             # Static graphics and icons
│   │   ├── components/         # Reusable UI modules (Modals, Badges, Chat)
│   │   ├── context/            # Auth and Socket state providers
│   │   ├── pages/              # Candidate & Recruiter views
│   │   ├── services/           # Axios instance & API service calls
│   │   ├── App.jsx             # Route definitions & layout shell
│   │   └── main.jsx            # React root entry point
│   └── package.json
│
└── server/                     # Backend Node.js / Express Server
    ├── config/                 # DB connection & Nodemailer configuration
    ├── controllers/            # Route controllers (Auth, Jobs, Apps, Chat)
    ├── middleware/             # Auth check (JWT), RBAC & error handlers
    ├── models/                 # Mongoose database schemas
    ├── routes/                 # Express API endpoints
    ├── sockets/                # Socket.io connection & room listeners
    ├── server.js               # Express application entry point
    └── package.json


⚙️ Getting Started (Local Setup)

Prerequisites
Node.js (v18.x or later
Git
MongoDB (Local instance or MongoDB Atlas URI)

1. Clone the Repository

git clone [https://github.com/sayanth/HireZone.git](https://github.com/sayanth/HireZone.git)
cd HireZone

2. Configure Backend Server

cd server
npm install


Create a .env file inside the server/ root:
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_private_key
CLIENT_URL=http://localhost:5173

# Email Notifications (Optional for Local Dev)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password


Start the backend server:
# Development mode with auto-reload
npm run dev


3. Configure Frontend Client
cd client
npm install


Create a .env file inside the client/ root:
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000


Start the development server:
npm run dev

Visit http://localhost:5173 in your browser.

📡 Key API Endpoints
Authentication
POST /api/auth/register — Register a new account (candidate or recruiter).

POST /api/auth/login — Authenticate credentials and issue JWT.

GET /api/auth/me — Retrieve verified user profile details.

Job Management
GET /api/jobs — Retrieve active jobs with optional filter queries.

POST /api/jobs — Create a new vacancy (Recruiter role only).

PUT /api/jobs/:id — Update listing details (Recruiter role only).

DELETE /api/jobs/:id — Close/remove listing (Recruiter role only).

Applications & Chat
POST /api/applications — Submit candidate application.

PATCH /api/applications/:id/status — Advance candidate pipeline status.

GET /api/messages/:applicationId — Fetch historical chat transcript for an application.

👨‍💻 Author
Sayanth KV

LinkedIn: SAYANTH KV

GitHub: @sayanth

Email: sayanthsajeev363@gmail.com

📄 License
This project is licensed under the MIT License.


---

### Tips for Applying This:
1. Create or open the `README.md` file in the root of your `HireZone` repository.
2. Paste this markdown content directly.
3. Review the environment variable keys in the setup section to make sure they match your actual variable names (`MONGO_URI`, `JWT_SECRET`, etc.).
4. Commit and push to GitHub to showcase a structured presentation to visiting recruiters.
