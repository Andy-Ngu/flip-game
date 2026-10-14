import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { describeCard } from "../game/describe";
import { scoreHand } from "../game/scoring";
import {
    act, botStep, chooseTarget, Game, isBotTurn, newGame, nextRound, PlayerSetup,
} from "../game/session";
import { Button } from "./Button";
import { CARD_COLORS, styles } from "./GameScreen.styles";

// How long a computer player "thinks" before it moves, so you can follow along.
const BOT_DELAY_MS = 900;

const STATUS_LABEL = {
  playing: "",
  stayed: "Stayed",
  busted: "BUST",
  frozen: "Frozen",
} as const;

// What to tell the player for each kind of card that needs a target.
const PENDING_INFO = {
  freeze: {
    title: "Freeze!",
    rule: "The player you pick banks their points and is out for the rest of the round.",
    instruction: "Choose who to freeze:",
    verb: "Freeze",
  },
  flipThree: {
    title: "Flip Three!",
    rule: "The player you pick must flip the next 3 cards, and can't stop. They bust if they flip a duplicate.",
    instruction: "Choose who flips three cards:",
    verb: "Flip 3 on",
  },
  secondChance: {
    title: "Spare Second Chance",
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
          <Text style={styles.title}>Flip Game</Text>
          <Pressable onPress={confirmQuit}>
            <Text style={styles.link}>Change players</Text>
          </Pressable>
        </View>

        {players.map((p, i) => (
          <View
            key={p.id}
            style={[
              styles.player,
              i === acting && styles.currentPlayer,
              p.status !== "playing" && styles.playerOut,
            ]}
          >
            <View style={styles.row}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{p.name}</Text>
                {i === acting && (
                  <Text style={styles.turnBadge}>{game.pending ? "CHOOSING" : "TURN"}</Text>
                )}
              </View>
              <Text style={styles.score}>Total: {p.totalScore}</Text>
            </View>

            <Text style={styles.tag}>
              {p.bot ? `${p.bot} computer` : "Human"}
              {i === game.dealer ? "  ·  dealer" : ""}
            </Text>

            <View style={styles.hand}>
              {p.hand.length === 0 && <Text style={styles.empty}>No cards yet</Text>}
              {p.hand.map((card, k) => (
                <View
                  key={k}
                  style={[styles.card, { backgroundColor: CARD_COLORS[card.kind] }]}
                >
                  <Text style={styles.cardText}>{describeCard(card)}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.status, p.status === "busted" && styles.bust]}>
              This round: {scoreHand(p)} {STATUS_LABEL[p.status]}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Fixed bar: always visible, so you never have to scroll to find your move. */}
      <View style={styles.controls}>
        {game.note && <Text style={styles.note}>{game.note}</Text>}

        {botsTurn && (
          <View style={styles.botBanner}>
            <Text style={styles.botBannerText}>{players[acting].name} is thinking…</Text>
          </View>
        )}

        {game.pending && !botsTurn && (
          <View style={styles.actionPanel}>
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
                  label={`${PENDING_INFO[game.pending!.card].verb} ${players[i].name}${i === game.pending!.actor ? " (yourself)" : ""
                    }`}
                  onPress={() => setGame(chooseTarget(game, i))}
                />
              ))}
            </View>
          </View>
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
            <Text style={styles.prompt}>
              Winner: {game.winners.map((w) => w.name).join(" & ")}
            </Text>
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
