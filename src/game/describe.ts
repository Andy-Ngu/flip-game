import { scoreHand } from "./scoring";
import { Card, Player } from "./types";
import { pointsText } from "./words";

// What each action card is called on screen, and in the labels read out to screen readers.
export const ACTION_NAME = { timeOut: "Time Out", drawThree: "Draw Three", shield: "Shield" } as const;

export function describeCard(card: Card): string {
  switch (card.kind) {
    case "number": return `Number ${card.value}`;
    case "action": return `Action: ${ACTION_NAME[card.action]}`;
    case "modifier":
      if (card.multiplier === 2) return "Double Score";
      return `Bonus +${card.bonus}`;
  }
}

// The one word on an opponent's tile: whose turn it is, or what became of them this round.
export type TileStatus = "turn" | "waiting" | "stayed" | "bust" | "out";
export const STATUS_LABEL: Record<TileStatus, string> = {
  turn: "THEIR TURN", waiting: "WAITING", stayed: "STAYED", bust: "BUST", out: "TIMED OUT",
};

export function tileStatus(p: Player, acting: boolean): TileStatus {
  if (p.status === "busted") return "bust";
  if (p.status === "timedOut") return "out";
  if (p.status === "stayed") return "stayed";
  return acting ? "turn" : "waiting";
}

// What a screen reader says for a tile: the name, the status, the score and the cards held.
export function describeTile(p: Player, acting: boolean): string {
  const held = p.hand.length === 0 ? "no cards yet" : p.hand.map(describeCard).join(", ");
  const status = { turn: "their turn", waiting: "waiting", stayed: "stayed", bust: "busted", out: "timed out" }[tileStatus(p, acting)];
  return `${p.name}, ${status}. ${pointsText(p.totalScore)} in total, ${scoreHand(p)} this round. ${held}.`;
}
