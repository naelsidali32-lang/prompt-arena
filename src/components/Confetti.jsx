export default function Confetti({ active }) {
  if (!active) return null;
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    dur: 2 + Math.random() * 2,
    color: ["#7c3aed", "#a78bfa", "#0033A0", "#818cf8", "#c4b5fd", "#4f46e5"][i % 6],
    size: 6 + Math.random() * 8,
    rot: Math.random() * 360,
  }));
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, pointerEvents: "none", overflow: "hidden" }}>
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: -20,
            width: p.size,
            height: p.size * 0.6,
            background: p.color,
            borderRadius: 2,
            transform: `rotate(${p.rot}deg)`,
            animation: `confettiFall ${p.dur}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}