import { scoreHand } from "./scoring";
import { Play } from "./session";
import { Card, Player } from "./types";
import { pointsText } from "./words";

// The words (and the card) of the message "Gus played Draw Three on you". It is shown when a computer player is
// about to play a card on YOU: the game stops, says who played what and what it will do to you, and only then
// goes on. All the wording lives here (not in the screen) so the tests can check it.

export type PlayedView = {
  card: Card;            // the card that was played, drawn large
  top: string;           // the small line above it: who did it, in capitals ("GUS PLAYED")
  heading: string;       // the big line under it ("DRAW THREE ON YOU")
  effect: string;        // what it does to you: one or two short sentences, each on its own line
  good: boolean;         // a gift (a spare Shield) rather than something that is done to you
  spoken: string;        // the whole message as one text, for a screen reader
};

// Is this play aimed at the person holding the phone, by somebody else? (Playing a card on yourself is not news.)
export function isAimedAt(play: Play | null, me: number): play is Play {
  return play !== null && play.target === me && play.actor !== me;
}

// What to say about a card played on `me`. `players` is the table as it is now, before the card does anything.
export function playedOnYou(play: Play, players: Player[]): PlayedView {
  const who = players[play.actor]?.name ?? "Someone";
  const card: Card = { kind: "action", action: play.card };

  switch (play.card) {
    case "drawThree": {
      const effect = "You draw 3 cards.";
      return {
        card, top: `${who.toUpperCase()} PLAYED`, heading: "DRAW THREE ON YOU", effect, good: false,
        spoken: `${who} played Draw Three on you. ${effect}`,
      };
    }
    case "timeOut": {
      const kept = players[play.target] ? scoreHand(players[play.target]) : 0;
      const effect = kept > 0 ? `You are out for this round.\nYou keep ${pointsText(kept)}.` : "You are out for this round.";
      return {
        card, top: `${who.toUpperCase()} PLAYED`, heading: "TIME OUT ON YOU", effect, good: false,
        spoken: `${who} played Time Out on you. ${effect.replace("\n", " ")}`,
      };
    }
    case "shield": {
      const effect = "It blocks your next duplicate.";
      return {
        card, top: `${who.toUpperCase()} GAVE YOU`, heading: "A SPARE SHIELD", effect, good: true,
        spoken: `${who} gave you a spare Shield. ${effect}`,
      };
    }
  }
}
