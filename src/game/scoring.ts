import { NumberCard, Player } from "./types";
function numberCards(player: Player): NumberCard[] {
  return player.hand.filter((c): c is NumberCard => c.kind === "number");
}
export function uniqueNumberCount(player: Player): number {
  return new Set(numberCards(player).map((c) => c.value)).size;
}
export function hasSevenStack(player: Player): boolean {
  return uniqueNumberCount(player) >= 7;
}
export function scoreHand(player: Player): number {
  if (player.status === "busted") return 0;
  let total = numberCards(player).reduce((sum, c) => sum + c.value, 0);
  const hasDouble = player.hand.some((c) => c.kind === "modifier" && c.multiplier === 2);
  if (hasDouble) total *= 2;
  for (const c of player.hand) if (c.kind === "modifier") total += c.bonus;
  if (hasSevenStack(player)) total += 15;
  return total;
}
// The score that wins the game. The table chooses one of three.
export const TARGETS = [150, 200, 250] as const;
export type Target = (typeof TARGETS)[number];
export const DEFAULT_TARGET: Target = 200;

export function isTarget(x: unknown): x is Target {
  return typeof x === "number" && (TARGETS as readonly number[]).includes(x);
}

export function getWinners(players: Player[], target: number = DEFAULT_TARGET): Player[] {
  const best = Math.max(...players.map((p) => p.totalScore));
  if (best < target) return [];
  return players.filter((p) => p.totalScore === best);
}
