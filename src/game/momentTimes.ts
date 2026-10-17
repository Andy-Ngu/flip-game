// How long the messages and big moments stay on the table (milliseconds, before the Game speed setting is
// applied). They are long enough to be read: design guidance asks 5 to 6 seconds for a plain message, but in a
// fast game that would hold the table up, so the shortest ones are shorter and every one of them closes the
// moment it is tapped (see components/layers.ts for where the guidance comes from).

// A small message at the top ("Gus played Time Out on you"): about as long as it takes to read two lines.
export const TOAST_MS = 4000;

// "Shield blocked it": the cards fly in, hit, and stay side by side long enough to read it, then leave.
export const SHIELD_MS = 3800;

// "Deck empty": a whole second longer than the shuffle sound (the riffle lasts about 1.1 seconds). The player asked for 2.5 seconds.
export const RESHUFFLE_MS = 2500;

// The results board moves on to the next round by itself after this long if NEXT ROUND is not pressed.
export const NEXT_ROUND_MS = 10000;

// "Gus played Draw Three on you": the table stops and says so BEFORE the card does anything, so what happens to you
// is never a surprise. Long enough to read three short lines (the shortest of the messages is read in about two
// seconds); a tap on it carries on at once.
export const PLAYED_MS = 3200;

// Cards that come to you one after another (Draw Three) instead of all together: the time between two of them,
// and how long the computers wait for the last one to settle before the game goes on. (It was 450 ms; that was too
// fast to follow. At 900 ms each card has flown in, flipped and settled before the next one starts.)
export const ARRIVE_GAP_MS = 900;
export const ARRIVE_SETTLE_MS = 700;
export const arriveMs = (cards: number): number => (cards <= 0 ? 0 : (cards - 1) * ARRIVE_GAP_MS + ARRIVE_SETTLE_MS);
