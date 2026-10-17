import { GameEvent } from "./events";
import { CARD_GAP_MS, drawSound, RESHUFFLE_LAG_MS, soundsFor } from "./sounds";
import { Card } from "./types";

let failures = 0;
function check(name: string, ok: boolean) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  if (!ok) failures++;
}

const ME = 0; // the person holding the phone sits in seat 0
const shield: Card = { kind: "action", action: "shield" };
const saved = (player: number): GameEvent => ({ kind: "saved", player, shield, duplicate: null });
const card = (player: number, count = 1): GameEvent => ({ kind: "card", player, card: { kind: "number", value: 3 }, count });
const names = (events: GameEvent[], me = ME) => soundsFor(events, me).map((c) => c.sound).join();

check("nothing happening makes no sound", soundsFor([], ME).length === 0);
check("drawing your first card is one flick at time zero", JSON.stringify(soundsFor([card(0)], ME)) === '[{"sound":"draw","at":0}]');
check("staying sounds the stay chime", names([{ kind: "stay", player: 0 }]) === "stay");

console.log("\n--- The streak climbs ---");
check("the flick for each of your cards steps up", [1, 2, 3, 4, 5].map(drawSound).join() === "draw,draw2,draw3,draw4,draw5");
check("after the fifth card it stays on the top step", drawSound(6) === "draw5" && drawSound(7) === "draw5" && drawSound(12) === "draw5");
check("a card count below 1 is just the plain flick", drawSound(0) === "draw" && drawSound(-3) === "draw");
check("your own third card plays the third step", names([card(0, 3)]) === "draw3");
check("other players' cards are always the plain flick", names([card(1, 4)]) === "draw" && names([card(2, 5)]) === "draw");
check("it follows whose phone it is", names([card(1, 4)], 1) === "draw4");
check("Draw Three on you climbs three steps", names([card(0, 2), card(0, 3), card(0, 4)]) === "draw2,draw3,draw4");

console.log("\n--- The outcome comes after the card that caused it ---");
const bust = soundsFor([card(0), { kind: "bust", player: 0 }], ME);
check("a bust is a flick, then the bust sound", bust.map((c) => c.sound).join() === "draw,bust");
check("the bust lands after the card", bust[1].at > bust[0].at);
check("a Shield rescue is a flick then the shield ting", names([card(0), saved(0)]) === "draw,shield");
check("a Time Out sounds the time-out blips", names([{ kind: "timedOut", player: 1 }]) === "timeOut");

console.log("\n--- Draw Three ---");
const three = soundsFor([card(1), card(1), card(1)], ME);
check("three cards give three flicks", three.length === 3 && three.every((c) => c.sound === "draw"));
check("the flicks are spread out in time", three[0].at < three[1].at && three[1].at < three[2].at);
const threeBust = soundsFor([card(1), card(1), card(1), { kind: "bust", player: 1 }], ME);
check("a bust on the third card comes after all three flicks",
  threeBust.length === 4 && threeBust[3].sound === "bust" && threeBust[3].at > threeBust[2].at);
const many = soundsFor(Array.from({ length: 9 }, () => card(0)), ME);
check("a long run of cards is capped at 4 flicks", many.length === 4);

console.log("\n--- Only the most important outcome plays ---");
check("a Seven Stack beats a stay",
  names([card(0, 7), { kind: "stay", player: 1 }, { kind: "sevenStack", player: 0 }]) === "draw5,sevenStack");
check("a bust beats a Time Out", names([{ kind: "timedOut", player: 1 }, { kind: "bust", player: 0 }]) === "bust");
check("a Time Out beats a stay", names([{ kind: "stay", player: 0 }, { kind: "timedOut", player: 1 }]) === "timeOut");

console.log("\n--- The deck being reshuffled ---");
const shuffled = soundsFor([{ kind: "reshuffle" }, card(0, 2)], ME);
check("a reshuffle sounds the shuffle first, then the card", shuffled.map((c) => c.sound).join() === "shuffle,draw2");
check("the card waits for the shuffle", shuffled[0].at === 0 && shuffled[1].at === RESHUFFLE_LAG_MS);
const shuffledBust = soundsFor([{ kind: "reshuffle" }, card(1), { kind: "bust", player: 1 }], ME);
check("the outcome also waits for the shuffle", shuffledBust[2].at > RESHUFFLE_LAG_MS && shuffledBust[2].sound === "bust");
check("a reshuffle with nothing else is just the shuffle", names([{ kind: "reshuffle" }]) === "shuffle");
check("the shuffle is its own sound, not the dealing flurry", names([{ kind: "reshuffle" }]) !== names([{ kind: "newRound" }]));
check("the warning that the deck is short makes no sound", soundsFor([{ kind: "deckLow", left: 8 }], ME).length === 0);
check("a lead change makes no sound of its own", soundsFor([{ kind: "leadChange", from: 1, to: 0, points: 100, fromPoints: 90 }], ME).length === 0);
check("the flicks are still spaced by the usual gap", soundsFor([card(1), card(1)], ME)[1].at === CARD_GAP_MS);

console.log("\n--- Cards that arrive one by one are heard one by one ---");
const slow = soundsFor([card(0, 2), card(0, 3), card(0, 4)], ME, 450);
check("with a gap of 450 ms the three flicks are 450 ms apart", slow.map((c) => c.at).join() === "0,450,900");
check("the steps of the streak still climb", slow.map((c) => c.sound).join() === "draw2,draw3,draw4");
const slowBust = soundsFor([card(0), card(0), card(0), { kind: "bust", player: 0 }], ME, 450);
check("the bust waits for the last card at the slower pace", slowBust[3].sound === "bust" && slowBust[3].at > 900);
check("leaving the gap out gives the usual pace", JSON.stringify(soundsFor([card(1), card(1)], ME)) === JSON.stringify(soundsFor([card(1), card(1)], ME, CARD_GAP_MS)));

console.log("\n--- Rounds and games ---");
check("a new round is the dealing flurry only", names([{ kind: "newRound" }]) === "deal");
check("your win plays the fanfare", names([{ kind: "gameOver", winners: [0] }]) === "win");
check("someone else's win plays the calmer chime", names([{ kind: "gameOver", winners: [1] }]) === "roundEnd");
check("a shared win that includes you plays the fanfare", names([{ kind: "gameOver", winners: [1, 0] }]) === "win");
check("it follows whose phone it is", names([{ kind: "gameOver", winners: [1] }], 1) === "win");

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
