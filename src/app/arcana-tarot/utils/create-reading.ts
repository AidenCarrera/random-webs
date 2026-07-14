import type { TarotCardDefinition, DrawnCard } from "../types";

export function drawRandomCards<T>(
  cards: readonly T[],
  count: number,
  random: () => number = Math.random,
): T[] {
  if (count > cards.length) {
    throw new RangeError("Cannot draw more cards than are available.");
  }

  const shuffled = [...cards];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const targetIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[targetIndex]] = [
      shuffled[targetIndex],
      shuffled[index],
    ];
  }

  return shuffled.slice(0, count);
}

export function createReading<TCard extends TarotCardDefinition>(
  cards: readonly TCard[],
  positions: readonly { id: string; label: string }[],
): DrawnCard<TCard>[] {
  const selectedCards = drawRandomCards(cards, positions.length);

  return positions.map((position, index) => ({
    card: selectedCards[index],
    position,
    revealed: false,
  }));
}
