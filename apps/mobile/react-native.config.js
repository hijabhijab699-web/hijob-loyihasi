module.exports = {
  dependencies: {
    'apple-face-detector': {
      root: __dirname + '/native-modules/apple-face-detector',
      platforms: {
        ios: {
          podspecPath:
            __dirname + '/native-modules/apple-face-detector/AppleFaceDetector.podspec',
        },
        android: null,
      },
    },
  },
};
