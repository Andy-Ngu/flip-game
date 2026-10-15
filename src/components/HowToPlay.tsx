import { ReactNode, useEffect } from "react";
import { BackHandler, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Card } from "../game/types";
import { Button } from "./Button";
import { CardFace } from "./CardFace";
import { styles } from "./HowToPlay.styles";

const num = (value: number): Card => ({ kind: "number", value });
const action = (a: "timeOut" | "drawThree" | "shield"): Card => ({ kind: "action", action: a });

export function HowToPlay({ onClose }: { onClose: () => void }) {
  // The phone's back button closes this page instead of leaving the app.
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [onClose]);

  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.overlay}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <Text style={styles.title}>How to play</Text>
        <Text style={styles.intro}>
          Push your luck. Draw cards to build up points, but draw a number you already have and you lose
          the whole round. First to 200 points wins.
        </Text>

        <Section heading="YOUR TURN">
          <Text style={styles.body}>
            <Text style={styles.bold}>Hit</Text> to draw a card from the deck, or{" "}
            <Text style={styles.bold}>Stay</Text> to lock in your points and sit out the rest of the round.
            You need at least one card to stay.
          </Text>
          <Text style={styles.body}>
            <Text style={styles.bold}>Bust:</Text> draw a number you already hold and your hand scores 0 this
            round.
          </Text>
        </Section>

        <Section heading="NUMBER CARDS">
          <View style={styles.cards}>
            <CardFace card={num(2)} />
            <CardFace card={num(7)} />
            <CardFace card={num(12)} />
          </View>
          <Text style={styles.body}>
            Numbers run from 0 to 12 and are worth their face value. There are as many copies of each number
            as its value, so the high numbers are the most common and the likeliest to bust you. Cool green
            cards are safe. Hot red cards are risky.
          </Text>
          <Text style={styles.dim}>6 and 9 are underlined so you can tell them apart.</Text>
        </Section>

        <Section heading="SEVEN STACK">
          <Text style={styles.body}>
            Collect <Text style={styles.bold}>seven different numbers</Text> and you earn{" "}
            <Text style={styles.bold}>+15 points</Text>. The round ends on the spot, and everyone still in
            keeps their points.
          </Text>
        </Section>

        <Section heading="ACTION CARDS">
          <CardRow card={action("timeOut")} name="Time Out">
            You choose a player. They bank their points and are out for the rest of the round.
          </CardRow>
          <CardRow card={action("drawThree")} name="Draw Three">
            You choose a player. They must draw the next three cards, and they bust if any is a duplicate.
          </CardRow>
          <CardRow card={action("shield")} name="Shield">
            Protects you from one duplicate, then is used up. You can hold one at a time. A spare goes to
            another player who has none.
          </CardRow>
        </Section>

        <Section heading="BONUS CARDS">
          <CardRow card={{ kind: "modifier", bonus: 4, multiplier: 1 }} name="Bonus +2 to +10">
            Adds that many points to your score.
          </CardRow>
          <CardRow card={{ kind: "modifier", bonus: 0, multiplier: 2 }} name="Double Score">
            Doubles the total of your number cards. It does not double bonuses.
          </CardRow>
        </Section>

        <Section heading="SCORING A HAND">
          <Text style={styles.body}>Add your number cards, double them if you have Double Score, then add bonuses and the Seven Stack.</Text>
          <View style={styles.sum}>
            <Text style={styles.sumLine}>Numbers 5 + 7 + 3 = 15</Text>
            <Text style={styles.sumLine}>Double Score = 30</Text>
            <Text style={styles.sumLine}>Bonus +4 = 34</Text>
            <Text style={styles.sumTotal}>Round score: 34</Text>
          </View>
        </Section>

        <Section heading="WINNING">
          <Text style={styles.body}>
            When a round ends and anyone has <Text style={styles.bold}>200 or more</Text> points in total, the
            highest total wins. If the top players are tied, everyone plays another round.
          </Text>
        </Section>
      </ScrollView>

      <View style={styles.buttons}>
        <Button label="Got it" onPress={onClose} />
      </View>
    </Animated.View>
  );
}

function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text allowFontScaling={false} style={styles.heading}>{heading}</Text>
      {children}
    </View>
  );
}

function CardRow({ card, name, children }: { card: Card; name: string; children: ReactNode }) {
  return (
    <View style={styles.cardRow}>
      <CardFace card={card} />
      <View style={styles.cardText}>
        <Text style={styles.cardName}>{name}</Text>
        <Text style={styles.dim}>{children}</Text>
      </View>
    </View>
  );
}
