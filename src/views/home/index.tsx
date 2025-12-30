// Next, React
import { FC, useEffect, useState } from "react";
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
          {/* Fake “feed card” top bar inside the phone */}
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

const PUZZLE_IMAGES: PuzzleItem[] = [
  { id: 1, imageUrl: "/assets/jup.jpg", name: "Jupiter", symbol: "JUP" },
  { id: 2, imageUrl: "/assets/sol.jpg", name: "Solana", symbol: "SOL" },
  { id: 3, imageUrl: "/assets/scroll.jpg", name: "Scrolly", symbol: "SCRL" },
  { id: 4, imageUrl: "/assets/uncle.jpg", name: "UnclePhil", symbol: "DEV" },
];

const GameSandbox: FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [gridSize, setGridSize] = useState(3);
  const [tiles, setTiles] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(true);
  const [activeTab, setActiveTab] = useState<"brands" | "tokens">("brands");
  const [solanaTokens, setSolanaTokens] = useState<PuzzleItem[]>([]);
  const [selectedToken, setSelectedToken] = useState<PuzzleItem | null>(null);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<PuzzleItem>(
    PUZZLE_IMAGES[0]
  );
  const [posts, setPosts] = useState<
    { id: number; text: string; time: number }[]
  >([]);
  const [postText, setPostText] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [puzzleSize, setPuzzleSize] = useState(300);
  const [tileSize, setTileSize] = useState((300 - (3 + 1) * 4) / 3);

  // Fetch Solana tokens from DexScreener API
  useEffect(() => {
    const fetchSolanaTokens = async () => {
      setIsLoadingTokens(true);
      setTokenError(null);

      try {
        const response = await fetch(
          "https://api.dexscreener.com/token-profiles/latest/v1",
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

        const solanaTokensData = data
          .filter(
            (token: any) =>
              token.chainId?.toLowerCase() === "solana" &&
              token.icon &&
              token.tokenAddress
          )
          .slice(0, 8)
          .map((token: any, index: number) => ({
            id: index + 1,
            name:
              token.description?.slice(0, 20) ||
              token.tokenAddress.slice(0, 8) + "..." ||
              "Unknown Token",
            imageUrl: token.icon,
            symbol:
              token.tokenAddress.slice(0, 4).toUpperCase() + "..." || "TOKEN",
          }));

        if (solanaTokensData.length > 0) {
          setSolanaTokens(solanaTokensData);
          if (activeTab === "tokens") {
            setSelectedToken(solanaTokensData[0]);
          }
        } else {
          setSolanaTokens([]);
          setTokenError("No tokens available from API");
        }
      } catch (error: any) {
        console.error("Failed to fetch tokens:", error);
        setTokenError("API unavailable - switch to Brands tab");
        setSolanaTokens([]);
      } finally {
        setIsLoadingTokens(false);
      }
    };

    fetchSolanaTokens();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(t);
  }, []);

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

  const startGame = (size?: number) => {
    let selectedItem: PuzzleItem | null;
    if (activeTab === "brands") {
      selectedItem = selectedBrand;
    } else {
      selectedItem = selectedToken;
    }

    if (!selectedItem) {
      alert(
        `Please select a ${activeTab === "brands" ? "brand" : "token"} first!`
      );
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
    setTiles(arr);
    setMoves(0);
    setSeconds(0);
    setIsPlaying(true);
    setHasWon(false);
    setShowImagePicker(false);
  };

  const selectToken = (token: PuzzleItem) => {
    setSelectedToken(token);
  };

  const selectBrand = (brand: PuzzleItem) => {
    setSelectedBrand(brand);
  };

  useEffect(() => {
    if (!isPlaying || hasWon) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isPlaying, hasWon]);

  useEffect(() => {
    if (!hasWon) return;
    setShowConfetti(true);
    const t = setTimeout(() => setShowConfetti(false), 3500);
    return () => clearTimeout(t);
  }, [hasWon]);

  const handleTileClick = (index: number) => {
    const selectedItem = activeTab === "brands" ? selectedBrand : selectedToken;

    if (!selectedItem || hasWon || tiles[index] === 0) return;
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
    [newTiles[index], newTiles[emptyIndex]] = [
      newTiles[emptyIndex],
      newTiles[index],
    ];
    setTiles(newTiles);
    setMoves((m) => m + 1);
    if (isSolved(newTiles)) {
      setHasWon(true);
      setIsPlaying(false);
      setPostText(
        `I just completed the ${selectedItem.name} puzzle in ${
          moves + 1
        } moves and ${formatTime(seconds)}! 🎉 #FOTOGame #Solana`
      );
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
    // This only runs on the client side
    const updateSize = () => {
      const width = window.innerWidth;
      const newPuzzleSize = width < 300 ? 180 : 300;
      const newTileSize = (newPuzzleSize - (gridSize + 1) * 4) / gridSize;
      setPuzzleSize(newPuzzleSize);
      setTileSize(newTileSize);
    };

    // Initial calculation
    updateSize();

    // Listen for window resize
    window.addEventListener("resize", updateSize);

    return () => window.removeEventListener("resize", updateSize);
  }, [gridSize]); // Re-calculate when gridSize changes

  // Helper function to load image as data URL to bypass CORS
  const loadImageAsDataUrl = async (url: string): Promise<string | null> => {
    try {
      // First try to fetch the image and convert to blob
      const response = await fetch(url, { mode: "cors" });
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      // If fetch fails, try loading image directly and drawing to canvas
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

  // Updated victory card generator matching the reference design
  const generateVictoryCard = async (): Promise<string> => {
    const selectedItem = activeTab === "brands" ? selectedBrand : selectedToken;

    if (!selectedItem) {
      throw new Error("No item selected");
    }

    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext("2d")!;

    // Dark navy background
    ctx.fillStyle = "#03070eff";
    ctx.fillRect(0, 0, 800, 1000);

    // "PUZZLE" text - large bold
    ctx.textAlign = "left";
    ctx.font = "bold 90px Arial Black, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("PUZZLE", 40, 100);

    // "COMPLETED" text - large bold
    ctx.fillText("COMPLETED", 40, 190);

    // White frame border
    const frameX = 40;
    const frameY = 230;
    const frameWidth = 720;
    const frameHeight = 560;

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(frameX, frameY, frameWidth, frameHeight);

    // Token name above image (inside frame)
    ctx.font = "bold 24px Arial, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(selectedItem.name.toUpperCase(), 400, 280);

    // Load and draw the token image
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
      // Fallback: draw placeholder
      ctx.fillStyle = "#070b13ff";
      ctx.fillRect(220, 310, 360, 360);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 48px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(selectedItem.symbol, 400, 510);
    }

    // "Foto Game" text - italic style at bottom left of frame
    ctx.font = "italic 22px Georgia, serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText("Foto Game", frameX + 20, frameY + frameHeight - 20);

    // Horizontal divider line
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 820);
    ctx.lineTo(760, 820);
    ctx.stroke();

    // Vertical divider in stats area
    ctx.beginPath();
    ctx.moveTo(400, 840);
    ctx.lineTo(400, 980);
    ctx.stroke();

    // MOVES label and value
    ctx.font = "bold 32px Arial, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText("MOVES", 60, 880);

    ctx.font = "bold 64px Arial, sans-serif";
    ctx.fillText(moves.toString(), 60, 960);

    // TIME label and value
    ctx.textAlign = "right";
    ctx.font = "bold 32px Arial, sans-serif";
    ctx.fillText("TIME", 740, 880);

    ctx.font = "bold 64px Arial, sans-serif";
    ctx.fillText(formatTime(seconds), 740, 960);

    return canvas.toDataURL("image/png");
  };

  const downloadVictoryCard = async () => {
    const selectedItem = activeTab === "brands" ? selectedBrand : selectedToken;

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
    const selectedItem = activeTab === "brands" ? selectedBrand : selectedToken;

    if (!selectedItem) return;

    const shareText = `🎉 I just solved the ${
      selectedItem.name
    } puzzle on FOTO! 
    
✅ Completed in ${moves} moves
⏱️ Finished in ${formatTime(seconds)}
🧩 ${gridSize}×${gridSize} Grid
    
Play the Solana token puzzle game at FOTO! #FOTOGame #Solana #scrollygame`;

    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}`;
    window.open(shareUrl, "_blank", "width=550,height=420");
  };

  const addPost = () => {
    if (!postText.trim()) return;
    setPosts((p) => [
      { id: Date.now(), text: postText.trim(), time: Date.now() },
      ...p,
    ]);
    setPostText("");
  };

  const resetGame = () => {
    setShowImagePicker(true);
    setHasWon(false);
    setIsPlaying(false);
    setMoves(0);
    setSeconds(0);
  };

  if (showSplash) {
    return (
      <div className="min-h-screen bg-game-dark flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-4">
            🧩 FOTO
          </div>
          <div className="text-game-muted text-lg tracking-widest uppercase">
            Solana Token Puzzle Game
          </div>
          <div className="mt-8 flex items-center justify-center gap-2">
            <div
              className="w-2 h-2 bg-game-accent rounded-full animate-bounce"
              style={{ animationDelay: "0s" }}
            />
            <div
              className="w-2 h-2 bg-game-accent rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            />
            <div
              className="w-2 h-2 bg-game-accent rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (showImagePicker) {
    const isLoading = activeTab === "tokens" ? isLoadingTokens : false;
    const currentItems = activeTab === "brands" ? PUZZLE_IMAGES : solanaTokens;
    const selectedItem = activeTab === "brands" ? selectedBrand : selectedToken;
    const errorMessage = activeTab === "tokens" ? tokenError : null;

    return (
      <div className="relative h-[70vh] max-h-[640px] w-[360px] bg-game-dark text-white overflow-auto">
        <div className="px-4 py-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block">
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
                🧩 FOTO
              </h1>
              <p className="text-game-muted text-sm tracking-widest uppercase mt-1">
                {activeTab === "brands" ? "Brand Puzzles" : "Token Puzzles"}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-game-card rounded-2xl p-1.5">
            <button
              onClick={() => setActiveTab("brands")}
              className={`flex-1 py-3 rounded-xl font-bold transition-all text-sm ${
                activeTab === "brands"
                  ? "bg-purple-500 text-white shadow-lg shadow-game-cyan/30"
                  : "text-game-muted hover:text-white bg-purple-500/10"
              }`}
            >
              Brands
            </button>
            <button
              onClick={() => setActiveTab("tokens")}
              className={`flex-1 py-3 rounded-xl font-bold transition-all text-sm ${
                activeTab === "tokens"
                  ? "bg-purple-500 text-white shadow-lg shadow-game-purple/30"
                  : "text-game-muted hover:text-white bg-purple-500/10"
              }`}
            >
              Tokens
            </button>
          </div>

          {/* Instructions Modal */}
          {showInstructions && (
            <div className="inset-0 absolute bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-game-card rounded-3xl p-6 max-w-md w-full border border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white">How to Play</h2>
                  <button
                    onClick={() => setShowInstructions(false)}
                    className="text-game-muted hover:text-white text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>
                <div className="space-y-3 text-game-muted text-sm">
                  <p>
                    1. Select a {activeTab === "brands" ? "brand" : "token"}{" "}
                    from the grid below
                  </p>
                  <p>2. Choose puzzle difficulty (3×3 or 4×4)</p>
                  <p>3. Click "Start Game" to scramble the image</p>
                  <p>4. Slide tiles to reassemble the logo</p>
                  <p>5. Complete with minimal moves and time!</p>
                </div>
                <button
                  onClick={() => setShowInstructions(false)}
                  className="w-full mt-6 py-3 bg-game-accent text-game-dark font-bold rounded-xl hover:bg-game-accent/90 transition-all"
                >
                  Got it!
                </button>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-4">
              <p className="text-red-400 text-sm text-center">{errorMessage}</p>
            </div>
          )}

          {/* Selection Grid */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">
                Select a {activeTab === "brands" ? "Brand" : "Token"}
              </h2>
              <button
                onClick={() => setShowInstructions(true)}
                className="text-game-muted hover:text-white text-sm"
              >
                How to play?
              </button>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-game-accent border-t-transparent rounded-full animate-spin" />
                <p className="text-game-muted mt-4 text-sm">
                  Loading Solana tokens...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {currentItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() =>
                      activeTab === "brands"
                        ? selectBrand(item)
                        : selectToken(item)
                    }
                    className={`relative rounded-2xl overflow-hidden transition-all duration-300 aspect-square ${
                      selectedItem?.id === item.id
                        ? "ring-2 ring-game-accent scale-[1.02] shadow-xl shadow-game-accent/20"
                        : "ring-1 ring-white/10 hover:ring-game-accent/50 hover:scale-[1.01]"
                    }`}
                  >
                    <div className="absolute inset-0 bg-game-card">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/assets/sol.jpg";
                        }}
                      />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3">
                      <p className="font-bold text-white text-sm truncate">
                        {item.name}
                      </p>
                      <p className="text-game-muted text-xs">{item.symbol}</p>
                    </div>
                    {selectedItem?.id === item.id && (
                      <div className="absolute top-2 right-2 bg-game-accent text-game-dark text-xs font-bold px-2 py-1 rounded-full">
                        ✓
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
            <div className="bg-game-dark/95 backdrop-blur-lg border-t border-white/5 p-4">
              <div className="">
                {/* Difficulty selector */}
                <div className="flex items-center justify-center gap-3 mb-4">
                  <span className="text-game-muted text-sm">Difficulty:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setGridSize(3)}
                      className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                        gridSize === 3
                          ? "bg-blue-600 text-game-dark"
                          : "bg-blue-500/10 text-game-muted hover:text-white"
                      }`}
                    >
                      3×3
                    </button>
                    <button
                      onClick={() => setGridSize(4)}
                      className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                        gridSize === 4
                          ? "bg-purple-600 text-white"
                          : "bg-purple-500/10 text-game-muted hover:text-white"
                      }`}
                    >
                      4×4
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => startGame()}
                  disabled={
                    !selectedItem || (activeTab === "tokens" && isLoadingTokens)
                  }
                  className="w-full py-4 bg-yellow-500 text-game-dark font-black text-lg rounded-2xl 
                         hover:bg-game-accent/90 active:scale-[0.98] transition-all duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed
                         shadow-lg shadow-game-accent/30"
                >
                  {isLoadingTokens ? "LOADING..." : "🎮 START GAME"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Game Screen
  const selectedItem = activeTab === "brands" ? selectedBrand : selectedToken;

  return (
    <div className="min-h-screen bg-game-dark text-white overflow-auto">
      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Game Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={resetGame}
            className="text-game-muted hover:text-white transition-colors text-sm font-medium"
          >
            ← Back
          </button>

          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-game-muted text-xs uppercase tracking-wider">
                Moves
              </p>
              <p className="text-2xl font-black text-white">{moves}</p>
            </div>
            <div className="text-center">
              <p className="text-game-muted text-xs uppercase tracking-wider">
                Time
              </p>
              <p className="text-2xl font-black text-game-accent">
                {formatTime(seconds)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          {/* Game Board */}
          <div
            className="relative bg-blue-800/10 rounded-2xl shadow-2xl mb-2"
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
                    className="absolute bg-game-dark/50 rounded-lg"
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
                  disabled={hasWon}
                  className="absolute overflow-hidden rounded-lg border border-white/10 
                           hover:border-game-accent/50 transition-all duration-150
                           active:scale-95"
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

          {/* Goal Image Preview */}
          <div className="flex items-center gap-4 mb-6 bg-blue-600/10 rounded-2xl p-2">
            <div className="text-center">
              <p className="text-game-muted text-xs uppercase tracking-wider mb-2">
                Goal
              </p>
              <img
                src={selectedItem!.imageUrl}
                alt="Goal"
                className="w-16 h-16 rounded-xl object-cover border border-white/10"
              />
            </div>
            <div className="text-left">
              <p className="font-bold text-white">{selectedItem!.name}</p>
              <p className="text-game-muted text-sm">{selectedItem!.symbol}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3 w-full max-w-xs pb-4">
            <button
              onClick={() => startGame()}
              className="flex-1 py-3 bg-game-card text-white font-bold rounded-xl 
                       hover:bg-game-card/80 transition-all text-sm border border-white/10"
            >
              🔄 Shuffle
            </button>
            <button
              onClick={resetGame}
              className="flex-1 py-3 bg-game-card text-white font-bold rounded-xl 
                       hover:bg-game-card/80 transition-all text-sm border border-white/10"
            >
              Change {activeTab === "brands" ? "Brand" : "Token"}
            </button>
          </div>
        </div>

        {/* Win Modal */}
        {hasWon && selectedItem && (
          <div className="absolute top-0 left-0 w-full h-full overflow-y-scroll bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
            {showConfetti && <Confetti />}
            <div className="bg-game-dark w-full max-w-sm rounded-3xl overflow-hidden border border-white/10">
              {/* Card Preview */}
              <div className="p-6 pb-4">
                {/* PUZZLE COMPLETED Header */}
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter leading-none mb-6">
                  PUZZLE
                  <br />
                  COMPLETED
                </h1>

                {/* Framed Image */}
                <div className="border border-white/30 p-4 mb-2">
                  <p className="text-center text-white font-bold tracking-[0.2em] text-sm mb-3 uppercase">
                    {selectedItem.name}
                  </p>
                  <img
                    src={selectedItem.imageUrl}
                    alt={selectedItem.name}
                    className="w-full aspect-square object-cover"
                  />
                  <p className="text-white/60 text-sm italic mt-3">Foto Game</p>
                </div>
              </div>

              {/* Stats */}
              <div className="border-t border-white/20">
                <div className="grid grid-cols-2 divide-x divide-white/20">
                  <div className="p-4 text-center">
                    <p className="text-white/60 text-sm font-bold tracking-wider">
                      MOVES
                    </p>
                    <p className="text-3xl font-black text-white">{moves}</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-white/60 text-sm font-bold tracking-wider">
                      TIME
                    </p>
                    <p className="text-3xl font-black text-white">
                      {formatTime(seconds)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={downloadVictoryCard}
                    disabled={isDownloading}
                    className="py-3 bg-white text-black font-bold rounded-xl 
                             hover:bg-white/90 transition-all text-sm
                             disabled:opacity-50"
                  >
                    {isDownloading ? "Saving..." : "⬇️ Save Card"}
                  </button>
                  <button
                    onClick={shareOnX}
                    className="py-3 bg-game-card text-white font-bold rounded-xl 
                             hover:bg-game-card/80 transition-all text-sm border border-white/10"
                  >
                    Share on X
                  </button>
                </div>
                <button
                  onClick={resetGame}
                  className="w-full py-4 bg-yellow-600 text-game-dark font-black rounded-xl 
                           hover:bg-yellow-600/90 transition-all"
                >
                  🎮 PLAY AGAIN
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Community Posts */}
        {posts.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-bold text-white mb-4">
              Community Posts
            </h3>
            <div className="space-y-3">
              {posts.map((p) => (
                <div
                  key={p.id}
                  className="bg-game-card rounded-xl p-4 border border-white/5"
                >
                  <p className="text-white text-sm">{p.text}</p>
                  <p className="text-game-muted text-xs mt-2">
                    {new Date(p.time).toLocaleString()}
                  </p>
                </div>
              ))}
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
        const bg = ["#00D9FF", "#FF3D8A", "#FFD93D", "#4DFFB8", "#A855F7"][
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
      `}</style>
    </div>
  );
};
