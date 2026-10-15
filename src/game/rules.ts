import { seededRandom, shuffle } from "./deck";
import { hasSevenStack, scoreHand } from "./scoring";
import { Card, DeckState, Player } from "./types";
export function drawCard(deck: DeckState): { card: Card; deck: DeckState } {
  let drawPile = deck.drawPile;
  let discardPile = deck.discardPile;
  let seed = deck.seed;
  if (drawPile.length === 0) {
    if (discardPile.length === 0) throw new Error("No cards left to draw");
    // The reshuffle is seeded, not random, so re-running the same move (which the session
    // does after each question) reshuffles identically. The seed moves on for the next one.
    const used = seed ?? 0;
    drawPile = shuffle(discardPile, seededRandom(used));
    discardPile = [];
    seed = used + 1;
  }
  const [card, ...rest] = drawPile;
  return { card, deck: { ...deck, drawPile: rest, discardPile, ...(seed !== undefined ? { seed } : {}) } };
}
export function isDuplicate(hand: Card[], card: Card): boolean {
  if (card.kind !== "number") return false;
  return hand.some((c) => c.kind === "number" && c.value === card.value);
}
const isShield = (c: Card): boolean => c.kind === "action" && c.action === "shield";
export type HitResult = { player: Player; discarded: Card[] };
export function hit(player: Player, card: Card): HitResult {
  if (player.status !== "playing") throw new Error("This player can't take another card");
  if (isShield(card) && player.hand.some(isShield)) {
    return { player, discarded: [card] };
  }
  if (isDuplicate(player.hand, card)) {
    const idx = player.hand.findIndex(isShield);
    if (idx !== -1) {
      const saver = player.hand[idx];
      const hand = player.hand.filter((_, i) => i !== idx);
      return { player: { ...player, hand }, discarded: [saver, card] };
    }
    return { player: { ...player, hand: [...player.hand, card], status: "busted" }, discarded: [] };
  }
  return { player: { ...player, hand: [...player.hand, card] }, discarded: [] };
}
export function stay(player: Player): Player {
  if (player.hand.length === 0) throw new Error("You need at least one card to stay");
  return { ...player, status: "stayed" };
}
export function isRoundOver(players: Player[]): boolean {
  return players.some(hasSevenStack) || players.every((p) => p.status !== "playing");
}
export function endRound(players: Player[], deck: DeckState): { players: Player[]; deck: DeckState } {
  const discarded = players.flatMap((p) => p.hand);
  const next = players.map((p): Player => ({ ...p, totalScore: p.totalScore + scoreHand(p), hand: [], status: "playing" }));
  return { players: next, deck: { ...deck, discardPile: [...deck.discardPile, ...discarded] } };
}
