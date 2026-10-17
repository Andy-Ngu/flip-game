export type NumberCard = { kind: "number"; value: number };
export type ActionCard = { kind: "action"; action: "timeOut" | "drawThree" | "shield" };
export type ModifierCard = { kind: "modifier"; bonus: number; multiplier: number };
export type Card = NumberCard | ActionCard | ModifierCard;
export type BotLevel = "easy" | "medium" | "hard";

// How a player looks at the table: one of the drawn characters on one of the colors.
// The rules never read this. It rides along so the screens can draw the same player the same way.
export type Look = { character: string; color: string };

export type Player = {
  id: string;
  name: string;
  hand: Card[];
  totalScore: number;
  status: "playing" | "stayed" | "busted" | "timedOut";
  bot?: BotLevel;        // set for computer players, left out for humans
  look?: Look;           // set by the table setup
  timedOutBy?: number;   // seat of the player whose Time Out put this player out (this round)
  autoStayed?: boolean;  // stayed because the turn clock ran out (this round)
};
// `seed` makes reshuffling repeatable: the same deck state always reshuffles the same way.
// That matters because a paused move is re-run from the start (see session.ts).
export type DeckState = { drawPile: Card[]; discardPile: Card[]; seed?: number };
