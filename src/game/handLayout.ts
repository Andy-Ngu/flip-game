// Where each card sits in a player's hand: a gentle fan, like cards held in the hand.
// A normal card is 68 wide and 98 tall (see tableMetrics for the smaller sizes).
export const CARD_W = 68;
export const CARD_H = 98;

export type Slot = {
  x: number;       // left edge, in px
  rotate: number;  // degrees, negative tilts left
  lift: number;    // px downward; cards at the ends sit a little lower, making an arc
};

const GAP = 8;        // space between cards when there is room
const MIN_STEP = 10;  // never overlap so much that a card is unreadable
const MAX_TILT = 8;   // the outer cards lean this many degrees at most
const MAX_SAG = 12;   // the outer cards sit this many px lower than the middle one at most (the hand has room for it; a busted hand droops a few px more)

// Lay out `count` cards in a row `width` px wide. With few cards they sit side by
// side; as the hand grows they overlap more so everything still fits.
export function handSlots(count: number, width: number, cardW: number = CARD_W): Slot[] {
  if (count <= 0) return [];
  const step = count === 1 ? 0 : Math.min(cardW + GAP, Math.max(MIN_STEP, (width - cardW) / (count - 1)));
  const total = cardW + step * (count - 1);
  const left = Math.max(0, (width - total) / 2); // keep the fan centered
  const mid = (count - 1) / 2;
  const tilt = count === 1 ? 0 : Math.min(4, (2 * MAX_TILT) / (count - 1)); // the whole fan spreads at most 16 degrees
  // The ends of the fan sag below the middle. A small hand sags a few px; a big one would sag far more (the ends
  // of 13 cards were 36 px lower) and push the end cards down over the Seven Stack and bust odds bars, so
  // the sag has a ceiling and the cards in between follow a gentler curve.
  const arc = 3 * Math.min(1, 4 / Math.max(1, count - 1));
  const sag = Math.min(MAX_SAG, arc * mid * mid);
  return Array.from({ length: count }, (_, i) => {
    const away = mid === 0 ? 0 : (i - mid) / mid;   // -1 at the left end, 0 in the middle, 1 at the right end
    return { x: left + step * i, rotate: (i - mid) * tilt, lift: sag * away * away };
  });
}
