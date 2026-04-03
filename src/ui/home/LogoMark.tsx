import React from "react";
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  RadialGradient,
  G,
  Circle,
  Path,
  Use,
} from "react-native-svg";

type Props = {
  size?: number;
  showBackgroundDisk?: boolean;
};

export default function LogoMark({ size = 220, showBackgroundDisk = true }: Props) {
  const s = size;
  const view = 1024;
  return (
    <Svg width={s} height={s} viewBox="0 0 1024 1024">
      <Defs>
        {/* Outer ring gradient from provided SVG */}
        <LinearGradient id="outerRing" x1="216" y1="216" x2="808" y2="808" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#06B6D4" />
          <Stop offset="0.5" stopColor="#2563EB" />
          <Stop offset="1" stopColor="#8B5CF6" />
        </LinearGradient>

        {/* Ship gradients from provided SVG */}
        <LinearGradient id="shipCore" x1="512" y1="240" x2="512" y2="780" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#F8FAFC" />
          <Stop offset="1" stopColor="#BFDBFE" />
        </LinearGradient>
        <LinearGradient id="flame" x1="440" y1="644" x2="580" y2="810" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FDE68A" />
          <Stop offset="0.55" stopColor="#F97316" />
          <Stop offset="1" stopColor="#EF4444" />
        </LinearGradient>

        <G id="shipMark">
          {/* Core body (from provided) */}
          <Path d="M512 252C585 338 618 450 618 550C618 646 576 722 512 770C448 722 406 646 406 550C406 450 439 338 512 252Z" fill="url(#shipCore)" />
          {/* Wings (from provided) */}
          <Path d="M406 484L268 564L398 608L442 564L406 484Z" fill="#1D4ED8" />
          <Path d="M618 484L756 564L626 608L582 564L618 484Z" fill="#1D4ED8" />
          {/* Flame (from provided) */}
          <Path d="M458 668C476 716 494 758 512 804C530 758 548 716 566 668H458Z" fill="url(#flame)" />
          {/* Cockpit (from provided) */}
          <Circle cx="512" cy="426" r="56" fill="#38BDF8" />
          <Path d="M476 426C476 406.118 492.118 390 512 390C531.882 390 548 406.118 548 426C548 445.882 531.882 462 512 462C492.118 462 476 445.882 476 426Z" fill="#E0F2FE" />
          {/* Spark lines (from provided) */}
          <Path d="M344 370L388 330" stroke="#22D3EE" strokeWidth="14" strokeLinecap="round" />
          <Path d="M680 370L636 330" stroke="#22D3EE" strokeWidth="14" strokeLinecap="round" />
          {/* Speed arc (from provided) */}
          <Path d="M330 708C386 664 432 644 512 636C592 644 638 664 694 708" stroke="#93C5FD" strokeWidth="18" strokeLinecap="round" opacity="0.9" />
        </G>
      </Defs>

      {showBackgroundDisk && (
        <G>
          {/* Using provided background ring look (no filter for RN-SVG compatibility) */}
          <Circle cx="512" cy="512" r="290" fill="#0B1022" />
          <Circle cx="512" cy="512" r="290" fill="none" stroke="url(#outerRing)" strokeWidth="28" />
        </G>
      )}

      <Use href="#shipMark" />
    </Svg>
  );
}

