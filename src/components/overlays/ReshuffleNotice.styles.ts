import { StyleSheet } from "react-native";
import { Ui } from "../AppContext";
import { FILL } from "../fill";
import { hexAlpha } from "./glow";

export const makeStyles = (ui: Ui) =>
  StyleSheet.create({
    // Puts the popup in the middle of the dimmed table. Touches fall through to the dark area behind it (tap to skip).
    centre: { ...FILL, justifyContent: "center", paddingHorizontal: 30 },
    panel: {
      borderRadius: 22,
      borderWidth: ui.colors.borderWidth + 0.5,
      borderColor: ui.colors.gold,
      backgroundColor: ui.colors.surface,
      paddingTop: 22,
      paddingHorizontal: 20,
      paddingBottom: 20,
      alignItems: "center",
      gap: 14,
      // The gold glow is left out when Reduce flashes is on.
      boxShadow: ui.reduceFlashes
        ? [{ offsetX: 0, offsetY: 14, blurRadius: 28, color: "rgba(0,0,0,0.5)" }]
        : [
            { offsetX: 0, offsetY: 0, blurRadius: 30, color: hexAlpha(ui.colors.gold, 0.3) },
            { offsetX: 0, offsetY: 14, blurRadius: 28, color: "rgba(0,0,0,0.5)" },
          ],
    },
    // The stack of cards. Each card sits on top of the one before, a pixel and a half higher.
    fan: { width: 200, height: 84 },
    card: {
      position: "absolute",
      left: 78,
      width: 44,
      height: 62,
      borderRadius: 7,
      borderWidth: 2.5,
      borderColor: ui.colors.gold,
      backgroundColor: ui.colors.bg,
      alignItems: "center",
      justifyContent: "center",
      boxShadow: [{ offsetX: 0, offsetY: 6, blurRadius: 12, color: "rgba(0,0,0,0.4)" }],
    },
    words: { alignItems: "center", gap: 6 },
  });
