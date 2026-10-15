import { StyleSheet } from "react-native";

// Every color is set explicitly so the screen looks the same in light and dark mode.
const INK = "#111111";
const MUTED = "#555555";
const BLUE = "#2E6FD8";

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F7F7F9" },
  scroll: { flex: 1 },
  container: { padding: 16, paddingTop: 56, paddingBottom: 24, gap: 12 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerLinks: { flexDirection: "row", gap: 16 },
  title: { fontSize: 28, fontWeight: "700", color: INK },
  link: { color: BLUE, fontSize: 15, fontWeight: "600" },

  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },

  // Fixed bar at the bottom that always shows what you can do now.
  controls: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#DDDDDD",
    padding: 16,
    paddingBottom: 28,
    gap: 8,
  },
  prompt: { fontSize: 18, fontWeight: "600", color: INK },
  winner: { fontSize: 24, fontWeight: "800", color: INK },
  botBanner: { padding: 12, borderRadius: 10, backgroundColor: "#F0F0F0" },
  botBannerText: { fontSize: 16, fontWeight: "600", color: INK },
  note: { fontSize: 14, color: MUTED },

  // Question panel for Time Out, Draw Three and Shield.
  actionPanel: {
    borderWidth: 2,
    borderColor: BLUE,
    backgroundColor: "#EAF6FF",
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  actionLabel: { fontSize: 14, color: "#444444" },
  actionTitle: { fontSize: 26, fontWeight: "800", color: "#1B4F9C" },
  actionRule: { fontSize: 15, color: "#333333" },
  actionInstruction: { fontSize: 16, fontWeight: "700", marginTop: 4, color: INK },
});
