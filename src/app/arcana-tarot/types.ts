export interface TarotCardDefinition {
  readonly name: string;
  readonly meaning: string;
  readonly details: string;
}

export interface TarotInterpretation {
  readonly element: string;
  readonly astrology: string;
  readonly counsel: string;
  readonly symbols: readonly string[];
}

export interface SpreadPositionDefinition {
  readonly id: string;
  readonly label: string;
}

export interface TarotSpreadDefinition {
  readonly id: string;
  readonly positions: readonly SpreadPositionDefinition[];
}

export interface DrawnCard<TCard extends TarotCardDefinition> {
  readonly card: TCard;
  readonly position: SpreadPositionDefinition;
  readonly revealed: boolean;
}
