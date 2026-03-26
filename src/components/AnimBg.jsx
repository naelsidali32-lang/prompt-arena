export default function AnimBg() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          width: "120vw",
          height: "120vh",
          top: "-10vh",
          left: "-10vw",
          background: `
            radial-gradient(ellipse at 20% 30%, rgba(124,58,237,0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 75% 60%, rgba(167,139,250,0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 90%, rgba(99,32,222,0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 85% 15%, rgba(139,92,246,0.12) 0%, transparent 40%)
          `,
          animation: "bgShift 20s ease-in-out infinite alternate",
        }}
      />
    </div>
  );
}