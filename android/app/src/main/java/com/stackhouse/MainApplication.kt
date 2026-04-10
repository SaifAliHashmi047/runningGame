package com.stackhouse

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  companion object {
    /**
     * Static references so R8 / resource shrink keeps these `res/raw` entries. `react-native-sound`
     * resolves them only via getIdentifier(name, "raw", …) at runtime.
     */
    @Suppress("unused")
    private val keepSoundRawResources: IntArray =
      intArrayOf(
        R.raw.ui_music,
        R.raw.game_music,
        R.raw.coin_pickup,
        R.raw.game_over,
        R.raw.obstacle_explosion,
        R.raw.ship_hum_loop,
        R.raw.zone_speed_up,
        R.raw.powerup_collect,
        R.raw.powerup_pickup,
        R.raw.button_tap,
        R.raw.obstacle_hit,
        R.raw.hero_dead,
        R.raw.coin_collect_1,
        R.raw.coin_collect_2,
      )
  }

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
