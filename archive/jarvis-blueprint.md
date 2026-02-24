# Project Jarvis — Personal AI Infrastructure Blueprint

**Author:** Raj | **Version:** 2.0 | **Date:** February 2026

---

## Executive Summary

This document is a complete implementation guide for building "Jarvis" — a private, voice-enabled AI assistant hosted on a Mac Studio M3 Ultra. The system serves as both a personal AI workstation and a scalable infrastructure for multiple businesses, starting with WealthPilot. It also covers the "Develop Local, Deploy Cloud" production strategy, leveraging India's government AI infrastructure (IndiaAI Mission), and connecting with the Hyderabad/Telangana AI ecosystem.

**Core Principles:** Data sovereignty, privacy-first design, scalable architecture, voice-first interaction, develop local / deploy cloud.

---

## 1. Hardware Specification

### Primary Workstation — Mac Studio M3 Ultra

| Component | Specification | Why |
|---|---|---|
| Chip | M3 Ultra (28-core CPU, 60-core GPU) | 819 GB/s memory bandwidth for fast LLM inference |
| Memory | 256GB Unified | Runs 70B models + dev stack + visualization + headroom for growth |
| Storage | 4TB SSD | Market data, model weights, multiple business data |
| Display | Dual 4K 27" monitors (minimum) | Screen 1: Code/AI/Jupyter. Screen 2: Dashboards/Charts |
| Approx. India Price | ₹6.5-7L (Mac Studio only) | — |

### Supporting Hardware

| Item | Specification | Approx Cost (INR) |
|---|---|---|
| Dual 4K 27" monitors | LG/Dell 27" IPS | ₹40-60K |
| UPS (essential for India) | 1KVA pure sine wave | ₹15-25K |
| External NVMe backup | 2TB Thunderbolt 5 SSD | ₹15-20K |
| Keyboard + Mouse/Trackpad | Apple Magic or mechanical | ₹10-15K |
| **Total Setup Cost** | — | **₹7.5-8.5L** |

### Memory Budget (256GB Allocation)

| Component | Memory | Notes |
|---|---|---|
| macOS overhead | ~10 GB | System processes |
| Primary LLM (70B Q4) | ~40-50 GB | Including KV cache at full context |
| Secondary LLM (coding 32B) | ~20 GB | Qwen2.5-Coder or similar |
| Whisper large-v3 (STT) | ~3-4 GB | Speech-to-text |
| Kokoro TTS | ~1-2 GB | Text-to-speech |
| WealthPilot stack (Docker) | ~20-30 GB | TimescaleDB, paper trading, data pipelines |
| Visualization stack | ~5-10 GB | Grafana, Jupyter, Streamlit |
| RAG vector database | ~5-10 GB | ChromaDB/Qdrant |
| Future Business #2/#3 | ~15-20 GB | Reserved headroom |
| **Free headroom** | **~60-80 GB** | For larger future models |

---

## 2. Software Architecture

### Layer 1 — AI Inference Engine

**Ollama** serves as the model server, always running, bound to localhost only.

**Models to install on Day 1:**

| Model | Purpose | Size (Q4) | Command |
|---|---|---|---|
| Llama 3.1 70B | General assistant (Jarvis brain) | ~40 GB | `ollama pull llama3.1:70b` |
| Qwen2.5-Coder 32B | Code specialist | ~20 GB | `ollama pull qwen2.5-coder:32b` |
| Qwen3 72B | Alternative general (test both) | ~42 GB | `ollama pull qwen3:72b` |

**Installation:**

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Configure Ollama to bind to localhost only
# Edit ~/.ollama/config (or launchd plist on macOS)
export OLLAMA_HOST=127.0.0.1:11434

# Pull models
ollama pull llama3.1:70b
ollama pull qwen2.5-coder:32b
```

### Layer 2 — Interface & Orchestration

**Open WebUI** provides the chat interface with built-in voice support.

```bash
# Docker Compose for Open WebUI
docker run -d \
  -p 3000:8080 \
  -v open-webui:/app/backend/data \
  -e OLLAMA_BASE_URL=http://host.docker.internal:11434 \
  --name open-webui \
  --restart always \
  ghcr.io/open-webui/open-webui:main
```

Access at: `http://localhost:3000`

**Voice Configuration in Open WebUI:**

1. Navigate to Admin > Settings > Audio
2. STT Engine: Set to "Local Whisper" (downloads and runs Whisper locally)
3. TTS Engine: Set to "Kokoro" or "WebAPI" for browser-native TTS
4. Enable "Hands-free voice mode" for continuous conversation

### Layer 3 — Visualization Stack

**Docker Compose for the full visualization and data stack:**

```yaml
# docker-compose.viz.yml
version: '3.8'

services:
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    volumes:
      - grafana-data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=your_secure_password
    restart: always

  jupyter:
    image: jupyter/scipy-notebook:latest
    ports:
      - "8888:8888"
    volumes:
      - ./notebooks:/home/jovyan/work
      - ./data:/home/jovyan/data
    environment:
      - JUPYTER_TOKEN=your_secure_token
    restart: always

  timescaledb:
    image: timescale/timescaledb:latest-pg16
    ports:
      - "5432:5432"
    volumes:
      - timescale-data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=your_db_password
      - POSTGRES_DB=wealthpilot
    restart: always

  chromadb:
    image: chromadb/chroma:latest
    ports:
      - "8000:8000"
    volumes:
      - chroma-data:/chroma/chroma
    restart: always

volumes:
  grafana-data:
  timescale-data:
  chroma-data:
```

**Launch:** `docker compose -f docker-compose.viz.yml up -d`

---

## 3. Voice System — "Hey Jarvis"

### Voice Pipeline Architecture

```
You speak → Whisper (STT) → Text → Ollama (LLM) → Response text → Kokoro (TTS) → You hear
     ↕                                    ↕
 Microphone                         RAG Context
 (Mac/iPhone)                    (Business docs)
```

### At Your Desk (Mac Studio)

Open WebUI provides built-in voice with local Whisper STT and TTS. The experience is: open browser, click mic (or use hotkey), speak, hear response.

For always-listening "Hey Jarvis" wake word, add Home Assistant:

```yaml
# docker-compose.homeassistant.yml
version: '3.8'
services:
  homeassistant:
    image: homeassistant/home-assistant:stable
    ports:
      - "8123:8123"
    volumes:
      - ha-config:/config
    restart: always

volumes:
  ha-config:
```

Configure the Ollama integration in Home Assistant (Settings > Devices & Services > Add > Ollama) and set up the Wyoming voice satellite protocol for wake word detection.

### From iPhone (Anywhere in the World)

**Setup Steps:**

1. Install Tailscale on Mac Studio: `brew install tailscale`
2. Install Tailscale on iPhone from App Store
3. Join both devices to the same Tailnet (login with same account)
4. Enable Tailscale Serve on Mac Studio for HTTPS (required for microphone access):

```bash
# Expose Open WebUI over HTTPS on Tailnet
tailscale serve --bg --https 443 localhost:3000
```

5. On iPhone Safari, navigate to: `https://mac-studio.your-tailnet.ts.net`
6. Add to Home Screen as PWA (tap Share > Add to Home Screen > name it "Jarvis")
7. Open Jarvis PWA, tap mic, speak

**Important:** HTTPS is mandatory for browser microphone access. Tailscale Serve provides this automatically with valid TLS certificates.

### Voice Latency Expectations

| Step | Latency | Notes |
|---|---|---|
| Speech-to-Text (Whisper) | 1-2 seconds | For a typical 5-10 word sentence |
| LLM Inference (70B, first token) | 1-2 seconds | Prompt processing |
| LLM Generation | 15-25 tok/s | M3 Ultra with 70B Q4 |
| Text-to-Speech | 0.5-1 second | Kokoro is fast |
| **Total round-trip** | **3-6 seconds** | Before Jarvis starts speaking |

This is usable but not instantaneous. For faster responses, use a smaller model (32B) which roughly halves inference time.

---

## 4. Security Architecture

### Network Security

**Rule #1: Nothing is ever exposed to the public internet.**

All remote access is through Tailscale, a WireGuard-based mesh VPN. Connections are peer-to-peer and encrypted end-to-end.

```
┌─────────────────────────────────────────────┐
│          TAILNET (WireGuard encrypted)       │
│                                              │
│  iPhone ◄──────────► Mac Studio              │
│  MacBook Air ◄──────► (all services)         │
│  Future devices ◄───► bound to localhost     │
│                                              │
│  Public Internet: ZERO open ports            │
└─────────────────────────────────────────────┘
```

**Tailscale ACL Configuration:**

```json
{
  "acls": [
    {
      "action": "accept",
      "src": ["raj@your-email.com"],
      "dst": ["tag:jarvis:*"]
    }
  ],
  "tagOwners": {
    "tag:jarvis": ["raj@your-email.com"]
  }
}
```

This ensures only your authenticated devices can access the Mac Studio.

### Data Security

| Layer | Protection |
|---|---|
| Disk encryption | FileVault (enabled by default on macOS) |
| Network | Tailscale WireGuard (AES-256 equivalent) |
| Application auth | Open WebUI login + 2FA |
| Docker isolation | Separate volumes per business |
| Model verification | SHA checksum validation on download |
| Session management | 30-minute inactivity timeout |

### Data Compartmentalization (Multi-Business)

Each business gets isolated Docker volumes and RAG namespaces:

```
/docker-volumes/
├── wealthpilot/
│   ├── timescaledb-data/     # Trading data, portfolio
│   ├── grafana-data/         # WealthPilot dashboards
│   └── rag-collection/       # Strategy docs, research
├── business-2/
│   ├── postgres-data/
│   └── rag-collection/
└── shared/
    ├── ollama-models/        # Shared LLM weights
    ├── open-webui-data/      # Chat history (encrypted)
    └── whisper-models/       # Voice models
```

### Voice-Specific Security

| Threat | Risk | Mitigation |
|---|---|---|
| Voice intercepted in transit | Low | Tailscale WireGuard encryption |
| iPhone stolen, Jarvis accessed | Medium | Face ID on Tailscale app, Open WebUI session timeout, 2FA |
| Overheard in public | Medium-High | Use earbuds; switch to text for sensitive queries |
| Whisper mistranscription | Low | Transcription shown on screen before processing |
| Tailscale account compromised | Medium | Strong password + 2FA on Tailscale account |
| Open WebUI zero-day | Medium | Keep updated; Tailnet-only access |

### Security Hardening Checklist

- [ ] Enable FileVault on Mac Studio
- [ ] Set strong Mac login password + auto-lock at 5 minutes
- [ ] Install and configure Tailscale with ACLs
- [ ] Enable 2FA on Tailscale account
- [ ] Set Open WebUI password + enable 2FA
- [ ] Configure 30-minute session timeout in Open WebUI
- [ ] Bind Ollama to 127.0.0.1 only (OLLAMA_HOST env var)
- [ ] Verify model checksums after download
- [ ] Enable audit logging in Open WebUI
- [ ] Set up automatic macOS updates
- [ ] Configure UPS with auto-shutdown on low battery
- [ ] Create encrypted Time Machine backup to external drive
- [ ] Never expose any port to the public internet

---

## 5. RAG Pipeline (Jarvis Knowledge Base)

RAG (Retrieval Augmented Generation) gives Jarvis access to your business documents.

### Architecture

```
Your Documents → Chunking → Embedding Model → ChromaDB (Vector Store)
                                                      ↓
User Query → Embedding → Similarity Search → Top-K Chunks → LLM Context
```

### Setup in Open WebUI

Open WebUI has built-in RAG support:

1. Navigate to Workspace > Knowledge
2. Create collections per business: "WealthPilot", "Business-2", etc.
3. Upload documents (PDF, markdown, text, code files)
4. Open WebUI automatically chunks, embeds, and indexes them
5. When chatting, select the relevant knowledge base from the sidebar

### Custom RAG for Programmatic Access

For deeper integration (e.g., Jupyter notebooks querying Jarvis):

```python
import chromadb
from chromadb.config import Settings

# Connect to local ChromaDB
client = chromadb.HttpClient(host="localhost", port=8000)

# Create collection for WealthPilot
collection = client.get_or_create_collection(
    name="wealthpilot",
    metadata={"business": "wealthpilot"}
)

# Add documents
collection.add(
    documents=["Your strategy document text here..."],
    metadatas=[{"source": "strategy-v2.md", "type": "strategy"}],
    ids=["doc-001"]
)

# Query
results = collection.query(
    query_texts=["What is the current regime detection threshold?"],
    n_results=3
)
```

---

## 6. Workstation Workflow

### Daily Workflow Layout

**Screen 1 (Primary — Code & AI):**
- VS Code / Cursor with Ollama-connected AI coding assistant
- Terminal with Claude Code for complex sessions (cloud, when needed)
- Open WebUI in a browser tab (voice-enabled)
- Jupyter Lab for EDA and analysis

**Screen 2 (Dashboards & Charts):**
- Grafana: WealthPilot regime indicators, portfolio metrics, risk dashboard
- TradingView (browser): Live stock charts for day trading
- Streamlit: Custom interactive analysis tools
- Browser: Research, news, documentation

### AI-Assisted Analysis Workflow

1. Run feature engineering in Jupyter → generates correlation heatmap
2. Screenshot/save plot → paste into Open WebUI chat
3. Jarvis (with WealthPilot RAG context): "The VIX-momentum cross-correlation suggests regime transition. Run expanding window test to check for look-ahead bias."
4. Execute in Jupyter → iterate with Jarvis

### Hybrid Cloud Strategy

| Task | Where | Reason |
|---|---|---|
| Daily assistant, email, Q&A | Local (Jarvis) | Privacy, always available |
| Sensitive trading/portfolio data | Local (Jarvis) | Data sovereignty |
| General coding, business docs | Local (Jarvis) | Good enough quality |
| Complex architecture decisions | Cloud (Claude/GPT) | Frontier reasoning |
| Multi-file refactoring | Cloud (Claude Code) | Better for complex code |
| Regulatory research | Cloud | Better accuracy + web access |

---

## 7. Scaling Path

### Adding Business #2, #3...

Each new business simply needs:
1. New Docker Compose stack with isolated volumes
2. New RAG collection in Open WebUI (or ChromaDB)
3. New Grafana dashboard (if data-heavy)
4. Same AI assistant serves all businesses with context switching

### When You Outgrow One Mac Studio

**Option A:** Add a second Mac Studio/Mac Mini to the Tailnet as a compute node. Load-balance with Ollama's API.

**Option B:** Dedicated Linux server with NVIDIA GPU for heavy inference. Mac Studio becomes the interface/orchestration layer.

**Option C:** As open-source models improve (they're closing the gap rapidly), the same 256GB machine runs better models every 6-12 months without hardware changes.

### Model Upgrade Path

| Timeline | Expected Capability |
|---|---|
| Now (Feb 2026) | 70B models at ~80% of frontier quality |
| Late 2026 | Open-source models likely at ~85-90% of frontier |
| 2027-2028 | 256GB may run models matching today's frontier |

---

## 8. Day-One Setup Checklist

### Phase 1 — Hardware Setup (Day 1)

- [ ] Unbox Mac Studio, connect monitors, keyboard, mouse
- [ ] Complete macOS setup, enable FileVault
- [ ] Set strong login password, configure auto-lock
- [ ] Connect to home network (Ethernet preferred over Wi-Fi)
- [ ] Install UPS, configure auto-shutdown settings
- [ ] Connect external backup drive, configure encrypted Time Machine

### Phase 2 — Core Software (Day 1-2)

- [ ] Install Homebrew: `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
- [ ] Install Docker Desktop for Mac
- [ ] Install Tailscale: `brew install tailscale` → login → tag as "jarvis"
- [ ] Install Ollama: `brew install ollama`
- [ ] Configure OLLAMA_HOST=127.0.0.1:11434
- [ ] Pull primary model: `ollama pull llama3.1:70b` (~40GB download)
- [ ] Pull coding model: `ollama pull qwen2.5-coder:32b`
- [ ] Deploy Open WebUI (Docker command from Section 2)
- [ ] Configure Open WebUI: create admin account, set 2FA, configure voice

### Phase 3 — Visualization & Data (Day 2-3)

- [ ] Deploy visualization stack (docker-compose.viz.yml from Section 2)
- [ ] Configure Grafana: add TimescaleDB as data source
- [ ] Set up Jupyter: install Python packages (pandas, plotly, seaborn, etc.)
- [ ] Deploy ChromaDB for RAG

### Phase 4 — Voice & Remote Access (Day 3-4)

- [ ] Configure Whisper in Open WebUI (Admin > Settings > Audio)
- [ ] Configure TTS in Open WebUI
- [ ] Test voice at desk — full conversation loop
- [ ] Enable Tailscale Serve: `tailscale serve --bg --https 443 localhost:3000`
- [ ] Install Tailscale on iPhone
- [ ] Test iPhone access via Tailnet URL
- [ ] Add Jarvis PWA to iPhone home screen
- [ ] Test voice from iPhone

### Phase 5 — WealthPilot Integration (Day 4-7)

- [ ] Migrate WealthPilot Docker stack to Mac Studio
- [ ] Configure TimescaleDB with market data
- [ ] Set up Grafana dashboards for regime indicators
- [ ] Create WealthPilot RAG collection with strategy docs
- [ ] Test Jarvis with WealthPilot context queries

### Phase 6 — Security Hardening (Day 7)

- [ ] Complete all items in Security Hardening Checklist (Section 4)
- [ ] Review Tailscale ACLs
- [ ] Test access from unauthorized device (should fail)
- [ ] Verify all services bound to localhost
- [ ] Run `nmap localhost` to confirm no unexpected open ports

---

## 9. Ongoing Costs

### Development Phase (Current — Mac Studio Only)

| Item | Monthly Cost (INR) |
|---|---|
| Electricity (~80W × 24/7) | ₹500-700 |
| Tailscale (free tier, 3 devices) | ₹0 |
| Cloud AI (Claude Pro for complex tasks) | ₹1,700 ($20) |
| **Total monthly** | **~₹2,200-2,400** |

### Production Phase (After PMS Launch — Add Cloud)

| Item | Monthly Cost (INR) |
|---|---|
| Mac Studio electricity | ₹500-700 |
| Cloud AI (Claude Pro) | ₹1,700 |
| E2E Networks — Trading engine (c-type VM) | ₹8,000-12,000 |
| E2E Networks — TimescaleDB (dedicated) | ₹10,000-15,000 |
| E2E Networks — Monitoring/backup | ₹3,000-5,000 |
| Static IP (SEBI compliance) | ₹300-500 |
| **Total monthly** | **~₹24,000-35,000** |

Compare to: AWS Mumbai equivalent would be ₹30,000-45,000/month (USD billing, forex risk). IndiaAI portal is NOT suitable for always-on production trading (project-based GPU compute only).

---

## 10. Local AI vs Frontier Models — Honest Assessment

### Quality Comparison (Feb 2026)

| Task | Local 70B Quality | Frontier (Claude/GPT) | Gap |
|---|---|---|---|
| General Q&A | Very Good | Excellent | Small |
| Email/doc drafting | Good | Very Good | Small |
| Data analysis discussion | Good | Excellent | Medium |
| Complex coding | Fair-Good | Excellent | Significant |
| Financial reasoning | Fair-Good | Very Good | Medium |
| Creative writing | Good | Excellent | Medium |

### Practical Guidance

Local Jarvis handles ~80% of daily tasks at sufficient quality. For the remaining 20% (complex architecture, deep debugging, frontier reasoning), use cloud APIs selectively. The hybrid approach gives you both privacy AND capability.

### The Gap Is Closing

Open-source models are improving rapidly. The quality gap that was 15-20 points in 2024 has shrunk to 5-10 points. By late 2026, local models on your 256GB machine may match today's frontier quality.

---

## 11. Production Deployment — "Develop Local, Deploy Cloud"

### The Principle

Your Mac Studio is your **research lab and command center** — where you think, experiment, and build. It is NOT a production server. Production workloads that require uptime, regulatory compliance, and low-latency exchange access go to cloud.

### Architecture

```
┌──────────────────────────────────┐     ┌─────────────────────────────┐
│     MAC STUDIO (Your Desk)       │     │   CLOUD (E2E / AWS Mumbai)  │
│                                  │     │                             │
│  ✅ Development environment      │────►│  ✅ Live trading engine      │
│  ✅ Backtesting & research       │ Git │  ✅ Production database      │
│  ✅ Paper trading                │push │  ✅ Order execution          │
│  ✅ Strategy prototyping         │     │  ✅ 99.95% uptime SLA       │
│  ✅ Jarvis (AI assistant)        │     │  ✅ Monitoring & alerts      │
│  ✅ EDA, feature engineering     │     │  ✅ Audit trail for SEBI     │
│  ✅ Grafana dev dashboards       │     │  ✅ Automated backups        │
│                                  │     │                             │
│  Your alpha research stays HERE  │     │  Only execution logic goes  │
│  Never touches the cloud         │     │  here — no strategy secrets │
└──────────────────────────────────┘     └─────────────────────────────┘
```

### Why Not Host WealthPilot Production Locally?

| Concern | Home Mac Studio | Cloud (E2E/AWS Mumbai) |
|---|---|---|
| Uptime | Depends on home power/internet | 99.95% SLA, redundant infra |
| Latency to NSE | Hyderabad → Mumbai (~15ms) | Mumbai data center (~1-3ms) |
| SEBI compliance | Hard to audit "runs on my Mac" | Documented, auditable infra |
| Power outage | UPS gives 15-30 min | Redundant power, generators |
| macOS forced update | Trading engine stops | Linux VMs, controlled updates |
| Resource contention | Jarvis LLM competes with trading | Isolated, dedicated resources |
| Investor confidence | Weak | Professional, institutional-grade |

### Phase-Dependent Strategy

**Phase 1 (Now): Development & Paper Trading** → Host everything on Mac Studio. Ideal for fast iteration.

**Phase 2: Live Trading (Own Capital)** → Move execution engine to E2E Networks Mumbai. Keep research local.

**Phase 3: PMS Launch** → Full cloud production with SLAs, monitoring, disaster recovery, audit trails.

### Recommended Cloud Provider for WealthPilot

**Primary: E2E Networks** (Indian provider)
- INR billing, no forex risk
- Mumbai data centers, low latency to NSE
- UPI/NEFT payment support
- Indian data sovereignty compliance (DPDP Act, RBI guidelines)
- GPU instances available if needed for ML inference
- Self-service, spin up in 30 seconds, no quota approvals
- Up to 60% cheaper than AWS/Azure

**Alternative: AWS Mumbai (ap-south-1)**
- Larger ecosystem (more managed services)
- Better if you need specific AWS services (SQS, Lambda, etc.)
- USD billing — forex risk
- Hyderabad region also available for redundancy

### SEBI Algo Trading Compliance (2025 Rules)

- **Static IP mandatory** for all algo/API trading — register with broker
- One primary + one backup static IP allowed per application
- Static IP can only be changed once per week
- Max 10 orders per second via broker APIs
- Cloud VPS with Elastic/Static IP satisfies this requirement
- **Action:** Get static IP from E2E Networks Mumbai, whitelist with broker

---

## 12. IndiaAI Mission & Government Compute

### Overview

The IndiaAI Mission (₹10,300 crore budget) has deployed 38,000+ GPUs including NVIDIA H100, H200, and Google Trillium TPUs. The IndiaAI Compute Portal offers these at dramatically subsidized rates.

### Pricing Comparison — GPU Compute

| Provider | H100 Rate (₹/hr) | Subsidy | Billing | Best For |
|---|---|---|---|---|
| **IndiaAI Portal** | **₹65-116** | Up to 40% | INR | ML training, research |
| E2E Networks (spot) | ₹70 | None | INR | Flexible ML workloads |
| E2E Networks (on-demand) | ₹249 | None | INR | Production inference |
| AceCloud | ~₹200-250 | None | INR | Training, fine-tuning |
| AWS | ~₹330+ | None | USD | Enterprise, global scale |
| Azure | ~₹590 | None | USD | Enterprise, MS ecosystem |
| GCP | ~₹350+ | None | USD | TPU access, ML tools |

### IndiaAI Portal — Registration & Access

**Eligibility:** DPIIT-registered startups, MSMEs, researchers, students, government entities.

**Registration Process:**
1. Register on IndiaAI Compute Portal using Meri Pehchaan (DigiLocker/Parichay/ePramaan)
2. Fill registration form, upload eligibility documents (DPIIT certificate, company registration)
3. Verification by designated officials
4. Submit project proposal: technical approach, intended impact, estimated GPU hours (Bill of Materials)
5. Requests under 5,000 GPU hours: auto-approved
6. Requests over 5,000 GPU hours: PMEC committee review (submit by 25th, approved by 10th next month)
7. Approvals valid for 30 calendar days — must start using within this period

**Subsidy:** Up to 40% of compute costs. Projects of national importance get priority.

**Empaneled Providers:** Yotta, E2E Networks, Tata Communications, and others.

### What IndiaAI IS Good For (Your Use Case)

- Training regime detection ML models at scale
- Hyperparameter sweeps across strategy variants
- Fine-tuning LLMs on financial domain data
- Experimenting with deep learning signal generation
- Any future AI-centric product development

### What IndiaAI is NOT Good For

- Always-on production trading infrastructure (project-based, 30-day approval windows)
- Persistent VM hosting (it's GPU compute, not general cloud)
- Low-latency order execution (not designed for trading workloads)

### IndiaAI Mission 2.0 (Announced Feb 2026)

The second phase shifts from infrastructure-building to adoption, with:
- UPI-style AI platform offering ready-to-use AI solutions for MSMEs
- Expanded sovereign AI model development
- Deeper integration with startup ecosystem
- Continued GPU capacity expansion (projected 100,000+ GPUs by end of 2026)

---

## 13. Telangana & Hyderabad AI Ecosystem

### Why This Matters (You're In Hyderabad)

Hyderabad is rapidly emerging as India's AI capital. Stanford's 2025 Global AI Vibrancy Tool ranks India third globally in AI competitiveness. Telangana is at the center of this push.

### Key Resources Available to You

**T-Hub (World's Largest Startup Incubator)**
- 572,000+ sq ft facility in Raidurg, Hyderabad
- Supported 2,000+ startups, collectively raising over $2 billion
- Programs: Lab32 incubation, acceleration, mentorship, investor access
- T-Fund: Early-stage funding from Telangana IT department (₹15 Cr allocated)
- Selected under Startup India Seed Fund Scheme (₹5 Cr for eligible startups)

**Telangana AI Innovation Hub (TAIH)**
- Consolidates all state AI initiatives under one umbrella
- Connected to 270+ AI startups through Centres of Excellence
- Partners: Google, Microsoft, Amazon, NVIDIA, IIIT-H, IIT-H, ISB, BITS
- Targets: 50,000 youth skill training, 10,000 jobs in 3 years

**Telangana Data Exchange (TGDeX)** — Launched July 2025
- India's first state-led digital public infrastructure for AI
- Curated datasets and subsidized GPU access
- Partners: JICA, IISc Bengaluru, Boston Consulting Group
- Founders can fine-tune models without paying premium cloud fees

**AI City Hyderabad** — 200 acres in Future City
- Purpose-built for AI product companies, startups, GCCs, R&D
- Yotta building 25,000 GPU AI Supercomputer (4,000 GPUs Phase 1)
- Pay-as-you-use access for startups
- NTT DATA + Neysa: 400MW cluster with ~25,000 GPUs

**Google AI Accelerator** — Launched Feb 2025
- Supporting Hyderabad startups in agriculture, mobility, education, sustainability

### Startup Telangana Benefits

- Up to 30% reimbursement on international marketing expenses
- SGST reimbursement for eligible startups
- T-Spark grants for early-stage and seed-stage startups
- Access to 500+ Global Capability Centres in Hyderabad

### How to Leverage (Action Items)

1. **Register as DPIIT startup** → Unlocks IndiaAI, T-Hub, Startup India benefits
2. **Apply to T-Hub Lab32** → Incubation, mentorship, investor access
3. **Register on TGDeX** → Free/subsidized datasets and compute
4. **Register on IndiaAI Compute Portal** → ₹65/hr GPU access
5. **Track Yotta AI City timeline** → Local GPU cloud when operational
6. **Attend TAIH events** → Networking with 270+ AI startups, potential partners

---

## 14. Complete Infrastructure Cost Summary

### One-Time Costs

| Item | Cost (INR) |
|---|---|
| Mac Studio M3 Ultra 256GB, 4TB | ₹6,50,000-7,00,000 |
| Dual 4K monitors | ₹40,000-60,000 |
| UPS (1KVA) | ₹15,000-25,000 |
| External NVMe backup | ₹15,000-20,000 |
| Keyboard + Mouse | ₹10,000-15,000 |
| **Total hardware** | **₹7,30,000-8,20,000** |

### Monthly Costs by Phase

| Phase | Local | Cloud | Total/Month |
|---|---|---|---|
| Development (now) | ₹2,200 | ₹0 | **₹2,200** |
| Paper trading + research | ₹2,200 | ₹0 | **₹2,200** |
| Live trading (own capital) | ₹2,200 | ₹22,000 | **₹24,000** |
| PMS launch | ₹2,200 | ₹35,000 | **₹37,000** |
| + IndiaAI GPU (occasional) | — | ₹2,000-5,000 | **+₹2-5K** |

### ROI Perspective

- Hardware pays for itself vs cloud-only in ~2-3 years
- IndiaAI GPU access saves ₹50K-2L/year vs commercial GPU rates
- Data sovereignty and privacy: priceless for proprietary trading strategies
- Telangana ecosystem access: potential funding, mentorship, partnerships at zero cost

---

*This is a living document (v2.0). Update as you add businesses, upgrade models, evolve architecture, or move through development phases.*
