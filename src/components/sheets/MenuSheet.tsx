import { ReactNode } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn, SlideInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUi } from "../AppContext";
import { FILL } from "../fill";
import { Dim } from "../ui/Dim";
import { Icon } from "../ui/Icon";
import { IconButton } from "../ui/IconButton";
import { T } from "../ui/T";
import { Tap } from "../ui/Tap";
import { useBackButton } from "../useBackButton";
import { ExitGlyph, SettingsGlyph } from "./MenuGlyphs";

type Props = {
  online: boolean;           // an online table says "Leave table", a game against computers says "Leave game"
  onClose: () => void;       // the close button, a tap on the dark area, or Android's back button
  onSettings: () => void;    // each of these only reports the tap: the table closes the menu itself
  onRules: () => void;
  onLeave: () => void;       // opens the "Leave this game?" question, it does not leave by itself
};

type RowProps = { label: string; picture: ReactNode; onPress: () => void; divider?: boolean };

// One line of the menu: a picture, the name, and an arrow. At least 56 high so it is easy to hit.
function Row({ label, picture, onPress, divider }: RowProps) {
  const { colors } = useUi();
  return (
    <Tap label={label} onPress={onPress}>
      {(pressed) => (
        <View
          style={{
            minHeight: 56,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingVertical: 6,
            borderBottomWidth: divider ? 1 : 0,
            borderBottomColor: colors.border,
            opacity: pressed ? 0.7 : 1,
          }}
        >
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
            {picture}
          </View>
          <View style={{ flex: 1 }}>
            <T size={16} weight={800} lh={1.15} numberOfLines={2}>{label}</T>
          </View>
          <Icon name="chevronRight" size={18} color={colors.textFaint} />
        </View>
      )}
    </Tap>
  );
}

// The menu behind the hamburger button: a drawer that slides in from the right over a dimmed table.
// Settings and Rules are the two ordinary lines; the red Leave button sits alone at the bottom.
export function MenuSheet({ online, onClose, onSettings, onRules, onLeave }: Props) {
  const { colors, reduceMotion } = useUi();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  useBackButton(true, () => {
    onClose();
    return true;
  });

  const leaveLabel = online ? "Leave table" : "Leave game";
  // Up to 320 wide, never more than about three quarters of a narrow screen. A notch on the right
  // (a phone held sideways) is added on top so nothing is hidden under it.
  const width = Math.min(320, Math.round(windowWidth * 0.78)) + insets.right;

  return (
    <Dim onPress={onClose} strength={0.6} label="Close menu">
      <View pointerEvents="box-none" style={[FILL, { flexDirection: "row", justifyContent: "flex-end" }]}>
        <Animated.View
          entering={reduceMotion ? FadeIn.duration(120) : SlideInRight.duration(220)}
          accessibilityViewIsModal
          style={{
            width,
            backgroundColor: colors.surface,
            borderLeftWidth: colors.borderWidth,
            borderLeftColor: colors.border,
            paddingTop: insets.top + 14,
            paddingBottom: insets.bottom + 16,
            paddingLeft: 16,
            paddingRight: 16 + insets.right,
            boxShadow: [{ offsetX: -10, offsetY: 0, blurRadius: 24, color: "rgba(0,0,0,0.4)" }],
          }}
        >
          <View style={{ minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <View style={{ flex: 1 }} accessibilityRole="header">
              <T size={24} weight="display" spacing={2} lh={1} numberOfLines={1}>MENU</T>
            </View>
            <IconButton icon="close" label="Close menu" onPress={onClose} />
          </View>

          {/* The lines scroll if a small screen or big text leaves too little room, so Leave is never pushed off. */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 10 }} showsVerticalScrollIndicator={false}>
            <Row label="Settings" picture={<SettingsGlyph size={22} color={colors.gold} />} onPress={onSettings} divider />
            <Row label="Rules" picture={<Icon name="info" size={22} color={colors.gold} />} onPress={onRules} />
          </ScrollView>

          <View style={{ marginTop: 12 }}>
            <Tap label={leaveLabel} hint="Asks you to confirm first" onPress={onLeave}>
              {(pressed) => (
                <View
                  style={{
                    minHeight: 56,
                    borderRadius: 14,
                    borderWidth: colors.borderWidth,
                    borderColor: colors.danger,
                    backgroundColor: colors.dangerBg,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    paddingHorizontal: 12,
                    opacity: pressed ? 0.75 : 1,
                  }}
                >
                  <ExitGlyph size={22} color={colors.danger} />
                  <T size={15} weight={900} lh={1.1} color={colors.danger} align="center">{leaveLabel}</T>
                </View>
              )}
            </Tap>
          </View>
        </Animated.View>
      </View>
    </Dim>
  );
}
