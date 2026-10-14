export type NumberCard = { kind: "number"; value: number };
export type ActionCard = { kind: "action"; action: "freeze" | "flipThree" | "secondChance" };
export type ModifierCard = { kind: "modifier"; bonus: number; multiplier: number };
export type Card = NumberCard | ActionCard | ModifierCard;
export type BotLevel = "easy" | "medium" | "hard";
export type Player = {
  id: string;
  name: string;
  hand: Card[];
  totalScore: number;
  status: "playing" | "stayed" | "busted" | "frozen";
  bot?: BotLevel; // set for computer players, left out for humans
};
export type DeckState = { drawPile: Card[]; discardPile: Card[] };
