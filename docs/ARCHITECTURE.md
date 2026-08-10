# 🏛️ CodeClash — System Design & System Architecture Specification

This document presents the low-level system design, topology, real-time WebSocket protocol specifications, rating calculation formulas, and client-side resilience mechanisms for **CodeClash**.

---

## 1. High-Level System Topology Architecture

```mermaid
graph TD
    Client["Client Frontend (React 18 + Vite + Tailwind)"]
    
    subgraph FrontendSubsystems["Frontend Subsystems"]
        Monaco["Monaco Code Studio IDE"]
        Sound["WebAudio Synthesizer"]
        CmdPal["Ctrl+K Command Palette"]
        Animate["Framer Motion Router"]
    end
    
    Client --> Monaco
    Client --> Sound
    Client --> CmdPal
    Client --> Animate

    subgraph BackendPlatform["Core Backend Platform (FastAPI + Uvicorn)"]
        REST["REST API Server (Port 8000)"]
        WS["WebSocket Connection Manager"]
        JudgeEngine["Codeforces Verdict Engine"]
        EloCalc["Elo Rating Calculator Engine"]
    end

    Client -- HTTP Requests --> REST
    Client -- Full-Duplex WebSockets --> WS

    subgraph DataStorageLayer["Data & Storage Layer"]
        DB[("PostgreSQL / SQLite Database")]
    end

    REST --> DB
    WS --> DB
    JudgeEngine --> REST

    subgraph ExternalSystems["External Systems & Compilers"]
        CF_API["Codeforces Official REST API"]
        CORS_Proxy["CORS Proxy Fallback Cluster"]
    end

    JudgeEngine -- Verdict Verification --> CF_API
    Client -- Client-side Scraping --> CORS_Proxy
    CORS_Proxy --> CF_API
```


---

## 2. Real-Time 1v1 Clash Match Sequence Flowchart

```mermaid
sequenceDiagram
    autonumber
    actor P1 as Player 1 (Alice)
    actor P2 as Player 2 (Bob)
    participant WS as Socket.io Match Server
    participant DB as System Database
    participant CF as Codeforces API

    P1->>WS: joinQueue({ targetRating: 1400 })
    P2->>WS: joinQueue({ targetRating: 1400 })
    WS->>WS: Matchmaking Engine pairs P1 & P2
    WS->>DB: Create Race Record (Status: 'in_progress')
    WS-->>P1: matchFound({ raceId, opponent: P2, problem })
    WS-->>P2: matchFound({ raceId, opponent: P1, problem })
    
    Note over P1,P2: Match Countdown Starts (30 Minutes)

    P1->>CF: Submit C++ Solution on Codeforces
    P1->>WS: checkSubmission({ raceId })
    WS->>CF: Query user.status for P1 handle
    CF-->>WS: Verdict: OK (Accepted)
    WS->>DB: Update Race Status ('finished'), Calculate Elo (+24 P1, -24 P2)
    WS-->>P1: raceFinished({ winner: P1, newElo: 1640 })
    WS-->>P2: raceFinished({ winner: P1, newElo: 1586 })
```

---

## 3. Elo Rating Recalculation Mathematical Model

CodeClash utilizes an enhanced zero-sum **Elo Rating Algorithm** tailored for competitive programming esports ($K = 32$):

### Expected Score Formula
$$E_A = \frac{1}{1 + 10^{(R_B - R_A) / 400}}$$

$$E_B = \frac{1}{1 + 10^{(R_A - R_B) / 400}}$$

Where:
- $R_A$: Player 1's Pre-Match Rating
- $R_B$: Player 2's Pre-Match Rating
- $E_A, E_B$: Expected probability of winning ($0 \le E \le 1$)

### Post-Match Rating Adjustment
$$R_A' = R_A + K \cdot (S_A - E_A)$$
$$R_B' = R_B + K \cdot (S_B - E_B)$$

Where:
- $K$: Scaling factor ($K = 32$)
- $S_A = 1$ if Player A wins, $S_A = 0$ if Player A loses, $S_A = 0.5$ if Draw

---

## 4. Resilience & Client-Side Proxy Architecture

To guarantee zero downtime and maximum availability:
1. **Multi-Proxy Failover Array**: Client-side statement scrapers iterate sequentially across a resilience cluster (`corsproxy.io` $\rightarrow$ `api.allorigins.win` $\rightarrow$ `api.codetabs.com`).
2. **Offline Local Compilation Engine**: In-browser JavaScript evaluation engine allows local execution without requiring backend compilers.
3. **Session Auto-Recovery**: Client state is persisted to `localStorage` metadata, allowing browser refreshes (`F5`) to recover live sessions without match interruption.
