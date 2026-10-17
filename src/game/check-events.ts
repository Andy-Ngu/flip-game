import { diffEvents, feelFor, GameEvent } from "./events";
import { act, chooseTarget, Game, newGame, nextRound } from "./session";
import { Card, Player } from "./types";
import { gameFrom, mk as player } from "./testkit";
import { LOW_DECK } from "./moments";

let failures = 0;
function check(name: string, ok: boolean) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  if (!ok) failures++;
}

const num = (value: number): Card => ({ kind: "number", value });
const timeOut: Card = { kind: "action", action: "timeOut" };
const shield: Card = { kind: "action", action: "shield" };
const drawThree: Card = { kind: "action", action: "drawThree" };
const mk = (id: string, hand: Card[] = [], bot?: "easy"): Player =>
  ({ id, name: id, hand, totalScore: 0, status: "playing", ...(bot ? { bot } : {}) });
const gameWith = (players: Player[], drawPile: Card[]): Game => gameFrom(players, drawPile);
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
const savedEv = ev.find((e) => e.kind === "saved");
check("the saved event names the Shield that was used",
  savedEv?.kind === "saved" && savedEv.shield.kind === "action" && savedEv.shield.action === "shield");
check("the saved event carries the duplicate that was blocked",
  savedEv?.kind === "saved" && savedEv.duplicate?.kind === "number" && savedEv.duplicate.value === 7);
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

console.log("\n--- What else can happen in a move ---");
// A card event now says how many cards that player holds right after it.
{
  const f = gameWith([player("A", [num(1), num(2)]), player("B"), player("C")], [num(5), num(9)]);
  const ev1 = diffEvents(f, act(f, "hit"));
  check("a card event says how many cards the player holds", ev1.length === 1 && ev1[0].kind === "card" && ev1[0].count === 3);

  const first = gameWith([player("A"), player("B"), player("C")], [num(5)]);
  const ev0 = diffEvents(first, act(first, "hit"));
  check("the first card of a hand is number 1", ev0[0].kind === "card" && ev0[0].count === 1);

  // Draw Three: three cards for one player arrive as counts 2, 3, 4.
  const d3 = act(gameWith([player("A", [num(1)]), player("B", [num(2)]), player("C", [num(3)])], [drawThree, num(4), num(5), num(6)]), "hit");
  const after = chooseTarget(d3, 1);
  const evs = diffEvents(d3, after).filter((e) => e.kind === "card");
  check("Draw Three lands on the player, then their three cards come one after another",
    evs.length === 4 && evs.every((e) => e.kind === "card" && e.player === 1) && evs.map((e) => (e.kind === "card" ? e.count : 0)).join() === "2,3,4,5" &&
    evs[0].kind === "card" && evs[0].card.kind === "action");
}

console.log("\n--- The deck ---");
{
  const pile = (n: number) => Array.from({ length: n }, () => num(9));
  const quiet = gameWith([player("A", [num(1)]), player("B"), player("C")], pile(LOW_DECK + 5));
  check("a full deck says nothing", !kinds(diffEvents(quiet, act(quiet, "hit"))).includes("deckLow"));

  const edge = gameWith([player("A", [num(1)]), player("B"), player("C")], pile(LOW_DECK + 1));
  const ev2 = diffEvents(edge, act(edge, "hit"));
  const low = ev2.find((e) => e.kind === "deckLow");
  check("the pile getting short is reported once", low?.kind === "deckLow" && low.left === LOW_DECK);

  const already = gameWith([player("A", [num(1)]), player("B"), player("C")], pile(LOW_DECK));
  check("it is not reported again while it stays short", !kinds(diffEvents(already, act(already, "hit"))).includes("deckLow"));

  const dry = gameFrom([player("A", [num(1)]), player("B"), player("C")], [num(5)], { });
  const dryAfter = act(dry, "hit"); // takes the last card
  check("taking the last card is not a 'getting short' warning", !kinds(diffEvents(dry, dryAfter)).includes("deckLow"));

  // A reshuffle: the draw pile is empty, the discard pile becomes the deck.
  const empty = gameFrom([player("A", [num(1)]), player("B"), player("C")], [], { });
  const shuffled = { ...empty, round: { ...empty.round, deck: { drawPile: [], discardPile: [num(2), num(3), num(4), num(8)], seed: 5 } } };
  const sAfter = act(shuffled, "hit");
  check("the pile running out and being reshuffled is reported", sAfter.round.deck.seed === 6 && kinds(diffEvents(shuffled, sAfter)).includes("reshuffle"));
  check("a normal draw is not a reshuffle", !kinds(diffEvents(g0, act(g0, "hit"))).includes("reshuffle"));
}

console.log("\n--- The lead ---");
{
  // Robo has 90 and leads. Sam stays on 80 but draws a 12 and takes the lead.
  const lead = gameFrom(
    [player("Sam", [num(5)], "playing", { totalScore: 80 }), player("Robo", [], "stayed", { totalScore: 90, bot: "easy" }), player("Cy", [], "stayed", { totalScore: 10 })],
    [num(12)],
  );
  const taken = act(lead, "hit");
  const ev3 = diffEvents(lead, taken).find((e) => e.kind === "leadChange");
  check("passing the leader is a lead change", ev3?.kind === "leadChange" && ev3.from === 1 && ev3.to === 0);
  check("it carries both scores for the toast", ev3?.kind === "leadChange" && ev3.points === 97 && ev3.fromPoints === 90);

  check("drawing without passing anyone is not a lead change", !kinds(diffEvents(lead, act({ ...lead, round: { ...lead.round, deck: { ...lead.round.deck, drawPile: [num(1)] } } }, "hit"))).includes("leadChange"));

  // A tie at the top means nobody leads, so nothing is announced.
  const tie = gameFrom(
    [player("Sam", [num(5)], "playing", { totalScore: 85 }), player("Robo", [], "stayed", { totalScore: 90, bot: "easy" }), player("Cy", [], "stayed", { totalScore: 10 })],
    [num(5)],
  );
  check("drawing into a tie at the top announces nothing", !kinds(diffEvents(tie, act(tie, "hit"))).includes("leadChange"));

  // Busting the lead away: the leader busts and the runner-up is now ahead.
  const bustLead = gameFrom(
    [player("Sam", [num(5), num(9)], "playing", { totalScore: 80 }), player("Robo", [], "stayed", { totalScore: 90, bot: "easy" }), player("Cy", [], "stayed", { totalScore: 10 })],
    [num(9)],
  );
  const bustEvents = diffEvents(bustLead, act(bustLead, "hit"));
  const handed = bustEvents.find((e) => e.kind === "leadChange");
  check("the leader busting hands the lead over", kinds(bustEvents).includes("bust") && handed?.kind === "leadChange" && handed.from === 0 && handed.to === 1 && handed.points === 90 && handed.fromPoints === 80);
}

console.log("\n--- Things that are not moves ---");
{
  const over2 = act(flipFrom, "hit");
  check("a message appearing during the results is not a new round", diffEvents(over2, { ...over2, note: "hello" }).length === 0);
  check("a seat being covered during the results is not a new round", diffEvents(over2, { ...over2, cover: [true, false, false] }).length === 0);
  check("the next round still is one", nextRound(over2).phase !== "roundOver" && diffEvents(over2, nextRound(over2)).some((e) => e.kind === "newRound" || e.kind === "gameOver"));
}

console.log("\n--- How it feels ---");
const feel = (events: GameEvent[], me = 0) => feelFor(events, me);
const cardEv = (player: number, count: number): GameEvent => ({ kind: "card", player, card: num(3), count });
check("nothing happening feels like nothing", feel([]) === null);
check("another player's card is the faintest tick", feel([cardEv(1, 3)]) === "tick");
check("your first cards are a tick", feel([cardEv(0, 1)]) === "tick" && feel([cardEv(0, 2)]) === "tick");
check("your third and fourth cards are a little firmer", feel([cardEv(0, 3)]) === "light" && feel([cardEv(0, 4)]) === "light");
check("your fifth card and beyond are firmer still", feel([cardEv(0, 5)]) === "medium" && feel([cardEv(0, 6)]) === "medium");
check("your own bust is the strongest error buzz", feel([{ kind: "bust", player: 0 }]) === "error");
check("another player's bust is only a warning", feel([{ kind: "bust", player: 1 }]) === "warning");
check("it follows whose phone it is", feel([{ kind: "bust", player: 1 }], 1) === "error" && feel([{ kind: "bust", player: 0 }], 1) === "warning");
check("a time out feels heavy", feel([{ kind: "timedOut", player: 2 }]) === "heavy");
check("a rescue feels medium", feel([{ kind: "saved", player: 0, shield, duplicate: null }]) === "medium");
check("your seven stack is a success", feel([{ kind: "sevenStack", player: 0 }]) === "success");
check("someone else's seven stack is heavy", feel([{ kind: "sevenStack", player: 2 }]) === "heavy");
check("winning the game is a success", feel([{ kind: "gameOver", winners: [0] }]) === "success");
check("losing the game is a warning", feel([{ kind: "gameOver", winners: [2] }]) === "warning");
check("a shared win that includes you is a success", feel([{ kind: "gameOver", winners: [2, 0] }]) === "success");
check("taking the lead feels like a success", feel([{ kind: "leadChange", from: 1, to: 0, points: 100, fromPoints: 90 }]) === "success");
check("someone else taking the lead is a light touch", feel([{ kind: "leadChange", from: 0, to: 1, points: 100, fromPoints: 90 }]) === "light");
check("a reshuffle feels medium", feel([{ kind: "reshuffle" }]) === "medium");
check("the strongest event in a batch wins",
  feel([cardEv(0, 3), { kind: "bust", player: 0 }, { kind: "stay", player: 1 }]) === "error");

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
