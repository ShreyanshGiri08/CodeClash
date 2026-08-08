# CodeClash ⚔️ — 1v1 Competitive Programming Racing Platform

CodeClash is a 1v1 competitive programming racing platform where developers are matched by rating, given the same live Codeforces problem, and race to solve it first on Codeforces.

---

## 🚀 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion, Recharts, React Router v6, React Hot Toast
- **Backend**: FastAPI (Python), `asyncpg` (PostgreSQL async driver), `httpx` (async HTTP client), `BeautifulSoup4` (HTML scraping), `python-jose` (JWT), `bcrypt`
- **Database**: Neon PostgreSQL (Serverless PostgreSQL)
- **External API**: Codeforces Public API (`user.info`, `user.status`, `problemset.problems`)

---

## ✨ Features

1. **Authentication**: Email + password signup/login with JWT sessions and bcrypt password hashing.
2. **Codeforces Handle Verification**: Submit your CF handle, place a generated code in your Codeforces profile "First Name" field, and click verify.
3. **Quick Match Matchmaking**: In-memory expanding band search algorithm ($\pm100$ Elo expanding over time up to $\pm500$).
4. **Race Room**:
   - Live problem statement scraped directly from Codeforces HTML and rendered inline.
   - Live countdown timer and elapsed clock.
   - Real-time Codeforces verdict polling.
   - Automated tie-breaking by earliest Accepted submission timestamp (`creationTimeSeconds`).
   - Idempotent race finalization preventing double Elo score updates.
5. **Challenge-a-Friend**: Private race creation generating unique shareable links (`/challenge/:token`).
6. **Elo Rating System**: Standard Elo rating formula with provisional K-factor ($K=40$ for $<10$ races, $K=20$ afterwards).
7. **Rating History Graph**: Interactive Elo timeline graph powered by Recharts.
8. **Ladder Leaderboard**: Paginated leaderboard ranking all active racers by Elo.
9. **Avatars & Customization**: Preset avatar selection for profiles.
10. **System Design & Reliability**:
    - Server-side in-memory TTL caching for problem statements.
    - Sliding window per-user rate limiting.
    - DB connection pooling (`asyncpg.create_pool`).
    - `/health` endpoint for database health monitoring.
    - Structured logging.

---

## 🛠️ Setup & Running Locally

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- PostgreSQL database (e.g. Neon PostgreSQL)

### 1. Backend Setup

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `backend` folder (refer to `.env.example`):
```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
JWT_SECRET=your-secure-jwt-secret-key
CORS_ORIGINS=http://localhost:5173
```

Run the backend server:
```bash
uvicorn main:app --reload --port 8000
```
Backend API will be available at `http://localhost:8000`.

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` folder (refer to `.env.example`):
```env
VITE_API_URL=http://localhost:8000
```

Run the Vite development server:
```bash
npm run dev
```
Frontend app will be available at `http://localhost:5173`.

---

## 📚 Architectural Documentation

For an in-depth explanation of system design decisions, database schemas, API contracts, and technical interview talking points, refer to the [CONTEXT.md](file:///c:/Users/giril/OneDrive/Desktop/CodeClash/CONTEXT.md) document in the root directory.
