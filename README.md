# ⚡ CodeClash — Real-Time 1v1 Competitive Programming Esports Platform

[![Live App](https://img.shields.io/badge/Live_App-code--clash--kohl.vercel.app-FFD700?style=for-the-badge&logo=vercel&logoColor=black)](https://code-clash-kohl.vercel.app)
[![Backend API](https://img.shields.io/badge/Backend_API-codeclash--hmgz.onrender.com-00FF9D?style=for-the-badge&logo=render&logoColor=black)](https://codeclash-hmgz.onrender.com)

> 🚀 **Live App Deployment**: [https://code-clash-kohl.vercel.app](https://code-clash-kohl.vercel.app)  
> ⚡ **Backend API Server**: `https://codeclash-hmgz.onrender.com`

**CodeClash** is a state-of-the-art, real-time competitive programming esports platform designed for high-speed duels on authentic Codeforces problems. Featuring Elo-rated matchmaking, 6-character private challenge rooms, Valorant-style match entrances, an embedded multi-language IDE with local execution, a smart non-destructive algorithm snippet vault, dynamic analytics radar charts, 3D holographic badges, zero-asset Web Audio synthesis, and an advanced client-side TeX math statement parser.


---

## 📑 Table of Contents
1. [Technical Stack](#-technical-stack)
2. [System Design & Architecture Flowcharts](#-system-design--architecture-flowcharts)
3. [Algorithmic & Mathematical Models](#-algorithmic--mathematical-models)
4. [Exhaustive Feature Directory](#-exhaustive-feature-directory)
5. [Statement Slicer & TeX Math Cleaning Engine](#-statement-slicer--tex-math-cleaning-engine)
6. [Performance Optimizations & Resilience](#-performance-optimizations--resilience)
7. [Project Directory Structure](#-project-directory-structure)
8. [Installation & Local Setup](#-installation--local-setup)
9. [Environment Variables](#-environment-variables)

---

## 🛠 Technical Stack

### Frontend Subsystems
- **Core Framework**: React 18, Vite 5, React Router v6
- **Styling & Micro-Interactions**: Tailwind CSS v4, Vanilla CSS Custom Variables, Framer Motion (3D spring physics, layout animations, cyber curtain route transitions with `AnimatePresence`)
- **Design System & Theme**: Cyber Slate Glassmorphism (`#111428`) with wall-to-wall workstation setup wallpapers for Light Mode and dark Cyber aesthetics
- **Global Command Palette**: `Ctrl + K` / `⌘K` glassmorphic search overlay (`CommandPalette.jsx`) with 3D rotating SVG icons and `scrollIntoView` viewport tracking
- **Code Studio IDE**: Custom Monaco-inspired editor (`CyberMonacoEditor.jsx`) supporting C++ 17 (g++), Python 3.10, Java 17, and JavaScript (Node 18) with auto-indentation and diff output comparison
- **Smart Snippet Vault**: 1-click non-destructive algorithm snippet insertion (`CPSnippetVault.jsx`) featuring Fast I/O, Modular Exponentiation, DSU, and Segment Trees
- **Dynamic Analytics**: Recharts engine rendering live 6-axis Radar skill distribution charts and Win/Loss pie charts
- **Audio Synthesizer**: Custom Web Audio API synthesizer (`SoundContext.jsx`) utilizing low-latency Web Audio API Oscillators, GainNodes, and Chrome async context resolution (Zero external MP3/WAV assets)
- **Toast Notifications**: React Hot Toast

### Backend Subsystems
- **API Framework**: FastAPI (Python 3.10+) running on Uvicorn ASGI high-performance server
- **Real-Time WebSockets**: FastAPI WebSockets for live race events, opponent state broadcasting, and match countdown clocks
- **Database Layer**: PostgreSQL via `asyncpg` with connection pool recycling (`max_inactive_connection_lifetime=180`) for Neon serverless pool health
- **Security & Authentication**: Flexible multi-identifier login (Email or Codeforces Handle) with JWT Tokens (`python-jose`) + Password Hashing (`passlib` bcrypt)
- **Scraping Engine**: `httpx` + `BeautifulSoup4` + Jina Reader Proxy (`r.jina.ai`) multi-selector parser for Codeforces statements

### Execution & Verification Engine
- **Code Execution API**: Piston API (`https://emkc.org/api/v2/piston/execute`) + Client-Side JS Sandbox
- **Codeforces Verification Engine**: Live Codeforces REST API polling (`user.status`) with 60-second clock-drift grace window (`after_timestamp - 60`) to absorb server time offsets
- **Codeforces Resilience Layer**: Official REST API + Multi-Proxy Fallback Cluster (`r.jina.ai` $\rightarrow$ `api.allorigins.win` $\rightarrow$ `api.codetabs.com`)

---

## 🏛 System Design & Architecture Flowcharts

### 1. High-Level System Topology Architecture

```mermaid
graph TD
    Client["Client Frontend (React 18 + Vite + Tailwind)"]
    
    subgraph FrontendSubsystems["Frontend Subsystems"]
        Monaco["Monaco Code Studio IDE"]
        Sound["WebAudio Synthesizer"]
        CmdPal["Ctrl+K Command Palette"]
        Parser["TeX Math & Statement Parser"]
        Snippet["Smart Snippet Vault"]
    end
    
    Client --> Monaco
    Client --> Sound
    Client --> CmdPal
    Client --> Parser
    Client --> Snippet

    subgraph BackendPlatform["Core Backend Platform (FastAPI + Uvicorn)"]
        REST["REST API Server (Port 8000)"]
        WS["WebSocket Connection Manager"]
        JudgeEngine["Codeforces Verdict Engine"]
        EloCalc["Elo Rating Calculator Engine"]
    end

    Client -- HTTP Requests --> REST
    Client -- Full-Duplex WebSockets --> WS

    subgraph DataStorageLayer["Data & Storage Layer"]
        DB[("Neon PostgreSQL Database (asyncpg)")]
    end

    REST --> DB
    WS --> DB
    JudgeEngine --> REST

    subgraph ExternalCompilers["External Systems & Compilers"]
        CF_API["Codeforces Official REST API"]
        Piston["Piston Compilation API"]
        Jina_Proxy["Jina Reader & Proxy Cluster"]
    end

    JudgeEngine -- 60s Buffer Verdict Check --> CF_API
    Monaco -- Code Execution --> Piston
    Client -- Scraped Statement Proxy --> Jina_Proxy
    Jina_Proxy --> CF_API
```

---

### 2. 1v1 Ranked Matchmaking & Private Challenge Flowchart

```mermaid
sequenceDiagram
    autonumber
    actor P1 as Player 1 (Creator/Queued)
    actor P2 as Player 2 (Joiner/Queued)
    participant Queue as Matchmaking / Challenge Engine
    participant VS as Esports Entrance Screen
    participant Arena as 1v1 Race Room
    participant CF as Codeforces API
    participant WS as WebSocket Server

    alt Ranked Matchmaking Queue
        P1->>Queue: Join Queue (Target ELO: 1400)
        P2->>Queue: Join Queue (Target ELO: 1400)
        Queue-->>Queue: Expanding Band Matchmaker (Purge >300s entries)
    else Private Challenge Room
        P1->>Queue: Create Room (Generates 6-Char Code "08B760")
        P2->>Queue: Enter Code "08B760" to Join
    end

    Queue->>VS: Match Created Event
    VS->>VS: Trigger 3.5s Valorant-Style Entrance + Sound Effect
    VS->>Arena: Redirect Both Players to Race Room (/race/:id)
    Arena->>WS: Connect WebSocket (/races/ws/:id)
    WS-->>Arena: Broadcast Clocks, Opponent Status & Submission Events

    Note over P1,P2: Match Starts (40 Minute Limit)

    P1->>CF: Submit C++ Solution on Codeforces
    P1->>Arena: Click '✓ Check Submission' (or Auto-Check every 10s)
    Arena->>CF: Query user.status for P1 (after_timestamp - 60s)
    CF-->>Arena: Verdict: OK (Accepted)
    Arena->>WS: Broadcast Race Finished (Winner: P1)
    WS-->>P1: Victory Screen & Elo Delta (+24)
    WS-->>P2: Match Result Screen & Elo Delta (-24)
```

---

### 3. Code Execution & Diff Comparison Pipeline

```mermaid
flowchart TD
    A[User Code + Stdin + Expected Output] --> B{Select Language}
    B -->|JavaScript| C[Client-Side JS Sandbox Engine]
    B -->|C++ / Python / Java| D[Piston API Execution Endpoint]
    C --> F[Capture Stdout & Stderr]
    D --> F
    F --> G{Check Exit Code & Stderr}
    G -->|Error Code / Stderr| H[Status: COMPILE / RUNTIME ERROR]
    G -->|Exit 0 & Clean Output| I{Expected Output Provided?}
    I -->|Yes| J{Compare Trimmed Stdout vs Expected}
    J -->|Matches| K[Status: PASSED - MATCHES EXPECTED]
    J -->|Mismatch| L[Status: FAILED - OUTPUT MISMATCH]
    I -->|No| M[Status: EXECUTED CLEANLY]
```

---

## 🧮 Algorithmic & Mathematical Models

### 1. Zero-Sum Elo Rating Recalculation Model ($K = 32$)
CodeClash enforces an idempotent **Elo Rating Algorithm** for all 1v1 ranked clashes:

#### Expected Score Formula
$$E_A = \frac{1}{1 + 10^{(R_B - R_A) / 400}}$$

$$E_B = \frac{1}{1 + 10^{(R_A - R_B) / 400}}$$

#### Rating Update Formula
$$R_A' = R_A + K \cdot (S_A - E_A)$$
$$R_B' = R_B + K \cdot (S_B - E_B)$$

Where $S_A = 1$ if Player A wins, $S_A = 0$ if Player A loses.

---

### 2. Dynamic Topic Skill Proficiency Model
In the **Analytics Engine**, 6-axis skill proficiencies (`Implementation`, `Math`, `Greedy`, `DP`, `Graphs`, `Strings`) are dynamically calculated:

$$\text{Proficiency}_T = \min\left(100, \max\left(25, \frac{\text{User Elo}}{25} + 7 \times \text{CF Solved}_T + 12 \times \text{Clash Wins}_T\right)\right)$$

Where:
- $\text{CF Solved}_T$: Number of unique problems solved on Codeforces matching topic tag $T$.
- $\text{Clash Wins}_T$: Number of 1v1 match victories on problems containing topic tag $T$.

---

## 💎 Exhaustive Feature Directory

### 1. Embedded Code Studio IDE & Smart Snippet Vault (`CyberMonacoEditor.jsx`, `CPSnippetVault.jsx`)
- **Multi-Language Support**: C++ 17 (g++), Python 3.10, Java 17, JavaScript (Node.js 18).
- **Smart Non-Destructive Snippet Insertion**:
  - `⚡ Fast I/O`: Injects `ios_base::sync_with_stdio(false); cin.tie(NULL);` **directly inside `main()`**.
  - `🌐 DSU`, `🔢 ModPow`, `🌲 SegTree`: Injects helper structs and functions **ABOVE `int main()`** without overwriting solution code.
- **Smart Auto-Indentation**: Indents +4 spaces on opening blocks `{`, `:`, `(`, auto-closes bracket pairs, and preserves leading indentation.

---

### 2. Statement Slicer & TeX Math Cleaner Engine (`markdownParser.js`)
- **Fast Guard Clause**: Prevents double-parsing of generated HTML tags.
- **Title-to-Footer Slicing**: Purges 100% of website navigation links (`Home`, `Top`, `Gym`), language flags (`🇬🇧`, `🇷🇺`), contest sidebars, and copyright footers.
- **TeX Symbol Cleaner**:
  - Converts `\ldots`, `\cdots`, `\dots` $\rightarrow$ **`...`**.
  - Strips `\left.`, `\right.`, `≤ft]` bracket noise $\rightarrow$ **`[-4, 2, 3, -6]`**.
  - Formats exponents `10^{4}`, `10^9` $\rightarrow$ **`10⁴`**, **`10⁹`**.
  - Formats subscript series $a_1, a_2, \dots, a_n$ $\rightarrow$ **`a₁, a₂, ..., aₙ`**.
  - Cleans inequalities `\leq`/`≤q` $\rightarrow$ **`≤`**, `\geq`/`≥q` $\rightarrow$ **`≥`**.
- **Interactive 1-Click Copy Buttons**: Every sample input/output testcase box is wrapped in high-contrast neon yellow header bars (`#ffe600`) with working `📋 COPY` buttons (`data-copy-text` event delegation in `main.jsx`).

---

### 3. 1v1 Arena & Live Codeforces Watcher (`Race.jsx`, `cf_service.py`)
- **Live Submission Stream**: 5s poll interval displaying recent submission verdicts for both players in real-time.
- **60s Clock-Drift Buffer**: `effective_start = after_timestamp - 60` to prevent server clock offsets from missing AC verdicts.
- **Idempotent Forfeit & Victory SQL Transactions**: Explicit PostgreSQL type-casting (`$2::integer`, `$3::integer`) preventing transaction crashes.
- **WebSocket Broadcasts**: Instant `RACE_UPDATE` and `OPPONENT_CHECKING` notifications.

---

### 4. Private Challenge Rooms (`Challenge.jsx`, `JoinChallenge.jsx`, `challenges.py`)
- **6-Character Room Codes**: Generates shareable codes (e.g. `08B760`).
- **Creator vs Opponent Disambiguation**: Waits for auth profile loading to ensure room creators always see creator lobby controls.
- **Auto-Redirect**: Polls room state and automatically launches the race room when the opponent accepts.

---

### 5. Multi-Identifier Authentication (`auth.py`, `Login.jsx`)
- Log in using **EITHER Email address OR Codeforces Handle** (case-insensitive & whitespace trimmed: `LOWER(TRIM(email)) = $1 OR LOWER(TRIM(cf_handle)) = $1`).
- Standardized HTTP 401 Unauthorized responses for invalid credentials.

---

### 6. Dynamic Analytics & Holographic 3D Badges (`Analytics.jsx`, `Badges.jsx`)
- Recharts 6-axis Radar skill distribution chart and Win/Loss pie chart.
- Interactive 3D tilt physics holographic trophy cards with cursor-following metallic sheen reflections.

---

### 7. Zero-Asset Web Audio Synthesizer (`SoundContext.jsx`)
- Low-latency Web Audio API synthesizer utilizing sine, triangle, and sawtooth oscillators (`playCyberTap`, `playAction`, `playSadness`, `playVictory`, `playQueueFound`).

---

## ⚡ Performance Optimizations & Resilience

1. **Neon DB Connection Recycling**: `max_inactive_connection_lifetime=180` in `asyncpg.create_pool` to recycle idle SSL sockets on Neon PostgreSQL serverless infrastructure.
2. **Double-Parse Guard Clause**: Eliminates DOM string corruption by bypassing parsed HTML strings.
3. **Storage Memory Lockup Prevention**: Scraped statement strings are excluded from the timer loop to prevent local storage quota lockups.
4. **Global Event Delegation**: Document-level click listener in `main.jsx` capturing copy button interactions across dynamically injected HTML elements.

---

## 📂 Project Directory Structure

```text
CodeClash/
├── frontend/
│   ├── src/
│   │   ├── api/                   # API client (auth, races, challenges, codeforces)
│   │   ├── components/
│   │   │   ├── common/            # CommandPalette, CPSnippetVault, AntigravityCyberBackground
│   │   │   ├── editor/            # CyberMonacoEditor (Multi-lang IDE)
│   │   │   └── layout/            # Navbar, PageLayout, Footer
│   │   ├── context/               # AuthContext, ThemeContext, SoundContext
│   │   ├── pages/                 # Landing, Practice, Race, FindRace, Challenge, JoinChallenge, Badges, Analytics, Settings, LinkCF, Docs
│   │   ├── utils/                 # markdownParser.js (Central statement slicer & TeX math cleaner)
│   │   ├── App.jsx                # Router configuration & AnimatePresence Page Transitions
│   │   ├── index.css              # Design tokens, cyber slate theme, math rendering rules
│   │   └── main.jsx               # React entry point & global copy event delegation
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── middleware/            # Rate limiting & CORS middleware
│   │   ├── routers/               # auth, users, codeforces, races, challenges, leaderboard, health
│   │   ├── services/              # CF API client, match engine, race service, elo service, websocket manager
│   │   ├── database.py            # PostgreSQL asyncpg connection pool & schema initialization
│   │   ├── dependencies.py        # Database pool & JWT auth dependencies
│   │   ├── main.py                # FastAPI entry point, dual router registration & CORS configuration
│   │   └── models.py              # Pydantic data schemas
│   └── requirements.txt
│
└── README.md
```

---

## 🚀 Installation & Local Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10.0 or higher

### 1. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend application will start at `http://localhost:5173`.

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
The backend API server will start at `http://localhost:8000`.

---

## 🔑 Environment Variables

### Frontend Configuration (`frontend/.env.local`)

```env
# Local REST API Endpoint
VITE_API_URL=http://localhost:8000

# Local WebSocket Server Endpoint
VITE_WS_URL=ws://localhost:8000
```

### Production Vercel Deployment

```env
VITE_API_URL=https://codeclash-hmgz.onrender.com
VITE_WS_URL=wss://codeclash-hmgz.onrender.com
```

### Backend Configuration (`backend/.env`)

```env
# JWT Signing Key
JWT_SECRET=your_super_secret_jwt_key

# Neon PostgreSQL Database URI
DATABASE_URL=postgresql://user:password@ep-restless-mouse.aws.neon.tech/neondb?sslmode=require
```

---

## 📜 License
MIT License. Built for competitive programmers who'd rather battle in 1v1 duels than grind alone.
