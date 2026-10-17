import { useMemo } from "react";
import { ScrollView, Share, useWindowDimensions, View } from "react-native";
import { paced } from "../../game/pace";
import { finalStandings, ordinal } from "../../game/results";
import { Game } from "../../game/session";
import { winRate } from "../../game/stats";
import { useApp, useUi } from "../AppContext";
import { useAnnounce } from "../useAnnounce";
import { Button } from "../ui/Button";
import { IconButton } from "../ui/IconButton";
import { Panel } from "../ui/Panel";
import { Screen } from "../ui/Screen";
import { T } from "../ui/T";
import { shareMessage } from "./shareText";
import { StandingRow } from "./StandingRow";
import { WinConfetti } from "./WinConfetti";
import { WinGlow } from "./WinGlow";
import { WinnerHero } from "./WinnerHero";

type Props = {
  game: Game;              // a finished game (phase "gameOver")
  me: number;              // your seat
  onAgain: () => void;     // play again: the same seats and the same target
  onHome: () => void;      // back to the title screen
};

// One number in the "your record" box.
function Stat({ label, value }: { label: string; value: string }) {
  const { colors } = useUi();
  return (
    <View style={{ flex: 1, alignItems: "center", gap: 4 }} accessible accessibilityLabel={`${label}: ${value}`}>
      <T size={24} weight="display" lh={1}>{value}</T>
      <T size={10.5} weight={900} spacing={1} lh={1} color={colors.textFaint}>{label}</T>
    </View>
  );
}

// The end of the game: who won, where everyone finished, how you did, and what to do next.
// Only when you won does the screen celebrate (a gold glow and one shower of confetti).
export function WinnerView({ game, me, onAgain, onHome }: Props) {
  const { colors, reduceMotion, reduceFlashes, speed } = useUi();
  const { settings } = useApp();
  const { width, height } = useWindowDimensions();

  const players = game.round.players;
  const standings = useMemo(() => finalStandings(players), [players]);
  const winnerId = game.winners[0]?.id;
  const winner = standings.find((s) => s.id === winnerId) ?? standings[0];
  const mine = standings.find((s) => s.seat === me);
  const won = winner !== undefined && mine !== undefined && winner.id === mine.id;

  const small = height < 720;
  const compact = small || standings.length >= 7;
  const stats = settings.stats;

  const result = won ? "You won!" : mine ? `You finished ${ordinal(mine.rank)} of ${standings.length}` : "";
  // What a screen reader says when the winner screen appears.
  useAnnounce(winner ? `${won ? "You win the game!" : `${winner.name} wins the game.`} ${winner.total} points. ${result}` : "");

  if (!winner) return null;

  function share() {
    const message = shareMessage({
      won,
      score: mine?.total ?? 0,
      rounds: game.roundNo,
      rank: mine?.rank ?? standings.length,
      players: standings.length,
    });
    // Sharing is a convenience: if the phone cannot open its share sheet, nothing else should break.
    try {
      Share.share({ message }).catch(() => {});
    } catch {
      // ignore
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
          <WinnerHero winner={winner} isMe={won} rounds={game.roundNo} celebrate={won} small={small} />

          <View style={{ gap: 6, marginTop: 18 }}>
            {standings.map((s, i) => (
              <StandingRow key={s.id} standing={s} isMe={s.seat === me} compact={compact} delay={paced(500 + i * 70, speed)} />
            ))}
          </View>

          {result ? (
            <View style={{ marginTop: 12 }} accessible accessibilityLabel={result}>
              <T size={13.5} weight={800} lh={1.35} align="center" color={won ? colors.gold : colors.textDim}>{result}</T>
            </View>
          ) : null}

          <Panel style={{ marginTop: 12, paddingVertical: 12, paddingHorizontal: 14, gap: 10 }}>
            <T size={11} weight={900} spacing={1.2} lh={1} color={colors.textFaint}>YOUR RECORD</T>
            <View style={{ flexDirection: "row" }}>
              <Stat label="GAMES" value={String(stats.games)} />
              <Stat label="WINS" value={String(stats.wins)} />
              <Stat label="WIN RATE" value={`${winRate(stats)}%`} />
            </View>
          </Panel>
        </ScrollView>

        <View style={{ gap: 8, paddingTop: 8 }}>
          <Button label="PLAY AGAIN" size="md" height={60} onPress={onAgain} />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button
              label="Share"
              icon="share"
              variant="ghost"
              size="sm"
              height={48}
              flex={1}
              onPress={share}
              accessibilityLabel={won ? "Share my win" : "Share my score"}
            />
            <IconButton icon="home" label="Back to the title screen" size={48} onPress={onHome} />
          </View>
        </View>
      </Screen>

      {won ? <WinGlow /> : null}
      {won && !reduceMotion && !reduceFlashes ? <WinConfetti width={width} /> : null}
    </View>
  );
}
