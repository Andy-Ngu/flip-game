import { drawCard, hit, isRoundOver, stay } from "./rules";
import { hasSevenStack } from "./scoring";
import { Card, DeckState, Player } from "./types";

export type RoundState = { players: Player[]; deck: DeckState };

export type TargetedKind = "timeOut" | "drawThree" | "shield";

// Picks which player (by index) a card goes to. `options` lists the legal choices.
// The actor is the player who received the card.
export type ChooseTarget = (
  players: Player[],
  actor: number,
  card: TargetedKind,
  options: number[]
) => number;

// Time Out and Draw Three need a target. Shield does not.
type TargetedCard = { kind: "action"; action: "timeOut" | "drawThree" };
function needsTarget(card: Card): card is TargetedCard {
  return card.kind === "action" && card.action !== "shield";
}
const isShield = (c: Card): boolean => c.kind === "action" && c.action === "shield";

const activeIndexes = (players: Player[]): number[] =>
  players.map((_, i) => i).filter((i) => players[i].status === "playing");

function setPlayer(state: RoundState, i: number, player: Player): RoundState {
  return { ...state, players: state.players.map((p, j) => (j === i ? player : p)) };
}

function discard(state: RoundState, cards: Card[]): RoundState {
  return { ...state, deck: { ...state.deck, discardPile: [...state.deck.discardPile, ...cards] } };
}

function draw(state: RoundState): { card: Card; state: RoundState } {
  const result = drawCard(state.deck);
  return { card: result.card, state: { ...state, deck: result.deck } };
}

// Put a card in front of a player. It stays there until the round ends,
// so a mid-round reshuffle never picks it up.
function giveToHand(state: RoundState, i: number, card: Card): RoundState {
  const p = state.players[i];
  return setPlayer(state, i, { ...p, hand: [...p.hand, card] });
}

function pick(state: RoundState, actor: number, card: TargetedKind, options: number[], choose: ChooseTarget): number {
  const target = choose(state.players, actor, card, options);
  if (!options.includes(target)) throw new Error("That player can't be chosen");
  return target;
}

// A number, modifier or Shield card. A second Shield is passed on
// to an active player who has none, or discarded if nobody can take it.
function applyPlain(state: RoundState, i: number, card: Card, choose: ChooseTarget): RoundState {
  const p = state.players[i];
  if (isShield(card) && p.hand.some(isShield)) {
    const options = activeIndexes(state.players).filter((j) => !state.players[j].hand.some(isShield));
    if (options.length === 0) return discard(state, [card]);
    const to = pick(state, i, "shield", options, choose);
    return giveToHand(state, to, card);
  }
  const result = hit(p, card);
  return discard(setPlayer(state, i, result.player), result.discarded);
}

function resolveAction(state: RoundState, actor: number, card: TargetedCard, choose: ChooseTarget): RoundState {
  // Nobody left to target (or the round just ended): the card is simply set down.
  if (isRoundOver(state.players)) return giveToHand(state, actor, card);

  const target = pick(state, actor, card.action, activeIndexes(state.players), choose);
  let s = giveToHand(state, target, card);

  if (card.action === "timeOut") {
    return setPlayer(s, target, { ...s.players[target], status: "timedOut" });
  }

  // Draw Three: the target draws three cards, one at a time.
  const pending: TargetedCard[] = [];
  for (let n = 0; n < 3; n++) {
    const p = s.players[target];
    if (p.status !== "playing" || hasSevenStack(p)) break; // bust or Seven Stack stops it early
    const drawn = draw(s);
    s = drawn.state;
    if (needsTarget(drawn.card)) {
      pending.push(drawn.card); // counts toward the three, resolved afterwards
      continue;
    }
    s = applyPlain(s, target, drawn.card, choose);
  }

  // Time Out / Draw Three revealed during this one are resolved after the three
  // cards, but only if the player didn't bust.
  for (const extra of pending) {
    if (s.players[target].status === "busted") s = giveToHand(s, target, extra);
    else s = resolveAction(s, target, extra, choose);
  }
  return s;
}

// A player is handed a card (dealt or drawn) and it takes effect.
function receiveCard(state: RoundState, i: number, card: Card, choose: ChooseTarget): RoundState {
  if (needsTarget(card)) return resolveAction(state, i, card, choose);
  return applyPlain(state, i, card, choose);
}

// One turn: hit or stay.
export function takeTurn(state: RoundState, i: number, decision: "hit" | "stay", choose: ChooseTarget): RoundState {
  const player = state.players[i];
  if (player.status !== "playing") throw new Error("It isn't this player's turn to act");
  if (decision === "stay") return setPlayer(state, i, stay(player));
  const drawn = draw(state);
  return receiveCard(drawn.state, i, drawn.card, choose);
}

// The dealer deals one card to each player, starting on the dealer's left.
// Action cards are resolved on the spot, then dealing continues.
export function dealRound(state: RoundState, dealer: number, choose: ChooseTarget): RoundState {
  let s = state;
  const n = s.players.length;
  for (let k = 1; k <= n; k++) {
    if (isRoundOver(s.players)) break;
    const i = (dealer + k) % n;
    if (s.players[i].status !== "playing") continue;
    const drawn = draw(s);
    s = receiveCard(drawn.state, i, drawn.card, choose);
  }
  return s;
}

// Plays a whole round automatically (for testing). shouldHit decides each turn.
export function playRound(state: RoundState, dealer: number, choose: ChooseTarget, shouldHit: (p: Player) => boolean): RoundState {
  let s = dealRound(state, dealer, choose);
  const n = s.players.length;
  let i = dealer;
  let guard = 0;
  while (!isRoundOver(s.players)) {
    if (++guard > 1000) throw new Error("Round did not end");
    i = (i + 1) % n;
    const p = s.players[i];
    if (p.status !== "playing") continue;
    const hitNow = p.hand.length === 0 || shouldHit(p);
    s = takeTurn(s, i, hitNow ? "hit" : "stay", choose);
  }
  return s;
}

// Simple chooser for simulations: a random legal option.
export const randomTarget: ChooseTarget = (_players, _actor, _card, options) =>
  options[Math.floor(Math.random() * options.length)];
