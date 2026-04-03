/**
 * @format
 */

import 'react-native-reanimated';
import { AppRegistry } from 'react-native';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import App from './App';
import { name as appName } from './app.json';

// Quieter dev console: reduced-motion hints + layout/transform strict checks are optional for this game.
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

AppRegistry.registerComponent(appName, () => App);
