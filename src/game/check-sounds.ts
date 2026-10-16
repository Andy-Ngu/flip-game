import { GameEvent } from "./events";
import { soundsFor } from "./sounds";
import { Card, Player } from "./types";

let failures = 0;
function check(name: string, ok: boolean) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  if (!ok) failures++;
}

const human: Player = { id: "h", name: "H", hand: [], totalScore: 0, status: "playing" };
const bot: Player = { ...human, id: "b", name: "B", bot: "easy" };
const players = [human, bot, { ...bot, id: "c", name: "C" }];
const shield: Card = { kind: "action", action: "shield" };
const saved = (player: number): GameEvent => ({ kind: "saved", player, shield, duplicate: null });
const card = (player: number): GameEvent => ({ kind: "card", player, card: { kind: "number", value: 3 } });
const names = (events: GameEvent[]) => soundsFor(events, players).map((c) => c.sound).join();

check("nothing happening makes no sound", soundsFor([], players).length === 0);
check("drawing a card is one flick at time zero", JSON.stringify(soundsFor([card(0)], players)) === '[{"sound":"draw","at":0}]');
check("staying sounds the stay chime", names([{ kind: "stay", player: 0 }]) === "stay");

// ---- the outcome comes after the card that caused it ----
const bust = soundsFor([card(0), { kind: "bust", player: 0 }], players);
check("a bust is a flick, then the bust sound", bust.map((c) => c.sound).join() === "draw,bust");
check("the bust lands after the card", bust[1].at > bust[0].at);

check("a Shield rescue is a flick then the shield ting",
  names([card(0), saved(0)]) === "draw,shield");
check("a Time Out sounds the time-out blips", names([{ kind: "timedOut", player: 1 }]) === "timeOut");

// ---- Draw Three ----
const three = soundsFor([card(1), card(1), card(1)], players);
check("three cards give three flicks", three.length === 3 && three.every((c) => c.sound === "draw"));
check("the flicks are spread out in time", three[0].at < three[1].at && three[1].at < three[2].at);

const threeBust = soundsFor([card(1), card(1), card(1), { kind: "bust", player: 1 }], players);
check("a bust on the third card comes after all three flicks",
  threeBust.length === 4 && threeBust[3].sound === "bust" && threeBust[3].at > threeBust[2].at);

const many = soundsFor(Array.from({ length: 9 }, () => card(0)), players);
check("a long run of cards is capped at 4 flicks", many.length === 4);

// ---- only the most important outcome plays ----
check("a Seven Stack beats a stay",
  names([card(0), { kind: "stay", player: 1 }, { kind: "sevenStack", player: 0 }]) === "draw,sevenStack");
check("a bust beats a Time Out",
  names([{ kind: "timedOut", player: 1 }, { kind: "bust", player: 0 }]) === "bust");
check("a Time Out beats a stay", names([{ kind: "stay", player: 0 }, { kind: "timedOut", player: 1 }]) === "timeOut");

// ---- rounds and games ----
check("a new round is the dealing flurry only", names([{ kind: "newRound" }]) === "deal");
check("a human win plays the fanfare", names([{ kind: "gameOver", winners: [0] }]) === "win");
check("a computer win plays the calmer chime", names([{ kind: "gameOver", winners: [1] }]) === "roundEnd");
check("a shared win that includes a human plays the fanfare", names([{ kind: "gameOver", winners: [1, 0] }]) === "win");

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
