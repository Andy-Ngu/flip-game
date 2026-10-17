import { ReactNode } from "react";
import { View } from "react-native";
import { useUi } from "../AppContext";
import { T } from "../ui/T";

type Props = {
  label: string;          // the name of the setting
  desc: string;           // one line saying what it does
  control?: ReactNode;    // on the right of the text: a Switch
  below?: ReactNode;      // under the text, full width: a row of choices, a preview
};

// One setting: its name and what it does, with the control either beside the text or under it.
// A row is never shorter than 64 px, so it is easy to hit with a thumb.
export function SettingsScreenRow({ label, desc, control, below }: Props) {
  const { colors } = useUi();
  return (
    <View style={{ paddingVertical: 12, paddingHorizontal: 14, gap: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 40 }}>
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <T size={15} weight={800} lh={1.1}>{label}</T>
          <T size={12} weight={700} lh={1.3} color={colors.textDim}>{desc}</T>
        </View>
        {control}
      </View>
      {below}
    </View>
  );
}
