"use client";

import { useState } from "react";
import { Cpu, Wifi, Settings2 } from "lucide-react";

import styles from "./styles.module.css";

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className={`px-2.5 py-0.5 text-[10px] font-bold border rounded-none transition-all cursor-pointer ${
        copied
          ? "bg-[#00ff9d] text-black border-[#00ff9d]"
          : "text-gray-500 border-gray-800 hover:text-[#00ff9d] hover:border-[#00ff9d]/50"
      }`}
    >
      {copied ? "COPIED" : "COPY"}
    </button>
  );
};

export default function TextEncrypt() {
  const [text, setText] = useState("CYBERPUNK");

  const [caesarShift, setCaesarShift] = useState(3);
  const [binarySep, setBinarySep] = useState(true);
  const [hexCase, setHexCase] = useState<"upper" | "lower">("upper");
  const [base64Iter, setBase64Iter] = useState(1);
  const [atbashMirror, setAtbashMirror] = useState(false);
  const [rotVariant, setRotVariant] = useState<"rot13" | "rot47">("rot13");

  const toBinary = (str: string, separator: boolean) =>
    str
      .split("")
      .map((char) => char.charCodeAt(0).toString(2).padStart(8, "0"))
      .join(separator ? " " : "");

  const toHex = (str: string, casing: "upper" | "lower") => {
    const hex = str
      .split("")
      .map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
      .join(" ");
    return casing === "upper" ? hex.toUpperCase() : hex.toLowerCase();
  };

  const toBase64 = (str: string, iterations: number) => {
    try {
      let result = str;
      for (let i = 0; i < iterations; i++) {
        result = btoa(result);
      }
      return result;
    } catch {
      return "Invalid Input";
    }
  };

  const toCaesar = (str: string, shift: number) => {
    return str.replace(/[a-zA-Z]/g, (char) => {
      const base = char <= "Z" ? 65 : 97;
      return String.fromCharCode(
        ((((char.charCodeAt(0) - base + shift) % 26) + 26) % 26) + base,
      );
    });
  };

  const toRot13 = (str: string, variant: "rot13" | "rot47") => {
    if (variant === "rot13") {
      return toCaesar(str, 13);
    } else {
      // ROT47 implementation (ASCII 33-126)
      return str
        .split("")
        .map((char) => {
          const code = char.charCodeAt(0);
          if (code >= 33 && code <= 126) {
            return String.fromCharCode(33 + ((code + 14) % 94));
          }
          return char;
        })
        .join("");
    }
  };

  const toAtbash = (str: string, mirror: boolean) => {
    const result = str.replace(/[a-zA-Z]/g, (char) => {
      const base = char <= "Z" ? 65 : 97;
      return String.fromCharCode(base + (25 - (char.charCodeAt(0) - base)));
    });
    return mirror ? result.split("").reverse().join("") : result;
  };

  return (
    <div
      className={`${styles.root} min-h-screen bg-[#050510] text-[#00ff9d] p-8 font-mono relative overflow-hidden`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,157,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,157,0.05)_1px,transparent_1px)] bg-size-[50px_50px] pointer-events-none" />

      <div className="absolute top-0 left-0 w-full h-32 bg-[#00ff9d]/04 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#ff00ff]/04 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 pt-10">
        <div className="space-y-8 border border-[#00ff9d]/20 bg-[#0a0a1f]/50 p-6 rounded-none backdrop-blur-none shadow-none">
          <div className="flex items-center justify-between text-[#ff00ff]">
            <div className="flex items-center gap-4">
              <Cpu className="w-10 h-10 drop-shadow-[0_0_3px_rgba(255,0,255,0.5)]" />
              <h1 className="text-4xl font-bold tracking-tighter drop-shadow-[0_0_6px_rgba(255,0,255,0.4)]">
                DATA_ENTRY
              </h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  try {
                    const clipboardText = await navigator.clipboard.readText();
                    setText(clipboardText);
                  } catch {
                    // Fallback alert if clipboard read is blocked
                  }
                }}
                className="px-3 py-1 text-xs font-bold border border-[#ff00ff]/40 text-[#ff00ff] hover:bg-[#ff00ff] hover:text-black transition-all rounded-none cursor-pointer"
              >
                PASTE
              </button>
              <button
                onClick={() => setText("")}
                className="px-3 py-1 text-xs font-bold border border-gray-800 text-gray-500 hover:text-[#ff00ff] hover:border-[#ff00ff]/50 transition-all rounded-none cursor-pointer"
              >
                CLEAR
              </button>
            </div>
          </div>

          <div className="relative group">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="relative w-full bg-[#0a0a1f] p-6 text-xl border border-[#00ff9d]/30 focus:border-[#00ff9d] outline-none h-48 font-mono shadow-none resize-none tracking-wide text-white/90 focus:bg-[#0a0a24]/80 transition-all rounded-none"
              placeholder="INITIATE TEXT STREAM..."
              spellCheck={false}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2 border-b border-[#00ff9d]/30 pb-2">
              <Settings2 className="w-5 h-5 text-[#00ff9d]" />
              <span className="font-bold tracking-widest text-sm text-[#00ff9d]/80 drop-shadow-[0_0_2px_rgba(0,255,157,0.3)]">
                ENCRYPTION_MODULES
              </span>
            </div>

            {/* Binary Config Module (Magenta) */}
            <div className="bg-[#0a0a1f] border-l-4 border-l-[#ff00ff] p-4 flex items-center justify-between border-y border-r border-y-[#ff00ff]/15 border-r-[#ff00ff]/15 hover:bg-[#11112b] transition-colors relative overflow-hidden group rounded-none">
              <div className="absolute inset-0 bg-[#ff00ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              <div>
                <h3 className="text-[#ff00ff] font-bold text-sm tracking-wider drop-shadow-[0_0_2px_rgba(255,0,255,0.4)]">
                  BINARY_MODULATOR
                </h3>
                <p className="text-[10px] text-[#ff00ff]/60 font-mono">
                  BIT_STREAM_FORMATTING
                </p>
              </div>
              <div className="z-10 flex items-center gap-3">
                <span className="text-[10px] uppercase text-[#ff00ff]/80 font-bold">
                  Separator
                </span>
                <button
                  onClick={() => setBinarySep(!binarySep)}
                  className={`w-12 h-6 p-1 transition-colors duration-300 rounded-none ${
                    binarySep
                      ? "bg-[#ff00ff]/20 border border-[#ff00ff]"
                      : "bg-gray-800 border border-gray-600"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-[#ff00ff] transition-transform duration-300 rounded-none ${
                      binarySep ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Hex Config Module (Cyan) */}
            <div className="bg-[#0a0a1f] border-l-4 border-l-[#00ffff] p-4 flex items-center justify-between border-y border-r border-y-[#00ffff]/15 border-r-[#00ffff]/15 hover:bg-[#11112b] transition-colors relative overflow-hidden group rounded-none">
              <div className="absolute inset-0 bg-[#00ffff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              <div>
                <h3 className="text-[#00ffff] font-bold text-sm tracking-wider drop-shadow-[0_0_2px_rgba(0,255,255,0.4)]">
                  HEX_PROCESSOR
                </h3>
                <p className="text-[10px] text-[#00ffff]/60 font-mono">
                  CASING_PROTOCOL
                </p>
              </div>
              <div className="z-10 flex bg-black/40 rounded-none p-1 border border-[#00ffff]/30">
                <button
                  onClick={() => setHexCase("upper")}
                  className={`px-3 py-1 text-xs font-bold rounded-none transition-all ${
                    hexCase === "upper"
                      ? "bg-[#00ffff] text-black border border-[#00ffff]"
                      : "text-gray-500 hover:text-[#00ffff]/60"
                  }`}
                >
                  UPPER
                </button>
                <button
                  onClick={() => setHexCase("lower")}
                  className={`px-3 py-1 text-xs font-bold rounded-none transition-all ${
                    hexCase === "lower"
                      ? "bg-[#00ffff] text-black border border-[#00ffff]"
                      : "text-gray-500 hover:text-[#00ffff]/60"
                  }`}
                >
                  lower
                </button>
              </div>
            </div>

            {/* Caesar Config Module (Yellow) */}
            <div className="bg-[#0a0a1f] border-l-4 border-l-[#ffff00] p-4 border-y border-r border-y-[#ffff00]/15 border-r-[#ffff00]/15 hover:bg-[#11112b] transition-colors relative overflow-hidden group rounded-none">
              <div className="absolute inset-0 bg-[#ffff00]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="text-[#ffff00] font-bold text-sm tracking-wider drop-shadow-[0_0_2px_rgba(255,255,0,0.4)]">
                    CAESAR_SHIFT_DRIVE
                  </h3>
                  <p className="text-[10px] text-[#ffff00]/60 font-mono">
                    OFFSET_CALIBRATION
                  </p>
                </div>
                <span className="font-mono text-xl text-[#ffff00] font-bold bg-black/40 px-3 py-1 rounded-none border border-[#ffff00]/30">
                  {caesarShift > 0 ? "+" : ""}
                  {caesarShift}
                </span>
              </div>
              <input
                type="range"
                min="-26"
                max="26"
                value={caesarShift}
                onChange={(e) => setCaesarShift(parseInt(e.target.value))}
                className="caesar-slider w-full h-2 bg-[#ffff00]/20 rounded-none appearance-none cursor-pointer z-10 relative"
              />
            </div>

            {/* Base64 Config Module (Orange) */}
            <div className="bg-[#0a0a1f] border-l-4 border-l-[#ff9900] p-4 border-y border-r border-y-[#ff9900]/15 border-r-[#ff9900]/15 hover:bg-[#11112b] transition-colors relative overflow-hidden group rounded-none">
              <div className="absolute inset-0 bg-[#ff9900]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="text-[#ff9900] font-bold text-sm tracking-wider drop-shadow-[0_0_2px_rgba(255,153,0,0.4)]">
                    BASE64_LOOPER
                  </h3>
                  <p className="text-[10px] text-[#ff9900]/60 font-mono">
                    RECURSION_DEPTH
                  </p>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`w-2 h-4 rounded-none transition-all ${
                        base64Iter >= i ? "bg-[#ff9900]" : "bg-[#ff9900]/20"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={base64Iter}
                onChange={(e) => setBase64Iter(parseInt(e.target.value))}
                className="base64-slider w-full h-2 bg-[#ff9900]/20 rounded-none appearance-none cursor-pointer z-10 relative"
              />
              <div className="flex justify-between text-[10px] text-[#ff9900]/50 font-mono mt-1 px-1">
                <span>1x</span>
                <span>5x</span>
              </div>
            </div>

            {/* Atbash Config Module (Red) */}
            <div className="bg-[#0a0a1f] border-l-4 border-l-[#ff0000] p-4 flex items-center justify-between border-y border-r border-y-[#ff0000]/15 border-r-[#ff0000]/15 hover:bg-[#11112b] transition-colors relative overflow-hidden group rounded-none">
              <div className="absolute inset-0 bg-[#ff0000]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              <div>
                <h3 className="text-[#ff0000] font-bold text-sm tracking-wider drop-shadow-[0_0_2px_rgba(255,0,0,0.4)]">
                  ATBASH_INVERTER
                </h3>
                <p className="text-[10px] text-[#ff0000]/60 font-mono">
                  MIRROR_PROTOCOL
                </p>
              </div>
              <div className="z-10 flex items-center gap-3">
                <button
                  onClick={() => setAtbashMirror(!atbashMirror)}
                  className={`px-3 py-1 text-xs font-bold rounded-none transition-all border ${
                    atbashMirror
                      ? "bg-[#ff0000] text-black border-[#ff0000]"
                      : "text-gray-500 border-gray-700 hover:text-[#ff0000]/60 hover:border-[#ff0000]/30"
                  }`}
                >
                  {atbashMirror ? "MIRRORED" : "STANDARD"}
                </button>
              </div>
            </div>

            {/* ROT13 Config Module (Blue) */}
            <div className="bg-[#0a0a1f] border-l-4 border-l-[#0099ff] p-4 flex items-center justify-between border-y border-r border-y-[#0099ff]/15 border-r-[#0099ff]/15 hover:bg-[#11112b] transition-colors relative overflow-hidden group rounded-none">
              <div className="absolute inset-0 bg-[#0099ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              <div>
                <h3 className="text-[#0099ff] font-bold text-sm tracking-wider drop-shadow-[0_0_2px_rgba(0,153,255,0.4)]">
                  ROT_VARIANT
                </h3>
                <p className="text-[10px] text-[#0099ff]/60 font-mono">
                  ALGORITHM_SELECT
                </p>
              </div>
              <div className="z-10 flex bg-black/40 rounded-none p-1 border border-[#0099ff]/30">
                <button
                  onClick={() => setRotVariant("rot13")}
                  className={`px-3 py-1 text-xs font-bold rounded-none transition-all ${
                    rotVariant === "rot13"
                      ? "bg-[#0099ff] text-black border border-[#0099ff]"
                      : "text-gray-500 hover:text-[#0099ff]/60"
                  }`}
                >
                  ROT13
                </button>
                <button
                  onClick={() => setRotVariant("rot47")}
                  className={`px-3 py-1 text-xs font-bold rounded-none transition-all ${
                    rotVariant === "rot47"
                      ? "bg-[#0099ff] text-black border border-[#0099ff]"
                      : "text-gray-500 hover:text-[#0099ff]/60"
                  }`}
                >
                  ROT47
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Output Streams */}
        <div className="space-y-6 overflow-y-auto max-h-[85vh] pr-2 scrollbar-thin scrollbar-thumb-[#00ff9d]/30 scrollbar-track-transparent animate-none">
          <div className="flex items-center gap-4 text-[#00ff9d] sticky top-0 bg-[#050510]/95 backdrop-blur-none z-20 py-2 border-b border-[#00ff9d]/20 mb-4 shadow-none">
            <Wifi className="w-6 h-6 animate-pulse drop-shadow-[0_0_3px_rgba(0,255,157,0.5)]" />
            <h2 className="text-2xl font-bold tracking-widest w-full flex justify-between items-center drop-shadow-[0_0_4px_rgba(0,255,157,0.4)]">
              <span>ENCRYPTED_STREAMS</span>
            </h2>
          </div>

          <div className="grid gap-6">
            {/* Binary Stream */}
            <div className="bg-[#0a0a1f]/80 p-4 border-l-4 border-l-[#ff00ff] border-y border-r border-y-[#ff00ff]/15 border-r-[#ff00ff]/15 hover:bg-[#151530] transition-all group rounded-none shadow-none">
              <h3 className="text-[#ff00ff] text-xs mb-3 font-bold flex justify-between items-center tracking-widest border-b border-[#ff00ff]/20 pb-1 drop-shadow-[0_0_2px_rgba(255,0,255,0.4)]">
                <span className="flex items-center gap-2">
                  <span>BINARY_STREAM</span>
                  <span className="font-mono opacity-50 text-[10px]">
                    UTF-8
                  </span>
                </span>
                <CopyButton text={toBinary(text, binarySep)} />
              </h3>
              <p className="break-all font-mono text-xs text-[#ff00ff] leading-relaxed font-light tracking-wide shadow-none drop-shadow-[0_0_1px_rgba(255,0,255,0.3)]">
                {toBinary(text, binarySep)}
              </p>
            </div>

            {/* Hex Stream */}
            <div className="bg-[#0a0a1f]/80 p-4 border-l-4 border-l-[#00ffff] border-y border-r border-y-[#00ffff]/15 border-r-[#00ffff]/15 hover:bg-[#151530] transition-all group rounded-none shadow-none">
              <h3 className="text-[#00ffff] text-xs mb-3 font-bold flex justify-between items-center tracking-widest border-b border-[#00ffff]/20 pb-1 drop-shadow-[0_0_2px_rgba(0,255,255,0.4)]">
                <span className="flex items-center gap-2">
                  <span>HEX_STREAM</span>
                  <span className="font-mono opacity-50 text-[10px]">
                    BASE16
                  </span>
                </span>
                <CopyButton text={toHex(text, hexCase)} />
              </h3>
              <p className="break-all font-mono text-xs text-[#00ffff] leading-relaxed tracking-wider drop-shadow-[0_0_1px_rgba(0,255,255,0.3)]">
                {toHex(text, hexCase)}
              </p>
            </div>

            {/* Caesar Stream */}
            <div className="bg-[#0a0a1f]/80 p-4 border-l-4 border-l-[#ffff00] border-y border-r border-y-[#ffff00]/15 border-r-[#ffff00]/15 hover:bg-[#151530] transition-all group rounded-none shadow-none">
              <h3 className="text-[#ffff00] text-xs mb-3 font-bold flex justify-between items-center tracking-widest border-b border-[#ffff00]/20 pb-1 drop-shadow-[0_0_2px_rgba(255,255,0,0.4)]">
                <span className="flex items-center gap-2">
                  <span>CAESAR_CIPHER</span>
                  <span className="bg-[#ffff00]/10 px-2 border border-[#ffff00]/30 rounded-none text-[10px] font-mono">
                    ROT{Math.abs(caesarShift)}
                  </span>
                </span>
                <CopyButton text={toCaesar(text, caesarShift)} />
              </h3>
              <p className="break-all font-mono text-sm text-[#ffff00] leading-relaxed drop-shadow-[0_0_1px_rgba(255,255,0,0.3)]">
                {toCaesar(text, caesarShift)}
              </p>
            </div>

            {/* Base64 Stream */}
            <div className="bg-[#0a0a1f]/80 p-4 border-l-4 border-l-[#ff9900] border-y border-r border-y-[#ff9900]/15 border-r-[#ff9900]/15 hover:bg-[#151530] transition-all group rounded-none shadow-none">
              <h3 className="text-[#ff9900] text-xs mb-3 font-bold flex justify-between items-center tracking-widest border-b border-[#ff9900]/20 pb-1 drop-shadow-[0_0_2px_rgba(255,153,0,0.4)]">
                <span className="flex items-center gap-2">
                  <span>BASE64_ENCODING</span>
                  <span className="font-mono opacity-50 text-[10px]">
                    {base64Iter}X ITERATION
                  </span>
                </span>
                <CopyButton text={toBase64(text, base64Iter)} />
              </h3>
              <p className="break-all font-mono text-sm text-[#ff9900] leading-relaxed drop-shadow-[0_0_1px_rgba(255,153,0,0.3)]">
                {toBase64(text, base64Iter)}
              </p>
            </div>

            {/* Atbash Stream */}
            <div className="bg-[#0a0a1f]/80 p-4 border-l-4 border-l-[#ff0000] border-y border-r border-y-[#ff0000]/15 border-r-[#ff0000]/15 hover:bg-[#151530] transition-all group rounded-none shadow-none">
              <h3 className="text-[#ff0000] text-xs mb-3 font-bold flex justify-between items-center tracking-widest border-b border-[#ff0000]/20 pb-1 drop-shadow-[0_0_2px_rgba(255,0,0,0.4)]">
                <span className="flex items-center gap-2">
                  <span>ATBASH_SUBSTITUTION</span>
                  <span className="font-mono opacity-50 text-[10px]">
                    {atbashMirror ? "MIRRORED" : "STANDARD"}
                  </span>
                </span>
                <CopyButton text={toAtbash(text, atbashMirror)} />
              </h3>
              <p className="break-all font-mono text-sm text-[#ff0000] leading-relaxed drop-shadow-[0_0_1px_rgba(255,0,0,0.3)]">
                {toAtbash(text, atbashMirror)}
              </p>
            </div>

            {/* ROT13 Stream */}
            <div className="bg-[#0a0a1f]/80 p-4 border-l-4 border-l-[#0099ff] border-y border-r border-y-[#0099ff]/15 border-r-[#0099ff]/15 hover:bg-[#151530] transition-all group rounded-none shadow-none">
              <h3 className="text-[#0099ff] text-xs mb-3 font-bold flex justify-between items-center tracking-widest border-b border-[#0099ff]/20 pb-1 drop-shadow-[0_0_2px_rgba(0,153,255,0.4)]">
                <span className="flex items-center gap-2">
                  <span>ROT_ALGORITHM</span>
                  <span className="font-mono opacity-50 uppercase text-[10px]">
                    {rotVariant}
                  </span>
                </span>
                <CopyButton text={toRot13(text, rotVariant)} />
              </h3>
              <p className="break-all font-mono text-sm text-[#0099ff] leading-relaxed drop-shadow-[0_0_1px_rgba(0,153,255,0.3)]">
                {toRot13(text, rotVariant)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
