import { RUNNER_LANE_COUNT, RUNNER_LANE_MARGIN } from "./runnerConfig";

export type LaneGeometry = {
  laneW: number;
  laneCenterX: (lane: number) => number;
  playerLeftFromLane: (lane: number) => number;
  obstacleLeftFromLane: (lane: number, obstacleWidth: number) => number;
};

export function computeLaneGeometry(
  screenW: number,
  playerW: number,
  margin: number = RUNNER_LANE_MARGIN
): LaneGeometry {
  const usable = Math.max(120, screenW - 2 * margin);
  const laneW = usable / RUNNER_LANE_COUNT;
  const laneCenterX = (lane: number) => {
    const i = Math.max(0, Math.min(RUNNER_LANE_COUNT - 1, lane));
    return margin + laneW * (i + 0.5);
  };
  return {
    laneW,
    laneCenterX,
    playerLeftFromLane: (lane: number) => laneCenterX(lane) - playerW / 2,
    obstacleLeftFromLane: (lane: number, obstacleWidth: number) => laneCenterX(lane) - obstacleWidth / 2,
  };
}

export function clampLane(lane: number): number {
  return Math.max(0, Math.min(RUNNER_LANE_COUNT - 1, lane));
}
