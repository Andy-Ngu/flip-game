import { View } from "react-native";
import { useUi } from "../AppContext";
import { T } from "../ui/T";

type Props = {
  text: string;
  kind: "you" | "bot";   // YOU is gold, BOT is quiet grey-blue
};

// A little pill that goes next to a name: YOU marks your own line, BOT marks a computer player.
// (BOT sits on the raised panel colour, so its text stays readable in high contrast too.)
export function Tag({ text, kind }: Props) {
  const { colors } = useUi();
  const you = kind === "you";
  return (
    <View
      style={{
        paddingVertical: 3,
        paddingHorizontal: 9,
        borderRadius: 999,
        // "2A" at the end of a colour is a see-through version of it (about 16%).
        backgroundColor: you ? `${colors.gold}2A` : colors.surfaceRaised,
      }}
    >
      <T size={11} weight={900} spacing={0.8} lh={1.2} color={you ? colors.gold : colors.text}>{text}</T>
    </View>
  );
}
