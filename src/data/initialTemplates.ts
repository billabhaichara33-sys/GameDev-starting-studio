import { GameProject } from '../types';

export const STARTER_TEMPLATES: GameProject[] = [
  {
    id: 'template-platformer',
    name: "Pixel Knight's Quest",
    description: "Classic 2D jump & run platformer with coins, moving slimes, platforms, and a castle flag.",
    genre: 'platformer',
    createdAt: Date.now() - 86400000 * 2,
    lastModified: Date.now() - 3600000,
    settings: {
      canvasWidth: 640,
      canvasHeight: 360,
      gravity: 0.5,
      backgroundColor: '#0f172a', // slate-900
      targetScore: 40,
      lives: 3,
    },
    variables: {
      score: 0,
      lives: 3,
      coins: 0,
      hasKey: false,
    },
    entities: [
      {
        id: 'player-1',
        name: 'Knight Hero',
        type: 'player',
        x: 40,
        y: 240,
        width: 24,
        height: 32,
        color: '#38bdf8', // sky-400
        speed: 4,
        jumpPower: 11,
        health: 3,
        maxHealth: 3,
        gravity: true,
        solid: true,
        tag: 'player'
      },
      // Ground floor
      {
        id: 'plat-ground',
        name: 'Grass Ground',
        type: 'platform',
        x: 0,
        y: 320,
        width: 640,
        height: 40,
        color: '#15803d', // green-700
        speed: 0,
        jumpPower: 0,
        health: 1,
        maxHealth: 1,
        gravity: false,
        solid: true,
        tag: 'ground'
      },
      // Elevated platforms
      {
        id: 'plat-1',
        name: 'Floating Brick 1',
        type: 'platform',
        x: 120,
        y: 250,
        width: 100,
        height: 16,
        color: '#854d0e', // stone-700
        speed: 0,
        jumpPower: 0,
        health: 1,
        maxHealth: 1,
        gravity: false,
        solid: true,
      },
      {
        id: 'plat-2',
        name: 'Floating Brick 2',
        type: 'platform',
        x: 270,
        y: 190,
        width: 110,
        height: 16,
        color: '#854d0e',
        speed: 0,
        jumpPower: 0,
        health: 1,
        maxHealth: 1,
        gravity: false,
        solid: true,
      },
      {
        id: 'plat-3',
        name: 'Floating Brick 3',
        type: 'platform',
        x: 430,
        y: 140,
        width: 90,
        height: 16,
        color: '#854d0e',
        speed: 0,
        jumpPower: 0,
        health: 1,
        maxHealth: 1,
        gravity: false,
        solid: true,
      },
      // Collectible coins
      {
        id: 'coin-1',
        name: 'Gold Coin 1',
        type: 'coin',
        x: 160,
        y: 215,
        width: 16,
        height: 16,
        color: '#facc15', // amber-400
        speed: 0,
        jumpPower: 0,
        health: 1,
        maxHealth: 1,
        gravity: false,
        solid: false,
        tag: 'coin'
      },
      {
        id: 'coin-2',
        name: 'Gold Coin 2',
        type: 'coin',
        x: 320,
        y: 155,
        width: 16,
        height: 16,
        color: '#facc15',
        speed: 0,
        jumpPower: 0,
        health: 1,
        maxHealth: 1,
        gravity: false,
        solid: false,
        tag: 'coin'
      },
      {
        id: 'coin-3',
        name: 'Gold Coin 3',
        type: 'coin',
        x: 470,
        y: 105,
        width: 16,
        height: 16,
        color: '#facc15',
        speed: 0,
        jumpPower: 0,
        health: 1,
        maxHealth: 1,
        gravity: false,
        solid: false,
        tag: 'coin'
      },
      {
        id: 'coin-4',
        name: 'Gold Coin 4',
        type: 'coin',
        x: 220,
        y: 290,
        width: 16,
        height: 16,
        color: '#facc15',
        speed: 0,
        jumpPower: 0,
        health: 1,
        maxHealth: 1,
        gravity: false,
        solid: false,
        tag: 'coin'
      },
      // Slime enemy
      {
        id: 'enemy-1',
        name: 'Patrolling Slime',
        type: 'enemy',
        x: 340,
        y: 295,
        width: 24,
        height: 25,
        color: '#a855f7', // purple-500
        speed: 1.5,
        jumpPower: 0,
        health: 1,
        maxHealth: 1,
        gravity: true,
        solid: true,
        patrolDistance: 120,
        direction: 1,
        tag: 'enemy'
      },
      // Spikes hazard
      {
        id: 'hazard-1',
        name: 'Sharp Spikes',
        type: 'hazard',
        x: 480,
        y: 308,
        width: 36,
        height: 12,
        color: '#ef4444', // red-500
        speed: 0,
        jumpPower: 0,
        health: 1,
        maxHealth: 1,
        gravity: false,
        solid: false,
        tag: 'hazard'
      },
      // Castle Goal
      {
        id: 'goal-1',
        name: 'Castle Flag Gate',
        type: 'goal',
        x: 580,
        y: 255,
        width: 32,
        height: 65,
        color: '#f59e0b', // amber-500
        speed: 0,
        jumpPower: 0,
        health: 1,
        maxHealth: 1,
        gravity: false,
        solid: false,
        tag: 'goal'
      }
    ],
    logicRules: [
      {
        id: 'rule-coin-pickup',
        name: 'Collect Gold Coin',
        enabled: true,
        event: {
          type: 'on_collision',
          param: 'coin'
        },
        conditions: [],
        actions: [
          { type: 'change_var', target: 'score', param: 10 },
          { type: 'change_var', target: 'coins', param: 1 },
          { type: 'play_sound', target: 'coin' },
          { type: 'destroy' }
        ]
      },
      {
        id: 'rule-enemy-hit',
        name: 'Touch Enemy or Hazard',
        enabled: true,
        event: {
          type: 'on_collision',
          param: 'enemy'
        },
        conditions: [],
        actions: [
          { type: 'change_var', target: 'lives', param: -1 },
          { type: 'play_sound', target: 'hit' },
          { type: 'message', param: 'Ouch! Lost 1 life!' }
        ]
      },
      {
        id: 'rule-win-flag',
        name: 'Touch Castle Goal',
        enabled: true,
        event: {
          type: 'on_collision',
          param: 'goal'
        },
        conditions: [],
        actions: [
          { type: 'play_sound', target: 'win' },
          { type: 'win', param: 'Stage Cleared! You defeated the dungeon!' }
        ]
      }
    ],
    sprites: [
      {
        id: 'sprite-player',
        name: 'Hero Idle',
        width: 16,
        height: 16,
        fps: 4,
        palette: ['#000000', '#38bdf8', '#fbbf24', '#ffffff', '#e11d48'],
        frames: [
          { id: 1, pixels: Array(256).fill('#38bdf8') }
        ]
      }
    ],
    sounds: [
      {
        id: 'snd-jump',
        name: 'Hero Jump',
        category: 'jump',
        wave: 'square',
        frequency: 200,
        duration: 0.15,
        pitchDrop: 300,
        volume: 0.25
      },
      {
        id: 'snd-coin',
        name: 'Golden Chime',
        category: 'coin',
        wave: 'sine',
        frequency: 980,
        duration: 0.3,
        pitchDrop: 300,
        volume: 0.3
      }
    ]
  },
  {
    id: 'template-shooter',
    name: 'Cosmic Defender 2000',
    description: 'Fast-paced arcade space shooter with laser blasters, asteroids, and alien drones.',
    genre: 'space_shooter',
    createdAt: Date.now() - 86400000,
    lastModified: Date.now() - 7200000,
    settings: {
      canvasWidth: 640,
      canvasHeight: 360,
      gravity: 0,
      backgroundColor: '#030712', // gray-950
      targetScore: 100,
      lives: 3,
    },
    variables: {
      score: 0,
      lives: 3,
      energy: 100,
    },
    entities: [
      {
        id: 'ship-1',
        name: 'Starship Interceptor',
        type: 'player',
        x: 300,
        y: 300,
        width: 28,
        height: 28,
        color: '#06b6d4', // cyan-500
        speed: 5,
        jumpPower: 0,
        health: 3,
        maxHealth: 3,
        gravity: false,
        solid: true,
        tag: 'player'
      },
      {
        id: 'alien-1',
        name: 'Alien Drone Alpha',
        type: 'enemy',
        x: 150,
        y: 60,
        width: 24,
        height: 24,
        color: '#ec4899', // pink-500
        speed: 1.5,
        jumpPower: 0,
        health: 1,
        maxHealth: 1,
        gravity: false,
        solid: true,
        patrolDistance: 80,
        direction: 1,
        tag: 'enemy'
      },
      {
        id: 'alien-2',
        name: 'Alien Drone Beta',
        type: 'enemy',
        x: 360,
        y: 80,
        width: 26,
        height: 26,
        color: '#ec4899',
        speed: 2,
        jumpPower: 0,
        health: 1,
        maxHealth: 1,
        gravity: false,
        solid: true,
        patrolDistance: 140,
        direction: -1,
        tag: 'enemy'
      },
      {
        id: 'hazard-asteroid-1',
        name: 'Drifting Asteroid',
        type: 'hazard',
        x: 240,
        y: 160,
        width: 32,
        height: 32,
        color: '#71717a', // zinc-500
        speed: 0.8,
        jumpPower: 0,
        health: 2,
        maxHealth: 2,
        gravity: false,
        solid: true,
        patrolDistance: 60,
        direction: 1,
        tag: 'hazard'
      },
      {
        id: 'coin-fuel',
        name: 'Energy Core',
        type: 'coin',
        x: 480,
        y: 200,
        width: 16,
        height: 16,
        color: '#10b981', // emerald-500
        speed: 0,
        jumpPower: 0,
        health: 1,
        maxHealth: 1,
        gravity: false,
        solid: false,
        tag: 'coin'
      }
    ],
    logicRules: [
      {
        id: 'rule-shoot-laser',
        name: 'Fire Laser on Key',
        enabled: true,
        event: {
          type: 'key_pressed',
          param: 'Space'
        },
        conditions: [],
        actions: [
          { type: 'play_sound', target: 'laser' },
          { type: 'shoot', target: 'projectile' }
        ]
      },
      {
        id: 'rule-laser-hit-enemy',
        name: 'Destroy Enemy with Laser',
        enabled: true,
        event: {
          type: 'on_collision',
          param: 'enemy'
        },
        conditions: [],
        actions: [
          { type: 'play_sound', target: 'explosion' },
          { type: 'change_var', target: 'score', param: 20 },
          { type: 'destroy' }
        ]
      }
    ],
    sprites: [],
    sounds: [
      {
        id: 'snd-laser',
        name: 'Laser Pulse',
        category: 'laser',
        wave: 'sawtooth',
        frequency: 880,
        duration: 0.12,
        pitchDrop: -600,
        volume: 0.2
      }
    ]
  },
  {
    id: 'template-topdown',
    name: 'Dungeon Crawler & Key',
    description: 'Explore a mysterious dungeon chamber, find bronze keys, unlock ancient doors, and avoid slimes.',
    genre: 'top_down',
    createdAt: Date.now() - 86400000 * 3,
    lastModified: Date.now() - 14400000,
    settings: {
      canvasWidth: 640,
      canvasHeight: 360,
      gravity: 0,
      backgroundColor: '#18181b', // zinc-900
      targetScore: 50,
      lives: 3,
    },
    variables: {
      score: 0,
      hasKey: false,
      lives: 3,
    },
    entities: [
      {
        id: 'wizard-1',
        name: 'Dungeon Mage',
        type: 'player',
        x: 60,
        y: 180,
        width: 24,
        height: 28,
        color: '#8b5cf6', // violet-500
        speed: 3.5,
        jumpPower: 0,
        health: 3,
        maxHealth: 3,
        gravity: false,
        solid: true,
        tag: 'player'
      },
      // Dungeon Wall 1
      {
        id: 'wall-1',
        name: 'North Wall',
        type: 'platform',
        x: 20,
        y: 20,
        width: 600,
        height: 20,
        color: '#3f3f46',
        speed: 0,
        jumpPower: 0,
        health: 1,
        maxHealth: 1,
        gravity: false,
        solid: true,
      },
      // Dungeon Wall 2
      {
        id: 'wall-2',
        name: 'South Wall',
        type: 'platform',
        x: 20,
        y: 320,
        width: 600,
        height: 20,
        color: '#3f3f46',
        speed: 0,
        jumpPower: 0,
        health: 1,
        maxHealth: 1,
        gravity: false,
        solid: true,
      },
      // Center Room Divider
      {
        id: 'wall-divider',
        name: 'Chamber Divider',
        type: 'platform',
        x: 320,
        y: 40,
        width: 20,
        height: 180,
        color: '#3f3f46',
        speed: 0,
        jumpPower: 0,
        health: 1,
        maxHealth: 1,
        gravity: false,
        solid: true,
      },
      // Key
      {
        id: 'dungeon-key',
        name: 'Golden Skeleton Key',
        type: 'key',
        x: 160,
        y: 80,
        width: 18,
        height: 18,
        color: '#fbbf24', // amber-400
        speed: 0,
        jumpPower: 0,
        health: 1,
        maxHealth: 1,
        gravity: false,
        solid: false,
        tag: 'key'
      },
      // Door
      {
        id: 'dungeon-door',
        name: 'Locked Portal Door',
        type: 'door',
        x: 320,
        y: 220,
        width: 20,
        height: 80,
        color: '#b45309', // amber-700
        speed: 0,
        jumpPower: 0,
        health: 1,
        maxHealth: 1,
        gravity: false,
        solid: true,
        tag: 'door'
      },
      // Slime
      {
        id: 'slime-patrol',
        name: 'Acid Slime',
        type: 'enemy',
        x: 440,
        y: 120,
        width: 24,
        height: 24,
        color: '#22c55e', // green-500
        speed: 1.5,
        jumpPower: 0,
        health: 1,
        maxHealth: 1,
        gravity: false,
        solid: true,
        patrolDistance: 100,
        direction: 1,
        tag: 'enemy'
      },
      // Treasure Goal
      {
        id: 'treasure-chest',
        name: 'Treasure Chest',
        type: 'goal',
        x: 540,
        y: 160,
        width: 32,
        height: 32,
        color: '#eab308',
        speed: 0,
        jumpPower: 0,
        health: 1,
        maxHealth: 1,
        gravity: false,
        solid: false,
        tag: 'goal'
      }
    ],
    logicRules: [
      {
        id: 'rule-pickup-key',
        name: 'Collect Key',
        enabled: true,
        event: {
          type: 'on_collision',
          param: 'key'
        },
        conditions: [],
        actions: [
          { type: 'change_var', target: 'hasKey', param: true },
          { type: 'play_sound', target: 'coin' },
          { type: 'message', param: 'Unlocked key collected!' },
          { type: 'destroy' }
        ]
      },
      {
        id: 'rule-open-door',
        name: 'Unlock Door with Key',
        enabled: true,
        event: {
          type: 'on_collision',
          param: 'door'
        },
        conditions: [
          { target: 'hasKey', operator: '==', value: true }
        ],
        actions: [
          { type: 'play_sound', target: 'win' },
          { type: 'destroy' },
          { type: 'message', param: 'The iron door unlocks!' }
        ]
      }
    ],
    sprites: [],
    sounds: []
  },
  {
    id: 'template-puzzle',
    name: 'Gem Slide Puzzle',
    description: 'Solve brain-teasing spatial puzzles by collecting all crystals to unlock the escape portal.',
    genre: 'puzzle',
    createdAt: Date.now() - 86400000 * 4,
    lastModified: Date.now() - 28800000,
    settings: {
      canvasWidth: 640,
      canvasHeight: 360,
      gravity: 0,
      backgroundColor: '#0c0a09', // stone-950
      targetScore: 30,
      lives: 1,
    },
    variables: {
      score: 0,
      gemsLeft: 3,
    },
    entities: [
      {
        id: 'puz-player',
        name: 'Archaeologist',
        type: 'player',
        x: 80,
        y: 180,
        width: 24,
        height: 24,
        color: '#f97316', // orange-500
        speed: 3,
        jumpPower: 0,
        health: 1,
        maxHealth: 1,
        gravity: false,
        solid: true,
        tag: 'player'
      },
      {
        id: 'gem-1',
        name: 'Ruby Crystal',
        type: 'coin',
        x: 200,
        y: 100,
        width: 20,
        height: 20,
        color: '#f43f5e', // rose-500
        speed: 0,
        jumpPower: 0,
        health: 1,
        maxHealth: 1,
        gravity: false,
        solid: false,
        tag: 'coin'
      },
      {
        id: 'gem-2',
        name: 'Sapphire Crystal',
        type: 'coin',
        x: 360,
        y: 240,
        width: 20,
        height: 20,
        color: '#3b82f6', // blue-500
        speed: 0,
        jumpPower: 0,
        health: 1,
        maxHealth: 1,
        gravity: false,
        solid: false,
        tag: 'coin'
      },
      {
        id: 'gem-3',
        name: 'Emerald Crystal',
        type: 'coin',
        x: 480,
        y: 90,
        width: 20,
        height: 20,
        color: '#10b981', // emerald-500
        speed: 0,
        jumpPower: 0,
        health: 1,
        maxHealth: 1,
        gravity: false,
        solid: false,
        tag: 'coin'
      },
      {
        id: 'puz-portal',
        name: 'Exit Portal',
        type: 'goal',
        x: 560,
        y: 170,
        width: 32,
        height: 48,
        color: '#a855f7', // purple-500
        speed: 0,
        jumpPower: 0,
        health: 1,
        maxHealth: 1,
        gravity: false,
        solid: false,
        tag: 'goal'
      }
    ],
    logicRules: [
      {
        id: 'rule-gem-collect',
        name: 'Collect Crystal Gem',
        enabled: true,
        event: {
          type: 'on_collision',
          param: 'coin'
        },
        conditions: [],
        actions: [
          { type: 'change_var', target: 'score', param: 10 },
          { type: 'change_var', target: 'gemsLeft', param: -1 },
          { type: 'play_sound', target: 'coin' },
          { type: 'destroy' }
        ]
      }
    ],
    sprites: [],
    sounds: []
  }
];
