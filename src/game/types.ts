export type NumberCard = { kind: "number"; value: number };
export type ActionCard = { kind: "action"; action: "timeOut" | "drawThree" | "shield" };
export type ModifierCard = { kind: "modifier"; bonus: number; multiplier: number };
export type Card = NumberCard | ActionCard | ModifierCard;
export type BotLevel = "easy" | "medium" | "hard";
export type Player = {
  id: string;
  name: string;
  hand: Card[];
  totalScore: number;
  status: "playing" | "stayed" | "busted" | "timedOut";
  bot?: BotLevel; // set for computer players, left out for humans
};
// `seed` makes reshuffling repeatable: the same deck state always reshuffles the same way.
// That matters because a paused move is re-run from the start (see session.ts).
export type DeckState = { drawPile: Card[]; discardPile: Card[]; seed?: number };
