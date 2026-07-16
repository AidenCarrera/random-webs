import { motion } from "framer-motion";
import { SKIN_COLORS } from "../data/options";
import type { AccessoryStyle, HatStyle, PetStatus, SkinColor } from "../types";

type PetProps = {
  accessory: AccessoryStyle;
  hat: HatStyle;
  reduceMotion: boolean | null;
  skin: SkinColor;
  status: PetStatus;
};

const cleaningBubbles = [
  { left: "17%", top: "26%", delay: 0 },
  { left: "74%", top: "36%", delay: 0.14 },
  { left: "24%", top: "67%", delay: 0.28 },
  { left: "70%", top: "70%", delay: 0.4 },
];

export function Pet({ accessory, hat, reduceMotion, skin, status }: PetProps) {
  const colors = SKIN_COLORS[skin];

  return (
    <div className="relative z-10 flex flex-1 flex-col items-center justify-center pb-7">
      <motion.div
        animate={
          reduceMotion
            ? { y: 0, scaleY: 1, rotate: 0 }
            : status === "DEAD"
              ? { y: [0, 4, 0], rotate: [0, -10, -10] }
              : status === "SLEEPING"
                ? { y: [0, 2, 0], scaleY: [1, 0.95, 1], rotate: 0 }
                : status === "EATING"
                  ? {
                      scaleY: [1, 0.9, 1.1, 1],
                      y: [0, 4, -4, 0],
                      rotate: 0,
                    }
                  : status === "PLAYING"
                    ? {
                        y: [0, -35, 0],
                        rotate: [0, 15, -15, 0],
                        scaleY: [0.85, 1.1, 0.9, 1],
                      }
                    : status === "CLEANING"
                      ? {
                          y: [0, -3, 1, -2, 0],
                          rotate: [0, -5, 5, -3, 0],
                          scaleY: [1, 0.95, 1.04, 0.98, 1],
                        }
                      : {
                          y: [0, -3, 0],
                          scaleY: [1, 0.97, 1],
                          rotate: 0,
                        }
        }
        transition={
          reduceMotion
            ? { duration: 0 }
            : status === "SLEEPING"
              ? {
                  y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                  scaleY: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                  rotate: { duration: 0.3 },
                }
              : status === "IDLE"
                ? {
                    y: {
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                    scaleY: {
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                    rotate: { duration: 0.3 },
                  }
                : { duration: 0.5, repeat: 4, ease: "easeInOut" }
        }
        className="relative flex h-40 w-40 items-center justify-center sm:h-44 sm:w-44"
      >
        {status === "CLEANING" && !reduceMotion && (
          <div
            className="pointer-events-none absolute inset-0 z-20"
            aria-hidden="true"
          >
            {cleaningBubbles.map((bubble, index) => (
              <motion.span
                key={index}
                className="absolute h-3 w-3 rounded-full border-2 border-zinc-100/80 bg-white/30"
                style={{ left: bubble.left, top: bubble.top }}
                initial={{ opacity: 0, scale: 0.4, y: 4 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.4, 1, 1.25],
                  y: [4, -8, -16],
                }}
                transition={{
                  duration: 0.75,
                  delay: bubble.delay,
                  repeat: 1,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>
        )}

        <svg
          viewBox="0 0 32 32"
          className="h-full w-full drop-shadow-[0_4px_4px_rgba(0,0,0,0.15)]"
          style={{ shapeRendering: "crispEdges" }}
        >
          {accessory === "HALO" && status !== "DEAD" && (
            <ellipse
              cx="16"
              cy="3"
              rx="6"
              ry="1.5"
              fill="none"
              stroke="#fef08a"
              strokeWidth="1"
            />
          )}

          {accessory === "WINGS" && (
            <path
              d="M 7 14 h -3 v 2 h -2 v 5 h 2 v 2 h 4 v -3 h 2 v -4 h -3 z M 25 14 h 3 v 2 h 2 v 5 h -2 v 2 h -4 v -3 h -2 v -4 h 3 z"
              fill="#d8dde0"
              stroke="#677277"
              strokeWidth="0.7"
            />
          )}

          {accessory === "HEADPHONES" && (
            <>
              <path
                d="M 7 14 v -3 q 0 -7 9 -7 q 9 0 9 7 v 3"
                fill="none"
                stroke="#263238"
                strokeWidth="2"
              />
              <rect x="5" y="12" width="4" height="7" fill="#47545a" />
              <rect x="23" y="12" width="4" height="7" fill="#47545a" />
            </>
          )}

          <rect x="5" y="6" width="4" height="4" fill={colors.dark} />
          <rect x="23" y="6" width="4" height="4" fill={colors.dark} />
          <path
            d="M 8 9 h 16 v 2 h 2 v 14 h -2 v 2 h -16 v -2 h -2 v -14 h 2 z M 6 10 h 2 v 2 h -2 z M 24 10 h 2 v 2 h -2 z"
            fill={colors.base}
          />
          <path
            d="M 11 15 h 10 v 1 h 2 v 8 h -2 v 1 h -10 v -1 h -2 v -8 h 2 z"
            fill={colors.light}
            opacity="0.75"
          />

          {status === "DEAD" ? (
            <>
              <path
                d="M 9 12 l 2 2 M 11 12 l -2 2"
                stroke="#0f172a"
                strokeWidth="1.5"
              />
              <path
                d="M 21 12 l 2 2 M 23 12 l -2 2"
                stroke="#0f172a"
                strokeWidth="1.5"
              />
            </>
          ) : status === "SLEEPING" ? (
            <>
              <rect x="9" y="13" width="4" height="1" fill="#0f172a" />
              <rect x="19" y="13" width="4" height="1" fill="#0f172a" />
            </>
          ) : status === "PLAYING" ? (
            <>
              <path
                d="M 9 14 l 2 -2 l 2 2"
                fill="none"
                stroke="#0f172a"
                strokeWidth="1.5"
              />
              <path
                d="M 19 14 l 2 -2 l 2 2"
                fill="none"
                stroke="#0f172a"
                strokeWidth="1.5"
              />
            </>
          ) : (
            <>
              <rect x="9" y="11" width="3" height="4" fill="#0f172a" />
              <rect x="20" y="11" width="3" height="4" fill="#0f172a" />
              <rect x="9" y="11" width="1" height="2" fill="#fff" />
              <rect x="20" y="11" width="1" height="2" fill="#fff" />
            </>
          )}

          {status === "DEAD" ? (
            <path
              d="M 14 20 q 2 -2 4 0"
              fill="none"
              stroke="#0f172a"
              strokeWidth="1.5"
            />
          ) : status === "EATING" ? (
            <rect x="14" y="17" width="4" height="3" fill="#0f172a" />
          ) : status === "PLAYING" ? (
            <path d="M 13 17 h 6 v 2 h -6 z" fill="#0f172a" />
          ) : (
            <path
              d="M 14 17 q 1 1 2 0 q 1 1 2 0"
              fill="none"
              stroke="#0f172a"
              strokeWidth="1.5"
            />
          )}

          {status === "PLAYING" && (
            <>
              <rect
                x="7"
                y="15"
                width="2"
                height="1"
                fill="#f43f5e"
                opacity="0.6"
              />
              <rect
                x="23"
                y="15"
                width="2"
                height="1"
                fill="#f43f5e"
                opacity="0.6"
              />
            </>
          )}

          {accessory === "SHADES" && (
            <path
              d="M 7 11 h 18 v 3 h -3 v -1 h -4 v 1 h -4 v -1 h -4 v 1 h -3 z"
              fill="#1e293b"
            />
          )}
          {accessory === "SCARF" && (
            <path
              d="M 9 21 h 14 v 3 h -5 v 5 h -3 v -5 h -6 z"
              fill="#b84655"
            />
          )}
          {accessory === "BOWTIE" && (
            <path
              d="M 13 22 h 6 l -1 2 h -4 z M 12 21 h 2 v 3 h -2 z M 18 21 h 2 v 3 h -2 z"
              fill="#ec4899"
            />
          )}
          {accessory === "MONOCLE" && (
            <>
              <circle
                cx="21.5"
                cy="13"
                r="3"
                fill="none"
                stroke="#554a2b"
                strokeWidth="1"
              />
              <path
                d="M 24 15 l 1 7"
                fill="none"
                stroke="#554a2b"
                strokeWidth="0.8"
              />
            </>
          )}
          {accessory === "MUSTACHE" && (
            <path
              d="M 16 18 q -2 -3 -6 0 q 2 3 6 1 q 4 2 6 -1 q -4 -3 -6 0 z"
              fill="#3b2b25"
            />
          )}
          {accessory === "EARRINGS" && (
            <>
              <circle cx="7" cy="17" r="1.2" fill="#e8c75b" />
              <circle cx="25" cy="17" r="1.2" fill="#e8c75b" />
            </>
          )}

          {hat === "COWBOY" && (
            <path
              d="M 7 8 h 18 v 2 h -18 z M 9 5 h 14 v 3 h -14 z M 12 2 h 8 v 3 h -8 z"
              fill="#78350f"
            />
          )}
          {hat === "BEANIE" && (
            <path
              d="M 8 7 h 16 v 3 h -16 z M 10 4 h 12 v 3 h -12 z M 15 2 h 3 v 2 h -3 z"
              fill="#5d6b76"
            />
          )}
          {hat === "CROWN" && (
            <path
              d="M 9 8 h 14 v 2 h -14 z M 9 4 l 2 3 l 3 -3 l 2 3 l 3 -3 l 3 3 v 1 h -13 z"
              fill="#fbbf24"
            />
          )}
          {hat === "PARTY" && (
            <>
              <path d="M 10 8 l 6 -8 l 6 8 z" fill="#cc526d" />
              <rect x="9" y="8" width="14" height="2" fill="#e6c45a" />
              <circle cx="16" cy="1" r="1.2" fill="#e6c45a" />
            </>
          )}
          {hat === "WIZARD" && (
            <path
              d="M 7 7 h 18 v 2 h -18 z M 9 5 h 14 v 2 h -14 z M 12 2 h 8 v 3 h -8 z"
              fill="#4f46e5"
            />
          )}
          {hat === "FLOWER" && (
            <>
              <circle cx="20" cy="6" r="2" fill="#d76a89" />
              <circle cx="24" cy="6" r="2" fill="#d76a89" />
              <circle cx="22" cy="4" r="2" fill="#d76a89" />
              <circle cx="22" cy="8" r="2" fill="#d76a89" />
              <circle cx="22" cy="6" r="1.4" fill="#e7c45f" />
            </>
          )}
          {hat === "BOW" && (
            <path
              d="M 15 6 h 2 v 2 h -2 z M 11 5 h 4 v 4 h -4 z M 17 5 h 4 v 4 h -4 z"
              fill="#ec4899"
            />
          )}
          {hat === "TOPHAT" && (
            <path
              d="M 7 8 h 18 v 2 h -18 z M 11 1 h 10 v 7 h -10 z M 11 6 h 10 v 2 h -10 z"
              fill="#293136"
            />
          )}
          {hat === "CHEF" && (
            <path
              d="M 9 8 h 14 v 2 h -14 z M 10 4 h 12 v 4 h -12 z M 10 4 q 0 -4 4 -3 q 2 -2 4 0 q 4 -1 4 3 z"
              fill="#e8e9e2"
              stroke="#78807d"
              strokeWidth="0.5"
            />
          )}
          {hat === "PIRATE" && (
            <>
              <path
                d="M 7 8 h 18 v 2 h -18 z M 9 5 q 7 -5 14 0 v 3 h -14 z"
                fill="#30373a"
              />
              <path d="M 14 4 h 4 v 1 h -4 z" fill="#d5d8d2" />
            </>
          )}
          {hat === "SPACE" && (
            <>
              <path
                d="M 8 9 v -2 q 0 -7 8 -7 q 8 0 8 7 v 2"
                fill="#9aa7ad"
                stroke="#536168"
                strokeWidth="1"
              />
              <path d="M 10 6 h 12 v 3 h -12 z" fill="#52788a" />
            </>
          )}
        </svg>
      </motion.div>
    </div>
  );
}
