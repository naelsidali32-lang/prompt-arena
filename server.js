import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const http = createServer(app);
const io = new Server(http, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// ─── Gemini setup ────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// ─── Game state ──────────────────────────────────────────────────
let gameState = {
  phase: "lobby",
  players: [],
  submissions: [],
  results: null,
  challenge: null,
};

function resetGame() {
  gameState = { phase: "lobby", players: [], submissions: [], results: null, challenge: null };
}

// ─── Evaluation prompt ───────────────────────────────────────────
function buildEvalPrompt(submissions, challengeProblem) {
  const list = submissions
    .map((s) => `Player "${s.player}":\n"""${s.prompt}"""`)
    .join("\n\n---\n\n");

  return `You are a prompt engineering expert. You evaluate prompts using the R.C.O.P. framework:
- **R (Role)**: Does the prompt assign a clear role to the AI? (0-25 pts)
- **C (Context)**: Does the prompt provide enough context? (0-25 pts)
- **O (Objective)**: Is the objective clearly defined? (0-25 pts)
- **P (Parameters)**: Are there constraints like format, tone, or length? (0-25 pts)

You also evaluate:
- **Clarity** (0-10 bonus pts): Is the prompt well-written and unambiguous?
- **Creativity** (0-10 bonus pts): Is the prompt original in its approach?

The challenge given to participants was:
"${challengeProblem}"

For each player, provide:
1. Scores for each R.C.O.P. category
2. A "feedback" field: 1-2 sentences of general encouragement
3. A "detailed_feedback" field: a structured analysis with three sections:
   - "strengths": array of 2-3 specific things the player did well
   - "improvements": array of 2-3 specific things that were missing or could be better
   - "ideal_addition": a single string showing a concrete example of what they could have added to make the prompt stronger

Respond ONLY with valid JSON (no markdown, no backticks, no text before or after), in this exact format:
{
  "evaluations": [
    {
      "player": "<player name>",
      "role_score": <0-25>,
      "context_score": <0-25>,
      "objectif_score": <0-25>,
      "params_score": <0-25>,
      "clarity_bonus": <0-10>,
      "creativity_bonus": <0-10>,
      "total": <sum of all scores>,
      "feedback": "<1-2 sentences of general encouragement in English>",
      "detailed_feedback": {
        "strengths": ["<strength 1>", "<strength 2>"],
        "improvements": ["<improvement 1>", "<improvement 2>"],
        "ideal_addition": "<concrete example of what to add>"
      }
    }
  ]
}

Rank them from best to worst. Be fair, encouraging, and precise.

Here are the ${submissions.length} prompts to evaluate:

${list}`;
}

// ─── Socket.IO ───────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log("Connected:", socket.id);
  socket.emit("game_state", gameState);

  socket.on("player_join", (name) => {
    if (gameState.players.find((p) => p.name === name)) {
      socket.emit("join_error", "This name is already taken!");
      return;
    }
    gameState.players.push({ name, id: socket.id });
    socket.emit("join_success");
    io.emit("game_state", gameState);
    console.log(`Player joined: ${name}`);
  });

  socket.on("submit_prompt", ({ player, prompt }) => {
    gameState.submissions = gameState.submissions.filter((s) => s.player !== player);
    gameState.submissions.push({ player, prompt });
    io.emit("game_state", gameState);
    console.log(`Prompt submitted by: ${player}`);
  });

  // Host selects a challenge and starts
  socket.on("start_challenge", (challenge) => {
    gameState.phase = "challenge";
    gameState.challenge = challenge;
    gameState.submissions = [];
    gameState.results = null;
    io.emit("game_state", gameState);
    console.log(`Challenge started: ${challenge.title}`);
  });

  socket.on("evaluate", async () => {
    if (gameState.submissions.length === 0) return;
    gameState.phase = "evaluating";
    io.emit("game_state", gameState);
    console.log("Evaluating prompts...");

    try {
      const prompt = buildEvalPrompt(gameState.submissions, gameState.challenge.problem);
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const parsed = JSON.parse(clean);

      gameState.results = parsed.evaluations;
      gameState.phase = "results";
      io.emit("game_state", gameState);
      console.log("Evaluation complete");
    } catch (err) {
      console.error("Evaluation error:", err.message);
      gameState.phase = "challenge";
      io.emit("game_state", gameState);
      io.emit("eval_error", "Evaluation failed. Please try again.");
    }
  });

  socket.on("reset_game", () => {
    resetGame();
    io.emit("game_state", gameState);
    console.log("Game reset");
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
  });
});

// ─── Public URL for Codespaces ───────────────────────────────────
app.get("/api/config", (_req, res) => {
  const name = process.env.CODESPACE_NAME;
  const domain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;
  const port = process.env.PORT || 3001;
  let publicUrl = null;
  if (name && domain) {
    publicUrl = `https://${name}-${port}.${domain}`;
  }
  res.json({ publicUrl });
});

// ─── Serve frontend build ────────────────────────────────────────
app.use(express.static(join(__dirname, "dist")));
app.get("*", (_req, res) => {
  res.sendFile(join(__dirname, "dist", "index.html"));
});

// ─── Start ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
http.listen(PORT, () => {
  console.log(`\nRCOP Workshop Server running on http://localhost:${PORT}\n`);
});