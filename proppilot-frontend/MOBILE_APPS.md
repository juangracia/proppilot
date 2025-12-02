# PropPilot Mobile Apps

## What Was Done Overnight

### Completed
1. **Capacitor Integration** - Installed and configured Capacitor for native mobile apps
2. **Native Google OAuth** - Added `@codetrix-studio/capacitor-google-auth` plugin with platform detection
3. **API Configuration** - Updated to detect native platform and use production backend
4. **App Icons** - Generated all required icons for Android and iOS
5. **iOS App** - Built and tested successfully on iOS Simulator (iPhone 16)
6. **Android Setup** - Android project configured, SDK installed

### iOS App Status: READY TO TEST

The iOS app was built and tested on the simulator. The screenshot below shows it working:
- Login screen displays correctly
- Native "Iniciar sesion con Google" button appears
- Gradient background and styling look good

## How to Test

### iOS Testing (Easiest - Ready Now)

1. **Open the iOS project:**
   ```bash
   cd proppilot-frontend
   npx cap open ios
   ```

2. **In Xcode:**
   - Select your target device (simulator or your iPhone via USB)
   - Click the Play button to build and run

3. **To test on your physical iPhone:**
   - Connect iPhone via USB
   - Select your iPhone in Xcode's device dropdown
   - You may need to "Trust" your Mac on the iPhone
   - Click Play to install and run

### Android Testing

The Android build requires **Java 21**, but your system has Java 17. You have two options:

**Option A: Install Java 21 via SDKMAN**
```bash
sdk install java 21.0.1-tem
sdk use java 21.0.1-tem
```

**Option B: Use Android Studio**
1. Download and install [Android Studio](https://developer.android.com/studio)
2. Open the Android project:
   ```bash
   npx cap open android
   ```
3. Android Studio will handle Java versions automatically
4. Build > Build Bundle(s) / APK(s) > Build APK(s)
5. APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

## Project Structure

```
proppilot-frontend/
├── android/                 # Android Studio project
├── ios/                     # Xcode project
├── capacitor.config.json    # Capacitor configuration
├── src/
│   ├── config/api.js       # Platform-aware API URL
│   ├── contexts/AuthContext.jsx  # Native Google Auth support
│   └── components/LoginPage.jsx  # Platform-specific login UI
└── public/
    ├── icon.svg            # App icon source
    ├── icon-512.png        # Generated icon
    └── apple-touch-icon.png
```

## Google OAuth Setup (Required for Full Testing)

The native Google Auth requires additional OAuth client IDs in Google Cloud Console:

### For Android:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project: proppilot-479504
3. APIs & Services > Credentials > Create Credentials > OAuth 2.0 Client ID
4. Select "Android"
5. Package name: `com.proppilot.app`
6. Get SHA-1 fingerprint:
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android
   ```
7. Add the SHA-1 fingerprint

### For iOS:
1. Create another OAuth 2.0 Client ID
2. Select "iOS"
3. Bundle ID: `com.proppilot.app`

The existing web client ID is already configured in the code:
- `686454629506-d068i9m0tm2nvue7rdbjfgpm3ivvmggb.apps.googleusercontent.com`

## Distributing to Test Users

### iOS (Free Options)
1. **USB Install**: Connect tester's iPhone, run from Xcode
2. **TestFlight**: Requires $99/year Apple Developer Program
3. **Ad-hoc**: Collect device UDIDs, create provisioning profile

### Android (Free)
1. Build APK (see above)
2. Upload to Google Drive
3. Share link with testers
4. Testers enable "Install from unknown sources" and install

## Commands Reference

```bash
# Build web app
npm run build

# Sync to native projects
npx cap sync

# Open iOS in Xcode
npx cap open ios

# Open Android in Android Studio
npx cap open android

# Build iOS for simulator
cd ios/App && xcodebuild -workspace App.xcworkspace -scheme App -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 16' build

# Run on iOS simulator
xcrun simctl boot "iPhone 16"
xcrun simctl install "iPhone 16" ~/Library/Developer/Xcode/DerivedData/App-*/Build/Products/Debug-iphonesimulator/App.app
xcrun simctl launch "iPhone 16" com.proppilot.app
```

## Troubleshooting

### "Google sign-in failed"
- Make sure the appropriate OAuth client ID is configured in Google Cloud Console
- For Android: SHA-1 fingerprint must match
- For iOS: Bundle ID must match

### iOS build fails
- Run `pod install` in `ios/App/` directory
- Make sure CocoaPods is installed: `brew install cocoapods`

### Android build fails with Java error
- Capacitor Android requires Java 21
- Install via: `sdk install java 21.0.1-tem`

## Next Steps (When Ready for App Stores)

1. **Google Play Store** ($25 one-time)
   - Create developer account
   - Build release APK/AAB
   - Upload to Internal Testing track

2. **Apple App Store** ($99/year)
   - Create developer account
   - Archive in Xcode
   - Upload to TestFlight/App Store Connect
