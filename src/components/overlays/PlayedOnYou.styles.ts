import { StyleSheet } from "react-native";
import { Ui } from "../AppContext";
import { FILL } from "../fill";

export const makeStyles = (ui: Ui) =>
  StyleSheet.create({
    // Fills the screen and puts the panel in the middle. Touches pass straight through (only the panel
    // itself can be tapped, to carry on).
    overlay: { ...FILL, alignItems: "center", justifyContent: "center" },
    sized: { maxWidth: "94%" },
    panel: {
      minWidth: 264,
      paddingTop: 14,
      paddingBottom: 16,
      paddingHorizontal: 22,
      alignItems: "center",
      gap: 10,
      boxShadow: [{ offsetX: 0, offsetY: 8, blurRadius: 20, color: "rgba(0,0,0,0.5)" }],
    },
    words: { alignItems: "center", gap: 4, alignSelf: "stretch" },
    // A ring that grows out of the card when it lands.
    ring: {
      position: "absolute",
      top: -4,
      left: -4,
      right: -4,
      bottom: -4,
      borderRadius: 12,
      borderWidth: 3,
      borderColor: ui.colors.danger,
    },
  });
