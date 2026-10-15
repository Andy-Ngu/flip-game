import { diffEvents, feelFor, GameEvent } from "./events";
import { act, chooseTarget, Game, newGame, nextRound } from "./session";
import { Card, Player } from "./types";

let failures = 0;
function check(name: string, ok: boolean) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  if (!ok) failures++;
}

const num = (value: number): Card => ({ kind: "number", value });
const timeOut: Card = { kind: "action", action: "timeOut" };
const shield: Card = { kind: "action", action: "shield" };
const mk = (id: string, hand: Card[] = [], bot?: "easy"): Player =>
  ({ id, name: id, hand, totalScore: 0, status: "playing", ...(bot ? { bot } : {}) });
const gameWith = (players: Player[], drawPile: Card[]): Game => ({
  round: { players, deck: { drawPile, discardPile: [] } },
  dealer: 0, current: 0, phase: "playing", winners: [], pending: null, choices: [], resume: null,
});
const kinds = (events: GameEvent[]) => events.map((e) => e.kind);

console.log("--- What happened ---");
const g0 = gameWith([mk("A", [num(1)]), mk("B"), mk("C")], [num(5), num(9)]);
check("no change means no events", diffEvents(g0, g0).length === 0);

let g1 = act(g0, "hit");
let ev = diffEvents(g0, g1);
check("drawing a card is one card event for the right player", ev.length === 1 && ev[0].kind === "card" && ev[0].player === 0);

g1 = act(gameWith([mk("A", [num(7)]), mk("B"), mk("C")], [num(7)]), "hit");
ev = diffEvents(gameWith([mk("A", [num(7)]), mk("B"), mk("C")], [num(7)]), g1);
check("a duplicate is a card and a bust", kinds(ev).includes("card") && kinds(ev).includes("bust"));

const stayFrom = gameWith([mk("A", [num(7)]), mk("B"), mk("C")], [num(7)]);
ev = diffEvents(stayFrom, act(stayFrom, "stay"));
check("staying is a stay event", ev.length === 1 && ev[0].kind === "stay");

const saveFrom = gameWith([mk("A", [num(7), shield]), mk("B"), mk("C")], [num(7)]);
ev = diffEvents(saveFrom, act(saveFrom, "hit"));
check("a Shield rescue is 'saved', not a bust", kinds(ev).includes("saved") && !kinds(ev).includes("bust"));
check("a rescue adds no card", !kinds(ev).includes("card"));

const timeOutFrom = act(gameWith([mk("A", [num(1)]), mk("B"), mk("C")], [timeOut, num(9)]), "hit");
const timedOutAfter = chooseTarget(timeOutFrom, 2);
ev = diffEvents(timeOutFrom, timedOutAfter);
check("timing a player out is a timedOut event for them", ev.some((e) => e.kind === "timedOut" && e.player === 2));

const six = [num(1), num(2), num(3), num(4), num(5), num(6)];
const flipFrom = gameWith([mk("A", six), mk("B"), mk("C")], [num(7)]);
ev = diffEvents(flipFrom, act(flipFrom, "hit"));
check("a seventh different number is sevenStack", kinds(ev).includes("sevenStack"));

const over = act(flipFrom, "hit");
check("a finished round alone does not announce a new round", !kinds(diffEvents(flipFrom, over)).includes("newRound"));
const nr = nextRound(over);
check("scoring a round starts a new round", nr.phase === "gameOver" || diffEvents(over, nr)[0].kind === "newRound");

const wonGame: Game = { ...over, round: { ...over.round, players: over.round.players.map((p, i) => ({ ...p, totalScore: i === 1 ? 250 : 20 })) } };
const finished = nextRound({ ...wonGame, phase: "roundOver" });
ev = diffEvents({ ...wonGame, phase: "roundOver" }, finished);
check("ending the game reports the winner's seat", finished.phase === "gameOver" && ev.length === 1 && ev[0].kind === "gameOver" && ev[0].winners[0] === 1);

const fresh = newGame(["A", "B", "C"]);
check("starting a new game is a new round", diffEvents({ ...fresh, phase: "gameOver" }, fresh)[0].kind === "newRound");

console.log("\n--- How it feels ---");
const table = [mk("You"), mk("Robo", [], "easy"), mk("Bolt", [], "easy")];
const feel = (events: GameEvent[]) => feelFor(events, table);
check("nothing happening feels like nothing", feel([]) === null);
check("a card is the faintest tick", feel([{ kind: "card", player: 1, card: num(3) }]) === "tick");
check("your own bust is the strongest error buzz", feel([{ kind: "bust", player: 0 }]) === "error");
check("a computer's bust is only a warning", feel([{ kind: "bust", player: 1 }]) === "warning");
check("a time out feels heavy", feel([{ kind: "timedOut", player: 2 }]) === "heavy");
check("a rescue feels medium", feel([{ kind: "saved", player: 0 }]) === "medium");
check("your seven stack is a success", feel([{ kind: "sevenStack", player: 0 }]) === "success");
check("winning the game is a success", feel([{ kind: "gameOver", winners: [0] }]) === "success");
check("losing the game is a warning", feel([{ kind: "gameOver", winners: [2] }]) === "warning");
check("the strongest event in a batch wins",
  feel([{ kind: "card", player: 0, card: num(3) }, { kind: "bust", player: 0 }, { kind: "stay", player: 1 }]) === "error");

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
