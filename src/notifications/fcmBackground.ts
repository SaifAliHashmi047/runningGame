import notifee, {
  AndroidImportance,
  AndroidStyle,
} from "@notifee/react-native";
import type { FirebaseMessagingTypes } from "@react-native-firebase/messaging";

const processed = new Set<string>();

/**
 * FCM background/quit delivery entrypoint.
 * Must be registered from `index.js` (not inside a React hook).
 */
export async function handleFcmBackgroundRemoteMessage(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
): Promise<void> {
  if (!remoteMessage) return;

  // If the message includes a notification payload, Android may already show a notification.
  // We still allow data-only messages to be surfaced via Notifee.
  const rawId = remoteMessage.messageId ?? remoteMessage.data?.messageId;
  const messageId =
    typeof rawId === "string" || typeof rawId === "number"
      ? String(rawId)
      : String(Date.now());
  if (processed.has(messageId)) return;
  processed.add(messageId);

  const channelId = await notifee.createChannel({
    id: "default",
    name: "Default Channel",
    importance: AndroidImportance.HIGH,
  });

  const title =
    remoteMessage.notification?.title ||
    (remoteMessage.data?.title as string | undefined) ||
    "Notification";
  const body =
    remoteMessage.notification?.body ||
    (remoteMessage.data?.body as string | undefined) ||
    "";

  await notifee.displayNotification({
    id: messageId,
    title,
    body,
    data: remoteMessage.data || {},
    android: {
      channelId,
      pressAction: { id: "default" },
      // Must be a drawable resource name (not a mipmap name).
      smallIcon: "ic_stat_gr",
      importance: AndroidImportance.HIGH,
      style: {
        type: AndroidStyle.BIGTEXT,
        text: body || " ",
      },
    },
  });
}
