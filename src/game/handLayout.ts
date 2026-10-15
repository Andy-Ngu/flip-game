// Where each card sits in a player's hand: a gentle fan, like cards held in the hand.
export const CARD_W = 58;
export const CARD_H = 84;

export type Slot = {
  x: number;       // left edge, in px
  rotate: number;  // degrees, negative tilts left
  lift: number;    // px downward; cards at the ends sit a little lower, making an arc
};

const GAP = 8;       // space between cards when there is room
const MIN_STEP = 10; // never overlap so much that a card is unreadable

// Lay out `count` cards in a row `width` px wide. With few cards they sit side by
// side; as the hand grows they overlap more so everything still fits.
export function handSlots(count: number, width: number): Slot[] {
  if (count <= 0) return [];
  const step = count === 1 ? 0 : Math.min(CARD_W + GAP, Math.max(MIN_STEP, (width - CARD_W) / (count - 1)));
  const total = CARD_W + step * (count - 1);
  const left = Math.max(0, (width - total) / 2); // keep the fan centered
  const mid = (count - 1) / 2;
  const tilt = count === 1 ? 0 : Math.min(3, 12 / (count - 1)); // whole fan spreads at most 12 degrees
  const arc = count > 5 ? 0.7 : 1.2;
  return Array.from({ length: count }, (_, i) => ({
    x: left + step * i,
    rotate: (i - mid) * tilt,
    lift: (i - mid) * (i - mid) * arc,
  }));
}
