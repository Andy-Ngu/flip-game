import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn, SlideInDown, ZoomIn } from "react-native-reanimated";
import { diffEvents, feelFor } from "../game/events";
import { scoreHand } from "../game/scoring";
import {
  act, botStep, chooseTarget, Game, isBotTurn, newGame, nextRound, PlayerSetup,
} from "../game/session";
import { Button } from "./Button";
import { styles } from "./GameScreen.styles";
import { playFeel } from "./haptics";
import { PlayerCard } from "./PlayerCard";

// How long a computer player "thinks" before it moves, so you can follow along.
const BOT_DELAY_MS = 900;

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
  seats: PlayerSetup[];   // who is playing, from the setup screen
  onQuit: () => void;     // go back to the setup screen
};

export default function GameScreen({ seats, onQuit }: Props) {
  // The whole game lives in one piece of state. Each button press replaces it
  // with a new Game object returned by the engine.
  const [game, setGame] = useState<Game>(() => newGame(seats));
  const [hapticsOn, setHapticsOn] = useState(true);
  const { players } = game.round;
  const botsTurn = isBotTurn(game);

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
  }, [game, hapticsOn]);

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
            <Pressable onPress={() => setHapticsOn(!hapticsOn)}>
              <Text style={styles.link}>Haptics: {hapticsOn ? "On" : "Off"}</Text>
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
                label={`Stay (${scoreHand(players[game.current])})`}
                disabled={players[game.current].hand.length === 0}
                onPress={() => setGame(act(game, "stay"))}
              />
            </View>
          </View>
        )}

        {game.phase === "roundOver" && (
          <Button label="Score round and continue" onPress={() => setGame(nextRound(game))} />
        )}

        {game.phase === "gameOver" && (
          <View style={{ gap: 8 }}>
            <Animated.Text entering={ZoomIn.springify()} style={styles.winner}>
              Winner: {game.winners.map((w) => w.name).join(" & ")}
            </Animated.Text>
            <View style={styles.row}>
              <Button fill label="Play again" onPress={() => setGame(newGame(seats))} />
              <Button fill label="Change players" onPress={onQuit} />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
