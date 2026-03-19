interface TabletFrameProps {
  imgSrc?: string;
  className?: string;
}

export function AlunTabletPortrait({ imgSrc = "/images/alun-illustrated.webp", className }: TabletFrameProps) {
  const W = 300;
  const H = 420;
  const bezel = 14;
  const radius = 30;
  const screenRadius = 10;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: W,
        height: H,
        borderRadius: radius,
        background: "linear-gradient(160deg, #2E2E2E 0%, #111111 100%)",
        boxShadow: `
          0 2px 0px 1px #484848 inset,
          0 -2px 0px 1px #000000 inset,
          0 32px 80px rgba(0,0,0,0.55),
          0 8px 20px rgba(0,0,0,0.35)
        `,
        padding: `${bezel}px ${bezel}px ${bezel + 20}px`,
        boxSizing: "border-box",
        flexShrink: 0,
      }}
    >
      {/* Camera dot */}
      <div
        style={{
          position: "absolute",
          top: 7,
          left: "50%",
          transform: "translateX(-50%)",
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: "#161616",
          border: "1.5px solid #2E2E2E",
          zIndex: 2,
        }}
      />

      {/* Screen */}
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: screenRadius,
          overflow: "hidden",
          background: "#D9F2F2",
          position: "relative",
        }}
      >
        <img
          src={imgSrc}
          alt="Alun Davies-Baker, founder of Altogether Agile"
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center top",
            display: "block",
          }}
        />
        {/* Subtle glare */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 55%)",
            borderRadius: screenRadius,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Home bar */}
      <div
        style={{
          position: "absolute",
          bottom: 8,
          left: "50%",
          transform: "translateX(-50%)",
          width: 80,
          height: 4,
          borderRadius: 2,
          background: "#2E2E2E",
        }}
      />

      {/* Right button - power */}
      <div
        style={{
          position: "absolute",
          right: -3,
          top: 95,
          width: 4,
          height: 36,
          borderRadius: "0 3px 3px 0",
          background: "linear-gradient(180deg, #2E2E2E, #1A1A1A)",
          boxShadow: "2px 0 3px rgba(0,0,0,0.4)",
        }}
      />

      {/* Left buttons - volume */}
      {[62, 108].map((top, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: -3,
            top,
            width: 4,
            height: 28,
            borderRadius: "3px 0 0 3px",
            background: "linear-gradient(180deg, #2E2E2E, #1A1A1A)",
            boxShadow: "-2px 0 3px rgba(0,0,0,0.4)",
          }}
        />
      ))}
    </div>
  );
}

export default AlunTabletPortrait;
