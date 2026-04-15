import { PermissionsAndroid, Platform } from "react-native";
import notifee, {
  AndroidImportance,
  AndroidStyle,
  EventType,
} from "@notifee/react-native";
import messaging from "@react-native-firebase/messaging";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef } from "react";
export const NOTIFICATION_IMAGE_URL =
  "https://res.cloudinary.com/dwzrisija/image/upload/f_auto,q_auto/galaxy_runner_logo_hd_usjnoe";

type NotificationNavigationHandler = (args: {
  redirectTo?: string;
  data?: Record<string, unknown>;
  raw: unknown;
}) => void;

type Options = {
  /**
   * Hook to connect Notifee/FCM "redirect_to" values to your app's own routing
   * (this project uses Home ↔ Game transitions, not a navigation library).
   */
  onNavigateFromNotification?: NotificationNavigationHandler;
};

export const useNoftication = (options: Options = {}) => {
  // const navigation = useNavigation();
  const processedNotifications = useRef(new Set());
  const navigatingRef = useRef(false);
  useEffect(() => {
    requestNotificationPermission();
    const unsubscribeFCM = setupNotificationListeners();
    const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.DISMISSED) {
        console.log("[Notifee] Notification dismissed");
        // On Android, explicitly cancel so the tray doesn't show empty entries after "Clear all"
        if (Platform.OS === "android" && detail?.notification?.id) {
          notifee.cancelNotification(detail.notification.id).catch(() => {});
        }
        return;
      }

      if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
        console.log(
          "[Notifee] Notification Tapped (Foreground):",
          JSON.stringify(detail, null, 2),
        );

        const notification = detail.notification;

        setTimeout(() => handleNotificationNavigation(notification), 150);
      }
      const handleInitialNotification = async () => {
        const notification = await notifee.getInitialNotification();
        console.log("zdadssdasdasd", notification);

        if (notification) {
          console.log(
            "[Notifee] App Opened from Notification Tap (Killed State):",
            JSON.stringify(notification, null, 2),
          );
          handleNotificationNavigation(notification.notification);
        }
      };

      // handleInitialNotification();
    });
    let retryTimeout = null;

    if (Platform.OS === "android") {
      retryTimeout = setTimeout(async () => {
        const notifeeInitial = await notifee.getInitialNotification();

        if (notifeeInitial) {
          console.log(
            "[Notifee] App Opened from Notification (Android retry):",
            JSON.stringify(notifeeInitial, null, 2),
          );
          handleNotificationNavigation(notifeeInitial.notification);
          return;
        }

        messaging()
          .getInitialNotification()
          .then((remoteMessage) => {
            if (remoteMessage) {
              console.log(
                "[FCM] Initial Notification (Android retry):",
                remoteMessage,
              );
              handleNotificationNavigation(remoteMessage);
            }
          });
      }, 2000);
    }
    return () => {
      if (retryTimeout != null) clearTimeout(retryTimeout);
      //@ts-ignore
      unsubscribeFCM();
      unsubscribeNotifee();
    };
  }, []);

  const requestNotificationPermission = async () => {
    if (Platform.OS === "ios") {
      const settings = await notifee.requestPermission();
      console.log("ios", settings);
      if (settings.authorizationStatus === 1) {
        await getFcmToken();
      }
    }
    await messaging().registerDeviceForRemoteMessages();

    if (Platform.OS === "android") {
      const nSettings = await notifee.requestPermission();
      if (__DEV__) {
        console.log("[Notifee] android permission:", nSettings);
      }
      const post = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      if (__DEV__) {
        console.log("[Android] POST_NOTIFICATIONS:", post);
      }
    }
    const authStatus = await messaging().requestPermission();

    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      await getFcmToken();
    }
  };
  const getFcmToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("fcmToken");
      if (__DEV__) {
        console.log("[FCM] cached token in AsyncStorage:", storedToken);
      }

      const liveToken = await messaging().getToken();
      if (__DEV__) {
        console.log("[FCM] messaging().getToken():", liveToken);
      }

      if (liveToken && liveToken !== storedToken) {
        await AsyncStorage.setItem("fcmToken", liveToken);
      }
    } catch (error) {
      console.log("Error fetching FCM token:", error);
    }
  };
  const setupNotificationListeners = () => {
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log("Foreground FCM Message:", remoteMessage);

      await displayCustomNotification(remoteMessage);
    });

    const unsubscribeOnNotificationOpenedApp =
      messaging().onNotificationOpenedApp((remoteMessage) => {
        if (remoteMessage) {
          console.log("Notification Tapped (Background - FCM):", remoteMessage);

          handleNotificationNavigation(remoteMessage);
        }
      });

    messaging()
      .getInitialNotification()
      .then(async (remoteMessage) => {
        if (remoteMessage) {
          console.log(
            "Initial Notification (Killed State - FCM):",
            remoteMessage,
          );

          handleNotificationNavigation(remoteMessage);
        }
      });

    return () => {
      unsubscribe();
      unsubscribeOnNotificationOpenedApp();
    };
  };
  const displayCustomNotification = async (data: any) => {
    console.log("data", data);
    const messageId = data?.messageId || data?.data?.messageId;

    if (processedNotifications.current.has(messageId)) {
      console.log("Skipping duplicate notification:", messageId);
      return;
    }

    processedNotifications.current.add(messageId);

    const channelId = await notifee.createChannel({
      id: "default",
      name: "Default Channel",
      importance: AndroidImportance.HIGH,
    });

    const title =
      data?.notification?.title || data?.data?.title || "Notification";
    const body = data?.notification?.body || data?.data?.body || "";

    await notifee.displayNotification({
      id: messageId || String(Date.now()),

      title,
      body,

      data: data?.data || {},

      android: {
        channelId,
        pressAction: { id: "default" },
        // Must be a drawable resource name (see `android/app/src/main/res/drawable/ic_stat_gr.xml`).
        smallIcon: "ic_stat_gr",
        importance: AndroidImportance.HIGH,
        showTimestamp: true,
        // largeIcon: NOTIFICATION_IMAGE_URL,
        style: {
          type: AndroidStyle.BIGTEXT,
          text: body || " ",
        },
      },

      ios: {
        // attachments: [{ url: NOTIFICATION_IMAGE_URL }],
      },
    });

    await notifee.setBadgeCount(0);
  };
  const handleNotificationNavigation = (notification: any) => {
    const redirectTo = notification?.data?.redirect_to as string | undefined;
    const payload = (notification?.data || {}) as Record<string, unknown>;

    if (navigatingRef.current) return;
    navigatingRef.current = true;

    try {
      options.onNavigateFromNotification?.({
        redirectTo,
        data: payload,
        raw: notification,
      });
    } finally {
      setTimeout(() => {
        navigatingRef.current = false;
      }, 600);
    }
  };
};
