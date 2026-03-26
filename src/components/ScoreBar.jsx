export default function ScoreBar({ label, score, max, color, delay = 0 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
      <span className="mono" style={{ width: 22, fontSize: 11, color: "#889", fontWeight: 600, textAlign: "right" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 10, background: "rgba(255,255,255,0.06)", borderRadius: 5, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            borderRadius: 5,
            background: `linear-gradient(90deg, ${color}, ${color}aa)`,
            width: `${(score / max) * 100}%`,
            animation: `barGrow 0.8s ${delay}s ease-out both`,
          }}
        />
      </div>
      <span className="mono" style={{ width: 28, fontSize: 12, color: "#ccc", textAlign: "right" }}>
        {score}
      </span>
    </div>
  );
}