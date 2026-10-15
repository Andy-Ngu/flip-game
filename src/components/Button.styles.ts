import { StyleSheet } from "react-native";
import { theme } from "./theme";

export const styles = StyleSheet.create({
  button: {
    minWidth: 100,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    alignSelf: "stretch",
    borderWidth: 2,
  },
  // The main action on a screen.
  primary: { backgroundColor: theme.gold, borderColor: theme.gold },
  // Everything else.
  secondary: { backgroundColor: theme.surfaceRaised, borderColor: theme.border },
  // Use inside a row so several buttons share the width.
  fill: { flex: 1 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.4 },

  text: { fontSize: 16, fontWeight: "800", letterSpacing: 0.5 },
  textPrimary: { color: theme.onGold },
  textSecondary: { color: theme.text },
});
