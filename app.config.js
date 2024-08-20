const myValue = 'My App';

module.exports = {
  name: myValue,
  version: process.env.MY_CUSTOM_PROJECT_VERSION || '1.0.0',
  description: 'A description of my app',
  slug: 'my-app',
  platforms: ['ios', 'android'],
  sdkVersion: '51.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: [
    '**/*',
  ],
  ios: {
    supportsTablet: true,
    infoPlist: {
      NSCameraUsageDescription: 'This app uses the camera to take photos.',
      NSPhotoLibraryUsageDescription: 'This app needs access to your photo library to select images.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF',
    },
    permissions: [
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
    ],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  extra: {
    fact: 'kittens are cool',
    apiUrl: process.env.API_URL || 'https://api.myapp.com',
    enableFeatureX: process.env.ENABLE_FEATURE_X === 'true',
  },
  hooks: {
    postPublish: [
      {
        file: 'sentry-expo/upload-sourcemaps',
        config: {
          organization: 'myorg',
          project: 'myproject',
          authToken: process.env.SENTRY_AUTH_TOKEN,
        },
      },
    ],
  },
  // Environment-specific configurations
  development: {
    extra: {
      apiUrl: 'https://dev.api.myapp.com',
      enableDebugging: true,
    },
  },
  production: {
    extra: {
      apiUrl: 'https://api.myapp.com',
      enableDebugging: false,
    },
  },
};
