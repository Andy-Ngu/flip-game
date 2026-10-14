import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import {
    addSeat, defaultSeats, MAX_SEATS, MIN_SEATS, removeSeat, Seat, SeatKind,
    seatProblem, toSetup, updateSeat,
} from "../game/seats";
import { PlayerSetup } from "../game/session";
import { Button } from "./Button";
import { styles } from "./SetupScreen.styles";

const KINDS: { kind: SeatKind; label: string }[] = [
  { kind: "human", label: "Human" },
  { kind: "easy", label: "Easy" },
  { kind: "medium", label: "Medium" },
  { kind: "hard", label: "Hard" },
];

export default function SetupScreen({ onStart }: { onStart: (seats: PlayerSetup[]) => void }) {
  const [seats, setSeats] = useState<Seat[]>(defaultSeats);
  const problem = seatProblem(seats);
  const canRemove = seats.length > MIN_SEATS;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Set up your game</Text>
      <Text style={styles.help}>
        Choose Human for each person playing on this phone, or Easy, Medium or Hard for a
        computer player. Flip 7 needs at least {MIN_SEATS} players.
      </Text>

      {seats.map((seat, i) => (
        <View key={i} style={styles.seat}>
          <View style={styles.seatHeader}>
            <TextInput
              value={seat.name}
              onChangeText={(name: string) => setSeats(updateSeat(seats, i, { name }))}
              style={styles.nameInput}
              maxLength={14}
              placeholder="Name"
              placeholderTextColor="#888888"
            />
            <Pressable
              onPress={() => setSeats(removeSeat(seats, i))}
              disabled={!canRemove}
              style={[styles.remove, !canRemove && styles.removeDisabled]}
              accessibilityLabel={`Remove ${seat.name}`}
            >
              <Text style={styles.removeText}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.kindRow}>
            {KINDS.map((k) => {
              const selected = seat.kind === k.kind;
              return (
                <Pressable
                  key={k.kind}
                  onPress={() => setSeats(updateSeat(seats, i, { kind: k.kind }))}
                  style={[styles.kind, selected && styles.kindSelected]}
                >
                  <Text style={[styles.kindText, selected && styles.kindTextSelected]}>
                    {k.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      <Button
        label={`Add player (${seats.length}/${MAX_SEATS})`}
        onPress={() => setSeats(addSeat(seats))}
        disabled={seats.length >= MAX_SEATS}
      />

      {problem && <Text style={styles.problem}>{problem}</Text>}

      <Button
        label="Start game"
        onPress={() => onStart(toSetup(seats))}
        disabled={problem !== null}
      />
    </ScrollView>
  );
}
