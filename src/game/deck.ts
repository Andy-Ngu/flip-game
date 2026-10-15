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
// A small repeatable random number generator (mulberry32): the same seed always
// gives the same sequence of numbers between 0 and 1.
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher-Yates shuffle. Returns a new array. Pass a seeded generator for a repeatable shuffle.
export function shuffle(cards: Card[], random: () => number = Math.random): Card[] {
  const result = [...cards];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
