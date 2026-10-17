// How big the parts of the table are drawn on this phone. The table is laid out in three sizes
// (regular, compact, tight) and the largest one that fits the screen is used, so an 8 player table
// still fits on a small phone. Pure numbers, no React Native, so it can be tested.

export type Density = "regular" | "compact" | "tight";

type Level = {
  avatar: number;       // the character on an opponent tile
  header: number;       // the height of a tile's name and score line
  mini: number;         // the width of a mini card on a tile
  card: number;         // the width of a card in your hand
  stageHead: number;    // the height of the row with your avatar and the score boxes
  stageRows: number;    // the height of the Seven Stack and bust odds bars
  dockMain: number;     // the height of HIT and STAY
  gap: number;          // between the parts of the table
  tileGap: number;      // between tiles
};

const LEVELS: Record<Density, Level> = {
  regular: { avatar: 32, header: 32, mini: 20, card: 68, stageHead: 62, stageRows: 36, dockMain: 68, gap: 10, tileGap: 6 },
  compact: { avatar: 30, header: 30, mini: 18, card: 63, stageHead: 58, stageRows: 34, dockMain: 62, gap: 8, tileGap: 6 },
  tight: { avatar: 28, header: 28, mini: 16, card: 58, stageHead: 52, stageRows: 30, dockMain: 56, gap: 6, tileGap: 5 },
};
const ORDER: Density[] = ["regular", "compact", "tight"];

export const TOP_BAR = 46;     // the round pill and the menu button
export const SIDE = 12;        // the space left and right of the tiles and the stage
export const EDGE = 5;         // the darker lower edge of the HIT and STAY buttons
export const BOTTOM_GAP = 6;   // the space under HIT and STAY, so the buttons never touch the bottom of the screen
export const MINI_GAP = 2;
const TILE_BORDER = 2;
const TILE_PAD_X = 6;
const TILE_PAD_Y = 4;
const TILE_CARDS_GAP = 3;
const STAGE_PAD = 12;
const HAND_EXTRA = 28;         // room around the cards for the arc of the fan and a lifted card (the hand's own padding is half of it)
const STAGE_SLACK = 3;         // between the header and the cards, and between the cards and the bars (the cards' own padding adds to it)

// The stage's header is two rows: your avatar and the two score boxes (which share the width between them, so
// there is no empty space), and under them a tinted strip of its own for the words about you ("YOUR TURN",
// "YOU STAYED  Banked 14"). A single row had only about 50 px left for the words on a 360 wide phone, and a word
// that does not fit is cut in two by Android ("YOU S" and "TAYED").
// The strip is as tall as the title (19 px, times the Text size) plus padding above and below it (2 px each, 1 px
// with bigger text, where room is short), and there are 3 px above the strip.
export const STRIP_PAD = (scale: number): number => (scale > 1 ? 1 : 2);
export const WORDS_ROW = (scale: number): number => Math.ceil(20 * scale) + 2 * STRIP_PAD(scale) + 3;

// The score row: the two boxes TOTAL SCORE and THIS ROUND (2 px border and 5 + 4 px padding, a label, 2 px, and a
// big number). With bigger text the number is drawn a little smaller (30 instead of 36 px before it is scaled), so
// the row grows less than the text does.
export const SCORE_NUMBER = (scale: number): number => (scale > 1 ? 30 : 36);
export const SCORE_ROW = (scale: number): number => 4 + 9 + Math.ceil(10.5 * scale) + 2 + Math.ceil(SCORE_NUMBER(scale) * scale);

export type TableMetrics = {
  density: Density;
  scrollTiles: boolean;  // even the tightest layout does not fit, so the opponent tiles scroll
  rows: number;          // rows of tiles, counting the deck tile
  tileW: number;
  tileH: number;
  headerH: number;       // the tile's name and score line (grows with the text size)
  avatar: number;
  miniW: number;
  miniH: number;
  tilesH: number;        // height of all the tiles together
  tileGap: number;
  cardW: number;         // a card in your hand
  cardH: number;
  handH: number;         // the area the fan of cards is drawn in
  stageHead: number;     // the whole header of the stage: the avatar and scores row, and the words row under it
  stageRows: number;
  stageMin: number;      // the least height the stage needs
  dockMain: number;
  dockH: number;         // height of the dock (HIT and STAY)
  gap: number;
  usedWithoutStage: number;
};

export type MetricsInput = {
  width: number;       // the width of the screen's content
  height: number;      // the height of the screen's content, below the status bar and above the navigation bar
  opponents: number;   // how many other players
  scale: number;       // the Text size setting: 1, 1.2 or 1.4
};

export const cardHeightFor = (width: number): number => Math.round((width * 98) / 68);

function build(o: MetricsInput, density: Density): TableMetrics {
  const L = LEVELS[density];
  const s = Math.max(1, o.scale);
  const cells = o.opponents + 1;                    // the deck takes one cell
  const rows = Math.ceil(cells / 2);
  const tileW = Math.floor((o.width - 2 * SIDE - L.tileGap) / 2);
  const inner = tileW - 2 * TILE_BORDER - 2 * TILE_PAD_X;
  const fit = Math.floor((inner - 6 * MINI_GAP) / 7);
  const miniW = Math.min(L.mini, fit);
  const miniH = Math.round(miniW * 1.5);
  const headerH = Math.ceil(L.header * s);
  const tileH = 2 * TILE_BORDER + 2 * TILE_PAD_Y + headerH + TILE_CARDS_GAP + miniH;
  const tilesH = rows * tileH + (rows - 1) * L.tileGap;

  const cardW = L.card;
  const cardH = cardHeightFor(cardW);
  const handH = cardH + HAND_EXTRA;
  // (With the normal text size the density sets the row's height; with bigger text the row is what the boxes need.)
  const stageHead = (s > 1 ? SCORE_ROW(s) : L.stageHead) + WORDS_ROW(s);
  const stageRows = Math.ceil(L.stageRows * s);
  const stageMin = STAGE_PAD + stageHead + STAGE_SLACK + handH + STAGE_SLACK + stageRows + 10;

  const dockMain = Math.ceil(Math.max(L.dockMain, 47 * s + 8));
  const dockH = dockMain + EDGE;

  // The top bar, the tiles and the dock, with a gap between each of the four parts (the stage is the fourth).
  const usedWithoutStage = TOP_BAR + tilesH + dockH + 3 * L.gap;
  return {
    density, scrollTiles: false, rows, tileW, tileH, headerH, avatar: L.avatar, miniW, miniH, tilesH, tileGap: L.tileGap,
    cardW, cardH, handH, stageHead, stageRows, stageMin, dockMain, dockH, gap: L.gap, usedWithoutStage,
  };
}

// The cards in your hand grow into any room the other parts leave over, up to this wide.
export const MAX_CARD_W = 76;

function grow(m: TableMetrics, height: number): TableMetrics {
  const extra = height - m.usedWithoutStage - m.stageMin;
  if (m.scrollTiles || extra < 8) return m;
  const cardW = Math.min(MAX_CARD_W, m.cardW + Math.floor((extra - 2) / 1.45));
  if (cardW <= m.cardW) return m;
  const cardH = cardHeightFor(cardW);
  const handH = cardH + HAND_EXTRA;
  return { ...m, cardW, cardH, handH, stageMin: STAGE_PAD + m.stageHead + STAGE_SLACK + handH + STAGE_SLACK + m.stageRows + 10 };
}

// The largest layout that fits. If even the tightest one does not (an 8 player table with the biggest
// text on a small phone), the tightest is used and its opponent tiles scroll.
export function tableMetrics(o: MetricsInput): TableMetrics {
  for (const d of ORDER) {
    const m = build(o, d);
    if (m.usedWithoutStage + m.stageMin <= o.height) return grow(m, o.height);
  }
  const m = build(o, "tight");
  // Keep the stage whole and let the tiles have whatever is left.
  const room = Math.max(m.tileH, o.height - (m.usedWithoutStage - m.tilesH) - m.stageMin);
  return { ...m, scrollTiles: true, tilesH: Math.min(m.tilesH, room), usedWithoutStage: m.usedWithoutStage - m.tilesH + Math.min(m.tilesH, room) };
}

// The height the stage gets: everything the other parts leave over.
export const stageHeight = (m: TableMetrics, height: number): number => Math.max(m.stageMin, height - m.usedWithoutStage);
