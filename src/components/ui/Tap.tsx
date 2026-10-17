import { ReactNode, useRef } from "react";
import { AccessibilityRole, Pressable, StyleProp, ViewStyle } from "react-native";
import { Feel } from "../../game/events";
import { useUi } from "../AppContext";
import { playFeel } from "../haptics";

// After a tap, a button waits this long before it accepts another (the "Ignore double taps" setting).
export const DOUBLE_TAP_MS = 500;

export type TapProps = {
  onPress?: () => void;
  disabled?: boolean;
  label?: string;                  // what a screen reader says
  hint?: string;
  role?: AccessibilityRole;        // "button" unless it is a switch, a tab and so on
  selected?: boolean;
  checked?: boolean;
  haptic?: Feel | null;            // the buzz on a tap: a faint tick unless given. null for none
  hitSlop?: number;
  style?: StyleProp<ViewStyle> | ((pressed: boolean) => StyleProp<ViewStyle>);
  children?: ReactNode | ((pressed: boolean) => ReactNode);
};

// Everything the player can tap goes through here: it ignores a second tap that comes too soon
// (when that setting is on), gives the tap a light buzz (when vibration is on), and tells screen
// readers what the thing is.
export function Tap({ onPress, disabled, label, hint, role = "button", selected, checked, haptic, hitSlop, style, children }: TapProps) {
  const ui = useUi();
  const last = useRef(0);

  function press() {
    if (disabled) return;
    const now = Date.now();
    if (ui.ignoreDoubleTaps && now - last.current < DOUBLE_TAP_MS) return;
    last.current = now;
    if (haptic !== null && ui.vibration) playFeel(haptic ?? "tick");
    onPress?.();
  }

  return (
    <Pressable
      onPress={press}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: !!disabled, ...(selected !== undefined ? { selected } : {}), ...(checked !== undefined ? { checked } : {}) }}
      style={typeof style === "function" ? ({ pressed }) => style(pressed) : style}
    >
      {typeof children === "function" ? ({ pressed }) => children(pressed) : children}
    </Pressable>
  );
}
