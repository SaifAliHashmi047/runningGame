package com.stackhouse;

/**
 * Compatibility shim for legacy generated sources that may still reference the old package name.
 *
 * React Native generates some Java sources under `com.facebook.react` during autolinking; in this
 * project version it hard-codes the previous package (`com.stackhouse`) when referencing
 * `BuildConfig` feature flags. Keeping this shim avoids build breaks after renaming the app id.
 */
public final class BuildConfig {
  private BuildConfig() {}

  public static final boolean IS_NEW_ARCHITECTURE_ENABLED =
      arcadegame.running.topgame.galaxyrunner.BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;

  public static final boolean IS_EDGE_TO_EDGE_ENABLED =
      arcadegame.running.topgame.galaxyrunner.BuildConfig.IS_EDGE_TO_EDGE_ENABLED;
}

