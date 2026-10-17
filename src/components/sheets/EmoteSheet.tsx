import { ScrollView, useWindowDimensions, View } from "react-native";
import { Emote, EMOTES } from "../../game/chat";
import { useUi } from "../AppContext";
import { Sheet } from "../ui/Sheet";
import { T } from "../ui/T";
import { Tap } from "../ui/Tap";
import { CooldownNote } from "./CooldownNote";
import { EmoteFace } from "./EmoteFace";
import { useCooldown } from "./useCooldown";

type Props = {
  lastSentAt: number | null;         // when you last sent a message or emote (Date.now()), or null if you have not yet
  onSend: (emoteId: string) => void; // a sticker was tapped. The table closes the sheet and shows it
  onClose: () => void;
};

const COLUMNS = 4;

// The list cut into rows of four, for the grid.
function inRows(list: readonly Emote[]): Emote[][] {
  const rows: Emote[][] = [];
  for (let i = 0; i < list.length; i += COLUMNS) rows.push(list.slice(i, i + COLUMNS));
  return rows;
}

// The Emotes sheet: eight face stickers in a grid. It works like the Quick chat sheet: one message every
// few seconds, counted down here, and every sticker is switched off until then.
export function EmoteSheet({ lastSentAt, onSend, onClose }: Props) {
  const { colors } = useUi();
  const { height } = useWindowDimensions();
  const left = useCooldown(lastSentAt);
  const waiting = left > 0;
  const seconds = Math.ceil(left / 1000);
  const hint = waiting ? `Wait ${seconds} ${seconds === 1 ? "second" : "seconds"}` : undefined;

  return (
    <Sheet title="EMOTES" onClose={onClose}>
      <ScrollView style={{ maxHeight: Math.round(height * 0.7) }} showsVerticalScrollIndicator={false}>
        <T size={12} weight={700} lh={1.3} color={colors.textFaint}>
          Tap a sticker. It pops out of your avatar and shows on every screen.
        </T>

        <View style={{ gap: 8, marginTop: 10 }}>
          {inRows(EMOTES).map((row, r) => (
            <View key={r} style={{ flexDirection: "row", gap: 8 }}>
              {row.map((emote) => (
                <Tap
                  key={emote.id}
                  label={`${emote.name} emote`}
                  hint={hint}
                  disabled={waiting}
                  haptic="light"
                  onPress={() => onSend(emote.id)}
                  style={{ flex: 1 }}
                >
                  <View
                    style={{
                      flex: 1,
                      minHeight: 90,
                      borderRadius: 14,
                      borderWidth: colors.borderWidth,
                      borderColor: colors.border,
                      backgroundColor: colors.bg,
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 7,
                      paddingVertical: 8,
                      opacity: waiting ? 0.4 : 1,
                    }}
                  >
                    <EmoteFace id={emote.id} size={44} />
                    <T size={11.5} weight={800} lh={1} align="center" numberOfLines={1}>{emote.name}</T>
                  </View>
                </Tap>
              ))}
            </View>
          ))}
        </View>

        {/* Below the grid, so the stickers do not jump when it goes away and they come back on. It is only a bar: there is
            no writing under the stickers (a screen reader is told how long to wait). */}
        {waiting ? <CooldownNote key={lastSentAt} left={left} /> : null}
      </ScrollView>
    </Sheet>
  );
}
