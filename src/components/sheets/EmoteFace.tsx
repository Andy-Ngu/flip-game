import { memo, ReactElement } from "react";
import Svg, { Circle, Ellipse, G, Path, Rect } from "react-native-svg";
import { EMOTES, EmoteId } from "../../game/chat";

// The eight emote stickers: a round face with a different feeling on it. They are drawn on a 44 by 44
// grid (the size in the mockups) so they stay sharp at any size. The colours belong to the artwork
// (a yellow face with dark features, an angry red one), so they do not follow the app's palette.
const INK = "#1B2440";
const YELLOW = "#F2C14E";
const RED = "#FF7A85";

const stroke = { stroke: INK, strokeWidth: 3, strokeLinecap: "round", fill: "none" } as const;

// Two upright oval eyes, used by most of the faces.
const Eyes = () => (
  <>
    <Ellipse cx={11.5} cy={14.5} rx={2.5} ry={3.5} fill={INK} />
    <Ellipse cx={27.5} cy={14.5} rx={2.5} ry={3.5} fill={INK} />
  </>
);

// What is drawn on each face, positions measured inside the face's dark outline.
const FEATURES: Record<EmoteId, () => ReactElement> = {
  happy: () => (
    <>
      <Eyes />
      <Path d="M12.5 20.5 A7 7 0 0 0 26.5 20.5" {...stroke} />
    </>
  ),
  wow: () => (
    <>
      <Eyes />
      <Ellipse cx={19.5} cy={27.5} rx={3} ry={4} {...stroke} />
    </>
  ),
  oops: () => (
    <>
      <Eyes />
      <Rect x={12} y={26} width={15} height={3} rx={1.5} fill={INK} />
    </>
  ),
  sad: () => (
    <>
      <Eyes />
      <Path d="M13 33 A6.5 6.5 0 0 1 26 33" {...stroke} />
    </>
  ),
  // Sunglasses: two dark lenses with a shine, a bridge, and arms that reach the edge of the face, over a big smile.
  cool: () => (
    <>
      <Path d="M3.5 10 H17.5 V14.5 A5.5 5.5 0 0 1 12 20 H9 A5.5 5.5 0 0 1 3.5 14.5 Z" fill={INK} />
      <Path d="M21.5 10 H35.5 V14.5 A5.5 5.5 0 0 1 30 20 H27 A5.5 5.5 0 0 1 21.5 14.5 Z" fill={INK} />
      <Path d="M17.5 11.5 H21.5" stroke={INK} strokeWidth={2.5} strokeLinecap="round" fill="none" />
      <Path d="M3.5 11 L0.8 9.5 M35.5 11 L38.2 9.5" stroke={INK} strokeWidth={2.5} strokeLinecap="round" fill="none" />
      <Path d="M6.5 12.5 H10 M24.5 12.5 H28" stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={1.8} strokeLinecap="round" fill="none" />
      <Path d="M11.5 26 A8 8 0 0 0 27.5 26" {...stroke} />
    </>
  ),
  haha: () => (
    <>
      <Path d="M9.5 15 A2.5 2.5 0 0 1 14.5 15" {...stroke} />
      <Path d="M25.5 15 A2.5 2.5 0 0 1 30.5 15" {...stroke} />
      <Path d="M11 21 H28 V23.5 A8.5 8.5 0 0 1 11 23.5 Z" fill={INK} />
    </>
  ),
  grr: () => (
    <>
      <Rect x={6} y={9} width={11} height={3} rx={1.5} fill={INK} transform="rotate(20 11.5 10.5)" />
      <Rect x={22} y={9} width={11} height={3} rx={1.5} fill={INK} transform="rotate(-20 27.5 10.5)" />
      <Ellipse cx={11.5} cy={17.5} rx={2.5} ry={3.5} fill={INK} />
      <Ellipse cx={27.5} cy={17.5} rx={2.5} ry={3.5} fill={INK} />
      <Rect x={12} y={26} width={15} height={3} rx={1.5} fill={INK} />
    </>
  ),
  meh: () => (
    <>
      <Eyes />
      <Rect x={13} y={26} width={13} height={3} rx={1.5} fill={INK} transform="rotate(-12 19.5 27.5)" />
    </>
  ),
};

type Props = {
  id: string;        // one of the emote ids in game/chat.ts; anything else is drawn as a blank face
  size?: number;     // width and height in px (44 in the mockups)
};

export const EmoteFace = memo(function EmoteFace({ id, size = 44 }: Props) {
  // Only ids from the list have a drawing (checking the list also keeps odd ids such as "toString" out).
  const draw = EMOTES.some((e) => e.id === id) ? FEATURES[id as EmoteId] : null;
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {/* The face. The dark outline is drawn inside the 44 by 44 square, so nothing is cut off. */}
      <Circle cx={22} cy={22} r={20.75} fill={id === "grr" ? RED : YELLOW} stroke={INK} strokeWidth={2.5} />
      <G transform="translate(2.5 2.5)">{draw ? draw() : null}</G>
    </Svg>
  );
});
