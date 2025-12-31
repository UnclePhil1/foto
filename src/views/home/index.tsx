// Next, React
import { FC, useEffect, useState, useCallback, useRef } from "react";
import pkg from "../../../package.json";
import React from "react";

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
// Replace this entire GameSandbox component with the one AI generates.
// Keep the name `GameSandbox` and the `FC` type.

interface PuzzleItem {
  id: number;
  name: string;
  symbol: string;
  imageUrl: string;
}

interface GameSandboxProps {
  theme?: "light" | "dark";
}

interface MoveRecord {
  tileId: number;
  fromIndex: number;
  toIndex: number;
  timestamp: number;
}

const PUZZLE_IMAGES: PuzzleItem[] = [
  { id: 1, imageUrl: "/assets/jup.jpg", name: "Jupiter", symbol: "JUP" },
  { id: 2, imageUrl: "/assets/sol.jpg", name: "Solana", symbol: "SOL" },
  { id: 3, imageUrl: "/assets/scroll.jpg", name: "Scrolly", symbol: "SCRL" },
  { id: 4, imageUrl: "/assets/uncle.jpg", name: "UnclePhil", symbol: "DEV" },
];

const BLOCKED_KEYWORDS = [
  "violence",
  "war",
  "weapon",
  "drug",
  "alcohol",
  "cigarette",
  "nude",
  "naked",
  "sexy",
  "porn",
  "adult",
  "explicit",
  "gore",
  "hate",
  "racist",
  "offensive",
  "terror",
  "crime",
];

const LOCAL_STORAGE_KEY = "foto_local_images";
const DAILY_PUZZLE_KEY = "foto_daily_puzzle";
const DAILY_STATS_KEY = "foto_daily_stats";
const SOUND_ENABLED_KEY = "foto_sound_enabled";

interface DailyPuzzle {
  date: string;
  imageIndex: number;
  gridSize: number;
}

interface DailyStats {
  [date: string]: {
    moves: number;
    time: number;
    completed: boolean;
  };
}

const getDailyPuzzle = (): DailyPuzzle => {
  const today = new Date().toDateString();
  const dateSeed = today
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return {
    date: today,
    imageIndex: dateSeed % PUZZLE_IMAGES.length,
    gridSize: 3 + (dateSeed % 3),
  };
};

const getDailyPercentile = (moves: number, time: number): number => {
  const dateStr = new Date().toDateString();
  const seed = dateStr
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const baseScore = Math.floor(moves * 0.7 + time * 0.3);
  const pseudoRandom = (seed * 9301 + 49297) % 233280;
  const normalized = (pseudoRandom % 100) / 100;

  const distribution = Math.sin(baseScore * 0.5 + normalized) * 0.3 + 0.5;
  return Math.min(95, Math.max(5, Math.floor(distribution * 100)));
};

const GameSandbox: FC<GameSandboxProps> = ({ theme = "dark" }) => {
  const [showSplash, setShowSplash] = useState(true);
  const [gridSize, setGridSize] = useState(3);
  const [tiles, setTiles] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(true);
  const [activeTab, setActiveTab] = useState<"main" | "create" | "local">(
    "main"
  );
  const [pixabayImages, setPixabayImages] = useState<PuzzleItem[]>([]);
  const [selectedPixabayImage, setSelectedPixabayImage] =
    useState<PuzzleItem | null>(null);
  const [localImages, setLocalImages] = useState<PuzzleItem[]>([]);
  const [selectedLocalImage, setSelectedLocalImage] =
    useState<PuzzleItem | null>(null);
  const [isLoadingPixabay, setIsLoadingPixabay] = useState(false);
  const [pixabayError, setPixabayError] = useState<string | null>(null);
  const [selectedMain, setSelectedMain] = useState<PuzzleItem>(
    PUZZLE_IMAGES[0]
  );
  const [showInstructions, setShowInstructions] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [puzzleSize, setPuzzleSize] = useState(300);
  const [tileSize, setTileSize] = useState((300 - (3 + 1) * 4) / 3);
  const [pixabaySearchQuery, setPixabaySearchQuery] = useState("cars");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dailyPuzzle, setDailyPuzzle] = useState<DailyPuzzle | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats>({});
  const [showDailyComplete, setShowDailyComplete] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [handPosition, setHandPosition] = useState({
    x: 0,
    y: 0,
    visible: false,
  });
  const [handAnimation, setHandAnimation] = useState<
    "idle" | "moving" | "tapping"
  >("idle");
  const [themeMode, setThemeMode] = useState<"light" | "dark">(theme);
  
  // Watch Mode State
  const [isWatchMode, setIsWatchMode] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);
  const [moveRecords, setMoveRecords] = useState<MoveRecord[]>([]);
  const [currentReplayIndex, setCurrentReplayIndex] = useState(0);
  const [initialTilesState, setInitialTilesState] = useState<number[]>([]);
  const [showWatchButton, setShowWatchButton] = useState(false);
  const [replayLoopCount, setReplayLoopCount] = useState(0);
  
  const handRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const moveSoundRef = useRef<OscillatorNode | null>(null);
  const snapSoundRef = useRef<OscillatorNode | null>(null);
  const winSoundRef = useRef<OscillatorNode | null>(null);
  const replayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setThemeMode(theme);
  }, [theme]);

  useEffect(() => {
    const loadLocalImages = () => {
      try {
        const savedImages = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedImages) {
          const parsedImages: PuzzleItem[] = JSON.parse(savedImages);
          setLocalImages(parsedImages);
          if (activeTab === "local" && parsedImages.length > 0) {
            setSelectedLocalImage(parsedImages[0]);
          }
        }
      } catch (error) {
        console.error("Failed to load local images:", error);
      }
    };

    const loadDailyPuzzle = () => {
      const today = new Date().toDateString();
      const puzzle = getDailyPuzzle();
      setDailyPuzzle(puzzle);

      const savedStats = localStorage.getItem(DAILY_STATS_KEY);
      if (savedStats) {
        const stats: DailyStats = JSON.parse(savedStats);
        setDailyStats(stats);

        if (stats[today]?.completed) {
          setShowDailyComplete(true);
        }
      }
    };

    const loadSoundPref = () => {
      const saved = localStorage.getItem(SOUND_ENABLED_KEY);
      if (saved !== null) {
        setSoundEnabled(saved === "true");
      }
    };

    loadLocalImages();
    loadDailyPuzzle();
    loadSoundPref();
  }, []);

  useEffect(() => {
    if (localImages.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localImages));
    }
  }, [localImages]);

  useEffect(() => {
    localStorage.setItem(SOUND_ENABLED_KEY, soundEnabled.toString());
  }, [soundEnabled]);

  // Cleanup replay on unmount
  useEffect(() => {
    return () => {
      if (replayTimeoutRef.current) {
        clearTimeout(replayTimeoutRef.current);
        replayTimeoutRef.current = null;
      }
    };
  }, []);

  const initAudio = useCallback(() => {
    if (!audioContextRef.current && soundEnabled) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
  }, [soundEnabled]);

  const playMoveSound = useCallback(() => {
    if (!soundEnabled || !audioContextRef.current) return;

    try {
      if (moveSoundRef.current) {
        moveSoundRef.current.stop();
      }

      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(
        600,
        audioContextRef.current.currentTime
      );
      oscillator.frequency.exponentialRampToValueAtTime(
        400,
        audioContextRef.current.currentTime + 0.05
      );

      gainNode.gain.setValueAtTime(0.05, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContextRef.current.currentTime + 0.05
      );

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      oscillator.start();
      oscillator.stop(audioContextRef.current.currentTime + 0.1);

      moveSoundRef.current = oscillator;
    } catch (e) {
      console.warn("Audio context error:", e);
    }
  }, [soundEnabled]);

  const playSnapSound = useCallback(() => {
    if (!soundEnabled || !audioContextRef.current) return;

    try {
      if (snapSoundRef.current) {
        snapSoundRef.current.stop();
      }

      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(
        800,
        audioContextRef.current.currentTime
      );
      oscillator.frequency.exponentialRampToValueAtTime(
        200,
        audioContextRef.current.currentTime + 0.1
      );

      gainNode.gain.setValueAtTime(0.08, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        audioContextRef.current.currentTime + 0.15
      );

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      oscillator.start();
      oscillator.stop(audioContextRef.current.currentTime + 0.15);

      snapSoundRef.current = oscillator;
    } catch (e) {
      console.warn("Audio context error:", e);
    }
  }, [soundEnabled]);

  const playWinSound = useCallback(() => {
    if (!soundEnabled || !audioContextRef.current) return;

    try {
      if (winSoundRef.current) {
        winSoundRef.current.stop();
      }

      const now = audioContextRef.current.currentTime;
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(523.25, now); // C5
      oscillator.frequency.setValueAtTime(659.25, now + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, now + 0.2); // G5

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.1, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      oscillator.start();
      oscillator.stop(now + 0.5);

      winSoundRef.current = oscillator;
    } catch (e) {
      console.warn("Audio context error:", e);
    }
  }, [soundEnabled]);

  const animateHandToTile = useCallback(
    (tileIndex: number) => {
      if (!isPlaying || hasWon || !handRef.current) return;

      const board = document.querySelector("[data-game-board]");
      if (!board) return;

      const boardRect = board.getBoundingClientRect();
      const row = Math.floor(tileIndex / gridSize);
      const col = tileIndex % gridSize;

      const x = boardRect.left + col * (tileSize + 4) + tileSize / 2 - 24;
      const y = boardRect.top + row * (tileSize + 4) + tileSize / 2 - 24;

      setHandPosition({ x, y, visible: true });
      setHandAnimation("moving");

      setTimeout(() => {
        setHandAnimation("tapping");
        setTimeout(() => {
          setHandAnimation("idle");
          setTimeout(() => {
            setHandPosition((prev) => ({ ...prev, visible: false }));
          }, 200);
        }, 80);
      }, 120);
    },
    [isPlaying, hasWon, gridSize, tileSize]
  );

  const animateHandForReplay = useCallback(
    (tileIndex: number) => {
      if (!handRef.current || !isWatchMode) return;

      const board = document.querySelector("[data-game-board]");
      if (!board) return;

      const boardRect = board.getBoundingClientRect();
      const row = Math.floor(tileIndex / gridSize);
      const col = tileIndex % gridSize;

      const x = boardRect.left + col * (tileSize + 4) + tileSize / 2 - 24;
      const y = boardRect.top + row * (tileSize + 4) + tileSize / 2 - 24;

      setHandPosition({ x, y, visible: true });
      setHandAnimation("moving");

      setTimeout(() => {
        setHandAnimation("tapping");
        setTimeout(() => {
          setHandAnimation("idle");
          setTimeout(() => {
            setHandPosition((prev) => ({ ...prev, visible: false }));
          }, 200);
        }, 80);
      }, 120);
    },
    [gridSize, tileSize, isWatchMode]
  );

  const fetchPixabayImages = async (query: string = "cars") => {
    const hasBlockedKeyword = BLOCKED_KEYWORDS.some((keyword) =>
      query.toLowerCase().includes(keyword.toLowerCase())
    );

    if (hasBlockedKeyword) {
      setPixabayError(
        "Search query contains blocked keywords. Please try a different search."
      );
      setPixabayImages([]);
      return;
    }

    setIsLoadingPixabay(true);
    setPixabayError(null);

    try {
      const response = await fetch(
        `https://pixabay.com/api/?key=53975878-5d7d727c6bb39bcca76fb0c39&q=${encodeURIComponent(
          query
        )}&safesearch=true&per_page=8&image_type=photo&category=nature,animals,buildings,backgrounds,food,travel,transportation&orientation=square&min_width=300&min_height=300`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.hits && data.hits.length > 0) {
        const pixabayImagesData = data.hits
          .slice(0, 8)
          .map((image: any, index: number) => ({
            id: index + 1000,
            name: image.tags?.split(",")[0] || "Pixabay Image",
            imageUrl:
              image.webformatURL || image.largeImageURL || image.previewURL,
            symbol: `IMG${index + 1}`,
          }));

        setPixabayImages(pixabayImagesData);
        if (activeTab === "create" && pixabayImagesData.length > 0) {
          setSelectedPixabayImage(pixabayImagesData[0]);
        }
      } else {
        setPixabayImages([]);
        setPixabayError("No images found. Try a different search term.");
      }
    } catch (error: any) {
      console.error("Failed to fetch Pixabay images:", error);
      setPixabayError("Unable to load images. Try again later.");
      setPixabayImages([]);
    } finally {
      setIsLoadingPixabay(false);
    }
  };

  useEffect(() => {
    if (activeTab === "create") {
      fetchPixabayImages("cars");
    }
  }, [activeTab]);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    initAudio();
  }, [initAudio]);

  const isSolvable = (arr: number[], size: number): boolean => {
    let inversions = 0;
    const filtered = arr.filter((n) => n !== 0);
    for (let i = 0; i < filtered.length; i++) {
      for (let j = i + 1; j < filtered.length; j++) {
        if (filtered[i] > filtered[j]) inversions++;
      }
    }
    if (size % 2 === 1) return inversions % 2 === 0;
    const blankRow = Math.floor(arr.indexOf(0) / size);
    return (inversions + blankRow) % 2 === 1;
  };

  const isSolved = (arr: number[]): boolean => {
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] !== i + 1) return false;
    }
    return arr[arr.length - 1] === 0;
  };

  const startGame = (size?: number, isDaily: boolean = false) => {
    let selectedItem: PuzzleItem | null;

    if (isDaily && dailyPuzzle) {
      selectedItem = PUZZLE_IMAGES[dailyPuzzle.imageIndex];
      setGridSize(dailyPuzzle.gridSize);
      setActiveTab("main");
    } else {
      switch (activeTab) {
        case "main":
          selectedItem = selectedMain;
          break;
        case "create":
          selectedItem = selectedPixabayImage;
          break;
        case "local":
          selectedItem = selectedLocalImage;
          break;
        default:
          selectedItem = selectedMain;
      }
    }

    if (!selectedItem) {
      alert(`Please select an image first!`);
      return;
    }

    const newSize = size ?? gridSize;
    if (size) setGridSize(size);
    const newTiles = Array.from({ length: newSize * newSize }, (_, i) => i);
    let arr: number[];
    do {
      arr = [...newTiles];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    } while (!isSolvable(arr, newSize) || isSolved(arr));
    
    // Clear move records and store initial state
    setMoveRecords([]);
    setInitialTilesState([...arr]);
    setTiles(arr);
    setMoves(0);
    setSeconds(0);
    setIsPlaying(true);
    setHasWon(false);
    setShowImagePicker(false);
    setShowDailyComplete(false);
    setIsWatchMode(false);
    setShowWatchButton(false);
    setReplayLoopCount(0);
    setCurrentReplayIndex(0);

    if (replayTimeoutRef.current) {
      clearTimeout(replayTimeoutRef.current);
      replayTimeoutRef.current = null;
    }

    if (isDaily) {
      setSelectedMain(selectedItem);
    }
  };

  const completeDailyPuzzle = () => {
    if (!dailyPuzzle) return;

    const today = new Date().toDateString();
    const newStats = {
      ...dailyStats,
      [today]: {
        moves,
        time: seconds,
        completed: true,
      },
    };

    setDailyStats(newStats);
    localStorage.setItem(DAILY_STATS_KEY, JSON.stringify(newStats));
    setShowDailyComplete(true);
  };

  const recordMove = useCallback((tileId: number, fromIndex: number, toIndex: number) => {
    setMoveRecords(prev => [...prev, {
      tileId,
      fromIndex,
      toIndex,
      timestamp: Date.now()
    }]);
  }, []);

  const selectPixabayImage = (image: PuzzleItem) => {
    setSelectedPixabayImage(image);
  };

  const selectLocalImage = (image: PuzzleItem) => {
    setSelectedLocalImage(image);
  };

  const selectMain = (brand: PuzzleItem) => {
    setSelectedMain(brand);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!validTypes.includes(file.type)) {
      setUploadError("Please upload a valid image file (JPEG, PNG, GIF, WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size too large. Maximum size is 5MB.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;

      const newLocalImage: PuzzleItem = {
        id: Date.now(),
        name: file.name.split(".")[0] || "My Image",
        symbol: `LOC${localImages.length + 1}`,
        imageUrl: imageUrl,
      };

      const updatedLocalImages = [newLocalImage, ...localImages];
      setLocalImages(updatedLocalImages);
      setSelectedLocalImage(newLocalImage);

      setActiveTab("local");

      setIsUploading(false);

      event.target.value = "";
    };

    reader.onerror = () => {
      setUploadError("Failed to read image file. Please try again.");
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const removeLocalImage = (id: number, event: React.MouseEvent) => {
    event.stopPropagation();
    const updatedLocalImages = localImages.filter((img) => img.id !== id);
    setLocalImages(updatedLocalImages);

    if (selectedLocalImage?.id === id) {
      setSelectedLocalImage(
        updatedLocalImages.length > 0 ? updatedLocalImages[0] : null
      );
    }

    if (updatedLocalImages.length === 0) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } else {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(updatedLocalImages)
      );
    }
  };

  useEffect(() => {
    if (!isPlaying || hasWon) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isPlaying, hasWon]);

  useEffect(() => {
    if (!hasWon) return;

    playWinSound();
    setShowConfetti(true);
    setShowWatchButton(true);

    if (
      dailyPuzzle &&
      activeTab === "main" &&
      gridSize === dailyPuzzle.gridSize
    ) {
      completeDailyPuzzle();
    }

    const t = setTimeout(() => setShowConfetti(false), 3500);
    return () => clearTimeout(t);
  }, [hasWon, dailyPuzzle, activeTab, gridSize, playWinSound]);

  const handleTileClick = (index: number) => {
    if (isWatchMode || isReplaying) return;
    
    let selectedItem: PuzzleItem | null;

    switch (activeTab) {
      case "main":
        selectedItem = selectedMain;
        break;
      case "create":
        selectedItem = selectedPixabayImage;
        break;
      case "local":
        selectedItem = selectedLocalImage;
        break;
      default:
        selectedItem = selectedMain;
    }

    if (!selectedItem || hasWon || tiles[index] === 0) return;

    animateHandToTile(index);
    playMoveSound();

    const emptyIndex = tiles.indexOf(0);
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    const emptyRow = Math.floor(emptyIndex / gridSize);
    const emptyCol = emptyIndex % gridSize;
    const isAdjacent =
      (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
      (Math.abs(col - emptyCol) === 1 && row === emptyRow);
    if (!isAdjacent) return;

    const newTiles = [...tiles];
    const tileId = newTiles[index];
    [newTiles[index], newTiles[emptyIndex]] = [
      newTiles[emptyIndex],
      newTiles[index],
    ];
    
    // Record the move
    recordMove(tileId, index, emptyIndex);
    
    setTiles(newTiles);
    setMoves((m) => m + 1);

    if (isSolved(newTiles)) {
      playSnapSound();
      setTimeout(() => {
        setHasWon(true);
        setIsPlaying(false);
      }, 150);
    }
  };

  const formatTime = (s: number): string => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getTilePosition = (tileNum: number): { x: number; y: number } => {
    const row = Math.floor((tileNum - 1) / gridSize);
    const col = (tileNum - 1) % gridSize;
    return { x: col, y: row };
  };

  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      const newPuzzleSize = width < 300 ? 180 : 300;
      const newTileSize = (newPuzzleSize - (gridSize + 1) * 4) / gridSize;
      setPuzzleSize(newPuzzleSize);
      setTileSize(newTileSize);
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [gridSize]);

  const loadImageAsDataUrl = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url, { mode: "cors" });
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            const tempCtx = tempCanvas.getContext("2d")!;
            tempCtx.drawImage(img, 0, 0);
            resolve(tempCanvas.toDataURL("image/png"));
          } catch {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = url;
      });
    }
  };

  const generateVictoryCard = async (): Promise<string> => {
    let selectedItem: PuzzleItem | null;

    switch (activeTab) {
      case "main":
        selectedItem = selectedMain;
        break;
      case "create":
        selectedItem = selectedPixabayImage;
        break;
      case "local":
        selectedItem = selectedLocalImage;
        break;
      default:
        selectedItem = selectedMain;
    }

    if (!selectedItem) {
      throw new Error("No item selected");
    }

    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#03070eff";
    ctx.fillRect(0, 0, 800, 1000);

    ctx.textAlign = "left";
    ctx.font = "bold 90px Arial Black, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("PUZZLE", 40, 100);
    ctx.fillText("COMPLETED", 40, 190);

    const frameX = 40;
    const frameY = 230;
    const frameWidth = 720;
    const frameHeight = 560;

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(frameX, frameY, frameWidth, frameHeight);

    ctx.font = "bold 24px Arial, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(selectedItem.name.toUpperCase(), 400, 280);

    const imageDataUrl = await loadImageAsDataUrl(selectedItem.imageUrl);

    if (imageDataUrl) {
      await new Promise<void>((resolve) => {
        const tokenImg = new Image();
        tokenImg.onload = () => {
          const imgSize = 360;
          const imgX = (800 - imgSize) / 2;
          const imgY = 310;
          ctx.drawImage(tokenImg, imgX, imgY, imgSize, imgSize);
          resolve();
        };
        tokenImg.onerror = () => resolve();
        tokenImg.src = imageDataUrl;
      });
    } else {
      ctx.fillStyle = "#070b13ff";
      ctx.fillRect(220, 310, 360, 360);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 48px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(selectedItem.symbol, 400, 510);
    }

    ctx.font = "italic 22px Georgia, serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText("Foto Game", frameX + 20, frameY + frameHeight - 20);

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 820);
    ctx.lineTo(760, 820);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(400, 840);
    ctx.lineTo(400, 980);
    ctx.stroke();

    ctx.font = "bold 32px Arial, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText("MOVES", 60, 880);

    ctx.font = "bold 64px Arial, sans-serif";
    ctx.fillText(moves.toString(), 60, 960);

    ctx.textAlign = "right";
    ctx.font = "bold 32px Arial, sans-serif";
    ctx.fillText("TIME", 740, 880);

    ctx.font = "bold 64px Arial, sans-serif";
    ctx.fillText(formatTime(seconds), 740, 960);

    return canvas.toDataURL("image/png");
  };

  const downloadVictoryCard = async () => {
    let selectedItem: PuzzleItem | null;

    switch (activeTab) {
      case "main":
        selectedItem = selectedMain;
        break;
      case "create":
        selectedItem = selectedPixabayImage;
        break;
      case "local":
        selectedItem = selectedLocalImage;
        break;
      default:
        selectedItem = selectedMain;
    }

    if (!selectedItem || isDownloading) return;

    setIsDownloading(true);
    try {
      const dataUrl = await generateVictoryCard();
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `FOTO-Victory-${
        selectedItem.symbol
      }-${moves}moves-${formatTime(seconds)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to generate victory card:", error);
      const link = document.createElement("a");
      link.href = selectedItem.imageUrl;
      link.download = `FOTO-${selectedItem.symbol}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsDownloading(false);
    }
  };

  const shareOnX = () => {
    let selectedItem: PuzzleItem | null;

    switch (activeTab) {
      case "main":
        selectedItem = selectedMain;
        break;
      case "create":
        selectedItem = selectedPixabayImage;
        break;
      case "local":
        selectedItem = selectedLocalImage;
        break;
      default:
        selectedItem = selectedMain;
    }

    if (!selectedItem) return;

    const shareText = `🎉 I just solved the ${
      selectedItem.name
    } puzzle on FOTO! 
    
✅ Completed in ${moves} moves
⏱️ Finished in ${formatTime(seconds)}
🧩 ${gridSize}×${gridSize} Grid
    
Play the puzzle game at FOTO! #FOTOGame #scrollygame`;

    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}`;
    window.open(shareUrl, "_blank", "width=550,height=420");
  };

  const resetGame = () => {
    setShowImagePicker(true);
    setHasWon(false);
    setIsPlaying(false);
    setMoves(0);
    setSeconds(0);
    setIsWatchMode(false);
    setShowWatchButton(false);
    setMoveRecords([]);
    setCurrentReplayIndex(0);
    setReplayLoopCount(0);
    
    if (replayTimeoutRef.current) {
      clearTimeout(replayTimeoutRef.current);
      replayTimeoutRef.current = null;
    }
  };

  const startWatchMode = useCallback(() => {
    if (moveRecords.length === 0 || !hasWon || isWatchMode) return;
    
    setIsWatchMode(true);
    setIsReplaying(true);
    setCurrentReplayIndex(0);
    setReplayLoopCount(0);
    
    // Reset to initial state (shuffled state)
    setTiles([...initialTilesState]);
    
    // Start replay after a short delay
    setTimeout(() => {
      performReplay();
    }, 300);
  }, [moveRecords, hasWon, isWatchMode, initialTilesState]);

  const performReplay = useCallback(() => {
    if (moveRecords.length === 0) return;
    
    let currentIndex = 0;
    const totalMoves = moveRecords.length;
    
    const playNextMove = () => {
      if (currentIndex >= totalMoves) {
        // Replay completed
        setIsReplaying(false);
        setCurrentReplayIndex(totalMoves);
        
        // Increment loop count
        setReplayLoopCount(prev => prev + 1);
        
        // If this was the first loop (0 -> 1), do one more loop
        if (replayLoopCount === 0) {
          // Wait 400ms then loop once more
          replayTimeoutRef.current = setTimeout(() => {
            // Reset for second loop
            currentIndex = 0;
            setTiles([...initialTilesState]);
            setCurrentReplayIndex(0);
            setIsReplaying(true);
            
            const loopReplay = () => {
              if (currentIndex >= totalMoves) {
                setIsReplaying(false);
                setCurrentReplayIndex(totalMoves);
                return;
              }
              
              const move = moveRecords[currentIndex];
              
              // Animate hand for this move
              animateHandForReplay(move.fromIndex);
              
              setTiles(prev => {
                const newTiles = [...prev];
                [newTiles[move.fromIndex], newTiles[move.toIndex]] = 
                  [newTiles[move.toIndex], newTiles[move.fromIndex]];
                return newTiles;
              });
              
              setCurrentReplayIndex(currentIndex + 1);
              currentIndex++;
              
              replayTimeoutRef.current = setTimeout(loopReplay, 160);
            };
            
            loopReplay();
          }, 400);
        }
        return;
      }
      
      const move = moveRecords[currentIndex];
      
      // Animate hand for this move
      animateHandForReplay(move.fromIndex);
      
      setTiles(prev => {
        const newTiles = [...prev];
        [newTiles[move.fromIndex], newTiles[move.toIndex]] = 
          [newTiles[move.toIndex], newTiles[move.fromIndex]];
        return newTiles;
      });
      
      setCurrentReplayIndex(currentIndex + 1);
      currentIndex++;
      
      replayTimeoutRef.current = setTimeout(playNextMove, 160);
    };
    
    playNextMove();
  }, [moveRecords, initialTilesState, replayLoopCount, animateHandForReplay]);

  const exitWatchMode = useCallback(() => {
    if (replayTimeoutRef.current) {
      clearTimeout(replayTimeoutRef.current);
      replayTimeoutRef.current = null;
    }
    
    setIsWatchMode(false);
    setIsReplaying(false);
    setCurrentReplayIndex(0);
    setReplayLoopCount(0);
    // Restore the solved state
    const solvedState = Array.from({ length: gridSize * gridSize }, (_, i) => i);
    setTiles([...solvedState]);
  }, [gridSize]);

  const today = new Date().toDateString();
  const dailyCompleted = dailyStats[today]?.completed || false;
  const dailyPercentile = dailyCompleted
    ? getDailyPercentile(dailyStats[today].moves, dailyStats[today].time)
    : 0;

  if (showSplash) {
    return (
      <div
        className={`h-[70vh] max-h-[640px] w-[360px] ${
          themeMode === "dark" ? "bg-gray-900" : "bg-white"
        } flex items-center justify-center`}
      >
        <div className="text-center animate-pulse">
          <div
            className={`text-6xl font-black ${
              themeMode === "dark" ? "text-white" : "text-[#0A0A0A]"
            } tracking-tight mb-6`}
          >
            🧩 FOTO
          </div>
          <div
            className={`${
              themeMode === "dark" ? "text-gray-400" : "text-[#666666]"
            } text-base tracking-wide`}
          >
            Image Puzzle Game
          </div>
          <div className="mt-10 flex items-center justify-center gap-2">
            <div
              className={`w-2 h-2 rounded-full animate-bounce ${
                themeMode === "dark" ? "bg-blue-400" : "bg-[#007AFF]"
              }`}
              style={{ animationDelay: "0s" }}
            />
            <div
              className={`w-2 h-2 rounded-full animate-bounce ${
                themeMode === "dark" ? "bg-blue-400" : "bg-[#007AFF]"
              }`}
              style={{ animationDelay: "0.1s" }}
            />
            <div
              className={`w-2 h-2 rounded-full animate-bounce ${
                themeMode === "dark" ? "bg-blue-400" : "bg-[#007AFF]"
              }`}
              style={{ animationDelay: "0.2s" }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (showImagePicker) {
    let isLoading = false;
    let currentItems: PuzzleItem[] = [];
    let selectedItem: PuzzleItem | null = null;
    let errorMessage: string | null = null;

    switch (activeTab) {
      case "main":
        currentItems = PUZZLE_IMAGES;
        selectedItem = selectedMain;
        break;
      case "create":
        isLoading = isLoadingPixabay;
        currentItems = pixabayImages;
        selectedItem = selectedPixabayImage;
        errorMessage = pixabayError;
        break;
      case "local":
        currentItems = localImages;
        selectedItem = selectedLocalImage;
        break;
    }

    return (
      <>
        <style>
          {`
          @keyframes hand-press {
            0% { transform: scale(1) translateY(0); }
            50% { transform: scale(0.85) translateY(5px); }
            100% { transform: scale(1) translateY(0); }
          }
          .hand-tap {
            animation: hand-press 200ms ease-out;
          }
          
          @keyframes pulse-subtle {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }
          .animate-pulse-subtle {
            animation: pulse-subtle 1.5s ease-in-out infinite;
          }
         `}
        </style>
        <div
          className={`h-full w-full ${
            themeMode === "dark" ? "bg-gray-900" : "bg-white"
          } overflow-y-auto`}
        >
          {/* Theme Toggle inside GameSandbox */}
          <div className="px-5 pt-4 flex justify-between items-center w-full">
            <h3
              className={` ${
                themeMode === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              FOTO
            </h3>
            <button
              onClick={() => {
                const newTheme = themeMode === "light" ? "dark" : "light";
                setThemeMode(newTheme);
                localStorage.setItem("foto_theme", newTheme);
              }}
              className={`relative w-12 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none focus:ring-2 ${
                themeMode === "dark"
                  ? "bg-gray-700 focus:ring-blue-500"
                  : "bg-gray-300 focus:ring-blue-400"
              }`}
              aria-label={`Switch to ${
                themeMode === "light" ? "dark" : "light"
              } mode`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                  themeMode === "dark" ? "translate-x-6" : "translate-x-0"
                }`}
              />
              <span className="absolute left-1 top-1 text-[10px]">
                {themeMode === "dark" ? "🌙" : "🌞"}
              </span>
            </button>
          </div>

          {/* Daily Puzzle Card */}
          {dailyPuzzle && (
            <div className={`px-5 pt-2 ${showDailyComplete ? "pb-4" : "pb-6"}`}>
              <div
                className={`relative rounded-[20px] p-5 ${
                  themeMode === "dark"
                    ? "bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/20"
                    : "bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200"
                }`}
              >
                <div className="absolute top-3 right-3">
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                      themeMode === "dark"
                        ? "bg-orange-500/20 text-orange-300"
                        : "bg-orange-100 text-orange-600"
                    }`}
                  >
                    🔥 TODAY'S PUZZLE
                  </span>
                </div>

                <div className="flex items-center gap-4 mt-2">
                  <div className="w-16 h-16 rounded-[14px] overflow-hidden">
                    <img
                      src={PUZZLE_IMAGES[dailyPuzzle.imageIndex].imageUrl}
                      alt="Daily Puzzle"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`font-bold text-lg ${
                        themeMode === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {PUZZLE_IMAGES[dailyPuzzle.imageIndex].name}
                    </h3>
                    <p
                      className={`text-sm ${
                        themeMode === "dark" ? "text-gray-300" : "text-gray-600"
                      } mb-2`}
                    >
                      {dailyPuzzle.gridSize}×{dailyPuzzle.gridSize} Grid •{" "}
                      {today}
                    </p>

                    {showDailyComplete ? (
                      <div
                        className={`rounded-[12px] p-3 ${
                          themeMode === "dark"
                            ? "bg-gray-800/50"
                            : "bg-white/80"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span
                            className={`text-sm ${
                              themeMode === "dark"
                                ? "text-gray-300"
                                : "text-gray-600"
                            }`}
                          >
                            Your score
                          </span>
                          <span
                            className={`text-lg font-bold ${
                              themeMode === "dark"
                                ? "text-white"
                                : "text-gray-900"
                            }`}
                          >
                            {dailyStats[today].moves} moves •{" "}
                            {formatTime(dailyStats[today].time)}
                          </span>
                        </div>
                        <div
                          className={`text-center py-2 rounded-[10px] ${
                            themeMode === "dark"
                              ? "bg-gray-900/50"
                              : "bg-gray-100"
                          }`}
                        >
                          <span
                            className={`text-sm font-medium ${
                              themeMode === "dark"
                                ? "text-blue-300"
                                : "text-blue-600"
                            }`}
                          >
                            🏆 You beat {dailyPercentile}% of players today
                          </span>
                        </div>
                        <button
                          onClick={() => startGame(dailyPuzzle.gridSize, true)}
                          className="w-full mt-3 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-[12px] hover:opacity-90 transition-all"
                        >
                          🔄 Play Again
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startGame(dailyPuzzle.gridSize, true)}
                        className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-[14px] hover:opacity-90 transition-all shadow-lg"
                      >
                        🚀 PLAY CHALLENGE
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className={`px-5 ${showDailyComplete ? "pt-0" : "pt-5"} pb-24`}>
            {/* Recently Added Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-5">
                <h2
                  className={`text-xl font-bold ${
                    themeMode === "dark" ? "text-white" : "text-[#0A0A0A]"
                  }`}
                >
                  Recently Added
                </h2>
                <button
                  className={`text-sm font-medium ${
                    themeMode === "dark" ? "text-blue-400" : "text-[#007AFF]"
                  }`}
                >
                  View more
                </button>
              </div>
              <div className="flex space-x-4 overflow-x-auto pb-3 -mx-5 px-5">
                {currentItems.slice(0, 4).map((item) => (
                  <div
                    key={`recent-${item.id}`}
                    className={`flex-shrink-0 w-32 h-32 rounded-[20px] overflow-hidden shadow-sm ${
                      themeMode === "dark" ? "bg-gray-800" : "bg-[#F5F5F7]"
                    }`}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Section */}
            <div className="mb-8">
              <h2
                className={`text-xl font-bold mb-5 ${
                  themeMode === "dark" ? "text-white" : "text-[#0A0A0A]"
                }`}
              >
                Popular
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {currentItems.slice(0, 4).map((item) => (
                  <div
                    key={`popular-${item.id}`}
                    className={`aspect-square rounded-[20px] overflow-hidden shadow-sm ${
                      themeMode === "dark" ? "bg-gray-800" : "bg-[#F5F5F7]"
                    }`}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Puzzle Difficulty Section */}
            <div className="mb-8">
              <h2
                className={`text-xl font-bold mb-2 ${
                  themeMode === "dark" ? "text-white" : "text-[#0A0A0A]"
                }`}
              >
                Pick your difficulty
              </h2>
              <p
                className={`text-sm mb-6 ${
                  themeMode === "dark" ? "text-gray-400" : "text-[#666666]"
                }`}
              >
                Select the number of pieces for your puzzle
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setGridSize(3)}
                  className={`flex-1 py-4 rounded-[14px] font-medium text-center transition-all ${
                    gridSize === 3
                      ? themeMode === "dark"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-[#0A0A0A] text-white shadow-sm"
                      : themeMode === "dark"
                      ? "bg-gray-800 text-gray-300"
                      : "bg-[#F5F5F7] text-[#666666]"
                  }`}
                >
                  <div className="text-lg">3x3</div>
                  <div className="text-xs mt-1">PIECES</div>
                </button>
                <button
                  onClick={() => setGridSize(4)}
                  className={`flex-1 py-4 rounded-[14px] font-medium text-center transition-all ${
                    gridSize === 4
                      ? themeMode === "dark"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-[#0A0A0A] text-white shadow-sm"
                      : themeMode === "dark"
                      ? "bg-gray-800 text-gray-300"
                      : "bg-[#F5F5F7] text-[#666666]"
                  }`}
                >
                  <div className="text-lg">4x4</div>
                  <div className="text-xs mt-1">PIECES</div>
                </button>
                <button
                  onClick={() => setGridSize(5)}
                  className={`flex-1 py-4 rounded-[14px] font-medium text-center transition-all ${
                    gridSize === 5
                      ? themeMode === "dark"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-[#0A0A0A] text-white shadow-sm"
                      : themeMode === "dark"
                      ? "bg-gray-800 text-gray-300"
                      : "bg-[#F5F5F7] text-[#666666]"
                  }`}
                >
                  <div className="text-lg">5x5</div>
                  <div className="text-xs mt-1">PIECES</div>
                </button>
              </div>
            </div>

            {/* Create Section */}
            {activeTab === "create" && (
              <div className="mb-8">
                <div
                  className={`rounded-[24px] p-4 ${
                    themeMode === "dark" ? "bg-gray-800" : "bg-[#F5F5F7]"
                  }`}
                >
                  <h3
                    className={`text-xl font-bold mb-2 ${
                      themeMode === "dark" ? "text-white" : "text-[#0A0A0A]"
                    }`}
                  >
                    Bring your ideas to life.
                  </h3>
                  <p
                    className={`text-sm mb-6 ${
                      themeMode === "dark" ? "text-gray-400" : "text-[#666666]"
                    }`}
                  >
                    Create new puzzles using our AI.
                  </p>

                  <div className="flex mb-4">
                    <input
                      type="text"
                      value={pixabaySearchQuery}
                      onChange={(e) => setPixabaySearchQuery(e.target.value)}
                      placeholder="Search for images..."
                      className={`flex-1 px-2 py-3 rounded-l-[12px] focus:outline-none text-sm ${
                        themeMode === "dark"
                          ? "bg-gray-900 border border-gray-700 text-white focus:border-blue-500"
                          : "bg-white border border-[#EAEAEA] text-[#0A0A0A] focus:border-[#007AFF]"
                      }`}
                    />
                    <button
                      onClick={() => fetchPixabayImages(pixabaySearchQuery)}
                      className="px-2 bg-[#007AFF] text-white font-medium rounded-r-[12px] text-sm hover:bg-[#0056CC]"
                    >
                      Search
                    </button>
                  </div>
                </div>

                <h4
                  className={`text-lg font-semibold mt-8 mb-4 ${
                    themeMode === "dark" ? "text-white" : "text-[#0A0A0A]"
                  }`}
                >
                  Created by the community
                </h4>
              </div>
            )}

            {/* Upload Section for Local tab */}
            {activeTab === "local" && (
              <div className="mb-8">
                <div
                  className={`rounded-[24px] p-6 ${
                    themeMode === "dark" ? "bg-gray-800" : "bg-[#F5F5F7]"
                  }`}
                >
                  <h3
                    className={`text-xl font-bold mb-2 ${
                      themeMode === "dark" ? "text-white" : "text-[#0A0A0A]"
                    }`}
                  >
                    Upload Your Image
                  </h3>
                  <p
                    className={`text-sm mb-6 ${
                      themeMode === "dark" ? "text-gray-400" : "text-[#666666]"
                    }`}
                  >
                    Create puzzles from your own photos!
                  </p>

                  <label className="block w-full">
                    <div
                      className={`w-full py-8 border-2 border-dashed rounded-[20px] flex flex-col items-center justify-center cursor-pointer transition-all ${
                        themeMode === "dark"
                          ? "bg-gray-900 border-gray-700 hover:border-blue-500"
                          : "bg-white border-[#EAEAEA] hover:border-[#007AFF]"
                      }`}
                    >
                      {isUploading ? (
                        <>
                          <div className="w-8 h-8 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin mb-3" />
                          <p
                            className={`text-sm ${
                              themeMode === "dark"
                                ? "text-gray-400"
                                : "text-[#666666]"
                            }`}
                          >
                            Uploading...
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="text-3xl mb-3">📁</div>
                          <p
                            className={`font-medium ${
                              themeMode === "dark"
                                ? "text-white"
                                : "text-[#0A0A0A]"
                            }`}
                          >
                            Choose an image
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              themeMode === "dark"
                                ? "text-gray-500"
                                : "text-[#666666]"
                            }`}
                          >
                            JPEG, PNG, GIF, WebP (max 5MB)
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>

                  {uploadError && (
                    <div
                      className={`mt-4 rounded-[12px] p-4 ${
                        themeMode === "dark"
                          ? "bg-red-900/30 border border-red-800"
                          : "bg-red-50 border border-red-200"
                      }`}
                    >
                      <p className="text-red-600 text-sm text-center">
                        {uploadError}
                      </p>
                    </div>
                  )}
                </div>

                <h4
                  className={`text-lg font-semibold mt-8 mb-4 ${
                    themeMode === "dark" ? "text-white" : "text-[#0A0A0A]"
                  }`}
                >
                  My Uploads
                </h4>
              </div>
            )}

            {/* Image Selection Grid */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
                <p
                  className={`mt-4 text-sm ${
                    themeMode === "dark" ? "text-gray-400" : "text-[#666666]"
                  }`}
                >
                  Loading images...
                </p>
              </div>
            ) : activeTab === "local" && localImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-4xl mb-4 text-gray-400">📁</div>
                <p
                  className={`mb-2 text-center ${
                    themeMode === "dark" ? "text-gray-400" : "text-[#666666]"
                  }`}
                >
                  No uploaded images yet
                </p>
                <p
                  className={`text-sm text-center ${
                    themeMode === "dark" ? "text-gray-600" : "text-[#999999]"
                  }`}
                >
                  Upload an image above to create your first custom puzzle!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {currentItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (activeTab === "main") selectMain(item);
                      else if (activeTab === "create") selectPixabayImage(item);
                      else selectLocalImage(item);
                    }}
                    className={`relative aspect-square rounded-[20px] overflow-hidden shadow-sm transition-all duration-200 ${
                      selectedItem?.id === item.id
                        ? "ring-2 ring-[#007AFF]"
                        : themeMode === "dark"
                        ? "bg-gray-800"
                        : "bg-[#F5F5F7]"
                    }`}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    {selectedItem?.id === item.id && (
                      <div className="absolute top-3 right-3 bg-[#007AFF] text-white text-xs font-medium px-2 py-1 rounded-full">
                        ✓
                      </div>
                    )}
                    {activeTab === "local" && (
                      <button
                        onClick={(e) => removeLocalImage(item.id, e)}
                        className={`absolute top-3 left-3 text-xs font-medium w-6 h-6 rounded-full flex items-center justify-center shadow-sm transition-all ${
                          themeMode === "dark"
                            ? "bg-gray-700/90 text-white hover:bg-gray-600"
                            : "bg-white/90 text-[#0A0A0A] hover:bg-white"
                        }`}
                      >
                        ×
                      </button>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/40 to-transparent p-3">
                      <p className="font-medium text-white text-sm truncate">
                        {item.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Start Game Floating Button */}
            <div className="flex justify-center mt-10 mb-10">
              <button
                onClick={() => startGame()}
                disabled={
                  !selectedItem ||
                  (activeTab === "create" && isLoadingPixabay) ||
                  (activeTab === "local" && localImages.length === 0)
                }
                className="px-6 py-3 bg-[#007AFF] text-white font-medium rounded-full shadow-lg hover:bg-[#0056CC] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Game
              </button>
            </div>
          </div>

          {/* Bottom Tab Navigation */}
          <div
            className={`absolute bottom-0 w-full right-0 border-t px-5 py-3 ${
              themeMode === "dark"
                ? "bg-gray-900 border-gray-800"
                : "bg-white border-[#EAEAEA]"
            }`}
          >
            <div className="flex justify-around">
              <button
                onClick={() => setActiveTab("main")}
                className={`flex flex-col items-center px-4 py-2 rounded-full transition-all ${
                  activeTab === "main"
                    ? themeMode === "dark"
                      ? "bg-gray-800"
                      : "bg-[#0A0A0A]"
                    : ""
                }`}
              >
                <div
                  className={`text-md ${
                    activeTab === "main"
                      ? "text-white"
                      : themeMode === "dark"
                      ? "text-gray-400"
                      : "text-[#666666]"
                  }`}
                >
                  🏠
                </div>
                <span
                  className={`text-[10px] mt-1 ${
                    activeTab === "main"
                      ? "text-white font-medium"
                      : themeMode === "dark"
                      ? "text-gray-400"
                      : "text-[#666666]"
                  }`}
                >
                  Main
                </span>
              </button>
              <button
                onClick={() => setActiveTab("create")}
                className={`flex flex-col items-center px-4 py-2 rounded-full transition-all ${
                  activeTab === "create"
                    ? themeMode === "dark"
                      ? "bg-gray-800"
                      : "bg-[#0A0A0A]"
                    : ""
                }`}
              >
                <div
                  className={`text-md ${
                    activeTab === "create"
                      ? "text-white"
                      : themeMode === "dark"
                      ? "text-gray-400"
                      : "text-[#666666]"
                  }`}
                >
                  ✨
                </div>
                <span
                  className={`text-[10px] mt-1 ${
                    activeTab === "create"
                      ? "text-white font-medium"
                      : themeMode === "dark"
                      ? "text-gray-400"
                      : "text-[#666666]"
                  }`}
                >
                  Create
                </span>
              </button>
              <button
                onClick={() => setActiveTab("local")}
                className={`flex flex-col items-center px-4 py-2 rounded-full transition-all ${
                  activeTab === "local"
                    ? themeMode === "dark"
                      ? "bg-gray-800"
                      : "bg-[#0A0A0A]"
                    : ""
                }`}
              >
                <div
                  className={`text-md ${
                    activeTab === "local"
                      ? "text-white"
                      : themeMode === "dark"
                      ? "text-gray-400"
                      : "text-[#666666]"
                  }`}
                >
                  📁
                </div>
                <span
                  className={`text-[10px] mt-1 ${
                    activeTab === "local"
                      ? "text-white font-medium"
                      : themeMode === "dark"
                      ? "text-gray-400"
                      : "text-[#666666]"
                  }`}
                >
                  Local
                </span>
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Game Screen
  let selectedItem: PuzzleItem | null;

  switch (activeTab) {
    case "main":
      selectedItem = selectedMain;
      break;
    case "create":
      selectedItem = selectedPixabayImage;
      break;
    case "local":
      selectedItem = selectedLocalImage;
      break;
    default:
      selectedItem = selectedMain;
  }

  return (
    <div
      className={`h-full w-full overflow-auto ${
        themeMode === "dark" ? "bg-gray-900" : "bg-white"
      } relative`}
    >
      {/* Watch Mode Overlay */}
      {isWatchMode && (
        <div className="absolute inset-0 z-40 bg-black/20 backdrop-blur-[1px]">
          {/* Watch Mode Header */}
          <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-5 z-50">
            <div className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
              <span className="text-white text-xs font-medium">Replay</span>
            </div>
            <button
              onClick={exitWatchMode}
              className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium hover:bg-black/70 transition-colors"
            >
              Exit
            </button>
          </div>
          
          {/* Progress Indicator */}
          {moveRecords.length > 0 && (
            <div className="absolute bottom-20 left-0 right-0 flex justify-center space-x-1.5">
              {Array.from({ length: moveRecords.length }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                    idx < currentReplayIndex
                      ? "bg-blue-400"
                      : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
          
          {/* Solved Text (appears after replay) */}
          {!isReplaying && currentReplayIndex >= moveRecords.length && moveRecords.length > 0 && (
            <div className="absolute bottom-28 left-0 right-0 flex justify-center animate-fade-in">
              <div className="px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm">
                <span className="text-white text-sm font-medium">
                  Solved in {moves} moves
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sound Toggle - Fixed positioning to not overlap Back button */}
      {!isWatchMode && (
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`absolute top-16 right-4 z-10 p-2 rounded-full ${
            themeMode === "dark"
              ? "bg-gray-800 hover:bg-gray-700"
              : "bg-gray-100 hover:bg-gray-200"
          } transition-all z-30`}
          aria-label={soundEnabled ? "Mute sounds" : "Enable sounds"}
        >
          {soundEnabled ? "🔊" : "🔇"}
        </button>
      )}

      <div className="px-5 pt-5">
        {/* Game Header - Fixed layout to prevent overlap */}
        <div className="flex items-center justify-between mb-6 relative">
          <button
            onClick={resetGame}
            className="text-[#007AFF] text-sm font-medium z-20 relative"
          >
            ← Back
          </button>

          <div className="flex gap-8 relative z-10">
            <div className="text-center">
              <p
                className={`text-xs uppercase tracking-wider mb-1 ${
                  themeMode === "dark" ? "text-gray-400" : "text-[#666666]"
                }`}
              >
                Moves
              </p>
              <p
                className={`text-2xl font-bold ${
                  themeMode === "dark" ? "text-white" : "text-[#0A0A0A]"
                }`}
              >
                {moves}
              </p>
            </div>
            <div className="text-center">
              <p
                className={`text-xs uppercase tracking-wider mb-1 ${
                  themeMode === "dark" ? "text-gray-400" : "text-[#666666]"
                }`}
              >
                Time
              </p>
              <p
                className={`text-2xl font-bold ${
                  themeMode === "dark" ? "text-white" : "text-[#0A0A0A]"
                }`}
              >
                {formatTime(seconds)}
              </p>
            </div>
          </div>
          
          {/* Empty div to balance layout */}
          <div className="w-10"></div>
        </div>

        <div className="flex flex-col items-center">
          {/* Game Board */}
          <div
            data-game-board
            className={`relative rounded-[24px] shadow-sm mb-6 overflow-hidden transition-all duration-300 ${
              themeMode === "dark" ? "bg-gray-800" : "bg-[#F5F5F7]"
            } ${isWatchMode ? 'scale-[0.96] border-2 border-blue-400/30 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : ''}`}
            style={{
              width: puzzleSize + 16,
              height: puzzleSize + 16,
            }}
          >
            {tiles.map((tile, index) => {
              if (tile === 0)
                return (
                  <div
                    key={index}
                    className={`absolute rounded-[8px] ${
                      themeMode === "dark" ? "bg-white/10" : "bg-white/50"
                    }`}
                    style={{
                      width: tileSize,
                      height: tileSize,
                      left: (index % gridSize) * (tileSize + 4) + 4,
                      top: Math.floor(index / gridSize) * (tileSize + 4) + 4,
                    }}
                  />
                );
              const pos = getTilePosition(tile);
              return (
                <button
                  key={index}
                  onClick={() => handleTileClick(index)}
                  disabled={hasWon || isWatchMode || isReplaying}
                  className="absolute overflow-hidden rounded-[8px] transition-all duration-150 active:scale-95"
                  style={{
                    width: tileSize,
                    height: tileSize,
                    left: (index % gridSize) * (tileSize + 4) + 4,
                    top: Math.floor(index / gridSize) * (tileSize + 4) + 4,
                  }}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-no-repeat"
                    style={{
                      backgroundImage: `url(${selectedItem!.imageUrl})`,
                      backgroundSize: `${puzzleSize - 8}px ${puzzleSize - 8}px`,
                      backgroundPosition: `${-pos.x * tileSize}px ${
                        -pos.y * tileSize
                      }px`,
                    }}
                  />
                </button>
              );
            })}
          </div>

          {/* Hand Animation for gameplay */}
          {handPosition.visible && !hasWon && isPlaying && !isWatchMode && (
            <div
              ref={handRef}
              className="fixed pointer-events-none z-50 transition-all duration-120 ease-out"
              style={{
                left: handPosition.x,
                top: handPosition.y,
                transform:
                  handAnimation === "tapping" ? "scale(0.8)" : "scale(1)",
                opacity: handPosition.visible ? 1 : 0,
                width: "48px",
                height: "48px",
              }}
            >
              <img
                src="/assets/hand.png"
                alt="Hand pointer"
                className="w-full h-full object-contain drop-shadow-lg"
                style={{
                  transform:
                    handAnimation === "tapping"
                      ? "scale(0.85) translateY(5px)"
                      : "scale(1)",
                  transition:
                    handAnimation === "tapping"
                      ? "transform 80ms ease-out"
                      : "transform 120ms ease-out",
                  filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.3))",
                }}
              />
            </div>
          )}

          {/* Hand Animation for replay */}
          {handPosition.visible && isWatchMode && isReplaying && (
            <div
              ref={handRef}
              className="fixed pointer-events-none z-50 transition-all duration-120 ease-out"
              style={{
                left: handPosition.x,
                top: handPosition.y,
                transform:
                  handAnimation === "tapping" ? "scale(0.8)" : "scale(1)",
                opacity: handPosition.visible ? 1 : 0,
                width: "48px",
                height: "48px",
              }}
            >
              <img
                src="/assets/hand.png"
                alt="Hand pointer"
                className="w-full h-full object-contain drop-shadow-lg"
                style={{
                  transform:
                    handAnimation === "tapping"
                      ? "scale(0.85) translateY(5px)"
                      : "scale(1)",
                  transition:
                    handAnimation === "tapping"
                      ? "transform 80ms ease-out"
                      : "transform 120ms ease-out",
                  filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.3))",
                }}
              />
            </div>
          )}

          {/* Goal Image Preview */}
          <div
            className={`flex items-center gap-4 mb-6 rounded-[20px] p-4 w-full max-w-xs ${
              themeMode === "dark" ? "bg-gray-800" : "bg-[#F5F5F7]"
            }`}
          >
            <div className="text-center">
              <p
                className={`text-xs uppercase tracking-wider mb-2 ${
                  themeMode === "dark" ? "text-gray-400" : "text-[#666666]"
                }`}
              >
                Goal
              </p>
              <img
                src={selectedItem!.imageUrl}
                alt="Goal"
                className="w-16 h-16 rounded-[12px] object-cover"
              />
            </div>
            <div className="text-left">
              <p
                className={`font-semibold ${
                  themeMode === "dark" ? "text-white" : "text-[#0A0A0A]"
                }`}
              >
                {selectedItem!.name}
              </p>
              <p
                className={`text-sm ${
                  themeMode === "dark" ? "text-gray-400" : "text-[#666666]"
                }`}
              >
                {selectedItem!.symbol}
              </p>
            </div>
          </div>

          {/* Controls - Hidden during watch mode */}
          {!isWatchMode && (
            <div className="flex gap-3 w-full max-w-xs">
              <button
                onClick={() => startGame()}
                className={`flex-1 py-3 border font-medium rounded-[12px] hover:opacity-90 transition-all text-sm ${
                  themeMode === "dark"
                    ? "bg-gray-800 border-gray-700 text-white"
                    : "bg-gray-400/50 border-[#EAEAEA] text-[#0A0A0A]"
                }`}
              >
                🔄 Shuffle
              </button>
              <button
                onClick={resetGame}
                className={`flex-1 py-3 border font-medium rounded-[12px] hover:opacity-90 transition-all text-sm ${
                  themeMode === "dark"
                    ? "bg-gray-800 border-gray-700 text-white"
                    : "bg-gray-400/50 border-[#EAEAEA] text-[#0A0A0A]"
              }`}
              >
                Change Image
              </button>
            </div>
          )}
        </div>

        {/* Win Modal with Watch Mode Button */}
        {hasWon && selectedItem && !isWatchMode && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-5 z-40">
            {showConfetti && <Confetti />}
            <div
              className={`w-full max-w-sm rounded-[28px] overflow-hidden shadow-xl ${
                themeMode === "dark" ? "bg-gray-900" : "bg-white"
              } z-50`}
            >
              {/* Card Preview */}
              <div className="p-6 pb-4">
                <h3
                  className={`text-2xl font-bold tracking-tight leading-none mb-6 ${
                    themeMode === "dark" ? "text-white" : "text-[#0A0A0A]"
                  }`}
                >
                  PUZZLE COMPLETED
                </h3>

                {/* Framed Image */}
                <div
                  className={`border p-4 rounded-[20px] mb-4 ${
                    themeMode === "dark"
                      ? "border-gray-700"
                      : "border-[#EAEAEA]"
                  }`}
                >
                  <p
                    className={`text-center font-medium tracking-wide text-sm mb-3 uppercase ${
                      themeMode === "dark" ? "text-white" : "text-[#0A0A0A]"
                    }`}
                  >
                    {selectedItem.name}
                  </p>
                  <img
                    src={selectedItem.imageUrl}
                    alt={selectedItem.name}
                    className="w-full aspect-square object-cover rounded-[12px]"
                  />
                  <p
                    className={`text-sm italic mt-3 text-center ${
                      themeMode === "dark" ? "text-gray-400" : "text-[#666666]"
                    }`}
                  >
                    Foto Game
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div
                className={`border-t ${
                  themeMode === "dark" ? "border-gray-800" : "border-[#EAEAEA]"
                }`}
              >
                <div
                  className={`grid grid-cols-2 ${
                    themeMode === "dark"
                      ? "divide-gray-800"
                      : "divide-[#EAEAEA]"
                  } divide-x`}
                >
                  <div className="p-3 text-center">
                    <p
                      className={`text-sm font-medium tracking-wider mb-2 ${
                        themeMode === "dark"
                          ? "text-gray-400"
                          : "text-[#666666]"
                      }`}
                    >
                      MOVES
                    </p>
                    <p
                      className={`text-3xl font-bold ${
                        themeMode === "dark" ? "text-white" : "text-[#0A0A0A]"
                      }`}
                    >
                      {moves}
                    </p>
                  </div>
                  <div className="p-3 text-center">
                    <p
                      className={`text-sm font-medium tracking-wider mb-2 ${
                        themeMode === "dark"
                          ? "text-gray-400"
                          : "text-[#666666]"
                      }`}
                    >
                      TIME
                    </p>
                    <p
                      className={`text-3xl font-bold ${
                        themeMode === "dark" ? "text-white" : "text-[#0A0A0A]"
                      }`}
                    >
                      {formatTime(seconds)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-3 space-y-3">
                {/* Watch Mode Button - only show if we have moves recorded */}
                {showWatchButton && moveRecords.length > 0 && (
                  <button
                    onClick={startWatchMode}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-[14px] hover:opacity-90 transition-all animate-pulse-subtle flex items-center justify-center gap-2"
                  >
                    <span className="text-lg">👀</span>
                    <span>Watch How You Solved It</span>
                  </button>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={downloadVictoryCard}
                    disabled={isDownloading}
                    className={`py-3 text-white font-medium rounded-[12px] hover:opacity-90 transition-all text-sm disabled:opacity-50 ${
                      themeMode === "dark" ? "bg-blue-600" : "bg-[#0A0A0A]"
                    }`}
                  >
                    {isDownloading ? "Saving..." : "⬇️ Save Card"}
                  </button>
                  <button
                    onClick={shareOnX}
                    className={`py-3 border font-medium rounded-[12px] hover:opacity-90 transition-all text-sm ${
                      themeMode === "dark"
                        ? "bg-gray-800 border-gray-700 text-white"
                        : "bg-white border-[#EAEAEA] text-[#0A0A0A]"
                    }`}
                  >
                    Share on X
                  </button>
                </div>
                <button
                  onClick={resetGame}
                  className="w-full py-4 bg-[#007AFF] text-white font-medium rounded-[14px] hover:bg-[#0056CC] transition-all"
                >
                  🎮 PLAY AGAIN
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Confetti: FC = () => {
  const [pieces] = useState(() => Array.from({ length: 50 }));
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.6;
        const bg = ["#007AFF", "#34C759", "#FF9500", "#FF3B30", "#AF52DE"][
          i % 5
        ];
        const style: React.CSSProperties = {
          left: `${left}%`,
          animationDelay: `${delay}s`,
          background: bg,
          width: `${Math.random() * 10 + 8}px`,
          height: `${Math.random() * 10 + 12}px`,
          borderRadius: Math.random() > 0.5 ? "2px" : "50%",
          position: "absolute",
          top: "-20px",
          animation: "confetti-fall 3s ease-out forwards",
        };
        return <div key={i} style={style} />;
      })}
      <style>{`
        @keyframes confetti-fall {
          to {
            transform: translateY(120vh) rotate(720deg);
            opacity: 0;
          }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};