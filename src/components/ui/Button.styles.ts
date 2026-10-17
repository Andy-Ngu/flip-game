import { StyleSheet } from "react-native";
import { Ui } from "../AppContext";

export type ButtonSize = "lg" | "md" | "sm";
export type ButtonVariant = "gold" | "blue" | "ghost" | "danger";

// lg is the HIT and STAY buttons, md the big buttons on other screens, sm the small ones in a row.
// `edge` is the thickness of the darker lower edge that makes a button look raised.
export const SIZES: Record<ButtonSize, { height: number; edge: number; radius: number; label: number; spacing: number; sub: number }> = {
  lg: { height: 68, edge: 5, radius: 18, label: 30, spacing: 2, sub: 11 },
  md: { height: 54, edge: 4, radius: 16, label: 22, spacing: 1.5, sub: 11 },
  sm: { height: 44, edge: 0, radius: 12, label: 13, spacing: 0, sub: 0 },
};

export const makeStyles = (_ui: Ui) =>
  StyleSheet.create({
    wrap: { alignSelf: "stretch" },
    // The darker edge sits behind the face and shows along its lower rim.
    base: { position: "absolute", left: 0, right: 0, bottom: 0 },
    face: { alignItems: "center", justifyContent: "center", paddingHorizontal: 12, paddingVertical: 4 },
    inline: { flexDirection: "row", alignItems: "center", gap: 8 },
    center: { alignItems: "center", gap: 1 },
  });
