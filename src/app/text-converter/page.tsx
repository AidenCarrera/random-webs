"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Cpu, Settings2, Wifi } from "lucide-react";

import styles from "./styles.module.css";

type HexCase = "upper" | "lower";
type RotVariant = "rot13" | "rot47";
type CopyStatus = "idle" | "copied" | "error";

type TransformDefinition = {
  id: string;
  name: string;
  category: "Encoding" | "Cipher";
  description: string;
  outputName: string;
  outputMeta: string;
  output: string;
  accent: string;
  control: ReactNode;
};

type AccentStyle = CSSProperties & { "--accent": string };

const BASE64_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const encodeUtf8 = (value: string) => new TextEncoder().encode(value);

const toBinary = (value: string, separated: boolean) =>
  Array.from(encodeUtf8(value), (byte) =>
    byte.toString(2).padStart(8, "0"),
  ).join(separated ? " " : "");

const toHex = (value: string, casing: HexCase) => {
  const output = Array.from(encodeUtf8(value), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join(" ");

  return casing === "upper" ? output.toUpperCase() : output;
};

const bytesToBase64 = (bytes: Uint8Array) => {
  let output = "";

  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index];
    const hasSecond = index + 1 < bytes.length;
    const hasThird = index + 2 < bytes.length;
    const second = hasSecond ? bytes[index + 1] : 0;
    const third = hasThird ? bytes[index + 2] : 0;

    output += BASE64_ALPHABET[first >> 2];
    output += BASE64_ALPHABET[((first & 0b11) << 4) | (second >> 4)];
    output += hasSecond
      ? BASE64_ALPHABET[((second & 0b1111) << 2) | (third >> 6)]
      : "=";
    output += hasThird ? BASE64_ALPHABET[third & 0b111111] : "=";
  }

  return output;
};

const toBase64 = (value: string, passes: number) => {
  let output = value;

  for (let pass = 0; pass < passes; pass += 1) {
    output = bytesToBase64(encodeUtf8(output));
  }

  return output;
};

const toCaesar = (value: string, shift: number) =>
  value.replace(/[a-zA-Z]/g, (character) => {
    const base = character <= "Z" ? 65 : 97;
    const offset = character.charCodeAt(0) - base;
    return String.fromCharCode(base + ((((offset + shift) % 26) + 26) % 26));
  });

const toRot = (value: string, variant: RotVariant) => {
  if (variant === "rot13") {
    return toCaesar(value, 13);
  }

  return Array.from(value, (character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint >= 33 && codePoint <= 126
      ? String.fromCodePoint(33 + ((codePoint - 33 + 47) % 94))
      : character;
  }).join("");
};

const reverseGraphemes = (value: string) =>
  Array.from(
    new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(value),
    ({ segment }) => segment,
  )
    .reverse()
    .join("");

const toAtbash = (value: string, reverseResult: boolean) => {
  const substituted = value.replace(/[a-zA-Z]/g, (character) => {
    const base = character <= "Z" ? 65 : 97;
    return String.fromCharCode(base + 25 - (character.charCodeAt(0) - base));
  });

  return reverseResult ? reverseGraphemes(substituted) : substituted;
};

const formatSigned = (value: number) => `${value >= 0 ? "+" : ""}${value}`;

function CopyButton({ text, accent }: { text: string; accent: string }) {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      setStatus("error");
    }

    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setStatus("idle"), 2000);
  };

  const label =
    status === "copied" ? "Copied" : status === "error" ? "Failed" : "Copy";

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!text}
      aria-label={`Copy output${status === "error" ? ". Clipboard access failed" : ""}`}
      className={`${styles.copyButton} ${status === "copied" ? styles.copySuccess : ""} ${status === "error" ? styles.copyError : ""}`}
      style={{ "--accent": accent } as AccentStyle}
    >
      {label}
    </button>
  );
}

function SegmentedControl<T extends string>({
  label,
  value,
  options,
  accent,
  onChange,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  accent: string;
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex shrink-0 border bg-[#050510]/50 p-1"
      style={{ borderColor: `${accent}4d` }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className="min-w-16 px-3 py-1 text-xs font-bold transition-transform duration-150 active:translate-y-px motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2"
            style={
              selected
                ? {
                    color: "#050510",
                    backgroundColor: accent,
                    outlineColor: accent,
                  }
                : { color: accent, outlineColor: accent }
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function ToggleControl({
  label,
  checked,
  accent,
  onChange,
}: {
  label: string;
  checked: boolean;
  accent: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <span className="text-[10px] font-bold uppercase text-gray-400">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className="h-6 w-12 border p-1 transition-transform duration-150 active:translate-y-px motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{
          borderColor: checked ? accent : "#4b5563",
          backgroundColor: checked ? `${accent}33` : "#1f2937",
          outlineColor: accent,
        }}
      >
        <span
          className={`block h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${checked ? "translate-x-6" : "translate-x-0"}`}
          style={{ backgroundColor: checked ? accent : "#6b7280" }}
        />
      </button>
    </div>
  );
}

function RangeControl({
  id,
  label,
  value,
  min,
  max,
  minLabel,
  maxLabel,
  accent,
  formatValue,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
  accent: string;
  formatValue: (value: number) => string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="w-full shrink-0 sm:w-56">
      <div className="mb-2 flex items-center justify-between gap-4">
        <label
          className="text-[10px] font-bold uppercase text-gray-400"
          htmlFor={id}
        >
          {label}
        </label>
        <output
          className="border bg-[#050510]/50 px-2 py-0.5 text-xs font-bold"
          style={{ color: accent, borderColor: `${accent}4d` }}
        >
          {formatValue(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={`${styles.range} h-2 w-full cursor-pointer appearance-none`}
        style={{ "--accent": accent } as AccentStyle}
      />
      <div className="mt-1 flex justify-between text-[10px] text-gray-400">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

function TransformControl({ transform }: { transform: TransformDefinition }) {
  return (
    <section
      aria-labelledby={`${transform.id}-control-title`}
      className={styles.transformPanel}
      style={{ "--accent": transform.accent } as AccentStyle}
    >
      <div className="min-w-0">
        <h3 id={`${transform.id}-control-title`} className={styles.accentText}>
          {transform.name} / {transform.category}
        </h3>
        <p className="mt-1 text-[10px] text-gray-400">
          {transform.description}
        </p>
      </div>
      {transform.control}
    </section>
  );
}

function TransformOutput({ transform }: { transform: TransformDefinition }) {
  return (
    <article
      aria-labelledby={`${transform.id}-output-title`}
      className={styles.outputPanel}
      style={{ "--accent": transform.accent } as AccentStyle}
    >
      <div className="mb-3 flex items-start justify-between gap-3 border-b border-white/10 pb-2">
        <div className="min-w-0">
          <h3
            id={`${transform.id}-output-title`}
            className={`${styles.accentText} wrap-break-word`}
          >
            {transform.outputName}
          </h3>
          <p className="mt-1 text-[10px] text-gray-400">
            {transform.category} / {transform.outputMeta}
          </p>
        </div>
        <CopyButton text={transform.output} accent={transform.accent} />
      </div>
      {transform.output ? (
        <p
          className="break-all font-mono text-xs leading-relaxed tracking-wide"
          style={{ color: transform.accent }}
        >
          {transform.output}
        </p>
      ) : (
        <p className="text-xs text-gray-400">Waiting for input.</p>
      )}
    </article>
  );
}

export default function TextConverter() {
  const [text, setText] = useState("");
  const [caesarShift, setCaesarShift] = useState(3);
  const [binarySeparated, setBinarySeparated] = useState(true);
  const [hexCase, setHexCase] = useState<HexCase>("upper");
  const [base64Passes, setBase64Passes] = useState(1);
  const [reverseAtbash, setReverseAtbash] = useState(false);
  const [rotVariant, setRotVariant] = useState<RotVariant>("rot13");
  const [clipboardMessage, setClipboardMessage] = useState("");

  const outputs = useMemo(
    () => ({
      binary: toBinary(text, binarySeparated),
      hex: toHex(text, hexCase),
      caesar: toCaesar(text, caesarShift),
      base64: toBase64(text, base64Passes),
      atbash: toAtbash(text, reverseAtbash),
      rot: toRot(text, rotVariant),
    }),
    [
      base64Passes,
      binarySeparated,
      caesarShift,
      hexCase,
      reverseAtbash,
      rotVariant,
      text,
    ],
  );

  const byteCount = useMemo(() => encodeUtf8(text).length, [text]);

  const transforms: TransformDefinition[] = [
    {
      id: "binary",
      name: "Binary",
      category: "Encoding",
      description: "UTF-8 byte representation",
      outputName: "Binary",
      outputMeta: `UTF-8 BYTES / ${binarySeparated ? "SPACED" : "CONTIGUOUS"}`,
      output: outputs.binary,
      accent: "#ff00ff",
      control: (
        <ToggleControl
          label="Group bytes"
          checked={binarySeparated}
          accent="#ff00ff"
          onChange={setBinarySeparated}
        />
      ),
    },
    {
      id: "hex",
      name: "Hexadecimal",
      category: "Encoding",
      description: "UTF-8 bytes in base16",
      outputName: "Hexadecimal",
      outputMeta: "UTF-8 / BASE16",
      output: outputs.hex,
      accent: "#00ffff",
      control: (
        <SegmentedControl
          label="Hexadecimal letter casing"
          value={hexCase}
          options={[
            { value: "upper", label: "UPPER" },
            { value: "lower", label: "lower" },
          ]}
          accent="#00ffff"
          onChange={setHexCase}
        />
      ),
    },
    {
      id: "base64",
      name: "Base64",
      category: "Encoding",
      description: "UTF-8 encoding passes",
      outputName: "Base64",
      outputMeta: `UTF-8 / ${base64Passes} ${base64Passes === 1 ? "PASS" : "PASSES"}`,
      output: outputs.base64,
      accent: "#ff9900",
      control: (
        <RangeControl
          id="base64-passes"
          label="Encoding passes"
          value={base64Passes}
          min={1}
          max={5}
          minLabel="1 pass"
          maxLabel="5 passes"
          accent="#ff9900"
          formatValue={(value) => `${value}X`}
          onChange={setBase64Passes}
        />
      ),
    },
    {
      id: "caesar",
      name: "Caesar",
      category: "Cipher",
      description: "ASCII letter shift",
      outputName: "Caesar_Cipher",
      outputMeta: `SHIFT ${formatSigned(caesarShift)} / ASCII LETTERS`,
      output: outputs.caesar,
      accent: "#ffff00",
      control: (
        <RangeControl
          id="caesar-shift"
          label="Letter shift"
          value={caesarShift}
          min={-26}
          max={26}
          minLabel="-26"
          maxLabel="+26"
          accent="#ffff00"
          formatValue={formatSigned}
          onChange={setCaesarShift}
        />
      ),
    },
    {
      id: "atbash",
      name: "Atbash",
      category: "Cipher",
      description: "ASCII letter substitution",
      outputName: "Atbash",
      outputMeta: reverseAtbash
        ? "ASCII LETTERS / REVERSED BY GRAPHEME"
        : "ASCII LETTERS / STANDARD ORDER",
      output: outputs.atbash,
      accent: "#ff0000",
      control: (
        <ToggleControl
          label="Reverse output"
          checked={reverseAtbash}
          accent="#ff0000"
          onChange={setReverseAtbash}
        />
      ),
    },
    {
      id: "rot",
      name: "ROT",
      category: "Cipher",
      description: "ASCII substitution variant",
      outputName: "ROT_Cipher",
      outputMeta:
        rotVariant === "rot13"
          ? "ROT13 / ASCII LETTERS"
          : "ROT47 / ASCII CODE POINTS 33-126",
      output: outputs.rot,
      accent: "#0099ff",
      control: (
        <SegmentedControl
          label="ROT transform variant"
          value={rotVariant}
          options={[
            { value: "rot13", label: "ROT13" },
            { value: "rot47", label: "ROT47" },
          ]}
          accent="#0099ff"
          onChange={setRotVariant}
        />
      ),
    },
  ];

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      setText(clipboardText);
      setClipboardMessage(
        clipboardText ? "Clipboard text pasted." : "The clipboard is empty.",
      );
    } catch {
      setClipboardMessage(
        "Clipboard access was blocked. Use your system paste shortcut.",
      );
    }
  };

  return (
    <main
      className={`${styles.root} relative min-h-dvh overflow-hidden bg-[#050510] p-4 font-mono text-[#00ff9d] sm:p-8`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,255,157,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,157,0.05)_1px,transparent_1px)] bg-size-[50px_50px]" />
      <div className="pointer-events-none absolute top-0 left-0 h-32 w-full bg-[#00ff9d]/4 blur-[100px]" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-96 w-96 bg-[#ff00ff]/4 blur-[120px]" />

      <div className="relative z-10 mx-auto grid max-w-7xl gap-8 pt-6 lg:grid-cols-2 lg:gap-12 lg:pt-10">
        <section
          aria-labelledby="input-heading"
          className="space-y-8 border border-[#00ff9d]/20 bg-[#0a0a1f]/50 p-4 sm:p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-center gap-4 text-[#ff00ff]">
              <Cpu
                className="h-9 w-9 shrink-0 drop-shadow-[0_0_3px_rgba(255,0,255,0.5)] sm:h-10 sm:w-10"
                aria-hidden="true"
              />
              <div>
                <h1
                  id="input-heading"
                  className="text-3xl font-bold tracking-tighter drop-shadow-[0_0_6px_rgba(255,0,255,0.4)] sm:text-4xl"
                >
                  TEXT_CONVERTER
                </h1>
                <p className="mt-1 max-w-md text-[11px] leading-relaxed text-gray-400">
                  Convert text between common encodings and explore classic
                  ciphers. Designed for learning and experimentation, not secure
                  encryption.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={handlePaste}
                className="border border-[#ff00ff]/40 px-3 py-1 text-xs font-bold text-[#ff00ff] transition-transform hover:bg-[#ff00ff] hover:text-[#050510] active:translate-y-px motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff00ff]"
              >
                Paste
              </button>
              <button
                type="button"
                onClick={() => {
                  setText("");
                  setClipboardMessage("");
                }}
                disabled={!text}
                className="border border-gray-800 px-3 py-1 text-xs font-bold text-gray-400 transition-transform hover:border-[#ff00ff]/50 hover:text-[#ff00ff] active:translate-y-px motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff00ff] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Clear
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="source-text" className="sr-only">
              Text to convert
            </label>
            <textarea
              id="source-text"
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                setClipboardMessage("");
              }}
              className="h-48 w-full resize-y border border-[#00ff9d]/30 bg-[#0a0a1f] p-4 font-mono text-lg tracking-wide text-white/90 outline-none transition-colors placeholder:text-gray-400 focus:border-[#00ff9d] focus:bg-[#0a0a24]/80 motion-reduce:transition-none sm:p-6 sm:text-xl"
              placeholder="Enter text to convert..."
              spellCheck={false}
            />
            <p
              role="status"
              aria-live="polite"
              className={`mt-2 min-h-4 text-[10px] ${clipboardMessage ? "text-[#ff00ff]" : "text-gray-400"}`}
            >
              {clipboardMessage ||
                `${byteCount} UTF-8 ${byteCount === 1 ? "byte" : "bytes"}`}
            </p>
          </div>

          <div className="space-y-4">
            <div className="mb-2 flex items-center gap-2 border-b border-[#00ff9d]/30 pb-2">
              <Settings2
                className="h-5 w-5 text-[#00ff9d]"
                aria-hidden="true"
              />
              <h2 className="text-sm font-bold tracking-widest text-[#00ff9d]/80 drop-shadow-[0_0_2px_rgba(0,255,157,0.3)]">
                CONVERSION_SETTINGS
              </h2>
            </div>
            {transforms.map((transform) => (
              <TransformControl key={transform.id} transform={transform} />
            ))}
          </div>
        </section>

        <section
          aria-labelledby="output-heading"
          className="space-y-6 lg:max-h-[calc(100dvh-5rem)] lg:overflow-y-auto lg:pr-2"
        >
          <div className="top-0 z-20 mb-4 flex items-center gap-4 border-b border-[#00ff9d]/20 bg-[#050510]/95 py-2 text-[#00ff9d] lg:sticky">
            <Wifi
              className="h-6 w-6 drop-shadow-[0_0_3px_rgba(0,255,157,0.5)]"
              aria-hidden="true"
            />
            <h2
              id="output-heading"
              className="text-xl font-bold tracking-widest drop-shadow-[0_0_4px_rgba(0,255,157,0.4)] sm:text-2xl"
            >
              CONVERSION_OUTPUTS
            </h2>
          </div>

          <div className="grid gap-6">
            {transforms.map((transform) => (
              <TransformOutput key={transform.id} transform={transform} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
