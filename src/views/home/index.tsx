// Next, React
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import pkg from '../../../package.json';
import React from 'react';

// ❌ DO NOT EDIT ANYTHING ABOVE THIS LINE

export const HomeView: FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      {/* HEADER – fake Scrolly feed tabs */}
      <header className="flex items-center justify-center border-b border-white/10 py-3">
        <div className="flex items-center gap-2 rounded-full bg-white/5 px-2 py-1 text-[11px]">
          <button className="rounded-full bg-slate-900 px-3 py-1 font-semibold text-white">
            Feed
          </button>
          <button className="rounded-full px-3 py-1 text-slate-400">
            Casino
          </button>
          <button className="rounded-full px-3 py-1 text-slate-400">
            Kids
          </button>
        </div>
      </header>

      {/* MAIN – central game area (phone frame) */}
      <main className="flex flex-1 items-center justify-center px-4 py-3">
        <div className="relative aspect-[9/16] w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 shadow-[0_0_40px_rgba(56,189,248,0.35)]">
          {/* Fake "feed card" top bar inside the phone */}
          <div className="flex items-center justify-between px-3 py-2 text-[10px] text-slate-400">
            <span className="rounded-full bg-white/5 px-2 py-1 text-[9px] uppercase tracking-wide">
              Scrolly Game
            </span>
            <span className="text-[9px] opacity-70">#NoCodeJam</span>
          </div>

          {/* The game lives INSIDE this phone frame */}
          <div className="flex h-[calc(100%-26px)] flex-col items-center justify-start px-3 pb-3 pt-1">
            <GameSandbox />
          </div>
        </div>
      </main>

      {/* FOOTER – tiny version text */}
      <footer className="flex h-5 items-center justify-center border-t border-white/10 px-2 text-[9px] text-slate-500">
        <span>Scrolly · v{pkg.version}</span>
      </footer>
    </div>
  );
};


// ✅ THIS IS THE ONLY PART YOU EDIT FOR THE JAM
// Keep the name `GameSandbox` and the `FC` type.

// Types
interface Obstacle {
  id: number;
  x: number;
  type: 'bar' | 'gap' | 'double';
  gapY?: number;
  gapHeight?: number;
  topHeight?: number;
  bottomY?: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color?: string;
  size?: number;
}

interface Jar {
  id: number;
  x: number; // percent
  y: number; // percent
}

interface Coin {
  id: number;
  x: number;
  y: number;
  collected: boolean;
}

type PowerUpType = 'shield' | 'magnet' | 'slowmo' | 'double';
interface PowerUp {
  id: number;
  x: number;
  y: number;
  type: PowerUpType;
  collected: boolean;
}

interface Achievement {
  id: string;
  name: string;
  icon: string;
  unlocked: boolean;
}

interface Meteor {
  id: number;
  x: number; // percent
  y: number; // percent
  vx: number; // percent per frame
  vy: number;
  size: number; // percent diameter
  rot: number;
  vrot: number;
}

interface Challenge {
  id: string;
  title: string;
  reward: number;
  type: 'daily' | 'weekly' | 'special';
  progress: number;
  target: number;
}

interface ComboEffect {
  type: 'speed' | 'shield' | 'magnet';
  level: number;
  timer: number;
}

type GameState = 'start' | 'playing' | 'dead';
type ThemeType = 'default' | 'cyber' | 'retro' | 'nature';
type DifficultyMode = 'Easy' | 'Medium' | 'Hard';

interface DailyChallenge {
  id: string;
  title: string;
  type: 'survive' | 'collect';
  target: number;
  progress: number;
  unlocked: boolean;
}

// Constants
const GRAVITY = 0.06;
const SCROLL_SENSITIVITY = 1.2;
const MAX_VELOCITY = 5;
const FRICTION = 0.88;
const BASE_OBSTACLE_SPEED = 1.5;
const GAP_SIZE = 28;
const IMMUNITY_DURATION = 5000; // 5 seconds in milliseconds

// Death messages
const deathMessages = [
  "You scrolled too hard.",
  "The feed consumed you.",
  "Doom scrolled.",
  "Scroll addiction: fatal.",
  "Your thumb betrayed you.",
  "Scrolled into the void.",
  "Infinite feed reached.",
  "Better luck next scroll!",
];

const challengesPool: DailyChallenge[] = [
  { id: 'survive_20', title: 'Survive 20 seconds', type: 'survive', target: 20, progress: 0, unlocked: false },
  { id: 'collect_30', title: 'Collect 50 coins', type: 'collect', target: 50, progress: 0, unlocked: false },
  { id: 'survive_35', title: 'Survive 35 seconds', type: 'survive', target: 35, progress: 0, unlocked: false },
  { id: 'collect_20', title: 'Collect 20 coins', type: 'collect', target: 20, progress: 0, unlocked: false },
  { id: 'survive_45', title: 'Survive 45 seconds', type: 'survive', target: 45, progress: 0, unlocked: false },
  { id: 'collect_10', title: 'Collect 10 coins', type: 'collect', target: 10, progress: 0, unlocked: false },
  { id: 'survive_50', title: 'Survive 50 seconds', type: 'survive', target: 50, progress: 0, unlocked: false },
  { id: 'collect_5', title: 'Collect 5 coins', type: 'collect', target: 5, progress: 0, unlocked: false },
  { id: 'survive_15', title: 'Survive 15 seconds', type: 'survive', target: 15, progress: 0, unlocked: false },
  { id: 'collect_32', title: 'Collect 32 coins', type: 'collect', target: 32, progress: 0, unlocked: false },
];

const achievementDefs: Achievement[] = [
  { id: 'first_game', name: 'First Scroll', icon: '🎮', unlocked: false },
  { id: 'survive_10', name: 'Survivor', icon: '⏱️', unlocked: false },
  { id: 'survive_30', name: 'Endurance', icon: '🏆', unlocked: false },
  { id: 'coins_10', name: 'Collector', icon: '💰', unlocked: false },
  { id: 'coins_50', name: 'Rich', icon: '💎', unlocked: false },
  { id: 'near_miss_5', name: 'Daredevil', icon: '😈', unlocked: false },
  { id: 'powerup_all', name: 'Power Player', icon: '⚡', unlocked: false },
];

// High score helpers - SAFE VERSION
const getHighScore = (): number => {
  if (typeof window === 'undefined') return 0;
  const stored = localStorage.getItem('scrollOrDie_highScore');
  return stored ? parseFloat(stored) : 0;
};

const setHighScore = (score: number): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('scrollOrDie_highScore', score.toFixed(1));
};

const GameSandbox: FC = () => {
  // Client-side detection
  const [isClient, setIsClient] = useState(false);
  
  // Core game states
  const [gameState, setGameState] = useState<GameState>('start');
  const [playerY, setPlayerY] = useState(50);
  const [velocity, setVelocity] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScoreState] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [deathMessage, setDeathMessage] = useState('');
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [dangerLevel, setDangerLevel] = useState(0);
  
  // Refs
  const gameRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const lastScrollTime = useRef(0);
  const obstacleIdRef = useRef(0);
  const gameStartTime = useRef(0);
  const lastObstacleTime = useRef(0);
  const playerYRef = useRef(playerY);
  const velocityRef = useRef(0);
  const isTouchingRef = useRef(false);
  const touchStartYRef = useRef(0);
  const lastTouchMoveTime = useRef(0);
  const immunityStartTime = useRef<number | null>(null);

  // Collectibles and power-ups
  const [jars, setJars] = useState<Jar[]>([]);
  const jarIdRef = useRef(0);
  const lastJarTime = useRef(0);
  const [isImmune, setIsImmune] = useState(false);
  const [immunityRemaining, setImmunityRemaining] = useState(0);

  const [coins, setCoins] = useState<Coin[]>([]);
  const coinIdRef = useRef(0);
  const lastCoinTime = useRef(0);

  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const powerUpIdRef = useRef(0);
  const lastPowerUpTime = useRef(0);

  const [trailParticles, setTrailParticles] = useState<Particle[]>([]);
  const particleIdRef = useRef(0);

  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [nearMissCount, setNearMissCount] = useState(0);

  // Power-up states
  const [hasShield, setHasShield] = useState(false);
  const [shieldTimer, setShieldTimer] = useState(0);
  const [hasSlowmo, setHasSlowmo] = useState(false);
  const [slowmoTimer, setSlowmoTimer] = useState(0);
  const [hasDouble, setHasDouble] = useState(false);
  const [doubleTimer, setDoubleTimer] = useState(0);
  const [hasMagnet, setHasMagnet] = useState(false);
  const [magnetTimer, setMagnetTimer] = useState(0);

  // Achievements and sharing
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [totalCoins, setTotalCoins] = useState(0);
  const [coinScore, setCoinScore] = useState(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [usedPowerUps, setUsedPowerUps] = useState<Set<PowerUpType>>(new Set());

  // Meteors
  const [meteors, setMeteors] = useState<Meteor[]>([]);
  const meteorIdRef = useRef(0);
  const lastMeteorTime = useRef(0);

  // Game features
  const [difficultyMode, setDifficultyMode] = useState<DifficultyMode>('Medium');
  const [scoreMultiplier, setScoreMultiplier] = useState(1);
  const [showDoublePopup, setShowDoublePopup] = useState(false);
  const [starOffset, setStarOffset] = useState({ a: 0, b: 0, c: 0 });
  const [gradientHue, setGradientHue] = useState(270);
  const [todayChallenge, setTodayChallenge] = useState<DailyChallenge | null>(null);

  // UI states
  const [activeChallenges] = useState<Challenge[]>([
    { id: 'streak_3', title: 'Play 3 games in a row', reward: 50, type: 'daily', progress: 0, target: 3 },
    { id: 'survive_40', title: 'Survive 40 seconds', reward: 100, type: 'special', progress: 0, target: 40 },
    { id: 'collect_100', title: 'Collect 100 coins', reward: 150, type: 'weekly', progress: 0, target: 100 },
  ]);

  const [comboEffect, setComboEffect] = useState<ComboEffect | null>(null);
  const [theme, setTheme] = useState<ThemeType>('default');
  const [hashtagChallenge] = useState<string>('#ScrollOrDieChallenge');
  const [showChallenges, setShowChallenges] = useState(false);
  const [streak, setStreak] = useState(0);
  const [comboChain, setComboChain] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [showComboText, setShowComboText] = useState(false);
  const [flashEffect, setFlashEffect] = useState(false);
  const [rumbleEffect, setRumbleEffect] = useState(false);
  const [screenTint, setScreenTint] = useState<string>('transparent');
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  // Audio
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lostRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Initialize client-side
  useEffect(() => {
    setIsClient(true);
    lastScrollTime.current = Date.now();
    
    if (typeof window !== 'undefined') {
      // Initialize from localStorage
      const storedHighScore = localStorage.getItem('scrollOrDie_highScore');
      if (storedHighScore) setHighScoreState(parseFloat(storedHighScore));
      
      const storedCoins = localStorage.getItem('scrollOrDie_totalCoins');
      if (storedCoins) setTotalCoins(parseInt(storedCoins) || 0);
      
      const storedAchievements = localStorage.getItem('scrollOrDie_achievements');
      if (storedAchievements) {
        try {
          setUnlockedAchievements(JSON.parse(storedAchievements));
        } catch {
          setUnlockedAchievements([]);
        }
      }
      
      // Initialize daily challenge
      try {
        const days = Math.floor(Date.now() / 86400000);
        const idx = days % challengesPool.length;
        const key = `scrollOrDie_challenge_${days}`;
        const stored = localStorage.getItem(key);
        if (stored) {
          setTodayChallenge(JSON.parse(stored));
        } else {
          const choice = challengesPool[idx];
          localStorage.setItem(key, JSON.stringify(choice));
          setTodayChallenge(choice);
        }
      } catch {
        setTodayChallenge(challengesPool[0]);
      }
      
      // Initialize streak
      const last = localStorage.getItem('scrollOrDie_lastPlayed');
      const currentStreak = localStorage.getItem('scrollOrDie_streak');
      if (last && currentStreak) {
        const lastTime = parseInt(last);
        const now = Date.now();
        const hoursDiff = (now - lastTime) / (1000 * 60 * 60);
        if (hoursDiff < 24) {
          setStreak(parseInt(currentStreak));
        }
      }
    }
  }, []);

  // Audio setup - client only
  useEffect(() => {
    if (!isClient) return;
    
    try {
      const bg = new Audio('/assets/play.wav');
      bg.loop = true;
      bg.volume = 0.45;
      bg.preload = 'auto';
      bg.muted = muted;
      audioRef.current = bg;

      const lost = new Audio('/assets/lost.wav');
      lost.loop = false;
      lost.volume = 0.9;
      lost.preload = 'auto';
      lost.muted = muted;
      lostRef.current = lost;

      return () => {
        bg.pause();
        lost.pause();
        audioRef.current = null;
        lostRef.current = null;
      };
    } catch (error) {
      console.error('Audio setup failed:', error);
    }
  }, [isClient, muted]);

  // Audio playback
  useEffect(() => {
    if (!isClient || !audioRef.current) return;

    const bg = audioRef.current;
    if (gameState === 'playing') {
      bg.muted = muted;
      bg.play().catch(() => {});
      setAudioStarted(true);
    } else {
      bg.pause();
      bg.currentTime = 0;
    }
  }, [gameState, muted, isClient]);

  // Streak system
  useEffect(() => {
    if (gameState === 'dead' && isClient) {
      const now = Date.now();
      const last = localStorage.getItem('scrollOrDie_lastPlayed');
      const currentStreak = localStorage.getItem('scrollOrDie_streak');
      
      if (last) {
        const lastTime = parseInt(last);
        const hoursDiff = (now - lastTime) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          const newStreak = parseInt(currentStreak || '0');
          setStreak(newStreak);
        } else if (hoursDiff < 48) {
          const newStreak = parseInt(currentStreak || '0') + 1;
          setStreak(newStreak);
          localStorage.setItem('scrollOrDie_streak', newStreak.toString());
        } else {
          setStreak(1);
          localStorage.setItem('scrollOrDie_streak', '1');
        }
      } else {
        setStreak(1);
        localStorage.setItem('scrollOrDie_streak', '1');
      }
      
      localStorage.setItem('scrollOrDie_lastPlayed', now.toString());
    }
  }, [gameState, isClient]);

  // Combo system
  useEffect(() => {
    if (coinScore > 0 && coinScore % 5 === 0) {
      const newMultiplier = Math.min(3, 1 + Math.floor(coinScore / 5) * 0.2);
      setComboMultiplier(newMultiplier);
      setComboChain(prev => prev + 1);
      setShowComboText(true);
      setFlashEffect(true);
      
      setTimeout(() => setFlashEffect(false), 200);
      setTimeout(() => setShowComboText(false), 1000);
      
      if (comboChain >= 3) {
        setComboEffect({
          type: ['speed', 'shield', 'magnet'][comboChain % 3] as any,
          level: Math.min(3, Math.floor(comboChain / 3)),
          timer: 300
        });
      }
    }
  }, [coinScore, comboChain]);

  // Sound effects
  const playSound = useCallback((type: 'coin' | 'powerup' | 'death' | 'nearmiss' | 'start' | 'jar') => {
    if (!isClient) return;
    
    try {
      if (typeof window === 'undefined') return;
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'coin') {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start(); osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'powerup') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(); osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'death') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(); osc.stop(ctx.currentTime + 0.5);
      } else if (type === 'nearmiss') {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start(); osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'start') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(550, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(660, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(); osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'jar') {
        osc.frequency.setValueAtTime(330, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(); osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      console.error('Sound error:', e);
    }
  }, [isClient]);

  const toggleMute = () => {
    if (!audioRef.current) return;
    const newMuted = !audioRef.current.muted;
    audioRef.current.muted = newMuted;
    if (lostRef.current) lostRef.current.muted = newMuted;
    setMuted(newMuted);
    if (!audioStarted && isClient) {
      audioRef.current.play().catch(() => {});
      setAudioStarted(true);
    }
  };

  // Game logic helpers
  const getDifficulty = useCallback((time: number) => {
    if (time < 5) return { speed: 1, spawnRate: 2000, label: 'Chill' };
    if (time < 15) return { speed: 1.3, spawnRate: 1500, label: 'Focus' };
    if (time < 25) return { speed: 1.7, spawnRate: 1200, label: 'Panic' };
    return { speed: 2.2, spawnRate: 900, label: 'Chaos' };
  }, []);

  const saveCoinsCollected = useCallback((c: number) => {
    if (!isClient) return;
    try {
      localStorage.setItem('scrollOrDie_totalCoins', c.toString());
    } catch {}
  }, [isClient]);

  const checkAchievement = useCallback((id: string) => {
    if (!unlockedAchievements.includes(id)) {
      const a = achievementDefs.find(x => x.id === id);
      if (a) {
        const updated = [...unlockedAchievements, id];
        if (isClient) {
          try {
            localStorage.setItem('scrollOrDie_achievements', JSON.stringify(updated));
          } catch {}
        }
        setUnlockedAchievements(updated);
        setNewAchievement({ ...a, unlocked: true });
        setTimeout(() => setNewAchievement(null), 2500);
      }
    }
  }, [unlockedAchievements, isClient]);

  // Particle effects
  const createDeathParticles = useCallback((x: number, y: number) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 20; i++) {
      newParticles.push({
        id: i,
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1,
        color: '#00FFFF',
        size: 3,
      });
    }
    setParticles(newParticles);
  }, []);

  const createParticles = useCallback((x: number, y: number, color: string, count: number, spread: number) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x, y,
        vx: (Math.random() - 0.5) * spread,
        vy: (Math.random() - 0.5) * spread,
        life: 1,
        color,
        size: Math.random() * 4 + 2,
      });
    }
    setParticles(p => [...p, ...newParticles]);
  }, []);

  const addTrailParticle = useCallback((x: number, y: number) => {
    const newParticle: Particle = {
      id: particleIdRef.current++,
      x, y,
      vx: -0.5,
      vy: (Math.random() - 0.5) * 0.5,
      life: 0.6,
      color: hasShield ? 'hsl(280 90% 60%)' : 'hsl(200 90% 60%)',
      size: 3,
    };
    setTrailParticles(p => [...p.slice(-20), newParticle]);
  }, [hasShield]);

  // Death handler
  const handleDeath = useCallback((playerX: number, playerYPos: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    if (lostRef.current && isClient) {
      lostRef.current.muted = muted;
      lostRef.current.currentTime = 0;
      lostRef.current.play().catch(() => {});
    }
    
    setGameState('dead');
    const finalScore = score * scoreMultiplier;
    const message = deathMessages[Math.floor(Math.random() * deathMessages.length)];
    setDeathMessage(message);
    createDeathParticles(playerX, playerYPos);
    
    if (todayChallenge && todayChallenge.type === 'survive' && isClient) {
      try {
        const days = Math.floor(Date.now() / 86400000);
        const key = `scrollOrDie_challenge_${days}`;
        const updated = { 
          ...todayChallenge, 
          progress: Math.min(todayChallenge.target, Math.floor(score)) 
        };
        setTodayChallenge(updated);
        localStorage.setItem(key, JSON.stringify(updated));
      } catch {}
    }

    if (finalScore > highScore) {
      setHighScore(finalScore);
      setHighScoreState(finalScore);
      setIsNewRecord(true);
      if (isClient) {
        setHighScore(finalScore);
      }
    } else {
      setIsNewRecord(false);
    }
  }, [score, highScore, createDeathParticles, muted, scoreMultiplier, todayChallenge, isClient]);

  // Spawn functions
  const spawnObstacle = useCallback(() => {
    const types: Array<'bar' | 'gap' | 'double'> = ['bar', 'gap', 'double'];
    const type = types[Math.floor(Math.random() * types.length)];
    const id = obstacleIdRef.current++;
    
    let obstacle: Obstacle = { id, x: 105, type };
    
    if (type === 'bar') {
      obstacle.gapY = Math.random() * 60 + 20;
      obstacle.gapHeight = GAP_SIZE;
    } else if (type === 'gap') {
      obstacle.gapY = Math.random() * 50 + 25;
      obstacle.gapHeight = GAP_SIZE + 5;
    } else {
      obstacle.topHeight = Math.random() * 20 + 15;
      obstacle.bottomY = Math.random() * 20 + 65;
    }
    
    return obstacle;
  }, []);

  const spawnCoin = useCallback((gapY: number) => {
    const id = coinIdRef.current++;
    return { id, x: 110, y: gapY + (Math.random() - 0.5) * 15, collected: false } as Coin;
  }, []);

  const spawnPowerUp = useCallback(() => {
    const types: PowerUpType[] = ['shield', 'magnet', 'slowmo', 'double'];
    const type = types[Math.floor(Math.random() * types.length)];
    const id = powerUpIdRef.current++;
    return { id, x: 110, y: Math.random() * 60 + 20, type, collected: false } as PowerUp;
  }, []);

  const spawnMeteor = useCallback(() => {
    const id = meteorIdRef.current++;
    const side = Math.floor(Math.random() * 4);
    let x = 50, y = 50;
    const size = 3 + Math.random() * 5;

    if (side === 0) {
      x = Math.random() * 120 - 10;
      y = -8;
    } else if (side === 1) {
      x = 110;
      y = Math.random() * 120 - 10;
    } else if (side === 2) {
      x = Math.random() * 120 - 10;
      y = 110;
    } else {
      x = -8;
      y = Math.random() * 120 - 10;
    }

    const degToRad = (d: number) => (d * Math.PI) / 180;
    let angleDeg = 0;
    if (side === 0) angleDeg = 20 + Math.random() * 120;
    if (side === 1) angleDeg = 110 + Math.random() * 140;
    if (side === 2) angleDeg = 200 + Math.random() * 140;
    if (side === 3) angleDeg = -70 + Math.random() * 140;

    const speed = 0.6 + Math.random() * 1.2;
    const vx = Math.cos(degToRad(angleDeg)) * speed;
    const vy = Math.sin(degToRad(angleDeg)) * speed;

    const rot = Math.random() * 360;
    const vrot = (Math.random() - 0.5) * 6;

    return { id, x, y, vx, vy, size, rot, vrot } as Meteor;
  }, []);

  // Activate immunity from jar
  const activateImmunity = useCallback(() => {
    setIsImmune(true);
    immunityStartTime.current = Date.now();
    setImmunityRemaining(5.0);
    playSound('jar');
    createParticles(15, playerYRef.current, '#4ade80', 15, 4);
  }, [playSound, createParticles]);

  // Power-up activation
  const activatePowerUp = useCallback((type: PowerUpType) => {
    const duration = 300;
    switch (type) {
      case 'shield': 
        setHasShield(true); 
        setShieldTimer(duration);
        setScreenTint('rgba(120, 90, 255, 0.1)');
        setTimeout(() => setScreenTint('transparent'), 1000);
        break;
      case 'slowmo': 
        setHasSlowmo(true); 
        setSlowmoTimer(duration);
        setScreenTint('rgba(90, 200, 255, 0.1)');
        setTimeout(() => setScreenTint('transparent'), 1000);
        break;
      case 'double':
        setHasDouble(true); 
        setDoubleTimer(duration);
        setScoreMultiplier(2);
        setShowDoublePopup(true);
        setRumbleEffect(true);
        setTimeout(() => setRumbleEffect(false), 500);
        setTimeout(() => setShowDoublePopup(false), 2200);
        break;
      case 'magnet': 
        setHasMagnet(true); 
        setMagnetTimer(duration);
        setScreenTint('rgba(255, 90, 200, 0.1)');
        setTimeout(() => setScreenTint('transparent'), 1000);
        break;
    }
  }, []);

  const getPowerUpColor = (type: PowerUpType) => {
    switch (type) {
      case 'shield': return 'hsl(280 90% 60%)';
      case 'slowmo': return 'hsl(180 90% 50%)';
      case 'double': return 'hsl(45 100% 50%)';
      case 'magnet': return 'hsl(320 90% 55%)';
      default: return 'hsl(0 0% 100%)';
    }
  };

  const getPowerUpIcon = (type: PowerUpType) => {
    switch (type) {
      case 'shield': return '🛡️';
      case 'slowmo': return '⏱️';
      case 'double': return '2️⃣';
      case 'magnet': return '🧲';
      default: return '⚡';
    }
  };

  // Collision detection
  const checkCollision = useCallback((pY: number, obs: Obstacle[]): boolean => {
    if (isImmune) return false;
    
    const playerLeft = 15;
    const playerRight = 15 + 4;
    const playerTop = pY - 2;
    const playerBottom = pY + 2;

    for (const o of obs) {
      const obsLeft = o.x - 3;
      const obsRight = o.x + 3;

      if (playerRight > obsLeft && playerLeft < obsRight) {
        if (o.type === 'bar' || o.type === 'gap') {
          const gapTop = (o.gapY || 50) - (o.gapHeight || GAP_SIZE) / 2;
          const gapBottom = (o.gapY || 50) + (o.gapHeight || GAP_SIZE) / 2;
          if (playerTop < gapTop || playerBottom > gapBottom) {
            return true;
          }
        } else if (o.type === 'double') {
          if (playerTop < (o.topHeight || 20) || playerBottom > (o.bottomY || 80)) {
            return true;
          }
        }
      }
    }
    return false;
  }, [isImmune]);

  const checkMeteorCollision = useCallback((pY: number, ms: Meteor[]) => {
    if (isImmune) return false;
    
    const px = 15;
    const pr = 2.5;
    for (const m of ms) {
      const dx = Math.abs(m.x - px);
      const dy = Math.abs(m.y - pY);
      const mr = m.size / 2;
      if (Math.sqrt(dx * dx + dy * dy) < (mr + pr)) return true;
    }
    return false;
  }, [isImmune]);

  // Main game loop
  useEffect(() => {
    if (gameState !== 'playing' || !isClient) return;

    let lastTime = 0;
    
    const loop = (currentTime: number) => {
      const deltaTime = lastTime ? Math.min((currentTime - lastTime) / 16.67, 2) : 1;
      lastTime = currentTime;
      
      const now = Date.now();
      const elapsed = (now - gameStartTime.current) / 1000;
      const difficulty = getDifficulty(elapsed);
      const modeFactor = difficultyMode === 'Easy' ? 0.8 : difficultyMode === 'Hard' ? 1.4 : 1;
      const adjSpeed = difficulty.speed * modeFactor;

      setScore(elapsed);
      
      // Update immunity timer
      if (isImmune && immunityStartTime.current) {
        const immunityElapsed = (now - immunityStartTime.current) / 1000;
        const remaining = Math.max(0, 5 - immunityElapsed);
        setImmunityRemaining(remaining);
        
        if (remaining <= 0) {
          setIsImmune(false);
          immunityStartTime.current = null;
          setImmunityRemaining(0);
        }
      }

      // Visual effects
      setGradientHue(270 + Math.min(90, elapsed * 1.6));
      setStarOffset(prev => ({
        a: (prev.a + (velocityRef.current || 0) * 0.08 + elapsed * 0.02) % 100,
        b: (prev.b + (velocityRef.current || 0) * 0.14 + elapsed * 0.04) % 100,
        c: (prev.c + (velocityRef.current || 0) * 0.22 + elapsed * 0.06) % 100,
      }));

      // Physics
      setVelocity(v => {
        const newV = (v + GRAVITY * deltaTime) * Math.pow(FRICTION, deltaTime);
        const clamped = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, newV));
        velocityRef.current = clamped;
        return clamped;
      });

      // Player movement
      setPlayerY(y => {
        const newY = y + velocityRef.current * deltaTime;
        
        if (Math.random() < 0.28 * deltaTime) {
          addTrailParticle(15, newY);
        }
        
        if (newY < 5 || newY > 95) {
          handleDeath(15, newY);
          return Math.max(5, Math.min(95, newY));
        }
        return newY;
      });

      // Spawn obstacles
      if (now - lastObstacleTime.current > (difficulty.spawnRate / modeFactor)) {
        const newObs = spawnObstacle();
        setObstacles(obs => [...obs, newObs]);
        if (Math.random() < 0.6) setCoins(c => [...c, spawnCoin(newObs.gapY || 50)]);
        lastObstacleTime.current = now;
      }

      // Spawn jars (immunity)
      if (now - lastJarTime.current > 8000 + Math.random() * 6000) {
        const id = jarIdRef.current++;
        const newJar: Jar = { id, x: 105, y: Math.random() * 80 + 10 };
        setJars(j => [...j, newJar]);
        lastJarTime.current = now;
      }

      // Spawn meteors
      if (now - lastMeteorTime.current > 10000 + Math.random() * 8000) {
        setMeteors(ms => [...ms, spawnMeteor()]);
        lastMeteorTime.current = now;
      }

      // Spawn power-ups
      if (now - lastPowerUpTime.current > 10000 && Math.random() < 0.25) {
        setPowerUps(p => [...p, spawnPowerUp()]);
        lastPowerUpTime.current = now;
      }

      // Update obstacles
      setObstacles(obs => {
        const speed = BASE_OBSTACLE_SPEED * adjSpeed * deltaTime;
        return obs
          .map(o => ({ ...o, x: o.x - speed }))
          .filter(o => o.x > -10);
      });

      // Update jars
      setJars(js => {
        const speed = BASE_OBSTACLE_SPEED * adjSpeed * deltaTime;
        return js
          .map(j => ({ ...j, x: j.x - speed }))
          .filter(j => j.x > -10);
      });

      // Update coins with magnet effect
      setCoins(prev => {
        const speed = BASE_OBSTACLE_SPEED * adjSpeed * deltaTime;
        const remaining: Coin[] = [];
        prev.forEach(coin => {
          if (coin.collected) return;
          let newX = coin.x - speed;
          let newY = coin.y;
          
          if (hasMagnet) {
            const dx = 15 - coin.x;
            const dy = playerYRef.current - coin.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 30) {
              newX += dx * 0.15 * deltaTime;
              newY += dy * 0.15 * deltaTime;
            }
          }

          const dxP = 15 - newX;
          const dyP = playerYRef.current - newY;
          const distP = Math.sqrt(dxP * dxP + dyP * dyP);
          if (distP < 4.5) {
            const gained = hasDouble ? 2 : 1;
            setCoinScore(s => s + gained);
            setTotalCoins(tc => { 
              const n = tc + gained; 
              saveCoinsCollected(n); 
              return n; 
            });
            playSound('coin');
            createParticles(15, newY, '#FFD700', 8, 2);
            
            if (todayChallenge && todayChallenge.type === 'collect' && isClient) {
              try {
                const days = Math.floor(Date.now() / 86400000);
                const key = `scrollOrDie_challenge_${days}`;
                const updated = { 
                  ...todayChallenge, 
                  progress: Math.min(todayChallenge.target, todayChallenge.progress + 1) 
                };
                setTodayChallenge(updated);
                localStorage.setItem(key, JSON.stringify(updated));
              } catch {}
            }
          } else {
            if (newX > -10) remaining.push({ ...coin, x: newX, y: newY });
          }
        });
        return remaining;
      });

      // Check jar collection
      setJars(js => {
        const remaining: Jar[] = [];
        js.forEach(jar => {
          const dx = Math.abs(jar.x - 15);
          const dy = Math.abs(jar.y - playerYRef.current);
          
          if (dx < 4 && dy < 6) {
            // Jar collected!
            activateImmunity();
            createParticles(jar.x, jar.y, '#4ade80', 12, 6);
          } else {
            remaining.push(jar);
          }
        });
        return remaining.filter(j => j.x > -10);
      });

      // Update power-ups
      setPowerUps(p => {
        const speed = BASE_OBSTACLE_SPEED * adjSpeed * deltaTime;
        return p.map(pu => ({ ...pu, x: pu.x - speed }))
                .filter(pu => pu.x > -10 && !pu.collected);
      });

      // Check power-up collection
      setPowerUps(p => {
        return p.map(pu => {
          if (pu.collected) return pu;
          const dx = 15 - pu.x;
          const dy = playerYRef.current - pu.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 6) {
            playSound('powerup');
            createParticles(pu.x, pu.y, getPowerUpColor(pu.type), 12, 8);
            setUsedPowerUps(prev => new Set([...prev, pu.type]));
            activatePowerUp(pu.type);
            return { ...pu, collected: true };
          }
          return pu;
        });
      });

      // Check collisions
      const hitObstacle = checkCollision(playerYRef.current, obstacles);
      const hitMeteor = checkMeteorCollision(playerYRef.current, meteors);
      
      if (hitObstacle || hitMeteor) {
        handleDeath(15, playerYRef.current);
      }

      // Update danger level
      setDangerLevel(d => Math.max(0, d - 0.02 * deltaTime));

      // Update meteors
      setMeteors(ms => {
        return ms
          .map(m => ({ 
            ...m, 
            x: m.x + m.vx * deltaTime, 
            y: m.y + m.vy * deltaTime, 
            rot: (m.rot + m.vrot * deltaTime) % 360 
          }))
          .filter(m => m.x > -20 && m.x < 120 && m.y > -20 && m.y < 120);
      });

      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [
    gameState, isImmune, difficultyMode, getDifficulty, spawnObstacle, spawnCoin, 
    spawnPowerUp, spawnMeteor, checkCollision, checkMeteorCollision, handleDeath, 
    playSound, createParticles, addTrailParticle, activatePowerUp, activateImmunity,
    hasMagnet, hasDouble, todayChallenge, isClient, saveCoinsCollected
  ]);

  // Particle updates
  useEffect(() => {
    if (!isClient || (particles.length === 0 && trailParticles.length === 0)) return;

    const interval = setInterval(() => {
      setParticles(p =>
        p.map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          life: particle.life - 0.05,
        })).filter(particle => particle.life > 0)
      );
      setTrailParticles(tp =>
        tp.map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          life: particle.life - 0.08,
        })).filter(particle => particle.life > 0)
      );
    }, 30);

    return () => clearInterval(interval);
  }, [particles.length, trailParticles.length, isClient]);

  // Sync refs
  useEffect(() => { 
    playerYRef.current = playerY; 
  }, [playerY]);

  // Power-up timers
  useEffect(() => {
    if (!isClient) return;
    
    let iv: number | undefined;
    const active = shieldTimer > 0 || slowmoTimer > 0 || doubleTimer > 0 || magnetTimer > 0;
    if (!active) return;
    
    iv = window.setInterval(() => {
      setShieldTimer(s => Math.max(0, s - 1));
      setSlowmoTimer(s => Math.max(0, s - 1));
      setMagnetTimer(s => Math.max(0, s - 1));
      setDoubleTimer(s => {
        const ns = Math.max(0, s - 1);
        if (ns === 0) {
          setHasDouble(false);
          setScoreMultiplier(1);
        }
        return ns;
      });
      if (shieldTimer <= 1) setHasShield(false);
      if (slowmoTimer <= 1) setHasSlowmo(false);
      if (magnetTimer <= 1) setHasMagnet(false);
    }, 1000 / 60);

    return () => { if (iv) clearInterval(iv); };
  }, [shieldTimer, slowmoTimer, doubleTimer, magnetTimer, isClient]);

  // Input handling
  const handleInput = useCallback((delta: number, isTouch = false) => {
    if (gameState === 'start') {
      setGameState('playing');
      gameStartTime.current = Date.now();
      lastObstacleTime.current = Date.now();
      lastCoinTime.current = Date.now();
      lastPowerUpTime.current = Date.now();
      playSound('start');
      return;
    }

    if (gameState === 'playing') {
      const now = Date.now();
      const timeDiff = Math.max(1, now - lastScrollTime.current);
      
      const scrollSpeed = Math.abs(delta) / timeDiff;
      const danger = Math.min(1, scrollSpeed / (isTouch ? 30 : 5));
      setDangerLevel(d => Math.min(1, d + danger * 0.3));

      const forceMultiplier = isTouch ? 0.12 : 0.08;
      const scrollForce = -delta * SCROLL_SENSITIVITY * forceMultiplier;
      
      setVelocity(v => {
        const newV = v + scrollForce;
        const clamped = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, newV));
        velocityRef.current = clamped;
        return clamped;
      });

      lastScrollTime.current = now;
    }
  }, [gameState, playSound]);

  // Wheel (desktop) handler
  useEffect(() => {
    if (!isClient) return;
    
    const gameEl = gameRef.current;
    if (!gameEl) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      handleInput(e.deltaY, false);
    };

    gameEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => gameEl.removeEventListener('wheel', handleWheel);
  }, [handleInput, isClient]);

  // TOUCH HANDLERS - FIXED FOR MOBILE
  useEffect(() => {
    if (!isClient) return;
    
    const gameEl = gameRef.current;
    if (!gameEl) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        isTouchingRef.current = true;
        touchStartYRef.current = e.touches[0].clientY;
        lastTouchMoveTime.current = Date.now();
        
        if (gameState === 'start') {
          setGameState('playing');
          gameStartTime.current = Date.now();
          lastObstacleTime.current = Date.now();
          playSound('start');
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTouchingRef.current || e.touches.length === 0) return;
      e.preventDefault();
      
      const currentY = e.touches[0].clientY;
      const currentTime = Date.now();
      const deltaY = touchStartYRef.current - currentY;
      const timeDiff = Math.max(1, currentTime - lastTouchMoveTime.current);
      
      // Apply input with momentum
      handleInput(deltaY * 0.5, true);
      
      touchStartYRef.current = currentY;
      lastTouchMoveTime.current = currentTime;
    };

    const handleTouchEnd = () => {
      isTouchingRef.current = false;
      // Apply gentle deceleration
      setTimeout(() => {
        setVelocity(v => v * 0.95);
      }, 50);
    };

    // Also handle mouse for desktop touchscreens
    const handleMouseDown = (e: MouseEvent) => {
      if (gameState === 'start') {
        setGameState('playing');
        gameStartTime.current = Date.now();
        lastObstacleTime.current = Date.now();
        playSound('start');
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (e.buttons === 1) { // Left mouse button pressed
        const deltaY = e.movementY;
        handleInput(deltaY * 2, false);
      }
    };

    // Add all event listeners
    gameEl.addEventListener('touchstart', handleTouchStart, { passive: false });
    gameEl.addEventListener('touchmove', handleTouchMove, { passive: false });
    gameEl.addEventListener('touchend', handleTouchEnd);
    gameEl.addEventListener('mousedown', handleMouseDown);
    gameEl.addEventListener('mousemove', handleMouseMove);

    return () => {
      gameEl.removeEventListener('touchstart', handleTouchStart);
      gameEl.removeEventListener('touchmove', handleTouchMove);
      gameEl.removeEventListener('touchend', handleTouchEnd);
      gameEl.removeEventListener('mousedown', handleMouseDown);
      gameEl.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gameState, handleInput, playSound, isClient]);

  // Reset game
  const resetGame = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (lostRef.current) {
      lostRef.current.pause();
      lostRef.current.currentTime = 0;
    }

    setGameState('start');
    setPlayerY(50);
    setVelocity(0);
    velocityRef.current = 0;
    setObstacles([]);
    setScore(0);
    setParticles([]);
    setDangerLevel(0);
    setIsNewRecord(false);
    setIsImmune(false);
    setImmunityRemaining(0);
    immunityStartTime.current = null;
    obstacleIdRef.current = 0;
    setCoins([]);
    setPowerUps([]);
    setTrailParticles([]);
    coinIdRef.current = 0;
    powerUpIdRef.current = 0;
    particleIdRef.current = 0;
    setCoinScore(0);
    setCombo(0);
    setShowCombo(false);
    setNearMissCount(0);
    setUsedPowerUps(new Set());
    setJars([]);
    setMeteors([]);
    setHasShield(false);
    setHasSlowmo(false);
    setHasDouble(false);
    setHasMagnet(false);
    setScoreMultiplier(1);
    setShieldTimer(0);
    setSlowmoTimer(0);
    setDoubleTimer(0);
    setMagnetTimer(0);
    setShowDoublePopup(false);
    setComboEffect(null);
    setComboChain(0);
    setComboMultiplier(1);
    setFlashEffect(false);
    setRumbleEffect(false);
    setScreenTint('transparent');
  };

  // Share function - FIXED FOR MOBILE CLICKS
  const shareScore = () => {
    if (!isClient) return;
    
    try {
      const pageUrl = window.location.href;
      const finalScore = score * scoreMultiplier;
      const hashtags = ['ScrollyGameJam', 'NoCodeJam', 'ScrollOrDie'];
      const randomHashtag = hashtags[Math.floor(Math.random() * hashtags.length)];
      
      const text = `🎮 I scored ${finalScore.toFixed(1)}s in #ScrollOrDie! ${hashtagChallenge} ${randomHashtag}\n\nCan you beat my score? ${pageUrl}`;
      const intent = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
      
      // Use window.open for better mobile compatibility
      const newWindow = window.open(intent, '_blank');
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // Fallback for mobile browsers
        window.location.href = intent;
      }
    } catch (e) {
      // Fallback to simple tweet URL
      window.open('https://x.com/intent/tweet', '_blank');
    }
  };

  const startFromModal = () => {
    setShowInstructions(false);
    if (gameState === 'start') {
      setGameState('playing');
      gameStartTime.current = Date.now();
      lastObstacleTime.current = Date.now();
      lastCoinTime.current = Date.now();
      lastPowerUpTime.current = Date.now();
    }
  };

  // Theme styles
  const getThemeStyles = () => {
    switch (theme) {
      case 'cyber':
        return {
          background: `linear-gradient(180deg, hsl(280 70% 10%) 0%, hsl(280 60% 5%) 100%)`,
          playerColor: '#00FFE0',
          obstacleColor: 'hsl(320 90% 50%)',
          coinColor: '#FFFF00',
          pipeGradient: 'linear-gradient(90deg, hsl(320 85% 35%) 0%, hsl(320 90% 50%) 30%, hsl(320 90% 55%) 50%, hsl(320 90% 50%) 70%, hsl(320 85% 35%) 100%)'
        };
      case 'retro':
        return {
          background: `linear-gradient(180deg, hsl(0 0% 5%) 0%, hsl(0 0% 2%) 100%)`,
          playerColor: '#00FF00',
          obstacleColor: '#FF0000',
          coinColor: '#FFFF00',
          pipeGradient: 'linear-gradient(90deg, hsl(0 70% 30%) 0%, hsl(0 85% 45%) 30%, hsl(0 85% 50%) 50%, hsl(0 85% 45%) 70%, hsl(0 70% 30%) 100%)'
        };
      case 'nature':
        return {
          background: `linear-gradient(180deg, hsl(120 50% 10%) 0%, hsl(120 40% 5%) 100%)`,
          playerColor: '#4AFF4A',
          obstacleColor: 'hsl(30 80% 50%)',
          coinColor: '#FFD700',
          pipeGradient: 'linear-gradient(90deg, hsl(30 85% 35%) 0%, hsl(30 90% 50%) 30%, hsl(30 90% 55%) 50%, hsl(30 90% 50%) 70%, hsl(30 85% 35%) 100%)'
        };
      default:
        return {
          background: `linear-gradient(180deg, hsl(${gradientHue} 60% 8%) 0%, hsl(${gradientHue} 50% 4%) 50%, hsl(${gradientHue} 40% 2%) 100%)`,
          playerColor: '#00FFFF',
          obstacleColor: 'hsl(15 90% 50%)',
          coinColor: '#FFD700',
          pipeGradient: 'linear-gradient(90deg, hsl(15 85% 35%) 0%, hsl(15 90% 50%) 30%, hsl(15 90% 55%) 50%, hsl(15 90% 50%) 70%, hsl(15 85% 35%) 100%)'
        };
    }
  };

  const themeStyles = getThemeStyles();
  const difficulty = getDifficulty(score);

  const brickPattern = `
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 8px,
      rgba(0,0,0,0.3) 8px,
      rgba(0,0,0,0.3) 9px
    )
  `;

  // Show loading state during SSR
  if (!isClient) {
    return (
      <div className="relative h-[70vh] max-h-[640px] w-[360px] rounded-2xl overflow-hidden select-none bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-pulse text-lg">Loading game...</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={gameRef}
      className="relative h-[70vh] max-h-[640px] w-[360px] rounded-2xl overflow-hidden select-none"
      style={{ 
        background: themeStyles.background, 
        transition: 'background 600ms linear',
        touchAction: 'none',
        transform: rumbleEffect ? 'translateX(2px)' : 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        msUserSelect: 'none',
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <style jsx>{`
        @keyframes rumble {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          50% { transform: translateX(2px); }
          75% { transform: translateX(-2px); }
        }
        @keyframes flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes jarFloat {
          0%, 100% { transform: translateX(-50%) rotate(0deg); }
          25% { transform: translateX(-50%) rotate(5deg); }
          75% { transform: translateX(-50%) rotate(-5deg); }
        }
      `}</style>
      
      {/* Flash effect overlay */}
      {flashEffect && (
        <div className="absolute inset-0 bg-white/20 z-30 pointer-events-none" style={{ animation: 'flash 0.2s linear' }} />
      )}
      
      {/* Screen tint for power-ups */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{ backgroundColor: screenTint, opacity: 0.3 }}
      />
      
      {/* Scanlines with parallax */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.08]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(255,255,255,0.3) 2px,
            rgba(255,255,255,0.3) 4px
          )`,
          transform: `translateY(${starOffset.a}px)`,
        }}
      />
      
      {/* Dynamic stars with parallax */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => {
          const layer = i % 3;
          const offset = [starOffset.a, starOffset.b, starOffset.c][layer];
          const size = [0.8, 1.2, 1.6][layer];
          const opacity = [0.2, 0.4, 0.6][layer];
          
          return (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                left: `${10 + (i * 7.3) % 80}%`,
                top: `${5 + (i * 6.5) % 90}%`,
                width: `${size}px`,
                height: `${size}px`,
                transform: `translateY(${offset}px)`,
                opacity: opacity,
                animation: `pulse ${2 + (i % 4)}s ease-in-out infinite`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          );
        })}
      </div>

      {/* Smooth transition overlay */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-700"
        style={{ 
          background: gameState === 'playing' 
            ? 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.2) 100%)' 
            : 'rgba(0,0,0,0.7)',
          opacity: gameState === 'playing' ? 0 : 1
        }}
      />

      {/* Danger vignette */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(ellipse at center, transparent 40%, rgba(220,38,38,${dangerLevel * 0.6}) 100%)`,
          opacity: dangerLevel,
        }}
      />

      {/* Immunity Progress Bar - Bottom Center */}
      {gameState === 'playing' && isImmune && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 w-48">
          <div className="bg-black/40 backdrop-blur-sm rounded-full p-1 border border-emerald-500/30">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs text-emerald-300 font-bold">🛡️ IMMUNE</span>
              <span className="text-xs text-emerald-200 font-mono">
                {immunityRemaining.toFixed(1)}s
              </span>
            </div>
            <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden mt-1">
              <div 
                className="h-2 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-100"
                style={{ width: `${(immunityRemaining / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Immunity visual effect */}
      {gameState === 'playing' && isImmune && (
        <div className="absolute inset-0 pointer-events-none z-20">
          <div 
            className="absolute inset-0 rounded-2xl"
            style={{
              background: `radial-gradient(ellipse at center, transparent 40%, rgba(74, 222, 128, 0.1) 100%)`,
              animation: 'pulse 1s ease-in-out infinite',
            }}
          />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div 
              className="w-64 h-64 rounded-full"
              style={{
                background: `radial-gradient(circle, rgba(74, 222, 128, 0.05) 0%, transparent 70%)`,
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      )}

      {/* START SCREEN */}
      {gameState === 'start' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4">
          {/* Game title with glow */}
          <div className="relative mb-4">
            <h1 className="text-4xl font-black tracking-tighter text-white text-center mb-2">
              SCROLL OR DIE
            </h1>
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg blur opacity-30 -z-10" />
            <p className="text-sm text-slate-300 text-center">
              The ultimate scrolling challenge
            </p>
          </div>

          {/* Stats summary */}
          <div className="flex gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{highScore.toFixed(1)}s</div>
              <div className="text-xs text-slate-400">Best Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">{streak}🔥</div>
              <div className="text-xs text-slate-400">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{totalCoins}</div>
              <div className="text-xs text-slate-400">Total Coins</div>
            </div>
          </div>

          {/* Social buttons */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setShowChallenges(true)}
              className="px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors active:bg-white/15"
            >
              🏆 Challenges
            </button>
            <button
              onClick={() => setShowThemeSelector(!showThemeSelector)}
              className="px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors active:bg-white/15"
            >
              🎨 Theme
            </button>
          </div>

          {/* Theme selector */}
          {showThemeSelector && (
            <div className="mb-4 p-3 bg-white/5 rounded-xl backdrop-blur-sm">
              <div className="text-sm text-slate-300 mb-2">Select Theme:</div>
              <div className="flex gap-2">
                {(['default', 'cyber', 'retro', 'nature'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`px-3 py-2 rounded-lg text-xs capitalize ${theme === t ? 'bg-white text-black' : 'bg-white/5'} active:scale-95 transition-transform`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Start button */}
          <button
            onClick={() => {
              setGameState('playing');
              gameStartTime.current = Date.now();
              lastObstacleTime.current = Date.now();
              if (!audioStarted) {
                toggleMute();
              }
            }}
            className="relative px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-black font-bold rounded-2xl text-lg shadow-2xl hover:scale-105 transition-transform active:scale-95 mb-4"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl blur opacity-50 -z-10" />
            🎮 START GAME
          </button>

          {/* Start hint */}
          <div className="text-orange-300 animate-bounce text-sm mb-2">
            ↕ Scroll or drag to start!
          </div>

          {/* Difficulty selector */}
          <div className="mb-6">
            <div className="text-xs text-slate-400 mb-2">Difficulty:</div>
            <div className="flex items-center gap-2">
              {(['Easy','Medium','Hard'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDifficultyMode(d)}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all ${difficultyMode===d 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg scale-105' 
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'} active:scale-95`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div className="text-xs text-slate-400 space-y-1">
            <div className="flex items-center gap-2">
              <span>⚡ {unlockedAchievements.length}/7 Achievements</span>
              <span>•</span>
              <span>💰 {coinScore} coins this round</span>
            </div>
            {todayChallenge && (
              <div className="bg-white/5 p-2 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-300">Daily Challenge:</span>
                  <span className="font-semibold">{todayChallenge.progress}/{todayChallenge.target}</span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                  <div 
                    className="h-1 bg-gradient-to-r from-emerald-400 to-cyan-400"
                    style={{ width: `${Math.min(100, (todayChallenge.progress / todayChallenge.target) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Instructions button */}
          <button
            onClick={() => setShowInstructions(true)}
            className="mt-4 px-4 py-2 bg-white/5 rounded-lg text-slate-300 hover:bg-white/10 transition-colors active:bg-white/15"
          >
            ℹ️ How to Play
          </button>
        </div>
      )}

      {/* CHALLENGES MODAL */}
      {showChallenges && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowChallenges(false)} />
          <div className="relative w-[90%] max-w-md rounded-2xl bg-gradient-to-b from-slate-900/95 to-slate-800/95 ring-1 ring-white/5 shadow-2xl p-5 z-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">🏆 Active Challenges</h3>
              <button 
                onClick={() => setShowChallenges(false)} 
                className="p-2 hover:bg-white/10 rounded-lg active:bg-white/15"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {activeChallenges.map(challenge => (
                <div key={challenge.id} className="p-3 bg-white/5 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{challenge.title}</span>
                    <span className="text-sm text-emerald-300">+{challenge.reward} coins</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-2 bg-gradient-to-r from-cyan-500 to-blue-500"
                        style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-300">{challenge.progress}/{challenge.target}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {challenge.type === 'daily' ? '🕒 Resets daily' : 
                     challenge.type === 'weekly' ? '📅 Weekly challenge' : '⭐ Special event'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* INSTRUCTIONS MODAL */}
      {showInstructions && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowInstructions(false)} />
          <div className="relative w-[94%] max-w-xl rounded-2xl bg-gradient-to-b from-slate-900/95 to-slate-800/95 ring-1 ring-white/5 shadow-2xl p-5 z-50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-extrabold text-white">🎮 How to Master Scroll or Die</h3>
              </div>
              <button 
                onClick={() => setShowInstructions(false)} 
                className="p-3 hover:bg-white/10 rounded-xl active:bg-white/15"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-4 mb-6">
              <div className="flex-1 bg-white/5 p-4 rounded-xl">
                <div className="text-lg mb-2">⚡ Power-Ups</div>
                <div className="text-sm text-slate-300 space-y-1">
                  <div>🛡️ Shield - Invincibility</div>
                  <div>⏱️ Slowmo - Slow time</div>
                  <div>2️⃣ Double - 2x score</div>
                  <div>🧲 Magnet - Attract coins</div>
                </div>
              </div>
              <div className="flex-1 bg-white/5 p-4 rounded-xl">
                <div className="text-lg mb-2">🫙 Immunity Jars</div>
                <div className="text-sm text-slate-300 space-y-1">
                  <div>💚 Green Jars - 5s immunity</div>
                  <div>🛡️ Avoid all obstacles</div>
                  <div>⏱️ Progress bar shows time left</div>
                  <div>✨ Collect when in danger!</div>
                </div>
              </div>
            </div>

            <div className="text-sm text-slate-200 space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-cyan-500/20 p-2 rounded-lg">🎯</div>
                <div>
                  <strong>Pro Tip:</strong> Collect jars when you see tricky obstacle patterns approaching.
                  The 5-second immunity can save your run!
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-purple-500/20 p-2 rounded-lg">🔥</div>
                <div>
                  <strong>Combo System:</strong> Collect coins rapidly to build combo chains.
                  Every 5 coins increases your multiplier up to 3x!
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-emerald-500/20 p-2 rounded-lg">📱</div>
                <div>
                  <strong>Share Your Score:</strong> Compete with friends and share your best runs on X
                  with #{hashtagChallenge.replace('#', '')} for a chance to be featured!
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowInstructions(false)}
                className="px-5 py-3 rounded-xl bg-white/6 text-white hover:bg-white/8 transition-colors active:bg-white/10"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAMEPLAY */}
      {gameState === 'playing' && (
        <>
          {/* Top HUD */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-20">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black text-white tabular-nums drop-shadow-lg">
                  {(score * scoreMultiplier).toFixed(1)}s
                </span>
                {scoreMultiplier > 1 && (
                  <span className="text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-black px-2 py-1 rounded-full font-bold animate-pulse">
                    {scoreMultiplier.toFixed(1)}x
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-400 uppercase tracking-wider bg-black/30 px-2 py-1 rounded">
                  {difficulty.label}
                </span>
                {comboEffect && (
                  <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full">
                    {comboEffect.type} {comboEffect.level}⚡
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-end">
              <div className="text-right">
                <div className="text-[10px] text-slate-400">🏆 Best</div>
                <div className="text-sm font-bold text-orange-300 tabular-nums">{highScore.toFixed(1)}s</div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="text-xs text-amber-300">💰{coinScore}</div>
                <div className="text-xs text-cyan-300">🔥{streak}</div>
              </div>
            </div>
          </div>

          {/* Power-up indicators */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1 z-20">
            {hasShield && <div className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">🛡️ {Math.ceil(shieldTimer/60)}s</div>}
            {hasSlowmo && <div className="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded text-xs">⏱️ {Math.ceil(slowmoTimer/60)}s</div>}
            {hasMagnet && <div className="px-2 py-1 bg-pink-500/20 text-pink-300 rounded text-xs">🧲 {Math.ceil(magnetTimer/60)}s</div>}
          </div>

          {/* Double multiplier popup */}
          {showDoublePopup && (
            <div className="absolute left-1/2 -translate-x-1/2 top-20 z-40 pointer-events-none">
              <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-black font-black px-6 py-3 rounded-2xl shadow-2xl animate-bounce text-lg">
                2x SCORE MULTIPLIER!
              </div>
            </div>
          )}

          {/* Combo text */}
          {showComboText && (
            <div className="absolute left-1/2 -translate-x-1/2 top-32 z-40 pointer-events-none">
              <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 animate-float">
                COMBO x{comboMultiplier.toFixed(1)}!
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="absolute bottom-3 right-3 flex flex-col gap-2 z-20">
            <button
              onClick={toggleMute}
              className="p-3 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-colors active:bg-white/25"
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? '🔇' : '🔊'}
            </button>
          </div>

          {/* Player */}
          <div
            className="absolute w-4 h-4 rounded-full z-30 transition-transform duration-75 ease-out"
            style={{
              left: '15%',
              top: `${playerY}%`,
              transform: 'translate(-50%, -50%)',
              background: themeStyles.playerColor,
              boxShadow: `
                0 0 20px ${themeStyles.playerColor},
                0 0 40px ${themeStyles.playerColor}80,
                0 0 60px ${themeStyles.playerColor}40
              `,
              filter: `blur(${dangerLevel * 2}px)`,
              border: isImmune ? '2px solid #4ade80' : 'none',
            }}
          />

          {/* Trail particles */}
          {trailParticles.map(p => (
            <div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                background: p.color,
                opacity: p.life,
                boxShadow: `0 0 6px ${p.color}`,
              }}
            />
          ))}

          {/* Obstacles */}
          {obstacles.map(obs => {
            const { id, x, type, gapY, gapHeight, topHeight, bottomY } = obs;
            
            if (type === 'bar' || type === 'gap') {
              const gapTop = (gapY || 50) - (gapHeight || GAP_SIZE) / 2;
              const gapBottom = (gapY || 50) + (gapHeight || GAP_SIZE) / 2;

              return (
                <React.Fragment key={id}>
                  {/* Top pipe */}
                  <div
                    className="absolute w-5 rounded-b-lg"
                    style={{
                      left: `${x}%`,
                      transform: 'translateX(-50%)',
                      top: 0,
                      height: `${gapTop}%`,
                      background: themeStyles.pipeGradient,
                      boxShadow: `inset 2px 0 4px rgba(255,150,100,0.5), inset -2px 0 4px rgba(0,0,0,0.4), 0 4px 8px rgba(0,0,0,0.5), 0 0 15px rgba(255,100,50,0.3)`,
                    }}
                  >
                    <div 
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-7 h-3 rounded-b-md"
                      style={{
                        background: themeStyles.pipeGradient,
                        boxShadow: `0 2px 4px rgba(0,0,0,0.5)`,
                      }}
                    />
                    <div className="absolute inset-0 rounded-b-lg opacity-40" style={{ backgroundImage: brickPattern }} />
                  </div>
                  
                  {/* Bottom pipe */}
                  <div
                    className="absolute w-5 rounded-t-lg"
                    style={{
                      left: `${x}%`,
                      transform: 'translateX(-50%)',
                      top: `${gapBottom}%`,
                      height: `${100 - gapBottom}%`,
                      background: themeStyles.pipeGradient,
                      boxShadow: `inset 2px 0 4px rgba(255,150,100,0.5), inset -2px 0 4px rgba(0,0,0,0.4), 0 -4px 8px rgba(0,0,0,0.5), 0 0 15px rgba(255,100,50,0.3)`,
                    }}
                  >
                    <div 
                      className="absolute -top-1 left-1/2 -translate-x-1/2 w-7 h-3 rounded-t-md"
                      style={{
                        background: themeStyles.pipeGradient,
                        boxShadow: `0 -2px 4px rgba(0,0,0,0.5)`,
                      }}
                    />
                    <div className="absolute inset-0 rounded-t-lg opacity-40" style={{ backgroundImage: brickPattern }} />
                  </div>
                </React.Fragment>
              );
            }

            // Double trap
            return (
              <React.Fragment key={id}>
                <div
                  className="absolute w-5 rounded-b-lg"
                  style={{
                    left: `${x}%`,
                    transform: 'translateX(-50%)',
                    top: 0,
                    height: `${topHeight || 20}%`,
                    background: `linear-gradient(90deg, hsl(0 70% 35%) 0%, hsl(0 80% 50%) 30%, hsl(0 80% 55%) 50%, hsl(0 80% 50%) 70%, hsl(0 70% 35%) 100%)`,
                    boxShadow: `inset 2px 0 4px rgba(255,100,100,0.5), inset -2px 0 4px rgba(0,0,0,0.4), 0 4px 8px rgba(0,0,0,0.5), 0 0 15px rgba(255,50,50,0.4)`,
                  }}
                >
                  <div 
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-7 h-3 rounded-b-md"
                    style={{ background: `linear-gradient(90deg, hsl(0 70% 30%) 0%, hsl(0 75% 45%) 50%, hsl(0 70% 30%) 100%)` }}
                  />
                  <div className="absolute inset-0 rounded-b-lg opacity-40" style={{ backgroundImage: brickPattern }} />
                </div>
                <div
                  className="absolute w-5 rounded-t-lg"
                  style={{
                    left: `${x}%`,
                    transform: 'translateX(-50%)',
                    top: `${bottomY || 80}%`,
                    height: `${100 - (bottomY || 80)}%`,
                    background: `linear-gradient(90deg, hsl(0 70% 35%) 0%, hsl(0 80% 50%) 30%, hsl(0 80% 55%) 50%, hsl(0 80% 50%) 70%, hsl(0 70% 35%) 100%)`,
                    boxShadow: `inset 2px 0 4px rgba(255,100,100,0.5), inset -2px 0 4px rgba(0,0,0,0.4), 0 -4px 8px rgba(0,0,0,0.5), 0 0 15px rgba(255,50,50,0.4)`,
                  }}
                >
                  <div 
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-7 h-3 rounded-t-md"
                    style={{ background: `linear-gradient(90deg, hsl(0 70% 30%) 0%, hsl(0 75% 45%) 50%, hsl(0 70% 30%) 100%)` }}
                  />
                  <div className="absolute inset-0 rounded-t-lg opacity-40" style={{ backgroundImage: brickPattern }} />
                </div>
              </React.Fragment>
            );
          })}

          {/* Meteors */}
          {meteors.map(m => (
            <div
              key={m.id}
              className="absolute rounded-full"
              style={{
                left: `${m.x}%`,
                top: `${m.y}%`,
                width: `${m.size}%`,
                height: `${m.size}%`,
                transform: `translate(-50%,-50%) rotate(${m.rot}deg)`,
                background: 'radial-gradient(circle at 35% 30%, #e6e0d6 0%, #b89a73 30%, #7a5b44 60%, #4b3b2f 100%)',
                boxShadow: '0 8px 20px rgba(0,0,0,0.6), inset -6px -4px 10px rgba(255,255,255,0.05)',
                border: '1px solid rgba(0,0,0,0.4)'
              }}
            />
          ))}

          {/* Coins */}
          {coins.map(coin => !coin.collected && (
            <div
              key={coin.id}
              className="absolute rounded-full animate-float"
              style={{
                left: `${coin.x}%`,
                top: `${coin.y}%`,
                width: '18px',
                height: '18px',
                transform: 'translate(-50%, -50%)',
                background: `radial-gradient(circle at 30% 30%, ${themeStyles.coinColor}, ${themeStyles.coinColor}80)`,
                boxShadow: `0 0 15px ${themeStyles.coinColor}, 0 0 30px ${themeStyles.coinColor}60`,
                border: `2px solid ${themeStyles.coinColor}CC`,
                animationDelay: `${coin.id % 2}s`,
              }}
            />
          ))}

          {/* Power-ups */}
          {powerUps.map(pu => !pu.collected && (
            <div
              key={pu.id}
              className="absolute flex items-center justify-center rounded-lg animate-bounce"
              style={{
                left: `${pu.x}%`,
                top: `${pu.y}%`,
                width: '28px',
                height: '28px',
                transform: 'translate(-50%, -50%)',
                background: `radial-gradient(circle, ${getPowerUpColor(pu.type)}40, ${getPowerUpColor(pu.type)}20)`,
                boxShadow: `0 0 15px ${getPowerUpColor(pu.type)}, 0 0 30px ${getPowerUpColor(pu.type)}60`,
                border: `2px solid ${getPowerUpColor(pu.type)}`,
              }}
            >
              <span className="text-sm">{getPowerUpIcon(pu.type)}</span>
            </div>
          ))}

          {/* Jars - Green Immunity Jars */}
          {jars.map(j => (
            <div
              key={j.id}
              className="absolute z-20"
              style={{
                left: `${j.x}%`,
                transform: 'translateX(-50%)',
                top: `${j.y}%`,
                animation: `jarFloat 3s ease-in-out infinite`,
                animationDelay: `${j.id % 3 * 0.5}s`,
              }}
            >
              {/* Jar body */}
              <div 
                className="relative w-6 h-8"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 30%, #047857 70%, #065f46 100%)',
                  borderRadius: '3px 3px 8px 8px',
                  boxShadow: `
                    inset 0 -4px 6px rgba(0,0,0,0.3),
                    inset 0 4px 6px rgba(255,255,255,0.2),
                    0 0 15px rgba(74, 222, 128, 0.7),
                    0 0 30px rgba(74, 222, 128, 0.4)
                  `,
                  border: '2px solid #065f46',
                }}
              >
                {/* Jar neck */}
                <div 
                  className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-2"
                  style={{
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    borderRadius: '3px 3px 0 0',
                    border: '2px solid #065f46',
                    borderBottom: 'none',
                  }}
                />
                {/* Jar lid */}
                <div 
                  className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-5 h-2"
                  style={{
                    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                    borderRadius: '4px',
                    border: '1px solid #92400e',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  }}
                />
                {/* Jar shine */}
                <div 
                  className="absolute top-1 left-1 w-3 h-3 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)',
                  }}
                />
                {/* Jar contents (glowing liquid) */}
                <div 
                  className="absolute bottom-0 left-0 right-0"
                  style={{
                    height: '70%',
                    background: 'linear-gradient(to top, rgba(74, 222, 128, 0.8) 0%, rgba(52, 211, 153, 0.9) 100%)',
                    borderRadius: '0 0 6px 6px',
                    borderTop: '1px solid rgba(255,255,255,0.2)',
                  }}
                />
                {/* Jar glow effect */}
                <div 
                  className="absolute -inset-2 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(74, 222, 128, 0.3) 0%, transparent 70%)',
                    filter: 'blur(4px)',
                    zIndex: -1,
                  }}
                />
              </div>
              {/* Jar particle trail */}
              <div 
                className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-2"
                style={{
                  background: 'radial-gradient(ellipse, rgba(74, 222, 128, 0.3) 0%, transparent 70%)',
                  filter: 'blur(3px)',
                }}
              />
            </div>
          ))}
        </>
      )}

      {/* DEATH SCREEN - FIXED MOBILE CLICKS */}
      {gameState === 'dead' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-gradient-to-b from-black/90 via-black/80 to-black/90 backdrop-blur-sm p-4">
          {/* Animated particles */}
          {particles.map(p => (
            <div
              key={p.id}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                background: themeStyles.playerColor,
                opacity: p.life,
                boxShadow: `0 0 8px ${themeStyles.playerColor}`,
              }}
            />
          ))}

          {/* Death header */}
          <div className="text-center mb-4">
            <div className="text-red-500 text-sm uppercase tracking-widest font-bold mb-1">
              ⚡ GAME OVER ⚡
            </div>
            <h2 className="text-xl font-bold text-white mb-2 px-4 max-w-xs">
              {deathMessage}
            </h2>
          </div>

          {/* Score display */}
          <div className="relative bg-gradient-to-br from-slate-900/50 to-black/50 p-6 rounded-2xl border border-white/10 mb-6">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-2xl blur -z-10" />
            <div className="text-center">
              <div className="text-sm text-slate-300 mb-1">Your Score</div>
              <div className="text-5xl font-black text-white tabular-nums mb-2">
                {(score * scoreMultiplier).toFixed(1)}s
              </div>
              <div className="text-xs text-slate-400">
                {scoreMultiplier > 1 ? `(${score.toFixed(1)}s × ${scoreMultiplier.toFixed(1)}x)` : 'Base score'}
              </div>
            </div>
          </div>

          {/* Stats summary */}
          <div className="grid grid-cols-3 gap-3 mb-6 w-full max-w-xs">
            <div className="bg-white/5 p-3 rounded-xl text-center">
              <div className="text-lg font-bold text-cyan-300">{coinScore}</div>
              <div className="text-xs text-slate-400">Coins</div>
            </div>
            <div className="bg-white/5 p-3 rounded-xl text-center">
              <div className="text-lg font-bold text-emerald-300">{streak}</div>
              <div className="text-xs text-slate-400">Day Streak</div>
            </div>
            <div className="bg-white/5 p-3 rounded-xl text-center">
              <div className="text-lg font-bold text-amber-300">{highScore.toFixed(1)}s</div>
              <div className="text-xs text-slate-400">Best</div>
            </div>
          </div>

          {/* Record badge */}
          {isNewRecord && (
            <div className="mb-4 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-full text-sm animate-pulse">
              🏆 NEW PERSONAL RECORD! 🏆
            </div>
          )}

          {/* Action buttons - FIXED FOR MOBILE */}
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={resetGame}
              className="relative px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-black font-bold rounded-xl text-lg shadow-2xl hover:scale-105 transition-transform active:scale-95"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl blur opacity-50 -z-10" />
              🔄 PLAY AGAIN
            </button>
            
            <button
              onClick={shareScore}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity active:opacity-80"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              🐦 SHARE ON X
            </button>
            
            <button
              onClick={() => {
                setShowChallenges(true);
                setGameState('start');
              }}
              className="px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/15 transition-colors active:bg-white/20"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              🏆 VIEW CHALLENGES
            </button>
          </div>

          {/* Progress towards next achievement */}
          {todayChallenge && (
            <div className="mt-6 w-full max-w-xs bg-white/5 p-3 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-emerald-300">Daily Progress</span>
                <span className="text-xs text-slate-300">{todayChallenge.progress}/{todayChallenge.target}</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-2 bg-gradient-to-r from-emerald-400 to-cyan-400"
                  style={{ width: `${Math.min(100, (todayChallenge.progress / todayChallenge.target) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};