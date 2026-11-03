import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CellCoord, ElementPair, PuzzleDefinition, ThemeConfig } from '../types/game';
import { zenAudio } from '../audio/soundEngine';

interface GameBoardProps {
  puzzle: PuzzleDefinition;
  theme: ThemeConfig;
  paths: Record<string, CellCoord[]>;
  onPathsChange: (paths: Record<string, CellCoord[]>) => void;
  onPairComplete?: (pairId: string) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  puzzle,
  theme,
  paths,
  onPathsChange,
  onPairComplete,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [activePairId, setActivePairId] = useState<string | null>(null);
  const [boardSize, setBoardSize] = useState<number>(340);
  const isDraggingRef = useRef<boolean>(false);
  const activePairRef = useRef<string | null>(null);
  const currentPathsRef = useRef(paths);

  currentPathsRef.current = paths;
  activePairRef.current = activePairId;

  const gridSize = puzzle.gridSize;
  const cellSize = boardSize / gridSize;

  // Responsive board calculation for mobile phone viewports
  useEffect(() => {
    const updateDimensions = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Reserve space for top HUD (~140px) and bottom thumb controls (~120px)
      const maxH = vh - 260;
      const maxW = vw - 32;
      const target = Math.min(maxW, maxH, 460);
      setBoardSize(Math.max(280, Math.floor(target)));
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Helper to find if a cell has an endpoint
  const getEndpointAt = useCallback(
    (r: number, c: number): { pair: ElementPair; isStart: boolean } | null => {
      for (const pair of puzzle.pairs) {
        if (pair.start.r === r && pair.start.c === c) return { pair, isStart: true };
        if (pair.end.r === r && pair.end.c === c) return { pair, isStart: false };
      }
      return null;
    },
    [puzzle.pairs]
  );

  // Check which pair's path currently occupies this cell
  const getPathOwnerAt = useCallback(
    (r: number, c: number): { pairId: string; index: number } | null => {
      for (const [pairId, path] of Object.entries(currentPathsRef.current)) {
        const idx = path.findIndex(pt => pt.r === r && pt.c === c);
        if (idx !== -1) return { pairId, index: idx };
      }
      return null;
    },
    []
  );

  // Canvas drawing loop for smooth glowing paths
  const drawPaths = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = boardSize * dpr;
    canvas.height = boardSize * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, boardSize, boardSize);

    // Draw all paths
    puzzle.pairs.forEach((pair, pairIdx) => {
      const path = currentPathsRef.current[pair.id];
      if (!path || path.length < 1) return;

      const isCompleted =
        path.length >= 2 &&
        ((path[0].r === pair.start.r &&
          path[0].c === pair.start.c &&
          path[path.length - 1].r === pair.end.r &&
          path[path.length - 1].c === pair.end.c) ||
          (path[0].r === pair.end.r &&
            path[0].c === pair.end.c &&
            path[path.length - 1].r === pair.start.r &&
            path[path.length - 1].c === pair.start.c));

      ctx.save();
      ctx.lineWidth = Math.max(8, cellSize * 0.28);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Soft glow for dark themes
      if (theme.pathGlow) {
        ctx.shadowColor = pair.glowHex;
        ctx.shadowBlur = isCompleted ? 14 : 8;
      }

      ctx.strokeStyle = pair.colorHex;

      ctx.beginPath();
      const startX = path[0].c * cellSize + cellSize / 2;
      const startY = path[0].r * cellSize + cellSize / 2;
      ctx.moveTo(startX, startY);

      for (let i = 1; i < path.length; i++) {
        const nextX = path[i].c * cellSize + cellSize / 2;
        const nextY = path[i].r * cellSize + cellSize / 2;
        ctx.lineTo(nextX, nextY);
      }

      ctx.stroke();

      // Inner bright core
      ctx.lineWidth = Math.max(3, cellSize * 0.1);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.shadowBlur = 0;
      ctx.stroke();

      ctx.restore();
    });
  }, [boardSize, cellSize, puzzle.pairs, theme.pathGlow]);

  useEffect(() => {
    drawPaths();
  }, [drawPaths, paths]);

  // Touch and Mouse Coordinate conversion
  const getCellFromEvent = (clientX: number, clientY: number): CellCoord | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (x < 0 || x >= rect.width || y < 0 || y >= rect.height) return null;

    const c = Math.floor(x / cellSize);
    const r = Math.floor(y / cellSize);

    if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
      return { r, c };
    }
    return null;
  };

  const handlePointerDown = (clientX: number, clientY: number) => {
    const cell = getCellFromEvent(clientX, clientY);
    if (!cell) return;

    // Check if cell is an endpoint
    const endpoint = getEndpointAt(cell.r, cell.c);
    if (endpoint) {
      isDraggingRef.current = true;
      setActivePairId(endpoint.pair.id);
      activePairRef.current = endpoint.pair.id;

      // Start new path from this endpoint
      const nextPaths = {
        ...currentPathsRef.current,
        [endpoint.pair.id]: [cell],
      };
      onPathsChange(nextPaths);
      zenAudio.playStepChime(0);
      return;
    }

    // Check if tapping on an existing path
    const owner = getPathOwnerAt(cell.r, cell.c);
    if (owner) {
      isDraggingRef.current = true;
      setActivePairId(owner.pairId);
      activePairRef.current = owner.pairId;

      // Truncate path up to this point
      const currentPath = currentPathsRef.current[owner.pairId];
      const truncated = currentPath.slice(0, owner.index + 1);

      const nextPaths = {
        ...currentPathsRef.current,
        [owner.pairId]: truncated,
      };
      onPathsChange(nextPaths);
      zenAudio.playStepChime(owner.index);
    }
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current || !activePairRef.current) return;

    const cell = getCellFromEvent(clientX, clientY);
    if (!cell) return;

    const pairId = activePairRef.current;
    const pair = puzzle.pairs.find(p => p.id === pairId);
    if (!pair) return;

    const currentPath = currentPathsRef.current[pairId] || [];
    if (currentPath.length === 0) return;

    const last = currentPath[currentPath.length - 1];
    if (last.r === cell.r && last.c === cell.c) return; // same cell

    // Must be orthogonal neighbor (step distance == 1)
    const dist = Math.abs(cell.r - last.r) + Math.abs(cell.c - last.c);
    if (dist !== 1) return;

    // Check if already in this path (backtracking)
    const existingIndexInThisPath = currentPath.findIndex(pt => pt.r === cell.r && pt.c === cell.c);
    if (existingIndexInThisPath !== -1) {
      // User is moving back along the path; trim it
      const nextPath = currentPath.slice(0, existingIndexInThisPath + 1);
      const nextPaths = {
        ...currentPathsRef.current,
        [pairId]: nextPath,
      };
      onPathsChange(nextPaths);
      zenAudio.playStepChime(nextPath.length);
      return;
    }

    // Check if target is an endpoint of another pair
    const targetEndpoint = getEndpointAt(cell.r, cell.c);
    if (targetEndpoint && targetEndpoint.pair.id !== pairId) {
      // Cannot enter endpoint of other elements
      return;
    }

    // Check if target cell belongs to another pair's path
    const otherOwner = getPathOwnerAt(cell.r, cell.c);
    let nextPaths = { ...currentPathsRef.current };

    if (otherOwner && otherOwner.pairId !== pairId) {
      // Break the other path where it was intersected
      const otherPath = currentPathsRef.current[otherOwner.pairId];
      const trimmedOther = otherPath.slice(0, otherOwner.index);
      nextPaths[otherOwner.pairId] = trimmedOther;
    }

    // Append to current path
    const nextPath = [...currentPath, cell];
    nextPaths[pairId] = nextPath;
    onPathsChange(nextPaths);

    // Audio step chime
    zenAudio.playStepChime(nextPath.length);

    // Check if we just connected the matching target endpoint
    const isTargetStart = cell.r === pair.start.r && cell.c === pair.start.c;
    const isTargetEnd = cell.r === pair.end.r && cell.c === pair.end.c;

    if (isTargetStart || isTargetEnd) {
      isDraggingRef.current = false;
      setActivePairId(null);
      activePairRef.current = null;
      zenAudio.playPairConnected(puzzle.pairs.indexOf(pair));
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(15);
      }
      if (onPairComplete) {
        onPairComplete(pair.id);
      }
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    setActivePairId(null);
    activePairRef.current = null;
  };

  return (
    <div className="flex flex-col items-center justify-center relative touch-none select-none">
      <div
        ref={containerRef}
        style={{ width: boardSize, height: boardSize }}
        className={`relative ${theme.boardBg} border ${theme.cellBorder} rounded-2xl shadow-xl overflow-hidden`}
        onMouseDown={e => {
          e.preventDefault();
          handlePointerDown(e.clientX, e.clientY);
        }}
        onMouseMove={e => {
          e.preventDefault();
          handlePointerMove(e.clientX, e.clientY);
        }}
        onMouseUp={handlePointerUp}
        onTouchStart={e => {
          const touch = e.touches[0];
          handlePointerDown(touch.clientX, touch.clientY);
        }}
        onTouchMove={e => {
          const touch = e.touches[0];
          handlePointerMove(touch.clientX, touch.clientY);
        }}
        onTouchEnd={handlePointerUp}
      >
        {/* Stone / Ceramic grid cells */}
        <div
          className="absolute inset-0 grid"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: gridSize * gridSize }).map((_, i) => {
            const r = Math.floor(i / gridSize);
            const c = i % gridSize;
            return (
              <div
                key={`${r}-${c}`}
                className={`border-[0.5px] ${theme.cellBorder} ${theme.cellBg} flex items-center justify-center transition-colors`}
              >
                <div className="w-1 h-1 rounded-full bg-slate-500/20" />
              </div>
            );
          })}
        </div>

        {/* Canvas overlay for fluid lines */}
        <canvas
          ref={canvasRef}
          style={{ width: boardSize, height: boardSize }}
          className="absolute inset-0 pointer-events-none z-10"
        />

        {/* Element Nodes / Orbs */}
        {puzzle.pairs.map(pair => {
          const isCompleted =
            paths[pair.id] &&
            paths[pair.id].length >= 2 &&
            ((paths[pair.id][0].r === pair.start.r &&
              paths[pair.id][0].c === pair.start.c &&
              paths[pair.id][paths[pair.id].length - 1].r === pair.end.r &&
              paths[pair.id][paths[pair.id].length - 1].c === pair.end.c) ||
              (paths[pair.id][0].r === pair.end.r &&
                paths[pair.id][0].c === pair.end.c &&
                paths[pair.id][paths[pair.id].length - 1].r === pair.start.r &&
                paths[pair.id][paths[pair.id].length - 1].c === pair.start.c));

          return (
            <React.Fragment key={pair.id}>
              {/* Start Node */}
              <div
                style={{
                  top: pair.start.r * cellSize + cellSize / 2,
                  left: pair.start.c * cellSize + cellSize / 2,
                  width: cellSize * 0.72,
                  height: cellSize * 0.72,
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: pair.colorHex,
                  boxShadow: theme.pathGlow
                    ? `0 0 16px ${pair.glowHex}, inset 0 2px 4px rgba(255,255,255,0.4)`
                    : 'inset 0 1px 2px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.15)',
                }}
                className={`absolute z-20 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-200 active:scale-95 ${
                  isCompleted ? 'scale-100 ring-2 ring-white/50' : 'scale-95 animate-pulse'
                }`}
                title={pair.label}
              >
                <span className="text-white text-base md:text-lg font-medium drop-shadow-sm select-none">
                  {pair.symbol}
                </span>
              </div>

              {/* End Node */}
              <div
                style={{
                  top: pair.end.r * cellSize + cellSize / 2,
                  left: pair.end.c * cellSize + cellSize / 2,
                  width: cellSize * 0.72,
                  height: cellSize * 0.72,
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: pair.colorHex,
                  boxShadow: theme.pathGlow
                    ? `0 0 16px ${pair.glowHex}, inset 0 2px 4px rgba(255,255,255,0.4)`
                    : 'inset 0 1px 2px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.15)',
                }}
                className={`absolute z-20 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-200 active:scale-95 ${
                  isCompleted ? 'scale-100 ring-2 ring-white/50' : 'scale-95 animate-pulse'
                }`}
                title={pair.label}
              >
                <span className="text-white text-base md:text-lg font-medium drop-shadow-sm select-none">
                  {pair.symbol}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
