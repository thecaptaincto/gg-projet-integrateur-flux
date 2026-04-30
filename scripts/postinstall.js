const fs = require("fs");
const path = require("path");

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function writeFileIfChanged(filePath, next) {
  const prev = readFile(filePath);
  if (prev === next) return false;
  fs.writeFileSync(filePath, next, "utf8");
  return true;
}

function patchFile(relPath, patchFn) {
  const filePath = path.join(__dirname, "..", relPath);
  if (!fs.existsSync(filePath)) {
    console.warn(`[postinstall] Skipping missing: ${relPath}`);
    return { relPath, changed: false, skipped: true };
  }

  const prev = readFile(filePath);
  const next = patchFn(prev);
  if (next == null || typeof next !== "string") {
    console.warn(`[postinstall] No-op (patchFn returned non-string): ${relPath}`);
    return { relPath, changed: false, skipped: false };
  }

  const changed = writeFileIfChanged(filePath, next);
  if (changed) console.log(`[postinstall] Patched: ${relPath}`);
  return { relPath, changed, skipped: false };
}

function patchGestureHandlerBuildGradle(src) {
  let out = src;

  // Avoid duplicate classes on old architecture:
  // - RNGH ships pre-generated "paper" code
  // - The RN Gradle plugin also runs codegen for libraries, generating the same classes
  // So we apply the RN Gradle plugin only when the New Architecture is enabled.
  out = out.replace(
    /^\s*apply plugin:\s*'com\.facebook\.react'\s*$/m,
    "if (isNewArchitectureEnabled()) {\n    apply plugin: 'com.facebook.react'\n}\n"
  );

  // Use react-android artifact on RN 0.76+.
  out = out.replace(
    /implementation\s+['"]com\.facebook\.react:react-native:\+['"][^\n]*\n/gm,
    '    implementation("com.facebook.react:react-android")\n'
  );

  return out;
}

function patchPagerViewBuildGradle(src) {
  let out = src;

  out = out.replace(
    /if\s*\(\s*isNewArchitectureEnabled\(\)\s*\)\s*\{\s*\n\s*apply plugin:\s*'com\.facebook\.react'\s*\n\s*\}\s*\n/gm,
    "apply plugin: 'com.facebook.react'\n"
  );
  if (!out.includes("apply plugin: 'com.facebook.react'")) {
    out = out.replace(
      /apply plugin:\s*'kotlin-android'\s*\n/gm,
      "apply plugin: 'kotlin-android'\napply plugin: 'com.facebook.react'\n"
    );
  }

  out = out.replace(
    /api\s+["']com\.facebook\.react:react-native:\+["']\s*\n/gm,
    '  api("com.facebook.react:react-android")\n'
  );

  // Ensure codegen config is always present (PagerViewViewManager.kt depends on generated delegates).
  out = out.replace(
    /if\s*\(\s*isNewArchitectureEnabled\(\)\s*\)\s*\{\s*\n\s*react\s*\{\s*\n([\s\S]*?)\n\s*\}\s*\n\s*\}\s*\n/gm,
    (m, inner) => `react {\n${inner}\n}\n`
  );
  if (!out.includes("\nreact {\n")) {
    // Best-effort insertion near the end of the file.
    out +=
      "\nreact {\n" +
      "  jsRootDir = file(\"../src\")\n" +
      "  libraryName = \"RNCViewPager\"\n" +
      "  codegenJavaPackageName = \"com.reactnativepagerview\"\n" +
      "}\n";
  }

  return out;
}

function patchRemoveViewManagerWithGeneratedInterface(src) {
  let out = src;
  out = out.replace(
    /^\s*import\s+com\.facebook\.react\.uimanager\.ViewManagerWithGeneratedInterface;\s*\r?\n/m,
    ""
  );
  out = out.replace(/ extends ViewManagerWithGeneratedInterface/g, "");
  return out;
}

function patchGestureHandlerButtonKt(src) {
  let out = src;

  // Align with RN's Java interface `ReactPointerEventsView#getPointerEvents()`.
  out = out.replace(
    /@ReactProp\(name = ViewProps\.POINTER_EVENTS\)\s*\r?\n\s*override fun setPointerEvents\(view: ButtonViewGroup, pointerEvents: String\?\)\s*\{\s*[\s\S]*?\r?\n\s*\}\s*\r?\n/m,
    `@ReactProp(name = ViewProps.POINTER_EVENTS)
  override fun setPointerEvents(view: ButtonViewGroup, pointerEvents: String?) {
    view.setPointerEvents(when (pointerEvents) {
      "none" -> PointerEvents.NONE
      "box-none" -> PointerEvents.BOX_NONE
      "box-only" -> PointerEvents.BOX_ONLY
      "auto", null -> PointerEvents.AUTO
      else -> PointerEvents.AUTO
    })
  }

`
  );

  out = out.replace(
    /override var pointerEvents:\s*PointerEvents\s*=\s*PointerEvents\.AUTO\s*\r?\n/m,
    "private var pointerEvents: PointerEvents = PointerEvents.AUTO\n\n    override fun getPointerEvents(): PointerEvents = pointerEvents\n\n    fun setPointerEvents(pointerEvents: PointerEvents) {\n      this.pointerEvents = pointerEvents\n    }\n"
  );

  return out;
}

function patchGoogleSigninModuleIndex(src) {
  return src.replace(
    "export { GoogleSigninButton } from './buttons/GoogleSigninButton';",
    "export { GoogleSigninButton } from './buttons/GoogleSigninButton.js';"
  );
}

function main() {
  const results = [];

  results.push(
    patchFile(
      "node_modules/react-native-gesture-handler/android/build.gradle",
      patchGestureHandlerBuildGradle
    )
  );
  results.push(
    patchFile(
      "node_modules/react-native-pager-view/android/build.gradle",
      patchPagerViewBuildGradle
    )
  );
  results.push(
    patchFile(
      "node_modules/react-native-gesture-handler/android/paper/src/main/java/com/facebook/react/viewmanagers/RNGestureHandlerButtonManagerInterface.java",
      patchRemoveViewManagerWithGeneratedInterface
    )
  );
  results.push(
    patchFile(
      "node_modules/react-native-gesture-handler/android/paper/src/main/java/com/facebook/react/viewmanagers/RNGestureHandlerRootViewManagerInterface.java",
      patchRemoveViewManagerWithGeneratedInterface
    )
  );
  results.push(
    patchFile(
      "node_modules/react-native-gesture-handler/android/src/main/java/com/swmansion/gesturehandler/react/RNGestureHandlerButtonViewManager.kt",
      patchGestureHandlerButtonKt
    )
  );
  results.push(
    patchFile(
      "node_modules/@react-native-google-signin/google-signin/lib/module/index.js",
      patchGoogleSigninModuleIndex
    )
  );

  const changed = results.filter((r) => r.changed).length;
  const skipped = results.filter((r) => r.skipped).length;
  console.log(`[postinstall] Done. Changed=${changed}, Skipped=${skipped}`);
}

main();
