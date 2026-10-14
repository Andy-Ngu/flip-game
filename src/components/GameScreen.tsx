import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { describeCard } from "../game/describe";
import { scoreHand } from "../game/scoring";
import { act, chooseTarget, Game, newGame, nextRound } from "../game/session";
import { CARD_COLORS, styles } from "./GameScreen.styles";

const NAMES = ["Ann", "Ben", "Cat"];

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

export default function GameScreen() {
    // The whole game lives in one piece of state. Each button press replaces it
    // with a new Game object returned by the engine.
    const [game, setGame] = useState<Game>(() => newGame(NAMES));
    const { players } = game.round;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Flip Game</Text>

            {game.pending && (
                <View style={styles.actionPanel}>
                    <Text style={styles.actionLabel}>
                        {players[game.pending.actor].name} drew
                    </Text>
                    <Text style={styles.actionTitle}>
                        {PENDING_INFO[game.pending.card].title}
                    </Text>
                    <Text style={styles.actionRule}>
                        {PENDING_INFO[game.pending.card].rule}
                    </Text>
                    <Text style={styles.actionInstruction}>
                        {PENDING_INFO[game.pending.card].instruction}
                    </Text>
                    <View style={styles.optionRow}>
                        {game.pending.options.map((i) => (
                            <Button
                                key={i}
                                label={`${PENDING_INFO[game.pending!.card].verb} ${players[i].name}${i === game.pending!.actor ? " (yourself)" : ""
                                    }`}
                                onPress={() => setGame(chooseTarget(game, i))}
                            />
                        ))}
                    </View>
                </View>
            )}

            {players.map((p, i) => (
                <View
                    key={p.id}
                    style={[styles.player, i === game.current && styles.currentPlayer]}
                >
                    <View style={styles.row}>
                        <Text style={styles.name}>
                            {p.name}
                            {i === game.dealer ? "  (dealer)" : ""}
                        </Text>
                        <Text style={styles.score}>Total: {p.totalScore}</Text>
                    </View>

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

            {game.phase === "playing" && !game.pending && (
                <View>
                    <Text style={styles.prompt}>
                        {players[game.current].name}, hit or stay?
                    </Text>
                    <View style={styles.row}>
                        <Button label="Hit" onPress={() => setGame(act(game, "hit"))} />
                        <Button
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
                <View>
                    <Text style={styles.prompt}>
                        Winner: {game.winners.map((w) => w.name).join(" & ")}
                    </Text>
                    <Button label="New game" onPress={() => setGame(newGame(NAMES))} />
                </View>
            )}
        </ScrollView>
    );
}

function Button(props: { label: string; onPress: () => void; disabled?: boolean }) {
    return (
        <Pressable
            onPress={props.onPress}
            disabled={props.disabled}
            style={[styles.button, props.disabled && styles.buttonDisabled]}
        >
            <Text style={styles.buttonText}>{props.label}</Text>
        </Pressable>
    );
}