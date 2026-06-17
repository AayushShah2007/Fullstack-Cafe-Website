const leftLines = [1, 2, 3, 4, 5]
const centerLines = [1, 2, 3, 4, 5]

export default function DriftLines() {
  return (
    <>
      {leftLines.map((i) => (
        <div
          key={"l" + i}
          className={"drift-l-" + i + " absolute pointer-events-none"}
          style={{
            top: (i * 18 + 5) + "%",
            left: "-10px",
            width: "220px",
            height: "1.5px",
            background: "linear-gradient(90deg, transparent, rgba(212, 160, 106, 0.5), transparent)",
            transform: "rotate(28deg)",
            transformOrigin: "left center",
            opacity: 0,
            zIndex: 0,
          }}
        />
      ))}
      {centerLines.map((i) => (
        <div
          key={"c" + i}
          className={"drift-c-" + i + " absolute pointer-events-none"}
          style={{
            top: "-10px",
            left: (38 + i * 5) + "%",
            width: "200px",
            height: "1.5px",
            background: "linear-gradient(90deg, transparent, rgba(212, 160, 106, 0.4), transparent)",
            transform: "rotate(-35deg)",
            transformOrigin: "right center",
            opacity: 0,
            zIndex: 0,
          }}
        />
      ))}
    </>
  )
}
