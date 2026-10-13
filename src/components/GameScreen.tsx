import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { describeCard } from "../game/describe";
import { scoreHand } from "../game/scoring";
import { act, Game, newGame, nextRound } from "../game/session";
import { Card } from "../game/types";

const NAMES = ["Ann", "Ben", "Cat"];

const CARD_COLORS: Record<Card["kind"], string> = {
    number: "#F4E9C9",
    action: "#9ED0F5",
    modifier: "#F5B95E",
};

const STATUS_LABEL = {
    playing: "",
    stayed: "Stayed",
    busted: "BUST",
    frozen: "Frozen",
} as const;

export default function GameScreen() {
    // The whole game lives in one piece of state. Each button press replaces it
    // with a new Game object returned by the engine.
    const [game, setGame] = useState<Game>(() => newGame(NAMES));
    const { players } = game.round;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Flip Game</Text>

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

            {game.phase === "playing" && (
                <View>
                    <Text style={styles.prompt}>
                        {players[game.current].name}, hit or stay?
                    </Text>
                    <View style={styles.row}>
                        <Button label="Hit" onPress={() => setGame(act(game, "hit"))} />
                        <Button
                            label="Stay"
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

const styles = StyleSheet.create({
    container: { padding: 16, paddingTop: 64, gap: 12 },
    title: { fontSize: 28, fontWeight: "700" },
    row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
    player: { borderWidth: 2, borderColor: "#D0D0D0", borderRadius: 12, padding: 12, gap: 8 },
    currentPlayer: { borderColor: "#2E6FD8", backgroundColor: "#EAF1FD" },
    name: { fontSize: 18, fontWeight: "600" },
    score: { fontSize: 16 },
    hand: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    empty: { color: "#888" },
    card: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
    cardText: { fontSize: 14, fontWeight: "500" },
    status: { fontSize: 14, color: "#444" },
    bust: { color: "#C0262D", fontWeight: "700" },
    prompt: { fontSize: 18, fontWeight: "600", marginVertical: 8 },
    button: {
        flex: 1, backgroundColor: "#2E6FD8", padding: 14,
        borderRadius: 10, alignItems: "center",
    },
    buttonDisabled: { backgroundColor: "#A8B8D8" },
    buttonText: { color: "white", fontSize: 16, fontWeight: "600" },
});