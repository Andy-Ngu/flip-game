import { scoreHand } from "./scoring";
import { actorOf, Game } from "./session";

// What the stage (your own section of the table) says about you right now.
export type StageMood = "turn" | "waiting" | "stayed" | "bust" | "out" | "over";

export type StageInfo = {
  mood: StageMood;
  title: string;        // the big word: YOUR TURN, YOUR HAND, BUSTED ...
  sub: string;          // the line under it. For YOUR TURN it is empty: the screen adds the clock
  short: string;        // the same line in a few words, for the narrow space beside the avatar ("Keeps 10"; the screen reader still gets the whole line)
  canAct: boolean;      // you may press HIT or STAY right now
  mustChoose: boolean;  // you have a card in your hand that needs a player picked
};

export function stageInfo(game: Game, me: number): StageInfo {
  const players = game.round.players;
  const you = players[me];
  const actor = actorOf(game);
  const mustChoose = game.pending !== null && game.pending.actor === me;

  if (game.phase !== "playing") return { mood: "over", title: "ROUND OVER", sub: "", short: "", canAct: false, mustChoose: false };

  if (you.status === "busted") return { mood: "bust", title: "BUSTED", sub: "This round scores 0", short: "Scores 0", canAct: false, mustChoose: false };

  if (you.status === "timedOut") {
    const by = you.timedOutBy === undefined ? undefined : players[you.timedOutBy];
    const who = by && by !== you ? `Out by ${by.name}` : "Out for the round";
    return { mood: "out", title: "TIMED OUT", sub: `${who} · keeps ${scoreHand(you)}`, short: `Keeps ${scoreHand(you)}`, canAct: false, mustChoose: false };
  }

  if (you.status === "stayed") return { mood: "stayed", title: "YOU STAYED", sub: `Banked ${scoreHand(you)}`, short: `Banked ${scoreHand(you)}`, canAct: false, mustChoose: false };

  if (actor === me) return { mood: "turn", title: "YOUR TURN", sub: "", short: "", canAct: !mustChoose, mustChoose };

  const who = actor >= 0 ? players[actor].name : "";
  const sub = actor < 0 ? "" : game.pending ? `${who} is choosing a player` : `${who} is up`;
  return { mood: "waiting", title: "YOUR HAND", sub, short: sub ? "Waiting" : "", canAct: false, mustChoose: false };
}

// You can only stay with at least one card.
export const canStay = (game: Game, me: number): boolean => game.round.players[me].hand.length > 0;
