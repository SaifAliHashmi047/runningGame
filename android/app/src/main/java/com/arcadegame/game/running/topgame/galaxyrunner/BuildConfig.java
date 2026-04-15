package com.arcadegame.game.running.topgame.galaxyrunner;

/**
 * Compatibility shim for React Native generated sources.
 *
 * React Native's generated `ReactNativeApplicationEntryPoint.java` in this project references
 * `com.arcadegame.game.running.topgame.galaxyrunner.BuildConfig` for feature flags even after
 * changing the app id/namespace. Keeping this shim unblocks debug/release builds.
 */
public final class BuildConfig {
  private BuildConfig() {}

  public static final boolean IS_NEW_ARCHITECTURE_ENABLED =
      arcadegame.running.topgame.galaxyrunner.BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;

  public static final boolean IS_EDGE_TO_EDGE_ENABLED =
      arcadegame.running.topgame.galaxyrunner.BuildConfig.IS_EDGE_TO_EDGE_ENABLED;
}

