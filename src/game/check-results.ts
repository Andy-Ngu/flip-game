import { finalStandings, roundResults } from "./results";
import { Card, Player } from "./types";

let failures = 0;
function check(name: string, ok: boolean) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  if (!ok) failures++;
}

const num = (...values: number[]): Card[] => values.map((value) => ({ kind: "number", value }));
function player(name: string, hand: Card[], totalScore: number, status: Player["status"] = "stayed"): Player {
  return { id: name, name, hand, totalScore, status };
}

// ---- a normal round ----
const r = roundResults([
  player("Ann", num(5, 6), 10),               // 11 this round -> 21
  player("Bo", num(12, 3), 50, "busted"),     // busted: 0 -> 50
  player("Cy", num(1, 2, 3, 4, 5, 6, 7), 0),  // 28 + 15 Seven Stack = 43 -> 43
]);
check("rows are ordered by the new total, best first", r.rows.map((x) => x.name).join() === "Bo,Cy,Ann");
check("round points are listed", r.rows.find((x) => x.name === "Ann")!.roundPoints === 11);
check("a bust scores 0 but keeps the old total", r.rows[0].roundPoints === 0 && r.rows[0].total === 50);
check("the Seven Stack is flagged, and only for the player who made it",
  r.rows.filter((x) => x.sevenStack).map((x) => x.name).join() === "Cy");
check("the total before the round is kept for the count-up", r.rows.find((x) => x.name === "Ann")!.before === 10);
check("ranks are 1, 2, 3", r.rows.map((x) => x.rank).join() === "1,2,3");
check("nobody at 200 means the game goes on", !r.gameEnds && !r.tiedAtTop);

// ---- ties share a rank ----
const t = roundResults([
  player("A", num(5), 10),   // 15
  player("B", num(10), 5),   // 15
  player("C", num(1), 0),    // 1
]);
check("equal totals share a rank and the next rank is skipped", t.rows.map((x) => x.rank).join() === "1,1,3");
check("ties keep seat order", t.rows[0].name === "A" && t.rows[1].name === "B");

// ---- the game ends ----
const e = roundResults([
  player("Win", num(10), 195),   // 205
  player("Lose", num(5), 100),   // 105
]);
check("one player over 200 ends the game", e.gameEnds && !e.tiedAtTop);

// 199 + 1 = 200 counts
const edge = roundResults([player("Edge", num(1), 199), player("Other", num(2), 0)]);
check("exactly 200 ends the game", edge.gameEnds);

const under = roundResults([player("Close", num(0), 199), player("Other", num(2), 0)]);
check("199 does not end the game", !under.gameEnds && !under.tiedAtTop);

// ---- a tie at the top plays another round ----
const tie = roundResults([
  player("X", num(10), 195),
  player("Y", num(10), 195),
  player("Z", num(1), 0),
]);
check("a tie at the top is flagged and the game does not end", tie.tiedAtTop && !tie.gameEnds);

// ---- a bust cannot win ----
const bustLeader = roundResults([
  player("Bust", num(12), 190, "busted"),
  player("Safe", num(12), 150),  // 162
]);
check("a bust leaves the total at 190, so no one has won", !bustLeader.gameEnds);

// ---- final standings ----
const f = finalStandings([player("A", [], 120), player("B", [], 210), player("C", [], 120)]);
check("final standings are ordered", f.map((x) => x.name).join() === "B,A,C");
check("final standings share ranks on ties", f.map((x) => x.rank).join() === "1,2,2");

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
