import { COLORS, Profile } from "./profile";
import { DEFAULT_TABLE } from "./seats";
import { deleteProfile, defaultSettings, parseSettings, reduceMotionOn, serializeSettings, Settings, TEXT_SCALE, TEXT_SIZES } from "./settings";
import { emptyStats } from "./stats";

let failures = 0;
function check(name: string, ok: boolean) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  if (!ok) failures++;
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

console.log("--- Nothing stored yet ---");
const d = defaultSettings();
check("first launch gives the defaults", same(parseSettings(null), d));
check("sound, vibration and the turn alert are on by default", d.sound && d.vibration && d.turnAlertSound);
check("text size starts normal, with no high contrast and no reduced flashes", d.textSize === "normal" && !d.highContrast && !d.reduceFlashes);
check("reduce motion starts undecided, so it follows the phone", d.reduceMotion === null);
check("the clock starts at 30 seconds and the speed at normal", d.turnClock === 30 && d.gameSpeed === "normal");
check("double taps are ignored and bust odds are shown by default", d.ignoreDoubleTaps && d.showBustOdds);
check("the buttons are not swapped and chat is on", !d.swapSides && !d.hideChat);
check("there is no profile yet", d.profile === null && d.since === null && same(d.stats, emptyStats()) && !d.tipsDone);
check("no card pop-up has been shown yet", same(d.helpSeen, []));
check("the first table is the default table", same(d.table, DEFAULT_TABLE));

console.log("\n--- A round trip ---");
const fox: Profile = { adjective: "Daring", character: "fox", color: COLORS[0] };
const mine: Settings = {
  sound: false, vibration: false, turnAlertSound: false,
  textSize: "largest", highContrast: true, reduceMotion: true, reduceFlashes: true,
  turnClock: 60, gameSpeed: "faster", ignoreDoubleTaps: false,
  showBustOdds: false, swapSides: true, hideChat: true,
  table: { seats: 4, botLevel: "hard", target: 250, clock: 15 },
  profile: fox, since: 1760000000000,
  stats: { games: 12, wins: 4, bestRound: 61, sevenStacks: 3, topScore: 214 },
  tipsDone: true,
  helpSeen: ["shield", "timeOut"],
};
check("saved settings come back unchanged", same(parseSettings(serializeSettings(mine)), mine));
check("the card pop-ups that were shown are remembered, in order", same(parseSettings(serializeSettings(mine)).helpSeen, ["shield", "timeOut"]));
check("reduce motion off is remembered as off, not as undecided", parseSettings(serializeSettings({ ...mine, reduceMotion: false })).reduceMotion === false);

console.log("\n--- Damaged storage never crashes ---");
check("text that isn't JSON gives the defaults", same(parseSettings("{not json"), d));
check("empty text gives the defaults", same(parseSettings(""), d));
check("JSON that isn't an object gives the defaults", same(parseSettings("42"), d));
check("null JSON gives the defaults", same(parseSettings("null"), d));
check("an array gives the defaults", same(parseSettings("[1,2]"), d));

console.log("\n--- Saves from the first version ---");
const old = parseSettings(JSON.stringify({ haptics: false, sound: false, seats: [{ name: "Andy", kind: "human" }] }));
check("the old haptics setting becomes vibration", old.vibration === false);
check("the old sound setting is kept", old.sound === false);
check("the old seat list is ignored, and the new settings take their defaults",
  same(old.table, DEFAULT_TABLE) && old.profile === null && old.textSize === "normal");
check("a save from before the card pop-ups starts with none shown", same(old.helpSeen, []));
check("a save with only haptics still works", parseSettings(JSON.stringify({ haptics: true })).vibration === true);
check("vibration wins over the old haptics name", parseSettings(JSON.stringify({ haptics: true, vibration: false })).vibration === false);

console.log("\n--- Each field is checked on its own ---");
const mixed = parseSettings(JSON.stringify({ ...mine, textSize: "huge", turnClock: 45, gameSpeed: "warp", sound: "loud" }));
check("bad values fall back to their defaults", mixed.textSize === "normal" && mixed.turnClock === 30 && mixed.gameSpeed === "normal" && mixed.sound === true);
check("good values next to bad ones are kept", mixed.highContrast === true && mixed.swapSides === true && mixed.vibration === false && same(mixed.profile, fox));
check("a bad reduce-motion value means undecided", parseSettings(JSON.stringify({ reduceMotion: "yes" })).reduceMotion === null);
check("a profile with an unknown character is dropped", parseSettings(JSON.stringify({ profile: { ...fox, character: "dragon" } })).profile === null);
check("a profile with an unknown colour is dropped", parseSettings(JSON.stringify({ profile: { ...fox, color: "#000000" } })).profile === null);
check("a profile with an unknown word is dropped", parseSettings(JSON.stringify({ profile: { ...fox, adjective: "Rude" } })).profile === null);
check("stats are checked number by number", same(parseSettings(JSON.stringify({ stats: { games: 5, wins: "x", bestRound: -3 } })).stats, { ...emptyStats(), games: 5 }));
check("a bad table keeps the rest of the settings", (() => { const s = parseSettings(JSON.stringify({ ...mine, table: { seats: 99 } })); return s.table.seats === 6 && s.highContrast === true; })());
check("a bad date means no date", parseSettings(JSON.stringify({ since: "yesterday" })).since === null && parseSettings(JSON.stringify({ since: -5 })).since === null);

const seenOf = (value: unknown) => parseSettings(JSON.stringify({ helpSeen: value })).helpSeen;
check("card pop-ups: unknown names and wrong types inside the list are dropped", same(seenOf(["shield", "banana", 7, null, "bonus", { a: 1 }]), ["shield", "bonus"]));
check("card pop-ups: a name that appears twice is kept once, in its first place", same(seenOf(["shield", "shield", "timeOut", "shield"]), ["shield", "timeOut"]));
check("card pop-ups: anything that is not a list means none shown", same(seenOf("shield"), []) && same(seenOf(5), []) && same(seenOf({ shield: true }), []) && same(seenOf(null), []));
check("card pop-ups: every kind of card is accepted", same(seenOf(["timeOut", "drawThree", "shield", "doubleScore", "bonus", "sevenStack"]), ["timeOut", "drawThree", "shield", "doubleScore", "bonus", "sevenStack"]));
check("card pop-ups: a good list next to bad values is kept", (() => {
  const s = parseSettings(JSON.stringify({ ...mine, textSize: "huge", turnClock: 45, helpSeen: ["drawThree", "nope"] }));
  return same(s.helpSeen, ["drawThree"]) && s.textSize === "normal" && s.highContrast === true;
})());
check("card pop-ups: a bad list keeps all the other settings", (() => {
  const s = parseSettings(JSON.stringify({ ...mine, helpSeen: 42 }));
  return same(s.helpSeen, []) && s.highContrast === true && same(s.profile, fox) && s.tipsDone === true;
})());

console.log("\n--- Extras ---");
check("unknown extra fields are ignored", same(parseSettings(JSON.stringify({ ...mine, volume: 0.5, theme: "x" })), mine));
check("the result is a fresh copy, so the defaults can't be changed by accident", (() => {
  const a = parseSettings(null);
  a.table.seats = 3;
  a.stats.games = 99;
  a.helpSeen.push("shield");
  return defaultSettings().table.seats === 6 && defaultSettings().stats.games === 0 && defaultSettings().helpSeen.length === 0;
})());

console.log("\n--- Text size ---");
check("three sizes, each bigger than the last", same(TEXT_SIZES, ["normal", "large", "largest"]) && TEXT_SCALE.normal === 1 && TEXT_SCALE.large > 1 && TEXT_SCALE.largest > TEXT_SCALE.large);

console.log("\n--- Reduce motion ---");
check("undecided follows the phone", reduceMotionOn(d, true) === true && reduceMotionOn(d, false) === false);
check("your own choice beats the phone", reduceMotionOn({ ...d, reduceMotion: false }, true) === false && reduceMotionOn({ ...d, reduceMotion: true }, false) === true);

console.log("\n--- Delete my profile and data ---");
const gone = deleteProfile(mine);
check("the profile, the date, the stats and the tips go", gone.profile === null && gone.since === null && same(gone.stats, emptyStats()) && !gone.tipsDone);
check("the card pop-ups that were shown start over", same(gone.helpSeen, []) && same(mine.helpSeen, ["shield", "timeOut"]));
check("the last table goes back to the default", same(gone.table, DEFAULT_TABLE));
check("the preferences stay", gone.textSize === "largest" && gone.highContrast && gone.swapSides && !gone.sound && gone.turnClock === 60);

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
