import { Card } from "../../game/types";

// The words and the cards of the three How to play pages, as plain data. The screen only has to
// draw them. The wording is the approved wording from the design, and it matches the rules in
// game/rules.ts, game/round.ts and game/scoring.ts:
//   - a duplicate number busts you (the round scores 0), unless a Shield blocks it
//   - Time Out and Draw Three go to a player you choose; a spare Shield is passed on
//   - Double Score doubles only the number cards; Bonus cards are added afterwards
//   - seven different numbers is a Seven Stack: +15, and the round ends
//   - the highest total at or over the target score wins the game; a tie at the top plays another round

// Each step has a small picture made of real cards. The picture is drawn in a box this big.
export const PICTURE_W = 112;
export const PICTURE_H = 92;

// One card in a step's picture.
export type PictureCard = {
  card: Card;
  left: number;     // where the card sits inside the picture box, before it is tilted
  top: number;
  tilt: number;     // in degrees; negative leans to the left
  width: number;    // the card's width; its height follows from the width
  again?: string;   // the card that busted the player: it gets a red ring and this little label
};

export type Step = { title: string; text: string; cards: PictureCard[] };
export type Page = { head: string; lead: string; steps: Step[] };

// ---------- the cards used in the pictures ----------

const num = (value: number): Card => ({ kind: "number", value });
const SHIELD: Card = { kind: "action", action: "shield" };
const TIME_OUT: Card = { kind: "action", action: "timeOut" };
const DRAW_THREE: Card = { kind: "action", action: "drawThree" };
const BONUS_4: Card = { kind: "modifier", bonus: 4, multiplier: 1 };
const DOUBLE_SCORE: Card = { kind: "modifier", bonus: 0, multiplier: 2 };

// A card on its own is drawn bigger than a card in a group, so its name can be read.
const SMALL = 44;
const MEDIUM = 46;
const SINGLE = 56;
const singleLeft = (PICTURE_W - SINGLE) / 2;

const alone = (card: Card): PictureCard[] => [{ card, left: singleLeft, top: 6, tilt: 0, width: SINGLE }];

// A number card next to a bonus card (the bonus is the one on the right).
const withBonus = (number: number, bonus: Card): PictureCard[] => [
  { card: num(number), left: 8, top: 16, tilt: -8, width: MEDIUM },
  { card: bonus, left: 54, top: 8, tilt: 8, width: MEDIUM },
];

export const PAGES: Page[] = [
  {
    head: "PUSH YOUR LUCK",
    lead: "Draw cards to score points. Stop before you get a number you already have.",
    steps: [
      {
        title: "Hit to draw",
        text: "Each new number adds its value to your round score.",
        cards: [
          { card: num(3), left: 6, top: 14, tilt: -10, width: SMALL },
          { card: num(7), left: 34, top: 8, tilt: 0, width: SMALL },
          { card: num(11), left: 62, top: 14, tilt: 10, width: SMALL },
        ],
      },
      {
        title: "A duplicate busts you",
        text: "Draw a number you already have and the round scores 0.",
        cards: [
          { card: num(7), left: 10, top: 10, tilt: -8, width: SMALL },
          { card: num(7), left: 52, top: 10, tilt: 8, width: SMALL, again: "7 again!" },
        ],
      },
      {
        title: "Stay to bank your points",
        text: "Stay when you are happy. Your round score goes into your total.",
        cards: [
          { card: num(9), left: 14, top: 10, tilt: -6, width: SMALL },
          { card: num(4), left: 48, top: 14, tilt: 6, width: SMALL },
        ],
      },
    ],
  },
  {
    head: "SPECIAL CARDS",
    lead: "Some cards do something when you draw them.",
    steps: [
      {
        title: "Shield",
        text: "Blocks your next duplicate. You can only hold one, so pass a spare to someone else.",
        cards: alone(SHIELD),
      },
      {
        title: "Time Out",
        text: "You choose a player. They stop drawing this round but keep their points.",
        cards: alone(TIME_OUT),
      },
      {
        title: "Draw Three",
        text: "You choose a player. They draw three cards in a row, stopping early if they bust or make a Seven Stack.",
        cards: alone(DRAW_THREE),
      },
    ],
  },
  {
    head: "SCORING",
    lead: "Your round score is your numbers, plus any bonus cards.",
    steps: [
      {
        title: "Bonus cards add points",
        text: "A +4 adds four to your round score after the numbers are counted.",
        cards: withBonus(6, BONUS_4),
      },
      {
        title: "Double Score doubles your numbers",
        text: "Only your number cards are doubled. Bonus cards are added afterwards.",
        cards: withBonus(8, DOUBLE_SCORE),
      },
      {
        title: "Seven Stack: +15 and the round ends",
        text: "Seven different numbers end the round at once. Reach the target score to win; if several players do, the highest total wins.",
        cards: [
          { card: num(1), left: 0, top: 20, tilt: -14, width: SMALL },
          { card: num(4), left: 22, top: 12, tilt: -6, width: SMALL },
          { card: num(7), left: 44, top: 8, tilt: 0, width: SMALL },
          { card: num(12), left: 66, top: 14, tilt: 8, width: SMALL },
        ],
      },
    ],
  },
];
