// A style that stretches a view over its whole parent. It's written out here, not taken
// from StyleSheet, because React Native removed StyleSheet.absoluteFillObject in newer versions.
export const FILL = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } as const;
