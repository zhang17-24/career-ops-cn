/**
 * Where a CLI binary lives when it is NOT on PATH.
 *
 * clis.ts's `searchDirs()` keeps the generic locations (`~/.local/bin`,
 * `/opt/homebrew/bin`, the Windows per-user roots) inline, because those are
 * stable conventions. This module holds the one case that is neither generic
 * nor guessable: an Electron app that ships its agent CLI inside its own
 * bundle, where the path is a property of that app's packaging rather than of
 * the platform.
 *
 * It lives in a plain .mjs file so the path list is unit-testable under
 * `node --test` — clis.ts is TypeScript, and the existing guards over it can
 * only regex its source text, which would assert "the string appears" rather
 * than "the right platform gets the right path".
 */

/**
 * Directories that may contain WorkBuddy's bundled `codebuddy` binary.
 *
 * macOS only, deliberately. The Windows and Linux install roots were never
 * observed on a real machine, and a guessed path is worse than a missing one:
 * `detectClis()` would report `installed: false` either way, but a wrong guess
 * in `searchDirs()` also risks matching an unrelated `codebuddy` and reporting
 * it as WorkBuddy. Returning `[]` keeps the option honestly absent rather than
 * confidently wrong.
 *
 * @param {string} platform - `process.platform`
 * @returns {string[]}
 */
export function workbuddyCliDirs(platform) {
  if (platform !== "darwin") return [];
  return [
    // Both apps ship the same CLI. Ordered so the primary app wins when both
    // are installed; findBin() returns the first hit.
    "/Applications/WorkBuddy.app/Contents/Resources/app.asar.unpacked/cli/bin",
    "/Applications/WorkBuddy AI.app/Contents/Resources/app.asar.unpacked/cli/bin",
  ];
}
