# CampusHive

CampusHive is a campus-focused digital platform that connects students with campus-based entrepreneurs and service providers (such as braiders, barbers, photographers, food vendors, and tutors). The platform provides a centralized space for service discovery, provider profiles, and appointment booking.

---

## Project Structure

CampusHive is organized as a decoupled monorepo containing dedicated frontend and backend services:

```text
campushive/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI pipeline
├── backend/
│   ├── prisma/                  # Prisma schema and migrations (Issue #4)
│   ├── src/
│   │   ├── config/              # Configuration files
│   │   ├── controllers/         # Request handlers
│   │   ├── middlewares/         # Express middlewares
│   │   ├── routes/              # API route definitions
│   │   ├── services/            # Business logic layer
│   │   ├── validators/          # Request validation schemas
│   │   └── index.js             # Backend server entry point
│   ├── .env.example             # Backend environment variable template
│   ├── package.json             # Backend dependencies and scripts
│   └── .gitignore               # Backend gitignore
├── frontend/
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── assets/              # UI images and icons
│   │   ├── components/          # Reusable React components
│   │   ├── context/             # State / Context providers
│   │   ├── pages/               # Page components
│   │   ├── services/            # API client services
│   │   ├── App.jsx              # Root component
│   │   ├── App.css              # App styling
│   │   ├── index.css            # Base stylesheet
│   │   └── main.jsx             # React application entry point
│   ├── index.html               # Main HTML entry
│   ├── vite.config.js           # Vite configuration
│   ├── .env.example             # Frontend environment variable template
│   ├── package.json             # Frontend dependencies and scripts
│   └── .gitignore               # Frontend gitignore
├── .gitignore                   # Root gitignore
├── package.json                 # Root convenience scripts
└── README.md                    # Project setup and documentation
```

---

## Prerequisites

Ensure you have the following installed on your local development machine:

- **Node.js**: `v18.x` or higher (LTS recommended, e.g. `v20.x` or `v24.x`)
- **npm**: `v9.x` or higher (bundled with Node.js)
- **Git**: Latest version

---

## Environment Variables Setup

Both the backend and frontend use environment variables for configuration. Create your local `.env` files from their respective `.env.example` templates:

### 1. Backend Environment

In `backend/`:
```bash
# Windows (PowerShell)
Copy-Item backend\.env.example backend\.env

# macOS / Linux / Git Bash
cp backend/.env.example backend/.env
```

Contents of `backend/.env.example`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

> **Note for Windows users**: Port `5000` is often reserved by Windows host exclusions (`EACCES` error). If you experience this, set `PORT=5001` in `backend/.env` (and update `VITE_API_BASE_URL` in `frontend/.env` accordingly).


### 2. Frontend Environment

In `frontend/`:
```bash
# Windows (PowerShell)
Copy-Item frontend\.env.example frontend\.env

# macOS / Linux / Git Bash
cp frontend/.env.example frontend/.env
```

Contents of `frontend/.env.example`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

> **Security Note**: Never commit `.env` files or hardcode credentials, secrets, or API keys into git. Only commit `.env.example` templates with placeholder values.

---

## Installation

You can install dependencies for both services from the root folder or separately.

### Option A: From the Root Directory (Recommended)

```bash
npm run install:all
```

### Option B: Individually

```bash
# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

---

## Running the Application Locally

### Running the Backend

From the root directory:
```bash
npm run dev:backend
```

Or from `backend/`:
```bash
cd backend
npm run dev
```

The backend server starts on `http://localhost:5000` (or the port defined in `backend/.env`).

### Running the Frontend

From the root directory:
```bash
npm run dev:frontend
```

Or from `frontend/`:
```bash
cd frontend
npm run dev
```

The Vite dev server starts on `http://localhost:5173`.

---

## Git Collaboration Workflow

To maintain a clean and reliable codebase throughout our 1-week MVP sprint, all team members should follow this workflow:

### 1. Branch Naming Convention

Always create a new feature branch from up-to-date `main`:

```bash
git checkout main
git pull origin main
git checkout -b <type>/issue-<number>-<short-description>
```

Examples:
- `feature/issue-2-student-auth`
- `feature/issue-4-prisma-schema`
- `fix/issue-9-slot-collision`
- `chore/issue-15-aws-config`

### 2. Commit Message Guidelines

Write clear, concise commit messages that describe what changed and why:

```text
feat(auth): implement student registration endpoint
fix(booking): resolve unique slot collision handling
docs(readme): update backend startup instructions
```

### 3. Pull Requests (PRs)

1. Push your branch to GitHub:
   ```bash
   git push -u origin <branch-name>
   ```
2. Open a Pull Request targeting `main`.
3. Fill out the PR description with:
   - Linked Issue (e.g. `Closes #2`)
   - Summary of changes
   - How the changes were tested
4. Verify that the GitHub Actions CI workflow passes on your PR.
5. Request a review from at least one teammate before merging.
