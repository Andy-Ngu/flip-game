import { Look } from "./types";

// Who you are at the table: a character, a colour and a name that comes from the character
// ("Daring Fox"). There is no typing: the name is built from a short word and the character,
// so there is nothing to moderate, and "New name" simply picks a different word.

export const CHARACTERS = [
  "fox", "owl", "bear", "frog", "cat", "panda", "penguin", "bunny", "lion", "octopus", "pig", "mouse",
] as const;
export type Character = (typeof CHARACTERS)[number];

// The computer players all use this one.
export const ROBOT = "robot";

// The word for each character, as it appears in a name.
export const NOUNS: Record<Character, string> = {
  fox: "Fox", owl: "Owl", bear: "Bear", frog: "Frog", cat: "Cat", panda: "Panda",
  penguin: "Penguin", bunny: "Bunny", lion: "Lion", octopus: "Octopus", pig: "Pig", mouse: "Mouse",
};

// The eight colours a character can sit on.
export const COLORS = [
  "#5BB4F0", "#7A90E0", "#E07A90", "#A97AE0", "#5FD39A", "#E0A85F", "#E0795F", "#F2C14E",
] as const;

// Short, friendly and easy to read at a glance.
export const ADJECTIVES = [
  "Daring", "Calm", "Lucky", "Sly", "Bold", "Swift", "Wise", "Jolly", "Brave", "Clever",
  "Gentle", "Happy", "Keen", "Merry", "Nimble", "Plucky", "Quick", "Sunny", "Witty", "Zesty",
  "Cheery", "Mighty", "Snappy", "Cosy",
] as const;

export type Profile = { adjective: string; character: Character; color: string };

export const isCharacter = (x: unknown): x is Character =>
  typeof x === "string" && (CHARACTERS as readonly string[]).includes(x);
export const isColor = (x: unknown): x is string =>
  typeof x === "string" && (COLORS as readonly string[]).includes(x);
const isAdjective = (x: unknown): x is string =>
  typeof x === "string" && (ADJECTIVES as readonly string[]).includes(x);

export function profileName(p: Profile): string {
  return `${p.adjective} ${NOUNS[p.character]}`;
}

export function profileLook(p: Profile): Look {
  return { character: p.character, color: p.color };
}

function pick<T>(list: readonly T[], random: () => number): T {
  return list[Math.min(list.length - 1, Math.floor(random() * list.length))];
}

// A brand new guest: a random character on a random colour with a random word.
export function randomProfile(random: () => number = Math.random): Profile {
  return {
    adjective: pick(ADJECTIVES, random),
    character: pick(CHARACTERS, random),
    color: pick(COLORS, random),
  };
}

// "New name": a different word with the same character.
export function rerollName(p: Profile, random: () => number = Math.random): Profile {
  const others = ADJECTIVES.filter((a) => a !== p.adjective);
  return { ...p, adjective: pick(others, random) };
}

// Picking another character keeps your word, so Daring Fox becomes Daring Owl.
export function withCharacter(p: Profile, character: Character): Profile {
  return { ...p, character };
}

export function withColor(p: Profile, color: string): Profile {
  return isColor(color) ? { ...p, color } : p;
}

// Whatever was stored, as a profile the app can trust, or null if there is nothing usable.
export function parseProfile(raw: unknown): Profile | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (!isAdjective(r.adjective) || !isCharacter(r.character) || !isColor(r.color)) return null;
  return { adjective: r.adjective, character: r.character, color: r.color };
}
