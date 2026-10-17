import { describeRound, duplicateIndex, finalStandings, ordinal, roundResults, startRows, turnPosition } from "./results";
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

// ---- the target can be 150 or 250 ----
const t150 = roundResults([player("A", num(10), 145), player("B", num(2), 0)], 150);
check("playing to 150, reaching 155 ends the game", t150.gameEnds);
const t150b = roundResults([player("A", num(4), 145), player("B", num(2), 0)], 150);
check("playing to 150, 149 does not", !t150b.gameEnds);
const t250 = roundResults([player("A", num(10), 205), player("B", num(2), 0)], 250);
check("playing to 250, 215 does not end the game", !t250.gameEnds);
check("playing to 250, 250 exactly does", roundResults([player("A", num(10), 240), player("B", num(2), 0)], 250).gameEnds);
check("with no target given it is still 200", roundResults([player("A", num(10), 195), player("B", num(2), 0)]).gameEnds);

// ---- what happened, in a few words ----
const mod = (bonus: number, multiplier = 1): Card => ({ kind: "modifier", bonus, multiplier });
const lines = roundResults([
  player("Ann", [...num(8, 3, 9), mod(0, 2)], 0),                       // stayed, Double Score
  player("Bea", [...num(7, 2, 7)], 0, "busted"),
  { ...player("Cal", [...num(5, 4), { kind: "action", action: "timeOut" } as Card], 0, "timedOut"), timedOutBy: 0 },
  { ...player("Dee", num(6), 0, "timedOut"), timedOutBy: 3 },
  player("Eli", [...num(1, 2, 3, 4, 5, 6, 7)], 0),
  player("Fay", num(4, 9), 0),
  { ...player("Gus", num(2, 8, 5), 0), autoStayed: true },
  player("Hal", [...num(9, 3, 4), mod(4)], 0),
  player("Ivy", num(10), 0, "playing"),
]);
const lineOf = (name: string) => lines.rows.find((x) => x.name === name)!.line;
check("a stay says how many cards, and not Double Score (the points already show it)", lineOf("Ann") === "Stayed with 4 cards");
check("a bust names the duplicate", lineOf("Bea") === "Busted on a second 7");
check("a Time Out names who played it, and not what is kept", lineOf("Cal") === "Timed out by Ann");
check("timing yourself out is said plainly", lineOf("Dee") === "Timed themselves out");
check("a Seven Stack is called out", lineOf("Eli") === "Made a Seven Stack (+15)");
check("staying with two cards is 'early'", lineOf("Fay") === "Stayed early with 2 cards");
check("an automatic stay says the time ran out", lineOf("Gus") === "Time ran out, stayed with 3 cards");
check("a bonus card is not mentioned (the points show it)", lineOf("Hal") === "Stayed with 4 cards");
check("no line has a dot in it: only the main fact is said", lines.rows.every((x) => !x.line.includes("·")));
check("a player still in when a Seven Stack ended the round is described", lineOf("Ivy") === "Still in when the round ended");
check("one card is singular", describeRound(player("Z", num(5), 0), [player("Z", num(5), 0)]) === "Stayed early with 1 card");

console.log("\n--- The start of a round ---");
check("the player after the dealer plays first", turnPosition(1, 0, 6) === 1 && turnPosition(2, 0, 6) === 2);
check("the dealer plays last", turnPosition(0, 0, 6) === 6 && turnPosition(3, 3, 4) === 4);
check("the order wraps round the table", turnPosition(0, 2, 6) === 4 && turnPosition(1, 5, 6) === 2);
check("a table of three", [0, 1, 2].map((s) => turnPosition(s, 1, 3)).join() === "2,3,1");
check("every seat has its own place, whoever deals", [3, 4, 5, 6, 7, 8].every((n) => Array.from({ length: n }, (_, d) => new Set(Array.from({ length: n }, (_, s) => turnPosition(s, d, n))).size === n).every(Boolean)));
check("ordinal words", [1, 2, 3, 4, 5, 6, 7, 8].map(ordinal).join() === "1st,2nd,3rd,4th,5th,6th,7th,8th");
check("ordinal words past ten", [11, 12, 13, 21, 22, 23, 101, 111].map(ordinal).join() === "11th,12th,13th,21st,22nd,23rd,101st,111th");

const table = [player("Andy", [], 128), player("Fizz", [], 190), player("Robo", [], 128), player("Cleo", [], 40)];
const rows = startRows(table, 2);
check("the start board lists the best score first", rows.map((x) => x.name).join() === "Fizz,Andy,Robo,Cleo");
check("tied scores are listed in playing order (Robo deals, so plays last)", rows[1].name === "Andy" && rows[2].name === "Robo" && rows[1].plays === 2 && rows[2].plays === 4);
check("each row says when that player plays", rows.every((x) => x.plays === turnPosition(x.seat, 2, 4)));
check("the first round has everyone on zero, so the board is in playing order", startRows(["A", "B", "C", "D"].map((n) => player(n, [], 0)), 0).map((x) => x.name).join() === "B,C,D,A");
check("rows keep their seat and look", (() => {
  const r2 = startRows([{ ...player("Me", [], 5), look: { character: "fox", color: "#F2C14E" } }, { ...player("Bot", [], 9), bot: "easy" }, player("Z", [], 1)], 0);
  return r2[0].seat === 1 && r2[0].bot === "easy" && r2[1].look?.character === "fox";
})());

console.log("\n--- Finding the card that busted a player ---");
check("no repeat means no duplicate", duplicateIndex(num(3, 7, 11)) === null);
check("the second 7 is the duplicate", duplicateIndex(num(3, 7, 11, 7)) === 3);
check("cards held after the bust do not move it", duplicateIndex([...num(3, 7, 7), { kind: "action", action: "timeOut" }]) === 2);
check("an empty hand has no duplicate", duplicateIndex([]) === null);
check("bonus and action cards are never duplicates", duplicateIndex([{ kind: "modifier", bonus: 4, multiplier: 1 }, { kind: "modifier", bonus: 4, multiplier: 1 }, { kind: "action", action: "shield" }, { kind: "action", action: "shield" }]) === null);

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
