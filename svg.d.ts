declare module '*.svg' {
  import type { FC } from 'react';
  import type { SvgProps } from 'react-native-svg';
  /** Component when Metro uses react-native-svg-transformer; number when SVG is still an asset. */
  const content: FC<SvgProps> | number;
  export default content;
}
