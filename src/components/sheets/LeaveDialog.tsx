import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";

type Props = {
  online: boolean;           // an online table keeps the seat for a few minutes; a game against computers just ends
  onKeepPlaying: () => void; // also what a tap outside the box, or Android's back button, does: the safe answer
  onLeave: () => void;
};

// The exact words are fixed (they are in the approved Dialogs board).
const COPY = {
  online: {
    title: "LEAVE THIS TABLE?",
    body: "A bot takes your seat and keeps playing. You can come back to it for 5 minutes. After that, the bot keeps the seat.",
    leave: "Leave table",
  },
  offline: {
    title: "LEAVE THIS GAME?",
    body: "This game ends and does not count toward your stats.",
    leave: "Leave game",
  },
} as const;

// The question after "Leave game" or "Leave table" in the menu. Keep playing is the big gold button;
// leaving is the small red outline underneath, so it cannot be hit by accident.
export function LeaveDialog({ online, onKeepPlaying, onLeave }: Props) {
  const copy = online ? COPY.online : COPY.offline;
  return (
    <Dialog title={copy.title} body={copy.body} onClose={onKeepPlaying}>
      <Button label="KEEP PLAYING" variant="gold" size="md" height={56} onPress={onKeepPlaying} />
      <Button label={copy.leave} variant="danger" size="sm" height={50} onPress={onLeave} />
    </Dialog>
  );
}
