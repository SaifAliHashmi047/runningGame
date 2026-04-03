/**
 * Shared motion tokens for the home screen — keeps timing coherent and premium (not chaotic).
 */

import { Easing, FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";

export const HOME_SPRING_PRESS = { damping: 18, stiffness: 420, mass: 0.45 };
export const HOME_SPRING_SOFT = { damping: 22, stiffness: 180 };

/** Stagger: screen load sequence (ms). */
export const HOME_STAGE = {
  shell: 0,
  topHud: 80,
  rewardCard: 140,
  hero: 220,
  rings: 275,
  play: 400,
  bottom: 480,
  bottomItemGap: 56,
} as const;

const easeOut = Easing.out(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);

export const enterTopHud = () => FadeInDown.duration(420).delay(HOME_STAGE.topHud).easing(easeOut);

export const enterRewardCard = () => FadeInUp.duration(440).delay(HOME_STAGE.rewardCard).easing(easeOut);

export const enterHero = () => FadeIn.duration(520).delay(HOME_STAGE.hero).easing(easeInOut);

export const enterRings = () => FadeIn.duration(460).delay(HOME_STAGE.rings).easing(easeInOut);

export const enterPlay = () =>
  FadeInUp.duration(520).delay(HOME_STAGE.play).easing(Easing.out(Easing.cubic));

export const enterBottomItem = (index: number) =>
  FadeInUp.duration(400).delay(HOME_STAGE.bottom + index * HOME_STAGE.bottomItemGap).easing(easeOut);

export const CTA_IDLE_PULSE_MS = 1500;
export const HERO_FLOAT_MS = 2400;
export const HERO_TILT_MS = 3200;
export const CARD_SHINE_MS = 2400;
export const REWARD_PULSE_MS = 2200;
