import { raceNote } from "./raceNote";
import { mk } from "./testkit";
import { Player } from "./types";

let failures = 0;
function check(name: string, ok: boolean) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  if (!ok) failures++;
}

const at = (name: string, totalScore: number): Player => mk(name, [], "playing", { name, totalScore });
const table = (...scores: [string, number][]): Player[] => scores.map(([name, total]) => at(name, total));

console.log("--- Before anybody has scored ---");
let note = raceNote(table(["Andy", 0], ["Fizz", 0], ["Robo", 0]), 0, 200);
check("everyone has the whole way to go", note.number === 200 && note.headline === "Everyone is 200 points from winning");
note = raceNote(table(["Andy", 0], ["Fizz", 0], ["Robo", 0]), 0, 150);
check("it follows the target the table chose", note.number === 150 && note.headline === "Everyone is 150 points from winning");
note = raceNote([], 0, 200);
check("an empty table does not crash", note.number === 200);

console.log("\n--- One leader ---");
note = raceNote(table(["Andy", 128], ["Fizz", 177], ["Robo", 156]), 0, 200);
check("the leader's name and how far they are", note.number === 23 && note.headline === "Fizz is 23 points from winning");
note = raceNote(table(["Andy", 190], ["Fizz", 177], ["Robo", 156]), 0, 200);
check("when it is you, it says You are", note.number === 10 && note.headline === "You are 10 points from winning");
note = raceNote(table(["Andy", 128], ["Fizz", 199], ["Robo", 156]), 0, 200);
check("one point is not 'points'", note.number === 1 && note.headline === "Fizz is 1 point from winning");
note = raceNote(table(["Andy", 128], ["Fizz", 177], ["Robo", 156]), 0, 250);
check("a higher target means more to go", note.number === 73);
check("the rule line follows the target", note.rule === "First to 250 wins at the end of a round. A tie at the top plays another round.");
note = raceNote(table(["Andy", 128], ["Fizz", 177], ["Robo", 156]), 7, 200);
check("a seat that does not exist is nobody, not a crash", note.headline === "Fizz is 23 points from winning");

console.log("\n--- A tie for the lead ---");
note = raceNote(table(["Andy", 100], ["Fizz", 100], ["Robo", 60]), 2, 200);
check("two leaders are both named", note.number === 100 && note.headline === "Andy and Fizz are 100 points from winning");
note = raceNote(table(["Andy", 100], ["Fizz", 100], ["Robo", 60]), 0, 200);
check("you come first when you are one of them", note.headline === "You and Fizz are 100 points from winning");
note = raceNote(table(["Andy", 60], ["Fizz", 100], ["Robo", 100]), 2, 200);
check("you come first even from the last seat", note.headline === "You and Fizz are 100 points from winning");
note = raceNote(table(["Andy", 100], ["Fizz", 100], ["Robo", 100], ["Dot", 40]), 3, 200);
check("three leaders are counted, not listed", note.headline === "3 players are 100 points from winning");

console.log("\n--- At or past the target ---");
note = raceNote(table(["Andy", 210], ["Fizz", 210], ["Robo", 156]), 2, 200);
check("a tie at the top of the target says so", note.number === 0 && note.headline === "Andy and Fizz are tied at the top");
note = raceNote(table(["Andy", 210], ["Fizz", 210], ["Robo", 156]), 0, 200);
check("...with you first", note.headline === "You and Fizz are tied at the top");
note = raceNote(table(["Andy", 205], ["Fizz", 177]), 1, 200);
check("one player past the target has reached it", note.number === 0 && note.headline === "Andy has reached 200");
note = raceNote(table(["Andy", 205], ["Fizz", 177]), 0, 200);
check("...and for you it is 'You have'", note.headline === "You have reached 200");
note = raceNote(table(["Andy", 200], ["Fizz", 177]), 1, 200);
check("exactly on the target counts", note.number === 0);

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
