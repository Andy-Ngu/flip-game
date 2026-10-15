import { Card } from "./types";
export function createDeck(): Card[] {
  const deck: Card[] = [];
  deck.push({ kind: "number", value: 0 });
  for (let value = 1; value <= 12; value++) {
    for (let copy = 0; copy < value; copy++) deck.push({ kind: "number", value });
  }
  const actions = ["timeOut", "drawThree", "shield"] as const;
  for (const action of actions) for (let i = 0; i < 3; i++) deck.push({ kind: "action", action });
  for (const bonus of [2, 4, 6, 8, 10]) deck.push({ kind: "modifier", bonus, multiplier: 1 });
  deck.push({ kind: "modifier", bonus: 0, multiplier: 2 });
  return deck;
}
export function shuffle(cards: Card[]): Card[] {
  const result = [...cards];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
