import { StyleSheet } from "react-native";
import { Card } from "../game/types";

// Background color for each kind of card.
export const CARD_COLORS: Record<Card["kind"], string> = {
    number: "#F4E9C9",
    action: "#9ED0F5",
    modifier: "#F5B95E",
};

export const styles = StyleSheet.create({
    actionPanel: {
        borderWidth: 2,
        borderColor: "#2E6FD8",
        backgroundColor: "#EAF6FF",
        borderRadius: 12,
        padding: 14,
        gap: 6,
    },
    actionLabel: { fontSize: 14, color: "#444" },
    actionTitle: { fontSize: 26, fontWeight: "800", color: "#1B4F9C" },
    actionRule: { fontSize: 15, color: "#333" },
    actionInstruction: { fontSize: 16, fontWeight: "700", marginTop: 4 },
    container: { padding: 16, paddingTop: 64, gap: 12 },
    title: { fontSize: 28, fontWeight: "700" },
    row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
    optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
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
        flex: 1,
        minWidth: 100,
        backgroundColor: "#2E6FD8",
        padding: 14,
        borderRadius: 10,
        alignItems: "center",
    },
    buttonDisabled: { backgroundColor: "#A8B8D8" },
    buttonText: { color: "white", fontSize: 16, fontWeight: "600" },
});