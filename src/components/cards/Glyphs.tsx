import { View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { T } from "../ui/T";

// The three drawn symbols of the action cards. Each is drawn from shapes, not text or an image,
// so it looks the same on every phone and stays sharp at every size.

// A shield with a tick. `width` is the width in px; it is a little taller than wide.
export function ShieldGlyph({ width, color, tick = true }: { width: number; color: string; tick?: boolean }) {
  return (
    <Svg width={width} height={(width * 64) / 54} viewBox="0 0 54 64">
      <Path
        d="M8 2.5 H46 A5.5 5.5 0 0 1 51.5 8 V36 A24.5 24.5 0 0 1 2.5 36 V8 A5.5 5.5 0 0 1 8 2.5 Z"
        stroke={color}
        strokeWidth={5}
        fill="none"
        strokeLinejoin="round"
      />
      {tick ? <Path d="M17.5 32 L25 39.5 L37.5 25" stroke={color} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
    </Svg>
  );
}

// A clock face for Time Out.
export function ClockGlyph({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Circle cx="32" cy="32" r="29.5" stroke={color} strokeWidth={5} fill="none" />
      <Path d="M32 15 V34.5 H47" stroke={color} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Three cards fanned out, the last one filled in with a 3, for Draw Three. `scale` 1 is 70 by 68 px.
export function ThreeGlyph({ scale, color, paper }: { scale: number; color: string; paper: string }) {
  const card = (left: number, top: number, rotate: number, filled: boolean) => (
    <View
      key={left}
      style={{
        position: "absolute",
        left: left * scale,
        top: top * scale,
        width: 32 * scale,
        height: 46 * scale,
        borderRadius: 5 * scale,
        borderWidth: Math.max(1.5, 4 * scale),
        borderColor: color,
        backgroundColor: filled ? color : paper,
        transform: [{ rotate: `${rotate}deg` }],
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {filled ? <T fixed size={22 * scale} weight="display" color={paper}>3</T> : null}
    </View>
  );
  return (
    <View style={{ width: 70 * scale, height: 68 * scale }}>
      {card(0, 10, -16, false)}
      {card(19, 4, 0, false)}
      {card(38, 10, 16, true)}
    </View>
  );
}
