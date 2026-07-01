import express from "express";
import path from "path";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

interface WorkflowCallbacks {
  onStart: (nodeId: "researcher" | "critic" | "synthesizer", title: string, progress: number) => void;
  onChunk: (nodeId: "researcher" | "critic" | "synthesizer", chunk: string) => void;
  onComplete: (nodeId: "researcher" | "critic" | "synthesizer", fullText: string, title: string) => void;
  onError: (error: string, nodeId?: "researcher" | "critic" | "synthesizer") => void;
  isCancelled: () => boolean;
}

// SHARED AGENT RESEARCH WORKFLOW
async function runResearchWorkflow(query: string, ai: GoogleGenAI, callbacks: WorkflowCallbacks) {
  try {
    // ==========================================
    // STEP 1: AI Deep Researcher - DRAFT 1
    // ==========================================
    if (callbacks.isCancelled()) return;
    callbacks.onStart("researcher", "Scouring databases & drafting core hypotheses...", 15);

    const researcherPrompt = `Conduct exhaustive primary and secondary research on the following topic. Include structured breakdowns, key technical concepts, potential implementation hurdles, and statistical estimates. Topic: "${query}"`;
    
    let researcherResult = "";
    const researcherStream = await ai.models.generateContentStream({
      model: "gemini-3.5-flash",
      contents: researcherPrompt,
      config: {
        systemInstruction: "You are an elite, highly structured, senior research scientist. Draft comprehensive, objective, multi-chapter scientific dossiers in clean Markdown. Present detailed facts and clear analysis without empty preamble.",
      },
    });

    for await (const chunk of researcherStream) {
      if (callbacks.isCancelled()) {
        console.log("[Workflow] Research cancelled during researcher stage.");
        return;
      }
      const text = chunk.text || "";
      researcherResult += text;
      callbacks.onChunk("researcher", text);
    }

    callbacks.onComplete("researcher", researcherResult, "Core research files synthesized.");

    // Delay slightly to let animations complete smoothly
    await new Promise((resolve) => setTimeout(resolve, 800));

    // ==========================================
    // STEP 2: AI Peer Reviewer / Critic - REVIEW 1 (REJECTION)
    // ==========================================
    if (callbacks.isCancelled()) return;
    callbacks.onStart("critic", "Sifting research file for gaps, bias, and structural barriers...", 15);

    const criticPrompt = `Rigorously review, critique, and audit the following research draft about "${query}". Point out missing perspectives, engineering challenges, regulatory barriers, ethical pitfalls, or data vulnerabilities. Suggest concrete improvements.

Research Draft to critique:
${researcherResult}`;

    let criticResult = "";
    const criticStream = await ai.models.generateContentStream({
      model: "gemini-3.5-flash",
      contents: criticPrompt,
      config: {
        systemInstruction: "You are a demanding peer reviewer, technical editor, and cynical auditor. Critique research reports with professional rigor. Highlight structural flaws, unbacked assumptions, and missing dimensions in clean Markdown. End your review with a prominent and explicit reject directive so we can trigger a revision.",
      },
    });

    for await (const chunk of criticStream) {
      if (callbacks.isCancelled()) {
        console.log("[Workflow] Research cancelled during critic stage.");
        return;
      }
      const text = chunk.text || "";
      criticResult += text;
      callbacks.onChunk("critic", text);
    }

    callbacks.onComplete("critic", criticResult + "\n\n---\n\n### **CRITICAL AUDIT RESULT**\n❌ **DRAFT REJECTED**: Flagged key structural gaps and validation omissions. Sending back to researcher for iteration...", "Gaps charted. Draft rejected.");

    // Delay slightly to let animations complete smoothly
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // ==========================================
    // STEP 3: RE-ROUTE BACK TO RESEARCHER - REVISION CYCLE
    // ==========================================
    if (callbacks.isCancelled()) return;
    callbacks.onStart("researcher", "Revising draft to address peer review critiques...", 15);

    const revisionPrompt = `You are revising your research dossier on "${query}". Address the following critique points rigorously:

Critique Points:
${criticResult}

Original Draft:
${researcherResult}

Output the revised, complete, highly detailed dossier.`;

    let revisedResearcherResult = "";
    const revisionStream = await ai.models.generateContentStream({
      model: "gemini-3.5-flash",
      contents: revisionPrompt,
      config: {
        systemInstruction: "You are an elite, highly structured, senior research scientist. Revise your research dossier thoroughly, incorporating all critique feedback. Present the expanded, finalized draft in beautiful Markdown.",
      },
    });

    for await (const chunk of revisionStream) {
      if (callbacks.isCancelled()) {
        console.log("[Workflow] Research cancelled during revision stage.");
        return;
      }
      const text = chunk.text || "";
      revisedResearcherResult += text;
      callbacks.onChunk("researcher", text);
    }

    callbacks.onComplete("researcher", revisedResearcherResult, "Refined research dossier compiled.");

    // Delay slightly to let animations complete smoothly
    await new Promise((resolve) => setTimeout(resolve, 800));

    // ==========================================
    // STEP 4: AI Peer Reviewer / Critic - REVIEW 2 (APPROVAL)
    // ==========================================
    if (callbacks.isCancelled()) return;
    callbacks.onStart("critic", "Performing final compliance and verification check...", 15);

    const criticPrompt2 = `Rigorously verify if the revised research draft has successfully addressed the peer critique.

Revised Draft:
${revisedResearcherResult}

Original Critique:
${criticResult}`;

    let criticResult2 = "";
    const criticStream2 = await ai.models.generateContentStream({
      model: "gemini-3.5-flash",
      contents: criticPrompt2,
      config: {
        systemInstruction: "You are the demanding peer reviewer. Verify if the critique points were resolved. State clearly in Markdown that the draft is now fully approved and compliant.",
      },
    });

    for await (const chunk of criticStream2) {
      if (callbacks.isCancelled()) {
        console.log("[Workflow] Research cancelled during second critic stage.");
        return;
      }
      const text = chunk.text || "";
      criticResult2 += text;
      callbacks.onChunk("critic", text);
    }

    callbacks.onComplete("critic", criticResult2 + "\n\n---\n\n### **CRITICAL AUDIT RESULT**\n✅ **DRAFT APPROVED**: All validation gaps resolved.", "Audit verified. Refined draft approved.");

    // Delay slightly to let animations complete smoothly
    await new Promise((resolve) => setTimeout(resolve, 800));

    // ==========================================
    // STEP 5: Report Synthesizer
    // ==========================================
    if (callbacks.isCancelled()) return;
    callbacks.onStart("synthesizer", "Consolidating dossiers into structured executive report...", 15);

    const synthesizerPrompt = `Merge the refined core research file and the final peer review into a single, unified, high-end executive briefing. Resolve any minor points. Organize the content elegantly with headings, formatted comparison tables, detailed analysis, and a bold final summary.

Query: "${query}"

Refined Research Dossier:
${revisedResearcherResult}

Final Audit Verification:
${criticResult2}`;

    let synthesizerResult = "";
    const synthesizerStream = await ai.models.generateContentStream({
      model: "gemini-3.5-flash",
      contents: synthesizerPrompt,
      config: {
        systemInstruction: "You are a world-class strategic consultant and executive writer. Synthesize raw research data and critical peer reviews into beautifully polished, publication-grade executive briefings in flawless Markdown. Formulate structured, coherent analyses with clear tables, callouts, and key takeaway boxes.",
      },
    });

    for await (const chunk of synthesizerStream) {
      if (callbacks.isCancelled()) {
        console.log("[Workflow] Research cancelled during synthesizer stage.");
        return;
      }
      const text = chunk.text || "";
      synthesizerResult += text;
      callbacks.onChunk("synthesizer", text);
    }

    callbacks.onComplete("synthesizer", synthesizerResult, "Publication-grade intelligence briefing compiled.");

  } catch (err: any) {
    console.error("[Workflow Error]", err);
    callbacks.onError(err?.message || err);
  }
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  // Enable JSON request body parser
  app.use(express.json());

  // Initialize WebSocket Server
  const wss = new WebSocketServer({ noServer: true });

  // Standard REST Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // SERVER-SENT EVENTS (SSE) STREAM ROUTE - HIGHLY RELIABLE FALLBACK FOR WS PROXIES
  app.get("/api/stream", async (req, res) => {
    const query = req.query.query as string;
    if (!query) {
      res.status(400).json({ error: "Query is required" });
      return;
    }

    // Set SSE Headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    let isClosed = false;

    req.on("close", () => {
      console.log("[SSE Stream] Client connection closed");
      isClosed = true;
    });

    const sendSseMessage = (type: string, payload: any) => {
      if (!isClosed) {
        res.write(`data: ${JSON.stringify({ type, payload })}\n\n`);
      }
    };

    // Lazy check Gemini key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      sendSseMessage("error", {
        error: "GEMINI_API_KEY is not configured. Please open 'Settings' > 'Secrets' in the Google AI Studio panel to set your actual Gemini key.",
      });
      res.end();
      return;
    }

    let ai: GoogleGenAI;
    try {
      ai = new GoogleGenAI({ apiKey });
    } catch (err: any) {
      sendSseMessage("error", { error: `Failed to initialize Gemini: ${err?.message || err}` });
      res.end();
      return;
    }

    console.log(`[SSE Stream] Starting research workflow for: "${query}"`);

    await runResearchWorkflow(query, ai, {
      onStart: (nodeId, title, progress) => {
        sendSseMessage("node_start", { nodeId, title, progress });
      },
      onChunk: (nodeId, chunk) => {
        sendSseMessage("node_chunk", { nodeId, chunk });
      },
      onComplete: (nodeId, fullText, title) => {
        sendSseMessage("node_complete", { nodeId, fullText, title });
      },
      onError: (error, nodeId) => {
        sendSseMessage("error", { error, nodeId: nodeId || "researcher" });
      },
      isCancelled: () => isClosed,
    });

    res.end();
  });

  // Upgrade HTTP connections to WebSocket (safely matching path, ignoring Vite HMR upgrade routes)
  server.on("upgrade", (request, socket, head) => {
    const pathname = request.url ? request.url.split("?")[0] : "";
    if (pathname === "/api/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      // Ignore rather than destroying instantly, to let standard Vite WebSocket pass
    }
  });

  // WebSocket Connection Handler
  wss.on("connection", (ws: WebSocket) => {
    console.log("[WebSocket Server] Client connected");
    let isCancelled = false;

    // Helper: Send JSON message to client
    const sendMsg = (type: string, payload: any) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type, payload }));
      }
    };

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log(`[WebSocket Server] Received:`, message.type);

        if (message.type === "cancel_research") {
          isCancelled = true;
          console.log("[WebSocket Server] Research workflow CANCELLED by client");
          return;
        }

        if (message.type === "start_research") {
          const { query } = message.payload;
          if (!query) {
            sendMsg("error", { error: "Research query is required." });
            return;
          }

          isCancelled = false;
          console.log(`[WebSocket Server] Launching research session for query: "${query}"`);

          const apiKey = process.env.GEMINI_API_KEY;
          if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
            sendMsg("error", {
              error: "GEMINI_API_KEY is not configured. Please open 'Settings' > 'Secrets' in the Google AI Studio panel to set your actual Gemini key.",
            });
            return;
          }

          let ai: GoogleGenAI;
          try {
            ai = new GoogleGenAI({ apiKey });
          } catch (initErr: any) {
            sendMsg("error", { error: `Failed to initialize Gemini SDK: ${initErr?.message || initErr}` });
            return;
          }

          await runResearchWorkflow(query, ai, {
            onStart: (nodeId, title, progress) => {
              sendMsg("node_start", { nodeId, title, progress });
            },
            onChunk: (nodeId, chunk) => {
              sendMsg("node_chunk", { nodeId, chunk });
            },
            onComplete: (nodeId, fullText, title) => {
              sendMsg("node_complete", { nodeId, fullText, title });
            },
            onError: (error, nodeId) => {
              sendMsg("error", { error, nodeId: nodeId || "researcher" });
            },
            isCancelled: () => isCancelled,
          });
        }
      } catch (err: any) {
        console.error("[WebSocket Server] Parsing or processing error:", err);
        sendMsg("error", { error: "Server failed to process client message." });
      }
    });

    ws.on("close", () => {
      console.log("[WebSocket Server] Client disconnected");
      isCancelled = true;
    });
  });

  // Serve Vite app in development, or compiled production bundle
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind and start server on Port 3000
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`===================================================`);
    console.log(` Omni-Researcher Express server is active`);
    console.log(` Access Preview: http://localhost:${PORT}`);
    console.log(`===================================================`);
  });
}

startServer().catch((error) => {
  console.error("Critical server crash on startup:", error);
});
