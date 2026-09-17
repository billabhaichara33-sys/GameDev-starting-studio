import { Track, Badge } from '../types';

export const LEARNING_TRACKS: Track[] = [
  {
    id: 'track-basics',
    title: 'Programming Basics for Games',
    description: 'Master variables, loops, conditionals, and how games remember numbers.',
    icon: 'Terminal',
    level: 'Beginner',
    lessons: [
      {
        id: 'lesson-1-variables',
        trackId: 'track-basics',
        title: 'Variables: The Memory Boxes of Your Game',
        durationMinutes: 4,
        xp: 100,
        overview: 'Learn how games remember player lives, high scores, ammunition, and speeds.',
        conceptExploration: `Think of a variable as a labeled cardboard box with a name tag.

Inside the box labeled "score", you can put the number 0. When the player collects a glowing coin, you open the box, add 10, and write down 10.

In code:
let score = 0;
let playerLives = 3;
let playerName = "PixelHero";

Variables can hold numbers, text (strings), or true/false answers (booleans like isGameOver = false).`,
        codeSnippet: `// Defining our starting game variables
let coinsCollected = 0;
let health = 100;
let speed = 4;

// The player grabs a gold star!
coinsCollected = coinsCollected + 1;
console.log("Coins now:", coinsCollected);`,
        interactiveChallenge: {
          description: 'Change the starter code so the player starts with 5 extra lives instead of 3, and add a bonus score of 50!',
          starterCode: `let lives = 3;\nlet score = 0;\n// Update lives to 5 and add 50 to score:\n`,
          solutionKeyword: '5',
          hint: 'Set lives = 5; and score = 50;',
        },
        quiz: {
          question: 'If `let playerCoins = 5;` and the player collects 3 more coins, what is the new value?',
          options: ['5', '8', '3', 'undefined'],
          correctIndex: 1,
          explanation: '5 + 3 = 8! The variable value updates to store the sum of the new coins.',
        }
      },
      {
        id: 'lesson-2-game-loop',
        trackId: 'track-basics',
        title: 'The Game Loop: 60 Heartbeats a Second',
        durationMinutes: 5,
        xp: 120,
        overview: 'Understand the heartbeat that powers every video game on Earth.',
        conceptExploration: `Unlike a regular website that sits waiting for a click, a video game NEVER sleeps!

It runs a continuous loop roughly 60 times every second (60 FPS). In every single frame, three steps happen:
1. PROCESS INPUT (Did the player press the jump key?)
2. UPDATE WORLD (Move characters, calculate gravity, check collisions)
3. RENDER / DRAW (Erase the screen and redraw all characters at their new positions)

If you move a character by 2 pixels per frame, in one second (60 frames) they travel 120 pixels!`,
        codeSnippet: `function gameLoop() {
  handleInput();
  updatePhysics();
  drawGraphics();
  requestAnimationFrame(gameLoop); // Call next frame!
}`,
        interactiveChallenge: {
          description: 'If a character moves at `speed = 3` pixels every frame, calculate their position after 10 frames!',
          starterCode: `let x = 0;\nlet speed = 3;\n// Move x across 10 frames:\nx = speed * 10;\nconsole.log(x);`,
          solutionKeyword: '30',
          hint: '3 multiplied by 10 is 30 pixels!',
        },
        quiz: {
          question: 'What are the three fundamental steps repeated in every frame of a game loop?',
          options: [
            'Input, Update, Render',
            'Download, Install, Play',
            'Sleep, Wait, Stop',
            'Login, Save, Exit'
          ],
          correctIndex: 0,
          explanation: 'Every game loop reads user Input, Updates world state & physics, and Renders graphics to the display.',
        }
      },
      {
        id: 'lesson-3-conditionals',
        trackId: 'track-basics',
        title: 'If Statements: Game Decisions & Rules',
        durationMinutes: 4,
        xp: 110,
        overview: 'Teach your game how to make decisions when conditions are met.',
        conceptExploration: `Games are full of rules:
- IF health <= 0, THEN trigger Game Over!
- IF player reaches the flag, THEN Win!
- IF hasKey == true, THEN open the golden door!

We use conditional statements:
if (condition) {
  // run this action!
}`,
        codeSnippet: `if (health <= 0) {
  playGameOverSound();
  gameState = "GAME_OVER";
} else {
  console.log("Player is still alive!");
}`,
        interactiveChallenge: {
          description: 'Write an if statement check that tests if `coins >= 100` to grant an extra life!',
          starterCode: `let coins = 100;\nlet extraLife = false;\nif (coins >= 100) {\n  extraLife = true;\n}`,
          solutionKeyword: 'true',
          hint: 'Use `if (coins >= 100)` to grant the extraLife.',
        },
        quiz: {
          question: 'Which operator checks if two values are equal in JavaScript game logic?',
          options: ['=', '==', '!=', '+'],
          correctIndex: 1,
          explanation: 'Single = assigns a value, while == (or ===) checks equality!',
        }
      }
    ]
  },
  {
    id: 'track-2d-arch',
    title: '2D Game Architecture & Coordinates',
    description: 'Understand the 2D canvas grid, (X, Y) coordinates, and screen bounds.',
    icon: 'Grid',
    level: 'Beginner',
    lessons: [
      {
        id: 'lesson-4-coords',
        trackId: 'track-2d-arch',
        title: 'The (X, Y) Coordinate Plane in 2D Games',
        durationMinutes: 4,
        xp: 120,
        overview: 'Learn why (0,0) is in the top-left corner and how objects move in 2D.',
        conceptExploration: `In computer graphics and game engines:
- The Origin (X = 0, Y = 0) is at the TOP-LEFT corner of the screen!
- Moving RIGHT increases X (x = x + 5)
- Moving LEFT decreases X (x = x - 5)
- Moving DOWN increases Y (y = y + 5)
- Moving UP decreases Y (y = y - 5)

Notice how Y goes DOWN when it increases? That's the opposite of math school class, but standard across all 2D game engines (Unity, Godot, HTML5 Canvas)!`,
        codeSnippet: `// Moving a character right and jumping up:
player.x += 4;  // moves right
player.y -= 10; // moves UP into the air!`,
        interactiveChallenge: {
          description: 'If player starts at Y=300, and jumps upward by 50 pixels, what should their new Y coordinate be?',
          starterCode: `let startY = 300;\nlet jumpHeight = 50;\n// Calculate newY by subtracting jumpHeight:\nlet newY = startY - jumpHeight;\nconsole.log(newY);`,
          solutionKeyword: '250',
          hint: 'In 2D canvas, moving UP means subtracting from Y: 300 - 50 = 250.',
        },
        quiz: {
          question: 'To move a player character upwards in a standard 2D game engine, what do you do to their Y coordinate?',
          options: ['Increase Y', 'Decrease Y', 'Double X', 'Set Y to zero'],
          correctIndex: 1,
          explanation: 'Because Y=0 is at the top of the screen, moving upward requires decreasing Y!',
        }
      }
    ]
  },
  {
    id: 'track-physics',
    title: 'Game Physics & Movement',
    description: 'Master gravity, velocity, jumping curves, and platform landing.',
    icon: 'Zap',
    level: 'Intermediate',
    lessons: [
      {
        id: 'lesson-5-gravity',
        trackId: 'track-physics',
        title: 'Gravity & Velocity: Why We Don\'t Float Away',
        durationMinutes: 5,
        xp: 150,
        overview: 'Simulate natural gravity pulling characters back down to earth.',
        conceptExploration: `Gravity in games isn't magic—it is simply acceleration!

1. We have a vertical velocity variable: \`vy\` (velocity in Y direction).
2. Every frame, gravity adds to \`vy\`: \`vy += gravity\` (e.g. gravity = 0.5).
3. Then we update the player's position: \`y += vy\`.
4. When the player presses Jump, we give them a negative burst: \`vy = -12\`.
5. As gravity pulls them down frame by frame (-12 -> -11 -> ... -> 0 -> +1 -> +12), they create a gorgeous parabolic arc!`,
        codeSnippet: `let gravity = 0.5;
let vy = 0;
let y = 100;

function updatePhysics() {
  vy += gravity; // Gravity pulls downward
  y += vy;       // Position updates
}`,
        interactiveChallenge: {
          description: 'A player jumps with vy = -10. Gravity is 2. What is vy after 2 frames?',
          starterCode: `let vy = -10;\nlet gravity = 2;\n// Frame 1:\nvy += gravity;\n// Frame 2:\nvy += gravity;\nconsole.log(vy);`,
          solutionKeyword: '-6',
          hint: '-10 + 2 + 2 = -6.',
        },
        quiz: {
          question: 'What mathematical shape does a realistic jump make in a 2D game?',
          options: ['A straight line', 'A parabola (arc)', 'A zigzag', 'A circle'],
          correctIndex: 1,
          explanation: 'Constant downward gravity applied to initial upward velocity creates an elegant parabolic curve.',
        }
      },
      {
        id: 'lesson-6-aabb',
        trackId: 'track-physics',
        title: 'AABB Collisions: Bumping into Walls & Coins',
        durationMinutes: 5,
        xp: 150,
        overview: 'Detect when two rectangular objects overlap or collide.',
        conceptExploration: `AABB stands for Axis-Aligned Bounding Box. It is the fastest collision check in game dev!

Two boxes A and B are touching if all four of these are true:
1. A.right > B.left
2. A.left < B.right
3. A.bottom > B.top
4. A.top < B.bottom

If any of these conditions fail, the boxes are NOT touching!`,
        codeSnippet: `function checkCollision(rectA, rectB) {
  return (
    rectA.x < rectB.x + rectB.width &&
    rectA.x + rectA.width > rectB.x &&
    rectA.y < rectB.y + rectB.height &&
    rectA.y + rectA.height > rectB.y
  );
}`,
        interactiveChallenge: {
          description: 'If player is at x=10 with width=20, and coin is at x=25 with width=10, do their X axes overlap?',
          starterCode: `// player right edge is 10 + 20 = 30\n// coin left edge is 25\nlet overlapsX = (10 + 20 > 25) && (10 < 25 + 10);\nconsole.log(overlapsX);`,
          solutionKeyword: 'true',
          hint: 'Yes! Player reaches x=30, which overlaps with coin at x=25.',
        },
        quiz: {
          question: 'What does AABB stand for in game development physics?',
          options: [
            'Axis-Aligned Bounding Box',
            'Always Avoid Big Bosses',
            'Automatic Action Battle Builder',
            'Audio Amplifier Bass Boost'
          ],
          correctIndex: 0,
          explanation: 'Axis-Aligned Bounding Box is the standard bounding rectangle check without rotation.',
        }
      }
    ]
  },
  {
    id: 'track-design-ui',
    title: 'Level Design, UI & Juice',
    description: 'Learn how to make games feel satisfying, rewarding, and fun.',
    icon: 'Sparkles',
    level: 'Creative',
    lessons: [
      {
        id: 'lesson-7-juice',
        trackId: 'track-design-ui',
        title: 'Game Juice: Screen Shake, Particles & Sound',
        durationMinutes: 4,
        xp: 140,
        overview: 'Transform a boring prototype into a thrilling, tactile experience.',
        conceptExploration: `"Juice" is the visual and auditory feedback that makes actions feel awesome!
- Instead of a coin just disappearing -> pop small golden sparkle particles and play a crisp high-frequency chime!
- Instead of an explosion sitting still -> shake the camera for 3 frames and play a deep bass rumble!
- Squash and stretch: stretch the character slightly when jumping, squash slightly on landing!`,
        codeSnippet: `function collectCoin(coin) {
  soundManager.playCoin();
  spawnSparkles(coin.x, coin.y);
  score += 10;
  destroy(coin);
}`,
        interactiveChallenge: {
          description: 'Name the 3 key ingredients of game juice mentioned in the lesson (sound, particles, shake)',
          starterCode: `let juiceFeatures = ["sound", "particles", "shake"];\nconsole.log(juiceFeatures.length);`,
          solutionKeyword: '3',
          hint: 'Sound effects, visual particle pops, and screen shake!',
        },
        quiz: {
          question: 'What is "Game Juice"?',
          options: [
            'A sweet drink developers sip while coding',
            'Satisfying audio, visual feedback, and particle effects for player actions',
            'The battery percentage of a console',
            'A paid expansion pack'
          ],
          correctIndex: 1,
          explanation: 'Juice refers to the polish, animations, camera effects, and audio punch that make games feel rewarding.',
        }
      }
    ]
  },
  {
    id: 'track-scene-tree',
    title: 'Scene Trees & Node Hierarchies',
    description: 'Learn how modern engines organize worlds with parent-child transforms.',
    icon: 'Layers',
    level: 'Intermediate',
    lessons: [
      {
        id: 'lesson-8-scene-tree',
        trackId: 'track-scene-tree',
        title: 'Scene Trees: Parent & Child Transforms',
        durationMinutes: 5,
        xp: 160,
        overview: 'Understand how moving a parent node automatically transforms all of its child objects.',
        conceptExploration: `In engines like Godot and Unity, everything is a Node in a Scene Tree!
When a child is attached to a parent:
- Child World Position = Parent Position + Child Local Offset
- If a Character walks forward, their held sword, hat, and healthbar move along automatically!
- If the character rotates or scales, the child inherits the same matrix transformations.`,
        codeSnippet: `// Calculating child world position from parent:
let parentWorldX = 200;
let childLocalOffset = 15;
let childWorldX = parentWorldX + childLocalOffset;
console.log("Child is at world coordinate:", childWorldX);`,
        interactiveChallenge: {
          description: 'A player is at X=150. A floating pet companion has a local offset of X=+25. Calculate the pet\'s world X coordinate!',
          starterCode: `let playerX = 150;\nlet petOffset = 25;\nlet petWorldX = playerX + petOffset;\nconsole.log(petWorldX);`,
          solutionKeyword: '175',
          hint: 'Add 150 + 25 = 175.',
        },
        quiz: {
          question: 'What happens to a child node in a scene hierarchy when its parent node moves?',
          options: [
            'It stays frozen where it was born',
            'It moves automatically with its parent, preserving its local offset',
            'It gets destroyed',
            'It resets its coordinates to (0,0)'
          ],
          correctIndex: 1,
          explanation: 'Child nodes inherit their parent transform: moving the parent carries all child nodes automatically.',
        }
      }
    ]
  },
  {
    id: 'track-camera-viewport',
    title: 'Cameras, Smooth Follow & Shaders',
    description: 'Master viewports, linear interpolation (lerp), and retro post-processing filters.',
    icon: 'Eye',
    level: 'Intermediate',
    lessons: [
      {
        id: 'lesson-9-camera-lerp',
        trackId: 'track-camera-viewport',
        title: 'Smooth Camera Follow with Lerp & Deadzones',
        durationMinutes: 5,
        xp: 170,
        overview: 'Use mathematical linear interpolation to create silky-smooth cinematic camera movement.',
        conceptExploration: `A rigid camera that snaps instantly to the player feels jarring and induces motion sickness.
Instead, game engines use Linear Interpolation (LERP):
camera.x += (target.x - camera.x) * smoothSpeed;

Where smoothSpeed is a factor between 0.05 (lazy, floaty camera) and 0.2 (snappy, responsive camera).
Additionally, a "Deadzone" allows the player to take small steps inside a center rectangle before the camera needs to pan at all!`,
        codeSnippet: `// 2D Camera Lerp Step:
function updateCamera(camera, player, lerpFactor = 0.1) {
  camera.x += (player.x - camera.x) * lerpFactor;
  camera.y += (player.y - camera.y) * lerpFactor;
}`,
        interactiveChallenge: {
          description: 'If camera is at X=100, player target is at X=200, and lerpFactor is 0.1, how many pixels does the camera move this frame?',
          starterCode: `let currentX = 100;\nlet targetX = 200;\nlet lerp = 0.1;\nlet delta = (targetX - currentX) * lerp;\nconsole.log(delta);`,
          solutionKeyword: '10',
          hint: '(200 - 100) * 0.1 = 10 pixels.',
        },
        quiz: {
          question: 'What is the primary benefit of using Lerp (Linear Interpolation) for camera movement?',
          options: [
            'It reduces game file download size',
            'It creates smooth, cinematic camera panning instead of rigid snapping',
            'It automatically deletes enemy entities',
            'It turns 2D graphics into 3D models'
          ],
          correctIndex: 1,
          explanation: 'Lerp smoothly closes the distance between current camera and target, producing fluid visual movement.',
        }
      }
    ]
  },
  {
    id: 'track-java-engine',
    title: 'Java Game Development: PC Windows & Android',
    description: 'Learn real Java OOP, game loops, multithreading, and deployment to Windows (.exe/jar) and Android (.apk).',
    icon: 'Coffee',
    level: 'Creative',
    lessons: [
      {
        id: 'lesson-java-oop',
        trackId: 'track-java-engine',
        title: 'Java OOP & Strongly Typed Game Entities',
        durationMinutes: 6,
        xp: 220,
        overview: 'Understand classes, objects, type safety, and encapsulation in game development.',
        conceptExploration: `Java is the gold standard for object-oriented programming (OOP) and powers Minecraft, LibGDX, and Android apps worldwide.

Unlike dynamic scripting languages, Java is strongly typed: every variable must declare what kind of data it stores:
\`\`\`java
int score = 0;              // Integer for counts
double speed = 4.5;         // Double for fractional velocities
boolean isGrounded = true;  // Boolean for physical states
String playerName = "Hero"; // String for text
\`\`\`

Game objects are created as Classes with attributes and behavior methods:
\`\`\`java
public class Player {
    public double x, y;
    public double vy = 0;
    public int lives = 3;

    public void jump() {
        if (isGrounded) {
            this.vy = -12.0;
            this.isGrounded = false;
        }
    }
}
\`\`\``,
        codeSnippet: `// Defining a Java Game Entity class
public class Coin {
    public int x, y;
    public int pointValue = 10;
    public boolean collected = false;

    public void collect(Player player) {
        player.score += pointValue;
        this.collected = true;
        System.out.println("Coin collected! Points: " + player.score);
    }
}`,
        interactiveChallenge: {
          description: 'In Java, complete the calculation: If an enemy starts with int health = 100; and takes int damage = 35;, what is the remaining health?',
          starterCode: `int health = 100;\nint damage = 35;\nint remaining = health - damage;\nSystem.out.println(remaining);`,
          solutionKeyword: '65',
          hint: '100 - 35 = 65.',
        },
        quiz: {
          question: 'In Java, which primitive type is best suited for high-precision 2D physics coordinates and velocities?',
          options: ['String', 'double or float', 'boolean', 'char'],
          correctIndex: 1,
          explanation: 'Floating-point types (double or float) store fractional decimal numbers essential for velocity and gravity.',
        }
      },
      {
        id: 'lesson-java-windows-loop',
        trackId: 'track-java-engine',
        title: 'Windows 60FPS Game Loop & Double Buffering',
        durationMinutes: 7,
        xp: 250,
        overview: 'Build a multithreaded game engine for PC Windows using Java Swing, Runnable, and Graphics2D.',
        conceptExploration: `On Windows, native Java desktop games use a dedicated background Thread that implements Runnable:

\`\`\`java
public class GamePanel extends JPanel implements Runnable {
    private Thread gameThread;
    private boolean running = true;
    private final int FPS = 60;
    private final long targetTime = 1000 / FPS; // 16.6ms

    @Override
    public void run() {
        while (running) {
            update();   // Update character positions & physics
            repaint();  // Draw 60 frames per second on Windows

            try {
                Thread.sleep(targetTime);
            } catch (InterruptedException e) {
                break;
            }
        }
    }
}
\`\`\`

Double Buffering prevents screen flickering by drawing the next frame to an off-screen image before flipping it to the monitor in one atomic raster sweep.`,
        codeSnippet: `// 60 FPS Windows Game Loop Target calculation
int targetFps = 60;
long optimalFrameTimeMs = 1000 / targetFps; // 16 ms per frame
System.out.println("Optimal frame time: " + optimalFrameTimeMs + " ms");`,
        interactiveChallenge: {
          description: 'If a monitor displays 60 frames in 1000 milliseconds, roughly how many milliseconds is each frame? (1000 / 60 rounded to integer)',
          starterCode: `int msInSecond = 1000;\nint fps = 60;\nint msPerFrame = msInSecond / fps;\nSystem.out.println(msPerFrame);`,
          solutionKeyword: '16',
          hint: '1000 / 60 is approximately 16.6 (integer division yields 16).',
        },
        quiz: {
          question: 'What interface must a Java class implement to run its game loop on a dedicated background Thread?',
          options: ['Runnable', 'Serializable', 'Cloneable', 'Comparable'],
          correctIndex: 0,
          explanation: 'Implementing `Runnable` provides the `public void run()` method required by Java Threads for 60FPS game loops.',
        }
      },
      {
        id: 'lesson-java-android',
        trackId: 'track-java-engine',
        title: 'Android Mobile Engine: SurfaceView & Touch Events',
        durationMinutes: 7,
        xp: 260,
        overview: 'Port your game to Android using SurfaceView, Canvas hardware acceleration, and touch controls.',
        conceptExploration: `Android mobile game engines differ from desktop games in two major ways:

1. SurfaceView: Instead of standard UI layouts, high-performance mobile games render onto a dedicated SurfaceView with hardware acceleration.
2. Touch Input: Instead of keyboard arrow keys, Android games receive MotionEvent callbacks:
\`\`\`java
@Override
public boolean onTouchEvent(MotionEvent event) {
    float touchX = event.getX();
    float touchY = event.getY();

    if (event.getAction() == MotionEvent.ACTION_DOWN) {
        if (touchX < getWidth() / 2) {
            moveLeft = true;
        } else {
            jump();
        }
    }
    return true;
}
\`\`\`

Once written, your Android Java project compiles into a native APK package that installs onto phones, tablets, or Google Play!`,
        codeSnippet: `// Android touch event handling example
public boolean handleTouch(float touchX, float touchY, int screenWidth) {
    if (touchX < screenWidth / 2) {
        System.out.println("Left side touch: Move character left");
        return true;
    } else {
        System.out.println("Right side touch: Jump character");
        return true;
    }
}`,
        interactiveChallenge: {
          description: 'An Android phone screen is 1080 pixels wide. The user touches at touchX = 350. Is this on the left half (touchX < 540)? (Output true or false)',
          starterCode: `int screenWidth = 1080;\nint touchX = 350;\nboolean isLeftHalf = touchX < (screenWidth / 2);\nSystem.out.println(isLeftHalf);`,
          solutionKeyword: 'true',
          hint: '350 < 540 is true!',
        },
        quiz: {
          question: 'Which Android view class is specifically engineered for high-performance 60FPS threaded game rendering?',
          options: ['SurfaceView', 'TextView', 'ScrollView', 'LinearLayout'],
          correctIndex: 0,
          explanation: '`SurfaceView` provides a dedicated drawing surface embedded inside a view hierarchy, ideal for background rendering threads.',
        }
      }
    ]
  },
  {
    id: 'track-pro-engine',
    title: 'Real Game Engine Architecture & Lifecycle',
    description: 'Learn component architecture, DeltaTime (dt), and lifecycle hooks.',
    icon: 'Code2',
    level: 'Creative',
    lessons: [
      {
        id: 'lesson-10-engine-lifecycle',
        trackId: 'track-pro-engine',
        title: 'Component Lifecycle: Init, Update & Collision',
        durationMinutes: 6,
        xp: 200,
        overview: 'Master standard game engine hooks: onInit(), onUpdate(dt), onCollisionEnter(), and onDestroy().',
        conceptExploration: `Professional game engines (Godot, Unity, Unreal) use Component-based architectures.
Each entity behavior is governed by precise lifecycle methods:
1. onInit(entity): Runs once when the object is instantiated in memory.
2. onUpdate(entity, dt): Runs every tick of the clock. "dt" (delta time) is the elapsed seconds since the last frame.
3. onCollisionEnter(entity, other): Triggered instantly when two colliders intersect.
4. onDestroy(entity): Cleanup hooks for releasing particle emitters and playing defeat sounds.

Multiplying movement by "dt" (e.g. speed * dt) guarantees that your game runs at the exact same physical speed on a 60 Hz monitor as on a 240 Hz esports screen!`,
        codeSnippet: `class EnemyBehavior {
  onInit(entity) {
    this.speed = 120; // 120 pixels per second
  }

  onUpdate(entity, dt) {
    entity.x += this.speed * dt; // Frame-rate independent!
  }

  onCollisionEnter(entity, other) {
    if (other.tag === "player") {
      other.takeDamage(10);
    }
  }
}`,
        interactiveChallenge: {
          description: 'If a bullet travels at 300 pixels per second, and a frame takes dt = 0.016 seconds (1/60s), how many pixels does it travel this frame? (Round to nearest integer)',
          starterCode: `let speed = 300;\nlet dt = 0.016;\nlet distance = Math.round(speed * dt);\nconsole.log(distance);`,
          solutionKeyword: '5',
          hint: '300 * 0.016 = 4.8, which rounds to 5 pixels.',
        },
        quiz: {
          question: 'Why do professional game engines multiply movement speeds by "dt" (Delta Time)?',
          options: [
            'To make the game run faster in the morning',
            'To ensure movement speed is identical regardless of frame rate fluctuations (60 vs 144 FPS)',
            'To encrypt player coordinates from hackers',
            'To double the jump height automatically'
          ],
          correctIndex: 1,
          explanation: 'Delta time makes gameplay physics frame-rate independent so characters travel at the exact same real-world speed on all hardware.',
        }
      }
    ]
  }
];

export const INITIAL_BADGES: Badge[] = [
  {
    id: 'badge-first-game',
    title: 'Indie Pioneer',
    description: 'Created or started your first game project.',
    icon: 'Gamepad2',
    category: 'general',
  },
  {
    id: 'badge-playtest-master',
    title: 'Test Pilot',
    description: 'Tested your game in the live simulator 3 times.',
    icon: 'PlayCircle',
    category: 'general',
  },
  {
    id: 'badge-logic-architect',
    title: 'Logic Architect',
    description: 'Assembled visual logic rules with events and actions.',
    icon: 'Cpu',
    category: 'code',
  },
  {
    id: 'badge-pixel-artist',
    title: 'Pixel Maestro',
    description: 'Drew and customized a sprite in the Pixel Art Studio.',
    icon: 'Palette',
    category: 'art',
  },
  {
    id: 'badge-sound-designer',
    title: 'Sound Magician',
    description: 'Synthesized custom retro 8-bit sound effects.',
    icon: 'Volume2',
    category: 'sound',
  },
  {
    id: 'badge-academy-scholar',
    title: 'Academy Scholar',
    description: 'Completed your first interactive Academy lesson and quiz.',
    icon: 'GraduationCap',
    category: 'code',
  },
  {
    id: 'badge-streak-fire',
    title: 'Daily Builder',
    description: 'Maintained a game dev coding streak.',
    icon: 'Flame',
    category: 'general',
  }
];
