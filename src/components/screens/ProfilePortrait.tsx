import { useEffect, useRef } from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { paced } from "../../game/pace";
import { Profile, profileLook } from "../../game/profile";
import { useUi } from "../AppContext";
import { Avatar } from "../avatars/Avatar";
import { FILL } from "../fill";
import { hexAlpha } from "../overlays/glow";
import { Tap } from "../ui/Tap";

const CHARACTER = 112;   // the character
const RING = 128;        // the gold ring around it

type Props = {
  profile: Profile;
  onEdit?: () => void;   // when given, a pencil badge sits on the character (the Profile screen; not the first-time picker)
  editing?: boolean;     // the character picker is open
};

// A small pencil, drawn with lines on a 24 by 24 grid like the icons in ui/Icon.tsx.
function Pencil({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path
        d="M4 20 L5.2 14.8 L16 4 L20 8 L9.2 18.8 Z M13.4 6.6 L17.4 10.6"
        stroke={color}
        strokeWidth={2.2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Your character, big, inside a gold ring. When the character or the colour changes it gives a small
// bounce, so you can see that something happened.
export function ProfilePortrait({ profile, onEdit, editing }: Props) {
  const { colors, reduceMotion, reduceFlashes, speed } = useUi();
  const bounce = useSharedValue(1);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduceMotion) return;
    bounce.value = withSequence(withTiming(0.9, { duration: paced(70, speed) }), withSpring(1, { damping: 7, stiffness: 180 }));
  }, [profile.character, profile.color]);

  const bounceStyle = useAnimatedStyle(() => ({ transform: [{ scale: bounce.value }] }));

  // The soft glow round the ring is left out when the player asked for fewer flashes.
  const glow = reduceFlashes ? null : { boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 22, color: hexAlpha(colors.gold, 0.35) }] };

  return (
    <View style={{ width: RING, height: RING, alignItems: "center", justifyContent: "center" }}>
      <View
        pointerEvents="none"
        style={[FILL, { borderRadius: RING / 2, borderWidth: 3, borderColor: colors.gold }, glow]}
      />
      <Animated.View style={bounceStyle}>
        <Avatar look={profileLook(profile)} size={CHARACTER} />
      </Animated.View>
      {onEdit ? (
        // The badge sits on the lower right edge of the character. Its touch area is 48 by 48 and stays
        // inside the ring's box (a touch outside a parent's box is not delivered on Android).
        <View style={{ position: "absolute", right: 0, bottom: 0 }}>
          <Tap
            label={editing ? "Close the character picker" : "Change character and colour"}
            onPress={onEdit}
            style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: colors.gold,
                borderWidth: 3,
                borderColor: colors.bg,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Pencil color={colors.onGold} />
            </View>
          </Tap>
        </View>
      ) : null}
    </View>
  );
}
