import { Card } from "./types";

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
