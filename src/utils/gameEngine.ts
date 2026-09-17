import { GameProject, GameEntity, EntityType } from '../types';
import { soundManager } from './audioSynth';

export interface DebugLogEntry {
  time: string;
  type: 'info' | 'collision' | 'score' | 'damage' | 'action' | 'warning';
  message: string;
}

export interface EngineCallbacks {
  onScoreChange?: (score: number) => void;
  onLivesChange?: (lives: number) => void;
  onGameOver?: () => void;
  onVictory?: () => void;
  onDebugLog?: (log: DebugLogEntry) => void;
  onVariablesChange?: (vars: Record<string, any>) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private project: GameProject;
  private callbacks: EngineCallbacks;

  // Runtime State
  private running: boolean = false;
  private animationFrameId: number | null = null;
  private entities: GameEntity[] = [];
  private player: GameEntity | null = null;
  private variables: Record<string, any> = {};
  private particles: Particle[] = [];

  // Keys
  private keys: Record<string, boolean> = {};

  // Physics & Status
  private playerVx: number = 0;
  private playerVy: number = 0;
  private isGrounded: boolean = false;
  private invincibleTimer: number = 0;
  private score: number = 0;
  private lives: number = 3;
  private isVictory: boolean = false;
  private isGameOver: boolean = false;

  // Real Game Engine Extensions: Camera, DeltaTime, Profiler
  private camX: number = 0;
  private camY: number = 0;
  private camZoom: number = 1.0;
  private screenShakeIntensity: number = 0;
  private lastTime: number = performance.now();
  private dt: number = 0.016;
  private currentFps: number = 60;
  private frameCount: number = 0;
  private lastFpsUpdate: number = performance.now();
  private drawCallsCount: number = 0;
  private physicsStepMs: number = 0;

  constructor(canvas: HTMLCanvasElement, project: GameProject, callbacks: EngineCallbacks = {}) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D canvas context');
    this.ctx = context;
    this.project = JSON.parse(JSON.stringify(project));
    this.callbacks = callbacks;

    // Apply Camera Settings
    if (this.project.settings.camera) {
      this.camZoom = this.project.settings.camera.zoom || 1.0;
    }

    this.init();
  }

  private log(type: DebugLogEntry['type'], message: string) {
    const time = new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' });
    if (this.callbacks.onDebugLog) {
      this.callbacks.onDebugLog({ time, type, message });
    }
  }

  private init() {
    this.entities = JSON.parse(JSON.stringify(this.project.entities));
    this.variables = { ...this.project.variables };
    this.score = typeof this.variables.score === 'number' ? this.variables.score : 0;
    this.lives = typeof this.variables.lives === 'number' ? this.variables.lives : (this.project.settings.lives || 3);
    this.isVictory = false;
    this.isGameOver = false;
    this.playerVx = 0;
    this.playerVy = 0;
    this.particles = [];

    // Find Player
    const foundPlayer = this.entities.find(e => e.type === 'player');
    this.player = foundPlayer || null;

    if (!this.player) {
      this.log('warning', 'No player entity found in project! Add an entity with Type "Player".');
    } else {
      this.log('info', `Game loaded with player "${this.player.name}" at (${this.player.x}, ${this.player.y})`);
    }

    // Bind keyboard
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  public triggerKey(key: string, isDown: boolean) {
    const standardKey = key.toLowerCase();
    this.keys[standardKey] = isDown;
    if (isDown) {
      this.checkKeyPressRules(key);
    }
  }

  private handleKeyDown(e: KeyboardEvent) {
    const key = e.key.toLowerCase();
    this.keys[key] = true;
    if (e.code === 'Space') {
      this.keys['space'] = true;
      e.preventDefault();
    }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }

    this.checkKeyPressRules(e.code);
  }

  private handleKeyUp(e: KeyboardEvent) {
    const key = e.key.toLowerCase();
    this.keys[key] = false;
    if (e.code === 'Space') {
      this.keys['space'] = false;
    }
  }

  private checkKeyPressRules(keyCode: string) {
    if (!this.player || this.isGameOver || this.isVictory) return;

    for (const rule of this.project.logicRules) {
      if (!rule.enabled) continue;
      if (rule.event.type === 'key_pressed') {
        const targetKey = (rule.event.param || 'Space').toLowerCase();
        if (keyCode.toLowerCase() === targetKey || (targetKey === 'space' && keyCode === 'Space')) {
          this.executeActions(rule.actions, this.player);
        }
      }
    }
  }

  public start() {
    if (this.running) return;
    this.running = true;
    this.log('info', 'Game loop started at 60 FPS.');
    this.loop();
  }

  public stop() {
    this.running = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.log('info', 'Game loop stopped.');
  }

  public restart() {
    this.init();
    if (!this.running) {
      this.start();
    }
  }

  private spawnSparkles(x: number, y: number, color: string = '#facc15', count: number = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        color,
        size: 2 + Math.random() * 3,
        alpha: 1,
        life: 25 + Math.random() * 15
      });
    }
  }

  private executeActions(actions: any[], triggerEntity?: GameEntity) {
    for (const act of actions) {
      if (act.type === 'play_sound') {
        if (act.target === 'coin') soundManager.playCoin();
        else if (act.target === 'jump') soundManager.playJump();
        else if (act.target === 'laser') soundManager.playLaser();
        else if (act.target === 'explosion') soundManager.playExplosion();
        else if (act.target === 'hit') soundManager.playHit();
        else if (act.target === 'win') soundManager.playWin();
      } else if (act.type === 'change_var') {
        const varName = act.target;
        const delta = Number(act.param) || 0;
        this.variables[varName] = (Number(this.variables[varName]) || 0) + delta;
        if (varName === 'score') {
          this.score = this.variables.score;
          this.callbacks.onScoreChange?.(this.score);
          this.log('score', `Score changed by ${delta > 0 ? '+' : ''}${delta}. Current score: ${this.score}`);
        }
        if (varName === 'lives') {
          this.lives = this.variables.lives;
          this.callbacks.onLivesChange?.(this.lives);
          this.log('damage', `Lives updated to: ${this.lives}`);
          if (this.lives <= 0) {
            this.triggerGameOver();
          }
        }
        this.callbacks.onVariablesChange?.(this.variables);
      } else if (act.type === 'shoot') {
        this.spawnPlayerProjectile();
      } else if (act.type === 'destroy') {
        if (triggerEntity) {
          const idx = this.entities.indexOf(triggerEntity);
          if (idx !== -1) {
            this.entities.splice(idx, 1);
            this.spawnSparkles(triggerEntity.x + triggerEntity.width / 2, triggerEntity.y + triggerEntity.height / 2, triggerEntity.color);
          }
        }
      } else if (act.type === 'win') {
        this.triggerVictory(act.param || 'Congratulations, You Won!');
      } else if (act.type === 'game_over') {
        this.triggerGameOver();
      } else if (act.type === 'message') {
        this.log('action', `[Game Message] ${act.param || 'Action triggered'}`);
      }
    }
  }

  private spawnPlayerProjectile() {
    if (!this.player) return;
    const proj: GameEntity = {
      id: `proj-${Date.now()}-${Math.random()}`,
      name: 'Laser Bolt',
      type: 'projectile',
      x: this.player.x + this.player.width / 2 - 2,
      y: this.player.y - 8,
      width: 4,
      height: 12,
      color: '#38bdf8',
      speed: 8,
      jumpPower: 0,
      health: 1,
      maxHealth: 1,
      gravity: false,
      solid: false,
      tag: 'projectile'
    };
    this.entities.push(proj);
    soundManager.playLaser();
    this.log('action', 'Player fired a projectile laser!');
  }

  private triggerVictory(message: string) {
    if (this.isVictory) return;
    this.isVictory = true;
    soundManager.playWin();
    this.log('info', `🏆 VICTORY: ${message}`);
    this.callbacks.onVictory?.();
  }

  private triggerGameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    soundManager.playHit();
    this.log('damage', '💀 GAME OVER! Lives reached 0.');
    this.callbacks.onGameOver?.();
  }

  private handlePlayerCollision(ent: GameEntity, index: number) {
    if (!this.player) return;

    // Check custom logic rules for this collision tag or entity type
    let customRuleMatched = false;
    for (const rule of this.project.logicRules) {
      if (!rule.enabled) continue;
      if (rule.event.type === 'on_collision') {
        const param = (rule.event.param || '').toLowerCase();
        if (param === ent.tag?.toLowerCase() || param === ent.type.toLowerCase()) {
          // Check conditions
          let conditionsMet = true;
          for (const cond of rule.conditions) {
            const currentVal = this.variables[cond.target];
            if (cond.operator === '==' && currentVal !== cond.value) conditionsMet = false;
            if (cond.operator === '!=' && currentVal === cond.value) conditionsMet = false;
            if (cond.operator === '>' && currentVal <= cond.value) conditionsMet = false;
            if (cond.operator === '<' && currentVal >= cond.value) conditionsMet = false;
          }
          if (conditionsMet) {
            customRuleMatched = true;
            this.executeActions(rule.actions, ent);
            this.log('collision', `Collision Rule "${rule.name}" triggered on ${ent.name}!`);
          }
        }
      }
    }

    // Default Fallback Handlers if no custom rule intercepted it
    if (!customRuleMatched) {
      if (ent.type === 'coin') {
        this.score += 10;
        this.callbacks.onScoreChange?.(this.score);
        soundManager.playCoin();
        this.spawnSparkles(ent.x + ent.width / 2, ent.y + ent.height / 2, ent.color || '#facc15');
        this.log('score', `Collected ${ent.name}! +10 points.`);
        this.entities.splice(index, 1);
      } else if (ent.type === 'key') {
        this.variables.hasKey = true;
        this.callbacks.onVariablesChange?.(this.variables);
        soundManager.playCoin();
        this.log('action', `🔑 Collected ${ent.name}! Door can now be unlocked.`);
        this.entities.splice(index, 1);
      } else if (ent.type === 'enemy' || ent.type === 'hazard') {
        if (this.invincibleTimer === 0) {
          this.lives--;
          this.invincibleTimer = 60; // ~1 second invulnerability
          this.callbacks.onLivesChange?.(this.lives);
          soundManager.playHit();
          this.log('damage', `Ouch! Hit ${ent.name}! Remaining lives: ${this.lives}`);
          if (this.lives <= 0) {
            this.triggerGameOver();
          }
        }
      } else if (ent.type === 'goal') {
        this.triggerVictory('Stage Cleared! You reached the goal!');
      }
    }
  }

  private isColliding(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  private resolveHorizontalCollisions() {
    if (!this.player) return;
    // Check entities
    for (const ent of this.entities) {
      if (!ent.solid || ent === this.player || ent.visible === false) continue;
      if (this.isColliding(this.player, ent)) {
        if (this.keys['arrowleft'] || this.keys['a']) {
          this.player.x = ent.x + ent.width;
        } else if (this.keys['arrowright'] || this.keys['d']) {
          this.player.x = ent.x - this.player.width;
        }
      }
    }
    // Check solid tilemap tiles
    const tileSize = this.project.tilemap?.tileSize || 32;
    if (this.project.tilemap?.tiles) {
      for (const t of this.project.tilemap.tiles) {
        if (!t.solid) continue;
        const tileBox = { x: t.x * tileSize, y: t.y * tileSize, width: tileSize, height: tileSize };
        if (this.isColliding(this.player, tileBox)) {
          if (this.keys['arrowleft'] || this.keys['a']) {
            this.player.x = tileBox.x + tileBox.width;
          } else if (this.keys['arrowright'] || this.keys['d']) {
            this.player.x = tileBox.x - this.player.width;
          }
        }
      }
    }
  }

  private resolveVerticalCollisions() {
    if (!this.player) return;
    this.isGrounded = false;
    // Check entities
    for (const ent of this.entities) {
      if (!ent.solid || ent === this.player || ent.visible === false) continue;
      if (this.isColliding(this.player, ent)) {
        if (this.playerVy > 0) {
          this.player.y = ent.y - this.player.height;
          this.playerVy = 0;
          this.isGrounded = true;
        } else if (this.playerVy < 0) {
          this.player.y = ent.y + ent.height;
          this.playerVy = 0;
        }
      }
    }
    // Check solid tilemap tiles
    const tileSize = this.project.tilemap?.tileSize || 32;
    if (this.project.tilemap?.tiles) {
      for (const t of this.project.tilemap.tiles) {
        if (!t.solid) continue;
        const tileBox = { x: t.x * tileSize, y: t.y * tileSize, width: tileSize, height: tileSize };
        if (this.isColliding(this.player, tileBox)) {
          if (this.playerVy > 0) {
            this.player.y = tileBox.y - this.player.height;
            this.playerVy = 0;
            this.isGrounded = true;
          } else if (this.playerVy < 0) {
            this.player.y = tileBox.y + tileBox.height;
            this.playerVy = 0;
          }
        }
      }
    }
  }

  public triggerScreenShake(intensity: number = 8) {
    this.screenShakeIntensity = intensity;
  }

  private updateCamera() {
    if (!this.player) return;
    const camSettings = this.project.settings.camera;
    const lerp = camSettings?.smoothLerp ?? 0.08;
    const targetX = this.player.x + this.player.width / 2 - this.canvas.width / 2;
    const targetY = this.player.y + this.player.height / 2 - this.canvas.height / 2;

    // Smooth lerp
    this.camX += (targetX - this.camX) * lerp;
    this.camY += (targetY - this.camY) * lerp;

    // Shake decay
    if (this.screenShakeIntensity > 0.1) {
      this.screenShakeIntensity *= 0.88;
    } else {
      this.screenShakeIntensity = 0;
    }
  }

  private update() {
    const physicsStart = performance.now();
    if (!this.player || this.isGameOver || this.isVictory) return;

    if (this.invincibleTimer > 0) {
      this.invincibleTimer--;
    }

    const isPlatformer = this.project.genre === 'platformer';
    const speed = this.player.speed || 4;
    let moveX = 0;
    let moveY = 0;

    if (this.keys['arrowleft'] || this.keys['a']) moveX -= speed;
    if (this.keys['arrowright'] || this.keys['d']) moveX += speed;

    if (isPlatformer) {
      const jumpKey = this.keys['arrowup'] || this.keys['w'] || this.keys['space'];
      if (jumpKey && this.isGrounded) {
        this.playerVy = -(this.player.jumpPower || 11);
        this.isGrounded = false;
        soundManager.playJump();
        this.spawnSparkles(this.player.x + this.player.width / 2, this.player.y + this.player.height, '#e2e8f0', 4);
        this.log('action', 'Player jumped!');
      }

      const gravity = this.project.settings.gravity ?? 0.5;
      this.playerVy += gravity;
      if (this.playerVy > 12) this.playerVy = 12;

      this.player.x += moveX;
      this.resolveHorizontalCollisions();

      this.player.y += this.playerVy;
      this.resolveVerticalCollisions();
    } else {
      if (this.keys['arrowup'] || this.keys['w']) moveY -= speed;
      if (this.keys['arrowdown'] || this.keys['s']) moveY += speed;

      this.player.x += moveX;
      this.resolveHorizontalCollisions();

      this.player.y += moveY;
      this.resolveVerticalCollisions();
    }

    // Keep player in bounds horizontally
    if (this.player.x < 0) this.player.x = 0;
    if (this.player.x + this.player.width > this.canvas.width) {
      this.player.x = this.canvas.width - this.player.width;
    }

    // Platformer bottom fall death
    if (isPlatformer && this.player.y > this.canvas.height + 60) {
      this.player.y = 100;
      this.player.x = 40;
      this.playerVy = 0;
      this.lives--;
      this.triggerScreenShake(12);
      this.callbacks.onLivesChange?.(this.lives);
      soundManager.playHit();
      this.log('damage', `Fell into the abyss! Lives remaining: ${this.lives}`);
      if (this.lives <= 0) this.triggerGameOver();
    }

    // Update Enemies (Patrolling)
    for (const ent of this.entities) {
      if (ent.type === 'enemy' && ent.patrolDistance && ent.bodyType !== 'static') {
        const dir = ent.direction || 1;
        ent.x += (ent.speed || 1) * dir;
        if (ent.x <= 0 || ent.x + ent.width >= this.canvas.width) {
          ent.direction = -dir;
        }
      }

      // Update entity particle emitters
      if (ent.particleEmitter && ent.particleEmitter.enabled && Math.random() < (ent.particleEmitter.rate || 10) / 60) {
        const em = ent.particleEmitter;
        const angle = (Math.random() - 0.5) * (em.spreadAngle * Math.PI / 180);
        const speed = em.speed * (0.8 + Math.random() * 0.4);
        this.particles.push({
          x: ent.x + ent.width / 2,
          y: ent.y + ent.height / 2,
          vx: Math.sin(angle) * speed,
          vy: -Math.cos(angle) * speed,
          color: em.color || '#f59e0b',
          size: em.size || 3,
          alpha: 1,
          life: em.lifetime || 30
        });
      }
    }

    // Update Projectiles
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const ent = this.entities[i];
      if (ent.type === 'projectile') {
        ent.y -= ent.speed || 8;
        if (ent.y + ent.height < 0) {
          this.entities.splice(i, 1);
          continue;
        }
        for (let j = this.entities.length - 1; j >= 0; j--) {
          const target = this.entities[j];
          if (target.type === 'enemy' && this.isColliding(ent, target)) {
            soundManager.playExplosion();
            this.triggerScreenShake(6);
            this.spawnSparkles(target.x + target.width / 2, target.y + target.height / 2, '#ec4899', 12);
            this.score += 20;
            this.callbacks.onScoreChange?.(this.score);
            this.log('score', `Laser destroyed ${target.name}! +20 points.`);
            this.entities.splice(j, 1);
            this.entities.splice(i, 1);
            break;
          }
        }
      }
    }

    // Check Player Collisions
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const ent = this.entities[i];
      if (ent === this.player || ent.type === 'platform' || ent.visible === false) continue;

      if (this.isColliding(this.player, ent)) {
        this.handlePlayerCollision(ent, i);
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      p.life--;
      p.alpha = Math.max(0, p.life / 30);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update Camera
    this.updateCamera();

    this.physicsStepMs = Number((performance.now() - physicsStart).toFixed(2));
  }

  private render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.drawCallsCount = 0;

    // Clear background
    ctx.fillStyle = this.project.settings.backgroundColor || '#0f172a';
    ctx.fillRect(0, 0, w, h);
    this.drawCallsCount++;

    ctx.save();

    // Calculate Screen Shake
    let shakeX = 0;
    let shakeY = 0;
    if (this.screenShakeIntensity > 0) {
      shakeX = (Math.random() - 0.5) * this.screenShakeIntensity * 2;
      shakeY = (Math.random() - 0.5) * this.screenShakeIntensity * 2;
    }

    // Apply Camera Transforms
    const camSettings = this.project.settings.camera;
    const zoom = camSettings?.zoom || 1.0;
    if (camSettings?.mode === 'follow_player') {
      ctx.translate(w / 2, h / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-w / 2 - this.camX + shakeX, -h / 2 - this.camY + shakeY);
    } else if (shakeX !== 0 || shakeY !== 0) {
      ctx.translate(shakeX, shakeY);
    }

    // Draw Studio Grid Pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 32;
    for (let x = -gridSize; x < w * 1.5; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, -gridSize);
      ctx.lineTo(x, h * 1.5);
      ctx.stroke();
      this.drawCallsCount++;
    }
    for (let y = -gridSize; y < h * 1.5; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(-gridSize, y);
      ctx.lineTo(w * 1.5, y);
      ctx.stroke();
      this.drawCallsCount++;
    }

    // Render Tilemap Tiles
    if (this.project.tilemap?.tiles) {
      const tileSize = this.project.tilemap.tileSize || 32;
      for (const t of this.project.tilemap.tiles) {
        ctx.fillStyle = t.color || '#15803d';
        ctx.fillRect(t.x * tileSize, t.y * tileSize, tileSize, tileSize);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.strokeRect(t.x * tileSize, t.y * tileSize, tileSize, tileSize);
        this.drawCallsCount++;
      }
    }

    // Render Entities (Except player)
    for (const ent of this.entities) {
      if (ent === this.player || ent.visible === false) continue;
      this.drawEntity(ent);
      this.drawCallsCount++;
    }

    // Render Player
    if (this.player && this.player.visible !== false) {
      if (this.invincibleTimer === 0 || Math.floor(this.invincibleTimer / 6) % 2 === 0) {
        this.drawEntity(this.player);
        this.drawCallsCount++;
      }
    }

    // Render Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      this.drawCallsCount++;
    }

    ctx.restore();

    // Apply Post-Processing Filter Shaders
    this.applyPostProcessing();

    // In-game HUD overlay (Screen Space)
    this.renderHUD();

    // Victory or Game Over banner overlay
    if (this.isVictory) {
      this.renderOverlayBanner('VICTORY!', 'Level Cleared! Press Restart to play again.', '#22c55e');
    } else if (this.isGameOver) {
      this.renderOverlayBanner('GAME OVER', 'Try again! Tip: Learn physics in the Academy!', '#ef4444');
    }
  }

  private applyPostProcessing() {
    const filter = this.project.settings.camera?.postProcessing || 'none';
    if (filter === 'none') return;

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();
    if (filter === 'scanlines') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
      for (let y = 0; y < h; y += 3) {
        ctx.fillRect(0, y, w, 1);
      }
    } else if (filter === 'bloom') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillRect(0, 0, w, h);
    } else if (filter === 'gameboy') {
      ctx.fillStyle = 'rgba(155, 188, 15, 0.25)';
      ctx.globalCompositeOperation = 'color';
      ctx.fillRect(0, 0, w, h);
    } else if (filter === 'synthwave') {
      ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
      ctx.globalCompositeOperation = 'screen';
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  }

  private drawEntity(ent: GameEntity) {
    const ctx = this.ctx;
    ctx.save();

    // Entity Shape / Art
    if (ent.type === 'coin') {
      // Glowing coin
      ctx.fillStyle = ent.color || '#facc15';
      ctx.beginPath();
      ctx.arc(ent.x + ent.width / 2, ent.y + ent.height / 2, ent.width / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (ent.type === 'enemy') {
      // Enemy with cute horns/eyes
      ctx.fillStyle = ent.color || '#a855f7';
      ctx.beginPath();
      ctx.roundRect(ent.x, ent.y, ent.width, ent.height, 6);
      ctx.fill();
      // Eyes
      ctx.fillStyle = '#ffffff';
      const eyeDir = (ent.direction || 1) > 0 ? 3 : -3;
      ctx.fillRect(ent.x + ent.width * 0.25 + eyeDir, ent.y + ent.height * 0.25, 4, 4);
      ctx.fillRect(ent.x + ent.width * 0.65 + eyeDir, ent.y + ent.height * 0.25, 4, 4);
    } else if (ent.type === 'player') {
      // Hero
      ctx.fillStyle = ent.color || '#38bdf8';
      ctx.beginPath();
      ctx.roundRect(ent.x, ent.y, ent.width, ent.height, 4);
      ctx.fill();
      // Eye visor
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ent.x + 4, ent.y + 6, ent.width - 8, 5);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(ent.x + 6, ent.y + 7, 4, 3);
    } else if (ent.type === 'hazard') {
      // Spikes or Asteroid
      ctx.fillStyle = ent.color || '#ef4444';
      ctx.beginPath();
      ctx.moveTo(ent.x, ent.y + ent.height);
      ctx.lineTo(ent.x + ent.width / 2, ent.y);
      ctx.lineTo(ent.x + ent.width, ent.y + ent.height);
      ctx.closePath();
      ctx.fill();
    } else if (ent.type === 'goal') {
      // Castle Flag / Portal
      ctx.fillStyle = ent.color || '#f59e0b';
      ctx.fillRect(ent.x, ent.y, 4, ent.height);
      ctx.beginPath();
      ctx.moveTo(ent.x + 4, ent.y);
      ctx.lineTo(ent.x + ent.width, ent.y + 14);
      ctx.lineTo(ent.x + 4, ent.y + 28);
      ctx.closePath();
      ctx.fill();
    } else if (ent.type === 'door') {
      // Dungeon Door
      ctx.fillStyle = ent.color || '#b45309';
      ctx.fillRect(ent.x, ent.y, ent.width, ent.height);
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(ent.x + 4, ent.y + ent.height / 2 - 4, 4, 8);
    } else {
      // Platform / default solid brick
      ctx.fillStyle = ent.color || '#334155';
      ctx.fillRect(ent.x, ent.y, ent.width, ent.height);
      // Top highlight border
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(ent.x, ent.y, ent.width, 2);
    }

    ctx.restore();
  }

  private renderHUD() {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ffffff';

    // Lives as hearts
    let livesText = 'LIVES: ';
    for (let i = 0; i < this.lives; i++) livesText += '❤️ ';
    ctx.fillText(livesText, 14, 22);

    // Score
    ctx.fillText(`SCORE: ${this.score}`, 180, 22);

    // Has Key indicator
    if (this.variables.hasKey) {
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('🔑 KEY HELD', 320, 22);
    }
    ctx.restore();
  }

  private renderOverlayBanner(title: string, subtitle: string, color: string) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();
    ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.font = 'bold 28px "Space Grotesk", sans-serif';
    ctx.fillStyle = color;
    ctx.fillText(title, w / 2, h / 2 - 10);

    ctx.font = '14px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(subtitle, w / 2, h / 2 + 20);
    ctx.restore();
  }

  private loop() {
    if (!this.running) return;
    const now = performance.now();
    this.dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.frameCount++;
    if (now - this.lastFpsUpdate >= 500) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    this.update();
    this.render();
    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  public getDebugSnapshot() {
    return {
      running: this.running,
      fps: this.currentFps,
      dt: Number(this.dt.toFixed(4)),
      drawCalls: this.drawCallsCount,
      particlesCount: this.particles.length,
      physicsStepMs: this.physicsStepMs,
      camera: {
        x: Math.round(this.camX),
        y: Math.round(this.camY),
        zoom: this.camZoom,
        shake: Number(this.screenShakeIntensity.toFixed(1)),
      },
      player: this.player ? {
        x: Math.round(this.player.x),
        y: Math.round(this.player.y),
        vy: Number(this.playerVy.toFixed(2)),
        isGrounded: this.isGrounded,
        health: this.player.health,
      } : null,
      entitiesCount: this.entities.length,
      score: this.score,
      lives: this.lives,
      variables: { ...this.variables },
      isVictory: this.isVictory,
      isGameOver: this.isGameOver,
    };
  }

  public executeConsoleCommand(cmdStr: string): string {
    const parts = cmdStr.trim().split(/\s+/);
    const cmd = parts[0]?.toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'help':
        return 'Available commands: help, fps, spawn <enemy|coin|platform> <x> <y>, killenemies, setgravity <val>, setspeed <val>, addscore <val>, godmode, teleport <x> <y>, shake <intensity>';
      case 'fps':
        return `Current FPS: ${this.currentFps}, FrameTime: ${(this.dt * 1000).toFixed(1)}ms, DrawCalls: ${this.drawCallsCount}`;
      case 'spawn': {
        const type = args[0] as EntityType;
        const x = Number(args[1]) || (this.player ? this.player.x + 50 : 100);
        const y = Number(args[2]) || (this.player ? this.player.y : 100);
        const newEnt: GameEntity = {
          id: 'console_' + Date.now(),
          name: `Spawned ${type}`,
          type: type || 'coin',
          x,
          y,
          width: 24,
          height: 24,
          color: type === 'enemy' ? '#ef4444' : '#fbbf24',
          speed: 2,
          jumpPower: 0,
          health: 1,
          maxHealth: 1,
          gravity: type === 'enemy',
          solid: type === 'platform',
        };
        this.entities.push(newEnt);
        return `Spawned ${type} at (${x}, ${y})`;
      }
      case 'killenemies': {
        const initialCount = this.entities.length;
        this.entities = this.entities.filter(e => e.type !== 'enemy');
        const removed = initialCount - this.entities.length;
        return `Killed ${removed} enemies!`;
      }
      case 'setgravity': {
        const val = Number(args[0]);
        if (isNaN(val)) return 'Usage: setgravity <number>';
        this.project.settings.gravity = val;
        return `Gravity set to ${val}`;
      }
      case 'setspeed': {
        const val = Number(args[0]);
        if (isNaN(val) || !this.player) return 'Usage: setspeed <number>';
        this.player.speed = val;
        return `Player speed set to ${val}`;
      }
      case 'addscore': {
        const val = Number(args[0]) || 100;
        this.score += val;
        this.callbacks.onScoreChange?.(this.score);
        return `Added ${val} to score. Total: ${this.score}`;
      }
      case 'godmode': {
        this.lives = 999;
        this.callbacks.onLivesChange?.(this.lives);
        return 'God mode activated! Lives set to 999.';
      }
      case 'teleport': {
        const x = Number(args[0]);
        const y = Number(args[1]);
        if (isNaN(x) || isNaN(y) || !this.player) return 'Usage: teleport <x> <y>';
        this.player.x = x;
        this.player.y = y;
        return `Player teleported to (${x}, ${y})`;
      }
      case 'shake': {
        const intensity = Number(args[0]) || 10;
        this.triggerScreenShake(intensity);
        return `Screen shake triggered with intensity ${intensity}`;
      }
      default:
        return `Unknown command "${cmd}". Type "help" for a list of commands.`;
    }
  }
}
