import { AUTO_STAY_LIMIT } from "../../game/clock";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";

type Props = {
  onBack: () => void;   // "I'm back": the player takes the seat again
};

// Shown when the turn clock ran out several turns in a row and a bot has been playing the seat. It has to
// be answered: there is no close button, a tap outside does nothing and Android's back button does nothing.
export function AwayDialog({ onBack }: Props) {
  return (
    <Dialog
      title="YOU WERE AWAY"
      body={`You stayed automatically ${AUTO_STAY_LIMIT} turns in a row, so a bot is playing your seat. Tap I'm back to take it again on your next turn.`}
    >
      <Button label="I'M BACK" variant="gold" size="md" height={56} onPress={onBack} />
    </Dialog>
  );
}
