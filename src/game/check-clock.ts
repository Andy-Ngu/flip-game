import {
  AUTO_STAY_LIMIT, CLOCK_CHOICES, clockFraction, clockMood, DEFAULT_CLOCK, isClockSeconds, secondsLeft, shouldTick,
} from "./clock";
import { botPauseMs, DEFAULT_SPEED, isGameSpeed, paced } from "./pace";
import { act, actorOf, botStep, chooseTarget, Game, imBack, isBotSeat, isBotTurn, newGame, nextRound, timeUp } from "./session";
import { gameFrom, mk, num, timeOut } from "./testkit";

let failures = 0;
function check(name: string, ok: boolean) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  if (!ok) failures++;
}

console.log("--- The clock ---");
check("the choices are 15, 30 and 60 seconds", CLOCK_CHOICES.join() === "15,30,60");
check("30 seconds is the default", DEFAULT_CLOCK === 30);
check("45 is not a clock setting", !isClockSeconds(45) && isClockSeconds(15) && !isClockSeconds("30"));
check("plenty of time is calm", clockMood(30) === "calm" && clockMood(11) === "calm");
check("under ten seconds is low", clockMood(10) === "low" && clockMood(6) === "low");
check("the last five seconds are critical", clockMood(5) === "critical" && clockMood(1) === "critical" && clockMood(0) === "critical");
check("the clock ticks in the last five seconds, once a second", [5, 4, 3, 2, 1].every(shouldTick));
check("it does not tick before then, or at zero", !shouldTick(6) && !shouldTick(30) && !shouldTick(0));
check("a fresh clock shows the full time", secondsLeft(30, 0) === 30);
check("it still shows 30 for the first second", secondsLeft(30, 900) === 30);
check("it counts down once a second has passed", secondsLeft(30, 1000) === 29 && secondsLeft(30, 29001) === 1 && secondsLeft(30, 28500) === 2);
check("it shows 0 only when time is up, and never goes negative", secondsLeft(30, 30000) === 0 && secondsLeft(30, 99999) === 0);
check("the ring is full, half, then empty", clockFraction(30, 0) === 1 && clockFraction(30, 15000) === 0.5 && clockFraction(30, 40000) === 0);

console.log("\n--- Game speed ---");
check("normal speed leaves times alone", paced(1000, "normal") === 1000);
check("slower takes longer and faster takes less", paced(1000, "slower") === 1500 && paced(1000, "faster") === 600);
check("normal is the default speed", DEFAULT_SPEED === "normal" && isGameSpeed("faster") && !isGameSpeed("turbo"));
check("a computer pauses 0.6 to 0.9 seconds at normal speed", botPauseMs("normal", () => 0) === 600 && botPauseMs("normal", () => 1) === 900);
check("the pause scales with the speed", botPauseMs("slower", () => 1) === 1350 && botPauseMs("faster", () => 0) === 360);
let pausesInRange = true;
for (let i = 0; i < 1000; i++) {
  const ms = botPauseMs("normal");
  if (ms < 600 || ms > 900) pausesInRange = false;
}
check("every random pause stays in range", pausesInRange);

console.log("\n--- Running out of time ---");
const table = (extra: Partial<Game> = {}, pile = [num(5), num(9)]) =>
  gameFrom([mk("A", [num(4)]), mk("B", [num(2)], "playing", { bot: "easy" }), mk("C", [num(3)], "playing", { bot: "easy" })], pile, extra);

let g = table();
check("player 0 is the one to act", actorOf(g) === 0 && !isBotTurn(g));
let t = timeUp(g);
check("when time runs out you stay", t.round.players[0].status === "stayed");
check("the screen is told what happened", (t.note ?? "").includes("stayed"));
check("the round remembers it was an automatic stay", t.round.players[0].autoStayed === true);
check("the missed turn is counted", t.quiet[0] === 1);
check("the turn moves on", actorOf(t) === 1);
check("nobody else is affected", t.quiet[1] === 0 && t.round.players[1].status === "playing");

check("a computer's turn is not timed", (() => { const b = { ...g, current: 1 }; return timeUp(b) === b; })());
check("with nobody to act, time up does nothing", (() => { const over = { ...g, current: -1, phase: "roundOver" as const }; return timeUp(over) === over; })());

g = table({ quiet: [AUTO_STAY_LIMIT - 1, 0, 0] });
t = timeUp(g);
check("three missed turns in a row hand the seat to a computer", t.cover[0] === true && isBotSeat(t, 0));
g = table({ quiet: [AUTO_STAY_LIMIT - 2, 0, 0] });
check("two missed turns do not", timeUp(g).cover[0] === false);

console.log("\n--- Answering for you ---");
g = gameFrom([mk("A", [num(1)]), mk("B", [num(2)], "playing", { bot: "easy" }), mk("C", [num(3)], "playing", { bot: "easy" })], [timeOut, num(9)]);
let asked = act(g, "hit");
check("drawing a Time Out asks you for a target", asked.pending?.card === "timeOut" && asked.pending.actor === 0);
t = timeUp(asked, () => 0.99); // the last legal player
check("a random legal player gets the card", t.round.players[2].status === "timedOut" && t.pending === null);
check("the screen is told who got it", (t.note ?? "").includes("C"));
check("not choosing counts as a missed turn", t.quiet[0] === 1);
t = timeUp(asked, () => 0);
check("a different roll picks a different player", t.round.players[0].status === "timedOut");

console.log("\n--- Real moves start the count again ---");
g = table({ quiet: [2, 0, 0] });
check("hitting yourself resets the missed turns", act(g, "hit").quiet[0] === 0);
check("staying yourself resets them too", act(g, "stay").quiet[0] === 0);
check("choosing a target yourself resets them", chooseTarget(asked, 2).quiet[0] === 0);
const withQuiet = gameFrom([mk("A", [num(1)]), mk("B", [num(2)], "playing", { bot: "easy" }), mk("C", [num(3)], "playing", { bot: "easy" })], [timeOut, num(9)], { quiet: [2, 0, 0] });
const hitTimeOut = act(withQuiet, "hit");
check("hitting is a real move even when it leads to a question", hitTimeOut.pending !== null && hitTimeOut.quiet[0] === 0);

console.log("\n--- A computer covers your seat ---");
g = table({ cover: [true, false, false] });
check("a covered seat is played by the computer", isBotTurn(g) && isBotSeat(g, 0));
check("time up does nothing on a covered seat", timeUp(g) === g);
const moved = botStep(g);
check("the computer makes a move for you", moved !== g && moved.note !== undefined);
check("the computer's moves do not clear your missed turns", botStep({ ...g, quiet: [3, 0, 0] }).quiet[0] === 3);
const back = imBack({ ...g, quiet: [3, 0, 0] }, 0);
check("tapping I'm back takes the seat back", !back.cover[0] && back.quiet[0] === 0 && !isBotTurn(back));
check("coming back with nothing to undo changes nothing", imBack(table(), 0) === table() || imBack(table(), 0).cover[0] === false);

console.log("\n--- Three quiet turns, start to finish ---");
// A human who never acts: how long until a computer takes over?
let sim: Game = newGame([{ name: "Me" }, { name: "R1", bot: "medium" }, { name: "R2", bot: "medium" }]);
let timeUps = 0, steps = 0, loneBust = false;
while (!sim.cover[0] && steps++ < 2000) {
  if (sim.phase === "roundOver") { sim = nextRound(sim); continue; }
  if (sim.phase === "gameOver") break;
  if (isBotTurn(sim)) sim = botStep(sim);
  else { sim = timeUp(sim); timeUps++; }
}
check("the computer takes the seat after exactly three missed turns", sim.cover[0] === true && timeUps === AUTO_STAY_LIMIT || sim.phase === "gameOver");
check("from then on every move at the table is a computer's", !sim.cover[0] || sim.phase === "gameOver" || isBotTurn(sim) || sim.phase !== "playing");

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
