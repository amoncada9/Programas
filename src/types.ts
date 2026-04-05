export interface Entity {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  health: number;
  maxHealth: number;
}

export interface Player extends Entity {
  score: number;
  lives: number;
  isLooping: boolean;
  loopTimer: number;
  lastShot: number;
  powerUpLevel: number;
}

export interface Enemy extends Entity {
  type: 'scout' | 'bomber' | 'boss';
  pattern: 'straight' | 'sine' | 'circle';
  lastShot: number;
  value: number;
}

export interface Bullet extends Entity {
  owner: 'player' | 'enemy';
  damage: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export interface GameState {
  status: 'start' | 'playing' | 'gameover';
  player: Player;
  enemies: Enemy[];
  bullets: Bullet[];
  particles: Particle[];
  scrollOffset: number;
  difficulty: number;
}
