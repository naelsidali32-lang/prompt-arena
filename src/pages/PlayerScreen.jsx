import { useState, useEffect } from "react";
import { socket } from "../socket";
import Medal from "../components/Medal";
import ScoreBar from "../components/ScoreBar";

export default function PlayerScreen() {
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [game, setGame] = useState({
    phase: "lobby",
    players: [],
    submissions: [],
    results: null,
    challenge: null,
  });
  const [joinError, setJoinError] = useState(null);

  useEffect(() => {
    const onState = (state) => {
      setGame(state);
      if (state.phase === "lobby") {
        setSubmitted(false);
        setPrompt("");
      }
    };
    const onSuccess = () => setJoined(true);
    const onError = (msg) => {
      setJoined(false);
      setJoinError(msg);
      setTimeout(() => setJoinError(null), 3000);
    };

    socket.on("game_state", onState);
    socket.on("join_success", onSuccess);
    socket.on("join_error", onError);
    return () => {
      socket.off("game_state", onState);
      socket.off("join_success", onSuccess);
      socket.off("join_error", onError);
    };
  }, []);

  const joinGame = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    socket.emit("player_join", trimmed);
  };

  const submitPrompt = () => {
    if (!prompt.trim()) return;
    socket.emit("submit_prompt", { player: name.trim(), prompt: prompt.trim() });
    setSubmitted(true);
  };

  const { phase, results, challenge } = game;
  const myResult = results && results.find((r) => r.player === name.trim());
  const myRank = results ? results.findIndex((r) => r.player === name.trim()) + 1 : 0;
  const df = myResult?.detailed_feedback;

  return (
    <div style={{
      minHeight: "100dvh", background: "var(--dark)",
      display: "flex", flexDirection: "column", padding: "24px 20px",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div className="mono" style={{ fontSize: 11, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: "var(--violet-light)", marginBottom: 4 }}>
          Prompt Arena
        </div>
        <h2 className="title" style={{ fontWeight: 700, fontSize: 20, margin: 0, color: "#ffffff" }}>
          R.C.O.P. Workshop
        </h2>
      </div>

      {/* ─── JOIN ─── */}
      {!joined && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", animation: "fadeUp 0.5s ease-out" }}>
          <div className="card">
            <label style={{ fontSize: 14, color: "#aabbcc", fontWeight: 600, display: "block", marginBottom: 8 }}>
              Your name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && joinGame()}
              placeholder="e.g. Nael"
              style={{
                width: "100%", padding: "14px 16px", fontSize: 18, borderRadius: 12,
                background: "rgba(0,0,0,0.3)", border: "1px solid rgba(124,58,237,0.2)",
                color: "#ffffff", fontFamily: "Outfit, sans-serif", boxSizing: "border-box",
              }}
            />
            {joinError && (
              <p style={{ color: "#ff6b6b", fontSize: 13, marginTop: 8 }}>{joinError}</p>
            )}
            <button
              onClick={joinGame}
              disabled={!name.trim()}
              style={{
                width: "100%", marginTop: 16, padding: 14,
                background: name.trim() ? "linear-gradient(135deg, var(--blue), var(--violet))" : "#1a3050",
                color: "#fff", borderRadius: 12, fontSize: 16, fontWeight: 700,
              }}
            >
              Join ✨
            </button>
          </div>
        </div>
      )}

      {/* ─── WAITING ─── */}
      {joined && phase === "lobby" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", animation: "fadeUp 0.5s ease-out" }}>
          <div style={{ fontSize: 48, marginBottom: 16, animation: "pulse 2s ease-in-out infinite" }}>⏳</div>
          <p style={{ color: "#ffffff", fontSize: 16, textAlign: "center" }}>
            Welcome <span style={{ color: "var(--violet-light)", fontWeight: 700 }}>{name}</span>!
          </p>
          <p style={{ color: "#667788", fontSize: 14, textAlign: "center" }}>
            Waiting for the host to start...
          </p>
        </div>
      )}

      {/* ─── PROMPT INPUT ─── */}
      {joined && phase === "challenge" && !submitted && challenge && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", animation: "fadeUp 0.5s ease-out" }}>
          <div style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.06), rgba(0,51,160,0.06))",
            border: "1px solid rgba(124,58,237,0.12)", borderRadius: 16, padding: 20, marginBottom: 16,
          }}>
            <div className="mono" style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: "var(--violet-light)", marginBottom: 8 }}>
              🎯 {challenge.title}
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.5, color: "#ffffff" }}>
              {challenge.problem}
            </p>
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {[
              { l: "R", t: "Role", c: "#7c3aed" },
              { l: "C", t: "Context", c: "#0033a0" },
              { l: "O", t: "Objective", c: "#a78bfa" },
              { l: "P", t: "Parameters", c: "#818cf8" },
            ].map(({ l, t, c }) => (
              <span key={l} className="mono" style={{
                background: `${c}22`, color: c, fontSize: 10, padding: "3px 8px", borderRadius: 6, fontWeight: 700,
              }}>
                {l}·{t}
              </span>
            ))}
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={"Write your prompt here...\n\nRemember to include a Role, Context, a clear Objective, and format Parameters."}
            rows={8}
            style={{
              width: "100%", padding: 16, fontSize: 15, borderRadius: 14,
              background: "rgba(0,0,0,0.3)", border: "1px solid rgba(124,58,237,0.2)",
              color: "#ffffff", fontFamily: "Outfit, sans-serif", resize: "vertical",
              lineHeight: 1.6, boxSizing: "border-box", flex: 1, minHeight: 160,
            }}
          />

          <button
            onClick={submitPrompt}
            disabled={!prompt.trim()}
            style={{
              width: "100%", marginTop: 16, padding: 14,
              background: prompt.trim() ? "linear-gradient(135deg, var(--blue), var(--violet))" : "#1a3050",
              color: "#fff", borderRadius: 12, fontSize: 16, fontWeight: 700,
              boxShadow: prompt.trim() ? "0 4px 20px rgba(124,58,237,0.3)" : "none",
            }}
          >
            Submit Prompt 🚀
          </button>
        </div>
      )}

      {/* ─── SUBMITTED ─── */}
      {joined && phase === "challenge" && submitted && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", animation: "fadeUp 0.5s ease-out" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <p style={{ color: "#ffffff", fontSize: 18, fontWeight: 700, textAlign: "center" }}>
            Prompt submitted!
          </p>
          <p style={{ color: "#667788", fontSize: 14, textAlign: "center" }}>
            Waiting for evaluation...
          </p>
        </div>
      )}

      {/* ─── EVALUATING ─── */}
      {joined && phase === "evaluating" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", animation: "fadeUp 0.5s ease-out" }}>
          <div style={{ fontSize: 48, marginBottom: 16, animation: "pulse 1.5s ease-in-out infinite" }}>🧠</div>
          <p style={{ color: "#aabbcc", fontSize: 16, textAlign: "center" }}>
            AI is analyzing the prompts...
          </p>
        </div>
      )}

      {/* ─── RESULTS ─── */}
      {joined && phase === "results" && myResult && (
        <div style={{ flex: 1, animation: "fadeUp 0.5s ease-out", overflowY: "auto" }}>
          {/* Score header */}
          <div style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(167,139,250,0.04))",
            border: "1px solid rgba(124,58,237,0.2)", borderRadius: 20, padding: 24,
            textAlign: "center", marginBottom: 20,
          }}>
            <Medal rank={myRank} />
            <div className="mono" style={{ fontSize: 42, fontWeight: 800, color: "#ffffff", marginTop: 8 }}>
              {myResult.total} pts
            </div>
            <p style={{ color: "#aabbcc", fontSize: 13, margin: "8px 0 0" }}>
              {myRank}{myRank === 1 ? "st" : myRank === 2 ? "nd" : myRank === 3 ? "rd" : "th"} out of {results.length}
            </p>
          </div>

          {/* Score bars */}
          <div className="card" style={{ marginBottom: 16 }}>
            <ScoreBar label="R" score={myResult.role_score} max={25} color="#7c3aed" delay={0} />
            <ScoreBar label="C" score={myResult.context_score} max={25} color="#0033a0" delay={0.1} />
            <ScoreBar label="O" score={myResult.objectif_score} max={25} color="#a78bfa" delay={0.2} />
            <ScoreBar label="P" score={myResult.params_score} max={25} color="#818cf8" delay={0.3} />

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <span className="tag" style={{ background: "rgba(124,58,237,0.1)", color: "var(--violet-light)" }}>
                Clarity +{myResult.clarity_bonus}
              </span>
              <span className="tag" style={{ background: "rgba(167,139,250,0.1)", color: "#a78bfa" }}>
                Creativity +{myResult.creativity_bonus}
              </span>
            </div>
          </div>

          {/* Detailed feedback */}
          {df && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Strengths */}
              <div style={{
                background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)",
                borderRadius: 16, padding: 20,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 18 }}>✅</span>
                  <span style={{ fontWeight: 700, fontSize: 15, color: "#ffffff" }}>What you did well</span>
                </div>
                {df.strengths && df.strengths.map((s, i) => (
                  <div key={i} style={{
                    background: "rgba(124,58,237,0.08)", borderRadius: 10, padding: "10px 14px",
                    marginBottom: 8, color: "#ddd", fontSize: 14, lineHeight: 1.5,
                  }}>
                    {s}
                  </div>
                ))}
              </div>

              {/* Improvements */}
              <div style={{
                background: "rgba(167,139,250,0.04)", border: "1px solid rgba(167,139,250,0.12)",
                borderRadius: 16, padding: 20,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 18 }}>🔧</span>
                  <span style={{ fontWeight: 700, fontSize: 15, color: "#ffffff" }}>What to improve</span>
                </div>
                {df.improvements && df.improvements.map((s, i) => (
                  <div key={i} style={{
                    background: "rgba(167,139,250,0.06)", borderRadius: 10, padding: "10px 14px",
                    marginBottom: 8, color: "#ddd", fontSize: 14, lineHeight: 1.5,
                  }}>
                    {s}
                  </div>
                ))}
              </div>

              {/* Ideal addition */}
              {df.ideal_addition && (
                <div style={{
                  background: "linear-gradient(135deg, rgba(0,51,160,0.08), rgba(124,58,237,0.08))",
                  border: "1px solid rgba(124,58,237,0.15)",
                  borderRadius: 16, padding: 20,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 18 }}>💡</span>
                    <span style={{ fontWeight: 700, fontSize: 15, color: "#ffffff" }}>What you could have added</span>
                  </div>
                  <div style={{
                    background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "12px 14px",
                    color: "var(--violet-light)", fontSize: 14, lineHeight: 1.6, fontStyle: "italic",
                  }}>
                    "{df.ideal_addition}"
                  </div>
                </div>
              )}
            </div>
          )}

          {/* General feedback */}
          {!df && (
            <div className="card">
              <p style={{ color: "#aabbcc", fontSize: 14, fontStyle: "italic", lineHeight: 1.5 }}>
                "{myResult.feedback}"
              </p>
            </div>
          )}
        </div>
      )}

      {joined && phase === "results" && !myResult && (
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <p style={{ color: "#aabbcc", textAlign: "center" }}>Results are on the big screen! 🎉</p>
        </div>
      )}
    </div>
  );
}