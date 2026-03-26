export default function Medal({ rank }) {
  const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };
  if (!medals[rank]) {
    return (
      <span className="mono" style={{ color: "#556", fontSize: 18, minWidth: 36, display: "inline-block", textAlign: "center" }}>
        #{rank}
      </span>
    );
  }
  return (
    <span style={{ fontSize: 32, lineHeight: 1, minWidth: 36, display: "inline-block", textAlign: "center" }}>
      {medals[rank]}
    </span>
  );
}