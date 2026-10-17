import { ReactElement } from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { useUi } from "../AppContext";

// The small line icons used around the app, all drawn on the same 24 by 24 grid.
export type IconName =
  | "chevronLeft" | "chevronRight" | "menu" | "close" | "check" | "plus" | "minus"
  | "shield" | "clock" | "crown" | "signal" | "chat" | "smile" | "list" | "share"
  | "info" | "trophy" | "podium" | "trash" | "refresh" | "cards" | "bolt" | "person" | "home";

type Draw = (color: string, w: number) => ReactElement;

const line = (d: string): Draw => (color, w) => (
  <Path d={d} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />
);

const DRAW: Record<IconName, Draw> = {
  chevronLeft: line("M15 5 L8 12 L15 19"),
  chevronRight: line("M9 5 L16 12 L9 19"),
  menu: line("M4 7 H20 M4 12 H20 M4 17 H20"),
  close: line("M6 6 L18 18 M18 6 L6 18"),
  check: line("M5 12.5 L10 17.5 L19 7"),
  plus: line("M12 5 V19 M5 12 H19"),
  minus: line("M5 12 H19"),
  shield: line("M6.5 3.5 H17.5 A2 2 0 0 1 19.5 5.5 V12 A7.5 7.5 0 0 1 4.5 12 V5.5 A2 2 0 0 1 6.5 3.5 Z"),
  clock: (color, w) => (
    <>
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={w} fill="none" />
      <Path d="M12 6.5 V12.5 H16.5" stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  crown: (color) => <Path d="M3 18.5 L4.5 7 L9.5 12 L12 5 L14.5 12 L19.5 7 L21 18.5 Z" fill={color} stroke={color} strokeWidth={1.5} strokeLinejoin="round" />,
  signal: (color) => (
    <>
      <Rect x="3.5" y="14" width="4.5" height="6" rx="1.2" fill={color} />
      <Rect x="9.75" y="9.5" width="4.5" height="10.5" rx="1.2" fill={color} />
      <Rect x="16" y="4" width="4.5" height="16" rx="1.2" fill={color} />
    </>
  ),
  chat: line("M5 4.5 H19 A2 2 0 0 1 21 6.5 V14.5 A2 2 0 0 1 19 16.5 H11 L6.5 20.5 V16.5 H5 A2 2 0 0 1 3 14.5 V6.5 A2 2 0 0 1 5 4.5 Z"),
  smile: (color, w) => (
    <>
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={w} fill="none" />
      <Circle cx="9" cy="10" r="1.2" fill={color} />
      <Circle cx="15" cy="10" r="1.2" fill={color} />
      <Path d="M8 14 Q12 18 16 14" stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" />
    </>
  ),
  list: (color, w) => (
    <>
      <Path d="M9 6 H20 M9 12 H20 M9 18 H20" stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" />
      <Circle cx="4.5" cy="6" r="1.3" fill={color} />
      <Circle cx="4.5" cy="12" r="1.3" fill={color} />
      <Circle cx="4.5" cy="18" r="1.3" fill={color} />
    </>
  ),
  share: line("M12 15 V4 M8 8 L12 4 L16 8 M5 12 V19.5 H19 V12"),
  info: (color, w) => (
    <>
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={w} fill="none" />
      <Path d="M12 11 V16.5" stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" />
      <Circle cx="12" cy="7.8" r="1.3" fill={color} />
    </>
  ),
  trophy: line("M7 4 H17 V10 A5 5 0 0 1 7 10 Z M7 6 H4 V8 A3.2 3.2 0 0 0 7.5 11.2 M17 6 H20 V8 A3.2 3.2 0 0 1 16.5 11.2 M12 15 V18.5 M8 20.5 H16"),
  // A leaderboard: three steps with the tallest in the middle (1st), 2nd on its left and 3rd on its right.
  podium: line("M3.5 20.5 V11 H9 V5 H15 V14 H20.5 V20.5 Z M9 20.5 V11 M15 20.5 V14"),
  trash: line("M4.5 7 H19.5 M9 7 V4.5 H15 V7 M6.5 7 L7.5 20 H16.5 L17.5 7 M10 11 V16 M14 11 V16"),
  refresh: line("M19.5 12 A7.5 7.5 0 1 1 17.3 6.7 M19.5 4 V9 H14.5"),
  cards: line("M8 3.5 H15 A1.5 1.5 0 0 1 16.5 5 V15 A1.5 1.5 0 0 1 15 16.5 H8 A1.5 1.5 0 0 1 6.5 15 V5 A1.5 1.5 0 0 1 8 3.5 Z M9.5 19.5 H17 A1.5 1.5 0 0 0 18.5 18 V8"),
  bolt: (color) => <Path d="M13.5 2.5 L5.5 13.5 H11 L10 21.5 L18.5 10 H13 Z" fill={color} stroke={color} strokeWidth={1} strokeLinejoin="round" />,
  home: line("M3.5 11 L12 3.5 L20.5 11 M5.5 9.5 V20.5 H10 V14.5 H14 V20.5 H18.5 V9.5"),
  person: (color, w) => (
    <>
      <Circle cx="12" cy="8" r="3.8" stroke={color} strokeWidth={w} fill="none" />
      <Path d="M4.5 20 A7.5 7.5 0 0 1 19.5 20" stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" />
    </>
  ),
};

type Props = { name: IconName; size?: number; color?: string; stroke?: number };

export function Icon({ name, size = 24, color, stroke = 2.4 }: Props) {
  const { colors } = useUi();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {DRAW[name](color ?? colors.text, stroke)}
    </Svg>
  );
}
