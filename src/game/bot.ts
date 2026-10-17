import { TargetedKind } from "./round";
import { scoreHand, uniqueNumberCount } from "./scoring";
import { BotLevel, Card, Player } from "./types";

const isShield = (c: Card): boolean => c.kind === "action" && c.action === "shield";

// How many copies of each number are still unaccounted for, going only by the
// cards a player can see in front of everyone this round. A bot never peeks at
// the deck.
function unseenCopies(players: Player[]): Map<number, number> {
  const left = new Map<number, number>();
  for (let v = 0; v <= 12; v++) left.set(v, v === 0 ? 1 : v);
  for (const p of players) {
    for (const c of p.hand) {
      if (c.kind === "number") left.set(c.value, (left.get(c.value) ?? 0) - 1);
    }
  }
  return left;
}

// Hit if the points we expect to gain beat the points we expect to lose.
// Comparing sums over the unseen cards means we never need to divide by the deck size.
function hardDecision(players: Player[], i: number): "hit" | "stay" {
  const me = players[i];
  const score = scoreHand(me);
  const mine = new Set<number>();
  for (const c of me.hand) if (c.kind === "number") mine.add(c.value);

  let bustCards = 0; // unseen cards that would duplicate something we hold
  let gainSum = 0;   // total value of unseen cards that are safe to draw
  let newCards = 0;  // how many safe cards there are
  for (const [value, copies] of unseenCopies(players)) {
    if (mine.has(value)) bustCards += copies;
    else { gainSum += value * copies; newCards += copies; }
  }

  const hasDouble = me.hand.some((c) => c.kind === "modifier" && c.multiplier === 2);
  const sevenStackBonus = mine.size === 6 ? 15 * newCards : 0; // a 7th new number ends the round with +15
  const risk = me.hand.some(isShield) ? 0.2 : 1;     // Shield absorbs one bust

  const expectedGain = gainSum * (hasDouble ? 2 : 1) + sevenStackBonus;
  const expectedLoss = bustCards * score * risk;
  return expectedGain > expectedLoss ? "hit" : "stay";
}

// The level of the computer that plays a human's seat while they are away.
export const COVER_LEVEL: BotLevel = "medium";

// Hit or stay for the computer player at index i. `fallback` is used for a human's seat that a
// computer is covering, which has no level of its own.
export function botDecide(players: Player[], i: number, fallback: BotLevel = COVER_LEVEL): "hit" | "stay" {
  const me = players[i];
  if (me.hand.length === 0) return "hit"; // staying needs at least one card
  const level: BotLevel = me.bot ?? fallback;
  const score = scoreHand(me);
  if (level === "easy") return score >= 15 ? "stay" : "hit";
  if (level === "medium") return score >= 30 ? "stay" : "hit";
  return hardDecision(players, i);
}

const roundScore = (p: Player) => scoreHand(p);
const numberSum = (p: Player) =>
  p.hand.reduce((sum, c) => sum + (c.kind === "number" ? c.value : 0), 0);

// Which player gets a Time Out, Draw Three or spare Shield.
// Matches the ChooseTarget signature the engine expects.
export function botPickTarget(
  players: Player[],
  actor: number,
  card: TargetedKind,
  options: number[]
): number {
  if (options.length === 1) return options[0];
  const opponents = options.filter((i) => i !== actor);
  if (opponents.length === 0) return actor;

  const best = (list: number[], key: (i: number) => number) =>
    list.reduce((a, b) => (key(b) > key(a) ? b : a));

  if (card === "shield") {
    // A gift. Give it to the player who is furthest behind.
    return best(opponents, (i) => -players[i].totalScore);
  }

  if (card === "timeOut") {
    // Lock in a strong row of our own, otherwise time out the leader who
    // has the weakest row, so they bank very little.
    if (options.includes(actor) && roundScore(players[actor]) >= 25) return actor;
    return best(opponents, (i) => players[i].totalScore - 2 * roundScore(players[i]));
  }

  // Draw Three: hand it to whoever is most likely to bust. Avoid players close
  // to a Seven Stack, since three free cards could win them the round.
  const safe = opponents.filter((i) => uniqueNumberCount(players[i]) < 5);
  const pool = safe.length > 0 ? safe : opponents;
  return best(pool, (i) => {
    const p = players[i];
    return uniqueNumberCount(p) * 2 + numberSum(p) / 10 - (p.hand.some(isShield) ? 10 : 0);
  });
}
