import { ordinal } from "../../game/results";

export type ShareFacts = {
  won: boolean;
  score: number;     // your final total
  rounds: number;    // how many rounds the game took
  rank: number;      // where you finished (1 = winner)
  players: number;   // how many were at the table
};

// The message that goes to the phone's share sheet from the winner screen. Plain text only:
// no picture and no link yet.
export function shareMessage({ won, score, rounds, rank, players }: ShareFacts): string {
  if (won) return `I won Stack Seven with ${score} points in ${rounds} ${rounds === 1 ? "round" : "rounds"}!`;
  return `I scored ${score} in Stack Seven and finished ${ordinal(rank)} of ${players}.`;
}
