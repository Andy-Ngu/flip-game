import { memo, useId } from "react";
import { View } from "react-native";
import Svg, { ClipPath, Circle, Defs, G, Rect } from "react-native-svg";
import { COLORS, ROBOT } from "../../game/profile";
import { Look } from "../../game/types";
import { useUi } from "../AppContext";
import { Ring } from "../ui/Ring";
import { ART } from "./art";

type Props = {
  look?: Look;
  size: number;
  // A ring around the character: how far a score is on the way to the target, or the turn clock.
  ring?: { progress: number; color: string; track?: string; duration?: number; linear?: boolean };
  online?: boolean;      // a small green dot, for people playing online
};

// A drawn character on a coloured disc. The characters are on a 64 by 64 canvas (see art.tsx).
export const Avatar = memo(function Avatar({ look, size, ring, online }: Props) {
  const { colors } = useUi();
  const id = "clip" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const stroke = ring ? Math.max(2, Math.round(size / 10)) : 0;
  const inset = ring ? stroke + 2 : 0;
  const inner = size - 2 * inset;
  const draw = ART[look?.character ?? ROBOT] ?? ART[ROBOT];
  const color = look?.color ?? COLORS[0];

  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {ring ? (
        <View style={{ position: "absolute", left: 0, top: 0 }}>
          <Ring size={size} stroke={stroke} progress={ring.progress} color={ring.color} track={ring.track ?? colors.border} duration={ring.duration} linear={ring.linear} />
        </View>
      ) : null}
      <View style={{ position: "absolute", left: inset, top: inset, width: inner, height: inner }}>
        <Svg width={inner} height={inner} viewBox="0 0 64 64">
          <Defs>
            <ClipPath id={id}>
              <Circle cx="32" cy="32" r="32" />
            </ClipPath>
          </Defs>
          <G clipPath={`url(#${id})`}>
            <Rect x="0" y="0" width="64" height="64" fill={color} />
            {draw()}
          </G>
        </Svg>
      </View>
      {online ? (
        <View
          style={{
            position: "absolute",
            right: -2,
            bottom: -2,
            width: Math.max(9, Math.round(size / 3)),
            height: Math.max(9, Math.round(size / 3)),
            borderRadius: 999,
            backgroundColor: colors.good,
            borderWidth: 2,
            borderColor: colors.surface,
          }}
        />
      ) : null}
    </View>
  );
});
