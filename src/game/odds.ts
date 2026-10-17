import { isDuplicate } from "./rules";
import { DeckState, Player } from "./types";

// The chance that the next card you draw is a duplicate.
export type BustOdds = {
  percent: number;     // 0 to 100, whole numbers
  shield: boolean;     // you hold a Shield, so a duplicate would be blocked instead of busting you
  cardsLeft: number;   // cards in the pile the next card comes from
  dangerous: number;   // how many of those cards would be a duplicate
};

const isShield = (p: Player) => p.hand.some((c) => c.kind === "action" && c.action === "shield");

// Worked out from the pile the next card really comes from. That is fair play: a careful player
// could count the same thing, because every card that is not in that pile is face up on the table
// (in a hand, or in the discard pile). It says nothing about the ORDER of the pile.
export function bustOdds(player: Player, deck: DeckState): BustOdds {
  // When the draw pile is empty the next draw reshuffles the discard pile, so that is the pile.
  const pile = deck.drawPile.length > 0 ? deck.drawPile : deck.discardPile;
  const dangerous = pile.filter((c) => isDuplicate(player.hand, c)).length;
  const percent = pile.length === 0 ? 0 : Math.round((dangerous / pile.length) * 100);
  return { percent, shield: isShield(player), cardsLeft: pile.length, dangerous };
}

// How worried to be, for the colour of the bust odds bar: green, gold, red.
export type OddsLevel = "low" | "medium" | "high";
export const oddsLevel = (percent: number): OddsLevel => (percent < 15 ? "low" : percent < 40 ? "medium" : "high");
