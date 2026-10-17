import { useMemo, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { nearTarget, oneCardAway } from "../../game/moments";
import { bustOdds } from "../../game/odds";
import { startRows, turnPosition } from "../../game/results";
import { TableSetup } from "../../game/seats";
import { scoreHand } from "../../game/scoring";
import { actorOf, Game, PlayerSetup } from "../../game/session";
import { canStay, stageInfo, StageInfo } from "../../game/stageInfo";
import { BOTTOM_GAP, SIDE, tableMetrics, TOP_BAR } from "../../game/tableMetrics";
import { useUi } from "../AppContext";
import { LAYER } from "../layers";
import { CardHelpToast } from "../help/CardHelpToast";
import { TipsOverlay } from "../help/TipsOverlay";
import { PlayedOnYou } from "../overlays/PlayedOnYou";
import { ReshuffleNotice } from "../overlays/ReshuffleNotice";
import { RoundStart } from "../overlays/RoundStart";
import { SevenStackBurst } from "../overlays/SevenStackBurst";
import { ShieldMoment } from "../overlays/ShieldMoment";
import { Toast } from "../overlays/Toast";
import { TurnGlow } from "../overlays/TurnGlow";
import { RoundResultsView } from "../results/RoundResultsView";
import { WinnerView } from "../results/WinnerView";
import { ChatBubble } from "../sheets/ChatBubble";
import { Backdrop } from "../ui/Backdrop";
import { Layer } from "../ui/Layer";
import { FILL } from "../fill";
import { useBackButton } from "../useBackButton";
import { DeckTile } from "./DeckTile";
import { Dock } from "./Dock";
import { OpponentGrid } from "./OpponentGrid";
import { OpponentTile } from "./OpponentTile";
import { Stage } from "./Stage";
import { TableMenus } from "./TableMenus";
import { TargetPrompt } from "./TargetPrompt";
import { TopRow } from "./TopRow";
import { ME, useTable } from "./useTable";
import { useTableOverlays } from "./useTableOverlays";

type Props = {
  setup: PlayerSetup[];   // who is playing (you in seat 0, then the computer players)
  table: TableSetup;      // the choices made on the Create table screen
  onExit: () => void;     // leave for the title screen
};

// What the stage says about you. While the cards are still being dealt, or while a computer is
// playing your seat, it is just "YOUR HAND" instead of "YOUR TURN".
function stageFor(game: Game, playing: boolean, covered: boolean): StageInfo {
  const info = stageInfo(game, ME);
  if (info.mood === "turn" && (!playing || covered)) {
    return { mood: "waiting", title: "YOUR HAND", sub: "", short: "", canAct: false, mustChoose: false };
  }
  return info;
}

// The table: the other players, your own stage, the buttons, and everything that can appear on top of
// them (the round start board, popups, menus, results). The game itself is run by useTable.
export function TableScreen({ setup, table, onExit }: Props) {
  const ui = useUi();
  const { colors } = ui;
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();

  // What is open on top of the table. While any of it is open the game waits.
  const overlays = useTableOverlays();
  const t = useTable({ setup, table, paused: overlays.paused, blocked: overlays.blocked });
  const { game } = t;
  const players = game.round.players;
  const you = players[ME];

  // ---------- how big everything is ----------
  // The size of the screen is measured once it is on the phone; until then the window's size is used.
  const [measured, setMeasured] = useState<{ w: number; h: number } | null>(null);
  const width = measured?.w ?? window.width;
  const height = measured?.h ?? window.height;
  const contentW = width - insets.left - insets.right;
  const contentH = height - insets.top - insets.bottom - BOTTOM_GAP;   // (a small gap is left under HIT and STAY)
  const metrics = useMemo(
    () => tableMetrics({ width: contentW, height: contentH, opponents: players.length - 1, scale: ui.scale }),
    [contentW, contentH, players.length, ui.scale]
  );

  // ---------- what the table says right now ----------
  const actor = actorOf(game);
  const covered = game.cover[ME] === true;
  const info = stageFor(game, t.flow === "play" || t.flow === "ending", covered);
  const odds = ui.showBustOdds && you.status === "playing" && game.phase === "playing" ? bustOdds(you, game.round.deck) : null;
  const showBadges = t.badges && (t.flow === "deal" || t.flow === "play");
  const orderBadge = (seat: number) => (showBadges ? turnPosition(seat, game.dealer, players.length) : null);

  // Choosing a player for a Time Out, Draw Three or spare Shield: the stage turns into a prompt and the
  // players you can pick light up.
  const pending = game.pending;
  const picking = t.flow === "play" && pending !== null && pending.actor === ME;
  const pickFor = (seat: number): "can" | "no" | null => (!picking || !pending ? null : pending.options.includes(seat) ? "can" : "no");

  // A quick chat message or emote, shown beside its sender's name for a few seconds.
  const bubbleFor = (seat: number) => (!ui.hideChat && t.bubbles[seat] ? <ChatBubble message={t.bubbles[seat]} mine={seat === ME} /> : undefined);

  // Something is on top of the table (a board, a menu, a dialog, the tips). Screen readers skip the table
  // underneath, as they would a modal on iPhone (on Android a plain overlay needs this said outright).
  // A menu or dialog is open in front of everything (the results board included, which screen readers skip too).
  const menuOpen = overlays.sheet !== null || overlays.leaving || overlays.screen !== null || overlays.heldCard !== null;
  const covering = t.flow === "splash" || t.flow === "results" || t.flow === "over" || t.tipsOpen || covered || menuOpen;

  // ---------- the tiles ----------
  const cells = players.flatMap((p, seat) =>
    seat === ME
      ? []
      : [
          <OpponentTile
            key={p.id}
            player={p}
            target={game.target}
            metrics={metrics}
            acting={t.flow === "play" && actor === seat}
            crown={t.leader === seat}
            near={nearTarget(p, game.target)}
            dealt={t.dealt(seat)}
            badge={orderBadge(seat)}
            pick={pickFor(seat)}
            onPick={picking ? () => t.pick(seat) : undefined}
            bubble={bubbleFor(seat)}
          />,
        ]
  );
  cells.push(
    <View key="deck" style={{ opacity: picking ? 0.4 : 1 }}>
      <DeckTile left={game.round.deck.drawPile.length} metrics={metrics} />
    </View>
  );

  // The Android back button: close whatever is open. On the table itself it asks whether to leave,
  // unless the game is already over and recorded, when there is nothing to ask.
  useBackButton(true, () => {
    if (overlays.closeTop()) return true;
    if (t.flow === "over") onExit();
    else overlays.setLeaving(true);
    return true;
  });

  // Where things are on the screen, for the first-game tips to point at.
  const tilesTop = insets.top + TOP_BAR + metrics.gap;
  const tilesBottom = tilesTop + metrics.tilesH;
  const dockTop = height - insets.bottom - BOTTOM_GAP - metrics.dockH;
  const anchors = { tilesTop, tilesBottom, stageTop: tilesBottom + metrics.gap, stageBottom: dockTop - metrics.gap, dockTop };

  // Everything drawn on top of the table is a layer of its own, in the order of LAYER (components/layers.ts):
  // the table at the back, then the glow, the small messages, the big moments, the messages that explain the
  // game, the scenes (round board, results, winner) and, in front of all, the menus. A layer is a view that
  // is not flattened away (collapsable={false}) and has a zIndex, so a number set deeper down (the cards in
  // your hand) can only reorder things inside its own layer.
  return (
    <View collapsable={false} style={{ flex: 1, backgroundColor: colors.bg }} onLayout={(e) => setMeasured({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Backdrop />

      <View
        collapsable={false}
        importantForAccessibility={covering ? "no-hide-descendants" : "auto"}
        accessibilityElementsHidden={covering}
        style={{
          flex: 1,
          zIndex: LAYER.table,
          paddingTop: insets.top,
          paddingBottom: insets.bottom + BOTTOM_GAP,
          paddingLeft: insets.left + SIDE,
          paddingRight: insets.right + SIDE,
          gap: metrics.gap,
        }}
      >
        <TopRow
          round={game.roundNo}
          target={game.target}
          onMenu={() => overlays.setSheet("menu")}
          onChat={() => overlays.setSheet("chat")}
          onEmotes={() => overlays.setSheet("emotes")}
          onStandings={() => overlays.setSheet("standings")}
        />
        <OpponentGrid cells={cells} metrics={metrics} />
        <View style={{ flex: 1 }}>
          {picking && pending ? (
            <TargetPrompt
              card={pending.card}
              player={you}
              target={game.target}
              clock={t.clock}
              canPickSelf={pending.options.includes(ME)}
              onPickSelf={() => t.pick(ME)}
              metrics={metrics}
            />
          ) : (
            <Stage
              player={you}
              target={game.target}
              info={info}
              clock={t.clock}
              metrics={metrics}
              odds={odds}
              covered={covered}
              onImBack={t.comeBack}
              dealt={t.dealt(ME)}
              onHoldCard={overlays.setHeldCard}
              badge={orderBadge(ME)}
              bubble={bubbleFor(ME)}
              oneAway={oneCardAway(you)}
              count={t.count}
              arriveGap={t.arriveGap}
            />
          )}
        </View>
        <Dock
          metrics={metrics}
          canAct={t.flow === "play" && info.canAct && !covered && !t.tipsOpen}
          canStay={canStay(game, ME)}
          stayPoints={scoreHand(you)}
          onHit={t.hit}
          onStay={t.stay}
        />
      </View>

      {/* ----- the glow when your turn starts: decoration, never takes a touch ----- */}
      <Layer level={LAYER.glow}>
        <TurnGlow pulse={t.alertKey} />
      </Layer>

      {/* ----- small messages: "Gus played Time Out on you". They close when tapped. ----- */}
      <Layer level={LAYER.toast}>
        <Toast toast={t.toast} top={insets.top + TOP_BAR + 6} onClose={t.closeToast} inert={picking} />
      </Layer>

      {/* ----- big moments: a Seven Stack, Shield blocked it, the deck being shuffled, a card played on you ----- */}
      <Layer level={LAYER.moment}>
        {t.sevenSeat !== null && (t.flow === "play" || t.flow === "ending") ? (
          <SevenStackBurst name={players[t.sevenSeat].name} isMe={t.sevenSeat === ME} />
        ) : null}
        {t.reshuffle ? <ReshuffleNotice onDone={t.dismissReshuffle} /> : null}
        {t.played && t.flow === "play" ? <PlayedOnYou key={t.played.id} view={t.played.view} onDone={t.carryOn} /> : null}
        {t.shield ? (
          <ShieldMoment key={t.shield.id} name={players[t.shield.seat].name} isMe={t.shield.seat === ME} duplicate={t.shield.duplicate} onDone={t.dismissShield} inert={picking} />
        ) : null}
      </Layer>

      {/* ----- messages that explain the game: nothing but a scene or a menu may cover them ----- */}
      <Layer level={LAYER.help}>
        {t.help && !picking && !t.tipsOpen ? (
          <CardHelpToast
            key={t.help.key}
            help={t.help.key}
            card={t.help.card ?? undefined}
            bottom={insets.bottom + BOTTOM_GAP + metrics.dockH + metrics.gap}
            onDismiss={t.dismissHelp}
          />
        ) : null}
        {t.tipsOpen ? <TipsOverlay width={contentW} anchors={anchors} metrics={metrics} onDone={t.finishTips} /> : null}
      </Layer>

      {/* ----- the board at the start of a round, the results, the winner ----- */}
      <Layer level={LAYER.scene} hidden={menuOpen}>
        {t.flow === "splash" ? (
          <RoundStart rows={startRows(players, game.dealer)} me={ME} round={game.roundNo} target={game.target} paused={overlays.paused} onDone={t.splashDone} />
        ) : null}
        {t.flow === "results" ? (
          <View style={FILL}>
            <RoundResultsView game={game} me={ME} onNext={t.proceed} onMenu={() => overlays.setSheet("menu")} paused={overlays.paused} />
          </View>
        ) : null}
        {t.flow === "over" ? (
          <View style={FILL}>
            <WinnerView game={game} me={ME} onAgain={t.again} onHome={onExit} />
          </View>
        ) : null}
      </Layer>

      {/* ----- menus, full screens and dialogs: what the player opened is in front of everything ----- */}
      <Layer level={LAYER.menu}>
        <TableMenus
          overlays={overlays}
          players={players}
          target={game.target}
          me={ME}
          covered={covered}
          lastSentAt={t.lastSentAt}
          onSendChat={t.sendChat}
          onImBack={t.comeBack}
          onExit={onExit}
        />
      </Layer>
    </View>
  );
}
