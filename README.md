# 🚀 DevTrack

<div align="center">

### Developer Productivity & Career Readiness Operating System

Transform your resume, learning progress, coding activity, and career goals into a measurable developer growth journey.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Express](https://img.shields.io/badge/Express-5.x-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green)
![Redis](https://img.shields.io/badge/Redis-Cache-red)

[Live Demo](#) • [Documentation](#) • [Report Bug](#) • [Request Feature](#)

</div>

---

## 🌟 Overview

DevTrack is a comprehensive developer intelligence platform designed to help software engineers understand their current skill level, identify career gaps, create structured learning roadmaps, and track professional growth over time.

Instead of treating resumes, learning plans, productivity tools, and career goals as separate systems, DevTrack unifies them into a single career readiness operating system.

The platform continuously analyzes developer progress and transforms daily engineering work into measurable career advancement.

---

## ❓ Why DevTrack?

Most developers face three major challenges:

### 1. No Clear Career Direction

Many developers don't know which skills are required for their dream role or how far they are from achieving it.

### 2. Learning Without Structure

Developers often jump between tutorials, courses, and technologies without a clear roadmap.

### 3. Resumes Lack Evidence

Resumes frequently list technologies without demonstrating actual proof of experience.

DevTrack solves these challenges through a closed-loop intelligence system that continuously analyzes, guides, tracks, and recalculates professional growth.

---

## 🔄 The DevTrack Growth Loop

```text
Resume Upload
      ↓
Career Discovery
      ↓
Roadmap Intelligence
      ↓
Focus Mode
      ↓
Evolution Tracking
      ↓
Roadmap Recalculation
      ↓
Continuous Growth
```

Every completed task, skill milestone, and learning achievement feeds back into the system to generate updated recommendations.

---

## 🏗️ Core Platform Modules

### 📄 Resume Intelligence

Transform resumes into structured developer profiles.

#### Capabilities

* Resume Upload (PDF, DOCX, TXT)
* ATS Compatibility Analysis
* Technical Skill Extraction
* Project Intelligence Analysis
* Resume Evidence Validation
* AI-Powered Recommendations
* Career Readiness Scoring

#### Workflow

```text
Resume Upload
      ↓
Content Extraction
      ↓
Skill Detection
      ↓
ATS Analysis
      ↓
Evidence Validation
      ↓
Intelligence Report
```

---

### 🎯 Career Discovery

Define professional objectives and align learning efforts with target outcomes.

#### Features

* Career Goal Configuration
* Dream Role Selection
* Target Company Alignment
* Compensation Goal Tracking
* Timeline Planning
* Readiness Evaluation

#### Supported Career Paths

* Backend Engineer
* Frontend Engineer
* Full Stack Engineer
* DevOps Engineer
* AI/ML Engineer
* Data Engineer
* Software Engineer

---

### 🗺️ Roadmap Intelligence

Generate personalized learning roadmaps based on career goals and current capabilities.

#### Features

* Skill Gap Analysis
* Learning Prioritization
* Readiness Benchmarking
* Dependency Mapping
* Resource Recommendations
* Progress Monitoring

#### Output

* Missing Skills
* Recommended Learning Paths
* Career Readiness Score
* Priority Roadmap Milestones

---

### ⏱️ Focus Mode

Convert long-term goals into daily execution.

#### Features

* Daily Missions
* Task Management
* Pomodoro Timer
* Productivity Tracking
* Mission Categories
* Progress Persistence

#### Purpose

Focus Mode acts as the operational layer where roadmap recommendations become actionable tasks.

---

### 🧬 Evolution Intelligence

Track professional growth through measurable milestones.

#### Features

* Growth Timeline
* XP System
* Progression Levels
* Achievement Tracking
* Milestone Analytics
* Blocker Detection

#### Growth Stages

```text
Foundation
     ↓
Intermediate
     ↓
Advanced
```

---

### 📊 Analytics & Telemetry

Measure platform engagement and learning effectiveness.

#### Features

* Activity Tracking
* Productivity Metrics
* Mission Completion Analytics
* User Feedback Collection
* Adoption Metrics
* Operational Dashboards

---

## 🖼️ Screenshots

### Resume Intelligence

```md
Add screenshot here:
docs/images/resume-intelligence.png
```

### Roadmap Intelligence

```md
Add screenshot here:
docs/images/roadmap-intelligence.png
```

### Focus Mode

```md
Add screenshot here:
docs/images/focus-mode.png
```

### Evolution Intelligence

```md
Add screenshot here:
docs/images/evolution-intelligence.png
```

---

## 🏛️ System Architecture

```text
┌──────────────────────────┐
│      React Frontend      │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│      Express API         │
└────────────┬─────────────┘
             │
 ┌───────────┴───────────┐
 ▼                       ▼
MongoDB             Redis/BullMQ
(Database)          (Queue Layer)
```

### Frontend Layer

Responsible for:

* User Interface
* State Management
* Dashboard Visualization
* Productivity Tracking
* Roadmap Visualization

### Backend Layer

Responsible for:

* Authentication
* Resume Processing
* Readiness Computation
* Analytics
* API Services

### Queue Processing Layer

Responsible for:

* Resume Parsing Jobs
* Intelligence Generation
* Background Tasks
* Scheduled Operations

---

## 🛠️ Technology Stack

| Category         | Technologies               |
| ---------------- | -------------------------- |
| Frontend         | React 19, TypeScript, Vite |
| State Management | Zustand, TanStack Query    |
| UI & Animation   | Framer Motion              |
| Backend          | Node.js, Express 5         |
| Database         | MongoDB, Mongoose          |
| Cache & Queues   | Redis, BullMQ              |
| Authentication   | Clerk                      |
| Testing          | Vitest, Playwright         |
| Deployment       | Docker                     |

---

## 📂 Project Structure

```text
DevTrack/
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── store/
│
├── backend/
│   ├── src/
│   ├── modules/
│   ├── middleware/
│   ├── db/
│   └── shared/
│
├── dev-orchestrator/
│
├── docs/
│
└── infrastructure/
```

---

## 🚀 Getting Started

### Prerequisites

* Node.js 18+
* npm 9+
* Docker Desktop
* MongoDB
* Redis

### Clone Repository

```bash
git clone https://github.com/VarshithReddy2006/DevTrack.git

cd DevTrack
```

### Install Dependencies

```bash
npm run install-all
```

### Configure Environment Variables

Create:

```bash
.env
backend/.env
frontend/.env
```

Required variables:

```env
NODE_ENV=development

MONGODB_URI=

REDIS_HOST=
REDIS_PORT=

CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=

GITHUB_TOKEN=

GEMINI_API_KEY=
```

### Start Infrastructure

```bash
npm run dev:infra
```

### Start Development Environment

```bash
npm run dev
```

### Access Services

| Service     | URL                   |
| ----------- | --------------------- |
| Frontend    | http://localhost:5173 |
| Backend API | http://localhost:3001 |

---

## 🔌 API Overview

### Authentication

```http
GET /api/v1/auth/me
POST /api/v1/auth/sse-handshake
```

### Resume Intelligence

```http
POST /api/v1/resume/upload
POST /api/v1/resume-intelligence/report
```

### Readiness

```http
GET /api/v1/readiness/snapshot
```

### Dashboard

```http
GET /api/v1/dashboard/stats
```

### Coaching

```http
GET /api/v1/coaching/insights
```

---

## 📈 Product Roadmap

### ✅ Completed

* Resume Upload System
* ATS Analysis
* Career Discovery
* Skill Gap Analysis
* Roadmap Intelligence
* Focus Mode
* Evolution Tracking
* Analytics Dashboard

### 🚧 In Progress

* Resume Evidence Scoring
* Advanced AI Recommendations
* Readiness Optimization Engine

### 🔮 Planned

* GitHub Activity Integration
* LeetCode Integration
* AI Career Coach
* Interview Preparation Engine
* Team Collaboration Workspaces
* Organization Analytics

---

## 🧪 Testing

### Unit Tests

```bash
npm run test
```

### End-to-End Tests

```bash
npm run test:e2e --prefix frontend
```

---

## 🤝 Contributing

We welcome contributions from developers of all experience levels.

### Contribution Process

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/amazing-feature
```

3. Commit changes

```bash
git commit -m "feat: add amazing feature"
```

4. Push branch

```bash
git push origin feature/amazing-feature
```

5. Open a Pull Request

---

## 🛡️ Security

DevTrack includes:

* Rate Limiting
* Input Validation
* Secure Authentication
* CORS Protection
* Helmet Security Headers
* Environment Validation

---

## 📄 License

Distributed under the MIT License.

See `LICENSE` for more information.

---

## ⭐ Support

If you find this project useful:

* Star the repository
* Share feedback
* Submit feature requests
* Contribute improvements

---

<div align="center">

### Built for Developers. Focused on Growth.

**DevTrack — Turn Learning Into Measurable Career Progress.**

</div>
