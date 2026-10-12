# Ninja School embedded NRO build kit

This kit is intended to be copied into a **fork** of `Narcissufundis/J2me-nx`.
It embeds the uploaded `NinjaSchoolOffline_2.1.7_v1.jar` in the NRO's ROMFS and
patches the Switch startup flow to copy the embedded JAR to `sdmc:/switch/java/`
and launch it automatically, bypassing the game picker.

## Included
- `data/embedded/NinjaSchoolOffline.jar`: the uploaded JAR, renamed to an ASCII filename.
- `tools/patch-embedded-game.mjs`: applies small, guarded edits to upstream source.
- `.github/workflows/build-ninja-embedded.yml`: GitHub Actions workflow to build and upload the NRO.

## Build with GitHub Actions
1. Fork https://github.com/Narcissufundis/J2me-nx to your GitHub account.
2. Extract this kit and copy its folders/files into the **root** of your fork, merging folders.
3. Commit and push the files to your fork's default branch.
4. Open **Actions** in your fork.
5. Select **Build Ninja School embedded NRO** and press **Run workflow** (or push a change to one of the watched paths).
6. Open the completed workflow run and download the `NinjaSchool-embedded-NRO` artifact.

## Install on Switch
Copy `J2me-nx.nro` to `sdmc:/switch/`. Launch it from Homebrew Menu. The embedded
JAR is extracted to `sdmc:/switch/java/NinjaSchoolOffline.jar` at startup and should
launch automatically. Saves remain under the emulator's normal per-game save folder.

## Important limitations
- This is a source patch/build kit, not a prebuilt or tested NRO. The NRO must be built by GitHub Actions and tested on the user's Switch.
- The patcher deliberately stops with an error if expected source anchors change upstream; if the repository has changed, the patch must be adapted rather than silently applying a partial patch.
- The workflow sets `J2ME_STOCK_RUNTIME=1`, which disables V8 JIT to use the stock runtime included by the package. Performance may be lower than a release built with the project's patched runtime.
- J2me-nx's upstream documentation notes that the regular NRO launched from Homebrew Menu runs in applet mode with less memory than a title launched from the HOME Menu.
- The game JAR's manifest declares CLDC 1.1 / MIDP 2.0 and `GameMidlet`. Emulator compatibility still needs real-device testing.
- Keep this JAR private to your own use unless you have permission to redistribute it.
