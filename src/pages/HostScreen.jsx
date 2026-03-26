import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { socket } from "../socket";
import { CHALLENGES } from "../config";
import AnimBg from "../components/AnimBg";
import Confetti from "../components/Confetti";
import Medal from "../components/Medal";
import ScoreBar from "../components/ScoreBar";

export default function HostScreen() {
  const [game, setGame] = useState({
    phase: "lobby",
    players: [],
    submissions: [],
    results: null,
    challenge: null,
  });
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [error, setError] = useState(null);
  const [playerUrl, setPlayerUrl] = useState("");

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        const base = data.publicUrl || window.location.origin;
        setPlayerUrl(`${base}/play`);
      })
      .catch(() => {
        setPlayerUrl(`${window.location.origin}/play`);
      });
  }, []);

  useEffect(() => {
    const onState = (state) => {
      setGame(state);
      if (state.phase === "results" && state.results) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    };
    const onError = (msg) => {
      setError(msg);
      setTimeout(() => setError(null), 4000);
    };
    socket.on("game_state", onState);
    socket.on("eval_error", onError);
    return () => {
      socket.off("game_state", onState);
      socket.off("eval_error", onError);
    };
  }, []);

  const startChallenge = () => {
    if (!selectedChallenge) return;
    socket.emit("start_challenge", selectedChallenge);
  };

  const { phase, players, submissions, results, challenge } = game;

  return (
    <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      <AnimBg />
      <Confetti active={showConfetti} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {/* HEADER */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="mono" style={{ fontSize: 13, fontWeight: 600, letterSpacing: 4, textTransform: "uppercase", color: "var(--violet-light)", marginBottom: 8 }}>
            Alstom Innovation · Breakfast Workshop
          </div>
          <h1 className="title" style={{ fontSize: 56, fontWeight: 800, margin: 0, lineHeight: 1.1, color: "#ffffff" }}>
            Prompt Arena
          </h1>
          <p style={{ color: "#aabbcc", fontSize: 16, marginTop: 8, fontWeight: 300 }}>
            Master the art of prompting with the <span style={{ color: "#ffffff", fontWeight: 600 }}>R.C.O.P.</span> framework
          </p>
        </div>

        {error && (
          <div style={{
            background: "rgba(229,32,46,0.15)", border: "1px solid rgba(229,32,46,0.3)",
            borderRadius: 12, padding: "12px 20px", textAlign: "center", marginBottom: 20, color: "#ff6b6b", fontSize: 14,
          }}>
            {error}
          </div>
        )}

        {/* ─── LOBBY ─── */}
        {phase === "lobby" && (
          <div style={{ animation: "fadeUp 0.6s ease-out", textAlign: "center" }}>
            {/* QR Code */}
            <div className="card" style={{ maxWidth: 600, margin: "0 auto 32px", padding: "40px 32px", borderRadius: 24 }}>
              <p className="mono" style={{ color: "#aabbcc", fontSize: 14, marginBottom: 20 }}>
                Scan to join the game
              </p>
              <div style={{ background: "#fff", padding: 20, borderRadius: 16, display: "inline-block" }}>
                <QRCodeSVG value={playerUrl || "loading..."} size={220} bgColor="#ffffff" fgColor="#001E3C" level="M" />
              </div>
              <p className="mono" style={{ color: "#667788", fontSize: 11, marginTop: 16, wordBreak: "break-all" }}>
                {playerUrl}
              </p>
            </div>

            {/* Players */}
            <div className="card" style={{ maxWidth: 600, margin: "0 auto 32px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--violet-light)", animation: "dotBlink 1.5s ease-in-out infinite" }} />
                <span style={{ color: "#ffffff", fontWeight: 600, fontSize: 18 }}>
                  {players.length} player{players.length !== 1 ? "s" : ""} connected
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {players.map((p, i) => (
                  <span key={p.name} style={{
                    background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)",
                    borderRadius: 20, padding: "6px 16px", fontSize: 14, color: "var(--violet-light)",
                    fontWeight: 600, animation: `fadeUp 0.4s ${i * 0.1}s ease-out both`,
                  }}>
                    {p.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Challenge selector */}
            <div className="card" style={{ maxWidth: 600, margin: "0 auto 32px" }}>
              <p className="mono" style={{ color: "#aabbcc", fontSize: 13, marginBottom: 16, letterSpacing: 1, textTransform: "uppercase" }}>
                Choose a challenge
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {CHALLENGES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedChallenge(c)}
                    style={{
                      background: selectedChallenge?.id === c.id
                        ? "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(0,51,160,0.15))"
                        : "rgba(255,255,255,0.03)",
                      border: `2px solid ${selectedChallenge?.id === c.id ? "var(--violet-light)" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: 16, padding: "16px 20px", textAlign: "left",
                      color: "#ffffff", transition: "all 0.3s", cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
                      {selectedChallenge?.id === c.id ? "✦ " : ""}{c.title}
                    </div>
                    <div style={{ fontSize: 13, color: "#aabbcc", lineHeight: 1.5 }}>
                      {c.problem}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startChallenge}
              disabled={players.length === 0 || !selectedChallenge}
              style={{
                background: players.length > 0 && selectedChallenge ? "linear-gradient(135deg, var(--blue), var(--violet))" : "#1a3050",
                color: "#fff", borderRadius: 14, padding: "16px 48px", fontSize: 18, fontWeight: 700,
                letterSpacing: 1, boxShadow: players.length > 0 && selectedChallenge ? "0 4px 30px rgba(124,58,237,0.3)" : "none",
              }}
            >
              🚀 Start Challenge
            </button>
          </div>
        )}

        {/* ─── CHALLENGE ─── */}
        {phase === "challenge" && challenge && (
          <div style={{ animation: "fadeUp 0.6s ease-out", textAlign: "center" }}>
            <div style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(0,51,160,0.08))",
              border: "1px solid rgba(124,58,237,0.15)", borderRadius: 24,
              padding: "48px 40px", maxWidth: 800, margin: "0 auto 32px",
              animation: "pulse 4s ease-in-out infinite",
            }}>
              <div className="mono" style={{ fontSize: 12, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: "var(--violet-light)", marginBottom: 8 }}>
                {challenge.title}
              </div>
              <div className="mono" style={{ fontSize: 11, color: "#667788", marginBottom: 16 }}>
                🎯 Challenge
              </div>
              <p style={{ fontSize: 24, lineHeight: 1.5, fontWeight: 400, color: "#ffffff", margin: 0 }}>
                {challenge.problem}
              </p>
              <p className="mono" style={{ fontSize: 14, color: "var(--violet-light)", marginTop: 20, fontWeight: 400 }}>
                💡 {challenge.hint}
              </p>
            </div>

            <div className="card" style={{ maxWidth: 600, margin: "0 auto 32px" }}>
              <p className="mono" style={{ color: "#aabbcc", fontSize: 14, marginBottom: 12 }}>
                Responses received: <span style={{ color: "#ffffff", fontWeight: 600 }}>{submissions.length}</span> / {players.length}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {players.map((p) => {
                  const done = submissions.find((s) => s.player === p.name);
                  return (
                    <span key={p.name} style={{
                      background: done ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${done ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: 20, padding: "6px 16px", fontSize: 13,
                      color: done ? "var(--violet-light)" : "#667788", fontWeight: 600, transition: "all 0.4s",
                    }}>
                      {done ? "✓ " : ""}{p.name}
                    </span>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => socket.emit("evaluate")}
              disabled={submissions.length === 0}
              style={{
                background: submissions.length > 0 ? "linear-gradient(135deg, var(--blue), var(--violet))" : "#1a3050",
                color: "#fff", borderRadius: 14, padding: "16px 48px", fontSize: 18, fontWeight: 700,
                letterSpacing: 1, boxShadow: submissions.length > 0 ? "0 4px 30px rgba(124,58,237,0.3)" : "none",
              }}
            >
              🤖 Evaluate Prompts
            </button>
          </div>
        )}

        {/* ─── EVALUATING ─── */}
        {phase === "evaluating" && (
          <div style={{ animation: "fadeUp 0.6s ease-out", textAlign: "center", paddingTop: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 24, animation: "pulse 1.5s ease-in-out infinite" }}>🧠</div>
            <h2 className="title" style={{ fontWeight: 600, fontSize: 28, marginBottom: 12, color: "#ffffff" }}>
              AI is analyzing your prompts...
            </h2>
            <p className="mono" style={{ color: "#aabbcc", fontSize: 14 }}>R.C.O.P. evaluation in progress</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 24 }}>
              {["R", "C", "O", "P"].map((l, i) => (
                <span key={l} className="mono" style={{
                  display: "inline-block", width: 44, height: 44, lineHeight: "44px", borderRadius: 10,
                  background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)",
                  color: "var(--violet-light)", fontWeight: 700, fontSize: 18,
                  animation: `dotBlink 1.2s ${i * 0.2}s ease-in-out infinite`,
                }}>
                  {l}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ─── RESULTS ─── */}
        {phase === "results" && results && (
          <div style={{ animation: "fadeUp 0.6s ease-out" }}>
            <h2 className="title" style={{ textAlign: "center", fontWeight: 800, fontSize: 36, marginBottom: 32, color: "#ffffff" }}>
              🏆 Final Ranking
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {results.map((r, i) => (
                <div key={r.player} style={{
                  background: i === 0 ? "linear-gradient(135deg, rgba(124,58,237,0.1), rgba(167,139,250,0.06))" : "var(--card)",
                  border: `1px solid ${i === 0 ? "rgba(124,58,237,0.25)" : "var(--border)"}`,
                  borderRadius: 20, padding: "24px 28px",
                  animation: `fadeUp 0.5s ${i * 0.12}s ease-out both`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                    <Medal rank={i + 1} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 700, fontSize: 22, color: "#ffffff" }}>{r.player}</span>
                      <span className="mono" style={{ marginLeft: 12, fontWeight: 700, fontSize: 20, color: "var(--violet-light)" }}>
                        {r.total} pts
                      </span>
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <ScoreBar label="R" score={r.role_score} max={25} color="#7c3aed" delay={i * 0.12} />
                    <ScoreBar label="C" score={r.context_score} max={25} color="#0033a0" delay={i * 0.12 + 0.1} />
                    <ScoreBar label="O" score={r.objectif_score} max={25} color="#a78bfa" delay={i * 0.12 + 0.2} />
                    <ScoreBar label="P" score={r.params_score} max={25} color="#818cf8" delay={i * 0.12 + 0.3} />
                  </div>

                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <span className="tag" style={{ background: "rgba(124,58,237,0.1)", color: "var(--violet-light)" }}>
                      Clarity +{r.clarity_bonus}
                    </span>
                    <span className="tag" style={{ background: "rgba(167,139,250,0.1)", color: "#a78bfa" }}>
                      Creativity +{r.creativity_bonus}
                    </span>
                  </div>

                  <p style={{ color: "#aabbcc", fontSize: 14, fontStyle: "italic", margin: 0, lineHeight: 1.5 }}>
                    "{r.feedback}"
                  </p>

                  {submissions.find((s) => s.player === r.player) && (
                    <details style={{ marginTop: 12 }}>
                      <summary className="mono" style={{ color: "#667788", fontSize: 12, cursor: "pointer" }}>
                        View prompt
                      </summary>
                      <p className="mono" style={{
                        background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: 16, marginTop: 8,
                        color: "#ccc", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word",
                      }}>
                        {submissions.find((s) => s.player === r.player)?.prompt}
                      </p>
                    </details>
                  )}
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center", marginTop: 40 }}>
              <button onClick={() => { setSelectedChallenge(null); socket.emit("reset_game"); }} style={{
                background: "rgba(124,58,237,0.1)", color: "#aabbcc", border: "1px solid var(--border)",
                borderRadius: 14, padding: "12px 36px", fontSize: 15, fontWeight: 600,
              }}>
                🔄 New Game
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}