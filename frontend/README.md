# 🌐 Omni-Researcher: Frontend Client

This directory contains the React (Vite) frontend for the **Omni-Researcher** multi-agent AI workspace. 

The frontend is responsible for providing a dynamic terminal interface, establishing a live dual-channel WebSocket stream with the FastAPI backend, and dynamically rendering raw JSON data into interactive, Apple-style UI widgets using Recharts and Framer Motion.

## 🛠️ Technology Stack

*   **Framework:** React (Vite)
*   **Styling:** Tailwind CSS, Framer Motion
*   **Data Visualization:** Recharts
*   **Markdown Parsing:** React-Markdown (Custom component interception)

## 💻 Local Development Setup

**Prerequisites:** Node.js

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install the necessary dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

The frontend workspace will typically be available at `http://localhost:3000` (check your terminal output for the exact local URL).

> **Note:** For the application to function fully and process research queries, ensure that the **FastAPI backend** is also running concurrently. Refer to the root `README.md` for complete backend setup instructions.
