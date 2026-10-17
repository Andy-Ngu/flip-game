import { ScrollView, useWindowDimensions, View } from "react-native";
import { BUBBLE_MS, Phrase, PHRASES } from "../../game/chat";
import { useUi } from "../AppContext";
import { Sheet } from "../ui/Sheet";
import { T } from "../ui/T";
import { Tap } from "../ui/Tap";
import { CooldownNote } from "./CooldownNote";
import { useCooldown } from "./useCooldown";

type Props = {
  lastSentAt: number | null;       // when you last sent a message or emote (Date.now()), or null if you have not yet
  onSay: (phraseId: string) => void; // a phrase was tapped. The table closes the sheet and shows the bubble
  onClose: () => void;
};

const COLUMNS = 3;

// The list cut into rows of three, for the grid.
function inRows(list: readonly Phrase[]): Phrase[][] {
  const rows: Phrase[][] = [];
  for (let i = 0; i < list.length; i += COLUMNS) rows.push(list.slice(i, i + COLUMNS));
  return rows;
}

// The Quick chat sheet: fifteen ready-made phrases in a grid. Tapping one sends it. After you have sent
// something every button is switched off for a few seconds (with a note saying how long), so nobody can
// flood the table; the sheet counts the seconds down by itself.
export function ChatSheet({ lastSentAt, onSay, onClose }: Props) {
  const { colors } = useUi();
  const { height } = useWindowDimensions();
  const left = useCooldown(lastSentAt);
  const waiting = left > 0;
  const seconds = Math.ceil(left / 1000);
  const hint = waiting ? `Wait ${seconds} ${seconds === 1 ? "second" : "seconds"}` : undefined;

  return (
    <Sheet title="QUICK CHAT" onClose={onClose}>
      <ScrollView style={{ maxHeight: Math.round(height * 0.7) }} showsVerticalScrollIndicator={false}>
        <T size={12} weight={700} lh={1.3} color={colors.textFaint}>
          {`Tap a phrase to send it. Everyone sees it beside your name for ${BUBBLE_MS / 1000} seconds.`}
        </T>

        <View style={{ gap: 8, marginTop: 10 }}>
          {inRows(PHRASES).map((row, r) => (
            <View key={r} style={{ flexDirection: "row", gap: 8 }}>
              {row.map((phrase) => {
                const gold = phrase.highlight;
                return (
                  <Tap
                    key={phrase.id}
                    label={phrase.text}
                    hint={hint}
                    disabled={waiting}
                    haptic="light"
                    onPress={() => onSay(phrase.id)}
                    style={{ flex: 1 }}
                  >
                    <View
                      style={{
                        flex: 1,
                        minHeight: 48,
                        borderRadius: 12,
                        borderWidth: colors.borderWidth,
                        borderColor: gold ? colors.gold : colors.border,
                        backgroundColor: gold ? colors.gold : colors.bg,
                        alignItems: "center",
                        justifyContent: "center",
                        paddingHorizontal: 6,
                        paddingVertical: 4,
                        opacity: waiting ? 0.4 : 1,
                      }}
                    >
                      <T size={14} weight={800} lh={1.1} align="center" color={gold ? colors.onGold : colors.text} numberOfLines={2}>
                        {phrase.text}
                      </T>
                    </View>
                  </Tap>
                );
              })}
            </View>
          ))}
        </View>

        {/* Below the grid, so the buttons do not jump when it goes away and they come back on. */}
        {waiting ? <CooldownNote key={lastSentAt} left={left} /> : null}
      </ScrollView>
    </Sheet>
  );
}
