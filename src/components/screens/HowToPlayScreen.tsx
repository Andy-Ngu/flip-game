import { useRef, useState } from "react";
import { AccessibilityInfo, LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView, View } from "react-native";
import { useStyles, useUi } from "../AppContext";
import { Button } from "../ui/Button";
import { Panel } from "../ui/Panel";
import { Screen } from "../ui/Screen";
import { T } from "../ui/T";
import { TopBar } from "../ui/TopBar";
import { HowToPlayPicture } from "./HowToPlayCards";
import { PAGES } from "./HowToPlayPages";
import { makeStyles } from "./HowToPlayScreen.styles";

type Props = {
  onBack: () => void;   // the back arrow, "Close" on the first page, and "GOT IT" on the last
};

// How to play: three pages, each with a few steps drawn with real cards.
// You can swipe between the pages, or use the buttons at the bottom (the buttons are there for
// people who use a screen reader or find swiping hard).
export function HowToPlayScreen({ onBack }: Props) {
  const { colors, reduceMotion } = useUi();
  const styles = useStyles(makeStyles);
  const pager = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);   // how wide one page is; known once the screen has been laid out
  const [page, setPage] = useState(0);
  const last = PAGES.length - 1;

  // Go to a page with the buttons: scroll there, and tell screen readers where we are.
  function show(wanted: number) {
    const to = Math.max(0, Math.min(last, wanted));
    setPage(to);
    pager.current?.scrollTo({ x: to * width, animated: !reduceMotion });
    AccessibilityInfo.announceForAccessibility(`${PAGES[to].head}. Page ${to + 1} of ${PAGES.length}`);
  }

  // A swipe has come to rest: work out which page it stopped on.
  function settled(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (width === 0) return;
    const at = Math.max(0, Math.min(last, Math.round(e.nativeEvent.contentOffset.x / width)));
    if (at === page) return;
    setPage(at);
    AccessibilityInfo.announceForAccessibility(`${PAGES[at].head}. Page ${at + 1} of ${PAGES.length}`);
  }

  return (
    <Screen padding={0}>
      <TopBar
        title="HOW TO PLAY"
        titleSize={18}
        onBack={onBack}
        backLabel="Close how to play"
        inset={16}
        right={<T size={13} weight={900} color={colors.textFaint}>{`${page + 1} of ${PAGES.length}`}</T>}
      />

      <View style={styles.pager} onLayout={(e: LayoutChangeEvent) => setWidth(Math.floor(e.nativeEvent.layout.width))}>
        {width > 0 ? (
          <ScrollView
            ref={pager}
            horizontal
            pagingEnabled
            bounces={false}
            overScrollMode="never"
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={settled}
          >
            {PAGES.map((p, i) => (
              // Only the page you are looking at is visible to a screen reader.
              <View
                key={p.head}
                style={{ width }}
                accessibilityElementsHidden={i !== page}
                importantForAccessibility={i === page ? "auto" : "no-hide-descendants"}
              >
                {/* Each page scrolls up and down by itself, for big text sizes and small phones. */}
                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} contentContainerStyle={styles.pageContent}>
                  <View accessibilityRole="header">
                    <T size={30} weight="display" spacing={1} lh={1.05} color={colors.gold}>{p.head}</T>
                  </View>
                  <T size={15} weight={700} lh={1.4} color={colors.textDim}>{p.lead}</T>

                  <View style={styles.steps}>
                    {p.steps.map((s) => (
                      <Panel key={s.title} style={styles.step}>
                        {/* The whole step is read out as one: its title, then its words. */}
                        <View accessible accessibilityLabel={`${s.title}. ${s.text}`} style={styles.stepRow}>
                          <HowToPlayPicture cards={s.cards} />
                          <View style={styles.stepText}>
                            <T size={16} weight={900} lh={1.1}>{s.title}</T>
                            <T size={13} weight={700} lh={1.35} color={colors.textDim}>{s.text}</T>
                          </View>
                        </View>
                      </Panel>
                    ))}
                  </View>
                </ScrollView>
              </View>
            ))}
          </ScrollView>
        ) : null}
      </View>

      <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {PAGES.map((p, i) => (
          <View key={p.head} style={[styles.dot, i === page ? styles.dotOn : null]} />
        ))}
      </View>

      <View style={styles.buttons}>
        <Button
          label={page === 0 ? "Close" : "Back"}
          variant="ghost"
          size="sm"
          height={54}
          flex={1}
          onPress={page === 0 ? onBack : () => show(page - 1)}
        />
        <Button
          label={page === last ? "GOT IT" : "NEXT"}
          variant="gold"
          size="md"
          height={54}
          flex={1.4}
          onPress={page === last ? onBack : () => show(page + 1)}
        />
      </View>
    </Screen>
  );
}
