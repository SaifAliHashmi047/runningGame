/**
 * Home ↔ Game route transitions — crossfade + soft vertical drift (no navigation library).
 */
import { Easing, FadeInUp, FadeOutDown } from "react-native-reanimated";

const easeOut = Easing.out(Easing.cubic);
const easeIn = Easing.in(Easing.cubic);

/** Leaving home: ease downward and fade (makes room for game rising in). */
export const routeExitHome = FadeOutDown.duration(440).easing(easeIn);

/** Arriving home after game. */
export const routeEnterHome = FadeInUp.duration(520).easing(easeOut);

/** Leaving game back to home. */
export const routeExitGame = FadeOutDown.duration(440).easing(easeIn);

/** Starting a run — slight delay so exit reads before full takeover. */
export const routeEnterGame = FadeInUp.duration(560).delay(70).easing(easeOut);
