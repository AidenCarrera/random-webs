import { memo } from "react";

interface PassageTextProps {
  passage: string;
  typedText: string;
}

function getCharacterClasses(
  character: string,
  index: number,
  typedText: string,
): string {
  if (index < typedText.length) {
    return typedText[index] === character
      ? "text-cyan-400 font-medium"
      : "text-pink-500 bg-pink-950/40 font-bold decoration-pink-500 underline";
  }

  if (index === typedText.length) {
    return "text-white underline decoration-purple-500 decoration-2 underline-offset-4 bg-purple-900/30 ring-1 ring-purple-600";
  }

  return "text-zinc-500";
}

export const PassageText = memo(function PassageText({
  passage,
  typedText,
}: PassageTextProps) {
  return passage.split("").map((character, index) => (
    <span
      key={index}
      className={`${getCharacterClasses(character, index, typedText)} transition-colors duration-75 text-2xl tracking-wide font-mono`}
    >
      {character}
    </span>
  ));
});
