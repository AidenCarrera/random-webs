export type Waveform = "sine" | "triangle" | "square" | "sawtooth";

const CYCLE = 40;

/** One period of each waveform, drawn in a 40×20 box around y = 10. */
function cyclePath(type: Waveform, offset: number) {
  const x = (value: number) => (offset + value).toFixed(2);

  switch (type) {
    case "sine": {
      let d = "";
      for (let step = 0; step <= 20; step++) {
        const t = step / 20;
        const y = 10 - Math.sin(t * Math.PI * 2) * 8;
        d += `${step === 0 ? "M" : "L"}${x(t * CYCLE)} ${y.toFixed(2)} `;
      }
      return d;
    }
    case "triangle":
      return `M${x(0)} 10 L${x(10)} 2 L${x(30)} 18 L${x(40)} 10 `;
    case "square":
      return `M${x(0)} 10 L${x(0)} 2 L${x(20)} 2 L${x(20)} 18 L${x(40)} 18 L${x(40)} 10 `;
    case "sawtooth":
      return `M${x(0)} 10 L${x(20)} 2 L${x(20)} 18 L${x(40)} 10 `;
  }
}

export function wavePath(type: Waveform, cycles: number) {
  return Array.from({ length: cycles }, (_, index) =>
    cyclePath(type, index * CYCLE),
  ).join("");
}

/** A single-cycle glyph used on the waveform buttons. */
export function WaveGlyph({
  type,
  className = "",
}: {
  type: Waveform;
  className?: string;
}) {
  return (
    <svg
      viewBox="-2 0 44 20"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={wavePath(type, 1)} />
    </svg>
  );
}
