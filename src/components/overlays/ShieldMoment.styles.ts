import { StyleSheet } from "react-native";
import { Ui } from "../AppContext";
import { FILL } from "../fill";

export const makeStyles = (ui: Ui) =>
  StyleSheet.create({
    // Fills the screen and puts the panel in the middle. Touches pass straight through to the table
    // (only the panel itself can be tapped, to close it).
    overlay: { ...FILL, alignItems: "center", justifyContent: "center" },
    sized: { maxWidth: "94%" },
    panel: {
      minWidth: 236,
      paddingVertical: 14,
      paddingHorizontal: 22,
      alignItems: "center",
      gap: 10,
      boxShadow: [{ offsetX: 0, offsetY: 8, blurRadius: 20, color: "rgba(0,0,0,0.5)" }],
    },
    row: { flexDirection: "row", gap: 16, alignItems: "center" },
    words: { alignItems: "center", gap: 3 },
    // A gold ring that grows out of the Shield when the duplicate hits it.
    ring: {
      position: "absolute",
      top: -4,
      left: -4,
      right: -4,
      bottom: -4,
      borderRadius: 12,
      borderWidth: 3,
      borderColor: ui.colors.gold,
    },
    // The blocked duplicate gets darker, with a red cross stamped over it.
    veil: { ...FILL, borderRadius: 8, backgroundColor: "#000000" },
    cross: { ...FILL, alignItems: "center", justifyContent: "center" },
    crossBar: { position: "absolute", width: 50, height: 7, borderRadius: 4, backgroundColor: ui.colors.danger },
  });
