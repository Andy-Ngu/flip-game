import { View } from "react-native";
import { Player } from "../../game/types";
import { CardHelpSheet } from "../help/CardHelpSheet";
import { HowToPlayScreen } from "../screens/HowToPlayScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { AwayDialog } from "../sheets/AwayDialog";
import { ChatSheet } from "../sheets/ChatSheet";
import { EmoteSheet } from "../sheets/EmoteSheet";
import { LeaveDialog } from "../sheets/LeaveDialog";
import { MenuSheet } from "../sheets/MenuSheet";
import { StandingsSheet } from "../sheets/StandingsSheet";
import { FILL } from "../fill";
import { TableOverlays } from "./useTableOverlays";

type Props = {
  overlays: TableOverlays;
  players: Player[];
  target: number;
  me: number;
  covered: boolean;                    // the computer is playing your seat (you were away)
  lastSentAt: number | null;           // when you last sent a chat message or emote
  onSendChat: (kind: "phrase" | "emote", id: string) => void;
  onImBack: () => void;
  onExit: () => void;
};

// Everything you open from the table's buttons: the menu, standings, chat, emotes, a card's
// explanation, the settings and rules screens, and the two dialogs (leaving, and "you were away").
export function TableMenus({ overlays: o, players, target, me, covered, lastSentAt, onSendChat, onImBack, onExit }: Props) {
  const closeSheet = () => o.setSheet(null);
  return (
    <>
      {o.sheet === "menu" ? (
        <MenuSheet
          online={false}
          onClose={closeSheet}
          onSettings={() => {
            o.setSheet(null);
            o.setScreen("settings");
          }}
          onRules={() => {
            o.setSheet(null);
            o.setScreen("rules");
          }}
          onLeave={() => {
            o.setSheet(null);
            o.setLeaving(true);
          }}
        />
      ) : null}
      {o.sheet === "standings" ? <StandingsSheet players={players} target={target} me={me} onClose={closeSheet} /> : null}
      {o.sheet === "chat" ? (
        <ChatSheet
          lastSentAt={lastSentAt}
          onSay={(id) => {
            onSendChat("phrase", id);
            closeSheet();
          }}
          onClose={closeSheet}
        />
      ) : null}
      {o.sheet === "emotes" ? (
        <EmoteSheet
          lastSentAt={lastSentAt}
          onSend={(id) => {
            onSendChat("emote", id);
            closeSheet();
          }}
          onClose={closeSheet}
        />
      ) : null}
      {o.heldCard ? <CardHelpSheet card={o.heldCard} onClose={() => o.setHeldCard(null)} /> : null}

      {/* Settings and the rules open over everything, like their own screens. */}
      {o.screen === "settings" ? (
        <View style={FILL}>
          <SettingsScreen onBack={() => o.setScreen(null)} />
        </View>
      ) : null}
      {o.screen === "rules" ? (
        <View style={FILL}>
          <HowToPlayScreen onBack={() => o.setScreen(null)} />
        </View>
      ) : null}

      {covered ? <AwayDialog onBack={onImBack} /> : null}
      {o.leaving ? <LeaveDialog online={false} onKeepPlaying={() => o.setLeaving(false)} onLeave={onExit} /> : null}
    </>
  );
}
