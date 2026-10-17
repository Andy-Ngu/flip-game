import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Platform } from "react-native";
import { HelpKey, helpKeyFor, markSeen, nextHelp, nextHelpForCards } from "../../game/cardHelp";
import { BUBBLE_MS, cooldownLeft } from "../../game/chat";
import { shouldTick } from "../../game/clock";
import { countDuration, countSteps, Finish, finishSize, stepFeel, stepSound, stepTime } from "../../game/countSteps";
import { diffEvents, feelFor, GameEvent } from "../../game/events";
import { leaderOf } from "../../game/moments";
import { ARRIVE_GAP_MS, arriveMs, PLAYED_MS, RESHUFFLE_MS, SHIELD_MS, TOAST_MS } from "../../game/momentTimes";
import { paced, botPauseMs } from "../../game/pace";
import { isAimedAt, playedOnYou, PlayedView } from "../../game/played";
import { TableSetup } from "../../game/seats";
import { hasSevenStack } from "../../game/scoring";
import {
  act, actorOf, botPlay, botStep, chooseTarget, Game, imBack, isBotSeat, isBotTurn, newGame, nextRound, PlayerSetup, settleDeal, timeUp,
} from "../../game/session";
import { soundsFor } from "../../game/sounds";
import { recordGame, resultOf } from "../../game/stats";
import { turnPosition } from "../../game/results";
import { Card, Player } from "../../game/types";
import { useApp } from "../AppContext";
import { Lit } from "../cards/Hand";
import { playFeel } from "../haptics";
import { useSounds } from "../useSounds";
import { useTurnClock } from "./useTurnClock";

// You are always in seat 0 when playing against the computer.
export const ME = 0;

// Where the table is in its story:
//   splash   the "next up" board for the new round
//   deal     the cards are being dealt one player at a time
//   play     the round is being played
//   ending   the last move was made; the table stays on screen a moment (longer after a Seven Stack)
//   results  the round's results board
//   over     the game has been won
export type Flow = "splash" | "deal" | "play" | "ending" | "results" | "over";

export type Tone = "gold" | "blue" | "danger" | "good";
export type ToastMsg = { id: number; text: string; tone: Tone };
export type ShieldMoment = { id: number; seat: number; duplicate: Card | null };

// A computer player is about to play a card on you. The game waits at `base` while `view` is on the screen; when
// it is over, the game moves on to `next` (what the move does).
export type PlayedMoment = { id: number; view: PlayedView; base: Game; next: Game };

// A quick-chat phrase or an emote that a player just sent. It is shown beside their name for a few seconds.
export type Bubble = { id: number; kind: "phrase" | "emote"; ref: string };

// The one-line pop-up that explains a kind of card the first time it turns up: which kind, and the
// real card that caused it (null when only the kind is known, as for a Seven Stack).
export type HelpView = { key: HelpKey; card: Card | null };

// The score being counted after you stay: which card is lit, the round score so far, and (on the last
// step) how big the finish is. A new `key` means a new count.
export type CountView = { key: number; lit: Lit | null; shown: number; finish: Finish | null };

type Config = {
  setup: PlayerSetup[];
  table: TableSetup;
  paused: boolean;     // a menu or dialog is open, or the app is in the background
  blocked: boolean;    // a menu, dialog or screen is open on top of the table (the app being in the background does not count)
};

const canAct = (g: Game): boolean => g.phase === "playing" && actorOf(g) === ME && !g.pending && !isBotSeat(g, ME);

// The state of one game against the computer, and everything that happens as it is played:
// the computer's moves, the turn clock, sounds and buzzes, the deal, the end of the round.
export function useTable({ setup, table, paused, blocked }: Config) {
  const { ui, settings, update } = useApp();
  const { play, playCues } = useSounds(ui.sound, ui.turnAlertSound);

  const [game, setGame] = useState<Game>(() => settleDeal(newGame(setup, { target: table.target })));
  const [flow, setFlow] = useState<Flow>("splash");
  const [dealStep, setDealStep] = useState(0);
  const [badges, setBadges] = useState(false);
  const [toast, setToast] = useState<ToastMsg | null>(null);
  const [shield, setShield] = useState<ShieldMoment | null>(null);
  const [reshuffle, setReshuffle] = useState(false);
  const [sevenSeat, setSevenSeat] = useState<number | null>(null);
  const [played, setPlayed] = useState<PlayedMoment | null>(null);
  const [arriving, setArriving] = useState(0);     // how many cards are coming to you one by one right now (0: none)
  const [alertKey, setAlertKey] = useState(0);
  const [help, setHelp] = useState<HelpView | null>(null);
  const [bubbles, setBubbles] = useState<Record<number, Bubble>>({});
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const [count, setCount] = useState<CountView | null>(null);
  const ids = useRef(0);
  const recorded = useRef(false);
  const lastSent = useRef<number | null>(null);
  const bubbleTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const countTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const countEndsAt = useRef(0);   // when the score count will be finished (milliseconds, from Date.now())
  const playedNow = useRef<PlayedMoment | null>(null);   // the same as `played`, for the timer and the tap
  const explained = useRef<Game | null>(null);           // the game after a move that the "played on you" message already explained
  const slowCards = useRef(false); // the next move brings cards to you one by one: its sounds are spaced to match
  playedNow.current = played;
  const players = game.round.players;

  const say = useCallback((text: string, tone: Tone = "gold") => setToast({ id: ++ids.current, text, tone }), []);

  useEffect(
    () => () => {
      bubbleTimers.current.forEach(clearTimeout);
      countTimers.current.forEach(clearTimeout);
    },
    []
  );

  // ---------- counting your score ----------
  // After you stay, your cards light up one after another: each hops up and shows its points, the
  // round score climbs, the note and the buzz get higher, and the last card gets a bigger finish.
  // (What happens and when is worked out in game/countSteps.ts.)
  function stopCount() {
    countTimers.current.forEach(clearTimeout);
    countTimers.current = [];
    setCount(null);
  }

  function startCount(you: Player) {
    const steps = countSteps(you);
    stopCount();
    if (steps.length === 0) return;
    const key = ++ids.current;
    setCount({ key, lit: null, shown: 0, finish: null });
    steps.forEach((step, i) => {
      const last = i === steps.length - 1;
      countTimers.current.push(
        setTimeout(() => {
          play(stepSound(i));
          if (ui.vibration) playFeel(stepFeel(i, steps.length, step.total));
          setCount({
            key,
            lit: step.cardIndex === null ? null : { index: step.cardIndex, label: step.label, key: key * 100 + i },
            shown: step.total,
            finish: last ? finishSize(step.total) : null,
          });
        }, paced(stepTime(i, steps.length), ui.speed))
      );
    });
    // A moment after the last card the number settles back to the normal score box.
    const total = paced(countDuration(steps.length) + 500, ui.speed);
    countEndsAt.current = Date.now() + total;
    countTimers.current.push(setTimeout(() => setCount(null), total));
  }

  // The first time a kind of card turns up, a one-line pop-up explains it. It is remembered on the phone,
  // so each kind is explained once, ever.
  function explainOnce(key: HelpKey, card: Card | null) {
    setHelp({ key, card });
    update({ helpSeen: markSeen(settings.helpSeen, key) });
  }

  // The first-game tips: shown once, over the first round of the very first game. Nothing moves while they are open.
  const tipsOpen = !settings.tipsDone && flow === "play" && game.roundNo === 1;
  const finishTips = useCallback(() => update({ tipsDone: true }), [update]);

  // ---------- the deal ----------

  // dealStep is how many hands have been dealt so far. One more than the number of players means the
  // deal is over. It is back at 0 whenever the table is not being dealt, so a new deal starts from nothing.
  const dealOrder = (seat: number) => turnPosition(seat, game.dealer, players.length) - 1;
  // Has this player's hand been dealt yet? The tiles and the stage show nothing until it has.
  const dealt = (seat: number): boolean => flow !== "splash" && (flow !== "deal" || dealOrder(seat) < dealStep);

  useEffect(() => {
    if (flow !== "deal") return;
    setBadges(true);
    const n = game.round.players.length;
    const gap = paced(190, ui.speed);
    play("deal");
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let k = 1; k <= n; k++) timers.push(setTimeout(() => setDealStep(k), k * gap));
    timers.push(setTimeout(() => setDealStep(n + 1), n * gap + paced(650, ui.speed)));
    return () => timers.forEach(clearTimeout);
  }, [flow]);

  // The round starts once the deal is over. If a menu or dialog was opened meanwhile (Back during the
  // round board, say), it waits until that is closed, so the tips, the help pop-up and the "your turn"
  // chime never turn up underneath it.
  useEffect(() => {
    if (flow !== "deal" || dealStep <= game.round.players.length || blocked) return;
    setDealStep(0);
    setFlow("play");
  }, [flow, dealStep, blocked]);

  // The play order badges stay a moment after the deal, so you can see who goes first.
  useEffect(() => {
    if (flow !== "play" || !badges) return;
    const t = setTimeout(() => setBadges(false), paced(1800, ui.speed));
    return () => clearTimeout(t);
  }, [flow, badges]);

  // ---------- the computer's moves ----------

  // When a computer is about to play a card ON YOU (Draw Three, Time Out, a spare Shield), the game does not make the
  // move at once: it stops and says so first (the "played on you" message, see below), because three cards landing in
  // your hand with no word of why is hard to follow. While that message is up, and while the cards it brings are
  // arriving, the computers wait.
  const botTurn = isBotTurn(game);
  const running = flow === "play" && !paused && !reshuffle && !tipsOpen && played === null && arriving === 0;
  useEffect(() => {
    if (!running || !botTurn) return;
    const t = setTimeout(() => {
      const play = botPlay(game);
      if (isAimedAt(play, ME) && !isBotSeat(game, ME)) {
        setPlayed({ id: ++ids.current, view: playedOnYou(play, game.round.players), base: game, next: botStep(game) });
      } else {
        setGame((g) => (isBotTurn(g) ? botStep(g) : g));
      }
    }, botPauseMs(ui.speed));
    return () => clearTimeout(t);
  }, [game, running, botTurn, ui.speed]);

  // The message stays for a few seconds (it waits while a menu is open) or until it is tapped, and then the
  // card does what it does. If you are being dealt cards, they arrive one by one, and the sounds follow.
  const carryOn = useCallback(() => {
    const cur = playedNow.current;
    if (!cur) return;
    playedNow.current = null;   // (a tap and the timer in the same moment must not both carry on)
    const gained = Math.max(0, cur.next.round.players[ME].hand.length - cur.base.round.players[ME].hand.length);
    slowCards.current = gained > 1;
    explained.current = cur.next;
    setGame((g) => (g === cur.base ? cur.next : g));
    setPlayed(null);
    setArriving(gained > 1 ? gained : 0);
  }, []);
  useEffect(() => {
    if (!played || paused) return;
    const t = setTimeout(carryOn, paced(PLAYED_MS, ui.speed));
    return () => clearTimeout(t);
  }, [played, paused, ui.speed]);
  useEffect(() => {
    if (arriving === 0) return;
    const t = setTimeout(() => setArriving(0), paced(arriveMs(arriving), ui.speed));
    return () => clearTimeout(t);
  }, [arriving, ui.speed]);
  const arriveGap = arriving > 0 ? paced(ARRIVE_GAP_MS, ui.speed) : 0;

  // ---------- what happened: buzzes, sounds and moments ----------

  const previous = useRef<Game>(game);
  useEffect(() => {
    const before = previous.current;
    previous.current = game;
    const events: GameEvent[] = diffEvents(before, game);
    if (events.length === 0) return;
    // A new round is announced by the deal itself.
    if (!events.some((e) => e.kind === "newRound")) {
      if (ui.vibration) playFeel(feelFor(events, ME));
      playCues(soundsFor(events, ME, slowCards.current ? paced(ARRIVE_GAP_MS, ui.speed) : undefined));
    }
    slowCards.current = false;
    for (const e of events) {
      if (e.kind === "saved") setShield({ id: ++ids.current, seat: e.player, duplicate: e.duplicate });
      else if (e.kind === "reshuffle") setReshuffle(true);
      else if (e.kind === "deckLow") say(`Only ${e.left} cards left`, "danger");
      else if (e.kind === "leadChange") say(e.to === ME ? "You took the lead!" : `${game.round.players[e.to].name} took the lead`, e.to === ME ? "good" : "gold");
      else if (e.kind === "sevenStack") setSevenSeat(e.player);
      else if (e.kind === "stay" && e.player === ME) startCount(game.round.players[ME]);
    }
    const explain = nextHelp(events, settings.helpSeen);
    if (explain) {
      const arrival = events.find((e): e is Extract<GameEvent, { kind: "card" }> => e.kind === "card" && helpKeyFor(e.card) === explain);
      explainOnce(explain, arrival ? arrival.card : null);
    }
  }, [game]);

  // The first card of each player is dealt without any move being made, so no event announces it.
  // Once the deal is done, look at what is lying on the table.
  useEffect(() => {
    if (flow !== "play") return;
    const onTable = game.round.players.flatMap((p) => p.hand);
    const explain = nextHelpForCards(onTable, settings.helpSeen);
    if (explain) explainOnce(explain, onTable.find((c) => helpKeyFor(c) === explain) ?? null);
  }, [flow]);

  // A line for the screen reader, and a toast for the moves that matter (a card played on someone,
  // or the clock running out). Plain hit and stay moves are visible on the tiles.
  // This runs for every move that comes with a note, even when the words are the same as last time
  // ("Fizz hit" twice in a row). Android reads a toast out by itself; iPhones, and the plain moves
  // that get no toast, are told.
  const notedRound = useRef(game.round);
  useEffect(() => {
    const note = game.note;
    const moved = game.round !== notedRound.current;
    notedRound.current = game.round;
    // A card played on you has just been explained by the big message (which a screen reader read out): no second one.
    if (explained.current !== null && game === explained.current) {
      explained.current = null;
      return;
    }
    if (!note || !moved) return;
    const toasted = note.startsWith("Time ran out") || note.includes(" played ");
    // "Gus played Time Out on Andy" reads better as "...on you" to Andy.
    const you = game.round.players[ME].name;
    const said = note.endsWith(` on ${you}`) ? `${note.slice(0, note.length - you.length)}you` : note;
    if (toasted) say(said, "blue");
    if (!toasted || Platform.OS === "ios") AccessibilityInfo.announceForAccessibility(said);
  }, [game]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast((cur) => (cur && cur.id === toast.id ? null : cur)), paced(TOAST_MS, ui.speed));
    return () => clearTimeout(t);
  }, [toast, ui.speed]);

  useEffect(() => {
    if (!shield) return;
    const t = setTimeout(() => setShield((cur) => (cur && cur.id === shield.id ? null : cur)), paced(SHIELD_MS, ui.speed));
    return () => clearTimeout(t);
  }, [shield, ui.speed]);

  // The reshuffle notice holds the game until it has been seen (or tapped away).
  useEffect(() => {
    if (!reshuffle) return;
    const t = setTimeout(() => setReshuffle(false), paced(RESHUFFLE_MS + 100, ui.speed));
    return () => clearTimeout(t);
  }, [reshuffle, ui.speed]);

  // ---------- your turn: the clock and the alert ----------

  const mine = flow === "play" && canActOrPick(game);
  function canActOrPick(g: Game): boolean {
    return g.phase === "playing" && actorOf(g) === ME && !isBotSeat(g, ME);
  }

  const clock = useTurnClock({
    total: table.clock,
    active: mine,
    paused: paused || reshuffle || tipsOpen,
    resetKey: game,
    onExpire: () => setGame((g) => (canActOrPick(g) ? settleDeal(timeUp(g)) : g)),
    onTick: (left) => {
      if (!shouldTick(left)) return;
      play("tick");
      if (ui.vibration) playFeel("tick");
    },
  });

  // The chime and the buzz when your turn starts (after the tips, if they are open). When a card of yours
  // needs a player picked (Time Out, Draw Three, a spare Shield) a different, questioning sound is played
  // as the question comes up, so you notice it is waiting for you. If the question is there from the
  // very start of your turn (it came while dealing), that sound takes the place of the chime.
  const alertMine = mine && !tipsOpen;
  // (The question itself is what is compared, not just "is there one": answering a Draw Three can bring up
  // another question straight away, and that one gets its sound too.)
  const question = alertMine && game.pending !== null && game.pending.actor === ME ? game.pending : null;
  const wasMine = useRef(false);
  const lastQuestion = useRef<typeof question>(null);
  useEffect(() => {
    const turnStarted = alertMine && !wasMine.current;
    if (turnStarted) setAlertKey((k) => k + 1);
    if (question && question !== lastQuestion.current) {
      play("ask");
    } else if (turnStarted) {
      play("yourTurn");
      if (ui.vibration) playFeel("medium");
    }
    wasMine.current = alertMine;
    lastQuestion.current = question;
  }, [alertMine, question]);

  // ---------- the end of a round ----------

  useEffect(() => {
    if (flow === "play" && game.phase === "roundOver") setFlow("ending");
  }, [flow, game.phase]);

  // The score count belongs to the table: it stops when the results board (or the next round) takes over.
  // So does a message left over from the last move ("Bolt took the lead"): it would sit on the first row.
  useEffect(() => {
    if (flow === "results" || flow === "over" || flow === "splash") {
      stopCount();
      setToast(null);
    }
  }, [flow]);

  useEffect(() => {
    if (flow !== "ending") return;
    const stacked = game.round.players.some(hasSevenStack);
    // If you just stayed, the results wait until your score has finished counting.
    const pause = Math.max(paced(stacked ? 3000 : 1600, ui.speed), countEndsAt.current - Date.now());
    const t = setTimeout(() => {
      setFlow("results");
      play("roundEnd");
    }, pause);
    return () => clearTimeout(t);
  }, [flow]);

  // A finished game is added to your record once.
  useEffect(() => {
    if (game.phase !== "gameOver" || recorded.current) return;
    recorded.current = true;
    const result = resultOf(game, ME);
    if (result) update({ stats: recordGame(settings.stats, result) });
  }, [game.phase]);

  // ---------- what the player can do ----------

  const hit = useCallback(() => setGame((g) => (canAct(g) ? act(g, "hit") : g)), []);
  const stay = useCallback(() => setGame((g) => (canAct(g) && g.round.players[ME].hand.length > 0 ? act(g, "stay") : g)), []);
  // (If the question came while dealing, the computer players' questions that follow are answered right away.)
  const pick = useCallback(
    (seat: number) => setGame((g) => (g.pending && g.pending.actor === ME && g.pending.options.includes(seat) ? settleDeal(chooseTarget(g, seat)) : g)),
    []
  );
  const comeBack = useCallback(() => setGame((g) => imBack(g, ME)), []);
  const splashDone = useCallback(() => setFlow((f) => (f === "splash" ? "deal" : f)), []);
  const dismissReshuffle = useCallback(() => setReshuffle(false), []);
  const dismissShield = useCallback(() => setShield(null), []);
  const closeToast = useCallback(() => setToast(null), []);
  const dismissHelp = useCallback(() => setHelp(null), []);

  // Quick chat and emotes: one every few seconds. The message shows beside your name for a moment.
  const sendChat = useCallback((kind: Bubble["kind"], ref: string) => {
    const now = Date.now();
    if (cooldownLeft(lastSent.current, now) > 0) return;
    lastSent.current = now;
    setLastSentAt(now);
    const id = ++ids.current;
    setBubbles((b) => ({ ...b, [ME]: { id, kind, ref } }));
    bubbleTimers.current.push(
      setTimeout(
        () =>
          setBubbles((b) => {
            if (b[ME]?.id !== id) return b;
            const { [ME]: _gone, ...rest } = b;
            return rest;
          }),
        BUBBLE_MS
      )
    );
  }, []);

  // "Next round", or the last button of a finished game.
  const proceed = useCallback(() => {
    const next = settleDeal(nextRound(game));
    setGame(next);
    setSevenSeat(null);
    setShield(null);
    setPlayed(null);
    setArriving(0);
    setToast(null);
    stopCount();
    setFlow(next.phase === "gameOver" ? "over" : "splash");
  }, [game]);

  // A new game with the same players and the same target.
  const again = useCallback(() => {
    recorded.current = false;
    const fresh = settleDeal(newGame(setup, { target: table.target }));
    previous.current = fresh;
    setGame(fresh);
    setSevenSeat(null);
    setShield(null);
    setPlayed(null);
    setArriving(0);
    setToast(null);
    setHelp(null);
    stopCount();
    setFlow("splash");
  }, [setup, table.target]);

  const leader = useMemo(() => leaderOf(players), [players]);

  return {
    game, flow, dealt, badges, leader,
    clock, alertKey, mine,
    toast, shield, reshuffle, sevenSeat, count, played, arriveGap,
    help, tipsOpen, bubbles, lastSentAt,
    hit, stay, pick, comeBack, proceed, again, splashDone, dismissReshuffle, dismissShield, carryOn, closeToast, dismissHelp, finishTips, sendChat,
    play, say,
  };
}
