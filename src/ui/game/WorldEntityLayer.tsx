import React, { memo } from "react";
import type { SharedValue } from "react-native-reanimated";
import type { VisualQualityTier } from "../../game/performanceConfig";
import type { PowerUpKind } from "../../game/powers";
import type { EntityPosMap } from "./entityPositions";
import TrackedObstacle, { type TrackedObstacleSpec } from "./TrackedObstacle";
import TrackedCoin from "./TrackedCoin";
import TrackedPowerUp from "./TrackedPowerUp";

export type CoinRenderSpec = { id: number; size: number };
export type PowerRenderSpec = { id: number; kind: PowerUpKind; size: number };

type Props = {
  obstacleSpecs: readonly TrackedObstacleSpec[];
  coinSpecs: readonly CoinRenderSpec[];
  powerSpecs: readonly PowerRenderSpec[];
  obsPositions: SharedValue<EntityPosMap>;
  coinPositions: SharedValue<EntityPosMap>;
  powerPositions: SharedValue<EntityPosMap>;
  visualTier: VisualQualityTier;
};

function WorldEntityLayerInner({
  obstacleSpecs,
  coinSpecs,
  powerSpecs,
  obsPositions,
  coinPositions,
  powerPositions,
  visualTier,
}: Props) {
  return (
    <>
      {obstacleSpecs.map((o) => (
        <TrackedObstacle
          key={o.id}
          entityId={o.id}
          visW={o.visW}
          visH={o.visH}
          color={o.color}
          positionsById={obsPositions}
        />
      ))}
      {coinSpecs.map((c) => (
        <TrackedCoin key={c.id} coinId={c.id} size={c.size} positionsById={coinPositions} />
      ))}
      {powerSpecs.map((p) => (
        <TrackedPowerUp
          key={p.id}
          powerUpId={p.id}
          kind={p.kind}
          size={p.size}
          positionsById={powerPositions}
        />
      ))}
    </>
  );
}

function coinSpecsEq(a: readonly CoinRenderSpec[], b: readonly CoinRenderSpec[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id || a[i].size !== b[i].size) return false;
  }
  return true;
}

function obstacleSpecsEq(a: readonly TrackedObstacleSpec[], b: readonly TrackedObstacleSpec[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (x.id !== y.id || x.visW !== y.visW || x.visH !== y.visH || x.color !== y.color) {
      return false;
    }
  }
  return true;
}

function powerSpecsEq(a: readonly PowerRenderSpec[], b: readonly PowerRenderSpec[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id || a[i].kind !== b[i].kind || a[i].size !== b[i].size) return false;
  }
  return true;
}

function propsEqual(p: Props, n: Props) {
  return (
    obstacleSpecsEq(p.obstacleSpecs, n.obstacleSpecs) &&
    coinSpecsEq(p.coinSpecs, n.coinSpecs) &&
    powerSpecsEq(p.powerSpecs, n.powerSpecs) &&
    p.obsPositions === n.obsPositions &&
    p.coinPositions === n.coinPositions &&
    p.powerPositions === n.powerPositions &&
    p.visualTier === n.visualTier
  );
}

export default memo(WorldEntityLayerInner, propsEqual);
