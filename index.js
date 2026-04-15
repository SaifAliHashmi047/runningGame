/**
 * @format
 */

import "react-native-reanimated";
import { AppRegistry } from "react-native";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import App from "./App";
import { name as appName } from "./app.json";
import firebase from "@react-native-firebase/app";
import messaging from "@react-native-firebase/messaging";
import { handleFcmBackgroundRemoteMessage } from "./src/notifications/fcmBackground";
if (__DEV__) {
  console.log("Firebase Apps:", firebase.apps);
  console.log("Messaging:", messaging());
}
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  await handleFcmBackgroundRemoteMessage(remoteMessage);
});

// Quieter dev console: reduced-motion hints + layout/transform strict checks are optional for this game.
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

AppRegistry.registerComponent(appName, () => App);
