import type { ImageSourcePropType } from "react-native";
import type { PowerUpKind } from "../../powers";

/**
 * World + HUD power-up art (PNGs). Files live in `./png/`.
 * Mapping: shield → award, magnet → magnet, boost → lightning, slow-mo → stopwatch,
 * multiplier → 2x, ghost → immune-system; coin burst → coin icon asset.
 */
export const POWERUP_BITMAP: Record<PowerUpKind, ImageSourcePropType> = {
  shield: require("./png/power_shield.png"),
  magnet: require("./png/power_magnet.png"),
  boost: require("./png/power_boost.png"),
  slowTime: require("./png/power_slow_time.png"),
  multiplier: require("./png/power_multiplier.png"),
  ghostPhase: require("./png/power_ghost_phase.png"),
  coinBurst: require("./png/power_coin_burst.png"),
};
