import { StyleSheet } from "react-native";
import { CARD_H, CARD_W } from "../game/handLayout";

export const styles = StyleSheet.create({
  // Room above and below the cards for the arc, the wobble and the lift.
  hand: { height: CARD_H + 30, width: "100%" },
  slot: { position: "absolute", top: 14, left: 0, width: CARD_W, height: CARD_H },
  tilt: { position: "absolute", top: 0, left: 0, width: CARD_W, height: CARD_H },
  layer: { position: "absolute", top: 0, left: 0, backfaceVisibility: "hidden" },
  shadow: {
    position: "absolute",
    top: 0,
    left: 0,
    width: CARD_W,
    height: CARD_H,
    borderRadius: 8,
    backgroundColor: "#000000",
  },
  touch: { ...StyleSheet.absoluteFillObject },
  dead: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    backgroundColor: "#1A1A1A",
  },
  // The sheen is a tall pale stripe, clipped to the card's rounded corners.
  sheenClip: { ...StyleSheet.absoluteFillObject, borderRadius: 8, overflow: "hidden" },
  sheen: {
    position: "absolute",
    top: -30,
    left: 0,
    width: 20,
    height: CARD_H + 60,
    backgroundColor: "#FFFFFF",
  },
  empty: { color: "#666666" },
});
