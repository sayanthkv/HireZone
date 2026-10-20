# HireZone

HireZone is a modern MERN stack hiring platform designed to connect students/job seekers with recruiters. It provides a seamless workflow for posting jobs, applying to opportunities, managing profiles, and communicating in real time.

Live Demo: https://hire-zone-eight.vercel.app

## Overview

HireZone brings together:
- Students seeking internships and job opportunities
- Recruiters looking for qualified candidates
- Real-time communication between both parties

The platform includes role-based access, secure authentication, job management, applicant tracking, and chat functionality.

## Tech Stack

### Frontend
- React
- Vite
- React Router
- Axios
- Socket.IO Client
- Google OAuth

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Socket.IO
- Nodemailer
- Helmet and rate limiting for security

## Key Features

- Student registration and login
- Recruiter registration and login
- Role-based dashboards
- Job creation, listing, and management
- Job application workflow
- Recruiter applicant review
- User profile management
- Real-time messaging between recruiter and candidate
- Unread message tracking
- Secure API with validation and request limiting
- Responsive, modern UI

## Project Structure

HireZone/
├── Client/                 # Frontend React App
│   ├── public/
│   ├── src/
│   ├── .env
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
│
├── Server/                 # Backend Express API
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   └── server.js
│
├── .gitignore
├── LICENSE
├── README.md
