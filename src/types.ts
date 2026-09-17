export type GameGenre = 'platformer' | 'space_shooter' | 'top_down' | 'puzzle';

export type EntityType = 
  | 'player' 
  | 'enemy' 
  | 'platform' 
  | 'coin' 
  | 'hazard' 
  | 'goal' 
  | 'projectile' 
  | 'box' 
  | 'door' 
  | 'key';

export type BodyType = 'dynamic' | 'static' | 'kinematic';

export interface ParticleEmitterConfig {
  enabled: boolean;
  type: 'stream' | 'burst' | 'fountain' | 'explosion';
  count: number;
  rate: number; // particles per second
  speed: number;
  spreadAngle: number; // in degrees, e.g. 45 or 360
  color: string;
  endColor?: string;
  lifetime: number; // in frames or ms
  gravityY: number;
  size: number;
}

export interface GameEntity {
  id: string;
  name: string;
  type: EntityType;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  spriteId?: string;
  speed: number;
  jumpPower: number;
  health: number;
  maxHealth: number;
  gravity: boolean;
  solid: boolean;
  bounciness?: number;
  patrolDistance?: number;
  direction?: number; // 1 or -1
  tag?: string;
  behaviorScript?: string;
  // Real Game Engine Features
  parentId?: string | null; // Scene Graph Node hierarchy
  bodyType?: BodyType; // Physics body classification
  rotation?: number; // in degrees
  scaleX?: number;
  scaleY?: number;
  mass?: number;
  friction?: number;
  collisionLayer?: number; // 1: World, 2: Player, 3: Enemy, 4: Collectible, 5: Projectile
  collisionMask?: number;
  locked?: boolean;
  visible?: boolean;
  zIndex?: number;
  shape?: 'box' | 'circle' | 'triangle';
  particleEmitter?: ParticleEmitterConfig;
  customProperties?: Record<string, string | number | boolean>;
}

export interface LogicCondition {
  target: string; // e.g. 'score', 'player_health', 'has_key'
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=';
  value: string | number | boolean;
}

export interface LogicAction {
  type: 
    | 'change_var' 
    | 'play_sound' 
    | 'jump' 
    | 'move' 
    | 'shoot' 
    | 'destroy' 
    | 'win' 
    | 'game_over' 
    | 'spawn' 
    | 'message';
  target?: string;
  param?: any;
}

export interface LogicRule {
  id: string;
  name: string;
  enabled: boolean;
  event: {
    type: 'on_start' | 'on_update' | 'key_pressed' | 'on_collision' | 'on_destroy';
    param?: string; // key name like 'Space' or entity tag like 'coin'
  };
  conditions: LogicCondition[];
  actions: LogicAction[];
}

export interface SpriteFrame {
  id: number;
  pixels: string[]; // 1D array of hex colors of size width*height
}

export interface SpriteAsset {
  id: string;
  name: string;
  width: number;
  height: number;
  frames: SpriteFrame[];
  fps: number;
  palette: string[];
}

export interface AudioAsset {
  id: string;
  name: string;
  category: 'jump' | 'coin' | 'explosion' | 'laser' | 'hit' | 'win' | 'bgm' | 'step' | 'powerup' | 'ui' | 'ambient';
  wave: 'sine' | 'square' | 'sawtooth' | 'triangle';
  frequency: number;
  duration: number;
  pitchDrop: number;
  volume: number;
  bus?: 'Master' | 'Music' | 'SFX';
  isLooping?: boolean;
  audioUrl?: string;
  tags?: string[];
}

export type EngineComplexityMode = 'beginner' | 'indie' | 'pro';

export interface TileData {
  id: string;
  x: number;
  y: number;
  tileType: 'grass' | 'dirt' | 'stone' | 'metal' | 'water' | 'hazard' | 'coin' | 'cloud';
  color: string;
  solid: boolean;
}

export interface EngineCameraSettings {
  mode: 'follow_player' | 'fixed' | 'free';
  zoom: number; // 0.5 to 2.5
  smoothLerp: number; // 0.05 to 1.0
  deadzoneX: number;
  deadzoneY: number;
  screenShake: number;
  postProcessing: 'none' | 'scanlines' | 'bloom' | 'gameboy' | 'synthwave';
}

export interface AudioMixerSettings {
  masterVolume: number; // 0 to 1
  bgmVolume: number;
  sfxVolume: number;
  ambientVolume: number;
}

// Godot 3D Engine Architecture
export type Node3DType = 
  | 'MeshInstance3D'
  | 'Camera3D'
  | 'DirectionalLight3D'
  | 'OmniLight3D'
  | 'CharacterBody3D'
  | 'StaticBody3D'
  | 'RigidBody3D'
  | 'Area3D';

export type MeshGeometryType = 'box' | 'sphere' | 'cylinder' | 'capsule' | 'plane' | 'torus';

export interface Entity3D {
  id: string;
  name: string;
  nodeType: Node3DType;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number }; // in degrees
  scale: { x: number; y: number; z: number };
  geometry: MeshGeometryType;
  dimensions: { width: number; height: number; depth: number; radius?: number };
  material: {
    color: string;
    roughness: number;
    metallic: number;
    wireframe?: boolean;
    emissive?: string;
  };
  mass?: number;
  velocity?: { x: number; y: number; z: number };
  visible: boolean;
  locked?: boolean;
  parentId?: string | null;
  script?: string;
  lightIntensity?: number;
  lightColor?: string;
}

// Godot AnimationPlayer System
export interface AnimationKeyframe {
  time: number; // in seconds (e.g. 0.0, 0.5, 1.0)
  property: 'position_x' | 'position_y' | 'position_z' | 'rotation' | 'scale' | 'color' | 'opacity';
  value: number | string;
}

export interface AnimationTrack {
  id: string;
  targetNodeId: string;
  property: 'position_x' | 'position_y' | 'position_z' | 'rotation' | 'scale' | 'color' | 'opacity';
  keyframes: AnimationKeyframe[];
}

export interface AnimationClip {
  id: string;
  name: string;
  duration: number; // e.g. 2.0s
  loop: boolean;
  step: number; // e.g. 0.1s
  tracks: AnimationTrack[];
}

// Godot Signals System
export interface GodotSignal {
  id: string;
  name: string; // e.g. "body_entered", "pressed", "timeout"
  sourceNodeId: string;
  targetNodeId: string;
  methodName: string; // e.g. "_on_body_entered"
}

// Godot Audio Bus
export interface GodotAudioBus {
  name: string; // "Master", "BGM", "SFX"
  volumeDb: number; // -80 to +6 dB
  mute: boolean;
  solo: boolean;
  bypassEffects?: boolean;
}

export interface GameProject {
  id: string;
  name: string;
  description: string;
  genre: GameGenre;
  createdAt: number;
  lastModified: number;
  engineMode?: EngineComplexityMode;
  settings: {
    canvasWidth: number;
    canvasHeight: number;
    gravity: number;
    backgroundColor: string;
    targetScore?: number;
    lives: number;
    camera?: EngineCameraSettings;
    audioMixer?: AudioMixerSettings;
    physicsLayerNames?: string[]; // e.g. ['World', 'Player', 'Enemy', 'Collectible', 'Projectile']
  };
  tilemap?: {
    tileSize: number;
    tiles: TileData[];
  };
  entities: GameEntity[];
  entities3D?: Entity3D[];
  animations?: AnimationClip[];
  signals?: GodotSignal[];
  audioBuses?: GodotAudioBus[];
  godotSettings?: {
    renderer: 'Forward+' | 'Mobile' | 'Compatibility';
    currentWorkspace: '2D' | '3D' | 'Script' | 'AssetLib';
    snapEnabled: boolean;
    snapStep: number;
    snapRotation: number;
  };
  logicRules: LogicRule[];
  sprites: SpriteAsset[];
  sounds: AudioAsset[];
  customCode?: string;
  variables: Record<string, number | string | boolean>;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  trackId: string;
  title: string;
  durationMinutes: number;
  xp: number;
  overview: string;
  conceptExploration: string;
  codeSnippet: string;
  interactiveChallenge: {
    description: string;
    starterCode: string;
    solutionKeyword: string;
    hint: string;
  };
  quiz: QuizQuestion;
}

export interface Track {
  id: string;
  title: string;
  description: string;
  icon: string;
  level: 'Beginner' | 'Intermediate' | 'Creative';
  lessons: Lesson[];
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'code' | 'art' | 'sound' | 'design' | 'general';
  unlockedAt?: number;
}

export interface UserProgress {
  xp: number;
  level: number;
  streakDays: number;
  lastActiveDate: string;
  completedLessonIds: string[];
  passedQuizIds: string[];
  unlockedBadgeIds: string[];
  completedChallengeLessonIds?: string[];
  exploredConceptLessonIds?: string[];
  lessonMastery?: Record<string, number>;
  stats: {
    gamesCreated: number;
    playTestsRun: number;
    spritesCreated: number;
    logicBlocksCreated: number;
    codeChallengesSolved: number;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  bio?: string;
  role?: string;
  createdAt: number;
  progress: UserProgress;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface CommunityComment {
  id: string;
  gameId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userLevel: number;
  content: string;
  createdAt: number;
  rating?: number;
}

export interface CommunityGame {
  id: string;
  title: string;
  description: string;
  genre: GameGenre;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorLevel: number;
  createdAt: number;
  updatedAt: number;
  likesCount: number;
  likedBy: string[];
  playCount: number;
  tags: string[];
  thumbnailColor?: string;
  projectData: GameProject;
  commentsCount: number;
  isLiked?: boolean;
}
