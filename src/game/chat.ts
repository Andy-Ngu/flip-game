// Quick chat and emotes. Nobody types anything: a player picks from a short list of ready-made phrases and
// little face stickers, so there is nothing to moderate. This file is the list, plus the few rules about it
// (how long a message stays on the table, how often you may send one). The screens that draw it are in
// components/sheets.
//
// A message is only ever two small things: its kind ("phrase" or "emote") and an id from the lists below.
// No free text travels anywhere, so a message from a newer or older version of the app that we do not
// recognise is simply not shown.

export const BUBBLE_MS = 3000;     // how long a message stays beside the sender's name
export const COOLDOWN_MS = 5000;   // how long you wait between two of your own messages, so nobody can spam the table

// ---------- the phrases ----------

export type Phrase = {
  id: string;
  text: string;         // exactly what the bubble and the button say
  highlight: boolean;   // drawn in gold: this is the game's own cheer
};

const phrase = (id: string, text: string, highlight = false): Phrase => ({ id, text, highlight });

// In this order, on the buttons and everywhere else.
export const PHRASES: readonly Phrase[] = [
  phrase("stackSeven", "Stack Seven!", true),
  phrase("hi", "Hi"),
  phrase("niceOne", "Nice one!"),
  phrase("goodLuck", "Good luck"),
  phrase("gg", "GG"),
  phrase("wow", "Wow"),
  phrase("oh", "Oh"),
  phrase("huh", "Huh"),
  phrase("yeahRight", "Yeah right!"),
  phrase("oops", "Oops"),
  phrase("phew", "Phew!"),
  phrase("soClose", "So close!"),
  phrase("ouch", "Ouch"),
  phrase("thanks", "Thanks"),
  phrase("playAgain", "Play again?"),
];

// ---------- the emotes ----------

export type EmoteId = "happy" | "wow" | "oops" | "sad" | "cool" | "haha" | "grr" | "meh";
export type Emote = { id: EmoteId; name: string };

export const EMOTES: readonly Emote[] = [
  { id: "happy", name: "Happy" },
  { id: "wow", name: "Wow" },
  { id: "oops", name: "Oops" },
  { id: "sad", name: "Sad" },
  { id: "cool", name: "Cool" },
  { id: "haha", name: "Haha" },
  { id: "grr", name: "Grr" },
  { id: "meh", name: "Meh" },
];

// ---------- messages ----------

export type MessageKind = "phrase" | "emote";

// What a message says: the kind, and the id of the phrase or emote. (An id of a phrase is not an id of an
// emote: "wow" can be either, and the kind tells them apart.)
export type ChatContent = { kind: MessageKind; ref: string };

// The words of a phrase, or null if there is no such phrase.
export function phraseText(id: string): string | null {
  const found = PHRASES.find((p) => p.id === id);
  return found ? found.text : null;
}

// The name of an emote ("Wow"), or null if there is no such emote.
export function emoteName(id: string): string | null {
  const found = EMOTES.find((e) => e.id === id);
  return found ? found.name : null;
}

// A message we know how to draw: the id really is in the list for its kind.
export function isKnown(m: ChatContent): boolean {
  return m.kind === "phrase" ? phraseText(m.ref) !== null : m.kind === "emote" ? emoteName(m.ref) !== null : false;
}

// What a screen reader should say for a message: the phrase itself, or "Wow emote". Null if unknown.
export function describeMessage(m: ChatContent): string | null {
  if (m.kind === "phrase") return phraseText(m.ref);
  if (m.kind === "emote") {
    const name = emoteName(m.ref);
    return name === null ? null : `${name} emote`;
  }
  return null;
}

// May this message be drawn on the table? Not when the player has turned on "Hide chat and emotes"
// (that hides everyone's, their own too), and not when it is something we do not recognise.
export function shouldShow(m: ChatContent, hideChat: boolean): boolean {
  return !hideChat && isKnown(m);
}

// Is a message that appeared at `shownAt` still on its three seconds? (`now` and `shownAt` are
// milliseconds, like Date.now().) If the phone's clock was set back by more than that in the meantime,
// the bubble counts as finished rather than hanging around.
export function bubbleAlive(shownAt: number, now: number): boolean {
  return Math.abs(now - shownAt) < BUBBLE_MS;
}

// ---------- the pause between your own messages ----------

// How many milliseconds are left before you may send again: 0 if you may send now. `lastSentAt` is when
// you last sent something (null if you have not yet). Never more than the full pause, even if the phone's
// clock was set back, and a missing or broken time never locks anybody out.
export function cooldownLeft(lastSentAt: number | null, now: number): number {
  if (lastSentAt === null || !Number.isFinite(lastSentAt) || !Number.isFinite(now)) return 0;
  const left = lastSentAt + COOLDOWN_MS - now;
  return Math.min(COOLDOWN_MS, Math.max(0, left));
}

// The same, in whole seconds rounded up, for the "Wait 3s" label (it never shows "Wait 0s").
export function cooldownSeconds(lastSentAt: number | null, now: number): number {
  return Math.ceil(cooldownLeft(lastSentAt, now) / 1000);
}

// May you send a message right now?
export function canSend(lastSentAt: number | null, now: number): boolean {
  return cooldownLeft(lastSentAt, now) === 0;
}
