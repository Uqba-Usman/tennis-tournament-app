# Building the Android APK (no Android Studio required)

The Capacitor Android project has already been generated in `android/`. To turn
it into an installable APK you only need command-line tools — **Android
Studio is never required.**

## What's already done
- `npx cap init` — Capacitor config created (`capacitor.config.ts`).
- `npx cap add android` — native Android project generated in `android/`.
- `npm run build` output (`dist/`) is copied into the Android project as web assets.

## Prerequisites (one-time setup on your machine)
Capacitor's Android build uses Gradle, which needs a compatible JDK, and the
Android command-line tools (SDK + build tools) — both installable without
Android Studio.

1. **JDK 17 or 21** (not newer — Gradle 8.x does not yet support JDK 22+).
   This environment currently has JDK 26 installed, which is why the build
   below fails here with `Unsupported class file major version 70`. Install
   a JDK 17/21 (e.g. Eclipse Temurin) and point `JAVA_HOME` at it before
   building.
2. **Android command-line tools only** (no IDE):
   - Download "Command line tools only" from
     https://developer.android.com/studio#command-tools
   - Unzip, then run:
     ```powershell
     cd cmdline-tools\bin
     .\sdkmanager.bat --sdk_root=C:\Android\Sdk "platform-tools" "platforms;android-34" "build-tools;34.0.0"
     ```
   - Set environment variables:
     ```powershell
     setx ANDROID_HOME "C:\Android\Sdk"
     setx ANDROID_SDK_ROOT "C:\Android\Sdk"
     ```

## Building the APK
From `projects/tennis-tournament-app/`:

```powershell
npm run build
npx cap copy android
cd android
.\gradlew.bat assembleDebug
```

The debug APK is produced at:
`android\app\build\outputs\apk\debug\app-debug.apk`

Copy it to an Android phone and install it directly (enable "Install unknown
apps" for the file manager/browser used to open it).

For a release build (signed, smaller, optimized):
```powershell
.\gradlew.bat assembleRelease
```
This requires a signing keystore — see
https://capacitorjs.com/docs/android/deploying-to-google-play for the
`keytool`/Gradle signing config steps (still no Android Studio needed).

## Current status in this environment
This session confirmed the Capacitor Android project builds/scaffolds
correctly, but **could not produce an actual APK here** because:
- No Android SDK is installed (`ANDROID_HOME` unset).
- The installed JDK (26) is too new for the Gradle version Capacitor ships with.

Everything else (web app, domain logic, UI) has been fully built and verified
in the browser. Once you install JDK 17/21 + the Android command-line tools
per the steps above, `gradlew assembleDebug` should produce a working APK
without any further code changes.
