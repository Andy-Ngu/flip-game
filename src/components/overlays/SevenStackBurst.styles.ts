import { StyleSheet } from "react-native";
import { Ui } from "../AppContext";
import { FILL } from "../fill";
import { hexAlpha } from "./glow";

export const makeStyles = (ui: Ui) =>
  StyleSheet.create({
    root: { ...FILL, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 16 },
    // The soft gold glow along the edges of the screen. It fades in once and stays.
    glow: {
      ...FILL,
      boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 70, spreadDistance: 14, color: hexAlpha(ui.colors.gold, 0.55), inset: true }],
    },
    // The calm version for Reduce motion / Reduce flashes: a plain gold frame, nothing soft or changing.
    frame: { ...FILL, borderWidth: 5, borderColor: ui.colors.gold },
    banner: { alignSelf: "stretch", alignItems: "center", gap: 8 },
    bonus: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 10,
      paddingVertical: 8,
      paddingHorizontal: 18,
      borderRadius: 999,
      borderWidth: 2,
      borderColor: ui.colors.gold,
      backgroundColor: ui.colors.surface,
    },
    note: {
      alignSelf: "stretch",
      alignItems: "center",
      gap: 8,
      paddingVertical: 16,
      paddingHorizontal: 18,
      borderRadius: 20,
      borderWidth: ui.colors.borderWidth + 0.5,
      borderColor: ui.colors.gold,
      backgroundColor: ui.colors.surface,
    },
    track: { alignSelf: "stretch", height: 8, borderRadius: 4, backgroundColor: ui.colors.bg, overflow: "hidden" },
    fill: { height: "100%", borderRadius: 4, backgroundColor: ui.colors.gold },
  });
