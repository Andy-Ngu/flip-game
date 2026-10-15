import { Pressable, Text } from "react-native";
import { styles } from "./Button.styles";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  fill?: boolean;                     // share a row's width with other buttons
  variant?: "primary" | "secondary";  // primary (gold) is the main action; default is primary
};

export function Button({ label, onPress, disabled, fill, variant = "primary" }: Props) {
  const primary = variant === "primary";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }: { pressed: boolean }) => [
        styles.button,
        primary ? styles.primary : styles.secondary,
        fill && styles.fill,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text allowFontScaling={false} style={[styles.text, primary ? styles.textPrimary : styles.textSecondary]}>
        {label}
      </Text>
    </Pressable>
  );
}
