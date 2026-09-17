import { AudioAsset } from '../types';

export const DEFAULT_AUDIO_ASSETS: AudioAsset[] = [
  // Jumps
  {
    id: 'snd_jump_classic',
    name: 'Classic 8-Bit Jump',
    category: 'jump',
    wave: 'square',
    frequency: 150,
    duration: 0.18,
    pitchDrop: 430,
    volume: 0.3,
    bus: 'SFX',
    tags: ['retro', 'movement', 'platformer']
  },
  {
    id: 'snd_jump_spring',
    name: 'Spring Pad Bounce',
    category: 'jump',
    wave: 'sine',
    frequency: 220,
    duration: 0.28,
    pitchDrop: 660,
    volume: 0.35,
    bus: 'SFX',
    tags: ['arcade', 'bounce', 'spring']
  },

  // Pickups & Items
  {
    id: 'snd_coin_gold',
    name: 'Gold Coin Chime',
    category: 'coin',
    wave: 'sine',
    frequency: 988,
    duration: 0.32,
    pitchDrop: 330,
    volume: 0.28,
    bus: 'SFX',
    tags: ['pickup', 'score', 'chime']
  },
  {
    id: 'snd_gem_collect',
    name: 'Crystal Gem Sparkle',
    category: 'coin',
    wave: 'triangle',
    frequency: 1200,
    duration: 0.4,
    pitchDrop: 400,
    volume: 0.3,
    bus: 'SFX',
    tags: ['crystal', 'pickup', 'sparkle']
  },
  {
    id: 'snd_powerup_jingle',
    name: 'Super Star Powerup',
    category: 'powerup',
    wave: 'triangle',
    frequency: 330,
    duration: 0.45,
    pitchDrop: 450,
    volume: 0.35,
    bus: 'SFX',
    tags: ['powerup', 'hero', 'level-up']
  },
  {
    id: 'snd_key_unlock',
    name: 'Dungeon Key Pickup',
    category: 'coin',
    wave: 'sine',
    frequency: 800,
    duration: 0.25,
    pitchDrop: 200,
    volume: 0.25,
    bus: 'SFX',
    tags: ['key', 'quest', 'puzzle']
  },

  // Combat & Weapons
  {
    id: 'snd_laser_plasma',
    name: 'Plasma Blaster Shot',
    category: 'laser',
    wave: 'sawtooth',
    frequency: 880,
    duration: 0.15,
    pitchDrop: -770,
    volume: 0.25,
    bus: 'SFX',
    tags: ['sci-fi', 'weapon', 'projectile']
  },
  {
    id: 'snd_laser_heavy',
    name: 'Heavy Pulse Cannon',
    category: 'laser',
    wave: 'sawtooth',
    frequency: 620,
    duration: 0.22,
    pitchDrop: -540,
    volume: 0.32,
    bus: 'SFX',
    tags: ['heavy', 'cannon', 'boss']
  },
  {
    id: 'snd_explosion_bomb',
    name: 'Mega Bomb Detonation',
    category: 'explosion',
    wave: 'sawtooth',
    frequency: 180,
    duration: 0.5,
    pitchDrop: -140,
    volume: 0.45,
    bus: 'SFX',
    tags: ['blast', 'impact', 'danger']
  },
  {
    id: 'snd_hit_punch',
    name: 'Melee Strike Impact',
    category: 'hit',
    wave: 'sawtooth',
    frequency: 240,
    duration: 0.12,
    pitchDrop: -180,
    volume: 0.3,
    bus: 'SFX',
    tags: ['combat', 'melee', 'damage']
  },
  {
    id: 'snd_hurt_player',
    name: 'Hero Damage Grunt',
    category: 'hit',
    wave: 'triangle',
    frequency: 190,
    duration: 0.2,
    pitchDrop: -120,
    volume: 0.3,
    bus: 'SFX',
    tags: ['player', 'hurt', 'health']
  },

  // Movement & UI
  {
    id: 'snd_step_stone',
    name: 'Footstep Thud',
    category: 'step',
    wave: 'sine',
    frequency: 110,
    duration: 0.08,
    pitchDrop: -50,
    volume: 0.18,
    bus: 'SFX',
    tags: ['footstep', 'walk', 'ground']
  },
  {
    id: 'snd_dash_warp',
    name: 'Sonic Dash Whoosh',
    category: 'step',
    wave: 'triangle',
    frequency: 440,
    duration: 0.22,
    pitchDrop: -300,
    volume: 0.28,
    bus: 'SFX',
    tags: ['dash', 'speed', 'agility']
  },
  {
    id: 'snd_ui_select',
    name: 'Menu Select Click',
    category: 'ui',
    wave: 'sine',
    frequency: 600,
    duration: 0.05,
    pitchDrop: 300,
    volume: 0.18,
    bus: 'SFX',
    tags: ['ui', 'menu', 'button']
  },
  {
    id: 'snd_win_fanfare',
    name: 'Stage Clear Victory',
    category: 'win',
    wave: 'triangle',
    frequency: 523,
    duration: 0.8,
    pitchDrop: 523,
    volume: 0.4,
    bus: 'SFX',
    tags: ['victory', 'fanfare', 'win']
  },

  // Music & Atmospheric Loops
  {
    id: 'snd_bgm_chiptune',
    name: 'Overworld 8-Bit Melody',
    category: 'bgm',
    wave: 'square',
    frequency: 440,
    duration: 1.6,
    pitchDrop: 0,
    volume: 0.25,
    bus: 'Music',
    isLooping: true,
    tags: ['music', 'chiptune', 'adventure']
  },
  {
    id: 'snd_bgm_cyber',
    name: 'Cyberpunk Neon Beats',
    category: 'bgm',
    wave: 'sawtooth',
    frequency: 220,
    duration: 2.0,
    pitchDrop: 0,
    volume: 0.28,
    bus: 'Music',
    isLooping: true,
    tags: ['music', 'synthwave', 'action']
  },
  {
    id: 'snd_bgm_dungeon',
    name: 'Dungeon Ambient Drone',
    category: 'ambient',
    wave: 'sine',
    frequency: 130,
    duration: 2.4,
    pitchDrop: 0,
    volume: 0.22,
    bus: 'Music',
    isLooping: true,
    tags: ['ambient', 'dark', 'dungeon']
  }
];
