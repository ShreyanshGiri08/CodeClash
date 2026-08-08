# CodeClash — System Architecture & Context Documentation

CodeClash is a 1v1 competitive programming racing platform where two users are matched by rating, given the same live Codeforces problem, and race to solve it first on Codeforces.

---

## 1. Tech Stack

- **Frontend**:
  - **Framework**: React 18 + Vite (fast HMR, lightweight build pipeline).
  - **Styling**: Tailwind CSS with custom theme variables (dark mode, monospace fonts, glowing accents).
  - **Animations**: Framer Motion for page transitions, stat card entrances, and live status reveal animations.
  - **Routing**: `react-router-dom` v6 with protected route wrappers.
  - **Notifications**: `react-hot-toast` for context-aware notifications.
  - **Charts**: `recharts` for user Elo rating history graphs.

- **Backend**:
  - **Framework**: FastAPI (Python 3.10+), utilizing async/await endpoints for non-blocking I/O.
  - **Database Driver**: `asyncpg` (high-performance PostgreSQL client utilizing native binary protocol).
  - **Password Hashing**: `bcrypt` with salt rounds.
  - **Tokens & Auth**: `python-jose` for JWT sign/verify.
  - **HTTP Client**: `httpx` (async HTTP requests to Codeforces API & problem pages).
  - **HTML Parsing**: `BeautifulSoup4` for scraping CF problem statement HTML blocks.

- **Database**:
  - **PostgreSQL**: Neon Serverless PostgreSQL (free tier).

---

## 2. Key Architectural Decisions & System Design

### A. In-Memory Expanding Band Matchmaking vs. Redis
- **Decision**: In-memory queue with an expanding band search algorithm protected by an `asyncio.Lock`.
- **Reasoning**: For single-process deployments (free tier web service), an in-memory datastructure avoids external dependencies like Redis while delivering zero-latency queue lookups.
- **Expanding Band Algorithm**:
  - `0-10s`: Initial Elo band (±100 Elo)
  - `10-20s`: Expands by step (±150 Elo)
  - `20-30s`: Expands by step (±200 Elo)
  - Up to max band (±500 Elo) at 120s timeout.
  - Both sides are checked: new user's initial band vs. queued user's expanded band.
- **Production Trade-off**: In a multi-worker / load-balanced cluster, this would be migrated to **Redis Sorted Sets** (`ZADD` indexed by Elo, `ZRANGEBYSCORE` for range queries) with distributed locking (`SETNX` / Redlock) to ensure atomic match acquisition across server instances.

### B. Polling vs. WebSockets
- **Decision**: Short-interval HTTP Polling (3-5s) with manual trigger fallback ("I submitted, check now").
- **Reasoning**: Since verdict verification relies on polling the external Codeforces API (`user.status`), true real-time WebSockets cannot overcome the external API rate limits. HTTP polling is stateless, highly resilient, easily cacheable at CDN layer, and works across serverless environments without persistent socket connections.
- **Production Trade-off**: Server-Sent Events (SSE) or WebSockets with Redis Pub/Sub could be used for pushing state changes from background verdict workers to clients.

### C. Server-Side Scraping & In-Memory TTL Caching
- **Decision**: Problem statements are scraped directly from Codeforces HTML (`div.problem-statement`) and cached in-memory with a configurable TTL (1 hour default). The full CF problemset (~10k problems) is cached for 10 minutes.
- **Reasoning**: Codeforces API provides problem metadata but no problem statement body. Scraping on-demand with caching prevents hammering Codeforces servers, speeds up race room load time to <20ms for cached problems, and ensures stability.
- **Production Trade-off**: Redis caching with stale-while-revalidate pattern or an asynchronous background problem ingester.

### D. Idempotent Race Finalization & Atomic Guards
- **Decision**: Two-phase idempotency protection:
  1. **Check-before-write**: Return cached result if `race.status == 'finished'`.
  2. **Atomic SQL Guard**: `UPDATE races SET status='finished', elo_applied=TRUE ... WHERE id=$1 AND elo_applied=FALSE`.
- **Reasoning**: Finalization can be triggered simultaneously by Player 1, Player 2, or background polling. The atomic `WHERE elo_applied=FALSE` ensures `UPDATE 1` occurs exactly once, preventing double-application of Elo rating changes (+24 instead of +12).
- **Tie-Breaking**: When both players solve the problem, Codeforces submission timestamps (`creationTimeSeconds`) are compared, awarding victory to the earliest Accepted submission.

### E. DB Connection Pooling
- **Decision**: `asyncpg.create_pool()` initialized during FastAPI lifespan startup, yielding connections per request via FastAPI dependency injection (`get_db`).
- **Reasoning**: Avoids 50-100ms SSL/TCP handshake latency on every request to Neon PostgreSQL.

### F. Rate Limiting & Health Check
- **Decision**: Sliding window in-memory rate limiting for queue requests (5/min) and verdict checks (15/min). A `/health` endpoint executes `SELECT 1` on the connection pool.

---

## 3. Database Schema

### `users` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique user identifier |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Account email |
| `password_hash` | TEXT | NOT NULL | Bcrypt hashed password |
| `cf_handle` | VARCHAR(100) | NULLABLE | Codeforces handle |
| `cf_verified` | BOOLEAN | DEFAULT `FALSE` | Handle verification status |
| `verify_code` | VARCHAR(20) | NULLABLE | Temporary verification token |
| `elo` | INTEGER | DEFAULT `1200` | Rating |
| `races_played` | INTEGER | DEFAULT `0` | Total completed races |
| `races_won` | INTEGER | DEFAULT `0` | Total victories |
| `avatar` | VARCHAR(50) | DEFAULT `'avatar1'` | Selected avatar icon preset |
| `display_name` | VARCHAR(100) | NULLABLE | Display name |
| `created_at` | TIMESTAMPTZ | DEFAULT `NOW()` | Registration timestamp |

### `races` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique race ID |
| `player1_id` | UUID | REFERENCES `users(id)` | Player 1 |
| `player2_id` | UUID | REFERENCES `users(id)` | Player 2 |
| `problem_id` | VARCHAR(20) | NOT NULL | CF problem ID (e.g. `1794C`) |
| `problem_rating` | INTEGER | NULLABLE | Difficulty rating |
| `status` | VARCHAR(20) | DEFAULT `'active'` | `'active'` or `'finished'` |
| `winner_id` | UUID | REFERENCES `users(id)` | Winner ID or NULL on draw |
| `elo_applied` | BOOLEAN | DEFAULT `FALSE` | Idempotency guard flag |
| `p1_elo_before` | INTEGER | NULLABLE | Player 1 Elo before match |
| `p2_elo_before` | INTEGER | NULLABLE | Player 2 Elo before match |
| `p1_elo_after` | INTEGER | NULLABLE | Player 1 Elo after match |
| `p2_elo_after` | INTEGER | NULLABLE | Player 2 Elo after match |
| `started_at` | TIMESTAMPTZ | DEFAULT `NOW()` | Start timestamp |
| `ended_at` | TIMESTAMPTZ | NULLABLE | Finish timestamp |
| `race_type` | VARCHAR(20) | DEFAULT `'ranked'` | `'ranked'` or `'challenge'` |

### `rating_history` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Record ID |
| `user_id` | UUID | REFERENCES `users(id)` | User ID |
| `race_id` | UUID | REFERENCES `races(id)` | Associated race ID |
| `elo_after` | INTEGER | NOT NULL | Elo after race |
| `elo_change` | INTEGER | NULLABLE | Delta (+15, -12, etc.) |
| `recorded_at` | TIMESTAMPTZ | DEFAULT `NOW()` | Record timestamp |

### `challenges` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Challenge ID |
| `token` | VARCHAR(32) | UNIQUE, NOT NULL | Shareable URL token |
| `creator_id` | UUID | REFERENCES `users(id)` | Creator user ID |
| `problem_rating` | INTEGER | DEFAULT `1200` | Target problem rating |
| `race_duration_minutes` | INTEGER | DEFAULT `40` | Duration limit |
| `race_id` | UUID | REFERENCES `races(id)` | Generated race ID when joined |
| `status` | VARCHAR(20) | DEFAULT `'pending'` | `'pending'`, `'active'`, `'expired'` |
| `created_at` | TIMESTAMPTZ | DEFAULT `NOW()` | Creation timestamp |
| `expires_at` | TIMESTAMPTZ | NULLABLE | Expiration timestamp |

---

## 4. API Contract

### Auth
- `POST /auth/signup` -> `{ email, password }` -> `{ token, user_id }`
- `POST /auth/login` -> `{ email, password }` -> `{ token, user_id }`

### User Profile & History
- `GET /me` [Auth] -> User profile details
- `PATCH /me` [Auth] -> `{ display_name?, avatar? }` -> status
- `GET /users/{target_user_id}/rating-history` -> List of Elo history data points for Recharts
- `GET /races/history` [Auth] -> Recent 20 races for current user

### Codeforces Handle Verification
- `POST /cf/start-verification` [Auth] -> `{ handle }` -> `{ verify_code, instructions }`
- `POST /cf/confirm-verification` [Auth] -> `{ status: "verified", handle }`

### Matchmaking & Races
- `POST /races/queue` [Auth] -> Join queue / immediate match result
- `GET /races/queue/status` [Auth] -> Poll matchmaking status (waiting, matched, timeout)
- `DELETE /races/queue` [Auth] -> Leave queue
- `GET /races/queue/stats` -> Public queue stats `{ queued, playing }`
- `GET /races/{race_id}` -> Get race details & player info
- `GET /races/{race_id}/problem` -> Get cached problem HTML statement
- `POST /races/{race_id}/check` [Auth] -> Trigger verdict verification & finalization
- `GET /races/{race_id}/verdicts` -> Fetch current submission verdicts for both players
- `POST /races/{race_id}/forfeit` [Auth] -> Forfeit race

### Challenges (Private 1v1)
- `POST /challenges/create` [Auth] -> `{ problem_rating }` -> `{ token, share_url }`
- `GET /challenges/{token}` -> Get challenge details for join screen
- `POST /challenges/{token}/join` [Auth] -> Join challenge and launch race

### System
- `GET /health` -> Health check & DB ping

---

## 5. Implemented vs. Pending Features

- [x] Full JWT Authentication & Password Hashing
- [x] Codeforces Verification Flow (profile code check)
- [x] Expanding Band Matchmaking Queue
- [x] Inline Codeforces Problem Scraping & Caching
- [x] Live Race Room with Timer, Verdict Panel & Result Reveal
- [x] Idempotent Race Finalization & Submission Timestamp Tie-Breaking
- [x] Elo Rating System with Provisional K-Factor Period
- [x] Recharts Elo Rating History Graph
- [x] Paginated Elo Leaderboard
- [x] Private Challenge-a-Friend Shareable Links
- [x] Avatar Preset Selection & Profile Customization
- [x] Async Database Connection Pooling with Neon PostgreSQL
- [x] Sliding Window Rate Limiting & Health Check Endpoint

---

## 6. Known Limitations & Production Architecture

1. **In-Memory Queue & Rate Limiter**: Works for single-process deployments. Production would use Redis.
2. **Polling vs WebSockets**: Polling every 4-5s avoids socket management complexity. Production could use WebSockets / SSE backed by Redis Pub/Sub workers for instant notifications.
3. **Problem Scraping**: Scrapes HTML directly from Codeforces. If CF changes its HTML structure, the CSS selector (`div.problem-statement`) must be updated.

