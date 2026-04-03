/** Cheap AABB X reject before precise player/obstacle collision — uses cached hit width only. */
export type BroadphaseObstacleX = {
  x: number;
  hitOffX: number;
  hitW: number;
};

const H_MARGIN = 16;

export function obstacleBroadphaseX(
  obs: BroadphaseObstacleX,
  playerLeft: number,
  playerRight: number
): boolean {
  const oL = obs.x + obs.hitOffX - H_MARGIN;
  const oR = obs.x + obs.hitOffX + obs.hitW + H_MARGIN;
  return !(oR < playerLeft || oL > playerRight);
}
