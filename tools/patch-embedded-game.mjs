#!/usr/bin/env node
/**
 * Patch J2me-nx to embed NinjaSchoolOffline.jar and auto-launch it on Switch.
 * Run from the repository root before building.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const appPath = path.join(root, 'app/main.js');
const packagePath = path.join(root, 'tools/package.mjs');
const sourceJar = path.join(root, 'data/embedded/NinjaSchoolOffline.jar');

if (!existsSync(appPath) || !existsSync(packagePath)) {
  throw new Error('Run this script from the J2me-nx repository root.');
}
if (!existsSync(sourceJar)) {
  throw new Error('Missing data/embedded/NinjaSchoolOffline.jar');
}

let app = readFileSync(appPath, 'utf8');
let pack = readFileSync(packagePath, 'utf8');

const installMarker = '/* NINJASCHOOL_EMBEDDED_INSTALL */';
const autoMarker = '/* NINJASCHOOL_EMBEDDED_AUTOSTART */';
const packageMarker = '// NINJASCHOOL_EMBEDDED_JAR';

if (!app.includes(installMarker)) {
  const anchor = '  function runGameMenu() {\n';
  if (!app.includes(anchor)) throw new Error('Could not find runGameMenu() insertion point; upstream source may have changed.');
  const installCode = `  ${installMarker}
  function installEmbeddedNinjaSchool() {
    if (!IS_SWITCH) return;
    var embeddedPath = 'romfs:/games/NinjaSchoolOffline.jar';
    var embeddedBytes = readFileSyncLocal(embeddedPath);
    if (!embeddedBytes || !embeddedBytes.length) {
      throw new Error('Embedded Ninja School JAR missing from romfs: ' + embeddedPath);
    }
    try { g.Switch.mkdirSync(GAME_ROOT); } catch (e) { /* directory may exist */ }
    g.Switch.writeFileSync(GAME_ROOT + '/NinjaSchoolOffline.jar', embeddedBytes);
    sdLog('[embedded] NinjaSchoolOffline.jar copied from romfs to SD');
  }

`;
  app = app.replace(anchor, installCode + anchor);
}

// Ensure the embedded JAR is extracted before the SD game list is scanned.
if (!app.includes('    installEmbeddedNinjaSchool();\n    var files = listGameJars();')) {
  const menuAnchor = '  function runGameMenu() {\n    var files = listGameJars();';
  if (!app.includes(menuAnchor)) throw new Error('Could not find runGameMenu() body insertion point.');
  app = app.replace(menuAnchor, '  function runGameMenu() {\n    installEmbeddedNinjaSchool();\n    var files = listGameJars();');
}

if (!app.includes(autoMarker)) {
  const anchor = `    // Node 仿真无输入 UI：自动选第一个有入口类的游戏。`;
  if (!app.includes(anchor)) throw new Error('Could not find game-menu auto-selection insertion point; upstream source may have changed.');
  const autoCode = `    ${autoMarker}
    // On Switch, always launch the embedded Ninja School JAR without showing the game picker.
    if (IS_SWITCH) {
      var embeddedPick = null;
      for (var ep = 0; ep < entries.length; ep++) {
        if (entries[ep].file === 'NinjaSchoolOffline.jar' && entries[ep].midletClass) {
          embeddedPick = entries[ep];
          break;
        }
      }
      if (!embeddedPick) throw new Error('Embedded Ninja School MIDlet entry was not found.');
      sdLog('[embedded] auto-launch: ' + embeddedPick.name + ' (' + embeddedPick.midletClass + ')');
      return Promise.resolve(embeddedPick);
    }

`;
  app = app.replace(anchor, autoCode + anchor);
}

if (!pack.includes(packageMarker)) {
  const anchor = "copy('data/java/classes.jar', 'java/classes.jar');";
  if (!pack.includes(anchor)) throw new Error('Could not find classes.jar copy line in tools/package.mjs; upstream source may have changed.');
  const packageCode = `${anchor}
// NINJASCHOOL_EMBEDDED_JAR: ship the user's MIDlet inside the NRO ROMFS.
copy('data/embedded/NinjaSchoolOffline.jar', 'games/NinjaSchoolOffline.jar');
`;
  pack = pack.replace(anchor, packageCode);
}

writeFileSync(appPath, app);
writeFileSync(packagePath, pack);
console.log('Embedded Ninja School patch applied.');
