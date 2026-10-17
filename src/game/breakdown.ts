import { duplicateIndex } from "./results";
import { hasSevenStack } from "./scoring";
import { NumberCard, Player } from "./types";

// How a hand adds up to its round points, as the lines of the "How your round scores" tooltip that
// opens when you tap your TOTAL SCORE. It only explains: the rules themselves live in scoring.ts, and
// check-breakdown.ts makes sure the total here is always the same number scoreHand() gives.

export type BreakdownKind = "number" | "double" | "bonus" | "stack" | "bust" | "total";

export type BreakdownLine = {
  label: string;       // the words on the left
  value: string;       // the figure on the right, such as "21", "× 2 = 42" or "+ 4"
  kind: BreakdownKind; // what the line is about, so the screen can style it
};

export type Breakdown = {
  lines: BreakdownLine[]; // top to bottom; the last one is always the total
  total: number;          // the points this hand is worth right now
  note: string;           // the small sentence under the lines
};

// A Seven Stack (seven different numbers) is worth this many extra points (see scoreHand).
export const SEVEN_STACK_POINTS = 15;

// "If you stay, you bank 46": the words in front of the total depend on where the player is in the round.
function totalLabel(status: Player["status"]): string {
  switch (status) {
    case "playing": return "If you stay, you bank";
    case "stayed": return "You banked";
    case "timedOut": return "Timed out, you keep";
    case "busted": return "This round scores";
  }
}

// The small sentence under the lines.
function noteFor(player: Player, stack: boolean): string {
  if (player.status === "busted") return "A number you already had ends your round with 0 points. Your total score stays as it was.";
  if (stack) return "A Seven Stack ends the round for everyone.";
  if (player.status === "stayed") return "You stayed, so these points are safe.";
  if (player.status === "timedOut") return "A Time Out stops you drawing, but you keep your points.";
  return "A bust scores 0. Seven different numbers adds 15 more.";
}

export function breakdown(player: Player): Breakdown {
  // A busted hand is worth nothing. Say why, and show the card that did it.
  if (player.status === "busted") {
    const at = duplicateIndex(player.hand);
    const card = at === null ? undefined : player.hand[at];
    const second = card && card.kind === "number" ? `You drew a second ${card.value}` : "You drew a number you already had";
    return {
      lines: [
        { label: second, value: "Bust", kind: "bust" },
        { label: totalLabel("busted"), value: "0", kind: "total" },
      ],
      total: 0,
      note: noteFor(player, false),
    };
  }

  const numbers = player.hand.filter((c): c is NumberCard => c.kind === "number").map((c) => c.value);
  const numbersSum = numbers.reduce((sum, v) => sum + v, 0);
  const doubled = player.hand.some((c) => c.kind === "modifier" && c.multiplier === 2);
  const bonuses = player.hand.flatMap((c) => (c.kind === "modifier" && c.bonus !== 0 ? [c.bonus] : []));
  const bonusSum = player.hand.reduce((sum, c) => sum + (c.kind === "modifier" ? c.bonus : 0), 0);
  const stack = hasSevenStack(player);

  const lines: BreakdownLine[] = [];
  if (numbers.length === 0) lines.push({ label: "No numbers yet", value: "0", kind: "number" });
  else if (numbers.length === 1) lines.push({ label: `Number ${numbers[0]}`, value: String(numbersSum), kind: "number" });
  else lines.push({ label: `Numbers ${numbers.join(" + ")}`, value: String(numbersSum), kind: "number" });

  // Double Score doubles the numbers only; a Bonus card is added afterwards and never doubled.
  const afterDouble = doubled ? numbersSum * 2 : numbersSum;
  if (doubled) lines.push({ label: "Double Score doubles numbers only", value: `× 2 = ${afterDouble}`, kind: "double" });

  if (bonuses.length === 1) lines.push({ label: "Bonus card", value: `+ ${bonuses[0]}`, kind: "bonus" });
  else if (bonuses.length > 1) lines.push({ label: `Bonus cards ${bonuses.map((b) => `+${b}`).join(" ")}`, value: `+ ${bonusSum}`, kind: "bonus" });

  if (stack) lines.push({ label: "Seven different numbers", value: `+ ${SEVEN_STACK_POINTS}`, kind: "stack" });

  const total = afterDouble + bonusSum + (stack ? SEVEN_STACK_POINTS : 0);
  lines.push({ label: totalLabel(player.status), value: String(total), kind: "total" });

  return { lines, total, note: noteFor(player, stack) };
}

// The whole tooltip as one sentence, for a screen reader.
export function breakdownSpeech(b: Breakdown): string {
  const spoken = b.lines.map((l) => `${l.label}, ${l.value.replace("×", "times").replace("=", "equals").replace("+", "plus")}`);
  return ["How your round scores", ...spoken, b.note].join(". ");
}
