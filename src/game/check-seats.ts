import { COLORS, ROBOT } from "./profile";
import {
  BOT_LEVEL_LABEL, BOT_NAMES, botLook, DEFAULT_TABLE, isSeatCount, MAX_SEATS, MIN_SEATS,
  parseTable, SEAT_COUNTS, tableSetup, TableSetup,
} from "./seats";
import { botStep, isBotTurn, newGame } from "./session";
import { Look } from "./types";

let failures = 0;
function check(name: string, ok: boolean) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  if (!ok) failures++;
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

console.log("--- Table size ---");
check("a table has 3 to 8 seats", MIN_SEATS === 3 && MAX_SEATS === 8 && same([...SEAT_COUNTS], [3, 4, 5, 6, 7, 8]));
check("two seats is not a table", !isSeatCount(2) && !isSeatCount(1) && !isSeatCount(0));
check("nine seats is not a table", !isSeatCount(9));
check("every size from 3 to 8 is allowed", SEAT_COUNTS.every(isSeatCount));
check("a size has to be a whole number", !isSeatCount(4.5) && !isSeatCount("4") && !isSeatCount(null));
check("the default table is valid", isSeatCount(DEFAULT_TABLE.seats) && DEFAULT_TABLE.target === 200 && DEFAULT_TABLE.clock === 30 && DEFAULT_TABLE.botLevel === "medium");
check("the skills are called Easy, Normal and Hard", BOT_LEVEL_LABEL.easy === "Easy" && BOT_LEVEL_LABEL.medium === "Normal" && BOT_LEVEL_LABEL.hard === "Hard");
check("there are enough computer names for a full table", BOT_NAMES.length >= MAX_SEATS - 1 && new Set(BOT_NAMES).size === BOT_NAMES.length);

console.log("\n--- Reading a stored table ---");
const mine: TableSetup = { seats: 4, botLevel: "hard", target: 150, clock: 60 };
check("a good table comes back unchanged", same(parseTable(JSON.parse(JSON.stringify(mine))), mine));
check("nothing stored gives the default", same(parseTable(undefined), DEFAULT_TABLE) && same(parseTable(null), DEFAULT_TABLE) && same(parseTable("x"), DEFAULT_TABLE));
check("2 seats from an old save falls back to the default size", parseTable({ ...mine, seats: 2 }).seats === DEFAULT_TABLE.seats);
check("9 seats falls back too", parseTable({ ...mine, seats: 9 }).seats === DEFAULT_TABLE.seats);
check("a bad skill falls back, the rest is kept", same(parseTable({ ...mine, botLevel: "genius" }), { ...mine, botLevel: "medium" }));
check("a bad target falls back, the rest is kept", same(parseTable({ ...mine, target: 175 }), { ...mine, target: 200 }));
check("a bad clock falls back, the rest is kept", same(parseTable({ ...mine, clock: 45 }), { ...mine, clock: 30 }));
check("the result is a fresh copy", (() => { const t = parseTable(null); t.seats = 3; return DEFAULT_TABLE.seats === 6; })());

console.log("\n--- Who sits where ---");
const you: { name: string; look: Look } = { name: "Daring Fox", look: { character: "fox", color: COLORS[0] } };
for (const n of SEAT_COUNTS) {
  const table = { ...DEFAULT_TABLE, seats: n, botLevel: "hard" as const };
  const setup = tableSetup(table, you);
  check(`${n} seats: you and ${n - 1} computers`, setup.length === n && setup[0].name === "Daring Fox" && setup[0].bot === undefined && setup.slice(1).every((s) => s.bot === "hard"));
  check(`${n} seats: everyone has a different name`, new Set(setup.map((s) => s.name)).size === n);
  check(`${n} seats: everyone has a different colour`, new Set(setup.map((s) => s.look?.color)).size === n);
}
const full = tableSetup({ ...DEFAULT_TABLE, seats: 8 }, you);
check("computers are robots", full.slice(1).every((s) => s.look?.character === ROBOT));
check("you keep your own look", same(full[0].look, you.look));
check("the computers' colours skip yours", full.slice(1).every((s) => s.look?.color !== you.look.color));
check("the skill you chose is the skill they get", tableSetup({ ...DEFAULT_TABLE, botLevel: "easy" }, you).slice(1).every((s) => s.bot === "easy"));
check("the order of the names changes with the dice", !same(tableSetup(DEFAULT_TABLE, you, () => 0).map((s) => s.name), tableSetup(DEFAULT_TABLE, you, () => 0.99).map((s) => s.name)));
check("your colour can be any of the eight", COLORS.every((c) => {
  const s = tableSetup({ ...DEFAULT_TABLE, seats: 8 }, { name: "A", look: { character: "fox", color: c } });
  return new Set(s.map((p) => p.look?.color)).size === 8;
}));
check("an unknown colour still gives different colours to the computers", (() => {
  const s = tableSetup({ ...DEFAULT_TABLE, seats: 8 }, { name: "A", look: { character: "fox", color: "#123456" } });
  return new Set(s.slice(1).map((p) => p.look?.color)).size === 7;
})());
check("computer number 0 is the colour after yours", botLook(0, COLORS[2]).color === COLORS[3] && botLook(0, COLORS[7]).color === COLORS[0]);

console.log("\n--- From the table into a running game ---");
for (const n of SEAT_COUNTS) {
  let g = newGame(tableSetup({ ...DEFAULT_TABLE, seats: n, target: 150 }, you), { target: 150 });
  let moves = 0;
  while (isBotTurn(g) && moves++ < 200) g = botStep(g);
  check(`a ${n}-seat game starts and the computers play until it is your turn`, g.round.players.length === n && g.target === 150 && !isBotTurn(g));
}

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
