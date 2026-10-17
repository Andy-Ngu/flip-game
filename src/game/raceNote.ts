import { Player } from "./types";
import { pointsText } from "./words";

// The note at the top of the Standings sheet: how far the leader still is from winning, in a few words.
// Worked out from the banked totals alone (not this round's cards), so it only changes when a round ends.

export type RaceNote = {
  number: number;     // the big number: points the leader still needs (0 once the target has been reached)
  headline: string;   // "Fizz is 23 points from winning"
  rule: string;       // the one line about how the game ends
};

// Who is named: "You", "Fizz", "You and Fizz", "Fizz and Robo", or "3 players" when too many to list.
// `leaders` are seats; you always come first.
function whoIs(players: Player[], leaders: number[], me: number): { names: string; plural: boolean } {
  const ordered = [...leaders].sort((a, b) => (a === me ? -1 : b === me ? 1 : a - b));
  const label = (seat: number): string => (seat === me ? "You" : players[seat].name);
  if (ordered.length === 1) return { names: label(ordered[0]), plural: ordered[0] === me };
  if (ordered.length === 2) return { names: `${label(ordered[0])} and ${label(ordered[1])}`, plural: true };
  return { names: `${ordered.length} players`, plural: true };
}

export function raceNote(players: Player[], me: number, target: number): RaceNote {
  const rule = `First to ${target} wins at the end of a round. A tie at the top plays another round.`;
  const top = players.length === 0 ? 0 : Math.max(...players.map((p) => p.totalScore));

  // Nobody has banked a point yet: everyone has the whole way to go.
  if (top <= 0) return { number: target, headline: `Everyone is ${pointsText(target)} from winning`, rule };

  const leaders = players.map((_, seat) => seat).filter((seat) => players[seat].totalScore === top);
  const { names, plural } = whoIs(players, leaders, me);
  const togo = Math.max(0, target - top);

  if (togo === 0) {
    // At or past the target. If it were one player the game would already be over, so this is a tie
    // (or the very last moment before the game ends).
    return leaders.length > 1
      ? { number: 0, headline: `${names} are tied at the top`, rule }
      : { number: 0, headline: `${names} ${plural ? "have" : "has"} reached ${target}`, rule };
  }
  return { number: togo, headline: `${names} ${plural ? "are" : "is"} ${pointsText(togo)} from winning`, rule };
}
