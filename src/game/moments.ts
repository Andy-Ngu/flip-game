import { scoreHand, uniqueNumberCount } from "./scoring";
import { Player } from "./types";

// The big moments on the table: who is winning, who is close to the target, who is one card from a
// Seven Stack. Worked out from the players alone, so they are tested like the rest of the game.

// What a player would have if the round ended right now.
export function projectedTotal(p: Player): number {
  return p.totalScore + scoreHand(p);
}

// A crown needs a real lead, not the first card of a new game.
export const MIN_CROWN_POINTS = 20;

// The player winning right now (total plus this round's points), or null if nobody is clearly ahead:
// a tie at the top, or a leader who has hardly any points yet.
export function leaderOf(players: Player[]): number | null {
  let best = -1;
  let bestIndex = -1;
  let tied = false;
  players.forEach((p, i) => {
    const score = projectedTotal(p);
    if (score > best) {
      best = score;
      bestIndex = i;
      tied = false;
    } else if (score === best) {
      tied = true;
    }
  });
  if (bestIndex < 0 || tied || best < MIN_CROWN_POINTS) return null;
  return bestIndex;
}

// How close counts as "nearly there": a tenth of the target (20 points when playing to 200).
export function nearMargin(target: number): number {
  return Math.round(target / 10);
}

// Close to the target, or already past it. Players who have busted or been timed out
// keep only their total, which is exactly what projectedTotal gives them.
export function nearTarget(p: Player, target: number): boolean {
  return projectedTotal(p) >= target - nearMargin(target);
}

// Six different numbers and still in the round: the next new number completes a Seven Stack.
export function oneCardAway(p: Player): boolean {
  return p.status === "playing" && uniqueNumberCount(p) === 6;
}

// The draw pile is getting short. Shown once as a warning before it runs out.
export const LOW_DECK = 10;

export function deckLow(drawPile: number): boolean {
  return drawPile > 0 && drawPile <= LOW_DECK;
}
