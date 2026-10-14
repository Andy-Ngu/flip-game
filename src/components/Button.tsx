import { Pressable, Text } from "react-native";
import { styles } from "./Button.styles";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  fill?: boolean; // share a row's width with other buttons
};

export function Button({ label, onPress, disabled, fill }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, fill && styles.fill, disabled && styles.disabled]}
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}
