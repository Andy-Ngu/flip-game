import { StyleSheet } from "react-native";
import { Ui } from "../AppContext";
import { FILL } from "../fill";

// Room above and below the cards for the arc of the fan, the wobble and a lifted card.
export const HAND_PAD = 14;

export const makeStyles = (ui: Ui) =>
  StyleSheet.create({
    hand: { width: "100%" },
    empty: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
    slot: { position: "absolute", top: HAND_PAD, left: 0 },
    tilt: { position: "absolute", top: 0, left: 0 },
    layer: { position: "absolute", top: 0, left: 0, backfaceVisibility: "hidden" },
    shadow: { position: "absolute", top: 0, left: 0, backgroundColor: "#000000" },
    touch: { ...FILL },
    sheenClip: { ...FILL, overflow: "hidden" },
    sheen: { position: "absolute", top: -30, left: 0, width: 20, backgroundColor: "#FFFFFF" },
    ringed: { ...FILL, borderColor: ui.colors.danger },
    // "7 again!" sits on the lower edge of the card, never below it, so it cannot reach the bars under the hand.
    tag: {
      position: "absolute",
      left: -4,
      right: -4,
      bottom: 3,
      alignItems: "center",
    },
    tagBox: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      backgroundColor: ui.colors.danger,
    },
  });
