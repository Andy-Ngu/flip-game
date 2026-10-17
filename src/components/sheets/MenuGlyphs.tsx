import Svg, { Circle, Path } from "react-native-svg";

// Two small pictures the menu needs that the shared icon set (ui/Icon) does not have. They are drawn on
// the same 24 by 24 grid, with the same round line style, so they sit next to the shared icons without
// looking different.
type Props = { size?: number; color: string; stroke?: number };

// Settings: three sliders, each a line with a round knob on it in a different place.
export function SettingsGlyph({ size = 24, color, stroke = 2.4 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {/* The lines stop where each knob starts, so the knobs look hollow. */}
      <Path d="M4 6 H6.5 M11.5 6 H20 M4 12 H12.5 M17.5 12 H20 M4 18 H7.5 M12.5 18 H20" stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" />
      <Circle cx="9" cy="6" r="2.5" stroke={color} strokeWidth={stroke} fill="none" />
      <Circle cx="15" cy="12" r="2.5" stroke={color} strokeWidth={stroke} fill="none" />
      <Circle cx="10" cy="18" r="2.5" stroke={color} strokeWidth={stroke} fill="none" />
    </Svg>
  );
}

// Leave: a doorway with an arrow going out of it.
export function ExitGlyph({ size = 24, color, stroke = 2.4 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path
        d="M10 4 H5.5 A1.5 1.5 0 0 0 4 5.5 V18.5 A1.5 1.5 0 0 0 5.5 20 H10 M14 8 L19 12 L14 16 M19 12 H9"
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
