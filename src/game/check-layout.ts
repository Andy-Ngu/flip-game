import { BOTTOM_GAP, cardHeightFor, EDGE, MAX_CARD_W, SCORE_ROW, stageHeight, STRIP_PAD, tableMetrics, TableMetrics, WORDS_ROW } from "./tableMetrics";

let failures = 0;
function check(name: string, ok: boolean) {
  if (ok) console.log(`PASS: ${name}`);
  else {
    failures++;
    console.log(`FAIL: ${name}`);
  }
}

// Phones the app has to fit on. `height` is what is left for the table below the status bar and above
// the navigation bar: the Galaxy S24 is 360 by 780 dp, minus about 34 on top and 24 below, and the screen
// keeps 8 and 12 more as padding. The table also leaves a small gap under HIT and STAY (BOTTOM_GAP), so that is
// taken off here too.
const PHONES = [
  { name: "Galaxy S24 (gesture bar)", width: 360, height: 702 - BOTTOM_GAP },
  { name: "Galaxy S24 (3 button bar)", width: 360, height: 678 - BOTTOM_GAP },
  { name: "small phone", width: 360, height: 620 - BOTTOM_GAP },
  { name: "iPhone 15", width: 393, height: 700 - BOTTOM_GAP },
  { name: "tall phone", width: 412, height: 820 - BOTTOM_GAP },
];

function fits(m: TableMetrics, height: number): boolean {
  return m.usedWithoutStage + m.stageMin <= height;
}

console.log("--- Sizes at normal text ---");
for (const p of PHONES) {
  for (let players = 3; players <= 8; players++) {
    const m = tableMetrics({ width: p.width, height: p.height, opponents: players - 1, scale: 1 });
    console.log(`${p.name}, ${players} players: ${m.density}${m.scrollTiles ? " (tiles scroll)" : ""}, stage ${stageHeight(m, p.height)}`);
  }
}

console.log("\n--- Everything fits where it should ---");
for (const p of PHONES.slice(0, 2)) {
  for (let players = 3; players <= 8; players++) {
    const m = tableMetrics({ width: p.width, height: p.height, opponents: players - 1, scale: 1 });
    check(`${p.name}, ${players} players fits without scrolling`, fits(m, p.height) && !m.scrollTiles);
  }
}
const roomy = PHONES[4];
for (let players = 3; players <= 8; players++) {
  const m = tableMetrics({ width: roomy.width, height: roomy.height, opponents: players - 1, scale: 1 });
  check(`${roomy.name}, ${players} players fits`, fits(m, roomy.height) && !m.scrollTiles);
}

console.log("\n--- A bigger table never gets a bigger layout ---");
const order = { regular: 0, compact: 1, tight: 2 };
for (const p of PHONES) {
  let last = -1;
  let ok = true;
  for (let players = 3; players <= 8; players++) {
    const d = order[tableMetrics({ width: p.width, height: p.height, opponents: players - 1, scale: 1 }).density];
    if (d < last) ok = false;
    last = d;
  }
  check(`${p.name}: more players means the same size or smaller`, ok);
}

console.log("\n--- Bigger text ---");
for (const scale of [1.2, 1.4]) {
  const room = 702 - BOTTOM_GAP;
  const m = tableMetrics({ width: 360, height: room, opponents: 2, scale });
  check(`3 players at text size ${scale} fit on the S24`, fits(m, room) && !m.scrollTiles);
  const big = tableMetrics({ width: 360, height: room, opponents: 7, scale });
  check(`8 players at text size ${scale}: the stage is never squeezed (tiles scroll if they must)`, big.stageMin <= stageHeight(big, room) + 0.001 && big.usedWithoutStage + big.stageMin <= room + 0.001);
}
const grown = tableMetrics({ width: 360, height: 900, opponents: 4, scale: 1.4 });
const plain = tableMetrics({ width: 360, height: 900, opponents: 4, scale: 1 });
check("bigger text makes the tiles taller", grown.tileH > plain.tileH);

console.log("\n--- Spare room goes to your cards ---");
const spare = tableMetrics({ width: 360, height: 702 - BOTTOM_GAP, opponents: 2, scale: 1 });
check("with 3 players on the S24 the hand cards grow past the regular 68 px", spare.cardW > 68 && spare.cardW <= MAX_CARD_W);
check("and the stage still fits", spare.stageMin <= stageHeight(spare, 702 - BOTTOM_GAP));
check("a full table on a tall phone keeps the regular card size or a little more", tableMetrics({ width: 412, height: 820, opponents: 7, scale: 1 }).cardW >= 68);
check("cards are never bigger than the maximum", PHONES.every((p) => [2, 4, 7].every((o) => tableMetrics({ width: p.width, height: p.height, opponents: o, scale: 1 }).cardW <= MAX_CARD_W)));

console.log("\n--- The parts add up ---");
const m6 = tableMetrics({ width: 390, height: 844, opponents: 7, scale: 1 });
check("on the design's 390 by 844 screen an 8 player table uses the regular size", m6.density === "regular");
check("a tile is about 78 px high at the regular size", Math.abs(m6.tileH - 78) <= 1);
check("seven mini cards always fit inside a tile", [360, 390, 412].every((w) => {
  const m = tableMetrics({ width: w, height: 2000, opponents: 7, scale: 1 });
  return 7 * m.miniW + 6 * 2 <= m.tileW - 4 - 12;
}));
check("the mini card is one and a half times as tall as it is wide", m6.miniH === Math.round(m6.miniW * 1.5));
check("a hand card keeps the card's proportions", cardHeightFor(68) === 98 && cardHeightFor(58) === 84);
check("the stage gets all the leftover height", stageHeight(m6, 844) === 844 - m6.usedWithoutStage);

console.log("\n--- The stage header ---");
// The words about you ("YOU STAYED  Banked 14") always have a strip of their own under the avatar and the score
// boxes, so there is never a word that has to be broken in two beside them. The score boxes share the whole width
// of the row, so nothing is left empty.
const headOf = (width: number, scale: number) => tableMetrics({ width, height: 900, opponents: 3, scale });
check("the header is the score row plus the words strip at every size", [1, 1.2, 1.4].every((s) => [360, 412].every((w) => headOf(w, s).stageHead === (s > 1 ? SCORE_ROW(s) : 62) + WORDS_ROW(s))));
check("the score row is 62 px at normal text and grows less than the text does", SCORE_ROW(1) === 62 && SCORE_ROW(1.4) < Math.ceil(62 * 1.4));
check("the words strip is as tall as the title, its padding and the 3 px above it", WORDS_ROW(1) === 20 + 2 * STRIP_PAD(1) + 3 && WORDS_ROW(1.4) === 28 + 2 * STRIP_PAD(1.4) + 3);
check("bigger text makes the header taller (so the stage keeps room for it)", headOf(360, 1.4).stageHead > headOf(360, 1.2).stageHead && headOf(360, 1.2).stageHead > headOf(360, 1).stageHead);
check("the dock is HIT and STAY only", (() => { const m = headOf(360, 1); return m.dockH === m.dockMain + EDGE; })());
check("a few pixels are left under HIT and STAY", BOTTOM_GAP >= 4 && BOTTOM_GAP <= 12);

console.log("\n--- Table fits at the biggest text ---");
// With the chat buttons gone from the dock there is room for 3 and 4 players at the biggest text on the S24 even with
// the 3 button bar, and for 3 to 6 with the gesture bar (which leaves 24 px more).
for (let players = 3; players <= 6; players++) {
  const bar = players <= 4 ? 678 : 702;
  const room = bar - BOTTOM_GAP;
  const m = tableMetrics({ width: 360, height: room, opponents: players - 1, scale: 1.4 });
  check(`${players} players at the biggest text fit on the S24 (${bar === 678 ? "3 button bar" : "gesture bar"}) without scrolling`, fits(m, room) && !m.scrollTiles);
}

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
