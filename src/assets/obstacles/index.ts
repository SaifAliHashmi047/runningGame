import type { ObstacleVisual } from "../../game/types";

/** Packed by Metro — use with `<Image source={...} />`. */
export const OBSTACLE_TEXTURE_SOURCES: Record<ObstacleVisual, number> = {
  rock: require("./rock.png"),
  fireball: require("./fireball.png"),
  roundBomb: require("./round_bomb.png"),
  aeroBomb: require("./aero_bomb.png"),
};
