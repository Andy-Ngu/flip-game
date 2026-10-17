import { View } from "react-native";
import { profileLook, profileName } from "../../game/profile";
import { useApp, useUi } from "../AppContext";
import { Avatar } from "../avatars/Avatar";
import { T } from "../ui/T";
import { Tap } from "../ui/Tap";

type Props = { onPress: () => void };

// The small "who am I" chip in the corner of the title screen: your character, your name and how many
// games you have played. Tapping it opens your profile. It is not shown until a profile exists.
export function TitleScreenProfile({ onPress }: Props) {
  const { settings } = useApp();
  const { colors } = useUi();
  const profile = settings.profile;
  if (!profile) return null;

  const { games, wins } = settings.stats;
  const record = games === 0 ? "Your profile" : `${games} ${games === 1 ? "game" : "games"} · ${wins} ${wins === 1 ? "win" : "wins"}`;
  const name = profileName(profile);

  return (
    <View style={{ alignItems: "flex-start" }}>
      <Tap label={`Profile: ${name}. ${record}`} hint="Opens your profile" onPress={onPress}>
        {(pressed) => (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              padding: 4,
              paddingRight: 16,
              borderRadius: 999,
              borderWidth: colors.borderWidth,
              borderColor: colors.border,
              backgroundColor: pressed ? colors.surfaceRaised : colors.surface,
            }}
          >
            <View style={{ borderRadius: 999, borderWidth: 2.5, borderColor: colors.gold }}>
              <Avatar look={profileLook(profile)} size={40} />
            </View>
            <View style={{ flexShrink: 1, gap: 3 }}>
              <T size={16} weight="display" lh={1} numberOfLines={1}>{name}</T>
              <T size={11.5} weight={800} lh={1} color={colors.textFaint} numberOfLines={1}>{record}</T>
            </View>
          </View>
        )}
      </Tap>
    </View>
  );
}
