import {
  BUBBLE_MS, bubbleAlive, canSend, COOLDOWN_MS, cooldownLeft, cooldownSeconds, describeMessage, emoteName, EMOTES,
  isKnown, PHRASES, phraseText, shouldShow,
} from "./chat";

let failures = 0;
function check(name: string, ok: boolean) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  if (!ok) failures++;
}

console.log("--- The phrases ---");
check("there are 15 phrases", PHRASES.length === 15);
check(
  "they come in the approved order",
  PHRASES.map((p) => p.text).join("|") ===
    "Stack Seven!|Hi|Nice one!|Good luck|GG|Wow|Oh|Huh|Yeah right!|Oops|Phew!|So close!|Ouch|Thanks|Play again?"
);
check("only Stack Seven! is highlighted, and it is first", PHRASES[0].highlight && PHRASES.slice(1).every((p) => !p.highlight));
check("every phrase has its own id", new Set(PHRASES.map((p) => p.id)).size === PHRASES.length && PHRASES.every((p) => p.id.length > 0));
check("every phrase is short enough for a third of the screen", PHRASES.every((p) => p.text.length > 0 && p.text.length <= 14));
check("phraseText finds a phrase by id", phraseText("niceOne") === "Nice one!" && phraseText("stackSeven") === "Stack Seven!");
check("phraseText gives null for an id that is not a phrase", phraseText("nope") === null && phraseText("") === null);
check("ids that merely look like object properties are not phrases", phraseText("toString") === null && phraseText("constructor") === null);
check("an emote id is not a phrase id", phraseText("happy") === null);

console.log("\n--- The emotes ---");
check("there are 8 emotes", EMOTES.length === 8);
check("they come in the approved order", EMOTES.map((e) => e.name).join("|") === "Happy|Wow|Oops|Sad|Cool|Haha|Grr|Meh");
check("every emote has its own id", new Set(EMOTES.map((e) => e.id)).size === EMOTES.length);
check("emoteName finds an emote by id", emoteName("wow") === "Wow" && emoteName("grr") === "Grr");
check("emoteName gives null for an id that is not an emote", emoteName("stackSeven") === null && emoteName("toString") === null);

console.log("\n--- Messages ---");
check("a known phrase is known", isKnown({ kind: "phrase", ref: "gg" }));
check("a known emote is known", isKnown({ kind: "emote", ref: "cool" }));
check("an unknown phrase is not known", !isKnown({ kind: "phrase", ref: "hello there" }));
check("an emote id used as a phrase is not known (the kind decides which list to look in)", !isKnown({ kind: "phrase", ref: "happy" }));
check("a phrase id used as an emote is not known", !isKnown({ kind: "emote", ref: "gg" }));
check("a made-up kind is not known", !isKnown({ kind: "shout" as unknown as "phrase", ref: "gg" }));
check("describeMessage gives the phrase itself", describeMessage({ kind: "phrase", ref: "yeahRight" }) === "Yeah right!");
check("describeMessage names an emote for a screen reader", describeMessage({ kind: "emote", ref: "wow" }) === "Wow emote");
check("describeMessage gives null for something unknown", describeMessage({ kind: "phrase", ref: "x" }) === null && describeMessage({ kind: "emote", ref: "x" }) === null);

console.log("\n--- Hide chat and emotes ---");
check("a known message is shown by default", shouldShow({ kind: "phrase", ref: "hi" }, false));
check("with Hide chat and emotes on, nothing is shown", !shouldShow({ kind: "phrase", ref: "hi" }, true) && !shouldShow({ kind: "emote", ref: "happy" }, true));
check("a message we do not recognise is never shown", !shouldShow({ kind: "emote", ref: "unicorn" }, false));

console.log("\n--- How long a bubble stays ---");
check("a bubble stays three seconds", BUBBLE_MS === 3000);
check("it is alive the moment it appears", bubbleAlive(10_000, 10_000));
check("it is alive just before three seconds", bubbleAlive(10_000, 12_999));
check("it is gone at three seconds", !bubbleAlive(10_000, 13_000));
check("it is gone long after", !bubbleAlive(10_000, 60_000));
check("a clock set back a little does not make it vanish early", bubbleAlive(10_000, 9_000));
check("a clock set back a lot makes it count as finished instead of hanging around", !bubbleAlive(10_000, 1_000));

console.log("\n--- The pause between your own messages ---");
check("the pause is five seconds", COOLDOWN_MS === 5000);
check("before you have sent anything there is no wait", cooldownLeft(null, 123_456) === 0 && canSend(null, 123_456));
check("right after sending the whole pause is left", cooldownLeft(100_000, 100_000) === 5000 && !canSend(100_000, 100_000));
check("two seconds later three are left", cooldownLeft(100_000, 102_000) === 3000);
check("one millisecond before the end you still cannot send", cooldownLeft(100_000, 104_999) === 1 && !canSend(100_000, 104_999));
check("exactly five seconds later you can send again", cooldownLeft(100_000, 105_000) === 0 && canSend(100_000, 105_000));
check("long afterwards there is no wait", cooldownLeft(100_000, 900_000) === 0);
check("the label rounds up, so it never says Wait 0s", cooldownSeconds(100_000, 100_000) === 5 && cooldownSeconds(100_000, 102_001) === 3 && cooldownSeconds(100_000, 104_999) === 1);
check("the label is 0 when you may send", cooldownSeconds(100_000, 105_000) === 0 && cooldownSeconds(null, 0) === 0);
check("a clock set back never makes the wait longer than the pause", cooldownLeft(100_000, 50_000) === COOLDOWN_MS);
check("a broken time never locks anybody out", cooldownLeft(Number.NaN, 100_000) === 0 && cooldownLeft(100_000, Number.NaN) === 0);

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
