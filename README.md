# 🌐 Omni-Researcher: Autonomous Multi-Agent AI Workspace

[![Deploy on Vercel](https://vercel.com/button)](https://vercel.com/new)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![LangGraph](https://img.shields.io/badge/LangGraph-1C1C1C?style=for-the-badge&logo=langchain)](https://python.langchain.com/docs/langgraph/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

**[🚀 View Live Production Demo Here](https://your-vercel-domain-here.vercel.app)** *(Note: Update this link after Vercel deployment)*

An advanced, full-stack AI research platform powered by a multi-agent LangGraph orchestration engine. Omni-Researcher autonomously conducts deep web research, peer-reviews its own findings, and synthesizes publication-grade reports featuring dynamic, interactive data visualizations and context-aware imagery.

![Omni-Researcher UI](./Demo_Soumya.gif)

## 🚀 Key Features

*   **🧠 Multi-Agent Orchestration:** Utilizes a LangGraph-powered cyclic graph featuring three distinct AI personas:
    *   *Deep Researcher:* Gathers raw intelligence.
    *   *Peer Reviewer:* Critiques and verifies the data.
    *   *Report Synthesizer:* Formats the final output.
* **🔒 Privacy-First BYOK Architecture:** Built with a client-side "Bring Your Own Key" (BYOK) model. API keys and anonymous Client IDs are injected directly into the WebSocket payload, ensuring zero server-side key logging and seamless user isolation in PostgreSQL.
* **🎨 Dynamic Native UI Rendering:** Overrides standard Markdown to dynamically render raw JSON data into highly interactive, Apple-style UI widgets (KPI grids and Area Charts) using Recharts and Framer Motion.
* **⚡ Real-Time WebSocket Streaming:** Bi-directional FastAPI WebSockets provide the React frontend with millisecond-accurate state updates on agent execution, reasoning paths, and database persistence.
* **☁️ Cloud-Native Inference:** Optimized for high-speed, cost-effective agent reasoning using Google's Gemini 2.5 Flash via the GenAI SDK.

---

## 🏗️ System Architecture 

```mermaid
graph TD
    A[React Terminal UI] -->|WebSocket + BYOK| B(FastAPI Server)
    B --> C{LangGraph Router}
    C -->|Search| D[Researcher Agent]
    D -->|Web Data| E[Critic Agent]
    E -->|Reject| D
    E -->|Approve| F[Synthesizer Agent]
    F -->|Markdown + JSON| B
    B -->|Stream| A
    B -->|SQLAlchemy| G[(Supabase IPv4 Session Pooler)]
```

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