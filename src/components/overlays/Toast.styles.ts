import { StyleSheet } from "react-native";
import { Ui } from "../AppContext";

export const makeStyles = (_ui: Ui) =>
  StyleSheet.create({
    // The strip across the top of the table that the toast slides into. (Its place in front of or behind the rest
    // of the screen is the toast layer of TableScreen; see components/layers.ts.)
    strip: { position: "absolute", left: 16, right: 16 },
    pill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 14,
      borderWidth: 2,
      boxShadow: [{ offsetX: 0, offsetY: 8, blurRadius: 18, color: "rgba(0,0,0,0.45)" }],
    },
    words: { flex: 1, minWidth: 0, gap: 4 },
    disc: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  });
