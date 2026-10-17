import { StyleSheet } from "react-native";
import { Ui } from "../AppContext";

export const makeStyles = (ui: Ui) =>
  StyleSheet.create({
    // The top bar and the buttons keep the usual 16 px at the sides. The pages themselves reach the
    // edges of the screen, so a swipe slides them all the way off.
    pager: { flex: 1 },
    pageContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 6 },
    steps: { marginTop: 12, gap: 10 },
    step: { paddingVertical: 12, paddingHorizontal: 14, minHeight: 112, justifyContent: "center" },
    stepRow: { flexDirection: "row", alignItems: "center", gap: 14 },
    stepText: { flex: 1, minWidth: 0, gap: 5 },
    // The page dots: the dot of the page you are on is long and gold, so it is not only a colour.
    dots: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, paddingVertical: 10 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ui.colors.border },
    dotOn: { width: 22, backgroundColor: ui.colors.gold },
    buttons: { flexDirection: "row", gap: 8, paddingHorizontal: 16 },
  });
