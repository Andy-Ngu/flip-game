import { isAimedAt, playedOnYou } from "./played";
import { act, botPlay, botStep, Play } from "./session";
import { drawThree, gameFrom, mk, num, timeOut } from "./testkit";

let failures = 0;
function check(name: string, ok: boolean) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  if (!ok) failures++;
}

const ME = 0;
// You (seat 0, a person), Gus and Robo (computers). Gus is to act and draws the card named in the pile.
const table = (pile: Parameters<typeof gameFrom>[1]) =>
  gameFrom(
    [mk("Andy", [num(5), num(7)]), mk("Gus", [num(2)], "playing", { bot: "medium" }), mk("Robo", [], "playing", { bot: "medium" })],
    pile,
    { current: 1 }
  );

console.log("--- What the computer is about to play ---");
let g = table([drawThree, num(9), num(3), num(1), num(4)]);
check("before Gus draws anything there is no card to play", botPlay(g) === null);
g = act(g, "hit");
check("Gus drew Draw Three and has to pick a player", g.pending?.card === "drawThree" && g.pending.actor === 1);
const play = botPlay(g);
check("botPlay says who, which card and who gets it", play !== null && play.actor === 1 && play.card === "drawThree" && play.target === ME);
check("asking does not change the game", g.pending?.card === "drawThree" && g.round.players[ME].hand.length === 2);
const after = botStep(g);
check("the move botStep makes goes to the same player: the card and three more land in your hand", after.round.players[ME].hand.length === 6 && after.round.players[ME].hand[2].kind === "action");
check("its note says who played what on whom", after.note === "Gus played Draw Three on Andy");

const waiting = gameFrom([mk("Andy", [num(5)], "playing", { }), mk("Gus", [], "playing", { bot: "medium" })], [timeOut, num(2)]);
const yours = act(waiting, "hit");
check("a question for the person holding the phone is not a computer's play", yours.pending?.actor === 0 && botPlay(yours) === null);

console.log("\n--- Is it aimed at you? ---");
const aim = (actor: number, target: number): Play => ({ actor, card: "drawThree", target });
check("a play on you by another player", isAimedAt(aim(1, ME), ME));
check("a play on someone else is not", !isAimedAt(aim(1, 2), ME));
check("a play on yourself is not news", !isAimedAt(aim(ME, ME), ME));
check("no play is not", !isAimedAt(null, ME));
check("it follows whose phone it is", isAimedAt(aim(0, 1), 1) && !isAimedAt(aim(0, 1), 0));

console.log("\n--- The words ---");
const players = [mk("Andy", [num(5), num(7)]), mk("Gus", [], "playing", { bot: "medium" }), mk("Robo")];
const three = playedOnYou({ actor: 1, card: "drawThree", target: ME }, players);
check("Draw Three: who, what, and what happens", three.top === "GUS PLAYED" && three.heading === "DRAW THREE ON YOU" && three.effect === "You draw 3 cards.");
check("Draw Three is not a gift", !three.good && three.card.kind === "action" && three.card.action === "drawThree");
check("a screen reader hears it as one sentence", three.spoken === "Gus played Draw Three on you. You draw 3 cards.");

const out = playedOnYou({ actor: 2, card: "timeOut", target: ME }, players);
check("Time Out says you are out and keep your points", out.heading === "TIME OUT ON YOU" && out.effect === "You are out for this round.\nYou keep 12 points.");
check("Time Out names the right player", out.top === "ROBO PLAYED" && out.spoken === "Robo played Time Out on you. You are out for this round. You keep 12 points.");
const outEmpty = playedOnYou({ actor: 2, card: "timeOut", target: 1 }, players);
check("with no cards there are no points to keep", outEmpty.effect === "You are out for this round.");
const onePoint = playedOnYou({ actor: 1, card: "timeOut", target: ME }, [mk("Andy", [num(1)]), ...players.slice(1)]);
check("one point is not \"1 points\"", onePoint.effect === "You are out for this round.\nYou keep 1 point.");

const gift = playedOnYou({ actor: 1, card: "shield", target: ME }, players);
check("a spare Shield is a gift", gift.good && gift.top === "GUS GAVE YOU" && gift.heading === "A SPARE SHIELD");
check("a spare Shield says what it does", gift.effect === "It blocks your next duplicate." && gift.spoken === "Gus gave you a spare Shield. It blocks your next duplicate.");
check("the Shield card is shown", gift.card.kind === "action" && gift.card.action === "shield");

const odd = playedOnYou({ actor: 9, card: "drawThree", target: ME }, players);
check("a seat that is not there does not crash it", odd.top === "SOMEONE PLAYED");

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
