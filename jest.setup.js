jest.mock("react-native-sound", () => {
  const fn = () => {};
  const S = jest.fn().mockImplementation(() => ({
    isLoaded: () => true,
    play: jest.fn((cb) => {
      cb?.(true);
      return {};
    }),
    pause: jest.fn(() => ({})),
    stop: jest.fn((cb) => {
      cb?.();
      return {};
    }),
    release: jest.fn(() => ({})),
    reset: jest.fn(() => ({})),
    setVolume: jest.fn(() => ({})),
    setSpeed: jest.fn(() => ({})),
    setNumberOfLoops: jest.fn(() => ({})),
    setCurrentTime: jest.fn(() => ({})),
    getVolume: jest.fn(() => 1),
    getSpeed: jest.fn(() => 1),
    getNumberOfLoops: jest.fn(() => 0),
    getDuration: jest.fn(() => 1),
    getNumberOfChannels: jest.fn(() => 1),
    getCurrentTime: jest.fn(() => {}),
  }));
  S.MAIN_BUNDLE = "";
  S.DOCUMENT = "";
  S.LIBRARY = "";
  S.CACHES = "";
  S.setCategory = fn;
  S.setActive = fn;
  S.setMode = fn;
  S.enable = fn;
  return { __esModule: true, default: S };
});

jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));
