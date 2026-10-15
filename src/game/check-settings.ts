import { defaultSeats } from "./seats";
import { defaultSettings, parseSettings, serializeSettings, Settings } from "./settings";

let failures = 0;
function check(name: string, ok: boolean) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  if (!ok) failures++;
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// ---- nothing stored yet ----
check("first launch gives the defaults", same(parseSettings(null), defaultSettings()));
check("haptics are on by default", defaultSettings().haptics === true);

// ---- a round trip ----
const mine: Settings = {
  haptics: false,
  seats: [
    { name: "Andy", kind: "human" },
    { name: "Sam", kind: "human" },
    { name: "Rex", kind: "easy" },
    { name: "Zed", kind: "hard" },
  ],
};
check("saved settings come back unchanged", same(parseSettings(serializeSettings(mine)), mine));

// ---- damaged storage never crashes ----
check("text that isn't JSON gives the defaults", same(parseSettings("{not json"), defaultSettings()));
check("empty text gives the defaults", same(parseSettings(""), defaultSettings()));
check("JSON that isn't an object gives the defaults", same(parseSettings("42"), defaultSettings()));
check("null JSON gives the defaults", same(parseSettings("null"), defaultSettings()));
check("an array gives the defaults", same(parseSettings("[1,2]"), defaultSettings()));

// ---- each field is checked on its own ----
const wrongHaptics = parseSettings(JSON.stringify({ haptics: "yes", seats: mine.seats }));
check("a bad haptics value falls back, but good seats are kept",
  wrongHaptics.haptics === true && same(wrongHaptics.seats, mine.seats));

const noSeats = parseSettings(JSON.stringify({ haptics: false }));
check("missing seats fall back, but haptics are kept",
  noSeats.haptics === false && same(noSeats.seats, defaultSeats()));

const badKind = parseSettings(JSON.stringify({ haptics: true, seats: [
  { name: "A", kind: "human" }, { name: "B", kind: "wizard" }, { name: "C", kind: "easy" } ] }));
check("an unknown player type gives the default seats", same(badKind.seats, defaultSeats()));

const badName = parseSettings(JSON.stringify({ haptics: true, seats: [
  { name: "A", kind: "human" }, { name: 5, kind: "easy" }, { name: "C", kind: "easy" } ] }));
check("a name that isn't text gives the default seats", same(badName.seats, defaultSeats()));

// ---- stored seats must be a table the setup screen would allow ----
const two = parseSettings(JSON.stringify({ seats: [{ name: "A", kind: "human" }, { name: "B", kind: "easy" }] }));
check("fewer than 3 players gives the default seats", same(two.seats, defaultSeats()));

const nine = parseSettings(JSON.stringify({ seats: Array.from({ length: 9 }, (_, i) => ({ name: `P${i}`, kind: "easy" })) }));
check("more than 8 players gives the default seats", same(nine.seats, defaultSeats()));

const dup = parseSettings(JSON.stringify({ seats: [
  { name: "Sam", kind: "human" }, { name: "sam", kind: "easy" }, { name: "Cy", kind: "easy" } ] }));
check("duplicate names give the default seats", same(dup.seats, defaultSeats()));

const blank = parseSettings(JSON.stringify({ seats: [
  { name: "A", kind: "human" }, { name: "  ", kind: "easy" }, { name: "C", kind: "easy" } ] }));
check("a blank name gives the default seats", same(blank.seats, defaultSeats()));

// ---- extra fields (from a newer version) are ignored ----
const extra = parseSettings(JSON.stringify({ ...mine, sound: true, theme: "x" }));
check("unknown extra fields are ignored", same(extra, mine));

// ---- parse returns a fresh copy, so the default can't be changed by accident ----
const a = parseSettings(null);
a.seats[0].name = "Changed";
check("changing the result doesn't change the defaults", defaultSeats()[0].name === "You");

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
