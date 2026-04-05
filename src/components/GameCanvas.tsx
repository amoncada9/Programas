import React, { useEffect, useRef, useState } from 'react';
import { Player, Enemy, Bullet, Particle, GameState } from '../types';
import { Trophy, Heart, Zap, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const PLAYER_WIDTH = 32;
const PLAYER_HEIGHT = 32;
const ENEMY_WIDTH = 24;
const ENEMY_HEIGHT = 24;
const BULLET_WIDTH = 4;
const BULLET_HEIGHT = 8;

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [loops, setLoops] = useState(3);
  const [dimensions, setDimensions] = useState({ width: 400, height: 600 });

  const stateRef = useRef<GameState & { width: number; height: number }>({
    status: 'start',
    width: 400,
    height: 600,
    player: {
      id: 'player',
      x: 200 - PLAYER_WIDTH / 2,
      y: 500,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      speed: 4,
      health: 1,
      maxHealth: 1,
      score: 0,
      lives: 3,
      isLooping: false,
      loopTimer: 0,
      lastShot: 0,
      powerUpLevel: 1,
    },
    enemies: [],
    bullets: [],
    particles: [],
    scrollOffset: 0,
    difficulty: 1,
  });

  const keysRef = useRef<{ [key: string]: boolean }>({});

  // Handle Resizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        // Maintain a vertical aspect ratio but fill as much as possible
        const targetWidth = Math.min(clientWidth, clientHeight * 0.7);
        const targetHeight = clientHeight;
        
        setDimensions({ width: targetWidth, height: targetHeight });
        stateRef.current.width = targetWidth;
        stateRef.current.height = targetHeight;
        
        // Adjust player position if they go out of bounds after resize
        stateRef.current.player.x = Math.min(stateRef.current.player.x, targetWidth - PLAYER_WIDTH);
        stateRef.current.player.y = Math.min(stateRef.current.player.y, targetHeight - PLAYER_HEIGHT);
      }
    };

    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) observer.observe(containerRef.current);
    updateSize();

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === 'KeyB' || e.code === 'KeyX') {
        triggerLoop();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const triggerLoop = () => {
    const s = stateRef.current;
    if (s.status === 'playing' && !s.player.isLooping && loops > 0) {
      s.player.isLooping = true;
      s.player.loopTimer = 60; // 1 second at 60fps
      setLoops(prev => prev - 1);
    }
  };

  const spawnEnemy = (difficulty: number) => {
    const s = stateRef.current;
    const types: ('scout' | 'bomber')[] = ['scout', 'bomber'];
    const type = types[Math.floor(Math.random() * types.length)];
    const x = Math.random() * (s.width - ENEMY_WIDTH);
    
    const newEnemy: Enemy = {
      id: Math.random().toString(36).substr(2, 9),
      x,
      y: -ENEMY_HEIGHT,
      width: type === 'bomber' ? 32 : 24,
      height: type === 'bomber' ? 32 : 24,
      speed: (Math.random() * 2 + 1) * difficulty,
      health: type === 'bomber' ? 3 : 1,
      maxHealth: type === 'bomber' ? 3 : 1,
      type,
      pattern: Math.random() > 0.5 ? 'sine' : 'straight',
      lastShot: 0,
      value: type === 'bomber' ? 500 : 100,
    };
    s.enemies.push(newEnemy);
  };

  const createExplosion = (x: number, y: number, color: string, count = 10) => {
    for (let i = 0; i < count; i++) {
      stateRef.current.particles.push({
        id: Math.random().toString(36).substr(2, 9),
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1,
        color,
        size: Math.random() * 3 + 1,
      });
    }
  };

  const update = () => {
    const s = stateRef.current;
    if (s.status !== 'playing') return;

    // Player movement
    if (!s.player.isLooping) {
      if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) s.player.x -= s.player.speed;
      if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) s.player.x += s.player.speed;
      if (keysRef.current['ArrowUp'] || keysRef.current['KeyW']) s.player.y -= s.player.speed;
      if (keysRef.current['ArrowDown'] || keysRef.current['KeyS']) s.player.y += s.player.speed;

      // Boundaries
      s.player.x = Math.max(0, Math.min(s.width - s.player.width, s.player.x));
      s.player.y = Math.max(0, Math.min(s.height - s.player.height, s.player.y));

      // Shooting
      if (keysRef.current['Space'] && Date.now() - s.player.lastShot > 150) {
        s.bullets.push({
          id: Math.random().toString(36).substr(2, 9),
          x: s.player.x + s.player.width / 2 - BULLET_WIDTH / 2,
          y: s.player.y,
          width: BULLET_WIDTH,
          height: BULLET_HEIGHT,
          speed: -7,
          health: 1,
          maxHealth: 1,
          owner: 'player',
          damage: 1,
        });
        s.player.lastShot = Date.now();
      }
    } else {
      s.player.loopTimer--;
      if (s.player.loopTimer <= 0) {
        s.player.isLooping = false;
      }
    }

    // Scroll background
    s.scrollOffset = (s.scrollOffset + 1) % s.height;

    // Difficulty increase
    s.difficulty += 0.0001;

    // Spawn enemies
    if (Math.random() < 0.02 * s.difficulty) {
      spawnEnemy(s.difficulty);
    }

    // Update enemies
    s.enemies.forEach((enemy, index) => {
      enemy.y += enemy.speed;
      if (enemy.pattern === 'sine') {
        enemy.x += Math.sin(enemy.y / 30) * 2;
      }
      
      // Enemy shooting
      if (enemy.type === 'bomber' && Date.now() - enemy.lastShot > 2000) {
        s.bullets.push({
          id: Math.random().toString(36).substr(2, 9),
          x: enemy.x + enemy.width / 2,
          y: enemy.y + enemy.height,
          width: BULLET_WIDTH,
          height: BULLET_HEIGHT,
          speed: 4,
          health: 1,
          maxHealth: 1,
          owner: 'enemy',
          damage: 1,
        });
        enemy.lastShot = Date.now();
      }

      // Collision with player
      if (!s.player.isLooping && 
          s.player.x < enemy.x + enemy.width &&
          s.player.x + s.player.width > enemy.x &&
          s.player.y < enemy.y + enemy.height &&
          s.player.y + s.player.height > enemy.y) {
        
        createExplosion(s.player.x + s.player.width / 2, s.player.y + s.player.height / 2, '#ff4444', 20);
        s.player.lives--;
        setLives(s.player.lives);
        s.enemies.splice(index, 1);
        
        if (s.player.lives <= 0) {
          s.status = 'gameover';
          setGameState('gameover');
        } else {
          // Reset player position
          s.player.x = s.width / 2 - PLAYER_WIDTH / 2;
          s.player.y = s.height - 100;
        }
      }

      if (enemy.y > s.height) {
        s.enemies.splice(index, 1);
      }
    });

    // Update bullets
    s.bullets.forEach((bullet, bIndex) => {
      bullet.y += bullet.speed;
      
      if (bullet.owner === 'player') {
        s.enemies.forEach((enemy, eIndex) => {
          if (bullet.x < enemy.x + enemy.width &&
              bullet.x + bullet.width > enemy.x &&
              bullet.y < enemy.y + enemy.height &&
              bullet.y + bullet.height > enemy.y) {
            
            enemy.health -= bullet.damage;
            s.bullets.splice(bIndex, 1);
            
            if (enemy.health <= 0) {
              createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ffaa00');
              s.player.score += enemy.value;
              setScore(s.player.score);
              s.enemies.splice(eIndex, 1);
            }
          }
        });
      } else {
        // Enemy bullet vs Player
        if (!s.player.isLooping &&
            bullet.x < s.player.x + s.player.width &&
            bullet.x + bullet.width > s.player.x &&
            bullet.y < s.player.y + s.player.height &&
            bullet.y + bullet.height > s.player.y) {
          
          s.bullets.splice(bIndex, 1);
          s.player.lives--;
          setLives(s.player.lives);
          createExplosion(s.player.x + s.player.width / 2, s.player.y + s.player.height / 2, '#ff4444', 20);
          
          if (s.player.lives <= 0) {
            s.status = 'gameover';
            setGameState('gameover');
          }
        }
      }

      if (bullet.y < -20 || bullet.y > s.height + 20) {
        s.bullets.splice(bIndex, 1);
      }
    });

    // Update particles
    s.particles.forEach((p, index) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      if (p.life <= 0) s.particles.splice(index, 1);
    });
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const s = stateRef.current;
    ctx.clearRect(0, 0, s.width, s.height);

    // Draw Ocean
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(0, 0, s.width, s.height);

    // Draw Islands (simple scrolling pattern)
    ctx.fillStyle = '#166534';
    for (let i = -1; i < 5; i++) {
      const y = (s.scrollOffset + i * 300) % (s.height * 1.5);
      ctx.beginPath();
      ctx.arc(s.width * 0.2, y, 40, 0, Math.PI * 2);
      ctx.arc(s.width * 0.8, y + 150, 30, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Particles
    s.particles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;

    // Draw Player
    if (s.status === 'playing' || s.status === 'gameover') {
      ctx.save();
      if (s.player.isLooping) {
        const scale = 1 + Math.sin((s.player.loopTimer / 60) * Math.PI) * 0.5;
        ctx.translate(s.player.x + s.player.width / 2, s.player.y + s.player.height / 2);
        ctx.scale(scale, scale);
        ctx.rotate((s.player.loopTimer / 60) * Math.PI * 2);
        ctx.translate(-(s.player.x + s.player.width / 2), -(s.player.y + s.player.height / 2));
        ctx.globalAlpha = 0.7;
      }

      // Simple P-38 style drawing
      ctx.fillStyle = '#94a3b8';
      // Body
      ctx.fillRect(s.player.x + 10, s.player.y, 12, 32);
      // Wings
      ctx.fillRect(s.player.x, s.player.y + 10, 32, 8);
      // Tail
      ctx.fillRect(s.player.x + 4, s.player.y + 28, 24, 4);
      // Cockpit
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(s.player.x + 13, s.player.y + 8, 6, 8);
      
      ctx.restore();
    }

    // Draw Enemies
    s.enemies.forEach(enemy => {
      ctx.fillStyle = enemy.type === 'bomber' ? '#475569' : '#1e293b';
      // Basic plane shape
      ctx.fillRect(enemy.x, enemy.y + 10, enemy.width, 4); // Wings
      ctx.fillRect(enemy.x + enemy.width / 2 - 2, enemy.y, 4, enemy.height); // Body
      
      // Health bar for bombers
      if (enemy.type === 'bomber') {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(enemy.x, enemy.y - 5, enemy.width, 2);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(enemy.x, enemy.y - 5, enemy.width * (enemy.health / enemy.maxHealth), 2);
      }
    });

    // Draw Bullets
    s.bullets.forEach(bullet => {
      ctx.fillStyle = bullet.owner === 'player' ? '#fbbf24' : '#ef4444';
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      update();
      draw(ctx);
      animationFrameId = window.requestAnimationFrame(render);
    };

    render();
    return () => window.cancelAnimationFrame(animationFrameId);
  }, []);

  const startGame = () => {
    const s = stateRef.current;
    stateRef.current = {
      ...s,
      status: 'playing',
      player: {
        id: 'player',
        x: s.width / 2 - PLAYER_WIDTH / 2,
        y: s.height - 100,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        speed: 4,
        health: 1,
        maxHealth: 1,
        score: 0,
        lives: 3,
        isLooping: false,
        loopTimer: 0,
        lastShot: 0,
        powerUpLevel: 1,
      },
      enemies: [],
      bullets: [],
      particles: [],
      scrollOffset: 0,
      difficulty: 1,
    };
    setGameState('playing');
    setScore(0);
    setLives(3);
    setLoops(3);
  };

  return (
    <div ref={containerRef} className="relative flex flex-col items-center justify-center w-full h-screen bg-slate-950 font-mono text-white overflow-hidden">
      {/* Game Container */}
      <div 
        className="relative border-x-4 border-slate-800 shadow-2xl bg-slate-900" 
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="block"
        />

        {/* HUD */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-none">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-lg font-bold tracking-wider">{score.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
              <Heart className="w-4 h-4 text-red-500" />
              <div className="flex gap-1">
                {[...Array(lives)].map((_, i) => (
                  <div key={i} className="w-2 h-2 bg-red-500 rounded-full" />
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
            <RotateCcw className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-bold">LOOPS: {loops}</span>
          </div>
        </div>

        {/* Overlays */}
        <AnimatePresence>
          {gameState === 'start' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10 p-8 text-center"
            >
              <motion.h1 
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                className="text-5xl font-black text-yellow-500 mb-2 italic tracking-tighter"
              >
                SKY FURY
              </motion.h1>
              <p className="text-slate-400 mb-8 text-sm uppercase tracking-widest">Arcade Shooter 1942</p>
              
              <div className="space-y-4 w-full max-w-xs">
                <button 
                  onClick={startGame}
                  className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xl rounded-sm transition-colors uppercase tracking-tight"
                >
                  Insert Coin
                </button>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 uppercase">
                  <div className="bg-white/5 p-2 rounded">Arrows/WASD: Move</div>
                  <div className="bg-white/5 p-2 rounded">Space: Shoot</div>
                  <div className="bg-white/5 p-2 rounded col-span-2">B / X: Loop Maneuver</div>
                </div>
              </div>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/90 backdrop-blur-md z-20 p-8 text-center"
            >
              <h2 className="text-6xl font-black text-white mb-2 italic">GAME OVER</h2>
              <div className="mb-8">
                <p className="text-red-200 text-sm uppercase tracking-widest mb-1">Final Score</p>
                <p className="text-4xl font-bold text-yellow-400">{score.toLocaleString()}</p>
              </div>
              <button 
                onClick={startGame}
                className="px-8 py-3 bg-white text-red-950 font-black text-xl rounded-sm hover:bg-red-100 transition-colors uppercase"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GameCanvas;
