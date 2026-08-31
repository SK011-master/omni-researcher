# 🌐 Omni-Researcher: Autonomous Multi-Agent AI Workspace

An advanced, full-stack AI research platform powered by a multi-agent LangGraph orchestration engine. Omni-Researcher autonomously conducts deep web research, peer-reviews its own findings, and synthesizes publication-grade reports featuring dynamic, interactive data visualizations and context-aware imagery.

## 🚀 Key Features

*   **🧠 Multi-Agent Orchestration:** Utilizes a LangGraph-powered cyclic graph featuring three distinct AI personas:
    *   *Deep Researcher:* Gathers raw intelligence.
    *   *Peer Reviewer:* Critiques and verifies the data.
    *   *Report Synthesizer:* Formats the final output.
*   **🎨 Dynamic Native UI Rendering:** Overrides standard Markdown to dynamically render raw JSON data into highly interactive, Apple-style UI widgets (KPI grids and Area Charts) using Recharts and Framer Motion.
*   **🖼️ Context-Aware Imagery:** Intelligently generates and embeds structural text-to-image prompts via the Pollinations API to break up dense technical reports with cinematic visuals.
*   **💾 Persistent Memory:** Fully integrated with Supabase PostgreSQL via SQLAlchemy, ensuring all research sessions and agent reasoning paths are securely logged and retrievable.
*   **⚡ Cloud-Native Inference:** Optimized for high-speed, cost-effective agent reasoning using Google's Gemini 2.5 Flash via the GenAI SDK, ensuring rapid websocket streaming to the client.

---

## 🛠️ Technology Stack

**Frontend (Client)**
*   **Framework:** React (Vite)
*   **Styling:** Tailwind CSS, Framer Motion
*   **Data Visualization:** Recharts
*   **Parsing:** React-Markdown (Custom component interception)

**Backend (Server)**
*   **Framework:** FastAPI (Python)
*   **AI Engine:** LangGraph, Google GenAI SDK
*   **Database:** PostgreSQL (Supabase Connection Pooler)
*   **ORM:** SQLAlchemy

---

## 🏗️ System Architecture 

1. **User Input:** A query is submitted via the React terminal interface.
2. **WebSocket Stream:** FastAPI establishes a live dual-channel websocket.
3. **Graph Execution:** LangGraph routes the payload through the agent nodes.
4. **Data Structuring:** The Synthesizer outputs custom code-fence blocks (e.g., ```` ```line-chart ````).
5. **Frontend Interception:** The React Markdown parser catches the custom tags, parses the underlying JSON, and dynamically draws the Recharts UI widgets on the canvas.

---

## 💻 Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/omni-researcher.git
cd omni-researcher
```

### 2. Backend Environment (FastAPI)
Navigate to the backend directory, set up your virtual environment, and install dependencies.

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory:

```env
# API Keys
GOOGLE_API_KEY=your_google_gemini_key

# Supabase Connection Pooler URL (IPv4)
DATABASE_URL=postgresql://postgres.[YOUR_ID]:[YOUR_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

Start the Uvicorn server:

```bash
uvicorn app.main:app --reload
```

### 3. Frontend Environment (React)
Open a new terminal, navigate to the frontend directory, and start the Vite development server.

```bash
cd frontend
npm install
npm run dev
```

The workspace will be available at `http://localhost:3000`.

## 📝 License

This project is licensed under the MIT License.