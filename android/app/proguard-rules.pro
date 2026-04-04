# StackHouse — release R8 / ProGuard rules (RN 0.84 + native libs)

# React Native — keep JNI / bridge surface
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
}
-keep @com.facebook.proguard.annotations.DoNotStripAny class * {
    *;
}
-keep @com.facebook.jni.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.jni.annotations.DoNotStrip *;
}
-keep @com.facebook.jni.annotations.DoNotStripAny class * {
    *;
}

-keep class * implements com.facebook.react.bridge.JavaScriptModule { *; }
-keep class * implements com.facebook.react.bridge.NativeModule { *; }
-keepclassmembers,includedescriptorclasses class * { native <methods>; }
-keepclassmembers class *  { @com.facebook.react.uimanager.annotations.ReactProp <methods>; }
-keepclassmembers class *  { @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>; }

-dontwarn com.facebook.react.**
-keep,includedescriptorclasses class com.facebook.react.bridge.** { *; }
-keep,includedescriptorclasses class com.facebook.react.turbomodule.core.** { *; }
-keep,includedescriptorclasses class com.facebook.react.internal.turbomodule.core.** { *; }

# Hermes / JNI
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Yoga
-keep,allowobfuscation @interface com.facebook.yoga.annotations.DoNotStrip
-keep @com.facebook.yoga.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.yoga.annotations.DoNotStrip *;
}

# Okio (transitive)
-keep class sun.misc.Unsafe { *; }
-dontwarn java.nio.file.*
-dontwarn org.codehaus.mojo.animal_sniffer.IgnoreJRERequirement
-dontwarn okio.**

# Reanimated & Worklets
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.worklets.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.react.fabric.** { *; }

# react-native-svg
-keep public class com.horcrux.svg.** {*;}

# AsyncStorage — keep package if R8 strips accessors
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# SoLoader / dynamic libs
-keep class com.facebook.soloader.** { *; }

# Preserve line numbers for production crash reports (mapping still helps deobfuscate)
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
