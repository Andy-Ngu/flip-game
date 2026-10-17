import { ReactNode } from "react";
import { View } from "react-native";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import { useUi } from "../AppContext";
import { FILL } from "../fill";
import { useBackButton } from "../useBackButton";
import { Dim } from "./Dim";
import { T } from "./T";

type Props = {
  title: string;
  body?: string;
  tone?: "gold" | "danger" | "blue";   // the colour of the title
  onClose?: () => void;                // tapping outside it, or Android's back button. Leave out for a dialog that has to be answered
  children?: ReactNode;                // the buttons, one under another
};

// A centred box over a dimmed screen: a short title, a few words, and the buttons.
// (The leave dialogs, "You were away" and so on.)
export function Dialog({ title, body, tone = "gold", onClose, children }: Props) {
  const { colors, reduceMotion } = useUi();
  // While a dialog is open the back button belongs to it. It closes the dialog, or does nothing if it has to be answered.
  useBackButton(true, () => {
    onClose?.();
    return true;
  });
  const titleColor = tone === "danger" ? colors.danger : tone === "blue" ? colors.blue : colors.gold;

  return (
    <Dim onPress={onClose}>
      <View pointerEvents="box-none" style={[FILL, { justifyContent: "center", paddingHorizontal: 24 }]}>
        <Animated.View
          entering={reduceMotion ? FadeIn.duration(120) : ZoomIn.duration(180)}
          accessibilityViewIsModal
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: colors.borderWidth,
            borderRadius: 16,
            paddingVertical: 22,
            paddingHorizontal: 20,
            gap: 14,
            boxShadow: [{ offsetX: 0, offsetY: 20, blurRadius: 50, color: "rgba(0,0,0,0.55)" }],
          }}
        >
          <View accessibilityRole="header">
            <T size={26} weight="display" spacing={1.5} lh={1.05} color={titleColor}>{title}</T>
          </View>
          {body ? <T size={14.5} weight={700} lh={1.45} color={colors.textDim}>{body}</T> : null}
          {children ? <View style={{ gap: 10, marginTop: 4 }}>{children}</View> : null}
        </Animated.View>
      </View>
    </Dim>
  );
}
