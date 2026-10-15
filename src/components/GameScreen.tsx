import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import { diffEvents, feelFor } from "../game/events";
import { soundsFor } from "../game/sounds";
import { scoreHand } from "../game/scoring";
import {
  act, botStep, chooseTarget, Game, isBotTurn, newGame, nextRound, PlayerSetup,
} from "../game/session";
import { Button } from "./Button";
import { styles } from "./GameScreen.styles";
import { playFeel } from "./haptics";
import { HowToPlay } from "./HowToPlay";
import { PlayerCard } from "./PlayerCard";
import { useSounds } from "./useSounds";
import { RoundSummary } from "./RoundSummary";
import { WinnerScreen } from "./WinnerScreen";

// How long a computer player "thinks" before it moves, so you can follow along.
const BOT_DELAY_MS = 900;
// How long the table stays visible after a round ends, before the results appear.
const RESULTS_DELAY_MS = 1600;

// What to tell the player for each kind of card that needs a target.
const PENDING_INFO = {
  timeOut: {
    title: "Time Out!",
    rule: "The player you pick banks their points and is out for the rest of the round.",
    instruction: "Choose who to time out:",
    verb: "Time Out",
  },
  drawThree: {
    title: "Draw Three!",
    rule: "The player you pick must draw the next 3 cards, and can't stop. They bust if they draw a duplicate.",
    instruction: "Choose who draws three cards:",
    verb: "Draw 3 on",
  },
  shield: {
    title: "Spare Shield",
    rule: "Each player can hold only one. Give this one to a player who doesn't have one yet.",
    instruction: "Choose who gets it:",
    verb: "Give to",
  },
} as const;

type Props = {
  seats: PlayerSetup[];                    // who is playing, from the setup screen
  hapticsOn: boolean;                      // saved settings, owned by the parent
  onHapticsChange: (on: boolean) => void;
  soundOn: boolean;
  onSoundChange: (on: boolean) => void;
  onQuit: () => void;                      // go back to the setup screen
};

export default function GameScreen({ seats, hapticsOn, onHapticsChange, soundOn, onSoundChange, onQuit }: Props) {
  // The whole game lives in one piece of state. Each button press replaces it
  // with a new Game object returned by the engine.
  const [game, setGame] = useState<Game>(() => newGame(seats));
  const [showRules, setShowRules] = useState(false);
  const [roundNumber, setRoundNumber] = useState(1);
  // At the end of a round the results cover the table. "See table" hides them for a look.
  const [peeking, setPeeking] = useState(false);
  const { players } = game.round;
  const botsTurn = isBotTurn(game);
  const { play, playCues } = useSounds(soundOn);

  // When it's a computer player's turn, wait a moment and make one move.
  // Each move changes `game`, which re-runs this effect for the next move.
  useEffect(() => {
    if (!isBotTurn(game)) return;
    const timer = setTimeout(
      () => setGame((g) => (isBotTurn(g) ? botStep(g) : g)),
      BOT_DELAY_MS
    );
    return () => clearTimeout(timer);
  }, [game]);

  // After every change, work out what happened and give it a feel. Doing this
  // here, in one place, covers your moves and the computers' moves alike.
  const previous = useRef<Game>(game);
  useEffect(() => {
    const events = diffEvents(previous.current, game);
    previous.current = game;
    if (hapticsOn) playFeel(feelFor(events, game.round.players));
    playCues(soundsFor(events, game.round.players));
  }, [game, hapticsOn, playCues]);

  // The first deal of the game. (Later rounds are dealt by a state change, which the
  // effect above hears. The first one happens before this screen exists.)
  useEffect(() => {
    const timer = setTimeout(() => play("deal"), 250);
    return () => clearTimeout(timer);
  }, []);

  // The results board waits a moment after the last move, so you see the final card land
  // (or the bust) before the board covers the table.
  const [resultsReady, setResultsReady] = useState(false);
  useEffect(() => {
    setPeeking(false);
    setResultsReady(false);
    if (game.phase !== "roundOver") return;
    const timer = setTimeout(() => {
      setResultsReady(true);
      play("roundEnd");
    }, RESULTS_DELAY_MS);
    return () => clearTimeout(timer);
  }, [game.phase]);

  function continueFromRound() {
    setRoundNumber((n) => n + 1);
    setGame(nextRound(game));
  }

  function playAgain() {
    setRoundNumber(1);
    setGame(newGame(seats));
  }

  // Who is acting right now: whoever must answer a question, else whoever's turn it is.
  const acting = game.pending ? game.pending.actor : game.phase === "playing" ? game.current : -1;

  function confirmQuit() {
    Alert.alert("Change players?", "The game in progress will be lost.", [
      { text: "Keep playing", style: "cancel" },
      { text: "Change players", style: "destructive", onPress: onQuit },
    ]);
  }

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Stack Seven</Text>
          <View style={styles.headerLinks}>
            <Pressable onPress={() => onSoundChange(!soundOn)}>
              <Text style={styles.link}>Sound: {soundOn ? "On" : "Off"}</Text>
            </Pressable>
            <Pressable onPress={() => onHapticsChange(!hapticsOn)}>
              <Text style={styles.link}>Haptics: {hapticsOn ? "On" : "Off"}</Text>
            </Pressable>
            <Pressable onPress={() => setShowRules(true)}>
              <Text style={styles.link}>Rules</Text>
            </Pressable>
            <Pressable onPress={confirmQuit}>
              <Text style={styles.link}>Change players</Text>
            </Pressable>
          </View>
        </View>

        {players.map((p, i) => (
          <PlayerCard
            key={p.id}
            player={p}
            acting={i === acting}
            choosing={game.pending !== null}
            dealer={i === game.dealer}
          />
        ))}
      </ScrollView>

      {/* Fixed bar: always visible, so you never have to scroll to find your move. */}
      <View style={styles.controls}>
        {game.note && <Text style={styles.note}>{game.note}</Text>}

        {botsTurn && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.botBanner}>
            <Text style={styles.botBannerText}>{players[acting].name} is thinking…</Text>
          </Animated.View>
        )}

        {game.pending && !botsTurn && (
          <Animated.View entering={SlideInDown.duration(250)} style={styles.actionPanel}>
            <Text style={styles.actionLabel}>{players[game.pending.actor].name} drew</Text>
            <Text style={styles.actionTitle}>{PENDING_INFO[game.pending.card].title}</Text>
            <Text style={styles.actionRule}>{PENDING_INFO[game.pending.card].rule}</Text>
            <Text style={styles.actionInstruction}>
              {PENDING_INFO[game.pending.card].instruction}
            </Text>
            <View style={styles.optionRow}>
              {game.pending.options.map((i) => (
                <Button
                  key={i}
                  fill
                  variant="secondary"
                  label={`${PENDING_INFO[game.pending!.card].verb} ${players[i].name}${
                    i === game.pending!.actor ? " (yourself)" : ""
                  }`}
                  onPress={() => setGame(chooseTarget(game, i))}
                />
              ))}
            </View>
          </Animated.View>
        )}

        {game.phase === "playing" && !game.pending && !botsTurn && (
          <View style={{ gap: 8 }}>
            <Text style={styles.prompt}>{players[game.current].name}, hit or stay?</Text>
            <View style={styles.row}>
              <Button fill label="Hit" onPress={() => setGame(act(game, "hit"))} />
              <Button
                fill
                variant="secondary"
                label={`Stay (${scoreHand(players[game.current])})`}
                disabled={players[game.current].hand.length === 0}
                onPress={() => setGame(act(game, "stay"))}
              />
            </View>
          </View>
        )}

        {game.phase === "roundOver" && peeking && (
          <View style={styles.row}>
            <Button fill variant="secondary" label="Show results" onPress={() => setPeeking(false)} />
            <Button fill label="Next round" onPress={continueFromRound} />
          </View>
        )}
      </View>

      {game.phase === "roundOver" && resultsReady && !peeking && (
        <RoundSummary
          players={players}
          round={roundNumber}
          onContinue={continueFromRound}
          onPeek={() => setPeeking(true)}
        />
      )}

      {game.phase === "gameOver" && (
        <WinnerScreen players={players} winners={game.winners} onPlayAgain={playAgain} onQuit={onQuit} />
      )}

      {showRules && <HowToPlay onClose={() => setShowRules(false)} />}
    </View>
  );
}
