import JSZip from 'jszip';
import { GameProject } from '../types';
import { 
  generateWindowsJavaGame, 
  generateWindowsBatchScript, 
  generateGradleBuild, 
  generateMavenPom,
  generateExePackagingGuide
} from './javaRunner';

/**
 * Generates an Inno Setup 6 compiler script (.iss)
 * This allows compiling the game into a native single-file Windows Setup.exe installer!
 */
export function generateInnoSetupScript(project: GameProject): string {
  const safeName = project.name.replace(/[^a-zA-Z0-9]/g, '') || 'MyGame';
  const appId = `{{${project.id || '9E41E6F3-0A2B-4E38-9B21-87C218B33D41'}}}`;

  return `; Inno Setup 6 Script for ${project.name}
; Creates a professional single-file Setup.exe installer for Windows 10 & 11
; Requires Inno Setup (free at https://jrsoftware.org/isdl.php)

#define MyAppName "${project.name}"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Antigravity Godot Engine"
#define MyAppURL "https://godotengine.org"
#define MyAppExeName "Run_Game.bat"

[Setup]
AppId=${appId}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
LicenseFile=LICENSE.txt
OutputDir=.
OutputBaseFilename=${safeName}_Setup_v1.0
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
ArchitecturesInstallIn64BitMode=x64compatible

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\\{#MyAppName}"; Filename: "{app}\\{#MyAppExeName}"
Name: "{group}\\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\\{#MyAppName}"; Filename: "{app}\\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: shellexec postinstall nowait skipifsilent
`;
}

/**
 * Generates a native Windows Command-Line Setup installer (.cmd / .bat)
 * Can be run directly on any Windows PC without any third-party software!
 */
export function generateWindowsInstallerCmd(project: GameProject): string {
  const safeName = project.name.replace(/[^a-zA-Z0-9]/g, '') || 'MyGame';

  return `@echo off
chcp 65001 >nul
title ${project.name} - Windows Setup Wizard
color 0B
cls

echo ===============================================================================
echo            ${project.name} - WINDOWS SETUP WIZARD
echo ===============================================================================
echo.
echo Welcome to the installation setup for %~n0.
echo This wizard will install ${project.name} onto your computer.
echo.
echo Target Installation Directory:
echo   %%LocalAppData%%\\Games\\${safeName}
echo.

set /p CONFIRM="Do you want to proceed with the installation? (Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo Installation cancelled by user.
    pause
    exit /b 0
)

echo.
echo [*] Creating target directory...
set "TARGET_DIR=%LocalAppData%\\Games\\${safeName}"
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

echo [*] Copying game assets and scripts...
xcopy "%~dp0*" "%TARGET_DIR%\\" /E /Y /I >nul

echo [*] Creating Windows Desktop Shortcut...
set "SHORTCUT_SCRIPT=%TEMP%\\create_shortcut_%RANDOM%.vbs"
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%SHORTCUT_SCRIPT%"
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\\${project.name}.lnk" >> "%SHORTCUT_SCRIPT%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%SHORTCUT_SCRIPT%"
echo oLink.TargetPath = "%TARGET_DIR%\\Run_Game.bat" >> "%SHORTCUT_SCRIPT%"
echo oLink.WorkingDirectory = "%TARGET_DIR%" >> "%SHORTCUT_SCRIPT%"
echo oLink.Description = "Play ${project.name}" >> "%SHORTCUT_SCRIPT%"
echo oLink.Save >> "%SHORTCUT_SCRIPT%"
cscript //nologo "%SHORTCUT_SCRIPT%"
del "%SHORTCUT_SCRIPT%" >nul 2>&1

echo [*] Registering Start Menu shortcut...
set "START_MENU_DIR=%AppData%\\Microsoft\\Windows\\Start Menu\\Programs\\${project.name}"
if not exist "%START_MENU_DIR%" mkdir "%START_MENU_DIR%"
set "SHORTCUT_SCRIPT2=%TEMP%\\create_startmenu_%RANDOM%.vbs"
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%SHORTCUT_SCRIPT2%"
echo sLinkFile = "%START_MENU_DIR%\\${project.name}.lnk" >> "%SHORTCUT_SCRIPT2%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%SHORTCUT_SCRIPT2%"
echo oLink.TargetPath = "%TARGET_DIR%\\Run_Game.bat" >> "%SHORTCUT_SCRIPT2%"
echo oLink.WorkingDirectory = "%TARGET_DIR%" >> "%SHORTCUT_SCRIPT2%"
echo oLink.Description = "Play ${project.name}" >> "%SHORTCUT_SCRIPT2%"
echo oLink.Save >> "%SHORTCUT_SCRIPT2%"
cscript //nologo "%SHORTCUT_SCRIPT2%"
del "%SHORTCUT_SCRIPT2%" >nul 2>&1

echo.
echo ===============================================================================
echo            INSTALLATION COMPLETED SUCCESSFULLY!
echo ===============================================================================
echo.
echo [v] Installed to: %TARGET_DIR%
echo [v] Desktop Shortcut created: %USERPROFILE%\\Desktop\\${project.name}.lnk
echo [v] Start Menu shortcut added!
echo.

set /p LAUNCH="Would you like to launch ${project.name} now? (Y/N): "
if /i "%LAUNCH%"=="Y" (
    start "" "%TARGET_DIR%\\Run_Game.bat"
)

echo Thank you for playing!
timeout /t 3 >nul
exit /b 0
`;
}

/**
 * Generates an enhanced Run_Game.bat launcher that:
 * 1. Checks for Java SDK/JRE. If available, compiles and runs the 60FPS Java Swing window.
 * 2. If Java is not installed, automatically falls back to Windows Edge / default browser offline game mode.
 * 3. Never crashes or closes abruptly without explanation.
 */
export function generateWindowsRunBat(project: GameProject): string {
  const className = project.name.replace(/[^a-zA-Z0-9]/g, '') || 'JavaGame';

  return `@echo off
chcp 65001 >nul
title ${project.name} - Desktop Launcher
color 0A
cls

echo ===============================================================================
echo                    ${project.name} - RUNTIME LAUNCHER
echo ===============================================================================
echo.
echo Detecting system runtime environment...

REM 1. Check for Java compiler and runtime
where javac >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [v] Found JDK (javac compiler). Compiling Java 60FPS native window...
    javac -encoding UTF-8 "%~dp0${className}.java"
    if %ERRORLEVEL% EQU 0 (
        echo [v] Compilation successful! Launching desktop game client...
        start "" javaw -cp "%~dp0" ${className}
        exit /b 0
    ) else (
        echo [!] Javac compilation encountered a warning, attempting JAR/offline fallback...
    )
)

where java >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    if exist "%~dp0${className}.jar" (
        echo [v] Launching pre-built Java Archive (${className}.jar)...
        start "" javaw -jar "%~dp0${className}.jar"
        exit /b 0
    )
)

REM 2. Fallback: Launch Offline Standalone Web/Edge Runner
echo.
echo [*] Java runtime not detected or required compiler not found.
echo [*] Launching high-performance Windows Edge / Chrome WebView runner...
echo.

if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (
    start "" "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" --app="%~dp0index.html"
    exit /b 0
)

if exist "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" (
    start "" "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" --app="%~dp0index.html"
    exit /b 0
)

REM 3. Default browser fallback
start "" "%~dp0index.html"
exit /b 0
`;
}

/**
 * Generates self-contained offline HTML5 game for Windows
 */
export function generateWindowsStandaloneHtml(project: GameProject): string {
  const serializedProject = JSON.stringify(project).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${project.name} - Windows Standalone Edition</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0a0d14;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow: hidden;
    }
    #game-container {
      position: relative;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255,255,255,0.1);
      border-radius: 12px;
      overflow: hidden;
      background: ${project.settings.backgroundColor || '#0f172a'};
    }
    canvas {
      display: block;
      background: ${project.settings.backgroundColor || '#0f172a'};
    }
    .hud {
      margin-top: 14px;
      font-size: 13px;
      color: #94a3b8;
      display: flex;
      align-items: center;
      gap: 20px;
      font-family: "Segoe UI", monospace;
    }
    .badge {
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid rgba(56, 189, 248, 0.3);
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div id="game-container">
    <canvas id="gameCanvas" width="${project.settings.canvasWidth || 640}" height="${project.settings.canvasHeight || 360}"></canvas>
  </div>
  <div class="hud">
    <span class="badge">WINDOWS RELEASE</span>
    <span>Game: <strong>${project.name}</strong></span>
    <span>Controls: <strong>WASD / Arrow Keys</strong> to Move, <strong>Space / W</strong> to Jump</span>
  </div>

  <script>
    const PROJECT = ${serializedProject};
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const keys = {};
    window.addEventListener('keydown', e => { 
      keys[e.key.toLowerCase()] = true; 
      if (e.code === 'Space') keys['space'] = true; 
    });
    window.addEventListener('keyup', e => { 
      keys[e.key.toLowerCase()] = false; 
      if (e.code === 'Space') keys['space'] = false; 
    });

    let entities = JSON.parse(JSON.stringify(PROJECT.entities));
    let player = entities.find(e => e.type === 'player') || { x: 40, y: 200, width: 24, height: 32, color: '#38bdf8', speed: 4, jumpPower: 11 };
    let playerVy = 0;
    let isGrounded = false;
    let score = 0;
    let lives = PROJECT.settings.lives || 3;
    let won = false;
    let over = false;

    // Audio synthesizer for sound fx
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null;
    function playBeep(freq, type, duration) {
      try {
        if (!audioCtx) audioCtx = new AudioContextClass();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
      } catch(e) {}
    }

    function checkCollision(a, b) {
      return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
    }

    function loop() {
      if (!won && !over) {
        let moveX = 0;
        if (keys['arrowleft'] || keys['a']) moveX -= (player.speed || 4);
        if (keys['arrowright'] || keys['d']) moveX += (player.speed || 4);
        player.x += moveX;
        if (player.x < 0) player.x = 0;
        if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

        if ((keys['arrowup'] || keys['w'] || keys['space']) && isGrounded) {
          playerVy = -(player.jumpPower || 11);
          isGrounded = false;
          playBeep(420, 'square', 0.12);
        }

        playerVy += 0.5;
        player.y += playerVy;

        isGrounded = false;
        for (let i = entities.length - 1; i >= 0; i--) {
          const ent = entities[i];
          if (ent.type === 'platform') {
            if (player.x + player.width > ent.x && player.x < ent.x + ent.width) {
              if (player.y + player.height >= ent.y && player.y + player.height <= ent.y + 16 && playerVy >= 0) {
                player.y = ent.y - player.height;
                playerVy = 0;
                isGrounded = true;
              }
            }
          }
          if (ent !== player && checkCollision(player, ent)) {
            if (ent.type === 'coin') {
              score += 10;
              entities.splice(i, 1);
              playBeep(880, 'sine', 0.15);
            } else if (ent.type === 'goal') {
              won = true;
              playBeep(1046, 'triangle', 0.4);
            } else if (ent.type === 'enemy' || ent.type === 'hazard') {
              lives--;
              playBeep(180, 'sawtooth', 0.25);
              if (lives <= 0) over = true;
            }
          }
        }
      }

      ctx.fillStyle = PROJECT.settings.backgroundColor || '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      entities.forEach(ent => {
        ctx.fillStyle = ent.color || '#38bdf8';
        if (ent.type === 'coin') {
          ctx.beginPath();
          ctx.arc(ent.x + ent.width/2, ent.y + ent.height/2, ent.width/2, 0, Math.PI*2);
          ctx.fill();
        } else {
          ctx.fillRect(ent.x, ent.y, ent.width, ent.height);
        }
      });

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px "Segoe UI", monospace';
      ctx.fillText('SCORE: ' + score + '  LIVES: ' + lives, 16, 24);

      if (won) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 36px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('VICTORY!', canvas.width/2, canvas.height/2);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.fillText('Press F5 or reload to play again', canvas.width/2, canvas.height/2 + 35);
      } else if (over) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 36px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.fillText('Press F5 or reload to retry', canvas.width/2, canvas.height/2 + 35);
      }

      requestAnimationFrame(loop);
    }
    loop();
  </script>
</body>
</html>`;
}

/**
 * Creates a comprehensive, production-ready .ZIP file containing:
 * 1. Run_Game.bat (1-click double-click launcher)
 * 2. Setup_Windows.cmd (Command line setup installer wizard)
 * 3. InnoSetup_Script.iss (Inno Setup 6 compiler script to generate Setup.exe)
 * 4. ${className}.java (Full Java Swing 60FPS source)
 * 5. index.html (Self-contained offline playable game)
 * 6. build_windows_exe.bat (jpackage & launch4j compilation script)
 * 7. build.gradle & pom.xml (Java Desktop build automation)
 * 8. README_WINDOWS.txt (Full documentation)
 * 9. project.json (Blueprint data)
 * 10. LICENSE.txt
 */
export async function createWindowsZipBundle(project: GameProject): Promise<Blob> {
  const zip = new JSZip();
  const className = project.name.replace(/[^a-zA-Z0-9]/g, '') || 'JavaGame';
  const safeName = project.name.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'my_game';

  // 1. Windows Run Launcher
  zip.file('Run_Game.bat', generateWindowsRunBat(project));

  // 2. Windows Setup Installer (.cmd)
  zip.file('Setup_Windows.cmd', generateWindowsInstallerCmd(project));

  // 3. Inno Setup Compiler Script (.iss)
  zip.file('InnoSetup_Script.iss', generateInnoSetupScript(project));

  // 4. Java Swing Source File
  zip.file(`${className}.java`, generateWindowsJavaGame(project));

  // 5. Standalone Offline HTML Game
  zip.file('index.html', generateWindowsStandaloneHtml(project));

  // 6. Windows EXE Compilation Script
  zip.file('build_windows_exe.bat', `@echo off
echo Packaging ${project.name} to Windows .exe using JDK jpackage...
javac -encoding UTF-8 "${className}.java"
jar cfe "${className}.jar" ${className} *.class
jpackage --type app-image --name "${project.name}" --input . --main-jar "${className}.jar" --main-class ${className} --win-shortcut --win-menu
echo Build complete! Check the "${project.name}" directory.
pause
`);

  // 7. Gradle & Maven build configs
  zip.file('build.gradle', generateGradleBuild(project));
  zip.file('pom.xml', generateMavenPom(project));

  // 8. License & Readme
  zip.file('LICENSE.txt', `MIT License

Copyright (c) ${new Date().getFullYear()} ${project.name}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
`);

  zip.file('README_WINDOWS.txt', `===============================================================================
${project.name.toUpperCase()} - WINDOWS RELEASE PACKAGE
===============================================================================

HOW TO RUN:
-------------------------------------------------------------------------------
Method 1 (Easiest - Direct Run):
  - Simply double-click "Run_Game.bat".
  - If you have Java installed, it runs as a 60FPS high-performance native desktop window!
  - If Java is not installed, it automatically launches the offline standalone Edge runner!

Method 2 (Install to PC with Desktop Shortcut):
  - Right-click "Setup_Windows.cmd" and click "Run".
  - This installs ${project.name} to your user directory and places a shortcut on your Desktop and Start Menu.

Method 3 (Build a Single-File Setup.exe with Inno Setup):
  - Download Inno Setup 6 (https://jrsoftware.org/isdl.php).
  - Open "InnoSetup_Script.iss" and click "Compile" (or press Ctrl+F9).
  - You will get a single "${className}_Setup_v1.0.exe" installer file ready to distribute!

Method 4 (Build Native .EXE with Java):
  - Run "build_windows_exe.bat" to package with JDK jpackage or Launch4j.

-------------------------------------------------------------------------------
Generated by Antigravity Godot Engine
`);

  // 9. Blueprint project data
  zip.file('project.json', JSON.stringify(project, null, 2));

  // Generate the binary blob
  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });
}
